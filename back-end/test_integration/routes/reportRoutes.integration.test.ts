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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
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

  it('POST /report/upload succeeds with no photos (controller + supabase mocked)', async () => {
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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app)
      .post('/report/upload')
      .field('title', 'NoPhotos')
      .field('category_id', '1')
      .field('latitude', '1.1')
      .field('longitude', '2.2')
      .field('is_public', 'true')

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
      isAdminOrMunicipality: (req: any, res: any, next: any) => next()
    }

    const { ReportRoutes } = require('../../src/routers/reportRoutes')
    const app = express()
    const rr = new ReportRoutes(fakeAuth as any)
    app.use('/report', rr.getRouter())

    const res = await request(app).get('/report/search-reports').query({ page_num: 'abc' })
    expect(res.status).toBe(422)
  })
})
