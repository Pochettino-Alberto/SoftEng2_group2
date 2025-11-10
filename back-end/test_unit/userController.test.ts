import UserController from '../src/controllers/userController'
import UserDAO from '../src/dao/userDAO'
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError } from '../src/errors/userError'
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
