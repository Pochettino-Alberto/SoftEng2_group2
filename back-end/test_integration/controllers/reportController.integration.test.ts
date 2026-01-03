// Integration tests for ReportController using real sqlite test DB
import { resetTestDB } from '../helpers/resetTestDB';

const createTestReport = (
    Report: any,
    ReportStatus: any,
    Utility: any,
    title: string = 'Test Report'
): any => {
  const now: string = Utility.now();
  return new Report(
      0,                          // id
      1,                          // category_id
      title,                      // title
      0.0,                        // latitude
      0.0,                        // longitude
      ReportStatus.PENDING_APPROVAL,
      true,                       // is_public
      undefined,                  // reporter_id
      undefined,                  // assigned_to
      'Test Description',         // description
      null,                       // status_reason
      now,                        // createdAt
      now                         // updatedAt
  );
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  await resetTestDB()
  const { dbReady } = require('../../src/dao/db')
  await dbReady
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

describe('ReportController additional integration tests', () => {
  test('getReportById rejects for missing report (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const ctrl = new ReportController()

    await expect(ctrl.getReportById(999999)).rejects.toThrow(/The report does not exist|not found/i)
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

  test('getMapReports returns reports filtered by status (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default
    const ReportDAO = require('../../src/dao/reportDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const ctrl = new ReportController()
    const dao = new ReportDAO()

    // Ensure we have some data
    await dao.saveReport(new Report(0, 1, 'Map1', 0, 0, ReportStatus.PENDING_APPROVAL, true))
    await dao.saveReport(new Report(0, 1, 'Map2', 0, 0, ReportStatus.ASSIGNED, true))

    const reports = await ctrl.getMapReports([ReportStatus.PENDING_APPROVAL])
    expect(Array.isArray(reports)).toBe(true)
    expect(reports.length).toBeGreaterThan(0)
    reports.forEach((r: any) => {
      expect(r.status).toBe(ReportStatus.PENDING_APPROVAL)
    })
  })
})

describe('ReportController error branches (mocked DAO)', () => {
  test('saveReport logs and rethrows when DAO.saveReport throws', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

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

  test('assignReportToUser assigns report and returns updated report (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')

    const ctrl = new ReportController()
    const udao = new UserDAO()

    const techOff = await udao.createUser('techOff', 'T', 'O', 't@o.test', 'pw', 'municipality')
    const admin = await udao.createUser('adminAssign', 'A', 'A', 'a@a.test', 'pw', 'municipality')

    const rpt = new Report(0, 1, 'To Assign', 10, 11, ReportStatus.PENDING_APPROVAL, false, undefined, undefined, 'desc')
    const saved = await ctrl.saveReport(rpt)

    const updated = await ctrl.assignReportToUser(saved.id, techOff.id, admin.id)

    expect(updated.id).toBe(saved.id)
    expect(updated.status).toBe(ReportStatus.ASSIGNED)
    expect(updated.assigned_to.id).toBe(techOff.id)
  })

  test('getTOSUsersByCategory returns users for category (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const UserDAO = require('../../src/dao/userDAO').default

    const ctrl = new ReportController()
    const udao = new UserDAO()

    const users = await ctrl.getTOSUsersByCategory(1)
    expect(Array.isArray(users)).toBe(true)
  })

  test('updateReportStatus updates status (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const { Report, ReportStatus } = require('../../src/components/report')
    const ctrl = new ReportController()

    const rpt = new Report(0, 1, 'Status Update', 0, 0, ReportStatus.PENDING_APPROVAL, true)
    const saved = await ctrl.saveReport(rpt)

    await ctrl.updateReportStatus(saved.id, ReportStatus.RESOLVED, 'Looks good')
    const updated = await ctrl.getReportById(saved.id)
    expect(updated.status).toBe(ReportStatus.RESOLVED)
    expect(updated.status_reason).toBe('Looks good')
  })

  test('getAllMaintainers returns maintainers (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const ctrl = new ReportController()

    const maintainers = await ctrl.getAllMaintainers()
    expect(Array.isArray(maintainers)).toBe(true)
  })

  test('getReportsAssignedToTechOfficer returns reports (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')
    const ctrl = new ReportController()
    const udao = new UserDAO()

    const tech = await udao.createUser('tech_ctrl', 'T', 'C', 'tc@test.com', 'pw', 'municipality')
    const from = await udao.createUser('from_ctrl', 'F', 'C', 'fc@test.com', 'pw', 'municipality')

    const rpt = new Report(0, 1, 'Assigned Ctrl', 0, 0, ReportStatus.ASSIGNED, true)
    const saved = await ctrl.saveReport(rpt)
    await ctrl.assignReportToUser(saved.id, tech.id, from.id)

    let reports = await ctrl.getReportsAssignedToTechOfficer(tech.id)
    expect(reports.some((r: any) => r.id === saved.id)).toBe(true)

    const maint = await udao.createUser('maint_for_tech', 'M', 'T', 'mt@test.com', 'pw', 'municipality')
    await ctrl.assignReportToMaintainer(saved.id, maint.id, tech.id)

    reports = await ctrl.getReportsAssignedToTechOfficer(tech.id)
    expect(reports.some((r: any) => r.id === saved.id)).toBe(true)
    const fetched = reports.find((r: any) => r.id === saved.id)
    expect(fetched.status).toBe(ReportStatus.IN_PROGRESS)
  })

  test('getReportsAssignedToMaintainer returns reports (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')
    const ctrl = new ReportController()
    const udao = new UserDAO()

    const maint = await udao.createUser('maint_ctrl_get', 'M', 'C', 'mcg@test.com', 'pw', 'municipality')
    const tech = await udao.createUser('tech_ctrl_get', 'T', 'C', 'tcg@test.com', 'pw', 'municipality')

    const rpt = new Report(0, 1, 'Maint Get Ctrl', 0, 0, ReportStatus.PENDING_APPROVAL, true)
    const saved = await ctrl.saveReport(rpt)

    await ctrl.assignReportToMaintainer(saved.id, maint.id, tech.id)

    const reports = await ctrl.getReportsAssignedToMaintainer(maint.id)
    expect(reports.some((r: any) => r.id === saved.id)).toBe(true)
  })

  test('assignReportToMaintainer updates report (real DB)', async () => {
    jest.resetModules()
    jest.unmock('../../src/dao/reportDAO')
    const { dbReady } = require('../../src/dao/db')
    await dbReady

    const ReportController = require('../../src/controllers/reportController').default
    const UserDAO = require('../../src/dao/userDAO').default
    const { Report, ReportStatus } = require('../../src/components/report')
    const ctrl = new ReportController()
    const udao = new UserDAO()

    const maint = await udao.createUser('maint_ctrl', 'M', 'C', 'mc@test.com', 'pw', 'municipality')
    const tech = await udao.createUser('tech_upd_ctrl', 'T', 'U', 'tu@test.com', 'pw', 'municipality')

    const rpt = new Report(0, 1, 'Maint Ctrl', 0, 0, ReportStatus.PENDING_APPROVAL, true)
    const saved = await ctrl.saveReport(rpt)

    const updated = await ctrl.assignReportToMaintainer(saved.id, maint.id, tech.id)
    expect(updated.maintainer_id).toBe(maint.id)
    expect(updated.updated_by).toBe(tech.id)
    expect(updated.status).toBe(ReportStatus.IN_PROGRESS)
  })

  test('Controller methods log and rethrow errors (mocked DAO)', async () => {
    jest.resetModules()
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    class MockDAO5 {
      async saveReport() { throw new Error('fail') }
      async saveReportPhotos() { throw new Error('fail') }
      async getAllReportCategories() { throw new Error('fail') }
      async getReportById() { throw new Error('fail') }
      async getPaginatedReports() { throw new Error('fail') }
      async updateReportStatus() { throw new Error('fail') }
      async getReportsAssignedToTechOfficer() { throw new Error('fail') }
      async getTOSUsersByCategory() { throw new Error('fail') }
      async getAllMaintainers() { throw new Error('fail') }
      async assignReportToUser() { throw new Error('fail') }
      async assignReportToMaintainer() { throw new Error('fail') }
      async getMapReports() { throw new Error('fail') }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAO5 }))
    const ReportController = require('../../src/controllers/reportController').default
    const ctrl = new ReportController()

    await expect(ctrl.updateReportStatus(1, 'Resolved')).rejects.toThrow('fail')
    await expect(ctrl.getReportsAssignedToTechOfficer(1)).rejects.toThrow('fail')
    await expect(ctrl.getTOSUsersByCategory(1)).rejects.toThrow('fail')
    await expect(ctrl.getAllMaintainers()).rejects.toThrow('fail')
    await expect(ctrl.assignReportToUser(1, 1, 1)).rejects.toThrow('fail')
    await expect(ctrl.assignReportToMaintainer(1, 1, 1)).rejects.toThrow('fail')
    await expect(ctrl.saveReportPhotos({})).rejects.toThrow('fail')
    await expect(ctrl.getMapReports([])).rejects.toThrow('fail')

    spyErr.mockRestore()
  })
})

