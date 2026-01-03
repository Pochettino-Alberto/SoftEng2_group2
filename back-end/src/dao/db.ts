"use strict"

import { Database } from "sqlite3"
import path from "path"
import fs from "fs"
import os from "os"
const sqlite = require("sqlite3")

const isTestEnv =
    typeof process.env.NODE_ENV === "string" &&
    process.env.NODE_ENV.startsWith("test")

const useMemoryDb =
    isTestEnv && process.env.TEST_DB_IN_MEMORY === "true"

const dbFilePath = useMemoryDb
    ? ":memory:"
    : path.join(
        os.tmpdir(),
        `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
    )

let resolveDbReady!: () => void
export const dbReady: Promise<void> = new Promise(res => {
    resolveDbReady = res
})

let db: Database

function onOpen(this: any, err: Error | null) {
    if (err) throw err

    const dbInstance: any = this ?? db

    dbInstance.run("PRAGMA foreign_keys = ON")

    dbInstance.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
        [],
        (_: any, row: any) => {
            if (row) {
                resolveDbReady()
            } else {
                initializeDb(dbInstance)
            }
        }
    )
}

/* 🔴 KEY FIX: constructor compatibility */
if (isTestEnv) {
    db = new sqlite.Database(dbFilePath, onOpen) as Database
} else {
    db = new sqlite.Database(
        dbFilePath,
        sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
        onOpen
    ) as Database
}

function initializeDb(dbInstance: any) {
    const sqlDir = path.resolve(__dirname, "..", "..", "..", "database")

    if (!fs.existsSync(path.join(sqlDir, "tables_DDL.sql"))) {
        resolveDbReady()
        return
    }

    const ddl = fs.readFileSync(
        path.join(sqlDir, "tables_DDL.sql"),
        "utf8"
    )

    const defaults = fs.readFileSync(
        path.join(sqlDir, "tables_default_values.sql"),
        "utf8"
    )

    dbInstance.exec(ddl, () => {
        dbInstance.exec(defaults, () => {
            resolveDbReady()
        })
    })
}

export default db