"use strict"

import { Database } from "sqlite3";
import path from 'path'
import fs from 'fs';
import os from 'os'
const sqlite = require("sqlite3")

let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"

const isTestEnv =
    typeof process.env.NODE_ENV === 'string' &&
    process.env.NODE_ENV.startsWith('test');

const isIntegrationTest =
    process.env.NODE_ENV === 'test' &&
    (process.env.TEST_DB_IN_MEMORY === 'true' ||
        process.env.CI_USE_FILE_DB === 'true');

const useMemoryDb =
    isTestEnv && process.env.TEST_DB_IN_MEMORY === 'true';

const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'));

const dbFilePath = process.env.DB_PATH || defaultPath;

let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res })

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
    if (err) {
        throw err
    }

    const dbInstance: any = this ?? db

    if (!dbInstance) {
        resolveDbReady()
        return
    }

    try {
        dbInstance.run("PRAGMA foreign_keys = ON")
        dbInstance.run("PRAGMA journal_mode = WAL")
        dbInstance.run("PRAGMA busy_timeout = 5000")
    } catch {}

    if (isIntegrationTest && sqlFilesExist()) {
        resolveDbReady()
        return
    }

    if (typeof dbInstance.get !== 'function') {
        resolveDbReady()
        return
    }

    dbInstance.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        () => {
            initializeDb(dbInstance)
        }
    )
}

export function initializeDb(dbInstance: any) {
    const candidates: string[] = []

    if (process.env.DB_PATH) {
        candidates.push('/usr/src/app/database')
    }

    candidates.push(path.resolve(__dirname, '..', '..', '..', 'database'))
    candidates.push('/usr/src/app/sql')

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
        sqlDir = path.resolve(__dirname, '..', '..', '..', 'database')
    }

    try {
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
    } catch (err) {
        console.error(err)
        resolveDbReady()
    }
}

export default db;
