"use strict"

import { Database } from "sqlite3"
import path from "path"
import fs from "fs"
import os from "os"

const sqlite = require("sqlite3")

const env = process.env.NODE_ENV?.trim() ?? "development"

const isTestEnv = env === "test"

const shouldAutoInitDb =
    !isTestEnv || process.env.ALLOW_DB_AUTO_INIT === "true"

const useMemoryDb =
    isTestEnv && process.env.TEST_DB_IN_MEMORY === "true"

const defaultPath = useMemoryDb
    ? ":memory:"
    : isTestEnv
        ? path.join(
            os.tmpdir(),
            `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
        )
        : path.resolve(__dirname, "..", "..", "..", "database", "database.db")

const dbFilePath = process.env.DB_PATH || defaultPath

let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise(res => {
    resolveDbReady = res
})

let db: Database

const openFlagsAvailable =
    typeof sqlite.OPEN_READWRITE === "number" &&
    typeof sqlite.OPEN_CREATE === "number"

if (openFlagsAvailable) {
    db = new sqlite.Database(
        dbFilePath,
        sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
        onOpen
    )
} else {
    db = new sqlite.Database(dbFilePath, onOpen)
}

function onOpen(this: any, err: Error | null) {
    if (err) {
        throw err
    }

    const dbInstance = this ?? db

    if (!dbInstance) {
        resolveDbReady()
        return
    }

    try {
        dbInstance.run("PRAGMA foreign_keys = ON")
        dbInstance.run("PRAGMA journal_mode = WAL")
        dbInstance.run("PRAGMA busy_timeout = 5000")
    } catch {}

    if (!shouldAutoInitDb || typeof dbInstance.get !== "function") {
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
    try {
        const sqlDir = path.resolve(__dirname, "..", "..", "..", "database")

        const ddlSQL = fs.readFileSync(
            path.join(sqlDir, "tables_DDL.sql"),
            "utf8"
        )
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

export default db
