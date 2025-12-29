import apiClient from './client'
import type { Report, ReportStatus, ReportCategory, ReportComment } from '../types/report'
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

  getExternalMaintainerReports: async (): Promise<Report[]> => {
    const response = await apiClient.get('/reports/assigned-to-maintainer');
    return transformReports(response.data);
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

  getMapReports: async (statusArray?: string[]): Promise<Report[]> => {
    try {
      console.log('[getMapReports] Called with statusArray:', statusArray);
      const response = await apiClient.get('/reports/get-map-reports')
      
      let reports = transformReports(response.data);
      
      if (statusArray && statusArray.length > 0) {
        console.log('[getMapReports] Filtering frontend reports by statuses:', statusArray);
        reports = reports.filter(r => statusArray.includes(r.status));
      }
      
      console.log('[getMapReports] Returning', reports.length, 'filtered reports');
      return reports
    } catch (error) {
      console.error('getMapReports error:', error)
      return []
    }
  },

  // Comment APIs
  getCommentsByReportId: async (reportId: number): Promise<ReportComment[]> => {
    const response = await apiClient.get(`/reports/${reportId}/comments`)
    return response.data
  },

  addCommentToReport: async (reportId: number, comment: string): Promise<ReportComment> => {
    const response = await apiClient.post(`/reports/${reportId}/comment`, { comment })
    return response.data
  },

  editCommentOnReport: async (reportId: number, commentId: number, comment: string): Promise<ReportComment> => {
    const response = await apiClient.patch(`/reports/${reportId}/comment`, { comment_id: commentId, comment })
    return response.data
  },

  deleteCommentFromReport: async (reportId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/reports/${reportId}/comment`, { data: { comment_id: commentId } })
  },
}

function transformReports(data: any[]): Report[] {
  if (!Array.isArray(data)) return []
  
  return data.map((report: any) => {
    const lat = report.location?.lat || report.latitude || 0
    const lng = report.location?.lng || report.longitude || 0
    
    return {
      ...report,
      location: {
        lat: typeof lat === 'number' ? lat : parseFloat(lat) || 0,
        lng: typeof lng === 'number' ? lng : parseFloat(lng) || 0
      }
    } as Report
  })
}
