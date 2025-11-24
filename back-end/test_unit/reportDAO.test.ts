describe('ReportDAO', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('saveReport assigns lastID to report.id and resolves', async () => {
    // Mock db to simulate sqlite3 behaviour
    jest.doMock('../src/dao/db', () => ({
      run: (sql: string, params: any[], cb: any) => {
        // emulate sqlite3 calling callback with `this` containing lastID
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

  it('saveReportPhotos inserts photos when present', async () => {
    jest.doMock('../src/dao/db', () => ({
      get: (sql: string, params: any[], cb: any) => cb(null, {}),
      prepare: (sql: string) => ({ run: jest.fn() })
    }))

    const ReportDAO = require('../src/dao/reportDAO').default
    const dao = new ReportDAO()

    const report = {
      id: 5,
      photos: [
        { position: 0, photo_path: '/p1', photo_public_url: 'u1' },
        { position: 1, photo_path: '/p2', photo_public_url: 'u2' }
      ]
    }

    const saved = await dao.saveReportPhotos(report)
    expect(saved).toBe(report)
  })
})
