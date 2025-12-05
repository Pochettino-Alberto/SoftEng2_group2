import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { reportAPI } from '../../api/reports'
import type { Report, ReportCategory } from '../../types/report'
import type { User } from '../../types/user'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Toast from '../../components/Toast'

const ReportDetail: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [reason, setReason] = useState('')
    const [selectedAction, setSelectedAction] = useState<'accept' | 'reject'>('reject')
    const [categoriesCache, setCategoriesCache] = useState<ReportCategory[] | null>(null)

    const [tosUsers, setTosUsers] = useState<User[]>([])
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null)
    const [tosLoading, setTosLoading] = useState(false)

    const fetchedCategoriesRef = useRef<Set<number>>(new Set())

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const fetchReport = useCallback(async (reportId: number) => {
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
    }, [])

    const fetchTosUsers = useCallback(async (categoryId: number) => {
        if (fetchedCategoriesRef.current.has(categoryId)) return

        fetchedCategoriesRef.current.add(categoryId)
        setTosLoading(true)
        try {
            const users = await reportAPI.getTOSUsersByCategory(categoryId)
            setTosUsers(users)
            if (users.length > 0) {
                setSelectedTechnicianId(users[0].id)
            } else {
                setTosUsers([])
                setSelectedTechnicianId(null)
            }
        } catch (err) {
            console.error(err)
            setTosUsers([])
            setSelectedTechnicianId(null)
        } finally {
            setTosLoading(false)
        }
    }, [])

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
    }, [id, location, fetchReport])

    useEffect(() => {
        if (!report) return
        console.log(report);

        if (selectedAction === 'accept' && report.status === 'Pending Approval' && report.category_id) {
            fetchTosUsers(report.category_id)
        }
    }, [report, selectedAction, fetchTosUsers])

    useEffect(() => {
        if (!report) return
        if (report.status === 'Rejected') {
            setSelectedAction('reject')
            setReason(report.status_reason || '')
        }
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
                console.warn(e)
            }
        }

        if (!copy.reporter && copy.reporter_id) {
            copy.reporter = `User #${copy.reporter_id}`
        }

        return copy as Report
    }

    const handleSubmit = async () => {
        if (!report) return
        setLoading(true)
        setError('')
        try {
            if (selectedAction === 'accept') {
                if (!selectedTechnicianId) {
                    setError('Please select a technician to assign the report.')
                    setLoading(false)
                    return
                }

                const updatedReport = await reportAPI.assignReportToUser(report.id, selectedTechnicianId)

                setReport((prev) => prev ? { ...prev, status: updatedReport.status, status_reason: updatedReport.status_reason, assigned_from: updatedReport.assigned_from, assigned_to: updatedReport.assigned_to } : null)
                setToast({ message: 'Report assigned successfully', type: 'success' })

            } else {
                await reportAPI.updateReportStatus(report.id, 'Rejected', reason)
                setReport((prev) => prev ? { ...prev, status: 'Rejected', status_reason: reason } : null)
                setReason('')
                setToast({ message: 'Report rejected', type: 'success' })
            }

        } catch (err) {
            console.error(err)
            setError('Failed to update report status.')
        } finally {
            setLoading(false)
        }
    }

    if (error && !loading && !report) {
        return <div className="max-w-3xl mx-auto mt-8 text-red-600">{error}</div>
    }

    if (!report) {
        return <div className="max-w-3xl mx-auto mt-8">{loading ? 'Loading...' : 'Report not found'}</div>
    }

    return (
        <div className="max-w-4xl mx-auto mt-8">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => setToast(null)}
                />
            )}

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
                    <p className="text-sm text-gray-600">Location: {report.location ? `${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}` : '—'}</p>
                    <p className="text-sm text-gray-600">Reporter: {!report.is_public ? 'Anonymous' : report.reporter.first_name + ' ' +  report.reporter.last_name + ' [' + report.reporter.username + ']'  || '—'}</p>
                    {report.status === 'Rejected' && report.status_reason && (
                        <p className="text-sm text-red-600">Rejection reason: {report.status_reason}</p>
                    )}
                    {report.status === 'Assigned' && (
                        <p className="text-sm text-gray-600">
                            Assigned To: {report.assigned_to ? `${report.assigned_to.first_name} ${report.assigned_to.last_name} [${report.assigned_to.username}]` : '—'}
                        </p>
                    )}
                </div>

                {report.photos && report.photos.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        {report.photos.map((p, idx) => (
                            <img key={idx} src={p.photo_public_url} alt={`photo-${idx}`} className="w-64 h-64 object-cover rounded" />
                        ))}
                    </div>
                )}

                {/* Only show action buttons for Pending Approval reports */}
                {report.status === 'Pending Approval' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant={selectedAction === 'accept' ? 'primary' : 'outline'}
                                size="md"
                                onClick={() => setSelectedAction('accept')}
                                disabled={loading}
                                style={selectedAction === 'accept' ? { backgroundColor: '#16a34a' } : { borderColor: '#16a34a', color: '#16a34a' }}
                            >
                                Accept & Assign
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
                        </div>

                        {selectedAction === 'accept' && (
                            <div className="mt-2">
                                <label htmlFor="technician-select" className="block text-sm font-medium text-gray-700 mb-1">Assign to Technician:</label>

                                <select
                                    id="technician-select"
                                    value={selectedTechnicianId || ''}
                                    onChange={(e) => setSelectedTechnicianId(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-green-500 focus:border-green-500"
                                    disabled={loading || tosLoading || tosUsers.length === 0}
                                >
                                    {tosUsers.length === 0 ? (
                                        <option value="">{tosLoading ? 'Loading technicians...' : 'No technicians found for this category'}</option>
                                    ) : (
                                        tosUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.first_name} {user.last_name} ({user.id})
                                            </option>
                                        ))
                                    )}
                                </select>

                                {!tosLoading && tosUsers.length === 0 && (
                                    <p className="text-red-500 text-sm mt-1">
                                        No TOS users found for this category. Cannot assign.
                                    </p>
                                )}

                                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                            </div>
                        )}

                        {selectedAction === 'reject' && (
                            <div className="mt-2">
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Provide rejection reason" rows={4} />
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <Button
                                style={selectedAction === 'accept' ? { backgroundColor: '#16a34a' } : { backgroundColor: '#dc2626' }}
                                disabled={
                                    loading ||
                                    (selectedAction === 'reject' && !reason.trim()) ||
                                    (selectedAction === 'accept' && !selectedTechnicianId)
                                }
                                onClick={handleSubmit}
                            >
                                Submit {selectedAction === 'accept' ? 'Assignment' : 'Rejection'}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ReportDetail