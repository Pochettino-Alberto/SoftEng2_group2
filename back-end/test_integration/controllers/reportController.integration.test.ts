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

// --- appended from reportController.more.integration.test.ts ---
const { resetTestDB: resetReportsDB_CTRL_MORE } = require('../helpers/resetTestDB')

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetReportsDB_CTRL_MORE()
})

describe('ReportController additional integration tests', () => {
  test('getReportById rejects for missing report (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const ctrl = new ReportController()

    await expect(ctrl.getReportById(999999)).rejects.toThrow(/reports with id 999999 not found|not found/i)
  })

  test('searchReports honors status and is_public filters (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const ctrl = new ReportController()
    const dao = new ReportDAO()

    // Insert reports with different statuses and public flags
    await dao.saveReport(new Report(0, 1, 'S1', 0, 0, ReportStatus.PENDING_APPROVAL, true))
    await dao.saveReport(new Report(0, 1, 'S2', 0, 0, ReportStatus.PENDING_APPROVAL, false))
    await dao.saveReport(new Report(0, 1, 'S3', 0, 0, ReportStatus.RESOLVED, true))

    const pag1 = await ctrl.searchReports(1, 10, ReportStatus.PENDING_APPROVAL, true, null)
    expect(Array.isArray(pag1.items || pag1.reports || [])).toBe(true)
    // ensure that returned reports match filters
    const items = (pag1.reports) ? pag1.reports : (pag1.items ? pag1.items : [])
    expect(items.length).toBeGreaterThanOrEqual(1)
    for (const r of items) {
      expect(r.status).toBe(ReportStatus.PENDING_APPROVAL)
      expect(r.is_public).toBe(true)
    }
  })

  test('saveReportPhotos with no photos resolves (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const ctrl = new ReportController()
    const r = new Report(0, 1, 'NoPhotos', 0, 0, ReportStatus.PENDING_APPROVAL, false)
    const saved = await ctrl.saveReport(r)
    // ensure calling saveReportPhotos when photos is undefined does not fail
    const after = await ctrl.saveReportPhotos(saved)
    expect(after).toBeDefined()
  })

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

// --- Error-branch tests for ReportController to improve coverage ---
describe('ReportController error branches (mocked DAO)', () => {
  test('saveReport logs and rethrows when DAO.saveReport throws', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock DAO so that saveReport throws
    class MockDAO {
      async saveReport() { throw new Error('dao save fail') }
      async saveReportPhotos(): Promise<any> { return {} }
      async getAllReportCategories(): Promise<any[]> { return [] }
      async getReportById(): Promise<any> { return {} }
      async getPaginatedReports(): Promise<{ reports: any[]; totalCount: number }> { return { reports: [], totalCount: 0 } }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAO }))
    const ReportController = require('../../src/controllers/reportController').default

    const ctrl = new ReportController()
    await expect(ctrl.saveReport({} as any)).rejects.toThrow(/dao save fail/)
    expect(spyErr).toHaveBeenCalled()

    spyErr.mockRestore()
  })

  test('getReportCategories logs and rethrows when DAO.getAllReportCategories throws', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    class MockDAO2 {
      async saveReport() { return {} }
      async saveReportPhotos(): Promise<any> { return {} }
      async getAllReportCategories(): Promise<any[]> { throw new Error('cats fail') }
      async getReportById(): Promise<any> { return {} }
      async getPaginatedReports(): Promise<{ reports: any[]; totalCount: number }> { return { reports: [], totalCount: 0 } }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAO2 }))
    const ReportController = require('../../src/controllers/reportController').default

    const ctrl = new ReportController()
    await expect(ctrl.getReportCategories()).rejects.toThrow(/cats fail/)
    expect(spyErr).toHaveBeenCalled()

    spyErr.mockRestore()
  })

  test('getReportById logs and rethrows when DAO.getReportById throws', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    class MockDAO3 {
      async saveReport() { return {} }
      async saveReportPhotos(): Promise<any> { return {} }
      async getAllReportCategories(): Promise<any[]> { return [] }
      async getReportById(): Promise<any> { throw new Error('get by id fail') }
      async getPaginatedReports(): Promise<{ reports: any[]; totalCount: number }> { return { reports: [], totalCount: 0 } }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAO3 }))
    const ReportController = require('../../src/controllers/reportController').default

    const ctrl = new ReportController()
    await expect(ctrl.getReportById(1)).rejects.toThrow(/get by id fail/)
    expect(spyErr).toHaveBeenCalled()

    spyErr.mockRestore()
  })

  test('searchReports rejects when DAO.getPaginatedReports throws', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    class MockDAO4 {
      async saveReport() { return {} }
      async saveReportPhotos(): Promise<any> { return {} }
      async getAllReportCategories(): Promise<any[]> { return [] }
      async getReportById(): Promise<any> { return {} }
      async getPaginatedReports(): Promise<{ reports: any[]; totalCount: number }> { throw new Error('count boom') }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAO4 }))
    const ReportController = require('../../src/controllers/reportController').default

    const ctrl = new ReportController()
    await expect(ctrl.searchReports(1, 10, null, null, null)).rejects.toThrow(/count boom/)
    spyErr.mockRestore()
  })
})
