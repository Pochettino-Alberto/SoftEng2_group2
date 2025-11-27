import apiClient from './client'
import type { Report, ReportStatus, ReportCategory } from '../types/report'

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
    const response = await apiClient.post('/reports/upload', reportData)
    return response.data
  },

  getMyReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports/my-reports')
    return response.data
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
}
