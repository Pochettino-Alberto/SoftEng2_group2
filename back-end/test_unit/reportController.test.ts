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

  it('getMapReports delegates to DAO and returns reports', async () => {
    const reports = [{ id: 1, title: 'Map Report' }]
    const mockGetMapReports = jest.fn().mockResolvedValue(reports)
    const MockDAO = jest.fn().mockImplementation(() => ({ getMapReports: mockGetMapReports }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getMapReports(['Open'])
    expect(res).toBe(reports)
    expect(mockGetMapReports).toHaveBeenCalledWith(['Open'])
  })

  it('getMapReports rethrows on error', async () => {
    const err = new Error('map-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ getMapReports: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    await expect(ctrl.getMapReports(['Open'])).rejects.toThrow('map-fail')
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

  it('updateReportStatus delegates to DAO with correct args', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined)
    const MockDAO = jest.fn().mockImplementation(() => ({ updateReportStatus: mockUpdate }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    await expect(ctrl.updateReportStatus(12, 'Assigned', undefined)).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith(12, 'Assigned', undefined)
  })

  it('updateReportStatus logs and rethrows when DAO throws', async () => {
    const err = new Error('update-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ updateReportStatus: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.updateReportStatus(5, 'Rejected', 'reason')).rejects.toThrow('update-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('getTOSUsersByCategory delegates to DAO and returns users', async () => {
    const users = [{ id: 1, username: 'tos1' }]
    const mockGetTOS = jest.fn().mockResolvedValue(users)
    const MockDAO = jest.fn().mockImplementation(() => ({ getTOSUsersByCategory: mockGetTOS }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getTOSUsersByCategory(10)
    expect(res).toBe(users)
    expect(mockGetTOS).toHaveBeenCalledWith(10)
  })

  it('getTOSUsersByCategory logs and rethrows on error', async () => {
    const err = new Error('tos-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ getTOSUsersByCategory: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.getTOSUsersByCategory(10)).rejects.toThrow('tos-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('assignReportToUser calls DAO assign and then getReportById', async () => {
    const updatedReport = { id: 100, status: 'Assigned' }
    const mockAssign = jest.fn().mockResolvedValue(undefined)
    const mockGet = jest.fn().mockResolvedValue(updatedReport)
    
    const MockDAO = jest.fn().mockImplementation(() => ({
      assignReportToUser: mockAssign,
      getReportById: mockGet
    }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.assignReportToUser(100, 200, 300)
    expect(mockAssign).toHaveBeenCalledWith(100, 200, 300)
    expect(mockGet).toHaveBeenCalledWith(100)
    expect(res).toBe(updatedReport)
  })

  it('assignReportToUser logs and rethrows on error', async () => {
    const err = new Error('assign-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ assignReportToUser: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.assignReportToUser(100, 200, 300)).rejects.toThrow('assign-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('getReportsAssignedToTechOfficer delegates to DAO and returns reports', async () => {
    const reports = [{ id: 1, title: 'Report 1' }, { id: 2, title: 'Report 2' }]
    const mockGetReports = jest.fn().mockResolvedValue(reports)
    const MockDAO = jest.fn().mockImplementation(() => ({ getReportsAssignedToTechOfficer: mockGetReports }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getReportsAssignedToTechOfficer(123)
    expect(res).toBe(reports)
    expect(mockGetReports).toHaveBeenCalledWith(123)
  })

  it('getReportsAssignedToTechOfficer logs and rethrows on error', async () => {
    const err = new Error('fetch-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ getReportsAssignedToTechOfficer: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.getReportsAssignedToTechOfficer(123)).rejects.toThrow('fetch-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('getAllMaintainers delegates to DAO and returns users', async () => {
    const users = [{ id: 1, username: 'maint1' }]
    const mockGetAll = jest.fn().mockResolvedValue(users)
    const MockDAO = jest.fn().mockImplementation(() => ({ getAllMaintainers: mockGetAll }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getAllMaintainers()
    expect(res).toBe(users)
    expect(mockGetAll).toHaveBeenCalled()
  })

  it('getAllMaintainers logs and rethrows on error', async () => {
    const err = new Error('maint-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ getAllMaintainers: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.getAllMaintainers()).rejects.toThrow('maint-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('assignReportToMaintainer calls DAO assign and then getReportById', async () => {
    const updatedReport = { id: 100, status: 'Assigned' }
    const mockAssign = jest.fn().mockResolvedValue(undefined)
    const mockGet = jest.fn().mockResolvedValue(updatedReport)
    
    const MockDAO = jest.fn().mockImplementation(() => ({
      assignReportToMaintainer: mockAssign,
      getReportById: mockGet
    }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.assignReportToMaintainer(100, 50, 60)
    expect(mockAssign).toHaveBeenCalledWith(100, 50, 60)
    expect(mockGet).toHaveBeenCalledWith(100)
    expect(res).toBe(updatedReport)
  })

  it('assignReportToMaintainer logs and rethrows on error', async () => {
    const err = new Error('assign-maint-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ assignReportToMaintainer: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.assignReportToMaintainer(100, 50, 60)).rejects.toThrow('assign-maint-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('getReportsAssignedToMaintainer delegates to DAO and returns reports', async () => {
    const reports = [{ id: 1, title: 'Report 1' }, { id: 2, title: 'Report 2' }]
    const mockGetReports = jest.fn().mockResolvedValue(reports)
    const MockDAO = jest.fn().mockImplementation(() => ({ getReportsAssignedToMaintainer: mockGetReports }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const res = await ctrl.getReportsAssignedToMaintainer(456)
    expect(res).toBe(reports)
    expect(mockGetReports).toHaveBeenCalledWith(456)
  })

  it('getReportsAssignedToMaintainer logs and rethrows on error', async () => {
    const err = new Error('fetch-maint-fail')
    const MockDAO = jest.fn().mockImplementation(() => ({ getReportsAssignedToMaintainer: jest.fn().mockRejectedValue(err) }))
    jest.doMock('../src/dao/reportDAO', () => MockDAO)

    const ReportController = require('../src/controllers/reportController').default
    const ctrl = new ReportController()

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ctrl.getReportsAssignedToMaintainer(456)).rejects.toThrow('fetch-maint-fail')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
