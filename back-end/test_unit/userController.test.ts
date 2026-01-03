import UserController from '../src/controllers/userController'
import UserDAO from '../src/dao/userDAO'
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, UserIsAdminError, UnauthorizedUserError } from '../src/errors/userError'
import { Utility } from '../src/utilities'
import { User } from '../src/components/user'

jest.mock('../src/dao/userDAO')

describe('UserController', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  test('createUser rejects when username already in use', async () => {
    jest.spyOn(UserController.prototype, 'usernameAlreadyInUse').mockResolvedValue(true)
    const ctrl = new UserController()
    await expect(ctrl.createUser('u','n','s','e','p','citizen')).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })

  test('createUser resolves true when username not in use and DAO creates user', async () => {
    jest.spyOn(UserController.prototype, 'usernameAlreadyInUse').mockResolvedValue(false)
    jest.spyOn(UserDAO.prototype, 'createUser' as any).mockResolvedValue(true)
    const ctrl = new UserController()
    await expect(ctrl.createUser('u2','n','s','e','p','citizen')).resolves.toBe(true)
  })

  test('getUserByUsername resolves when caller is admin', async () => {
    const targetUser = { id: 10, username: 'target' }
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue(targetUser as any)
    const ctrl = new UserController()
    const res = await ctrl.getUserByUsername('target', { user_type: 'admin' })
    expect(res).toBe(targetUser)
  })

  test('getUserByUsername resolves when caller requests own data', async () => {
    const targetUser = { id: 10, username: 'me' }
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue(targetUser as any)
    const ctrl = new UserController()
    const res = await ctrl.getUserByUsername('me', { username: 'me' })
    expect(res).toBe(targetUser)
  })

  test('getUserByUsername rejects with UserNotAdminError when unauthorized', async () => {
    const targetUser = { id: 10, username: 'other' }
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue(targetUser as any)
    const ctrl = new UserController()
    await expect(ctrl.getUserByUsername('other', { username: 'me', user_type: 'citizen' })).rejects.toBeInstanceOf(UserNotAdminError)
  })

  test('usernameAlreadyInUse resolves true when DAO finds user', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockResolvedValue({} as any)
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('x')).resolves.toBe(true)
  })

  test('usernameAlreadyInUse resolves false when DAO throws UserNotFoundError', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValue(new UserNotFoundError())
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('x')).resolves.toBe(false)
  })

  test('usernameAlreadyInUse rejects when DAO throws other error', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserByUsername').mockRejectedValue(new Error('db fail'))
    const ctrl = new UserController()
    await expect(ctrl.usernameAlreadyInUse('x')).rejects.toThrow('db fail')
  })

  test('updateUserInfo resolves when user updates own info', async () => {
    const userObj = { id: 5, username: 'user5' }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(userObj as any)
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValue(userObj as any)
    const ctrl = new UserController()
    const res = await ctrl.updateUserInfo(5, userObj as any, { id: 5 })
    expect(res).toBe(userObj)
  })

  test('updateUserInfo resolves when admin updates another user', async () => {
    const userObj = { id: 5 }
    jest.spyOn(UserDAO.prototype, 'getUserById').mockResolvedValue(userObj as any)
    jest.spyOn(UserDAO.prototype, 'updateUserInfo').mockResolvedValue(userObj as any)
    const ctrl = new UserController()
    const res = await ctrl.updateUserInfo(5, userObj as any, { user_type: 'admin' })
    expect(res).toBe(userObj)
  })

  test('updateUserInfo rejects UnauthorizedUserError when non-admin updates another user', async () => {
    const ctrl = new UserController()
    await expect(ctrl.updateUserInfo(5, {} as any, { id: 1, user_type: 'citizen' })).rejects.toBeInstanceOf(UnauthorizedUserError)
  })

  test('updateUserInfo propagates DAO errors from getUserById', async () => {
    jest.spyOn(UserDAO.prototype, 'getUserById').mockRejectedValue(new Error('fail'))
    const ctrl = new UserController()
    await expect(ctrl.updateUserInfo(5, {} as any, { user_type: 'admin' })).rejects.toThrow('fail')
  })

  describe('UserController - extra coverage', () => {
    test('getPaginatedUsers via DAO returns mapped users and count', async () => {
      const mockResult = { users: [], totalCount: 10 }
      const spy = jest.spyOn(UserDAO.prototype, 'getPaginatedUsers').mockResolvedValue(mockResult as any)
      const ctrl = new UserController()
      const res = await ctrl.getPaginatedUsers('F', 'L', 'E', 'R', 10, 1)
      expect(res).toBe(mockResult)
      expect(spy).toHaveBeenCalledWith('F', 'L', 'E', 'R', 10, 0)
    })

    test('getPaginatedUsers applies default pagination when params are missing', async () => {
      const ctrl = new UserController();
      const mockPaginated: { users: User[], totalCount: number } = { users: [], totalCount: 0 };
      const pagSpy = jest.spyOn(UserDAO.prototype, 'getPaginatedUsers').mockResolvedValue(mockPaginated);

      await ctrl.getPaginatedUsers(null, null, null, null, null, null);
      expect(pagSpy).toHaveBeenCalledWith(null, null, null, null, 10, 0);
    })

    test('setUserRoles computes toAdd and toRemove and calls DAO assign/remove', async () => {
      jest.spyOn(UserDAO.prototype, 'getRoles' as any).mockResolvedValue([{ id: 1 }, { id: 2 }])
      const assignSpy = jest.spyOn(UserDAO.prototype, 'assignRoles' as any).mockResolvedValue(undefined)
      const removeSpy = jest.spyOn(UserDAO.prototype, 'removeRoles' as any).mockResolvedValue(undefined)

      const ctrl = new UserController()
      await expect(ctrl.setUserRoles(10, [2,3])).resolves.toBeUndefined()

      expect(assignSpy).toHaveBeenCalledWith(10, [3])
      expect(removeSpy).toHaveBeenCalledWith(10, [1])
    })

    test('assignRolesToUser calls DAO.assignRoles and resolves', async () => {
      const assignSpy = jest.spyOn(UserDAO.prototype, 'assignRoles' as any).mockResolvedValue(undefined)
      const ctrl = new UserController()
      await expect(ctrl.assignRolesToUser(5, [4,5])).resolves.toBeUndefined()
      expect(assignSpy).toHaveBeenCalledWith(5, [4,5])
    })

    test('assignRolesToUser rejects when DAO.assignRoles throws', async () => {
      jest.spyOn(UserDAO.prototype, 'assignRoles' as any).mockRejectedValue(new Error('boom'))
      const ctrl = new UserController()
      await expect(ctrl.assignRolesToUser(5, [4])).rejects.toThrow('boom')
    })

    test('getRoles delegates to DAO and returns rows', async () => {
      const rows = [{ RoleID: 9, RoleName: 'X' }]
      jest.spyOn(UserDAO.prototype, 'getRoles' as any).mockResolvedValue(rows)
      const ctrl = new UserController()
      await expect(ctrl.getRoles(3)).resolves.toBe(rows)
    })

    test('getRoles rejects when DAO.getRoles throws', async () => {
      jest.spyOn(UserDAO.prototype, 'getRoles' as any).mockRejectedValue(new Error('fail'))
      const ctrl = new UserController()
      await expect(ctrl.getRoles(1)).rejects.toThrow('fail')
    })
  })
})