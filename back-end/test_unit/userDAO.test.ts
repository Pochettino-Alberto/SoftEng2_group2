import UserDAO from '../src/dao/userDAO'
import { UserNotFoundError, UserAlreadyExistsError } from '../src/errors/userError'

// Mock the db module used by UserDAO
jest.mock('../src/dao/db', () => ({
  get: jest.fn(),
  run: jest.fn(),
}))

// Mock crypto where needed for authentication tests
jest.mock('crypto', () => ({
  scryptSync: jest.fn(),
  randomBytes: jest.fn(),
  timingSafeEqual: jest.fn(),
}))

const db = require('../src/dao/db')
const crypto = require('crypto')

describe('UserDAO', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('getUserByUsername resolves with a User when row exists', async () => {
    const sampleRow = {
      id: 1,
      username: 'john_doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      user_type: 'citizen'
    }

    // Make db.get call the callback with (null, row)
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, sampleRow)
    })

    const dao = new UserDAO()
    const user = await dao.getUserByUsername('john_doe')

    expect(user.username).toBe('john_doe')
    expect(user.email).toBe('john@example.com')
  })

  test('getUserByUsername rejects with UserNotFoundError when row is not found', async () => {
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, undefined)
    })

    const dao = new UserDAO()
    await expect(dao.getUserByUsername('nonexistent')).rejects.toBeInstanceOf(UserNotFoundError)
  })

  test('createUser resolves true when insert succeeds', async () => {
    // simulate successful db.run (no error passed to callback)
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null)
    })

    const dao = new UserDAO()
    await expect(dao.createUser('alice', 'Alice', 'Smith', 'alice@example.com', 'pass', 'Customer')).resolves.toBe(true)
    expect(db.run).toHaveBeenCalled()
  })

  test('createUser rejects with UserAlreadyExistsError on UNIQUE constraint', async () => {
    const uniqueErr = new Error('UNIQUE constraint failed: users.username')
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(uniqueErr)
    })

    const dao = new UserDAO()
    await expect(dao.createUser('alice', 'Alice', 'Smith', 'alice@example.com', 'pass', 'Customer')).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })

  test('getIsUserAuthenticated returns true when password matches', async () => {
    const hex = '0102030405060708090a0b0c0d0e0f10'
    const sampleRow = {
      username: 'bob',
      password_hash: hex, // hex string as stored in DB
      salt: 'somesalt'
    }

    // mock db.get to return the row
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, sampleRow)
    })

    // mock scryptSync to return the same buffer as Buffer.from(hex, 'hex')
    const expectedBuffer = Buffer.from(hex, 'hex')
    crypto.scryptSync.mockReturnValue(expectedBuffer)
    crypto.timingSafeEqual.mockReturnValue(true)

    const dao = new UserDAO()
    await expect(dao.getIsUserAuthenticated('bob', 'plaintext')).resolves.toBe(true)
  })

  test('getIsUserAuthenticated returns false when password does not match', async () => {
    const hex = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const sampleRow = {
      username: 'eve',
      password_hash: hex,
      salt: 'somesalt'
    }

    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, sampleRow)
    })

    const expectedBuffer = Buffer.from(hex, 'hex')
    crypto.scryptSync.mockReturnValue(Buffer.from('0000', 'hex'))
    crypto.timingSafeEqual.mockReturnValue(false)

    const dao = new UserDAO()
    await expect(dao.getIsUserAuthenticated('eve', 'wrongpass')).resolves.toBe(false)
  })

  test('getIsUserAuthenticated rejects when db.get returns error', async () => {
    const dbErr = new Error('db failure')
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(dbErr)
    })

    const dao = new UserDAO()
    await expect(dao.getIsUserAuthenticated('someone', 'pw')).rejects.toBe(dbErr)
  })

  test('getIsUserAuthenticated resolves false when row has no salt', async () => {
  const sampleRow: any = { username: 'nosalt', password_hash: 'deadbeef', salt: null }
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => { cb(null, sampleRow) })
    const dao = new UserDAO()
    await expect(dao.getIsUserAuthenticated('nosalt', 'irrelevant')).resolves.toBe(false)
  })

  test('createUser rejects with generic DB error when run errors (non-UNIQUE)', async () => {
    const someErr = new Error('some db error')
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => { cb(someErr) })
    const dao = new UserDAO()
    await expect(dao.createUser('bob', 'B', 'Ob', 'b@e.t', 'pw', 'citizen')).rejects.toBe(someErr)
  })

  test('getUserByUsername rejects when db.get returns error', async () => {
    const err = new Error('read fail')
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => { cb(err) })
    const dao = new UserDAO()
    await expect(dao.getUserByUsername('x')).rejects.toBe(err)
  })

  // Tests for deleteUserById
  test('deleteUserById resolves true when a row is deleted', async () => {
    // simulate db.run invoking callback with this.changes = 1
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb.call({ changes: 1 }, null)
    })

    const dao = new UserDAO()
    await expect(dao.deleteUserById(2)).resolves.toBe(true)
    expect(db.run).toHaveBeenCalled()
  })

  test('deleteUserById resolves false when no row deleted', async () => {
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb.call({ changes: 0 }, null)
    })

    const dao = new UserDAO()
    await expect(dao.deleteUserById(3)).resolves.toBe(false)
  })

  test('deleteUserById rejects when db.run returns an error', async () => {
    const err = new Error('delete failed')
    db.run.mockImplementation((sql: string, params: any[], cb: Function) => { cb(err) })
    const dao = new UserDAO()
    await expect(dao.deleteUserById(4)).rejects.toBe(err)
  })

  // Tests for getUserById
  test('getUserById resolves with a User when row exists', async () => {
    const sampleRow = {
      id: 42,
      username: 'sam',
      first_name: 'Sam',
      last_name: 'Smith',
      email: 'sam@example.com',
      user_type: 'municipality'
    }

    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, sampleRow)
    })

    const dao = new UserDAO()
    const user = await dao.getUserById(42)

    expect(user.id).toBe(42)
    expect(user.username).toBe('sam')
    expect(user.user_type).toBeDefined()
    expect(user.email).toBe('sam@example.com')
  })

  test('getUserById rejects with UserNotFoundError when row is not found', async () => {
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      cb(null, undefined)
    })

    const dao = new UserDAO()
    // rejects unwrap the a rejected promise
    await expect(dao.getUserById(999)).rejects.toBeInstanceOf(UserNotFoundError)
  })

  test('getUserById rejects when db.get returns an error', async () => {
    const err = new Error('db read failure')
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => { cb(err) })
    const dao = new UserDAO()
    await expect(dao.getUserById(7)).rejects.toBe(err)
  })
})
