"use strict"

import { Database } from "sqlite3";
import path from 'path'
import fs from 'fs';
import os from 'os'
const sqlite = require("sqlite3")

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"
const isTestEnv = typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV.startsWith('test');
const useMemoryDb = isTestEnv && process.env.TEST_DB_IN_MEMORY === 'true';

const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`)
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'));

const dbFilePath = process.env.DB_PATH || defaultPath;

// Signal for tests to wait until DB is ready
let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res })

// Use the global object to prevent multiple initializations across Jest module resets
const GLOBAL_INIT_KEY = Symbol.for('app.db.init_started');
const globalObj = global as any;

const db: Database = new sqlite.Database(dbFilePath, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, onOpen);

function onOpen(this: any, err: Error | null) {
    if (err) {
        console.error("Failed to open database:", err);
        return;
    }
    const dbInstance: any = this ?? db;

    // Return early if another instance is already initializing this process's DB
    if (globalObj[GLOBAL_INIT_KEY]) {
        // If already initialized once, resolve immediately
        if (globalObj[GLOBAL_INIT_KEY] === 'done') resolveDbReady();
        return;
    }
    globalObj[GLOBAL_INIT_KEY] = 'in_progress';

    dbInstance.serialize(() => {
        dbInstance.run("PRAGMA foreign_keys = ON");
        dbInstance.run("PRAGMA journal_mode = WAL");

        dbInstance.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
            [],
            (err: any, row: any) => {
                if (!row) {
                    initializeDb(dbInstance);
                } else {
                    globalObj[GLOBAL_INIT_KEY] = 'done';
                    resolveDbReady();
                }
            }
        );
    });
}

export function initializeDb(dbInstance: any) {
    const sqlDir = path.resolve(__dirname, '..', '..', '..', 'database');
    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), 'utf8');
        const defaultSQL = fs.readFileSync(path.join(sqlDir, 'tables_default_values.sql'), 'utf8');

        dbInstance.serialize(() => {
            dbInstance.exec("PRAGMA foreign_keys = OFF;");
            dbInstance.exec(ddlSQL);
            dbInstance.exec(defaultSQL);
            dbInstance.exec("PRAGMA foreign_keys = ON;", (err: any) => {
                if (err) console.error("DDL Execution Error:", err);
                globalObj[GLOBAL_INIT_KEY] = 'done';
                resolveDbReady();
            });
        });
    } catch (err) {
        console.error("DB Initialization File Error:", err);
        globalObj[GLOBAL_INIT_KEY] = 'done';
        resolveDbReady();
    }
}

export default db;