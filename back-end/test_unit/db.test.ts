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
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('connects to existing DB and does not initialize when file exists', async () => {
    fs.writeFileSync(TEST_DB_PATH, '');

    const execMock = jest.fn();
    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: execMock, run: jest.fn(), get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;

    expect(execMock).not.toHaveBeenCalled();
  });

  it('initializes DB when file does not exist and reads SQL files', async () => {
    const execMock = jest.fn((_, cb) => cb(null));

    jest.spyOn(fs, 'readFileSync').mockReturnValue('SQL');

    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: execMock, run: jest.fn(), get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;

    expect(execMock).toHaveBeenCalled();
  });

  it('calls PRAGMA statements on successful open', async () => {
    const runMock = jest.fn();

    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: jest.fn(), run: runMock, get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;

    expect(runMock).toHaveBeenCalled();
  });

  it('handles SQL file read errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('read error');
    });

    jest.doMock('sqlite3', () => ({
      Database: function (_: any, cb: any) {
        cb(null);
        return { exec: jest.fn(), run: jest.fn(), get: jest.fn() };
      }
    }));

    const dbModule = require('../src/dao/db');
    await dbModule.dbReady;

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
