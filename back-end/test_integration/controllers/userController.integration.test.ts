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
})
