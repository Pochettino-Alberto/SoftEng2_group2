import fs from 'fs'
import path from 'path'
import os from 'os'

// Path logic matches src/dao/db.ts
const testDbPath = (process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1')
    ? ':memory:'
    : (process.env.DB_PATH || path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || 'main'}.db`))

export function resetTestDb() {
    if (process.env.TEST_DB_IN_MEMORY === 'true' || process.env.TEST_DB_IN_MEMORY === '1') {
        return
    }

    if (fs.existsSync(testDbPath)) {
        try {
            fs.unlinkSync(testDbPath)
            console.log('[testDb] removed existing test DB:', testDbPath)
        } catch (err) {
            // If the file is locked, we can ignore and let SQLite truncate it later
        }
    }
}

export async function teardownTestDb() {
    // Dynamic import to avoid loading db.ts logic until after reset
    const { default: db } = await import('../src/dao/db')

    try {
        if (db && typeof db.close === 'function') {
            await new Promise<void>((resolve) => {
                db.close(() => resolve())
            })
        }
    } catch (err) {
        console.error('[testDb] teardown error', err)
    }

    if (fs.existsSync(testDbPath)) {
        try {
            fs.unlinkSync(testDbPath)
            console.log('[testDb] removed test DB during teardown')
        } catch (err) {}
    }
}