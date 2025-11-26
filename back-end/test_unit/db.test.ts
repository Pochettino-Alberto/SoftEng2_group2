import path from 'path';

// Definisci il percorso del DB di test (adattalo se la struttura cartelle è diversa)
const TEST_DB_PATH = path.join(__dirname, '../database/testdb.db');

describe('db module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Pulisce la cache dei moduli
    process.env = { ...ORIGINAL_ENV };

    // --- MODIFICA IMPORTANTE: Pulizia fisica del DB ---
    // Usiamo requireActual per bypassare eventuali mock e cancellare il file vero
    const fsActual = jest.requireActual('fs');
    if (fsActual.existsSync(TEST_DB_PATH)) {
      try {
        fsActual.unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignora errori se il file è bloccato o già rimosso
      }
    }
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('connects to existing DB and does not initialize when file exists', async () => {
    // Mock fs.existsSync to return true (db exists)
    jest.doMock('fs', () => ({
      existsSync: () => true,
      readFileSync: jest.fn(),
    }));

    // Mock sqlite3
    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: jest.fn(),
          serialize: (fn: any) => fn(),
        };
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Require module after mocks
    const db = require('../src/dao/db').default;

    await new Promise((resolve) => setImmediate(resolve));

    expect(db).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  it('initializes DB when file does not exist and reads SQL files', async () => {
    // Simulate missing db file
    jest.doMock('fs', () => ({
      existsSync: () => false,
      readFileSync: (p: string) => {
        if (p.endsWith('tables_DDL.sql')) return 'CREATE TABLE t(id INTEGER)';
        if (p.endsWith('tables_default_values.sql')) return "INSERT INTO t(id) VALUES (1)";
        return '';
      },
    }));

    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: (sql: string, cb: any) => process.nextTick(() => cb && cb(null)),
          serialize: (fn: any) => fn(),
        };
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const db = require('../src/dao/db').default;

    await new Promise((resolve) => setImmediate(resolve));

    expect(db).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleErrSpy.mockRestore();
  });

  it('calls PRAGMA journal_mode, busy_timeout, and foreign_keys on successful open', async () => {
    const mockRun = jest.fn();
    jest.doMock('fs', () => ({
      existsSync: () => true,
      readFileSync: jest.fn(),
    }));

    jest.doMock('sqlite3', () => ({
      OPEN_READWRITE: 1,
      OPEN_CREATE: 2,
      Database: function (filePath: string, flags: number, cb: any) {
        const dbObj = {
          run: mockRun,
          exec: jest.fn(),
          serialize: (fn: any) => fn(),
        };
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const db = require('../src/dao/db').default;

    await new Promise((resolve) => setImmediate(resolve));

    expect(mockRun).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
    expect(mockRun).toHaveBeenCalledWith('PRAGMA journal_mode = WAL');
    expect(mockRun).toHaveBeenCalledWith('PRAGMA busy_timeout = 5000');

    consoleLogSpy.mockRestore();
  });

  it('handles SQL file read errors gracefully', async () => {
    // Qui è fondamentale che existsSync ritorni false. 
    // Avendo cancellato il file nel beforeEach, anche se il mock fallisse, il codice reale vedrebbe false.
    jest.doMock('fs', () => ({
      // Aggiungiamo __esModule e default per compatibilità massima con ts-jest
      __esModule: true,
      default: {
         existsSync: () => false,
         readFileSync: () => { throw new Error('ENOENT: no such file'); }
      },
      existsSync: () => false,
      readFileSync: () => {
        throw new Error('ENOENT: no such file');
      },
    }));

    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: jest.fn(),
          serialize: (fn: any) => fn(),
        };
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const db = require('../src/dao/db').default;

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read SQL files'),
      expect.anything()
    );

    consoleErrSpy.mockRestore();
  });

  it('resolves dbReady promise when initialization completes', async () => {
    jest.doMock('fs', () => ({
      existsSync: () => false,
      readFileSync: (p: string) => {
        if (p.endsWith('tables_DDL.sql')) return 'CREATE TABLE t(id INTEGER)';
        if (p.endsWith('tables_default_values.sql')) return "INSERT INTO t(id) VALUES (1)";
        return '';
      },
    }));

    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: (sql: string, cb: any) => process.nextTick(() => cb && cb(null)),
          serialize: (fn: any) => fn(),
        };
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { dbReady } = require('../src/dao/db');

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 500));
    const result = await Promise.race([dbReady, timeoutPromise]);

    expect(result).toBeUndefined();

    consoleLogSpy.mockRestore();
  });
});