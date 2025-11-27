import { useEffect, useState } from 'react'
import PaginatedTable from '../../components/PaginatedTable'
import type { Column } from '../../components/PaginatedTable'
import { reportAPI } from '../../api/reports'
import type { Report } from '../../types/report'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function ReportsPage() {
  const [pageSize] = useState(5)
  const [paginated, setPaginated] = useState({ page_num: 1, page_size: pageSize, total_pages: 1, total_items: 0, items: [] as Report[] })
  const [loading, setLoading] = useState(false)
  const [onlyPending, setOnlyPending] = useState(false)
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({})
  const navigate = useNavigate()

  const fetchPage = async (p: number) => {
    setLoading(true)
    try {
      const params: any = { page_num: p, page_size: pageSize }
      if (onlyPending) params.status = 'Pending Approval'
      const res = await reportAPI.searchReportsPaginated(params)
  setPaginated(res)
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

  const columns: Column<Report>[] = [
    { header: 'ID', accessor: (r: Report) => r.id },
    { header: 'Title', accessor: (r: Report) => r.title },
    { header: 'Category', accessor: (r: Report) => r.category?.name || (r.category_id ? categoriesMap[r.category_id] || '' : '') },
    { header: 'Status', accessor: (r: Report) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'Resolved' ? 'bg-green-100 text-green-700' : r.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
      ) },
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
        paginatedData={{ ...paginated, items: (onlyPending ? paginated.items.filter((r) => r.status === 'Pending Approval') : paginated.items) }}
        columns={columns}
        onPageChange={handlePageChange}
        onRowClick={(r) => navigate(`/municipality/report/${(r as Report).id}`, { state: { report: r } })}
        className={loading ? 'opacity-70' : ''}
      />
    </div>
  )
}
