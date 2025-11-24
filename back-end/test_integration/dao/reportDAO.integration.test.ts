// Integration tests for ReportDAO using real sqlite test DB
const { resetTestDB: resetReportsDB_DAO } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetReportsDB_DAO()
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
})
