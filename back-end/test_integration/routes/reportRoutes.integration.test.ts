import request from 'supertest'
import express, { Express } from 'express';

// 1. Prevent real service initialization
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'example-key'

// 2. Define a persistent mock for the Controller
const mockControllerInstance = {
  getReportCategories: jest.fn(),
  getReportById: jest.fn(),
  searchReports: jest.fn(),
  saveReport: jest.fn(),
  saveReportPhotos: jest.fn(),
  updateReportStatus: jest.fn(),
  assignReportToUser: jest.fn(),
  getTOSUsersByCategory: jest.fn(),
  getAllMaintainers: jest.fn(),
  getReportsAssignedToTechOfficer: jest.fn(),
  getReportsAssignedToMaintainer: jest.fn(),
  assignReportToMaintainer: jest.fn(),
  getMapReports: jest.fn(),
  getCommentsByReportId: jest.fn(),
  addCommentToReport: jest.fn(),
  editCommentToReport: jest.fn(),
  deleteCommentToReport: jest.fn()
};

// 3. Mock the controller and Supabase service BEFORE importing the router
jest.mock('../../src/controllers/reportController', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockControllerInstance)
}));

jest.mock('../../src/services/supabaseService', () => ({
  supabaseService: {
    // Mock uploadFiles to return fake metadata instead of making network calls
    uploadFiles: jest.fn().mockResolvedValue([
      { publicUrl: 'http://fake.url/1.jpg', filePath: 'path/1.jpg' }
    ])
  },
  SupabaseBucket: { REPORT_PHOTOS_BUCKET: 'reports' }
}));

