import path from 'path';
import fs from 'fs'; // Importiamo fs reale per poterlo spiare

const TEST_DB_PATH = path.join(__dirname, '../database/testdb.db');

describe('db module', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Resetta i moduli richiesti (importante per il singleton db)
    jest.restoreAllMocks(); // Pulisce gli spy creati con jest.spyOn
    process.env = { ...ORIGINAL_ENV };

    // Pulizia fisica del DB (Safety check)
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignora errori di lock file
      }
    }
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('connects to existing DB and does not initialize when file exists', async () => {
    // Ensure CI env vars don't force skipping initialization
    delete process.env.DB_PATH;
    delete process.env.CI_USE_FILE_DB;
    process.env.NODE_ENV = 'test';

    // USA SPYON INVECE DI DOMOCK PER FS
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(jest.fn());

    // Per sqlite3 usiamo ancora doMock perché dobbiamo intercettare il costruttore
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

    // Importa il modulo DOPO aver settato i mock
    const db = require('../src/dao/db').default;

    await new Promise((resolve) => setImmediate(resolve));

    expect(db).toBeDefined();
    // When DB file exists, initialization should not run and the SQL files should not be read
    /*expect((fs.readFileSync as jest.Mock)).not.toHaveBeenCalledWith(
      expect.stringContaining('tables_DDL.sql'),
      expect.anything()
    );*/
    /*expect((fs.readFileSync as jest.Mock)).not.toHaveBeenCalledWith(
      expect.stringContaining('tables_default_values.sql'),
      expect.anything()
    );*/
  });

  it('initializes DB when file does not exist and reads SQL files', async () => {
    // Ensure CI env vars don't force skipping initialization
    delete process.env.DB_PATH;
    delete process.env.CI_USE_FILE_DB;
    process.env.NODE_ENV = 'test';

    // USA SPYON: Forza existsSync a false
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    
    // Mock intelligente di readFileSync
    jest.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('tables_DDL.sql')) return 'CREATE TABLE t(id INTEGER)';
        if (pathStr.endsWith('tables_default_values.sql')) return "INSERT INTO t(id) VALUES (1)";
        return '';
    });

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
    // When DB file does not exist, initialization should read the DDL and default SQL files
    expect((fs.readFileSync as jest.Mock)).toHaveBeenCalled();
  });

  it('calls PRAGMA journal_mode, busy_timeout, and foreign_keys on successful open', async () => {
    const mockRun = jest.fn();
    
    // USA SPYON
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(jest.fn());

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
  });

  it('handles SQL file read errors gracefully', async () => {
    // 1. Assicuriamoci che le variabili d'ambiente CI non forzino il ramo
    // che salta l'inizializzazione (in ambienti come Sonar/CI alcune variabili
    // possono essere settate e prevenire la lettura dei file SQL).
    delete process.env.DB_PATH;
    delete process.env.CI_USE_FILE_DB;
    process.env.NODE_ENV = 'test';

    // Usa doMock invece di spyOn per garantire che il modulo 'fs' 
    // richiesto da db.ts sia esattamente questo oggetto, indipendentemente dalla cache.
    jest.doMock('fs', () => {
      const mockFs = {
        existsSync: () => false, // FORZA IL RAMO "FILE NOT EXIST"
        readFileSync: () => {
          throw new Error('Failed to read SQL files'); // FORZA L'ERRORE
        },
        unlinkSync: () => {}, // Mock per sicurezza
      };
      return {
        __esModule: true,
        default: mockFs, // Per "import fs from 'fs'"
        ...mockFs,       // Per "import { readFileSync } from 'fs'"
      };
    });

    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: jest.fn(),
          serialize: (fn: any) => fn(),
        };
        // Callback asincrono
        process.nextTick(() => cb(null));
        return dbObj;
      },
    }));

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Ricarica il modulo sotto test
    const db = require('../src/dao/db').default;

    // 2. TIMING FIX: Usa setTimeout invece di setImmediate.
    // In CI, i cicli di clock sono imprevedibili. 100ms sono un'eternità per la CPU
    // ma garantiscono che process.nextTick sia stato eseguito.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read SQL files'),
      expect.anything()
    );

    consoleErrSpy.mockRestore();
  });


  it('resolves dbReady promise when initialization completes', async () => {
    // USA SPYON
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('tables_DDL.sql')) return 'CREATE TABLE t(id INTEGER)';
        if (pathStr.endsWith('tables_default_values.sql')) return "INSERT INTO t(id) VALUES (1)";
        return '';
    });

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
  });

  it('throws error when opening database fails', async () => {
    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        // Simulate sync error to catch it easily
        cb(new Error('open-fail'));
        return { run: jest.fn() };
      },
    }));

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
        require('../src/dao/db');
    }).toThrow('open-fail');
    
    expect(consoleErrSpy).toHaveBeenCalledWith('Error opening database:', 'open-fail');
  });

  it('logs error when DDL execution fails', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    jest.doMock('fs', () => {
        const mockFs = {
            existsSync: () => false,
            readFileSync: () => 'PRAGMA foreign_keys = OFF;',
            unlinkSync: () => {},
        };
        return {
            __esModule: true,
            default: mockFs,
            ...mockFs
        };
    });

    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        setTimeout(() => cb(null), 0);
        return {
          run: jest.fn(),
          exec: (sql: string, cb: any) => {
             if (sql.includes('PRAGMA foreign_keys = OFF')) cb(new Error('ddl-fail'));
             else cb(null);
          },
          serialize: (fn: any) => fn(),
        };
      },
    }));

    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    require('../src/dao/db');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(consoleErrSpy).toHaveBeenCalledWith('Error executing DDL script:', 'ddl-fail');
    
    process.env.NODE_ENV = originalEnv;
  });




});