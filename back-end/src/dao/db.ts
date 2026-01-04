"use strict"

import { Database } from "sqlite3"
import path from "path"
import fs from "fs"
import os from "os"

const sqlite = require("sqlite3")

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"

const isTestEnv =
    typeof process.env.NODE_ENV === "string" &&
    process.env.NODE_ENV.startsWith("test")

const isE2E = process.env.TEST_DB_E2E === "true"

const useMemoryDb =
    isTestEnv &&
    process.env.TEST_DB_IN_MEMORY === "true" &&
    !isE2E

const defaultPath = useMemoryDb
    ? ":memory:"
    : isE2E
        ? path.join(os.tmpdir(), "participium-e2e.db")
        : env === "test"
            ? path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`)
            : path.resolve(__dirname, "..", "..", "..", "database", "database.db")

const dbFilePath = process.env.DB_PATH || defaultPath

let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise(res => { resolveDbReady = res })

const hasOpenFlags =
    typeof sqlite.OPEN_READWRITE === "number" &&
    typeof sqlite.OPEN_CREATE === "number"

let db: Database

if (hasOpenFlags) {
    const openMode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
    db = new sqlite.Database(dbFilePath, openMode, onOpen) as Database
} else {
    db = new sqlite.Database(dbFilePath, onOpen) as Database
}

db.on("error", () => {})

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

    if (typeof dbInstance.get !== "function") {
        resolveDbReady()
        return
    }

    dbInstance.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        (_err: any, row: any) => {
            if (!row) {
                initializeDb(dbInstance)
            } else {
                resolveDbReady()
            }
        }
    )
}

function initializeDb(dbInstance: any) {
    const candidates: string[] = []

    if (process.env.DB_PATH) {
        candidates.push("/usr/src/app/database")
    }

    candidates.push(path.resolve(__dirname, "..", "..", "..", "database"))
    candidates.push("/usr/src/app/sql")

    let sqlDir: string | null = null

    for (const cand of candidates) {
        if (
            fs.existsSync(path.join(cand, "tables_DDL.sql")) &&
            fs.existsSync(path.join(cand, "tables_default_values.sql"))
        ) {
            sqlDir = cand
            break
        }
    }

    if (!sqlDir) {
        sqlDir = path.resolve(__dirname, "..", "..", "..", "database")
    }

    try {
        const ddlSQL = fs.readFileSync(path.join(sqlDir, "tables_DDL.sql"), "utf8")
        const defaultSQL = fs.readFileSync(
            path.join(sqlDir, "tables_default_values.sql"),
            "utf8"
        )

        const cleanedDDL = ddlSQL.replace(
            /PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi,
            ""
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

export const closeDb = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            // 🔑 REQUIRED for WAL mode
            db.exec("PRAGMA wal_checkpoint(TRUNCATE);", err => {
                if (err) {
                    // even if checkpoint fails, still try to close
                    db.close(closeErr => {
                        if (closeErr) reject(closeErr)
                        else resolve()
                    })
                } else {
                    db.close(closeErr => {
                        if (closeErr) reject(closeErr)
                        else resolve()
                    })
                }
            })
        } catch (e) {
            // last-resort close
            db.close(() => resolve())
        }
    })
}


export default db
