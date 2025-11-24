import fs from 'fs'
import path from 'path'
import db from '../src/dao/db'

/**
 * Helpers to reset and teardown the test database used by the application.
 * db.ts already uses NODE_ENV=test to point to database/testdb.db so here
 * we just remove the file before the tests run to ensure a clean slate and
 * expose a teardown function that closes the sqlite connection.
 */

const testDbPath = path.resolve(__dirname, '..', '..', 'database', 'testdb.db')

export function resetTestDb() {
    // If tests are configured to use an in-memory DB, nothing to delete on disk.
    if (process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1') {
        console.log('[testDb] using in-memory DB, skipping file reset')
        return
    }

    if (fs.existsSync(testDbPath)) {
        // Try to remove the file. On Windows the file can be briefly locked by the OS
        // or another process; retry a few times with exponential backoff before giving up.
        const maxAttempts = 12
        let attempt = 0
        while (attempt < maxAttempts) {
            try {
                fs.unlinkSync(testDbPath)
                console.log('[testDb] removed existing test DB')
                break
            } catch (err: any) {
                attempt += 1
                if (err && err.code === 'EBUSY' && attempt < maxAttempts) {
                    // small synchronous backoff (busy-wait) — acceptable during test startup
                    // increase retries/backoff to handle Windows file-lock races
                    const backoffMs = 50 * Math.pow(2, Math.min(attempt - 1, 8))
                    const end = Date.now() + backoffMs
                    while (Date.now() < end) { /* busy-wait */ }
                    continue
                }
                // If still failing (or different error), warn and continue tests — don't throw.
                console.warn('[testDb] could not remove test DB (proceeding):', err)
                break
            }
        }
    }
}

export async function teardownTestDb(): Promise<void> {
    try {
        // sqlite3 Database object exposes close via default export file `db`.
        // The `db` object imported in other modules is the singleton from db.ts
        // but TypeScript typing may not expose `close` so use any. Wrap close
        // in a promise so callers can await the DB being fully closed.
        const anyDb: any = db
        if (anyDb && typeof anyDb.close === 'function') {
            await new Promise<void>((resolve, reject) => {
                anyDb.close((err: any) => {
                    if (err) {
                        console.error('[testDb] error closing DB', err)
                        return reject(err)
                    }
                    resolve()
                })
            })
        }
    } catch (err) {
        console.error('[testDb] teardown error', err)
    }

    // After ensuring DB is closed, attempt to remove the test DB file. Use
    // retries/backoff like in resetTestDb to handle Windows file-lock races.
    if (fs.existsSync(testDbPath)) {
        const maxAttempts = 12
        let attempt = 0
        while (attempt < maxAttempts) {
            try {
                fs.unlinkSync(testDbPath)
                console.log('[testDb] removed test DB during teardown')
                break
            } catch (err: any) {
                attempt += 1
                if ((err && (err.code === 'EBUSY' || err.code === 'EPERM')) && attempt < maxAttempts) {
                    const backoffMs = 50 * Math.pow(2, Math.min(attempt - 1, 8))
                    const end = Date.now() + backoffMs
                    while (Date.now() < end) { /* busy-wait */ }
                    continue
                }
                console.warn('[testDb] could not remove test DB during teardown (proceeding):', err)
                break
            }
        }
    }
}
