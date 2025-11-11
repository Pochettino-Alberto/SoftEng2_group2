import UserController from '../src/controllers/userController'
import UserDAO from '../src/dao/userDAO'
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, UserIsAdminError, UnauthorizedUserError } from '../src/errors/userError'
import { Utility } from '../src/utilities'

jest.mock('../src/dao/userDAO')

describe('UserController', () => {
  afterEach(() => {
    // restore original implementations of spied methods, then reset mock state
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  test('createUser rejects when username already in use', async () => {
    // make usernameAlreadyInUse return true
    jest.spyOn(UserController.prototype, 'usernameAlreadyInUse').mockResolvedValue(true)

    const ctrl = new UserController()
    await expect(ctrl.createUser('u','n','s','e','p','citizen')).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })

  test('createUser resolves true when username not in use and DAO creates user', async () => {
    jest.spyOn(UserController.prototype, 'usernameAlreadyInUse').mockResolvedValue(false)
    // mock DAO.createUser to resolve true
    jest.spyOn(UserDAO.prototype, 'createUser' as any).mockResolvedValue(true)

    const ctrl = new UserController()
    await expect(ctrl.createUser('u2','n','s','e','p','citizen')).resolves.toBe(true)
  })
  
  test('getUserByUsername resolves when caller is admin', async () => {
    // prepare a fake user returned by DAO
    const returned = { id: 1, username: 'target', first_name: 'T', last_name: 'User', email: 't@example.com', user_type: 'admin' }
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue(returned as any)
    // spy Utility.isAdmin to return true
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 2, username: 'caller', user_type: 'admin' } as any
    await expect(ctrl.getUserByUsername(caller, 'target')).resolves.toEqual(returned)
  })

  test('getUserByUsername resolves when caller requests own data', async () => {
    const returned = { id: 3, username: 'self', first_name: 'S', last_name: 'Elf', email: 's@example.com', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue(returned as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)

    const ctrl = new UserController()
    const caller = { id: 3, username: 'self', user_type: 'citizen' } as any
    await expect(ctrl.getUserByUsername(caller, 'self')).resolves.toEqual(returned)
  })

  test('getUserByUsername rejects with UserNotAdminError when unauthorized', async () => {
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)
    const ctrl = new UserController()
    const caller = { id: 4, username: 'other', user_type: 'citizen' } as any
    await expect(ctrl.getUserByUsername(caller, 'target')).rejects.toBeInstanceOf(UserNotAdminError)
  })

  test('usernameAlreadyInUse resolves true when DAO finds user', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue({ username: 'found' } as any)
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('found')).resolves.toBe(true)
  })

  test('usernameAlreadyInUse resolves false when DAO throws UserNotFoundError', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValue(new UserNotFoundError())
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('missing')).resolves.toBe(false)
  })

  test('usernameAlreadyInUse rejects when DAO throws other error', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValue(new Error('DB fail'))
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('err')).rejects.toBeInstanceOf(Error)
  })

  // Tests for deleteUser
  test('deleteUser resolves true when non-admin deletes own account and DAO reports deletion', async () => {
    jest.spyOn(UserDAO.prototype, 'deleteUserById').mockResolvedValue(true)
    const ctrl = new UserController()
    const caller = { id: 10, username: 'bob', user_type: 'citizen' } as any
    await expect(ctrl.deleteUser(caller, 10)).resolves.toBe(true)
  })

  test('deleteUser rejects with UserNotFoundError when non-admin deletes own account but DAO reports false', async () => {
    jest.spyOn(UserDAO.prototype, 'deleteUserById').mockResolvedValue(false)
    const ctrl = new UserController()
    const caller = { id: 12, username: 'alice', user_type: 'citizen' } as any
    await expect(ctrl.deleteUser(caller, 12)).rejects.toBeInstanceOf(UserNotFoundError)
  })

  test('deleteUser rejects with UserNotAdminError when non-admin tries to delete other user', async () => {
    const ctrl = new UserController()
    const caller = { id: 8, username: 'other', user_type: 'citizen' } as any
    await expect(ctrl.deleteUser(caller, 9)).rejects.toBeInstanceOf(UserNotAdminError)
  })

  test('deleteUser resolves true when admin deletes non-admin user', async () => {
    const target = { id: 20, username: 'victim', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(target as any)
    jest.spyOn(UserDAO.prototype, 'deleteUserById').mockResolvedValue(true)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'admin', user_type: 'admin' } as any
    await expect(ctrl.deleteUser(caller, 20)).resolves.toBe(true)
  })

  test('deleteUser rejects with UserIsAdminError when admin tries to delete an admin user', async () => {
    const target = { id: 2, username: 'admin2', user_type: 'admin' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(target as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'super', user_type: 'admin' } as any
    await expect(ctrl.deleteUser(caller, 2)).rejects.toBeInstanceOf(UserIsAdminError)
  })

  test('deleteUser propagates UserNotFoundError when DAO.getUserById throws', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserById').mockRejectedValue(new UserNotFoundError())
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'admin', user_type: 'admin' } as any
    await expect(ctrl.deleteUser(caller, 999)).rejects.toBeInstanceOf(UserNotFoundError)
  })

  // Tests for updateUserInfo (controller)
  test('updateUserInfo resolves when user updates own info', async () => {
    const fetched = { id: 7, username: 'joe', first_name: 'Old', last_name: 'Name', email: 'old@example.com', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(fetched as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)

    const updatedReturned = { ...fetched, username: 'joeNew', first_name: 'JoeNew' }
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValue(updatedReturned as any)

    const ctrl = new UserController()
    const caller = { id: 7, username: 'joe', user_type: 'citizen' } as any
    await expect(ctrl.updateUserInfo(caller, 7, 'joeNew', 'JoeNew', undefined, undefined, undefined)).resolves.toEqual(updatedReturned)
  })

  test('updateUserInfo resolves when admin updates another user', async () => {
    const fetched = { id: 21, username: 'target', first_name: 'T', last_name: 'U', email: 't@example.com', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(fetched as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const updatedReturned = { ...fetched, first_name: 'Updated' }
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValue(updatedReturned as any)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'admin', user_type: 'admin' } as any
    await expect(ctrl.updateUserInfo(caller, 21, undefined, 'Updated')).resolves.toEqual(updatedReturned)
  })

  test('updateUserInfo rejects UnauthorizedUserError when non-admin updates another user', async () => {
    const fetched = { id: 30, username: 'victim', first_name: 'V', last_name: 'User', email: 'v@example.com', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(fetched as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)

    const ctrl = new UserController()
    const caller = { id: 31, username: 'other', user_type: 'citizen' } as any
    await expect(ctrl.updateUserInfo(caller, 30, 'hacker')).rejects.toBeInstanceOf(UnauthorizedUserError)
  })

  test('updateUserInfo propagates DAO errors from getUserById', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserById').mockRejectedValue(new UserNotFoundError())
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'admin', user_type: 'admin' } as any
    await expect(ctrl.updateUserInfo(caller, 999, 'x')).rejects.toBeInstanceOf(UserNotFoundError)
  })

  // Tests for getUserById
  test('getUserById resolves when caller is admin', async () => {
    const returned = { id: 11, username: 'targetA', first_name: 'A', last_name: 'User', email: 'a@example.com', user_type: 'admin' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(returned as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 2, username: 'caller', user_type: 'admin' } as any
    await expect(ctrl.getUserById(caller, 11)).resolves.toEqual(returned)
  })

  test('getUserById resolves when caller requests own data', async () => {
    const returned = { id: 5, username: 'selfy', first_name: 'S', last_name: 'Elf', email: 's@example.com', user_type: 'citizen' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(returned as any)
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)

    const ctrl = new UserController()
    const caller = { id: 5, username: 'selfy', user_type: 'citizen' } as any
    await expect(ctrl.getUserById(caller, 5)).resolves.toEqual(returned)
  })

  test('getUserById rejects with UserNotAdminError when unauthorized', async () => {
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(false)
    const ctrl = new UserController()
    const caller = { id: 8, username: 'other', user_type: 'citizen' } as any
    await expect(ctrl.getUserById(caller, 9)).rejects.toBeInstanceOf(UserNotAdminError)
  })

  test('getUserById propagates DAO errors', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserById').mockRejectedValue(new UserNotFoundError())
    jest.spyOn(Utility, 'isAdmin').mockReturnValue(true)

    const ctrl = new UserController()
    const caller = { id: 1, username: 'admin', user_type: 'admin' } as any
    await expect(ctrl.getUserById(caller, 123)).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
