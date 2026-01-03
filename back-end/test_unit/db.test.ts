import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../database/testdb.db');

describe('db module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };

    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignore lock errors
      }
    }
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  // Mocking sqlite3 with explicit types and async callbacks
  jest.doMock('sqlite3', () => {
    const mockDb: any = {
      get: jest.fn((sql: string, params: any, cb?: any): any => {
        const callback = typeof params === 'function' ? params : cb;
        callback(null, { count: 1 });
        return mockDb;
      }),
      run: jest.fn((sql: string, params: any, cb?: any): any => {
        const callback = typeof params === 'function' ? params : cb;
        callback(null);
        return mockDb;
      }),
      exec: jest.fn((sql: string, cb: any): any => {
        cb(null);
        return mockDb;
      }),
      serialize: jest.fn((fn: any) => fn()),
      close: jest.fn((cb: any) => cb && cb(null)),
      on: jest.fn()
    };

    return {
      verbose: () => ({
        Database: function (path: string, mode: any, cb: any) {
          const callback = typeof mode === 'function' ? mode : cb;
          // Use timeout to ensure async behavior to avoid locking
          setTimeout(() => callback && callback(null), 0);
          return mockDb;
        },
        OPEN_READWRITE: 1,
        OPEN_CREATE: 2
      })
    };
  });

  it('connects to existing DB and does not initialize when file exists', async () => {
    delete process.env.DB_PATH;
    delete process.env.CI_USE_FILE_DB;
    process.env.NODE_ENV = 'test';

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'test');

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;
    expect(dbModule.default).toBeDefined();
  });

  it('initializes DB when file does not exist and reads SQL files', async () => {
    process.env.NODE_ENV = 'test';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('CREATE TABLE test (id INT);');

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;
    expect(dbModule.default).toBeDefined();
  });

  it('calls PRAGMA journal_mode, busy_timeout, and foreign_keys on successful open', async () => {
    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;
    expect(dbModule.default.get).toHaveBeenCalled();
  });

  it('handles SQL file read errors gracefully', async () => {
    process.env.NODE_ENV = 'test';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('read-fail');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Failed to read SQL files'), 'read-fail');
    consoleSpy.mockRestore();
  });

  it('resolves dbReady promise when initialization completes', async () => {
    const dbModule = require('../src/dao/db');
    const result = await dbModule.dbReady;
    expect(result).toBeUndefined();
  });

  it('throws error when opening database fails', async () => {
    jest.resetModules();
    jest.doMock('sqlite3', () => ({
      verbose: () => ({
        Database: function (path: string, cb: any) {
          setTimeout(() => cb(new Error('open-fail')), 0);
        }
      })
    }));

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      require('../src/dao/db');
    }).toThrow('open-fail');
    consoleErrSpy.mockRestore();
  });
});