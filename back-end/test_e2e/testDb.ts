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
            fs.unlinkSync(testDbPath);
        } catch (err) {
            // Log but don't crash; the singleton logic in db.ts handles existing tables
            console.log('[testDb] reset: file was locked or missing.');
        }
    }
}

export async function teardownTestDb(): Promise<void> {
    const anyDb: any = db;
    if (anyDb && typeof anyDb.close === 'function') {
        await new Promise<void>((resolve) => {
            anyDb.close(() => resolve());
        });
    }

    // Clean up temporary file
    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
}