import fs from 'fs'

const runMock = jest.fn()
const getMock = jest.fn()
const execMock = jest.fn()
const closeMock = jest.fn()

const DatabaseMock = jest.fn(function (_path: string, _modeOrCb: any, cb?: any) {
  if (typeof _modeOrCb === 'function') _modeOrCb(null)
  if (cb) cb(null)

  this.run = runMock
  this.get = getMock
  this.exec = execMock
  this.close = closeMock
})

jest.mock('sqlite3', () => ({
  Database: DatabaseMock,
  OPEN_READWRITE: 1,
  OPEN_CREATE: 2
}))

describe('db module', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  it('connects to existing DB and does not initialize when file exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(DatabaseMock).toHaveBeenCalled()
    expect(execMock).not.toHaveBeenCalled()
  })

  it('initializes DB when file does not exist and reads SQL files', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    jest.spyOn(fs, 'readFileSync').mockReturnValue('SQL')

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(execMock).toHaveBeenCalled()
  })

  it('calls PRAGMA statements on successful open', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(runMock).toHaveBeenCalled()
  })

  it('handles SQL file read errors gracefully', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('read-fail')
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('throws error when opening database fails', () => {
    jest.resetModules()

    const sqlite = require('sqlite3')
    sqlite.Database.mockImplementationOnce(() => {
      throw new Error('open-fail')
    })

    expect(() => {
      require('../src/dao/db')
    }).toThrow('open-fail')
  })
})
