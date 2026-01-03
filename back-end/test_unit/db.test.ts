import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../database/testdb.db');

describe('db module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      TEST_DB_IN_MEMORY: 'true'
    };

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('opens database and resolves dbReady', async () => {
    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: jest.fn(), run: jest.fn(), get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await expect(dbModule.dbReady).resolves.toBeUndefined();
  });

  it('does not crash if SQL initialization is skipped', async () => {
    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: jest.fn(), run: jest.fn(), get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await expect(dbModule.dbReady).resolves.toBeUndefined();
  });

  it('handles database open error by throwing', () => {
    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(new Error('open error'));
        return {};
      }
    }));

    expect(() => {
      require('../src/dao/db');
    }).toThrow();
  });
});
