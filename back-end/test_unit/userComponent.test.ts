import { User, UserType } from '../src/components/user'

describe('User component', () => {
  test('getRole returns correct enum for valid strings', () => {
    expect(User.getUserType('citizen')).toBe(UserType.CITIZEN)
    expect(User.getUserType('municipality')).toBe(UserType.MUNICIPALITY)
    expect(User.getUserType('admin')).toBe(UserType.ADMIN)
  })

  test('getRole returns null and logs error for invalid string', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = User.getUserType('invalid_role')
    expect(res).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  test('constructor sets default role to CITIZEN when role omitted', () => {
    const u = new User(0, 'u1', 'First', 'Last', 'u@example.com')
    expect(u.user_type).toBe(UserType.CITIZEN)
  })
})
