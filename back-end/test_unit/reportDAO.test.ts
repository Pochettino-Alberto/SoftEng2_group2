describe('ReportDAO', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('saveReport assigns lastID to report.id and resolves', async () => {
    // Mock db to simulate sqlite3 behaviour
    jest.doMock('../src/dao/db', () => ({
      run: (sql: string, params: any[], cb: any) => {
        // emulate sqlite3 calling callback with `this` containing lastID
        cb.call({ lastID: 123 }, null)
      }
    }))

    const ReportDAO = require('../src/dao/reportDAO').default
    const dao = new ReportDAO()

    const report = {
      category_id: 1,
      reporter_id: 2,
      title: 't',
      description: 'd',
      is_public: true,
      latitude: 0,
      longitude: 0,
      status: 'open',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    }

    const saved = await dao.saveReport(report)
    expect(saved.id).toBe(123)
  })

  it('saveReportPhotos inserts photos when present', async () => {
    jest.doMock('../src/dao/db', () => ({
      get: (sql: string, params: any[], cb: any) => cb(null, {}),
      prepare: (sql: string) => ({ run: jest.fn() })
    }))

    const ReportDAO = require('../src/dao/reportDAO').default
    const dao = new ReportDAO()

    const report = {
      id: 5,
      photos: [
        { position: 0, photo_path: '/p1', photo_public_url: 'u1' },
        { position: 1, photo_path: '/p2', photo_public_url: 'u2' }
      ]
    }

    const saved = await dao.saveReportPhotos(report)
    expect(saved).toBe(report)
  })

  describe('pagination and categories', () => {
    it('getPaginatedReports returns reports and totalCount without filters', async () => {
      const dbGet = jest.fn((sql: string, params: any[], cb: any) => cb(null, { total: 2 }))
      const sampleRow: any = { id: 1, category_id: 1, title: 'a', latitude: 0, longitude: 0, status: 'Resolved', is_public: 1, reporter_id: null, updated_by: null, description: null, status_reason: null, created_at: '2025-01-01', updated_at: '2025-01-01' }
      const dbAll = jest.fn((sql: string, params: any[], cb: any) => cb(null, [sampleRow, sampleRow]))

      jest.doMock('../src/dao/db', () => ({ get: dbGet, all: dbAll }))

      // Mock CommonDao to avoid complex mapping
      const MockCommon = jest.fn().mockImplementation(() => ({
        mapDBrowToReport: async (r: any) => ({ ...r, mapped: true }),
      }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const res = await dao.getPaginatedReports(null, null, null, 10, 0)

      expect(res.totalCount).toBe(2)
      expect(res.reports.length).toBe(2)
      expect(res.reports[0].mapped).toBe(true)
      expect(dbGet).toHaveBeenCalled()
      expect(dbAll).toHaveBeenCalled()
    })

    it('getPaginatedReports applies filters and passes params in correct order', async () => {
      const dbGet = jest.fn((sql: string, params: any[], cb: any) => cb(null, { total: 1 }))
      const sampleRow: any = { id: 2, category_id: 3, title: 'b', latitude: 1, longitude: 1, status: 'Resolved', is_public: 1, reporter_id: null, updated_by: null, description: null, status_reason: null, created_at: '2025-01-01', updated_at: '2025-01-01' }
      const dbAll = jest.fn((sql: string, params: any[], cb: any) => cb(null, [sampleRow]))

      jest.doMock('../src/dao/db', () => ({ get: dbGet, all: dbAll }))

      const MockCommon = jest.fn().mockImplementation(() => ({
        mapDBrowToReport: async (r: any) => ({ ...r, mapped: true }),
      }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const status = 'Resolved'
      const is_public = true
      const category_id = 3

      const res = await dao.getPaginatedReports(status, is_public, category_id, 5, 0)

      expect(res.totalCount).toBe(1)
      expect(res.reports.length).toBe(1)
      // verify the params passed to db.get: status, is_public flag, category_id
      const calledParams = dbGet.mock.calls[0][1]
      expect(calledParams).toEqual([status, 1, category_id])
    })

    it('getAllReportCategories maps rows via CommonDao', async () => {
      const rows: any[] = [{ id: 1, name: 'Road', icon: 'i', description: 'd' }, { id: 2, name: 'Trash', icon: 't', description: 'd2' }]
      const dbAll = jest.fn((sql: string, params: any[], cb: any) => cb(null, rows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const MockCommon = jest.fn().mockImplementation(() => ({
        mapDBrowToReportCategoryObject: (r: any) => ({ id: r.id, name: r.name }),
      }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const cats = await dao.getAllReportCategories()
      expect(cats.length).toBe(2)
      expect(cats[0].name).toBe('Road')
    })
  })
})
