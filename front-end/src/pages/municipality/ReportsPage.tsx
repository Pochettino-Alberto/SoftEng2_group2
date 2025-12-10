import { useEffect, useState } from 'react'
import PaginatedTable from '../../components/PaginatedTable'
import type { Column } from '../../components/PaginatedTable'
import { reportAPI } from '../../api/reports'
import type { Report } from '../../types/report'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { ReportStatus } from '../../types/report'
import { useAuth } from '../../context/AuthContext'

export default function ReportsPage() {
  const { user } = useAuth();
  const isPublicRelationsOfficer = user?.userRoles.some((r) => r.role_type === 'publicRelations_officer') ?? false;
  const isTechnicalOfficer = user?.userRoles.some((r) => r.role_type === 'technical_officer') ?? false;
  const [pageSize] = useState(5)
  const [paginated, setPaginated] = useState({ page_num: 1, page_size: pageSize, total_pages: 1, total_items: 0, items: [] as Report[] })
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>(ReportStatus.PENDING_APPROVAL)
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({})
  const navigate = useNavigate()

  const fetchPage = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page_num: p, page_size: pageSize }
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus
      const toPaginated = (items: Report[]) => ({
        page_num: 1,
        page_size: pageSize,
        total_pages: 1,
        total_items: items.length,
        items,
      });
      let res: any;

      // Shows all reports if the user has the 'Public Relationship municipal officer' role
      if(isPublicRelationsOfficer){
        res = await reportAPI.searchReportsPaginated(params)
        //console.log('Municipal Public Relations Officer - can see all reports');
      } else if(isTechnicalOfficer){
        res = toPaginated(await reportAPI.getTechnicalOfficerReports());
        //console.log('Municipal Technical Officer - can see only assigned reports');
      } else if (user?.userRoles.some((r) => r.role_type === 'external_maintainer')){
        // Shows reports assigned to the external maintainer
        // TODO API endpoint to get reports assigned to external maintainer
        res = toPaginated([]);
        console.log('External Maintainer - can see only assigned reports');
      } else {
        console.warn('No valid municipal role found - no reports to show');
        res = toPaginated([]);
      }

      setPaginated(res);
    } catch (err) {
      console.error('Failed to load reports', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(1)
    // load categories for display in table (fallback when report list doesn't include nested category)
    const loadCategories = async () => {
      try {
        const cats = await reportAPI.getReportCategories()
        const map: Record<number, string> = {}
        cats.forEach((c) => { if (c && typeof c.id === 'number') map[c.id] = c.name })
        setCategoriesMap(map)
      } catch (e) {
        // ignore silently; table will show empty category names
      }
    }
    loadCategories()
  }, [selectedStatus, isPublicRelationsOfficer, isTechnicalOfficer])

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= paginated.total_pages) fetchPage(p)
  }
  const truncateDescription = (text: string, maxLength: number = 70) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns: Column<Report>[] = [
    // 1. New 'Photo' column with Thumbnail and ID
    /*{
      header: 'Photo',
      accessor: (r: Report) => (
        <div className="flex items-center space-x-3">
          {r.photos && r.photos.length > 0 ? (
            <img 
              src={r.photos[0].photo_public_url} 
              alt={`Report ${r.id} thumbnail`} 
              className="w-16 h-16 object-cover rounded-md shadow-md flex-shrink-0"
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                // Fallback placeholder image
                target.src = "https://placehold.co/40x40/E5E7EB/6B7280?text=IMG";
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs font-mono text-gray-500 flex-shrink-0">
              {r.id}
            </div>
          )}
        </div>
      ),
    },*/
    { header: 'Title', accessor: (r: Report) => r.title },
    // Truncated Description column
    {
      header: 'Description',
      accessor: (r: Report) => (
        <p className="text-sm text-gray-600 max-w-[200px] overflow-hidden truncate">
          {truncateDescription(r.description, 70)}
        </p>
      )
    },
    { header: 'Category', accessor: (r: Report) => (r.category_id ? categoriesMap[r.category_id] || '' : '') },
    {
      header: 'Status', accessor: (r: Report) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === ReportStatus.RESOLVED ? 'bg-green-100 text-green-700' : r.status === ReportStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
      )
    },
    {
      header: 'Created',
      accessor: (r: Report) => (
        <p className="text-sm text-gray-600">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
        </p>
      )
    },
    {
      header: 'Updated',
      accessor: (r: Report) => (
        <p className="text-sm text-gray-600">
          {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}
        </p>
      )
    },
  ]

  const handleReload = () => {
    fetchPage(paginated.page_num)
  }

  return (
    <div className="mx-auto mt-4 sm:mt-8 px-4 sm:px-6 lg:px-0 max-w-6xl">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {isPublicRelationsOfficer ? 'Reports Management' : isTechnicalOfficer ? 'Assigned Reports' : 'Reports'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {isPublicRelationsOfficer
            ? 'Click a row to review details, approve and assign, or reject with a reason.'
            : isTechnicalOfficer
              ? 'These are the reports assigned to you. Click a row to see details.'
              : 'Reports overview.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between mt-4">
          {isPublicRelationsOfficer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by Status:
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-auto"
                disabled={loading}
              >
                <option value="all">All Statuses</option>
                <option value={ReportStatus.PENDING_APPROVAL}>Pending Approval</option>
                <option value={ReportStatus.ASSIGNED}>Assigned</option>
                <option value={ReportStatus.IN_PROGRESS}>In Progress</option>
                <option value={ReportStatus.SUSPENDED}>Suspended</option>
                <option value={ReportStatus.REJECTED}>Rejected</option>
                <option value={ReportStatus.RESOLVED}>Resolved</option>
              </select>
            </div>
          ) : <div className="w-full sm:w-auto" />}
          <Button
            variant="outline"
            size="md"
            onClick={handleReload}
            disabled={loading}
            className="flex items-center justify-center sm:justify-start space-x-2 w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reload</span>
          </Button>
        </div>
      </div>

      <PaginatedTable
        paginatedData={paginated}
        columns={columns}
        onPageChange={handlePageChange}
        onRowClick={(r) => navigate(`/municipality/report/${(r as Report).id}`, { state: { report: r } })}
        className={loading ? 'opacity-70' : ''}
        tableId = "report-table"
      />
    </div>
  )
}
