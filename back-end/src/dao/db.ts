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

const isTestEnv = typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV.startsWith('test');
const useMemoryDb = isTestEnv && (process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1')

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

// Determine whether we need to initialize the DB file.
// - For in-memory tests, always initialize.
// - For file-based DBs in testing, the test helper (`resetTestDB`) prepares
//   the schema, so do NOT re-run initialization here (avoids clobbering).
// - In non-test environments, initialize if the file does not exist.
const needsInitialization = useMemoryDb
    ? true
    : (env === 'test' ? false : !fs.existsSync(dbFilePath));

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

    const isTestEnv = typeof process.env.NODE_ENV === 'string' && process.env.NODE_ENV.startsWith('test');
    if (!isTestEnv) {
        console.log(`Connected to database: ${dbFilePath}`);
    }

    // Compute initialization decision at runtime so tests that set
    // `process.env.NODE_ENV = 'test'` in `beforeAll` (and helpers that
    // create the DB file) are respected. We need a nuanced policy:
    // - In-memory DBs always initialize here.
    // - In CI or when `DB_PATH` points to the repository `database` folder
    //   (or `CI_USE_FILE_DB=true`), tests/helpers manage the file DB and
    //   we should not initialize here (to avoid clobbering).
    // - Otherwise (including unit tests that mock fs to simulate missing
    //   SQL files), initialize if the file does not exist so unit tests
    //   exercising initialization/error branches work as expected.
    const currentEnv = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : env;
    const dbPathLooksLikeRepo = (process.env.CI_USE_FILE_DB === 'true') || (process.env.DB_PATH && process.env.DB_PATH.includes(path.join('database')));

    let shouldInitialize: boolean;
    if (useMemoryDb) {
        shouldInitialize = true;
    } else if (currentEnv === 'test') {
        // If DB path points into the repo's `database` folder or CI is using
        // the file DB, the test helper (resetTestDB) is expected to manage
        // schema creation. Otherwise, initialize when the file is missing.
        shouldInitialize = !dbPathLooksLikeRepo && !fs.existsSync(dbFilePath);
    } else {
        shouldInitialize = !fs.existsSync(dbFilePath);
    }

    if (shouldInitialize) {
        if (!isTestEnv) {
            console.log("Database not found (fresh install or test reset). Initializing tables...");
        }
        initializeDb();
    } else {
        // File exists — but it might be an empty or partial DB created by a
        // previous failed startup. Check for an expected table (users) and
        // initialize if missing.
        try {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", ['users'], (err: any, row: any) => {
                if (err) {
                    // If query fails, attempt initialization to be safe
                    console.error('Error checking existing DB schema, will attempt initialization:', err.message || err);
                    initializeDb();
                    return;
                }
                if (!row) {
                    if (!isTestEnv) {
                        console.log('DB file exists but required tables are missing. Initializing tables...');
                    }
                    initializeDb();
                } else {
                    // Schema looks fine — signal readiness
                    if (resolveDbReady) resolveDbReady()
                }
            });
        } catch (e) {
            // If anything unexpected happens, fall back to initialization
            console.error('Unexpected error while validating DB schema, initializing DB:', (e as any).message || e);
            initializeDb();
        }
    }

}

function initializeDb() {
    // Determine where the SQL files are located. In docker containers the DB folder
    // may be a mounted volume which hides files bundled in the image. To handle this
    // we try multiple candidate locations and pick the first one that contains the
    // required SQL files.
    const candidates: string[] = [];
    // If DB_PATH points into container filesystem, prefer the mounted database folder
    if (process.env.DB_PATH) {
        candidates.push('/usr/src/app/database');
    }
    // Also check for SQL files bundled with the image in the repository location
    candidates.push(path.resolve(__dirname, '..', '..', '..', 'database'));
    // Also consider an alternative location where Dockerfile can place SQL files
    candidates.push('/usr/src/app/sql');

    let sqlDir: string | null = null;
    console.log("🔍 Searching for SQL files in candidates:", candidates);
    for (const cand of candidates) {
        try {
            const ddlExists = fs.existsSync(path.join(cand, 'tables_DDL.sql'));
            const defaultExists = fs.existsSync(path.join(cand, 'tables_default_values.sql'));
            console.log(`Checking ${cand}: DDL=${ddlExists}, Default=${defaultExists}`);

            if (ddlExists && defaultExists) {
                sqlDir = cand;
                console.log("✅ Found SQL files in:", sqlDir);
                break;
            }
        } catch (e) {
            console.error(`Error checking candidate ${cand}:`, e);
            // ignore and try next
        }
    }

    if (!sqlDir) {
        console.warn("⚠️ Could not find SQL files in any candidate path. Fallback to repo location.");
        // fallback to repo database location (best-effort)
        sqlDir = path.resolve(__dirname, '..', '..', '..', 'database');
    }

    const ddlPath = path.join(sqlDir, 'tables_DDL.sql');
    const defaultValuesPath = path.join(sqlDir, 'tables_default_values.sql');

    try {
        const ddlSQL = fs.readFileSync(ddlPath, "utf8");
        const defaultSQL = fs.readFileSync(defaultValuesPath, "utf8");

        // Remove any existing PRAGMA foreign_keys lines from the DDL,
        // then explicitly disable foreign keys before running the DDL
        // and re-enable afterwards. This avoids FK constraint failures
        // during DROP/CREATE ordering.
        const cleanedDDL = ddlSQL.replace(/PRAGMA\s+foreign_keys\s*=\s*(ON|OFF);?/gi, '');
        const finalDDL = `PRAGMA foreign_keys = OFF;\n\n${cleanedDDL}\n\nPRAGMA foreign_keys = ON;`;

        db.exec(finalDDL, (err) => {
            if (err) {
                console.error("Error executing DDL script:", err.message);
                if (resolveDbReady) resolveDbReady()
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
    } catch (err: any) {
        console.error("❌ Failed to read SQL files for initialization:", err.message);
        console.error("Path looked up:", sqlDir);
        if (resolveDbReady) resolveDbReady()
    }
}

export default db;