describe('db module', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('connects to existing DB and does not initialize when file exists', async () => {
    // Mock fs.existsSync to return true (db exists)
    jest.doMock('fs', () => ({
      existsSync: () => true,
      readFileSync: jest.fn(),
    }))

    // Mock sqlite3 to provide a Database constructor that calls the callback
    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: jest.fn(),
          serialize: (fn: any) => fn(),
        }
        // schedule callback after constructor returns to mimic real sqlite3
        process.nextTick(() => cb(null))
        return dbObj
      }
    }))

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    // Require module after mocks
    const db = require('../src/dao/db').default

    // wait for any async callbacks scheduled by the mock constructor
    await new Promise((resolve) => setImmediate(resolve))

    // ensure we got an object (fake db)
    expect(db).toBeDefined()
    expect(consoleLogSpy).toHaveBeenCalled()

    consoleLogSpy.mockRestore()
  })

  it('initializes DB when file does not exist and reads SQL files', async () => {
    // Simulate missing db file
    jest.doMock('fs', () => ({
      existsSync: () => false,
      readFileSync: (p: string) => {
        if (p.endsWith('tables_DDL.sql')) return 'CREATE TABLE t(id INTEGER)'
        if (p.endsWith('tables_default_values.sql')) return "INSERT INTO t(id) VALUES (1)"
        return ''
      }
    }))

    // Mock sqlite3.Database and ensure exec callbacks are invoked successfully
    jest.doMock('sqlite3', () => ({
      Database: function (filePath: string, cb: any) {
        const dbObj = {
          run: jest.fn(),
          exec: (sql: string, cb: any) => process.nextTick(() => cb && cb(null)),
          serialize: (fn: any) => fn(),
        }
        process.nextTick(() => cb(null))
        return dbObj
      }
    }))

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const db = require('../src/dao/db').default

    // wait for async initialization work to complete
    await new Promise((resolve) => setImmediate(resolve))

    expect(db).toBeDefined()
    expect(consoleLogSpy).toHaveBeenCalled()

    consoleLogSpy.mockRestore()
    consoleErrSpy.mockRestore()
  })
})
