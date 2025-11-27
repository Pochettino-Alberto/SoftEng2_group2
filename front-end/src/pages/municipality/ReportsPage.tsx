import { useEffect, useState } from 'react'
import PaginatedTable from '../../components/PaginatedTable'
import type { Column } from '../../components/PaginatedTable'
import { reportAPI } from '../../api/reports'
import type { Report } from '../../types/report'
import { useNavigate } from 'react-router-dom'

export default function ReportsPage() {
  const [pageSize] = useState(10)
  const [paginated, setPaginated] = useState({ page_num: 1, page_size: pageSize, total_pages: 1, total_items: 0, items: [] as Report[] })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchPage = async (p: number) => {
    setLoading(true)
    try {
      const res = await reportAPI.searchReportsPaginated({ page_num: p, page_size: pageSize })
  setPaginated(res)
    } catch (err) {
      console.error('Failed to load reports', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(1)
  }, [])

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= paginated.total_pages) fetchPage(p)
  }

  const columns: Column<Report>[] = [
    { header: 'ID', accessor: (r: Report) => r.id },
    { header: 'Title', accessor: (r: Report) => r.title },
    { header: 'Category', accessor: (r: Report) => r.category?.name || '' },
    { header: 'Location', accessor: (r: Report) => (
        r && r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number'
          ? `${r.location.lat.toFixed(6)}, ${r.location.lng.toFixed(6)}`
          : '—'
      ) },
    { header: 'Status', accessor: (r: Report) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'Resolved' ? 'bg-green-100 text-green-700' : r.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
      ) },
    { header: 'Reporter', accessor: (r: Report) => (r && r.anonymous ? 'Anonymous' : (r && (r.reporter || '—')) ) },
  ]

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
      </div>

      <PaginatedTable
        paginatedData={paginated}
        columns={columns}
        onPageChange={handlePageChange}
        onRowClick={(r) => navigate(`/municipality/report/${(r as Report).id}`, { state: { report: r } })}
        className={loading ? 'opacity-70' : ''}
      />
    </div>
  )
}
