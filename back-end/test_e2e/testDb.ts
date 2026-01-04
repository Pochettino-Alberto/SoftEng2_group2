import path from 'path';

describe('db unit module', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        // Clear global symbols used for singleton locking to ensure test isolation
        const GLOBAL_INIT_KEY = Symbol.for('app.db.init_started');
        delete (global as any)[GLOBAL_INIT_KEY];

        process.env = {
            ...ORIGINAL_ENV,
            NODE_ENV: 'test',
            TEST_DB_IN_MEMORY: 'true'
        };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    it('mocks sqlite and resolves dbReady', async () => {
        jest.doMock('sqlite3', () => ({
            OPEN_READWRITE: 1,
            OPEN_CREATE: 2,
            Database: function (path: any, mode: any, cb: any) {
                const callback = typeof mode === 'function' ? mode : cb;

                // Fix TS7022: Define mockInstance with 'any' to allow self-reference in serialize
                const mockInstance: any = {
                    run: jest.fn((sql, params, cb) => cb && cb(null)),
                    get: jest.fn((sql, params, cb) => cb(null, { name: 'users' })),
                    exec: jest.fn((sql, cb) => cb && cb(null)),
                    serialize: jest.fn(function(this: any, fn: Function) { fn.call(this); }),
                    close: jest.fn((cb) => cb && cb(null))
                };

                // Use setTimeout to ensure the Database object is fully constructed
                // before the callback fires, preventing "ReferenceError: db before initialization"
                setTimeout(() => {
                    callback.call(mockInstance, null);
                }, 0);

                return mockInstance;
            }
        }));

        // Import the module after the mock is established
        const { dbReady } = require('../src/dao/db');
        await expect(dbReady).resolves.toBeUndefined();
    });
});