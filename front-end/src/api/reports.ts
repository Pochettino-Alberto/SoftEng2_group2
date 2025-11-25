import apiClient from './client';
import type { Report, ReportStatus } from '../types/report'; // Using ReportStatus from your file
import type { ReportCategory } from '../pages/municipality/ReportsPage';

export const reportAPI = {
  // Get all reports (public access)
  getAllReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports');
    return response.data;
  },

  getReportCategories: async (): Promise<ReportCategory[]> => {
    const response = await apiClient.get('/reports/categories');
    return response.data;
  },

  // Get report by ID
  getReportById: async (id: number): Promise<Report> => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  // Create a new report (citizen only) and uploads relative photos
  createReport: async (reportData: FormData): Promise<Report> => {
    const config = {
      headers: {
        // By setting Content-Type to undefined, Axios removes the header entirely.
        // This forces the browser/Axios to correctly set the header to 'multipart/form-data'
        // with the necessary boundary.
        'Content-Type': undefined,
      }
    };

    const response = await apiClient.post('/reports/upload', reportData, config);
    return response.data;
  },

  // Get user's own reports
  getMyReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports/my-reports');
    return response.data;
  },

  // Update a report's status (Admin or Municipality only)
  updateReportStatus: async (
    reportId: number,
    status: ReportStatus,
    status_reason?: string,
  ): Promise<Report> => {
    const response = await apiClient.patch(`/reports/report/${reportId}/status`, { status, status_reason });
    return response.data;
  },

  // Get reports by filters
  getReportsByFilter: async (filters: {
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Report[]> => {
    const response = await apiClient.get('/reports', { params: filters });
    return response.data;
  },
};
