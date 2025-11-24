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
        try {
            fs.unlinkSync(testDbPath)
            console.log('[testDb] removed existing test DB')
        } catch (err) {
            // If the file is busy/locked (another test created it), just warn and continue.
            console.error('[testDb] failed to remove test DB (will continue):', err)
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
