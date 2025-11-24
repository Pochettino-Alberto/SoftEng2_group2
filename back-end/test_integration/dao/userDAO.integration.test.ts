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

// --- appended from userDAO.more.integration.test.ts ---
const { resetTestDB: resetDBDao_MORE } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetDBDao_MORE()
})

describe('UserDAO additional integration tests (dao folder)', () => {
  test('assignRoles, getRoles, removeRoles work as expected (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const dao = new UserDAO()

    const username = 'roles_dao'
    const created = await dao.createUser(username, 'R', 'Dao', 'r.dao@int.test', 'pwd', 'citizen')
    const uid = created.id

    // get available roles
    const allRoles = await dao.getRoles()
    expect(allRoles.length).toBeGreaterThanOrEqual(1)
    const getRoleId = (r: any) => r.RoleID ?? r.id ?? r.RoleId
    const rids = allRoles.slice(0, 3).map((r: any) => getRoleId(r))

    // assign roles
    await dao.assignRoles(uid, [rids[0], rids[1]])
    let assigned = await dao.getRoles(uid)
    const assignedIds = assigned.map((r: any) => r.RoleID ?? r.id)
    expect(assignedIds).toEqual(expect.arrayContaining([rids[0], rids[1]]))

    // remove one role
    await dao.removeRoles(uid, [rids[1]])
    const after = await dao.getRoles(uid)
    expect(after.map((r: any) => r.RoleID ?? r.id)).toEqual(expect.arrayContaining([rids[0]]))
    expect(after.map((r: any) => r.RoleID ?? r.id)).not.toContain(rids[1])
  })

  test('getPaginatedUsers supports filters and returns correct totalCount (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const dao = new UserDAO()

    // create users with different first names and roles
    await dao.createUser('pag_a', 'Alice', 'A', 'a@int.test', 'pwd', 'citizen')
    await dao.createUser('pag_b', 'Bob', 'B', 'b@int.test', 'pwd', 'citizen')
    await dao.createUser('pag_c', 'Alice', 'C', 'c@int.test', 'pwd', 'citizen')

    const { users, totalCount } = await dao.getPaginatedUsers('Alice', null, null, null, 10, 0)
    expect(totalCount).toBeGreaterThanOrEqual(2)
    expect(users.every((u: any) => u.first_name.toLowerCase().includes('alice'))).toBe(true)
  })

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

  test('updateUserInfo persists changes and deleteUserById false when missing (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const dao = new UserDAO()

    const username = 'to_update'
    const created = await dao.createUser(username, 'First', 'Last', 'tu@int.test', 'pwd', 'citizen')
    const uid = created.id

    // update info
    created.username = 'updated_user_dao'
    created.email = 'updated@int.test'
    await dao.updateUserInfo(uid, created)

    const reloaded = await dao.getUserById(uid)
    expect(reloaded.username).toBe('updated_user_dao')
    expect(reloaded.email).toBe('updated@int.test')

    // deleting non-existent id should return false
    const deleted = await dao.deleteUserById(9999999)
    expect(deleted).toBe(false)
  })

  test('assignRoles/removeRoles with empty arrays resolve (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default
    const dao = new UserDAO()

    const username = 'empty_roles'
    const created = await dao.createUser(username, 'E', 'Roles', 'er@int.test', 'pwd', 'citizen')
    const uid = created.id

    // should not throw
    await expect(dao.assignRoles(uid, [])).resolves.toBeUndefined()
    await expect(dao.removeRoles(uid, [])).resolves.toBeUndefined()
  })
})
