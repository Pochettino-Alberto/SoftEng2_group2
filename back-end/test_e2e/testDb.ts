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
    if (fs.existsSync(testDbPath)) {
        // Try to remove the file. On Windows the file can be briefly locked by the OS
        // or another process; retry a few times with exponential backoff before giving up.
        const maxAttempts = 5
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
                    const backoffMs = 50 * Math.pow(2, attempt - 1)
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

export function teardownTestDb() {
    try {
        // sqlite3 Database object exposes close via default export file `db`.
        // The `db` object imported in other modules is the singleton from db.ts
        // but TypeScript typing may not expose `close` so use any.
        const anyDb: any = db
        anyDb.close((err: any) => {
            if (err) console.error('[testDb] error closing DB', err)
        })
    } catch (err) {
        console.error('[testDb] teardown error', err)
    }
}
