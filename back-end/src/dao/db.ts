"use strict"

/**
 * Example of a database connection if using SQLite3.
 */

import { Database } from "sqlite3";
import path from 'path'
import fs from 'fs';
import os from 'os'
const sqlite = require("sqlite3")

// The environment variable is used to determine which database to use.
// If the environment variable is not set, the development database is used.
// A separate database needs to be used for testing to avoid corrupting the development database and ensuring a clean state for each test.

//The environment variable is set in the package.json file in the test script.
let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"

// Allow running tests against an in-memory DB for speed. Enable by setting
// the env var `TEST_DB_IN_MEMORY=true` when running tests.
const useMemoryDb = env === 'test' && (process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1')

// The database file path is determined based on the environment variable.
// Use absolute path resolution so tests and helpers that create the test DB
// (located at <repo root>/database/testdb.db) point to the same file.
const defaultPath = useMemoryDb
    ? ':memory:'
    : (env === "test"
        ? // Use a per-worker temp DB when running tests to avoid collisions
          path.join(
              os.tmpdir(),
              `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`
          )
        : path.resolve(__dirname, '..', '..', '..', 'database', 'database.db'));

// if docker is used use the DB_PATH environment variable (defined in docker-compose), otherwise use default one
const dbFilePath = process.env.DB_PATH || defaultPath;

// check if the db file exists before starting the connection to the db
const needsInitialization = useMemoryDb ? true : !fs.existsSync(dbFilePath);

// --- 3. connection ---
// Export a promise `dbReady` that resolves when the DB is fully initialized
let resolveDbReady: () => void
export const dbReady: Promise<void> = new Promise((res) => { resolveDbReady = res })

// Ensure DB opens in read-write/create mode and configure pragmas to reduce locking
const hasOpenFlags = typeof sqlite.OPEN_READWRITE === 'number' && typeof sqlite.OPEN_CREATE === 'number'
let db: Database
if (hasOpenFlags) {
    const openMode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
    db = new sqlite.Database(dbFilePath, openMode, (err: Error | null) => {
        onOpen(err)
    }) as Database
} else {
    // When sqlite is mocked (unit tests), the constructor signature may be (filePath, cb)
    db = new sqlite.Database(dbFilePath, (err: Error | null) => {
        onOpen(err)
    }) as Database
}

function onOpen(err: Error | null) {
    if (err) {
        console.error("Error opening database:", err.message);
        throw err;
    }
    
    // Helpful pragmas for tests and concurrent access
    db.run("PRAGMA foreign_keys = ON");
    // Use WAL for better concurrency and set a busy timeout to wait for locks
    try {
        db.run("PRAGMA journal_mode = WAL");
        db.run("PRAGMA busy_timeout = 5000");
    } catch (e) {
        // ignore if mocked DB doesn't implement run
    }
    console.log(`Connected to database: ${dbFilePath}`);

    // If the db file didn't exist we need to initialize it
    if (needsInitialization) {
        console.log("Database not found (fresh install or test reset). Initializing tables...");
        initializeDb();
    } else {
        // No initialization required — signal readiness immediately
        if (resolveDbReady) resolveDbReady()
    }

}

function initializeDb() {
    // Determine where the SQL files are located.
    // If running in Docker (DB_PATH is set), use the container absolute path.
    // If running locally/tests, use the local relative path.
    const sqlDir = process.env.DB_PATH 
        ? '/usr/src/app/database' // Path nel container (vedi Dockerfile sotto)
        : path.resolve(__dirname, '..', '..', '..', 'database'); // Local path

    const ddlPath = path.join(sqlDir, 'tables_DDL.sql');
    const defaultValuesPath = path.join(sqlDir, 'tables_default_values.sql');

    try {
        const ddlSQL = fs.readFileSync(ddlPath, "utf8");
        const defaultSQL = fs.readFileSync(defaultValuesPath, "utf8");

        db.serialize(() => {
            // Create tables
            db.exec(ddlSQL, (err) => {
                if (err) {
                    console.error("Error executing DDL script:", err.message);
                    return;
                }
                console.log("Tables created successfully.");

                // Insert default values
                db.exec(defaultSQL, (err) => {
                    if (err) {
                        console.error("❌ Error executing default values script:", err.message);
                    } else {
                        console.log("✅ Default values inserted successfully.");
                    }
                    // Signal that DB initialization finished regardless of default SQL success
                    if (resolveDbReady) resolveDbReady()
                });
            });
        });
    } catch (err: any) {
        console.error("❌ Failed to read SQL files for initialization:", err.message);
        console.error("Path looked up:", sqlDir);
    }
}

export default db;