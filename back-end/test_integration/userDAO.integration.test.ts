// Integration tests for UserDAO using real sqlite test DB
const { resetTestDB } = require('./helpers/resetTestDB')

beforeAll(async () => {
  // ensure NODE_ENV=test so src/dao/db.ts picks the test DB
  process.env.NODE_ENV = 'test'
  await resetTestDB()
})

describe('UserDAO integration', () => {
  test('createUser -> getUserByUsername -> getIsUserAuthenticated (real DB)', async () => {
    const UserDAO = require('../src/dao/userDAO').default
    const dao = new UserDAO()

    const username = 'alice'
    // create user
    const createdUser = await dao.createUser(username, 'Alice', 'Integration', 'alice@int.test', 'secretpass', 'citizen')
    expect(createdUser).toBeDefined();
    expect(createdUser.username).toBe(username);

    // retrieve
    const user = await dao.getUserByUsername(username)
    expect(user.username).toBe(username)
    expect(user.email).toBe('alice@int.test')

    // authenticate
    const authOk = await dao.getIsUserAuthenticated(username, 'secretpass')
    expect(authOk).toBe(true)

    // wrong password
    const authBad = await dao.getIsUserAuthenticated(username, 'wrong')
    expect(authBad).toBe(false)
  })
})
