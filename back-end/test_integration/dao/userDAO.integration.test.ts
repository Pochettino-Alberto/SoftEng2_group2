import { User, UserType, UserRole, RoleType } from '../../src/components/user';
import request from 'supertest';

// Integration tests for UserDAO using real sqlite test DB (dao folder)
const { resetTestDB: resetDBDao } = require('../helpers/resetTestDB')

beforeAll(async () => {
  // ensure NODE_ENV=test so src/dao/db.ts picks the test DB
  process.env.NODE_ENV = 'test'
  await resetDBDao()
  const { dbReady } = require('../../src/dao/db')
  await dbReady
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

describe('User Component Coverage', () => {
    test('User.getUserType returns null for invalid role string', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const result = User.getUserType('invalid_role');
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Could not parse the role-string"));
        consoleSpy.mockRestore();
    });

    test('UserRole constructor handles RoleType enum', () => {
        const role = new UserRole(1, RoleType.MAINTAINER, 'label', 'desc');
        expect(role.role_type).toBe(RoleType.MAINTAINER);
    });

    test('UserRole constructor handles string inputs', () => {
        const r1 = new UserRole(1, 'publicRelations_officer', 'l', 'd');
        expect(r1.role_type).toBe(RoleType.REL_OFFICER);

        const r2 = new UserRole(1, 'external_maintainer', 'l', 'd');
        expect(r2.role_type).toBe(RoleType.MAINTAINER);

        const r3 = new UserRole(1, 'technical_officer', 'l', 'd');
        expect(r3.role_type).toBe(RoleType.TECH_OFFICER);
    });
});

describe('UserDAO Coverage Integration', () => {
    let UserDAO: any;
    let db: any;
    let dao: any;
    let UserAlreadyExistsError: any;

    beforeEach(() => {
        jest.resetModules();
        // We need to require these after resetModules to ensure we get fresh instances/mocks if needed
        db = require('../../src/dao/db').default;
        const userDAOModule = require('../../src/dao/userDAO');
        UserDAO = userDAOModule.default;
        
        // Re-import error class to match the one used by UserDAO
        const userErrorModule = require('../../src/errors/userError');
        UserAlreadyExistsError = userErrorModule.UserAlreadyExistsError;

        dao = new UserDAO();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('getIsUserAuthenticated returns false if user not found', async () => {
        // Mock db.get to return undefined (no row)
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(null, undefined);
            return db;
        });

        const result = await dao.getIsUserAuthenticated('nonexistent', 'pass');
        expect(result).toBe(false);
    });

    test('getIsUserAuthenticated returns false if salt is missing', async () => {
        // Mock db.get to return row without salt
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(null, { username: 'user', password_hash: 'hash' }); // no salt
            return db;
        });

        const result = await dao.getIsUserAuthenticated('user', 'pass');
        expect(result).toBe(false);
    });

    test('getIsUserAuthenticated rejects on DB error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(new Error('DB Error'), null);
            return db;
        });

        await expect(dao.getIsUserAuthenticated('user', 'pass')).rejects.toThrow('DB Error');
    });

    test('createUser rejects with UserAlreadyExistsError on unique constraint violation', async () => {
        const spyRun = jest.spyOn(db, 'run').mockImplementation(function (this: any, sql: any, params: any, cb: any) {
            const err = new Error('UNIQUE constraint failed: users.username');
            cb.call(this, err);
            return db;
        });
        // suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(dao.createUser('dup', 'N', 'S', 'e@e.com', 'pw', 'citizen'))
            .rejects.toBeInstanceOf(UserAlreadyExistsError);
        
        consoleSpy.mockRestore();
    });

    test('createUser rejects on other DB errors', async () => {
        const spyRun = jest.spyOn(db, 'run').mockImplementation(function (this: any, sql: any, params: any, cb: any) {
            cb.call(this, new Error('Other DB Error'));
            return db;
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(dao.createUser('u', 'N', 'S', 'e@e.com', 'pw', 'citizen'))
            .rejects.toThrow('Other DB Error');
            
        consoleSpy.mockRestore();
    });

    test('getUserByUsername rejects on DB error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(new Error('DB Error'), null);
            return db;
        });

        await expect(dao.getUserByUsername('u')).rejects.toThrow('DB Error');
    });

    test('getUserById rejects on DB error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(new Error('DB Error'), null);
            return db;
        });

        await expect(dao.getUserById(1)).rejects.toThrow('DB Error');
    });

    test('deleteUserById rejects on DB error', async () => {
        const spyRun = jest.spyOn(db, 'run').mockImplementation(function (this: any, sql: any, params: any, cb: any) {
            cb.call(this, new Error('DB Error'));
            return db;
        });

        await expect(dao.deleteUserById(1)).rejects.toThrow('DB Error');
    });

    test('updateUserInfo rejects on DB error', async () => {
        const spyRun = jest.spyOn(db, 'run').mockImplementation(function (this: any, sql: any, params: any, cb: any) {
            cb.call(this, new Error('DB Error'));
            return db;
        });

        const user = new User(1, 'u', 'n', 's', 'e', UserType.CITIZEN);
        await expect(dao.updateUserInfo(1, user)).rejects.toThrow('DB Error');
    });

    test('getRoles rejects on DB error', async () => {
        const spyAll = jest.spyOn(db, 'all').mockImplementation((sql: any, params: any, cb: any) => {
            cb(new Error('DB Error'), null);
            return db;
        });

        await expect(dao.getRoles(1)).rejects.toThrow('DB Error');
    });

    test('assignRoles rejects on prepare/run error', async () => {
        // Mock db.serialize to execute callback immediately
        const spySerialize = jest.spyOn(db, 'serialize').mockImplementation((cb: any) => cb());
        
        // Mock prepare to return a stmt that errors on run
        const mockStmt = {
            run: jest.fn((params, cb) => cb(new Error('Stmt Error'))),
            finalize: jest.fn((cb) => { if(cb) cb() })
        };
        const spyPrepare = jest.spyOn(db, 'prepare').mockReturnValue(mockStmt);

        await expect(dao.assignRoles(1, [10])).rejects.toThrow('Stmt Error');
    });

    test('assignRoles rejects on finalize error', async () => {
        const spySerialize = jest.spyOn(db, 'serialize').mockImplementation((cb: any) => cb());
        
        const mockStmt = {
            run: jest.fn((params, cb) => cb(null)),
            finalize: jest.fn((cb) => cb(new Error('Finalize Error')))
        };
        const spyPrepare = jest.spyOn(db, 'prepare').mockReturnValue(mockStmt);

        await expect(dao.assignRoles(1, [10])).rejects.toThrow('Finalize Error');
    });

    test('removeRoles rejects on prepare/run error', async () => {
        const spySerialize = jest.spyOn(db, 'serialize').mockImplementation((cb: any) => cb());
        
        const mockStmt = {
            run: jest.fn((params, cb) => cb(new Error('Stmt Error'))),
            finalize: jest.fn((cb) => { if(cb) cb() })
        };
        const spyPrepare = jest.spyOn(db, 'prepare').mockReturnValue(mockStmt);

        await expect(dao.removeRoles(1, [10])).rejects.toThrow('Stmt Error');
    });

    test('removeRoles rejects on finalize error', async () => {
        const spySerialize = jest.spyOn(db, 'serialize').mockImplementation((cb: any) => cb());
        
        const mockStmt = {
            run: jest.fn((params, cb) => cb(null)),
            finalize: jest.fn((cb) => cb(new Error('Finalize Error')))
        };
        const spyPrepare = jest.spyOn(db, 'prepare').mockReturnValue(mockStmt);

        await expect(dao.removeRoles(1, [10])).rejects.toThrow('Finalize Error');
    });

    test('getPaginatedUsers rejects on count query error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            if (sql.includes('COUNT')) cb(new Error('Count Error'), null);
            else cb(null, {});
            return db;
        });

        await expect(dao.getPaginatedUsers(null, null, null, null, 10, 0)).rejects.toThrow('Count Error');
    });

    test('getPaginatedUsers rejects on data query error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            if (sql.includes('COUNT')) cb(null, { total: 1 });
            else cb(null, {});
            return db;
        });
        const spyAll = jest.spyOn(db, 'all').mockImplementation((sql: any, params: any, cb: any) => {
            cb(new Error('Data Error'), null);
            return db;
        });

        await expect(dao.getPaginatedUsers(null, null, null, null, 10, 0)).rejects.toThrow('Data Error');
    });

    test('getUserByUsername with addRoles=true returns user with roles', async () => {
        const mockUser = new User(1, 'u', 'f', 'l', 'e', UserType.CITIZEN);
        // Mock db.get to return a row
        const spyGet = jest.spyOn(db, 'get').mockImplementation((sql: any, params: any, cb: any) => {
            cb(null, { id: 1 });
            return db;
        });
        
        // Mock commonDao
        dao.commonDao.mapDBrowToUserObjectWithRoles = jest.fn().mockResolvedValue(mockUser);

        const result = await dao.getUserByUsername('u', true);
        expect(result).toBe(mockUser);
        expect(dao.commonDao.mapDBrowToUserObjectWithRoles).toHaveBeenCalled();
    });

    test('getPaginatedUsers rejects on synchronous error', async () => {
        const spyGet = jest.spyOn(db, 'get').mockImplementation(() => {
            throw new Error('Sync Error');
        });

        await expect(dao.getPaginatedUsers(null, null, null, null, 10, 0)).rejects.toThrow('Sync Error');
    });
});
