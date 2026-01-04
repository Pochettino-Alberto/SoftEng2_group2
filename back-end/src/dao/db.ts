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

        const cleanDDL = ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');
        const cleanDefault = defaultSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');

        dbInstance.serialize(() => {
            // FIXED: Added error callbacks to every call to prevent unhandled 'error' events
            dbInstance.exec("PRAGMA foreign_keys = OFF;", (err) => { if (err) console.error("DB Init FK OFF Error:", err); });
            dbInstance.exec(cleanDDL, (err) => { if (err) console.error("DB Init DDL Error:", err); });
            dbInstance.exec(cleanDefault, (err) => { if (err) console.error("DB Init Default Data Error (Check your SQL values):", err); });
            dbInstance.exec("PRAGMA foreign_keys = ON;", (err) => {
                if (err) console.error("DB Init FK ON Error:", err);
                globalObj[GLOBAL_INIT_STARTED] = 'done';
                resolveGlobalReady();
            });
        });
    } catch (err) {
        console.error("DDL File Access Error:", err);
        globalObj[GLOBAL_INIT_STARTED] = 'done';
        resolveGlobalReady();
    }
}

function onOpen(this: Database, err: Error | null) {
    if (err) {
        console.error("SQLite Open Error:", err);
        return;
    }
    const dbInstance = this;

    // FIXED: Instance-level error listener prevents process crash on any unhandled DB error
    dbInstance.on('error', (err) => {
        console.error("Database Instance emitted unhandled error:", err.message);
    });

    if (globalObj[GLOBAL_INIT_STARTED]) {
        if (globalObj[GLOBAL_INIT_STARTED] === 'done') resolveGlobalReady();
        return;
    }
    globalObj[GLOBAL_INIT_STARTED] = 'in_progress';

    dbInstance.serialize(() => {
        dbInstance.run("PRAGMA foreign_keys = ON");
        dbInstance.run("PRAGMA journal_mode = WAL");
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