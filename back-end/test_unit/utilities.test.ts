import { Utility, DateError } from '../src/utilities'
import { User, UserType } from '../src/components/user'

describe('Utility functions', () => {
  test('isMunicipality/isCitizen/isAdmin detect roles correctly', () => {
    const mun = new User(1, 'mun', 'M', 'U', 'm@example.com', UserType.MUNICIPALITY)
    const cit = new User(2, 'cit', 'C', 'I', 'c@example.com', UserType.CITIZEN)
    const adm = new User(3, 'adm', 'A', 'D', 'a@example.com', UserType.ADMIN)

    expect(Utility.isMunicipality(mun)).toBe(true)
    expect(Utility.isMunicipality(cit)).toBe(false)

    expect(Utility.isCitizen(cit)).toBe(true)
    expect(Utility.isCitizen(adm)).toBe(false)

    expect(Utility.isAdmin(adm)).toBe(true)
    expect(Utility.isAdmin(mun)).toBe(false)
  })

  test('now returns today in YYYY-MM-DD format', () => {
    const today = Utility.now()
    const expected = new Date().toISOString().split('T')[0]
    expect(today).toBe(expected)
    // basic format check
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('DateError contains customMessage and customCode', () => {
    const e = new DateError()
    expect(e).toBeInstanceOf(Error)
    expect(typeof e.customMessage).toBe('string')
    expect(typeof e.customCode).toBe('number')
    expect(e.customCode).toBe(400)
  })

  test('Utility role checks tolerate objects without user_type', () => {
    // Pass a plain object missing user_type
    const obj: any = { username: 'x' }
    expect(Utility.isAdmin(obj)).toBe(false)
    expect(Utility.isCitizen(obj)).toBe(false)
    expect(Utility.isMunicipality(obj)).toBe(false)
  })
})
