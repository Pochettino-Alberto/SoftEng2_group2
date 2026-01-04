import { jest } from '@jest/globals'

jest.mock('sqlite3', () => {
  const run = jest.fn()
  const get = jest.fn()
  const all = jest.fn()
  const exec = jest.fn()
  const close = jest.fn((cb?: any) => cb && cb())

  class Database {
    constructor(_path: string, _mode: any, cb?: any) {
      if (typeof _mode === 'function') {
        _mode(null)
      } else if (cb) {
        cb(null)
      }
    }

    run = run
    get = get
    all = all
    exec = exec
    close = close
  }

  return {
    verbose: () => ({
      Database,
      OPEN_READWRITE: 1,
      OPEN_CREATE: 2
    })
  }
})

describe('db unit module', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.NODE_ENV = 'test'
    process.env.TEST_DB_IN_MEMORY = 'true'
    delete process.env.SKIP_DB_INIT
  })

  afterEach(async () => {
    jest.clearAllMocks()

    // ensure sqlite teardown does not leave open handles
    try {
      const mod = await import('../../src/dao/db')
      if (mod?.default?.close) {
        mod.default.close()
      }
    } catch {
      // ignore
    }
  })

  test('mocks sqlite and resolves dbReady', async () => {
    const { dbReady } = await import('../../src/dao/db')
    await expect(dbReady).resolves.toBeUndefined()
  })
})
