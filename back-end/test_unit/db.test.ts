import path from 'path';

describe('db unit module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    const GLOBAL_INIT_STARTED = Symbol.for('app.db.init_started');
    const GLOBAL_READY_KEY = Symbol.for('app.db.ready_promise');
    delete (global as any)[GLOBAL_INIT_STARTED];
    delete (global as any)[GLOBAL_READY_KEY];

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
          run: jest.fn((sql, params, cb) => {
            if (typeof params === 'function') params(null);
            if (cb) cb(null);
          }),
          // Bypasses initializeDb to avoid constraint errors in unit tests
          get: jest.fn((sql, params, cb) => cb(null, { name: 'users' })),
          exec: jest.fn((sql, cb) => cb && cb(null)),
          serialize: jest.fn(function(this: any, fn: () => void) { fn.call(this); }),
          on: jest.fn(),
          close: jest.fn((cb) => cb && cb(null))
        };

        setTimeout(() => {
          callback.call(mockInstance, null);
        }, 10);

        return mockInstance;
      }
    }));

    const { dbReady } = require('../src/dao/db');
    await expect(dbReady).resolves.toBeUndefined();
  });
});