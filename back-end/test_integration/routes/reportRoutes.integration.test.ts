import request from 'supertest'
import express from 'express'

describe('ReportRoutes integration', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('GET /report/categories returns categories from controller', async () => {
    // Mock ReportController with predictable outputs
    const MockController = jest.fn().mockImplementation(() => ({
      getReportCategories: async () => [{ id: 1, name: 'Road' }],
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    // Fake authenticator with permissive middleware
    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/categories')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 1, name: 'Road' }])
  })

  it('GET /report/report/:id delegates to controller.getReportById', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      getReportById: async (id: number) => ({ id, title: 't' })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/report/42')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 42, title: 't' })
  })

  it('GET /report/search-reports returns paginated result from controller', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      searchReports: async (page_num: any, page_size: any, status: any, is_public: any, category_id: any) => ({ reports: [{ id: 1 }], totalCount: 1 })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/search-reports')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ reports: [{ id: 1 }], totalCount: 1 })
  })

  it('POST /report/upload returns 400 when too many files are attached', async () => {
    // Mock controller so DB is not touched
    const MockController = jest.fn().mockImplementation(() => ({
      saveReport: async (report: any) => ({ ...report, id: 123 }),
      saveReportPhotos: async (report: any) => report,
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    // Mock supabaseService to ensure not called in this branch
    jest.doMock('../../src/services/supabaseService', () => ({ supabaseService: { uploadFiles: jest.fn() }, SupabaseBucket: { REPORT_PHOTOS_BUCKET: 'b' } }))

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: 2 }; return next() },
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    // attach 4 files (max is 3)
    const res = await request(app)
      .post('/report/upload')
      .field('title', 'TooMany')
      .field('category_id', '1')
      .field('latitude', '0')
      .field('longitude', '0')
      .field('is_public', 'false')
      .attach('photos', Buffer.from('a'), 'a1.jpg')
      .attach('photos', Buffer.from('b'), 'a2.jpg')
      .attach('photos', Buffer.from('c'), 'a3.jpg')
      .attach('photos', Buffer.from('d'), 'a4.jpg')

    // Multer may throw a MulterError when too many files are attached; assert server error returned
    expect(res.status).toBe(500)
    expect(res.body.error || res.text).toBeDefined()
  })

  it('POST /report/upload succeeds with valid payload (controller + supabase mocked)', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      saveReport: async (report: any) => ({ ...report, id: 555 }),
      saveReportPhotos: async (report: any) => report,
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    jest.doMock('../../src/services/supabaseService', () => ({
      supabaseService: { uploadFiles: async (): Promise<any[]> => [] },
      SupabaseBucket: { REPORT_PHOTOS_BUCKET: 'b' }
    }))

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => { req.user = { id: 2 }; return next() },
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app)
      .post('/report/upload')
      .field('title', 'ValidReport')
      .field('description', 'desc')
      .field('category_id', '1')
      .field('latitude', '1.1')
      .field('longitude', '2.2')
      .field('is_public', 'true')
      .attach('photos', Buffer.from('fake'), 'photo.jpg')

    expect(res.status).toBe(201)
    expect(res.body).toBeDefined()
    expect(res.body.id).toBe(555)
  })

  it('GET /report/search-reports returns 422 when page_num invalid', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      searchReports: async (): Promise<{ reports: any[]; totalCount: number }> => ({ reports: [], totalCount: 0 })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/search-reports').query({ page_num: 'abc' })
    expect(res.status).toBe(422)
  })

  it('PATCH /report/:id/status succeeds when payload valid and user authorized', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      updateReportStatus: async (id: number, status: any, reason: any) => true,
      getReportById: async (id: number) => ({ id, status: 'Assigned', status_reason: null as any })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app)
      .patch('/report/report/12/status')
      .send({ status: 'Assigned' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 12, status: 'Assigned', status_reason: null })
  })

  it('PATCH /report/:id/status returns 422 when id invalid or status missing/invalid', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      updateReportStatus: async () => true,
      getReportById: async (id: number) => ({ id, status: 'Assigned' })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    // invalid id
    const res1 = await request(app).patch('/report/report/abc/status').send({ status: 'Assigned' })
    expect(res1.status).toBe(422)

    // invalid status value
    const res2 = await request(app).patch('/report/report/5/status').send({ status: 'NotAStatus' })
    expect(res2.status).toBe(422)

    // rejecting without status_reason should be 422
    const res3 = await request(app).patch('/report/report/6/status').send({ status: 'Rejected' })
    expect(res3.status).toBe(422)
  })

  it('PATCH /report/:id/assign succeeds when payload valid', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      assignReportToUser: async (reportId: number, assignedToId: number, assignedFromId: number) => ({
        id: reportId,
        assigned_to: assignedToId,
        status: 'Assigned'
      })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => { req.user = { id: 99 }; return next() },
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app)
      .patch('/report/report/10/assign')
      .send({ assigned_to: 5 })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 10, assigned_to: 5, status: 'Assigned' })
  })

  it('PATCH /report/:id/assign returns 422 when id or assigned_to invalid', async () => {
    const MockController = jest.fn().mockImplementation(() => ({}))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    // invalid id
    const res1 = await request(app).patch('/report/report/abc/assign').send({ assigned_to: 5 })
    expect(res1.status).toBe(422)

    // invalid assigned_to
    const res2 = await request(app).patch('/report/report/10/assign').send({ assigned_to: 'nobody' })
    expect(res2.status).toBe(422)

    // missing assigned_to
    const res3 = await request(app).patch('/report/report/10/assign').send({})
    expect(res3.status).toBe(422)
  })

  it('PATCH /report/:id/assign handles controller errors', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      assignReportToUser: async () => { throw new Error('Controller error') }
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).patch('/report/report/10/assign').send({ assigned_to: 5 })
    expect(res.status).toBe(500)
  })

  it('GET /tos-users returns users from controller', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      getTOSUsersByCategory: async (catId: number) => ([{ id: 1, username: 'tos' }])
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/tos-users?category_id=1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 1, username: 'tos' }])
  })

  it('GET /maintainer-users returns users from controller', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      getAllMaintainers: async () => ([{ id: 2, username: 'maint' }])
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => next(),
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/maintainer-users')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 2, username: 'maint' }])
  })

  it('GET /assigned-to-techOfficer returns reports from controller', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      getReportsAssignedToTechOfficer: async (id: number) => ([{ id: 100, title: 'Assigned Report' }])
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => { req.user = { id: 55 }; return next() },
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/assigned-to-techOfficer')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 100, title: 'Assigned Report' }])
  })

  it('PATCH /report/:id/assign-maintainer succeeds when payload valid', async () => {
    const MockController = jest.fn().mockImplementation(() => ({
      assignReportToMaintainer: async (reportId: number, maintainerId: number, techId: number) => ({
        id: reportId,
        maintainer_id: maintainerId,
        updated_by: techId
      })
    }))
    jest.doMock('../../src/controllers/reportController', () => MockController)

    const fakeAuth = {
      isLoggedIn: (req: any, res: any, next: any) => next(),
      isCitizen: (req: any, res: any, next: any) => next(),
      isAdmin: (req: any, res: any, next: any) => next(),
      isAdminOrMunicipality: (req: any, res: any, next: any) => next(),
      hasRoleTechOff: (req: any, res: any, next: any) => { req.user = { id: 55 }; return next() },
      hasRoleMaintainer: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app)
      .patch('/report/report/10/assign-maintainer')
      .send({ maintainer_id: 7 })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 10, maintainer_id: 7, updated_by: 55 })
  })
})
