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
    isTestEnv && process.env.TEST_DB_IN_MEMORY === 'true'

const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'))

const dbFilePath = process.env.DB_PATH || defaultPath

let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res })

let db: Database

db = new sqlite.Database(
    dbFilePath,
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
    onOpen
) as Database

function sqlFilesExist(): boolean {
    const candidates = [
        path.resolve(__dirname, '..', '..', '..', 'database'),
        '/usr/src/app/database',
        '/usr/src/app/sql'
    ]

    return candidates.some(dir =>
        fs.existsSync(path.join(dir, 'tables_DDL.sql')) &&
        fs.existsSync(path.join(dir, 'tables_default_values.sql'))
    )
}

function onOpen(this: any, err: Error | null) {
    if (err) throw err

    const dbInstance: any = this ?? db

    dbInstance.run("PRAGMA foreign_keys = ON")
    dbInstance.run("PRAGMA journal_mode = WAL")
    dbInstance.run("PRAGMA busy_timeout = 5000")

    dbInstance.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        (_err: any, row: any) => {
            if (row) {
                resolveDbReady()
            } else {
                initializeDb(dbInstance)
            }
        }
    )
}

export function initializeDb(dbInstance: any) {
    const candidates = [
        path.resolve(__dirname, '..', '..', '..', 'database'),
        '/usr/src/app/database',
        '/usr/src/app/sql'
    ]

    let sqlDir: string | null = null

    for (const cand of candidates) {
        if (
            fs.existsSync(path.join(cand, 'tables_DDL.sql')) &&
            fs.existsSync(path.join(cand, 'tables_default_values.sql'))
        ) {
            sqlDir = cand
            break
        }
    }

    if (!sqlDir) {
        resolveDbReady()
        return
    }

    const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), 'utf8')
    const defaultSQL = fs.readFileSync(
        path.join(sqlDir, 'tables_default_values.sql'),
        'utf8'
    )

    const cleanedDDL = ddlSQL.replace(
        /PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi,
        ''
    )

    const finalDDL =
        `PRAGMA foreign_keys = OFF;\n${cleanedDDL}\nPRAGMA foreign_keys = ON;`

    dbInstance.exec(finalDDL, () => {
        dbInstance.exec(defaultSQL, () => {
            resolveDbReady()
        })
    })
}

export default db