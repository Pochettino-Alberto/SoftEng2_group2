// Integration tests for ReportController using real sqlite test DB
const { resetTestDB: resetReportsDB_CTRL } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetReportsDB_CTRL()
})

describe('ReportController integration', () => {
  test('controller saveReport -> saveReportPhotos -> getReportById (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportPhoto, ReportStatus } = require('../../src/components/report')

    const dao = new ReportDAO()
    const ctrl = new ReportController()

    const rpt = new Report(0, 1, 'Ctrl Report', 10, 11, ReportStatus.PENDING_APPROVAL, false, undefined, undefined, 'desc')
    const saved = await ctrl.saveReport(rpt)
    expect(saved.id).toBeGreaterThan(0)

    // attach photos then call controller method
    saved.photos = [ new ReportPhoto(0, saved.id, 1, 'http://x', '/p1') ]
    const withPhotos = await ctrl.saveReportPhotos(saved)
    expect(withPhotos).toBeDefined()

    const fetched = await ctrl.getReportById(saved.id)
    expect(fetched.title).toBe('Ctrl Report')
    expect(fetched.photos.length).toBeGreaterThanOrEqual(1)
  })

  test('controller getReportCategories and searchReports (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const ctrl = new ReportController()

    const cats = await ctrl.getReportCategories()
    expect(Array.isArray(cats)).toBe(true)
    expect(cats.length).toBeGreaterThan(0)

    // Create a report then search
    const ReportDAO = require('../../src/dao/reportDAO').default
    const dao = new ReportDAO()
    const rpt = new Report(0, 1, 'SearchMe', 0, 0, ReportStatus.PENDING_APPROVAL, true)
    await dao.saveReport(rpt)

    const pag = await ctrl.searchReports(1, 10, null, null, null)
    expect(pag).toBeDefined()
    expect(typeof pag.total_items).toBe('number')
  })
})
