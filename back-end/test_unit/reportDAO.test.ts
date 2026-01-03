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

  describe('ReportDAO extra tests', () => {
    beforeEach(() => {
      jest.resetModules()
    })

    it('saveReport rejects when db.run errors', async () => {
      jest.doMock('../src/dao/db', () => ({
        run: (sql: string, params: any[], cb: any) => cb(new Error('db error'))
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

      await expect(dao.saveReport(report)).rejects.toThrow('db error')
    })

    it('saveReportPhotos resolves when no photos present', async () => {
      jest.doMock('../src/dao/db', () => ({
        get: (sql: string, params: any[], cb: any) => cb(null, {}),
        prepare: (sql: string) => ({ run: jest.fn(), finalize: jest.fn() })
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const report = { id: 5 }

      const saved = await dao.saveReportPhotos(report)
      expect(saved).toBe(report)
    })

    it('saveReportPhotos rejects when db.get returns error', async () => {
      jest.doMock('../src/dao/db', () => ({
        get: (sql: string, params: any[], cb: any) => cb(new Error('get error'))
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.saveReportPhotos({ id: 1 })).rejects.toThrow('get error')
    })

    it('getReportById delegates to CommonDao.getById and returns mapped object', async () => {
      const MockCommon = jest.fn().mockImplementation(() => ({
        getById: async (table: string, id: number, mapFn: any) => ({ id, mapped: true })
      }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const res = await dao.getReportById(7)
      expect(res).toEqual({ id: 7, mapped: true })
    })

    it('getPaginatedReports rejects when count query errors', async () => {
      jest.doMock('../src/dao/db', () => ({
        get: (sql: string, params: any[], cb: any) => cb(new Error('count failed'))
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getPaginatedReports(null, null, null, 10, 0)).rejects.toThrow('count failed')
    })

    it('getPaginatedReports rejects when data query errors', async () => {
      const dbGet = jest.fn((sql: string, params: any[], cb: any) => cb(null, { total: 1 }))
      const dbAll = jest.fn((sql: string, params: any[], cb: any) => cb(new Error('data failed')))
      jest.doMock('../src/dao/db', () => ({ get: dbGet, all: dbAll }))

      const MockCommon = jest.fn().mockImplementation(() => ({
        mapDBrowToReport: async (r: any) => ({ ...r })
      }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getPaginatedReports(null, null, null, 5, 0)).rejects.toThrow('data failed')
    })

    it('getAllReportCategories rejects when db.all errors', async () => {
      jest.doMock('../src/dao/db', () => ({ all: (sql: string, params: any[], cb: any) => cb(new Error('all failed')) }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getAllReportCategories()).rejects.toThrow('all failed')
    })

    it('updateReportStatus resolves when db.run reports changes', async () => {
      // simulate successful update: this.changes = 1
      jest.doMock('../src/dao/db', () => ({
        run: (sql: string, params: any[], cb: any) => cb.call({ changes: 1 }, null)
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.updateReportStatus(2, 'Assigned', undefined)).resolves.toBeUndefined()
    })

    it('updateReportStatus rejects when no rows changed', async () => {
      // simulate update affecting 0 rows
      jest.doMock('../src/dao/db', () => ({
        run: (sql: string, params: any[], cb: any) => cb.call({ changes: 0 }, null)
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.updateReportStatus(999, 'Assigned')).rejects.toThrow('The report does not exist')
    })

    it('updateReportStatus rejects on db error', async () => {
      jest.doMock('../src/dao/db', () => ({
        run: (sql: string, params: any[], cb: any) => cb(new Error('db-run-fail'))
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.updateReportStatus(3, 'Rejected', 'nope')).rejects.toThrow('db-run-fail')
    })

  })

  describe('ReportDAO photos async and error branches', () => {
    beforeEach(() => jest.resetModules())

    it('saveReportPhotos waits for run callbacks and finalize', async () => {
      // simulate db.get success and a prepared statement whose run calls callback asynchronously
      const prepareMock = jest.fn(() => {
        return {
          run: (reportId: any, pos: any, path: any, url: any, cb: any) => {
            // emulate async invocation
            process.nextTick(() => cb(null))
          },
          finalize: (cb: any) => process.nextTick(() => cb(null))
        }
      })

      jest.doMock('../src/dao/db', () => ({
        get: (sql: string, params: any[], cb: any) => cb(null, {}),
        prepare: prepareMock
      }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const report = { id: 9, photos: [{ position: 1, photo_path: 'p', photo_public_url: 'u' }] }
      const saved = await dao.saveReportPhotos(report)
      expect(saved).toBe(report)
      expect(prepareMock).toHaveBeenCalled()
    })

    it('saveReportPhotos rejects when a run callback errors', async () => {
      const prepareMock = jest.fn(() => ({
        run: (reportId: any, pos: any, path: any, url: any, cb: any) => {
          // first photo ok, second errors
          if (pos === 1) return process.nextTick(() => cb(null))
          return process.nextTick(() => cb(new Error('photo failed')))
        },
        finalize: (cb: any) => process.nextTick(() => cb(null))
      }))

      jest.doMock('../src/dao/db', () => ({ get: (sql: string, params: any[], cb: any) => cb(null, {}), prepare: prepareMock }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const report = { id: 10, photos: [{ position: 0, photo_path: 'p1', photo_public_url: 'u1' }, { position: 1, photo_path: 'p2', photo_public_url: 'u2' }] }
      await expect(dao.saveReportPhotos(report)).rejects.toThrow('photo failed')
    })

    it('saveReportPhotos rejects when run throws synchronously', async () => {
      const prepareMock = jest.fn(() => ({
        run: () => { throw new Error('sync error') },
        finalize: jest.fn()
      }))

      jest.doMock('../src/dao/db', () => ({ get: (sql: string, params: any[], cb: any) => cb(null, {}), prepare: prepareMock }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const report = { id: 11, photos: [{ position: 0, photo_path: 'p', photo_public_url: 'u' }] }
      await expect(dao.saveReportPhotos(report)).rejects.toThrow('sync error')
    })
  })

  describe('getPaginatedReports mapping behavior', () => {
    beforeEach(() => jest.resetModules())

    it('calls commonDao.mapDBrowToReport once per row', async () => {
      const dbGet = jest.fn((sql: string, params: any[], cb: any) => cb(null, { total: 2 }))
      const sampleRow: any = { id: 1, category_id: 1, title: 'a', latitude: 0, longitude: 0, status: 'Resolved', is_public: 1, reporter_id: null, updated_by: null, description: null, status_reason: null, created_at: '2025-01-01', updated_at: '2025-01-01' }
      const dbAll = jest.fn((sql: string, params: any[], cb: any) => cb(null, [sampleRow, sampleRow]))

      jest.doMock('../src/dao/db', () => ({ get: dbGet, all: dbAll }))

      const mockMap = jest.fn().mockImplementation(async (r: any) => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReport: mockMap }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const res = await dao.getPaginatedReports(null, null, null, 5, 0)
      expect(res.totalCount).toBe(2)
      expect(res.reports.length).toBe(2)
      expect(mockMap).toHaveBeenCalledTimes(2)
    })
  })

  describe('ReportDAO assignment and TOS users', () => {
    it('getTOSUsersByCategory resolves with mapped users', async () => {
      const mockRows = [{ id: 1, username: 'u1' }, { id: 2, username: 'u2' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMapUser = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToUserObject: mockMapUser }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const users = await dao.getTOSUsersByCategory(10)
      expect(users).toHaveLength(2)
      expect(users[0]).toEqual({ id: 1, username: 'u1', mapped: true })
      expect(dbAll).toHaveBeenCalledWith(expect.stringContaining('SELECT DISTINCT u.*'), [10], expect.any(Function))
    })

    it('getTOSUsersByCategory rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('db fail'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      // CommonDao mock needed because ReportDAO constructor news it
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getTOSUsersByCategory(10)).rejects.toThrow('db fail')
    })

    it('assignReportToUser updates report and resolves', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({ changes: 1 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await dao.assignReportToUser(100, 200, 300)

      expect(dbRun).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE reports'),
          expect.arrayContaining([200, 300, expect.any(String), 100]),
          expect.any(Function)
      )
    })

    it('assignReportToUser rejects when report not found (changes=0)', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({ changes: 0 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.assignReportToUser(100, 200, 300)).rejects.toThrow('The report does not exist')
    })

    it('assignReportToUser rejects on db error', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({}, new Error('update fail'))
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.assignReportToUser(100, 200, 300)).rejects.toThrow('update fail')
    })
  })

  describe('ReportDAO maintainers and tech officer assignments', () => {
    it('getReportsAssignedToTechOfficer resolves with mapped reports', async () => {
      const mockRows = [{ id: 1, title: 'r1' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMap = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReport: mockMap }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const reports = await dao.getReportsAssignedToTechOfficer(99)
      expect(reports).toHaveLength(1)
      expect(reports[0]).toEqual({ id: 1, title: 'r1', mapped: true })
      expect(dbAll).toHaveBeenCalledWith(
          expect.stringContaining(`SELECT * FROM reports WHERE (status = 'Assigned' OR status = 'In Progress') AND assigned_to = ? ORDER BY updatedAt DESC`),
          [99],
          expect.any(Function)
      )
    })

    it('getReportsAssignedToTechOfficer rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('db error'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getReportsAssignedToTechOfficer(99)).rejects.toThrow('db error')
    })

    it('getAllMaintainers resolves with mapped users', async () => {
      const mockRows = [{ id: 5, username: 'maint' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMapUser = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToUserObject: mockMapUser }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const users = await dao.getAllMaintainers()
      expect(users).toHaveLength(1)
      expect(users[0]).toEqual({ id: 5, username: 'maint', mapped: true })
    })

    it('getAllMaintainers rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('db fail'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getAllMaintainers()).rejects.toThrow('db fail')
    })

    it('assignReportToMaintainer updates report and resolves', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({ changes: 1 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await dao.assignReportToMaintainer(10, 20, 30)
      expect(dbRun).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE reports'),
          expect.arrayContaining([20, 30, expect.any(String), 10]),
          expect.any(Function)
      )
    })

    it('assignReportToMaintainer rejects when report not found', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({ changes: 0 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.assignReportToMaintainer(10, 20, 30)).rejects.toThrow('The report does not exist')
    })

    it('assignReportToMaintainer rejects on db error', async () => {
      const dbRun = jest.fn(function(sql, params, cb) {
        cb.call({}, new Error('update fail'))
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.assignReportToMaintainer(10, 20, 30)).rejects.toThrow('update fail')
    })

    it('getReportsAssignedToMaintainer resolves with mapped reports', async () => {
      const mockRows = [{ id: 1, title: 'r1' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMapReport = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReport: mockMapReport }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const reports = await dao.getReportsAssignedToMaintainer(55)
      expect(reports).toHaveLength(1)
      expect(reports[0]).toEqual({ id: 1, title: 'r1', mapped: true })
      expect(dbAll).toHaveBeenCalledWith(
          expect.stringContaining(`SELECT * FROM reports WHERE (status = 'In Progress' OR status = 'Suspended') AND maintainer_id = ? ORDER BY updatedAt DESC`),
          [55],
          expect.any(Function)
      )
    })

    it('getReportsAssignedToMaintainer rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('db error'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getReportsAssignedToMaintainer(55)).rejects.toThrow('db error')
    })
  })

  describe('getMapReports', () => {
    it('resolves with mapped reports when status provided', async () => {
      const mockRows = [{ id: 1, status: 'Open' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMapReport = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReport: mockMapReport }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const reports = await dao.getMapReports(['Open', 'In Progress'])
      expect(reports).toHaveLength(1)
      expect(reports[0]).toEqual({ id: 1, status: 'Open', mapped: true })
      expect(dbAll).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM reports WHERE 1=1  AND status IN (?, ?) ORDER BY updatedAt DESC'),
          ['Open', 'In Progress'],
          expect.any(Function)
      )
    })

    it('resolves with all reports when status is null/empty', async () => {
      const mockRows = [{ id: 1, status: 'Open' }]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      const mockMapReport = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReport: mockMapReport }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const reports = await dao.getMapReports(null)
      expect(dbAll).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM reports WHERE 1=1  ORDER BY updatedAt DESC'),
          [],
          expect.any(Function)
      )
    })

    it('rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('db error'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getMapReports(['Open'])).rejects.toThrow('db error')
    })
  })

  describe('getCommentsByReportId', () => {
    it('returns comments when db returns rows', async () => {
      const mockRows = [
        { id: 1, report_id: 10, commenter_id: 5, comment: 'c1', createdAt: 'date1' },
        { id: 2, report_id: 10, commenter_id: 6, comment: 'c2', createdAt: 'date2' }
      ]
      const dbAll = jest.fn((sql, params, cb) => cb(null, mockRows))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))

      // Mock CommonDAO to return the row as is (or mapped)
      const mockMapComment = jest.fn(r => ({ ...r, mapped: true }))
      const MockCommon = jest.fn().mockImplementation(() => ({ mapDBrowToReportComment: mockMapComment }))
      jest.doMock('../src/dao/commonDAO', () => MockCommon)

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const comments = await dao.getCommentsByReportId(10)
      expect(dbAll).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM report_comments WHERE report_id = ?'),
          [10],
          expect.any(Function)
      )
      expect(comments).toHaveLength(2)
      expect(comments[0]).toEqual({ ...mockRows[0], mapped: true })
    })

    it('rejects on db error', async () => {
      const dbAll = jest.fn((sql, params, cb) => cb(new Error('fail'), null))
      jest.doMock('../src/dao/db', () => ({ all: dbAll }))
      jest.doMock('../src/dao/commonDAO', () => jest.fn())

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      await expect(dao.getCommentsByReportId(10)).rejects.toThrow('fail')
    })
  })

  describe('addCommentToReport', () => {
    it('inserts comment and returns it with new id', async () => {
      const dbRun = jest.fn((sql, params, cb) => {
        cb.call({ lastID: 101, changes: 1 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const comment = {
        report_id: 1,
        commenter_id: 2,
        comment: 'text',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      }

      const result = await dao.addCommentToReport(comment)
      expect(dbRun).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO report_comments'),
          [1, 2, 'text', '2025-01-01', '2025-01-01'],
          expect.any(Function)
      )
      expect(result.id).toBe(101)
    })

    it('rejects when db.run errors', async () => {
      const dbRun = jest.fn((sql, params, cb) => cb(new Error('insert fail')))
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()

      const comment = { report_id: 1 }
      await expect(dao.addCommentToReport(comment)).rejects.toThrow('insert fail')
    })

    it('rejects with ReportNotFoundError when changes is 0', async () => {
      const dbRun = jest.fn((sql, params, cb) => {
        cb.call({ changes: 0 }, null)
      })
      jest.doMock('../src/dao/db', () => ({ run: dbRun }))

      const ReportDAO = require('../src/dao/reportDAO').default
      const dao = new ReportDAO()
      const { ReportNotFoundError } = require('../src/errors/reportError')

      const comment = { report_id: 1 }
      await expect(dao.addCommentToReport(comment)).rejects.toThrow(ReportNotFoundError)
    })

    // Targets ReportCommentNotFoundError branches in DAO
    describe('ReportDAO comment error branches', () => {
      it('editCommentToReport rejects with ReportCommentNotFoundError when changes is 0', async () => {
        const dbRun = jest.fn((sql, params, cb) => cb.call({ lastID: 0, changes: 0 }, null));
        jest.doMock('../src/dao/db', () => ({ run: dbRun }));
        const ReportDAO = require('../src/dao/reportDAO').default;
        const { ReportComment } = require('../src/components/report');

        const dao = new ReportDAO();
        const comment = new ReportComment(999, 1, 1, 'text', '2025-01-01', '2025-01-01');

        await expect(dao.editCommentToReport(comment)).rejects.toThrow(/does not exist/);
      });

      it('deleteCommentToReport rejects when changes is 0', async () => {
        const dbRun = jest.fn((sql, params, cb) => cb.call({ changes: 0 }, null));
        jest.doMock('../src/dao/db', () => ({ run: dbRun }));
        const ReportDAO = require('../src/dao/reportDAO').default;

        const dao = new ReportDAO();
        await expect(dao.deleteCommentToReport({ id: 999, report_id: 1, commenter_id: 1 } as any))
            .rejects.toThrow(/does not exist/);
      });
    });
  })
})
