describe('ReportController', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('saveReport delegates to DAO and returns result', async () => {
    const fakeReport = { id: 99, title: 'x' }

    // Mock ReportDAO class
    const mockSave = jest.fn().mockResolvedValue(fakeReport)
    const MockDAO = jest.fn().mockImplementation(() => ({ saveReport: mockSave }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.saveReport({})
    expect(res).toBe(fakeReport)
    expect(mockSave).toHaveBeenCalled()
  })

  it('saveReportPhotos delegates to DAO and returns result', async () => {
    const fakeReport = { id: 77 }
    const mockSavePhotos = jest.fn().mockResolvedValue(fakeReport)
    const MockDAO = jest.fn().mockImplementation(() => ({ saveReportPhotos: mockSavePhotos }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.saveReportPhotos({})
    expect(res).toBe(fakeReport)
    expect(mockSavePhotos).toHaveBeenCalled()
  })

  it('getReportCategories delegates to DAO and returns categories', async () => {
    const categories = [{ id: 1, name: 'Road' }]
    const MockDAO = jest.fn().mockImplementation(() => ({ getAllReportCategories: jest.fn().mockResolvedValue(categories) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getReportCategories()
    expect(res).toBe(categories)
  })

  it('getReportById delegates to DAO and returns report', async () => {
    const fake = { id: 55 }
    const MockDAO = jest.fn().mockImplementation(() => ({ getReportById: jest.fn().mockResolvedValue(fake) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getReportById(55)
    expect(res).toBe(fake)
  })

  it('searchReports returns PaginatedResult with correct paging', async () => {
    const reports = [{ id: 1 }, { id: 2 }]
    const totalCount = 5
    const MockDAO = jest.fn().mockImplementation(() => ({ getPaginatedReports: jest.fn().mockResolvedValue({ reports, totalCount }) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const pag = await ctrl.searchReports(2, 3, null, null, null)
    expect(pag.page_num).toBe(2)
    expect(pag.page_size).toBe(3)
    expect(pag.total_items).toBe(totalCount)
    expect(pag.total_pages).toBe(Math.ceil(totalCount / 3))
  })

  it('searchReports defaults page and size when null', async () => {
    const reports: any[] = []
    const totalCount = 0
    const MockDAO = jest.fn().mockImplementation(() => ({ getPaginatedReports: jest.fn().mockResolvedValue({ reports, totalCount }) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const pag = await ctrl.searchReports(null, null, null, null, null)
    expect(pag.page_num).toBe(1)
    expect(pag.page_size).toBe(10)
    expect(pag.total_items).toBe(totalCount)
  })

  it('methods log and rethrow when DAO throws errors', async () => {
    const err = new Error('boom')
    const MockDAO = jest.fn().mockImplementation(() => ({
      saveReport: jest.fn().mockRejectedValue(err),
      saveReportPhotos: jest.fn().mockRejectedValue(err),
      getAllReportCategories: jest.fn().mockRejectedValue(err),
      getReportById: jest.fn().mockRejectedValue(err),
      getPaginatedReports: jest.fn().mockRejectedValue(err),
    }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(ctrl.saveReport({} as any)).rejects.toThrow('boom')
    await expect(ctrl.saveReportPhotos({} as any)).rejects.toThrow('boom')
    await expect(ctrl.getReportCategories()).rejects.toThrow('boom')
    await expect(ctrl.getReportById(1)).rejects.toThrow('boom')
    await expect(ctrl.searchReports(1, 1, null, null, null)).rejects.toThrow('boom')

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
