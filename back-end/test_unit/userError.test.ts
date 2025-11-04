import {
  UserNotFoundError,
  UserNotManagerError,
  UserNotCustomerError,
  UserAlreadyExistsError,
  UserNotAdminError,
  UserIsAdminError,
  UnauthorizedUserError,
} from '../src/errors/userError'

describe('User errors', () => {
  test('UserNotFoundError has correct customCode and message', () => {
    const e = new UserNotFoundError()
    expect(e).toBeInstanceOf(Error)
    expect(e.customCode).toBe(404)
    expect(typeof e.customMessage).toBe('string')
  })

  test('UserNotManagerError and UserNotCustomerError have 401', () => {
    const e1 = new UserNotManagerError()
    const e2 = new UserNotCustomerError()
    expect(e1.customCode).toBe(401)
    expect(e2.customCode).toBe(401)
  })

  test('UserAlreadyExistsError has 409', () => {
    const e = new UserAlreadyExistsError()
    expect(e.customCode).toBe(409)
  })

  test('Admin-related errors and UnauthorizedUserError have 401', () => {
    const a = new UserNotAdminError()
    const b = new UserIsAdminError()
    const c = new UnauthorizedUserError()
    expect(a.customCode).toBe(401)
    expect(b.customCode).toBe(401)
    expect(c.customCode).toBe(401)
  })
})
