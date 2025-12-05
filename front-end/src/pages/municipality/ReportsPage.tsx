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
  const [pageSize] = useState(5)
  const [paginated, setPaginated] = useState({ page_num: 1, page_size: pageSize, total_pages: 1, total_items: 0, items: [] as Report[] })
  const [loading, setLoading] = useState(false)
  const [onlyPending, setOnlyPending] = useState(true)
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({})
  const navigate = useNavigate()

  const fetchPage = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page_num: p, page_size: pageSize }
      if (onlyPending) params.status = ReportStatus.PENDING_APPROVAL
      const toPaginated = (items: Report[]) => ({
        page_num: 1,
        page_size: pageSize,
        total_pages: 1,
        total_items: items.length,
        items,
      });
      let res: any;

      // Shows all reports if the user has the 'Public Relationship municipal officer' role
      if(user?.userRoles.some((r) => r.role_type === 'publicRelations_officer')){
        res = await reportAPI.searchReportsPaginated(params)
        //console.log('Municipal Public Relations Officer - can see all reports');
      } else if(user?.userRoles.some((r) => r.role_type === 'technical_officer')){
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
  }, [onlyPending])

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

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex items-center space-x-4">
          <Button
            variant={onlyPending ? 'primary' : 'outline'}
            size="md"
            onClick={() => setOnlyPending((v) => !v)}
            aria-pressed={onlyPending}
            className="ml-2"
          >
            Pending
          </Button>
        </div>
      </div>

      <PaginatedTable
        paginatedData={{ ...paginated, items: (onlyPending ? paginated.items.filter((r) => r.status === ReportStatus.PENDING_APPROVAL) : paginated.items) }}
        columns={columns}
        onPageChange={handlePageChange}
        onRowClick={(r) => navigate(`/municipality/report/${(r as Report).id}`, { state: { report: r } })}
        className={loading ? 'opacity-70' : ''}
      />
    </div>
  )
}
