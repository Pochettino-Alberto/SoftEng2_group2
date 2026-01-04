"use strict"

import { Database } from "sqlite3";
import path from 'path';
import fs from 'fs';
import os from 'os';
const sqlite = require("sqlite3");

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";
const isTestEnv = typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV.startsWith('test');
const useMemoryDb = isTestEnv && process.env.TEST_DB_IN_MEMORY === 'true';

const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`)
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'));

const dbFilePath = process.env.DB_PATH || defaultPath;

// --- Global Readiness Synchronization ---
const GLOBAL_READY_KEY = Symbol.for('app.db.ready_promise');
const GLOBAL_INIT_STARTED = Symbol.for('app.db.init_started');
const globalObj = global as any;

if (!globalObj[GLOBAL_READY_KEY]) {
    let resolver: () => void;
    globalObj[GLOBAL_READY_KEY] = new Promise<void>((res) => { resolver = res; });
    (globalObj[GLOBAL_READY_KEY] as any)._resolve = resolver!;
}

export const dbReady: Promise<void> = globalObj[GLOBAL_READY_KEY];

const resolveGlobalReady = () => {
    if (globalObj[GLOBAL_READY_KEY] && (globalObj[GLOBAL_READY_KEY] as any)._resolve) {
        (globalObj[GLOBAL_READY_KEY] as any)._resolve();
    }
};

/**
 * Executes DDL and default values scripts.
 */
export function initializeDb(dbInstance: Database) {
    const sqlDir = path.resolve(__dirname, '..', '..', '..', 'database');
    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), 'utf8');
        const defaultSQL = fs.readFileSync(path.join(sqlDir, 'tables_default_values.sql'), 'utf8');

        // Strip internal PRAGMAs to prevent conflicts during batch execution
        const cleanDDL = ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');
        const cleanDefault = defaultSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');

        dbInstance.serialize(() => {
            // Provide callbacks to every call to prevent unhandled 'error' events
            dbInstance.exec("PRAGMA foreign_keys = OFF;", (err) => { if (err) console.error("FK OFF Error:", err.message); });
            dbInstance.exec(cleanDDL, (err) => { if (err) console.error("DDL Error:", err.message); });
            dbInstance.exec(cleanDefault, (err) => { if (err) console.error("Seed Data Error:", err.message); });
            dbInstance.exec("PRAGMA foreign_keys = ON;", (err) => {
                if (err) console.error("FK ON Error:", err.message);
                globalObj[GLOBAL_INIT_STARTED] = 'done';
                resolveGlobalReady();
            });
        });
    } catch (err) {
        console.error("Database SQL Files missing or unreadable:", err);
        globalObj[GLOBAL_INIT_STARTED] = 'done';
        resolveGlobalReady();
    }
}

function onOpen(this: Database, err: Error | null) {
    if (err) {
        console.error("SQLite Connection Error:", err);
        return;
    }
    const dbInstance = this;

    // Prevent process crash on any unhandled DB error (e.g. Constraint violations)
    dbInstance.on('error', (dbErr) => {
        console.error("Database emitted error event:", dbErr.message);
    });

    if (globalObj[GLOBAL_INIT_STARTED]) {
        if (globalObj[GLOBAL_INIT_STARTED] === 'done') resolveGlobalReady();
        return;
    }
    globalObj[GLOBAL_INIT_STARTED] = 'in_progress';

    dbInstance.serialize(() => {
        dbInstance.run("PRAGMA foreign_keys = ON", (err) => { if (err) console.error(err); });
        dbInstance.run("PRAGMA journal_mode = WAL", (err) => { if (err) console.error(err); });
        dbInstance.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
            [],
            (err, row) => {
                if (!row) {
                    initializeDb(dbInstance);
                } else {
                    globalObj[GLOBAL_INIT_STARTED] = 'done';
                    resolveGlobalReady();
                }
            }
        );
    });
}

const db: Database = new sqlite.Database(
    dbFilePath,
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
    onOpen
);

export default db;