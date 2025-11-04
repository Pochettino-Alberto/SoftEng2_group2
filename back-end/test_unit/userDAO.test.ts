import UserDAO from '../src/dao/userDAO'
import { UserNotFoundError } from '../src/errors/userError'

// Mock the db module used by UserDAO
jest.mock('../src/dao/db', () => ({
  get: jest.fn(),
  run: jest.fn(),
}))

const db = require('../src/dao/db')

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
      user_type: 'Customer'
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
})
