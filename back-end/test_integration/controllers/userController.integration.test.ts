// Integration tests for UserController using real sqlite test DB
const { resetTestDB: resetControllersDB } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetControllersDB()
  const { dbReady } = require('../../src/dao/db')
  await dbReady
})

describe('UserController integration', () => {
  test('createUser via controller creates a user in the real DB', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;

    const dao = new UserDAO();
    const ctrl = new UserController();

    const username = 'new_user';
    const created = await ctrl.createUser(username, 'New', 'User', 'new.user@int.test', 'pwd', 'citizen');
    // Controller.createUser resolves to the created User object; ensure it's defined and has expected properties
    expect(created).toBeDefined();
    expect(created.username).toBe(username);
    expect(created.email).toBe('new.user@int.test');

    const stored = await dao.getUserByUsername(username);
    expect(stored).toBeDefined();
    expect(stored.username).toBe(username);
    expect(stored.email).toBe('new.user@int.test');
  })

  test('getUserByUsername: admin and self access, non-admin forbidden (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;
    const { UserNotAdminError } = require('../../src/errors/userError');

    const dao = new UserDAO();
    const ctrl = new UserController();

    // create a target user
    const username = 'new_user2';
    await dao.createUser(username, 'U', 'Name', 'u.name@int.test', 'pwd', 'citizen');
    const target = await dao.getUserByUsername(username);

    const admin = { id: 1, username: 'superadmin', user_type: 'admin' } as any;
    const fetchedByAdmin = await ctrl.getUserByUsername(admin, username);
    expect(fetchedByAdmin.username).toBe(username);

    const selfRequester = { id: target.id, username: target.username, user_type: target.user_type } as any;
    const fetchedSelf = await ctrl.getUserByUsername(selfRequester, username);
    expect(fetchedSelf.username).toBe(username);

    const other = { id: target.id + 1, username: 'other', user_type: 'citizen' } as any;
    await expect(ctrl.getUserByUsername(other, username)).rejects.toBeInstanceOf(UserNotAdminError);
  })

  test('updateUserInfo: user updates own info and admin updates another; unauthorized rejected (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;
    const { UnauthorizedUserError } = require('../../src/errors/userError');

    const dao = new UserDAO();
    const ctrl = new UserController();

    // user updates own info
    const uname = 'update_self';
    await dao.createUser(uname, 'Old', 'Name', 'old@int.test', 'pwd', 'citizen');
    const stored = await dao.getUserByUsername(uname);
    const caller = { id: stored.id, username: stored.username, user_type: stored.user_type } as any;

    const updated = await ctrl.updateUserInfo(caller, stored.id, 'update_self_new', 'NewFirst', undefined, 'new@int.test');
    expect((await dao.getUserById(stored.id)).username).toBe('update_self_new');
    expect((await dao.getUserById(stored.id)).email).toBe('new@int.test');

    // admin updates another
    const tname = 'update_target';
    await dao.createUser(tname, 'T', 'Old', 't.old@int.test', 'pwd', 'citizen');
    const target = await dao.getUserByUsername(tname);
    const admin = { id: 1, username: 'superadmin', user_type: 'admin' } as any;
    const updatedByAdmin = await ctrl.updateUserInfo(admin, target.id, undefined, 'UpdatedFirst');
    expect((await dao.getUserById(target.id)).first_name).toBe('UpdatedFirst');

    // non-admin cannot update another
    const a = await dao.getUserByUsername(tname);
    const other = { id: a.id + 1000, username: 'not_owner', user_type: 'citizen' } as any;
    await expect(ctrl.updateUserInfo(other, a.id, 'hacker')).rejects.toBeInstanceOf(UnauthorizedUserError);
  })
})

describe('UserController additional integration tests', () => {
  test('usernameAlreadyInUse returns true/false correctly (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;

    const dao = new UserDAO();
    const ctrl = new UserController();

    const username = 'exists_user'
    await dao.createUser(username, 'Exist', 'User', 'exist@int.test', 'pwd', 'citizen')

    const exists = await ctrl.usernameAlreadyInUse(username)
    expect(exists).toBe(true)

    const notExists = await ctrl.usernameAlreadyInUse('no_such_user')
    expect(notExists).toBe(false)
  })

  test('createUser rejects on duplicate username (real DB)', async () => {
    const UserController = require('../../src/controllers/userController').default;
    const ctrl = new UserController();
    const username = 'dup_user_ctrl'

    // first create ok
    const created = await ctrl.createUser(username, 'D', 'Up', 'dup@int.test', 'pwd', 'citizen')
    expect(created).toBeDefined()

    // second create should reject with UserAlreadyExistsError
    const { UserAlreadyExistsError } = require('../../src/errors/userError')
    await expect(ctrl.createUser(username, 'D', 'Up', 'dup@int.test', 'pwd', 'citizen')).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })

  test('setUserRoles and assignRolesToUser modify roles (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;

    const dao = new UserDAO();
    const ctrl = new UserController();

    const username = 'roles_user'
    const created = await dao.createUser(username, 'R', 'User', 'r.user@int.test', 'pwd', 'citizen')
    const uid = created.id

    // get available roles (no userid) and pick first two
    const allRoles = await ctrl.getRoles()
    expect(allRoles.length).toBeGreaterThanOrEqual(1)
    const getRoleId = (r: any) => r.RoleID ?? r.id ?? r.RoleId
    const rids = allRoles.slice(0, 2).map((r: any) => getRoleId(r))

    // assign some roles
    await ctrl.assignRolesToUser(uid, [rids[0]])
    let assigned = await ctrl.getRoles(uid)
    expect(assigned.map((r: any) => r.RoleID ?? r.id)).toContain(rids[0])

    // setUserRoles replace roles with empty (remove)
    await ctrl.setUserRoles(uid, [])
    const after = await ctrl.getRoles(uid)
    expect(after.length).toBe(0)
  })
})