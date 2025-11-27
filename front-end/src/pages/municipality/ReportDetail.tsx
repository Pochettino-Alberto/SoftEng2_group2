import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { reportAPI } from '../../api/reports'
import type { Report, ReportCategory } from '../../types/report'
import Button from '../../components/Button'
import Card from '../../components/Card'

const ReportDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [selectedAction, setSelectedAction] = useState<'accept' | 'reject'>('accept')
  const [editingStatus, setEditingStatus] = useState(true)
  const [categoriesCache, setCategoriesCache] = useState<ReportCategory[] | null>(null)

  const fetchReport = async (reportId: number) => {
    setLoading(true)
    try {
      const res = await reportAPI.getReportById(reportId)
      setReport(res)
    } catch (err) {
      console.error(err)
      setError('Could not load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stateReport = (location.state as any)?.report as Report | undefined
    if (stateReport) {
      ;(async () => {
        const augmented = await augmentReportFromList(stateReport)
        setReport(augmented)
      })()
      return
    }

    if (!id) return
    const rid = parseInt(id, 10)
    if (isNaN(rid)) return
    fetchReport(rid)
  }, [id, location])

  useEffect(() => {
    if (!report) return
    setEditingStatus(!(report.status === 'Assigned' || report.status === 'Rejected'))
  }, [report])

  // when entering edit mode for an already rejected report, prefill the reject action and reason
  useEffect(() => {
    if (!report) return
    if (editingStatus && report.status === 'Rejected') {
      setSelectedAction('reject')
      setReason(report.status_reason || '')
    }
  }, [editingStatus, report])

  async function augmentReportFromList(r: Report): Promise<Report> {
    const copy: any = { ...r }

    if ((!copy.location || typeof copy.location.lat !== 'number') && (typeof copy.latitude === 'number' || typeof copy.longitude === 'number')) {
      copy.location = {
        lat: typeof copy.latitude === 'number' ? copy.latitude : 0,
        lng: typeof copy.longitude === 'number' ? copy.longitude : 0,
      }
    }

    if (!copy.category && typeof copy.category_id === 'number') {
      try {
        let cats = categoriesCache
        if (!cats) {
          cats = await reportAPI.getReportCategories()
          setCategoriesCache(cats)
        }
        const found = cats.find((c) => c.id === copy.category_id)
        if (found) copy.category = found
      } catch (e) {
        console.warn('Failed to load categories', e)
      }
    }

    if (!copy.reporter && copy.reporter_id) {
      copy.reporter = `User #${copy.reporter_id}`
    }

    if (Array.isArray(copy.photos) && copy.photos.length > 0 && typeof copy.photos[0] === 'object') {
      try {
        copy.photos = copy.photos.map((ph: any) => ph.photo_public_url || ph.photo || '')
      } catch (e) {
        // ignore
      }
    }

    return copy as Report
  }

  

  if (error) {
    return <div className="max-w-3xl mx-auto mt-8 text-red-600">{error}</div>
  }

  if (!report) {
    return <div className="max-w-3xl mx-auto mt-8">{loading ? 'Loading...' : 'Report not found'}</div>
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{report.title}</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Status: <span className="font-semibold">{report.status}</span></div>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-700">{report.description}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Category: {report.category?.name}</p>
          <p className="text-sm text-gray-600">Location: {report.location && typeof report.location.lat === 'number' && typeof report.location.lng === 'number' ? `${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}` : '—'}</p>
          <p className="text-sm text-gray-600">Reporter: {report.anonymous ? 'Anonymous' : report.reporter || '—'}</p>
          {report.status === 'Rejected' && report.status_reason && (
            <p className="text-sm text-red-600">Rejection reason: {report.status_reason}</p>
          )}
        </div>

        {report.photos && report.photos.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {report.photos.map((p, idx) => (
              <img key={idx} src={p} alt={`photo-${idx}`} className="w-full h-40 object-cover rounded" />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            {editingStatus ? (
              <>
                <Button
                  variant={selectedAction === 'accept' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setSelectedAction('accept')}
                  disabled={loading}
                  style={selectedAction === 'accept' ? { backgroundColor: '#16a34a' } : { borderColor: '#16a34a', color: '#16a34a' }}
                >
                  Accept
                </Button>
                <Button
                  variant={selectedAction === 'reject' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setSelectedAction('reject')}
                  disabled={loading}
                  style={selectedAction === 'reject' ? { backgroundColor: '#dc2626' } : { borderColor: '#dc2626', color: '#dc2626' }}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditingStatus(true)}>Edit report status</Button>
            )}
          </div>

          {selectedAction === 'reject' && editingStatus && (
            <div className="mt-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Provide rejection reason" rows={4} />
            </div>
          )}

          {/* Submit area at bottom */}
          {editingStatus && (
            <div className="mt-4 flex justify-end">
              <Button
                style={selectedAction === 'accept' ? { backgroundColor: '#16a34a' } : { backgroundColor: '#dc2626' }}
                disabled={loading || (selectedAction === 'reject' && !reason.trim()) || report.status === 'In Progress'}
                onClick={async () => {
                  if (!report) return
                  setLoading(true)
                  try {
                    if (selectedAction === 'accept') {
                      await reportAPI.updateReportStatus(report.id, 'Assigned')
                      setReport({ ...report, status: 'Assigned', status_reason: undefined })
                    } else {
                      await reportAPI.updateReportStatus(report.id, 'Rejected', reason)
                      setReport({ ...report, status: 'Rejected', status_reason: reason })
                      setReason('')
                    }
                    setEditingStatus(false)
                  } catch (err) {
                    console.error(err)
                    setError('Failed to update report status')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ReportDetail
