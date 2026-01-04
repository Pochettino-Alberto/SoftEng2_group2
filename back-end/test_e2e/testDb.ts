import fs from 'fs'
import path from 'path'
import os from 'os'
import db from '../src/dao/db'

const testDbPath = (process.env.TEST_DB_IN_MEMORY === 'true')
    ? ':memory:'
    : (process.env.DB_PATH || path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`))

export function resetTestDb() {
    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try {
            fs.unlinkSync(testDbPath) // Force removal to trigger re-init
        } catch (err) {
            console.warn('[testDb] File locked, proceeding...')
        }
    }
}

export async function teardownTestDb(): Promise<void> {
    const anyDb: any = db
    if (anyDb && typeof anyDb.close === 'function') {
        await new Promise<void>((resolve) => anyDb.close(() => resolve()))
    }
    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try { fs.unlinkSync(testDbPath) } catch (e) {}
    }
}