// Integration tests for UserController.getUserById using real sqlite test DB
const { resetTestDB: resetControllersDB } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetControllersDB()
})

describe('UserController integration - getUserById', () => {
  test('admin can retrieve any user by id (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;

    const dao = new UserDAO();
    // create a target user
    const username = 'target_bob';
    await dao.createUser(username, 'Target', 'Bob', 'targetbob@int.test', 'pwd', 'citizen');
    // get user just created from the db
    const target = await dao.getUserByUsername(username);

    const ctrl = new UserController();
    const adminRequester = { id: 1, username: 'superadmin', user_type: 'admin' } as any;
    // test getUserById controller
    const fetched = await ctrl.getUserById(adminRequester, target.id);
    expect(fetched.username).toBe(username);
    expect(fetched.email).toBe('targetbob@int.test');
    expect(fetched.first_name).toBe("Target");
    expect(fetched.last_name).toBe("Bob");
    expect(fetched.user_type).toBe("citizen");
  })

// --- appended from userController.more.integration.test.ts ---
const { resetTestDB: resetControllersDB_MORE } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetControllersDB_MORE()
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


  test('user can retrieve own data by id (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;

    const dao = new UserDAO();
    const username = 'self_user';
    await dao.createUser(username, 'Self', 'User', 'self@int.test', 'pwd', 'citizen');
    const stored = await dao.getUserByUsername(username);

    const self_user = new UserController();
    const requester = { id: stored.id, username: stored.username, user_type: stored.user_type } as any;

    const fetched = await self_user.getUserById(requester, stored.id);
    expect(fetched.username).toBe(username);
    expect(fetched.email).toBe('self@int.test');
    expect(fetched.first_name).toBe("Self");
    expect(fetched.last_name).toBe("User");
    expect(fetched.user_type).toBe("citizen");
  })

  test('non-admin requesting another user is rejected with UserNotAdminError (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;
    const { UserNotAdminError } = require('../../src/errors/userError');

    const dao = new UserDAO();
    // create two users
    await dao.createUser('ctrl_a', 'A', 'A', 'a@int.test', 'pwd', 'citizen');
    await dao.createUser('ctrl_b', 'B', 'B', 'b@int.test', 'pwd', 'citizen');
    const a = await dao.getUserByUsername('ctrl_a');
    const b = await dao.getUserByUsername('ctrl_b');

    const ctrl = new UserController();
    const requester = { id: a.id, username: a.username, user_type: a.user_type } as any;

    await expect(ctrl.getUserById(requester, b.id)).rejects.toBeInstanceOf(UserNotAdminError);
  })

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

  test('deleteUser: non-admin deletes own account; admin deletes another; admin cannot delete admin (real DB)', async () => {
    const UserDAO = require('../../src/dao/userDAO').default;
    const UserController = require('../../src/controllers/userController').default;
    const { UserIsAdminError, UserNotFoundError } = require('../../src/errors/userError');

    const dao = new UserDAO();
    const ctrl = new UserController();

    // non-admin deletes own account
    const username = 'to_delete_self';
    await dao.createUser(username, 'Self', 'Delete', 's.del@int.test', 'pwd', 'citizen');
    const stored = await dao.getUserByUsername(username);
    const caller = { id: stored.id, username: stored.username, user_type: stored.user_type } as any;

    const deleted = await ctrl.deleteUser(caller, stored.id);
    expect(deleted).toBe(true);
    await expect(dao.getUserById(stored.id)).rejects.toBeInstanceOf(UserNotFoundError);

    // admin deletes non-admin
    const targetName = 'admin_deletes_target';
    await dao.createUser(targetName, 'T', 'User', 't.user@int.test', 'pwd', 'citizen');
    const target = await dao.getUserByUsername(targetName);
    const admin = { id: 1, username: 'superadmin', user_type: 'admin' } as any;
    const adminDeleted = await ctrl.deleteUser(admin, target.id);
    expect(adminDeleted).toBe(true);

    // admin cannot delete admin
    const adminName = 'there_can_be_only_one_admin';
    await dao.createUser(adminName, 'A', 'Admin', 'a.admin@int.test', 'pwd', 'admin');
    const adminTarget = await dao.getUserByUsername(adminName);
    await expect(ctrl.deleteUser(admin, adminTarget.id)).rejects.toBeInstanceOf(UserIsAdminError);
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
