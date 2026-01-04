"use strict";

import { Database } from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
const sqlite3 = require("sqlite3");

let env = process.env.NODE_ENV?.trim() ?? "development";

const isTestEnv =
    typeof process.env.NODE_ENV === "string" &&
    process.env.NODE_ENV.startsWith("test");

const useMemoryDb =
    isTestEnv && process.env.TEST_DB_IN_MEMORY === "true";

const defaultPath = useMemoryDb
    ? ":memory:"
    : env === "test"
        ? path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )
        : path.resolve(__dirname, "..", "..", "..", "database", "database.db");

const dbFilePath = process.env.DB_PATH || defaultPath;

let resolveDbReady!: () => void;
export const dbReady: Promise<void> = new Promise((res) => {
    resolveDbReady = res;
});

let db: Database;

db = new sqlite3.Database(dbFilePath, (err: Error | null) => {
    if (err) {
        throw err;
    }

    // 🔑 CRITICAL: serialize ALL operations
    db.serialize(() => {
        try {
            db.run("PRAGMA foreign_keys = ON");
            db.run("PRAGMA busy_timeout = 5000");

            // WAL breaks in-memory teardown → disable for memory DB
            if (!useMemoryDb) {
                db.run("PRAGMA journal_mode = WAL");
            }
        } catch {}
    });

    resolveDbReady();
});

function initializeDb(dbInstance: Database) {
    const candidates: string[] = [];

    if (process.env.DB_PATH) {
        candidates.push("/usr/src/app/database");
    }

    candidates.push(path.resolve(__dirname, "..", "..", "..", "database"));
    candidates.push("/usr/src/app/sql");

    let sqlDir: string | null = null;

    for (const cand of candidates) {
        if (
            fs.existsSync(path.join(cand, "tables_DDL.sql")) &&
            fs.existsSync(path.join(cand, "tables_default_values.sql"))
        ) {
            sqlDir = cand;
            break;
        }
    }

    if (!sqlDir) {
        sqlDir = path.resolve(__dirname, "..", "..", "..", "database");
    }

    try {
        const ddlSQL = fs.readFileSync(
            path.join(sqlDir, "tables_DDL.sql"),
            "utf8"
        );
        const defaultSQL = fs.readFileSync(
            path.join(sqlDir, "tables_default_values.sql"),
            "utf8"
        );

        const cleanedDDL = ddlSQL.replace(
            /PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi,
            ""
        );

        const finalDDL = `
      PRAGMA foreign_keys = OFF;
      ${cleanedDDL}
      PRAGMA foreign_keys = ON;
    `;

        dbInstance.serialize(() => {
            dbInstance.exec(finalDDL, () => {
                dbInstance.exec(defaultSQL);
            });
        });
    } catch (err) {
        console.error(err);
    }
}

// 🔑 SINGLE, SAFE CLOSE
export function closeDb(): Promise<void> {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.close(() => resolve());
        });
    });
}

// 🔑 ABSOLUTE GUARANTEE
process.on("exit", () => {
    try {
        db.close();
    } catch {}
});

export default db;
