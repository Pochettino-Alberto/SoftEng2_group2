import CommonDao from '../src/dao/commonDAO'

// Mock db used by CommonDao
jest.mock('../src/dao/db', () => ({
  get: jest.fn(),
  all: jest.fn()
}))

const db = require('../src/dao/db')

describe('CommonDao', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  test('mapDBrowToUserObject builds a User correctly', () => {
    const dao = new CommonDao()
    const row: any = { id: 10, username: 'u', first_name: 'F', last_name: 'L', email: 'e@e', user_type: 'municipality' }
    const user = dao.mapDBrowToUserObject(row)
    expect(user.id).toBe(10)
    expect(user.username).toBe('u')
    expect(user.email).toBe('e@e')
  })

  test('mapDBrowToReportCategoryObject builds category', () => {
    const dao = new CommonDao()
    const row: any = { id: 5, name: 'Road', icon: 'i', description: 'd' }
    const cat = dao.mapDBrowToReportCategoryObject(row)
    expect(cat.id).toBe(5)
    expect(cat.name).toBe('Road')
    expect(cat.icon).toBe('i')
  })

  test('mapDBrowToReportPhoto builds photo object', () => {
    const dao = new CommonDao()
    // use numeric photo_id to match ReportPhoto.position typing in current mapping
    const row: any = { id: 7, report_id: 3, photo_id: 2, position: 2 }
    const photo = dao.mapDBrowToReportPhoto(row)
    expect(photo.id).toBe(7)
    expect(photo.report_id).toBe(3)
    // depending on mapping, position should be present
    expect(photo.position).toBeDefined()
  })

  test('getById resolves with mapped object (sync mapper)', async () => {
    const dao = new CommonDao()
    const row = { id: 2, name: 'X' }
    db.get.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(null, row) })

    const mapper = (r: any) => ({ id: r.id, name: r.name })
    const res = await dao.getById('some_table', 2, mapper)
    expect(res).toEqual({ id: 2, name: 'X' })
  })

  test('getById resolves with mapped object (async mapper)', async () => {
    const dao = new CommonDao()
    const row = { id: 3, name: 'Y' }
    db.get.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(null, row) })

    const mapper = async (r: any) => Promise.resolve({ id: r.id, name: r.name })
    const res = await dao.getById('other_table', 3, mapper)
    expect(res).toEqual({ id: 3, name: 'Y' })
  })

  test('getById rejects when row not found', async () => {
    const dao = new CommonDao()
    db.get.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(null, undefined) })
    await expect(dao.getById('missing', 99, (r:any)=>r)).rejects.toThrow('missing with id 99 not found')
  })

  test('getById rejects when db error', async () => {
    const dao = new CommonDao()
    db.get.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(new Error('dbfail')) })
    await expect(dao.getById('t', 1, (r:any)=>r)).rejects.toThrow('dbfail')
  })

  test('getBy returns mapped array without whereClause', async () => {
    const dao = new CommonDao()
    const rows = [{ id: 1, val: 'a' }, { id: 2, val: 'b' }]
    db.all.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(null, rows) })

    const mapper = (r: any) => ({ id: r.id, val: r.val })
    const res = await dao.getBy('mytable', mapper)
    expect(res).toEqual([{ id: 1, val: 'a' }, { id: 2, val: 'b' }])
  })

  test('getBy returns mapped array with whereClause and preserves order', async () => {
    const dao = new CommonDao()
    const rows = [{ id: 9, pos: 1 }, { id: 8, pos: 2 }]
    let capturedSql = ''
    db.all.mockImplementationOnce((sql: string, params: any[], cb: Function) => { capturedSql = sql; cb(null, rows) })

    const mapper = (r: any) => ({ id: r.id, pos: r.pos })
    const res = await dao.getBy('report_photos', mapper, 'report_id = 5 ORDER BY position ASC')
    expect(res.length).toBe(2)
    expect(capturedSql).toContain('WHERE report_id = 5 ORDER BY position ASC')
  })

  test('getBy rejects on db error', async () => {
    const dao = new CommonDao()
    db.all.mockImplementationOnce((sql: string, params: any[], cb: Function) => { cb(new Error('allfail')) })
    await expect(dao.getBy('t', (r:any)=>r)).rejects.toThrow('allfail')
  })

  test('mapDBrowToReport populates sub-objects when getSubClasses true', async () => {
    const dao = new CommonDao()

    const dbRow: any = {
      id: 12,
      category_id: 2,
      title: 'T',
      latitude: 1.1,
      longitude: 2.2,
      status: 'Open',
      is_public: 1,
      reporter_id: 7,
      updated_by: 8,
      description: 'd',
      status_reason: 'r',
      created_at: '2020-01-01',
      updated_at: '2020-01-02'
    }

    const categoryRow = { id: 2, name: 'Road', icon: 'i', description: 'd' }
    const reporterRow = { id: 7, username: 'rep', first_name: 'R', last_name: 'P', email: 'r@e', user_type: 'citizen' }
    const updatedRow = { id: 8, username: 'upd', first_name: 'U', last_name: 'D', email: 'u@e', user_type: 'municipality' }
    // ensure numeric photo_id to avoid type mismatch with ReportPhoto.position
    const photoRows = [ { id: 1, report_id: 12, photo_id: 1, position: 1 } ]

    // db.get handles getById for different tables
    db.get.mockImplementation((sql: string, params: any[], cb: Function) => {
      if (sql.includes('report_categories')) cb(null, categoryRow)
      else if (sql.includes('FROM users')) {
        // This covers selecting from users; we need to return reporter or updated depending on id
        const idParam = params[0]
        if (idParam === 7) cb(null, reporterRow)
        else if (idParam === 8) cb(null, updatedRow)
        else cb(null, undefined)
      } else cb(null, undefined)
    })

    db.all.mockImplementation((sql: string, params: any[], cb: Function) => {
      if (sql.includes('report_photos')) cb(null, photoRows)
      else cb(null, [])
    })

    const report = await dao.mapDBrowToReport(dbRow, true)
    expect(report.id).toBe(12)
    expect(report.category).toBeDefined()
    expect(report.reporter).toBeDefined()
    expect(report.updated).toBeDefined()
    expect(report.photos).toHaveLength(1)
  })

  test('mapDBrowToReport leaves sub-objects empty when getSubClasses false', async () => {
    const dao = new CommonDao()
    const dbRow: any = { id: 13, category_id: null, reporter_id: null }
    const report = await dao.mapDBrowToReport(dbRow, false)
    expect(report.id).toBe(13)
    // when getSubClasses is false sub-objects (photos/category) are not populated
    expect(report.photos).toBeUndefined()
    expect(report.category).toBeUndefined()
  })
})
