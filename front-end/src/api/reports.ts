import apiClient from './client';
import type { Report, CreateReportData } from '../types/report';

export const reportAPI = {
  // Get all reports (public access)
  getAllReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports');
    return response.data;
  },

  // Get report by ID
  getReportById: async (id: number): Promise<Report> => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  // Create a new report (citizen only)
  createReport: async (reportData: CreateReportData): Promise<Report> => {
    // For now, we'll handle file uploads separately
    // This would need multipart/form-data handling
    const response = await apiClient.post('/reports', reportData);
    return response.data;
  },

  // Get user's own reports
  getMyReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports/my-reports');
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
