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

let resolveDbReady: () => void
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

function onOpen(err: Error | null) {
    if (err) {
        throw err
    }

    try {
        db.run("PRAGMA foreign_keys = ON")
        db.run("PRAGMA journal_mode = WAL")
        db.run("PRAGMA busy_timeout = 5000")
    } catch {}

    const skipDbInit = process.env.SKIP_DB_INIT === 'true'

    // 🔑 Unit-test safety: mocked DB has no get()
    if (typeof (db as any).get !== 'function') {
        resolveDbReady()
        return
    }

    db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        (_err, row) => {
            if (!row) {
                initializeDb()
            } else if (!skipDbInit) {
                initializeDb()
            } else {
                resolveDbReady()
            }
        }
    )
}

function initializeDb() {
    const candidates = []

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

        db.exec(finalDDL, () => {
            db.exec(defaultSQL, () => {
                resolveDbReady()
            })
        })
    } catch (err) {
        console.error(err)
        resolveDbReady()
    }
}

export default db;
