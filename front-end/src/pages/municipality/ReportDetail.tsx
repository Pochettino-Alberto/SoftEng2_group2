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
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
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

  const handleAccept = async () => {
    if (!report) return
    setLoading(true)
    try {
      await reportAPI.updateReportStatus(report.id, 'Assigned')
      setReport({ ...report, status: 'Assigned' })
      setEditingStatus(false)
    } catch (err) {
      console.error(err)
      setError('Failed to accept report')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!report) return
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    setLoading(true)
    try {
      await reportAPI.updateReportStatus(report.id, 'Rejected', reason)
      setReport({ ...report, status: 'Rejected' })
      setEditingStatus(false)
      setShowReject(false)
    } catch (err) {
      console.error(err)
      setError('Failed to reject report')
    } finally {
      setLoading(false)
    }
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
        <div className="text-sm text-gray-600">Status: <span className="font-semibold">{report.status}</span></div>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-700">{report.description}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Category: {report.category?.name}</p>
          <p className="text-sm text-gray-600">Location: {report.location && typeof report.location.lat === 'number' && typeof report.location.lng === 'number' ? `${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}` : '—'}</p>
          <p className="text-sm text-gray-600">Reporter: {report.anonymous ? 'Anonymous' : report.reporter || '—'}</p>
        </div>

        {report.photos && report.photos.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {report.photos.map((p, idx) => (
              <img key={idx} src={p} alt={`photo-${idx}`} className="w-full h-40 object-cover rounded" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {editingStatus ? (
            <>
              <Button style={{ backgroundColor: '#16a34a' }} disabled={loading || report.status === 'Assigned' || report.status === 'In Progress'} onClick={handleAccept}>Accept</Button>
              <Button variant="outline" disabled={loading} onClick={() => setShowReject((prev) => !prev)}>Reject</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditingStatus(true)}>Edit report status</Button>
          )}

          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>

        {showReject && (
          <div className="mt-4">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Provide rejection reason" rows={4} />
            <div className="mt-2 flex gap-2">
              <Button style={{ backgroundColor: '#dc2626' }} disabled={loading} onClick={handleReject}>Submit Rejection</Button>
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ReportDetail
