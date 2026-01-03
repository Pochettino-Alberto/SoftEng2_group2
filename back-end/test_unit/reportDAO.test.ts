describe('ReportDAO', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('saveReport assigns lastID to report.id and resolves', async () => {
    jest.doMock('../src/dao/db', () => ({
      run: (sql: string, params: any[], cb: any) => {
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

  // (Include other existing tests here...)

  describe('ReportDAO Comment Error Branches', () => {
    const { ReportComment } = require('../src/components/report');
    const { ReportCommentNotFoundError } = require('../src/errors/reportError');

    it('editCommentToReport rejects with ReportCommentNotFoundError when changes is 0', async () => {
      const dbRun = jest.fn(function(this: any, sql: any, params: any, cb: any) {
        cb.call({ changes: 0 }, null);
      });
      jest.doMock('../src/dao/db', () => ({ run: dbRun }));

      const ReportDAO = require('../src/dao/reportDAO').default;
      const dao = new ReportDAO();
      const comment = new ReportComment(999, 1, 1, 'text', '2025-01-01', '2025-01-01');

      await expect(dao.editCommentToReport(comment)).rejects.toThrow(ReportCommentNotFoundError);
    });

    it('deleteCommentToReport rejects when changes is 0', async () => {
      const dbRun = jest.fn(function(this: any, sql: any, params: any, cb: any) {
        cb.call({ changes: 0 }, null);
      });
      jest.doMock('../src/dao/db', () => ({ run: dbRun }));

      const ReportDAO = require('../src/dao/reportDAO').default;
      const dao = new ReportDAO();

      await expect(dao.deleteCommentToReport({ id: 999, report_id: 1, commenter_id: 1 } as any))
          .rejects.toThrow(ReportCommentNotFoundError);
    });
  });
})