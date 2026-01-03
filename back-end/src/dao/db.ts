"use strict"

import { Database } from "sqlite3"
import path from 'path'
import fs from 'fs'
import os from 'os'
const sqlite = require("sqlite3")

let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"

const isTestEnv =
    typeof process.env.NODE_ENV === 'string' &&
    process.env.NODE_ENV.startsWith('test')

const useMemoryDb =
    isTestEnv &&
    (process.env.TEST_DB_IN_MEMORY === 'true' ||
        process.env.TEST_DB_IN_MEMORY === '1')

const isIntegrationTest =
    process.env.NODE_ENV === 'test' &&
    (process.env.TEST_DB_IN_MEMORY === 'true' ||
        process.env.CI_USE_FILE_DB === 'true')

function log(...args: any[]) {
    if (!isTestEnv) console.log(...args)
}
function err(...args: any[]) {
    if (!isTestEnv) console.error(...args)
}

const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'))

const dbFilePath = process.env.DB_PATH || defaultPath

const needsInitialization = useMemoryDb
    ? true
    : (env === 'test' ? false : !fs.existsSync(dbFilePath))

let resolveDbReady!: () => void
let dbReadyResolved = false

export const dbReady: Promise<void> = new Promise((res) => {
    resolveDbReady = () => {
        if (!dbReadyResolved) {
            dbReadyResolved = true
            res()
        }
    }
})

const hasOpenFlags =
    typeof sqlite.OPEN_READWRITE === 'number' &&
    typeof sqlite.OPEN_CREATE === 'number'

let db: Database

if (hasOpenFlags) {
    const openMode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
    db = new sqlite.Database(dbFilePath, openMode, onOpen) as Database
} else {
    db = new sqlite.Database(dbFilePath, onOpen) as Database
}

function onOpen(errOpen: Error | null) {
    if (errOpen) {
        err("Error opening database:", errOpen.message)
        throw errOpen
    }

    try {
        db.run("PRAGMA foreign_keys = ON")
        db.run("PRAGMA journal_mode = WAL")
        db.run("PRAGMA busy_timeout = 5000")
    } catch {}

    if (!isTestEnv) {
        log(`Connected to database: ${dbFilePath}`)
    }

    const dbPathLooksLikeRepo =
        process.env.CI_USE_FILE_DB === 'true' ||
        (process.env.DB_PATH && process.env.DB_PATH.includes(path.join('database')))

    let shouldInitialize: boolean

    if (useMemoryDb) {
        shouldInitialize = true
    } else if (env === 'test') {
        shouldInitialize = !dbPathLooksLikeRepo && !fs.existsSync(dbFilePath)
    } else {
        shouldInitialize = !fs.existsSync(dbFilePath)
    }

    if (shouldInitialize && !isIntegrationTest) {
        initializeDb()
    } else {
        resolveDbReady()
    }
}

function initializeDb() {
    const candidates: string[] = []

    if (process.env.DB_PATH) {
        candidates.push('/usr/src/app/database')
    }

    candidates.push(path.resolve(__dirname, '..', '..', '..', 'database'))
    candidates.push('/usr/src/app/sql')

    let sqlDir: string | null = null

    log("🔍 Searching for SQL files in candidates:", candidates)

    for (const cand of candidates) {
        try {
            const ddlExists = fs.existsSync(path.join(cand, 'tables_DDL.sql'))
            const defaultExists = fs.existsSync(path.join(cand, 'tables_default_values.sql'))
            log(`Checking ${cand}: DDL=${ddlExists}, Default=${defaultExists}`)

            if (ddlExists && defaultExists) {
                sqlDir = cand
                log("✅ Found SQL files in:", sqlDir)
                break
            }
        } catch {}
    }

    if (!sqlDir) {
        err("⚠️ Could not find SQL files in any candidate path. Fallback to repo location.")
        sqlDir = path.resolve(__dirname, '..', '..', '..', 'database')
    }

    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), "utf8")
        const defaultSQL = fs.readFileSync(
            path.join(sqlDir, 'tables_default_values.sql'),
            "utf8"
        )

        const cleanedDDL =
            ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '')

        const finalDDL = `
PRAGMA foreign_keys = OFF;
${cleanedDDL}
PRAGMA foreign_keys = ON;
`

        db.exec(finalDDL, (errDDL) => {
            if (errDDL) {
                err("Error executing DDL script:", errDDL.message)
                resolveDbReady()
                return
            }

            db.exec(defaultSQL, (errDefaults) => {
                if (errDefaults) {
                    err("❌ Error executing default values script:", errDefaults.message)
                }
                resolveDbReady()
            })
        })
    } catch (e: any) {
        err("❌ Failed to read SQL files for initialization:", e.message)
        resolveDbReady()
    }
}

export default db
