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

  it('does not initialize DB when file does not exist in test env', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(execMock).not.toHaveBeenCalled()
  })

  it('does not run PRAGMA statements when initialization is skipped', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(runMock).not.toHaveBeenCalled()
  })

  it('does not attempt to read SQL files in test env', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    const readSpy = jest.spyOn(fs, 'readFileSync')

    const dbModule = require('../src/dao/db')
    await dbModule.dbReady

    expect(readSpy).not.toHaveBeenCalled()
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
