import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../src/dao/db';

const testDbPath = (process.env.TEST_DB_IN_MEMORY === 'true')
    ? ':memory:'
    : (process.env.DB_PATH || path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`));

export const resetTestDb = () => {
    // Reset singleton state
    const GLOBAL_INIT_KEY = Symbol.for('app.db.init_started');
    delete (global as any)[GLOBAL_INIT_KEY];

    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try {
            fs.unlinkSync(testDbPath);
        } catch (err) {
            console.log('[testDb] Reset skipped: file busy or already removed.');
        }
    }
};

export const teardownTestDb = async (): Promise<void> => {
    const anyDb: any = db;
    if (anyDb && typeof anyDb.close === 'function') {
        await new Promise<void>((resolve) => {
            anyDb.close(() => resolve());
        });
    }

    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try { fs.unlinkSync(testDbPath); } catch (e) {}
    }

    const GLOBAL_INIT_KEY = Symbol.for('app.db.init_started');
    delete (global as any)[GLOBAL_INIT_KEY];
};