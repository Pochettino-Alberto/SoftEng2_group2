import path from 'path';

describe('db unit module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
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

        const mockInstance: any = {
          run: jest.fn((sql, params, cb) => { if (cb) cb(null); if (typeof params === 'function') params(null); }),
          get: jest.fn((sql, params, cb) => cb(null, { name: 'users' })), // Prevent initializeDb call
          exec: jest.fn((sql, cb) => cb && cb(null)),
          serialize: jest.fn(function(this: any, fn: () => void) { fn.call(this); }),
          close: jest.fn((cb) => cb && cb(null))
        };

        // Prevents TDZ ReferenceError by ensuring the db variable is assigned before callback
        setTimeout(() => {
          callback.call(mockInstance, null);
        }, 0);

        return mockInstance;
      }
    }));

    const { dbReady } = require('../src/dao/db');
    await expect(dbReady).resolves.toBeUndefined();
  });
});