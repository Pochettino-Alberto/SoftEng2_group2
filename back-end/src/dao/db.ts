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

let resolveDbReady!: () => void;
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res; });

const GLOBAL_INIT_KEY = Symbol.for('app.db.init_started');
const globalObj = global as any;

/**
 * Executes DDL and default values scripts with Foreign Keys temporarily disabled.
 */
export function initializeDb(dbInstance: Database) {
    const sqlDir = path.resolve(__dirname, '..', '..', '..', 'database');
    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, 'tables_DDL.sql'), 'utf8');
        const defaultSQL = fs.readFileSync(path.join(sqlDir, 'tables_default_values.sql'), 'utf8');

        // Remove any PRAGMA foreign_keys commands from the SQL files to prevent conflicts
        const cleanDDL = ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');
        const cleanDefault = defaultSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');

        dbInstance.serialize(() => {
            dbInstance.exec("PRAGMA foreign_keys = OFF;");
            dbInstance.exec(cleanDDL);
            dbInstance.exec(cleanDefault);
            dbInstance.exec("PRAGMA foreign_keys = ON;", (err) => {
                if (err) console.error("Initialization SQL Error:", err);
                globalObj[GLOBAL_INIT_KEY] = 'done';
                resolveDbReady();
            });
        });
    } catch (err) {
        console.error("Initialization File Error:", err);
        globalObj[GLOBAL_INIT_KEY] = 'done';
        resolveDbReady();
    }
}

function onOpen(this: Database, err: Error | null) {
    if (err) {
        console.error("Failed to open database:", err);
        return;
    }
    const dbInstance = this;

    if (globalObj[GLOBAL_INIT_KEY]) {
        if (globalObj[GLOBAL_INIT_KEY] === 'done') resolveDbReady();
        return;
    }
    globalObj[GLOBAL_INIT_KEY] = 'in_progress';

    dbInstance.serialize(() => {
        // Prepare the environment
        dbInstance.run("PRAGMA foreign_keys = ON");
        dbInstance.run("PRAGMA journal_mode = WAL");

        // Check if we need to run scripts
        dbInstance.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
            [],
            (err, row) => {
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

const db: Database = new sqlite.Database(
    dbFilePath,
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
    onOpen
);

export default db;