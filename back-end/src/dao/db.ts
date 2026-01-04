"use strict";

import { Database } from "sqlite3";
import path from "path";
import os from "os";
const sqlite3 = require("sqlite3");

const env = process.env.NODE_ENV ?? "development";

const isTest = env.startsWith("test");
const useMemory = isTest && process.env.TEST_DB_IN_MEMORY === "true";

const defaultPath = useMemory
    ? ":memory:"
    : env === "test"
        ? path.join(os.tmpdir(), `testdb-${process.pid}.db`)
        : path.resolve(__dirname, "..", "..", "..", "database", "database.db");

const dbPath = process.env.DB_PATH || defaultPath;

let resolveReady!: () => void;
export const dbReady = new Promise<void>(res => (resolveReady = res));

export const db: Database = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err: Error | null) => {
        if (err) throw err;

        try {
            db.run("PRAGMA foreign_keys = ON");
            db.run("PRAGMA journal_mode = WAL");
            db.run("PRAGMA busy_timeout = 5000");
        } catch {
            // ignored for mocks
        }

        resolveReady();
    }
);

export default db;
