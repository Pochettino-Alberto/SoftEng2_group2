import apiClient from './client'
import type { Report, ReportStatus, ReportCategory } from '../types/report'
import type { User } from '../types/user'

export const reportAPI = {
  getAllReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports')
    return response.data
  },

  getReportCategories: async (): Promise<ReportCategory[]> => {
    const response = await apiClient.get('/reports/categories')
    return response.data
  },

  searchReportsPaginated: async (params: { page_num?: number; page_size?: number; status?: string; is_public?: boolean; category_id?: number }) => {
    const response = await apiClient.get('/reports/search-reports', { params })
    return response.data
  },

  getReportById: async (id: number): Promise<Report> => {
    const response = await apiClient.get(`/reports/report/${id}`)
    return response.data
  },

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

  getTechnicalOfficerReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports/assigned-to-techOfficer');
    console.log('assigned-to-techOfficer response: ', response.data);
    return response.data;
  },

  getExternalMaintainerReports: async (): Promise<void> => {
    console.log('This API is yet to be implemented on the backend.');
  },

  updateReportStatus: async (
    reportId: number,
    status: ReportStatus,
    status_reason?: string,
  ): Promise<Report> => {
    const response = await apiClient.patch(`/reports/report/${reportId}/status`, { status, status_reason })
    return response.data
  },

  getReportsByFilter: async (filters: {
    category?: string
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<Report[]> => {
    const response = await apiClient.get('/reports', { params: filters })
    return response.data
  },

  getTOSUsersByCategory: async (categoryId: number): Promise<User[]> => {
    const response = await apiClient.get('/reports/tos-users', { params: { category_id: categoryId } })
    return response.data
  },

  getAllMaintainers: async (): Promise<User[]> => {
    const response = await apiClient.get('/reports/maintainer-users')
    return response.data
  },

  assignReportToUser: async (reportId: number, assignedToId: number): Promise<Report> => {
    const response = await apiClient.patch(`/reports/report/${reportId}/assign`, { assigned_to: assignedToId })
    return response.data
  },

  assignReportToMaintainer: async (reportId: number, maintainerId: number): Promise<Report> => {
    const response = await apiClient.patch(`/reports/report/${reportId}/assign-maintainer`, { maintainer_id: maintainerId })
    return response.data
  },
}