describe('ReportController - Real DB Integration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.unmock('../../src/dao/reportDAO');
  });

  test('Comment CRUD lifecycle with user data enrichment (real DB)', async () => {
    const ReportController = require('../../src/controllers/reportController').default;
    const UserDAO = require('../../src/dao/userDAO').default;
    const { Report, ReportStatus, ReportComment } = require('../../src/components/report');
    const { Utility } = require('../../src/utilities');

    const ctrl = new ReportController();
    const udao = new UserDAO();

    const user = await udao.createUser('real_user', 'John', 'Doe', 'j@real.ts', 'pw', 'citizen');
    const rpt = createTestReport(Report, ReportStatus, Utility, 'Real DB Test');
    const savedReport = await ctrl.saveReport(rpt);

    const newComment = new ReportComment(0, savedReport.id, user.id, 'Original text', Utility.now(), Utility.now());
    const added = await ctrl.addCommentToReport(newComment);
    expect(added.id).toBeGreaterThan(0);

    const comments = await ctrl.getCommentsByReportId(savedReport.id);
    expect(comments[0].userdata).toBeDefined();
    expect(comments[0].userdata.id).toBe(user.id);

    await ctrl.deleteCommentToReport(added);
    const final = await ctrl.getCommentsByReportId(savedReport.id);
    expect(final.length).toBe(0);
  });
});

