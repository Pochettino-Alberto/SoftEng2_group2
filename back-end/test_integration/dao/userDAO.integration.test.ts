// Integration tests for UserDAO using real sqlite test DB (dao folder)
const { resetTestDB: resetDBDao } = require('../helpers/resetTestDB')

beforeAll(async () => {
  // ensure NODE_ENV=test so src/dao/db.ts picks the test DB
  process.env.NODE_ENV = 'test'
  await resetDBDao()
})

describe('UserDAO integration (dao folder)', () => {
  test('createUser -> getUserByUsername -> getIsUserAuthenticated (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const dao = new UserDAO()

    const username = 'alice_dao'
    // create user
  const createdUser = await dao.createUser(username, 'Alice', 'Integration', 'alice@int.test', 'secretpass', 'citizen')
  // createUser returns the created User object in the DAO implementation
  expect(createdUser).toBeDefined();
  expect(createdUser.username).toBe(username);

    // retrieve
    const user = await dao.getUserByUsername(username)
    expect(user.username).toBe(username)
  // Email should match what was provided when creating the user
  expect(user.email).toBe('alice@int.test')

    // authenticate
    const authOk = await dao.getIsUserAuthenticated(username, 'secretpass')
    expect(authOk).toBe(true)

    // wrong password
    const authBad = await dao.getIsUserAuthenticated(username, 'wrong')
    expect(authBad).toBe(false)
  })

  test('getUserById returns the correct user and rejects when not found (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const { UserNotFoundError } = require('../../src/errors/userError')
    const dao = new UserDAO()

    const username = 'int_bob_dao'
    // create user
  const created = await dao.createUser(username, 'Bob', 'Integration', 'bob.dao@int.test', 'pwd', 'citizen')
  // DAO.createUser returns the created User object; ensure it's defined and username matches
  expect(created).toBeDefined()
  expect(created.username).toBe(username)

    // retrieve by username to get id
    const byName = await dao.getUserByUsername(username)
    expect(byName.username).toBe(username)

    // now retrieve by id
    const byId = await dao.getUserById(byName.id)
    expect(byId.id).toBe(byName.id)
    expect(byId.username).toBe(username)

    // non-existent id should reject with UserNotFoundError
    await expect(dao.getUserById(999999)).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
