import { User, UserType, UserRole, RoleType } from '../src/components/user'

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

  describe('UserRole component', () => {
    it('constructor assigns fields correctly with RoleType enum', () => {
      const role = new UserRole(1, RoleType.TECH_OFFICER, 'Tech Officer', 'Handles technical issues')
      expect(role.id).toBe(1)
      expect(role.role_type).toBe(RoleType.TECH_OFFICER)
      expect(role.label).toBe('Tech Officer')
      expect(role.description).toBe('Handles technical issues')
    })

    it('constructor maps string role types to RoleType enum', () => {
      const r1 = new UserRole(0, 'publicRelations_officer', 'PR', 'desc')
      expect(r1.role_type).toBe(RoleType.REL_OFFICER)

      const r2 = new UserRole(0, 'external_maintainer', 'Maint', 'desc')
      expect(r2.role_type).toBe(RoleType.MAINTAINER)

      const r3 = new UserRole(0, 'technical_officer', 'Tech', 'desc')
      expect(r3.role_type).toBe(RoleType.TECH_OFFICER)
    })
  })
})
