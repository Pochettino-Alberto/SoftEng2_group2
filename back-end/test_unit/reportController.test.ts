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
})