describe('ReportController - Mocked DAO Logic', () => {
  const { Utility } = require('../../src/utilities');

  test('Comment methods use MockDAO successfully', async () => {
    jest.resetModules();
    const { ReportStatus, ReportComment } = require('../../src/components/report');

    class MockDAOSuccess {
      async getReportById(id: number) {
        return { id, status: ReportStatus.PENDING_APPROVAL };
      }
      async addCommentToReport(comment: any) {
        return { ...comment, id: 777 };
      }
      async getCommentsByReportId(id: number) {
        return [{ id: 777, report_id: id, commenter_id: 99, comment: 'Mocked', userdata: { id: 99 } }];
      }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAOSuccess }));

    // Mock UserDAO to satisfy enrichment logic
    jest.doMock('../../src/dao/userDAO', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        getUserById: async (id: number) => ({ id, username: 'mocked_user' })
      }))
    }));

    const ReportController = require('../../src/controllers/reportController').default;
    const ctrl = new ReportController();

    const comment = new ReportComment(0, 1, 99, 'Mocked Comment', Utility.now(), Utility.now());
    const added = await ctrl.addCommentToReport(comment);

    expect(added.id).toBe(777);
    const fetched = await ctrl.getCommentsByReportId(1);
    expect(fetched[0].userdata.id).toBe(99);
  });

  test('Controller logs and rethrows when DAO fails', async () => {
    jest.resetModules();
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {})

    class MockDAOFail {
      async getReportById() { return { id: 1 }; }
      async getCommentsByReportId() { throw new Error('mock_db_fail'); }
    }

    jest.doMock('../../src/dao/reportDAO', () => ({ __esModule: true, default: MockDAOFail }));

    const ReportController = require('../../src/controllers/reportController').default;
    const ctrl = new ReportController();

    await expect(ctrl.getCommentsByReportId(1)).rejects.toThrow('mock_db_fail');
    expect(spyErr).toHaveBeenCalled();

    spyErr.mockRestore();
  });
});