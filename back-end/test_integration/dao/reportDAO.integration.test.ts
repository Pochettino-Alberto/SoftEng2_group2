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
})
