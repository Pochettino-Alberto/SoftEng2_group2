import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../src/dao/db';

const testDbPath = (process.env.TEST_DB_IN_MEMORY === 'true')
    ? ':memory:'
    : (process.env.DB_PATH || path.join(os.tmpdir(), `testdb-${process.env.JEST_WORKER_ID || process.pid}.db`));

export const resetTestDb = () => {
    // Clear the singleton state in the global object
    const GLOBAL_INIT_STARTED = Symbol.for('app.db.init_started');
    const GLOBAL_READY_KEY = Symbol.for('app.db.ready_promise');
    delete (global as any)[GLOBAL_INIT_STARTED];
    delete (global as any)[GLOBAL_READY_KEY];

    if (testDbPath !== ':memory:' && fs.existsSync(testDbPath)) {
        try {
            fs.unlinkSync(testDbPath);
        } catch (e) {
            console.log('[testDb] reset skip: file busy or removed');
        }
    }
};

export const teardownTestDb = async (): Promise<void> => {
    try {
        const anyDb: any = db;
        if (anyDb && typeof anyDb.close === 'function') {
            await new Promise<void>((resolve) => {
                anyDb.close(() => resolve());
            });
        }
    } catch (err) {
        console.error('[testDb] Error closing DB', err);
    }
    resetTestDb();
};