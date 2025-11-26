// Integration tests for ReportDAO using real sqlite test DB
const { resetTestDB: resetReportsDB_DAO } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetReportsDB_DAO()
  const { dbReady } = require('../../src/dao/db')
  await dbReady
})

describe('ReportDAO integration', () => {
  test('saveReport and getReportById persist and retrieve report (real DB)', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // create a minimal report object
    const rpt = new Report(
      0, // id
      1, // category_id (should exist in default data)
      'Integration Report',
      45.0,
      9.0,
      ReportStatus.PENDING_APPROVAL,
      true,
      undefined,
      undefined,
      'desc',
      'reason',
      undefined,
      undefined
    )

    const saved = await dao.saveReport(rpt)
    expect(saved.id).toBeGreaterThan(0)

    const fetched = await dao.getReportById(saved.id)
    expect(fetched).toBeDefined()
    expect(fetched.title).toBe('Integration Report')
  })

  test('saveReportPhotos inserts photos and they are retrievable via getReportById', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    const rpt = new Report(0, 1, 'With Photos', 1.2, 2.3, ReportStatus.PENDING_APPROVAL, false, undefined, undefined, 'd')
    const saved = await dao.saveReport(rpt)

    // attach photos
    const p1 = new ReportPhoto(0, saved.id, 1, 'http://example.com/p1', '/path/p1')
    const p2 = new ReportPhoto(0, saved.id, 2, 'http://example.com/p2', '/path/p2')
    saved.photos = [p1, p2]

    const afterPhotos = await dao.saveReportPhotos(saved)
    expect(afterPhotos.photos).toBeDefined()

    const fetched = await dao.getReportById(saved.id)
    expect(fetched.photos.length).toBeGreaterThanOrEqual(2)
    // ensure positions/order
    expect(fetched.photos[0].position).toBe(1)
  })

  test('getAllReportCategories returns categories', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const dao = new ReportDAO()
    const cats = await dao.getAllReportCategories()
    expect(Array.isArray(cats)).toBe(true)
    expect(cats.length).toBeGreaterThan(0)
    expect(cats[0].id).toBeDefined()
  })

  test('getPaginatedReports returns correct total and filtered results', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // Insert multiple reports with different statuses
    for (let i = 0; i < 4; i++) {
      const r = new Report(0, 1, `Bulk ${i}`, 0, 0, ReportStatus.PENDING_APPROVAL, i % 2 === 0)
      await dao.saveReport(r)
    }

    const { reports, totalCount } = await dao.getPaginatedReports(ReportStatus.PENDING_APPROVAL, null, null, 10, 0)
    expect(totalCount).toBeGreaterThanOrEqual(4)
    expect(Array.isArray(reports)).toBe(true)
  })

  test('getReportById returns subclasses (reporter, category, photos) when requested', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()
    const udao = new UserDAO()

    // create a reporter
    const createdUser = await udao.createUser('rptr', 'Rep', 'Orter', 'r@int.test', 'pwd', 'citizen')

    // create a report by that reporter
    const rpt = new Report(0, 1, 'Subclasses', 3.3, 4.4, ReportStatus.PENDING_APPROVAL, true, createdUser.id)
    const saved = await dao.saveReport(rpt)

    // attach photos
    const p1 = new ReportPhoto(0, saved.id, 1, 'http://p1', '/p1')
    saved.photos = [p1]
    await dao.saveReportPhotos(saved)

    const fetched = await dao.getReportById(saved.id)
    // reporter and category should be fetched
    expect(fetched.reporter).toBeDefined()
    expect(fetched.reporter.username).toBe('rptr')
    expect(fetched.category).toBeDefined()
    expect(Array.isArray(fetched.photos)).toBe(true)
    expect(fetched.photos[0].photo_public_url).toBeDefined()
  })

  test('getPaginatedReports filters by category and is_public', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // create mixed reports across categories and public flags
    await dao.saveReport(new Report(0, 1, 'Cat1Pub', 0, 0, ReportStatus.PENDING_APPROVAL, true))
    await dao.saveReport(new Report(0, 2, 'Cat2Priv', 0, 0, ReportStatus.PENDING_APPROVAL, false))
    await dao.saveReport(new Report(0, 1, 'Cat1Priv', 0, 0, ReportStatus.PENDING_APPROVAL, false))

    const { reports, totalCount } = await dao.getPaginatedReports(null, true, 1, 10, 0)
    expect(Array.isArray(reports)).toBe(true)
    // ensure results only contain public reports for category 1
    for (const r of reports) {
      expect(r.category_id).toBe(1)
      expect(r.is_public).toBe(true)
    }
    expect(totalCount).toBeGreaterThanOrEqual(1)
  })

  test('saveReport rejects when category_id does not exist (FK constraint)', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // Use a non-existent category id to trigger FK constraint
    const bad = new Report(0, 99999, 'BadCategory', 0, 0, ReportStatus.PENDING_APPROVAL, false)

    await expect(dao.saveReport(bad)).rejects.toBeDefined()
  })

  test('saveReportPhotos resolves when there are no photos', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    const rpt = new Report(0, 1, 'NoPhotos', 0, 0, ReportStatus.PENDING_APPROVAL, false)
    const saved = await dao.saveReport(rpt)

    // explicitly ensure photos undefined/empty
    saved.photos = []
    const after = await dao.saveReportPhotos(saved)
    expect(after).toBeDefined()
    expect(after.photos).toBeDefined()
    expect(after.photos.length).toBe(0)
  })

  test('getPaginatedReports returns empty results for large offset but keeps totalCount', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // Ensure there is at least one report
    await dao.saveReport(new Report(0, 1, 'OffsetTest', 0, 0, ReportStatus.PENDING_APPROVAL, true))

    const { reports, totalCount } = await dao.getPaginatedReports(null, null, null, 10, 1000)
    expect(Array.isArray(reports)).toBe(true)
    expect(reports.length).toBe(0)
    expect(typeof totalCount).toBe('number')
    expect(totalCount).toBeGreaterThanOrEqual(1)
  })

  test('getPaginatedReports does not populate subclasses (reporter/category) when called for listing', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()
    const udao = new UserDAO()

    const user = await udao.createUser('listpop', 'L', 'P', 'l@p.test', 'pw', 'citizen')
    const rpt = new Report(0, 1, 'ListPop', 0, 0, ReportStatus.PENDING_APPROVAL, true, user.id)
    const savedRpt = await dao.saveReport(rpt)

    const { reports } = await dao.getPaginatedReports(null, null, null, 100, 0)
    // at least one report should exist and none should have reporter object populated
    expect(reports.length).toBeGreaterThanOrEqual(1)
    // find by saved id to avoid reliance on ordering
    const foundById = reports.find((r: any) => r.id === savedRpt.id)
    expect(foundById).toBeDefined()
    expect((foundById as any).reporter).toBeUndefined()
    expect((foundById as any).category).toBeUndefined()
  })

  test('saveReportPhotos rejects when prepared statement run throws synchronously', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const db = require('../../src/dao/db').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()
    const rpt = new Report(0, 1, 'SyncThrow', 0, 0, ReportStatus.PENDING_APPROVAL, false)
    const saved = await dao.saveReport(rpt)

    saved.photos = [new ReportPhoto(0, saved.id, 1, 'u', '/p')]

    // monkeypatch prepare to return an object whose run throws synchronously
    const origPrepare = db.prepare
    db.prepare = function () {
      return {
        run: function () { throw new Error('sync run error') }
      }
    }

    await expect(dao.saveReportPhotos(saved)).rejects.toBeDefined()

    // restore
    db.prepare = origPrepare
  })

  test('saveReportPhotos resolves when finalize is not a function and run invokes callback synchronously', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const db = require('../../src/dao/db').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()
    const rpt = new Report(0, 1, 'NoFinalize', 0, 0, ReportStatus.PENDING_APPROVAL, false)
    const saved = await dao.saveReport(rpt)

    saved.photos = [new ReportPhoto(0, saved.id, 1, 'u', '/p')]

    const origPrepare = db.prepare
    db.prepare = function () {
      return {
        run: function (_reportId: any, _pos: any, _path: any, _url: any, cb: any) {
          // call callback synchronously to simulate environment where run is sync
          if (typeof cb === 'function') cb(null)
        }
        // no finalize provided
      }
    }

    const res = await dao.saveReportPhotos(saved)
    expect(res).toBeDefined()

    db.prepare = origPrepare
  })

  test('getPaginatedReports rejects when count query returns error', async () => {
    const ReportDAO = require('../../src/dao/reportDAO').default
    const db = require('../../src/dao/db').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()

    // ensure there is at least one report present
    await dao.saveReport(new Report(0, 1, 'CountErr', 0, 0, ReportStatus.PENDING_APPROVAL, true))

    const origGet = db.get
    // patch db.get to simulate error when COUNT query is executed
    db.get = function (sql: any, params: any, cb: any) {
      if (typeof sql === 'string' && sql.toUpperCase().includes('COUNT(*)')) {
        return cb(new Error('simulated count error'))
      }
      return origGet.call(db, sql, params, cb)
    }

    await expect(dao.getPaginatedReports(null, null, null, 10, 0)).rejects.toBeDefined()

    db.get = origGet
  })

  // --- Additional integration tests for low-coverage services/errors/utilities ---
  test('supabaseService.uploadFile and deleteFile success and error branches', async () => {
    jest.resetModules()

    // Mock supabase client
    const mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: 'http://public.test/p.jpg' } }))
    const mockUpload = jest.fn(async (): Promise<any> => ({ data: {}, error: null }))
    const mockRemove = jest.fn(async (): Promise<any> => ({ data: {}, error: null }))
    const mockFrom = jest.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl, remove: mockRemove }))

    jest.doMock('@supabase/supabase-js', () => ({ createClient: () => ({ storage: { from: mockFrom } }) }))

    const { supabaseService, SupabaseBucket } = require('../../src/services/supabaseService')

    const fakeFile = { originalname: 'photo.jpg', buffer: Buffer.from('x'), mimetype: 'image/jpeg' }

    const up = await supabaseService.uploadFile('dirPath', fakeFile, SupabaseBucket.REPORT_PHOTOS_BUCKET)
    expect(up.publicUrl).toBe('http://public.test/p.jpg')
    expect(typeof up.filePath).toBe('string')

    // deleteFile with real filePath resolves
    await expect(supabaseService.deleteFile(up.filePath, SupabaseBucket.REPORT_PHOTOS_BUCKET)).resolves.toBeUndefined()

    // Now simulate delete error
    jest.resetModules()
    const mockRemoveErr = jest.fn(async (): Promise<any> => ({ data: null, error: { message: 'cannot delete' } }))
    const mockFrom2 = jest.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl, remove: mockRemoveErr }))
    jest.doMock('@supabase/supabase-js', () => ({ createClient: () => ({ storage: { from: mockFrom2 } }) }))
    const { supabaseService: sup2 } = require('../../src/services/supabaseService')

    await expect(sup2.deleteFile('some/path.jpg', SupabaseBucket.REPORT_PHOTOS_BUCKET)).rejects.toBeDefined()
  })

  test('supabaseService.uploadFile handles upload error branch (coverage) and uploadFiles', async () => {
    jest.resetModules()

    // upload returns an error (branch executed) but getPublicUrl still returns a url
    const mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: 'http://p.test/u.jpg' } }))
    const mockUploadErr = jest.fn(async (): Promise<any> => ({ data: null, error: { message: 'upload failed' } }))
    const mockFrom = jest.fn(() => ({ upload: mockUploadErr, getPublicUrl: mockGetPublicUrl, remove: async (): Promise<any> => ({ data: {}, error: null }) }))
    jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({ storage: { from: mockFrom } }) }))

    const { supabaseService, SupabaseBucket } = require('../../src/services/supabaseService')

    const f1 = { originalname: 'a.png', buffer: Buffer.from('1'), mimetype: 'image/png' }
    await expect(supabaseService.uploadFiles('x', [f1], SupabaseBucket.REPORT_PHOTOS_BUCKET)).rejects.toBeDefined()
  })

  test('Supabase error classes set customMessage and customCode', () => {
    const { SupabaseFileNotFound, SupabaseFailedToUpload, SupabaseFailedToDelete } = require('../../src/errors/supabaseError')

    const nf = new SupabaseFileNotFound('f.jpg')
    expect(nf.customCode).toBe(404)
    expect(nf.customMessage).toContain('f.jpg')

    const fu = new SupabaseFailedToUpload('f2.jpg')
    expect(fu.customCode).toBe(503)
    expect(fu.customMessage).toContain('f2.jpg')

    const fd = new SupabaseFailedToDelete('f3.jpg')
    expect(fd.customCode).toBe(503)
    expect(fd.customMessage).toContain('f3.jpg')
  })

  test('Utility helpers isAdmin/isCitizen/isMunicipality/now and DateError', () => {
    const { Utility, DateError } = require('../../src/utilities')
    const { UserType } = require('../../src/components/user')

    const admin = { user_type: UserType.ADMIN }
    const muni = { user_type: UserType.MUNICIPALITY }
    const cit = { user_type: UserType.CITIZEN }

    expect(Utility.isAdmin(admin)).toBe(true)
    expect(Utility.isMunicipality(muni)).toBe(true)
    expect(Utility.isCitizen(cit)).toBe(true)
    expect(typeof Utility.now()).toBe('string')

    const de = new DateError()
    expect(de.customCode).toBe(400)
  })

  // --- db.ts initialization/error branches ---
  test('db module throws when sqlite open fails (simulated)', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock sqlite3 so Database constructor invokes callback with error
    jest.doMock('sqlite3', () => ({
      Database: function (dbPath: any, cb: any) {
        // throw synchronously from the constructor so require() surfaces the error
        throw new Error('open fail')
      }
    }))

    // ensure fs.existsSync returns true to avoid initialization branch
    jest.doMock('fs', () => ({ existsSync: () => true }))

    // Requiring the module should surface the thrown error
    expect(() => { require('../../src/dao/db') }).toThrow(/open fail/)

    spyErr.mockRestore()
  })

  test('db.initializeDb logs when SQL files cannot be read', async () => {
    jest.resetModules()
    // Ensure CI env vars don't prevent initialization in CI (e.g., Sonar sets DB_PATH)
    delete process.env.DB_PATH;
    delete process.env.CI_USE_FILE_DB;
    process.env.NODE_ENV = 'test';
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock fs to simulate missing DB file and failing readFileSync
    jest.doMock('fs', () => ({
      existsSync: () => false,
      readFileSync: () => { throw new Error('no sql files') }
    }))

    // Mock sqlite3 Database to succeed and provide exec/serialize
    jest.doMock('sqlite3', () => ({
      Database: function (dbPath: any, cb: any) {
        const fakeDb = {
          run: () => {},
          exec: (sql: any, cb2: any) => { if (typeof cb2 === 'function') cb2(null) },
          serialize: (fn: any) => { if (typeof fn === 'function') fn() }
        }
        // invoke callback asynchronously to avoid "db not initialized" timing issues
        if (typeof cb === 'function') setImmediate(() => cb(null))
        return fakeDb
      }
    }))

    // Require db; initializeDb should catch readFileSync error and log
    require('../../src/dao/db')
    // wait one tick for async initialize to run and log
    await new Promise((resolve) => setImmediate(resolve))
    expect(spyErr).toHaveBeenCalled()

    spyErr.mockRestore()
  })
})
