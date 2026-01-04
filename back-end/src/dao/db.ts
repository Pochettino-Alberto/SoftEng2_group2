"use strict"

import { Database } from "sqlite3";
import path from 'path'
import fs from 'fs';
import os from 'os'
const sqlite = require("sqlite3")

// Environment detection
const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"
const isTestEnv = typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV.startsWith('test');
const useMemoryDb = isTestEnv && (process.env.TEST_DB_IN_MEMORY === 'true');

// Determine path: E2E uses unique files per worker, Unit/Integration can use memory
const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`)
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'));

const dbFilePath = process.env.DB_PATH || defaultPath;

// Signal for tests to wait until DB is ready
let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res })

const openMode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
const db: Database = new sqlite.Database(dbFilePath, openMode, onOpen);

function onOpen(this: any, err: Error | null) {
    if (err) throw err
    const dbInstance: any = this ?? db

    // Basic SQLite optimization
    try {
        dbInstance.run("PRAGMA foreign_keys = ON")
        dbInstance.run("PRAGMA journal_mode = WAL")
    } catch {}

    // Check if initialization is needed
    dbInstance.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        (err: any, row: any) => {
            if (!row) {
                initializeDb(dbInstance)
            } else {
                resolveDbReady()
            }
        }
    )
}

export function initializeDb(dbInstance: any) {
    const sqlDir = path.resolve(__dirname, '..', '..', '..', 'database');
    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), 'utf8')
        const defaultSQL = fs.readFileSync(path.join(sqlDir, 'tables_default_values.sql'), 'utf8')

        dbInstance.serialize(() => {
            dbInstance.exec("PRAGMA foreign_keys = OFF;")
            dbInstance.exec(ddlSQL)
            dbInstance.exec(defaultSQL)
            dbInstance.exec("PRAGMA foreign_keys = ON;", () => resolveDbReady())
        })
    } catch (err) {
        console.error("DB Init Error:", err)
        resolveDbReady()
    }
}

export default db;