describe('ReportRoutes integration', () => {
  let app: Express;

  const fakeAuth = {
    isLoggedIn: (req: any, res: any, next: any) => {
      req.user = { id: 5, role: 'citizen' };
      next();
    },
    isCitizen: (req: any, res: any, next: any) => next(),
    isAdmin: (req: any, res: any, next: any) => next(),
    isAdminOrMunicipality: (req: any, res: any, next: any) => {
      req.user = { id: 99 };
      next();
    },
    isTechnicalOfficer: (req: any, res: any, next: any) => next(),
    isMaintainer: (req: any, res: any, next: any) => next(),
    hasRoleTechOff: (req: any, res: any, next: any) => {
      req.user = { id: 55 };
      next();
    },
    hasRoleMaintainer: (req: any, res: any, next: any) => {
      req.user = { id: 66 };
      next();
    }
  };

  beforeAll(() => {
    const { ReportRoutes } = require('../../src/routers/reportRoutes');
    app = express();
    app.use(express.json());
    const rr = new ReportRoutes(fakeAuth as any);
    app.use('/report', rr.getRouter());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /report/categories returns categories from controller', async () => {
    mockControllerInstance.getReportCategories.mockResolvedValue([{ id: 1, name: 'Road' }]);
    const res = await request(app).get('/report/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Road' }]);
  });

  it('GET /report/report/:id delegates to controller.getReportById', async () => {
    mockControllerInstance.getReportById.mockResolvedValue({ id: 42, title: 't' });
    const res = await request(app).get('/report/report/42');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 42, title: 't' });
  });

  it('GET /report/search-reports returns paginated result from controller', async () => {
    mockControllerInstance.searchReports.mockResolvedValue({ reports: [{ id: 1 }], totalCount: 1 });
    const res = await request(app).get('/report/search-reports');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reports: [{ id: 1 }], totalCount: 1 });
  });

  it('POST /report/upload returns 500/400 when too many files are attached', async () => {
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
        .attach('photos', Buffer.from('d'), 'a4.jpg');

    expect(res.status).toBe(500);
  });

  it('POST /report/upload succeeds with valid payload (controller + supabase mocked)', async () => {
    mockControllerInstance.saveReport.mockResolvedValue({ id: 555, title: 'Valid' });
    mockControllerInstance.saveReportPhotos.mockImplementation(r => Promise.resolve(r));

    const res = await request(app)
        .post('/report/upload')
        .field('title', 'ValidReport')
        .field('description', 'Test Description')
        .field('category_id', '1')
        .field('latitude', '1.1')
        .field('longitude', '2.2')
        .field('is_public', 'true')
        .attach('photos', Buffer.from('fake'), 'photo.jpg');

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(555);
  });

  it('GET /report/search-reports returns 422 when page_num invalid', async () => {
    const res = await request(app).get('/report/search-reports').query({ page_num: 'abc' });
    expect(res.status).toBe(422);
  });

  it('PATCH /report/:id/status succeeds when payload valid', async () => {
    mockControllerInstance.updateReportStatus.mockResolvedValue(true);
    mockControllerInstance.getReportById.mockResolvedValue({ id: 12, status: 'Assigned', status_reason: null });

    const res = await request(app)
        .patch('/report/report/12/status')
        .send({ status: 'Assigned' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(12);
  });

  it('PATCH /report/:id/status returns 422 when id invalid or status missing', async () => {
    const res = await request(app).patch('/report/report/abc/status').send({ status: 'Assigned' });
    expect(res.status).toBe(422);
  });

  it('PATCH /report/:id/assign succeeds when payload valid', async () => {
    mockControllerInstance.assignReportToUser.mockResolvedValue({ id: 10, assigned_to: 5, status: 'Assigned' });
    const res = await request(app).patch('/report/report/10/assign').send({ assigned_to: 5 });
    expect(res.status).toBe(200);
    expect(res.body.assigned_to).toBe(5);
  });

  it('PATCH /report/:id/assign returns 422 when id or assigned_to invalid', async () => {
    const res = await request(app).patch('/report/report/10/assign').send({ assigned_to: 'not-int' });
    expect(res.status).toBe(422);
  });

  it('PATCH /report/:id/assign handles controller errors', async () => {
    mockControllerInstance.assignReportToUser.mockRejectedValue(new Error('Controller error'));
    const res = await request(app).patch('/report/report/10/assign').send({ assigned_to: 5 });
    expect(res.status).toBe(500);
  });

  it('GET /tos-users returns users from controller', async () => {
    mockControllerInstance.getTOSUsersByCategory.mockResolvedValue([{ id: 1, username: 'tos' }]);
    const res = await request(app).get('/report/tos-users?category_id=1');
    expect(res.status).toBe(200);
    expect(res.body[0].username).toBe('tos');
  });

  it('GET /maintainer-users returns users from controller', async () => {
    mockControllerInstance.getAllMaintainers.mockResolvedValue([{ id: 2, username: 'maint' }]);
    const res = await request(app).get('/report/maintainer-users');
    expect(res.status).toBe(200);
    expect(res.body[0].username).toBe('maint');
  });

  it('GET /assigned-to-techOfficer returns reports', async () => {
    mockControllerInstance.getReportsAssignedToTechOfficer.mockResolvedValue([{ id: 100 }]);
    const res = await request(app).get('/report/assigned-to-techOfficer');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(100);
  });

  it('GET /assigned-to-maintainer returns reports', async () => {
    mockControllerInstance.getReportsAssignedToMaintainer.mockResolvedValue([{ id: 101 }]);
    const res = await request(app).get('/report/assigned-to-maintainer');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(101);
  });

  it('PATCH /report/:id/assign-maintainer succeeds', async () => {
    mockControllerInstance.assignReportToMaintainer.mockResolvedValue({ id: 10, maintainer_id: 7 });
    const res = await request(app).patch('/report/report/10/assign-maintainer').send({ maintainer_id: 7 });
    expect(res.status).toBe(200);
    expect(res.body.maintainer_id).toBe(7);
  });

  it('GET /get-map-reports returns reports', async () => {
    mockControllerInstance.getMapReports.mockResolvedValue([{ id: 1 }]);
    const res = await request(app).get('/report/get-map-reports');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(1);
  });

  it('GET /get-map-reports handles errors', async () => {
    mockControllerInstance.getMapReports.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/report/get-map-reports');
    expect(res.status).toBe(500);
  });

  it('GET /report/:report_id/comments returns comments', async () => {
    mockControllerInstance.getCommentsByReportId.mockResolvedValue([{ id: 1, comment: 'Hi' }]);
    const res = await request(app).get('/report/1/comments');
    expect(res.status).toBe(200);
    expect(res.body[0].comment).toBe('Hi');
  });

  it('POST /report/:report_id/comment creates a new comment', async () => {
    mockControllerInstance.addCommentToReport.mockResolvedValue({ id: 99, comment: 'New' });
    const res = await request(app).post('/report/1/comment').send({ comment: 'New' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(99);
  });

  it('PATCH /report/:report_id/comment updates comment', async () => {
    mockControllerInstance.editCommentToReport.mockResolvedValue({ id: 99, comment: 'Edited' });
    const res = await request(app).patch('/report/1/comment').send({ comment_id: 99, comment: 'Edited' });
    expect(res.status).toBe(200);
    expect(res.body.comment).toBe('Edited');
  });

  it('DELETE /report/:report_id/comment returns 204', async () => {
    mockControllerInstance.deleteCommentToReport.mockResolvedValue(undefined);
    const res = await request(app).delete('/report/1/comment').send({ comment_id: 99 });
    expect(res.status).toBe(204);
  });

  it('POST /report/:report_id/comment returns 422 for empty comment', async () => {
    const res = await request(app).post('/report/1/comment').send({ comment: '' });
    expect(res.status).toBe(422);
  });
});