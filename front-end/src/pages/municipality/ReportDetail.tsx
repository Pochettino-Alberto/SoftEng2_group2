import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { reportAPI } from '../../api/reports'
import type { Report, ReportCategory } from '../../types/report'
import type { User } from '../../types/user'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Toast from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const ReportDetail: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [reason, setReason] = useState('')
    const [selectedAction, setSelectedAction] = useState<'accept' | 'reject'>('reject')
    const [categoriesCache, setCategoriesCache] = useState<ReportCategory[] | null>(null)

    const [tosUsers, setTosUsers] = useState<User[]>([])
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null)
    const [tosLoading, setTosLoading] = useState(false)

    const [maintainers, setMaintainers] = useState<User[]>([])
    const [selectedMaintainerId, setSelectedMaintainerId] = useState<number | null>(null)
    const [loadingMaintainers, setLoadingMaintainers] = useState(false)
    const [assigningMaintainer, setAssigningMaintainer] = useState(false)
    const [showMaintainerDropdown, setShowMaintainerDropdown] = useState(false)

    const fetchedCategoriesRef = useRef<Set<number>>(new Set())

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    // Photo carousel state
    const [isCarouselOpen, setIsCarouselOpen] = useState(false)
    const [carouselIndex, setCarouselIndex] = useState(0)

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

    const fetchMaintainers = useCallback(async () => {
        setLoadingMaintainers(true)
        try {
            const users = await reportAPI.getAllMaintainers()
            setMaintainers(users)
            if (users.length > 0) {
                setSelectedMaintainerId(users[0].id)
            }
        } catch (err) {
            console.error('Error fetching maintainers:', err)
            setMaintainers([])
            setSelectedMaintainerId(null)
        } finally {
            setLoadingMaintainers(false)
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

    const handleAssignMaintainer = async (maintainerId: number) => {
        if (!report) return
        setAssigningMaintainer(true)
        try {
            const updatedReport = await reportAPI.assignReportToMaintainer(report.id, maintainerId)
            setReport((prev) => prev ? { ...prev, maintainer_id: updatedReport.maintainer_id, maintainer: updatedReport.maintainer, status: updatedReport.status } : null)
            setToast({ message: 'Maintainer assigned successfully', type: 'success' })
            setShowMaintainerDropdown(false)
        } catch (err) {
            console.error('Error assigning maintainer:', err)
            setToast({ message: 'Failed to assign maintainer', type: 'error' })
        } finally {
            setAssigningMaintainer(false)
        }
    }

    const openCarouselAt = (index: number) => {
        setCarouselIndex(index)
        setIsCarouselOpen(true)
    }

    const closeCarousel = () => {
        setIsCarouselOpen(false)
    }

    const showPrev = () => {
        if (!report || !report.photos) return
        setCarouselIndex((i) => (i - 1 + report.photos!.length) % report.photos!.length)
    }

    const showNext = () => {
        if (!report || !report.photos) return
        setCarouselIndex((i) => (i + 1) % report.photos!.length)
    }

    useEffect(() => {
        if (!isCarouselOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') showPrev()
            if (e.key === 'ArrowRight') showNext()
            if (e.key === 'Escape') closeCarousel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isCarouselOpen, report])

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
                        <>
                            <p className="text-sm text-gray-600">
                                Assigned To: {report.assigned_to ? `${report.assigned_to.first_name} ${report.assigned_to.last_name} [${report.assigned_to.username}]` : '—'}
                            </p>
                            {report.maintainer_id && (
                                <p className="text-sm text-gray-600">
                                    Assigned Maintainer: {report.maintainer?.first_name} {report.maintainer?.last_name}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {report.photos && report.photos.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {report.photos.map((p, idx) => (
                                <button key={idx} onClick={() => openCarouselAt(idx)} className="block w-full h-40 overflow-hidden rounded shadow-sm focus:outline-none" aria-label={`Open photo ${idx + 1}`}>
                                    <img src={p.photo_public_url} alt={`photo-${idx}`} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-200" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Photo Carousel Modal */}
                {isCarouselOpen && report && report.photos && (
                    <div onClick={closeCarousel} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                        <div onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full mx-4">
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); closeCarousel(); }} aria-label="Close carousel" className="absolute top-2 right-2 z-50 text-white bg-gray-800 bg-opacity-40 rounded-full p-2 hover:bg-opacity-60">✕</button>
                            <div className="bg-black rounded">
                                <div className="relative">
                                    <img src={report.photos[carouselIndex].photo_public_url} alt={`photo-${carouselIndex}`} className="w-full max-h-[70vh] object-contain mx-auto" />
                                    <button onClick={(e) => { e.stopPropagation(); showPrev(); }} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 bg-opacity-40 p-3 rounded-full hover:bg-opacity-60 z-40">◀</button>
                                    <button onClick={(e) => { e.stopPropagation(); showNext(); }} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-gray-800 bg-opacity-40 p-3 rounded-full hover:bg-opacity-60 z-40">▶</button>
                                </div>
                                <div className="text-center text-sm text-white py-2">
                                    {carouselIndex + 1} / {report.photos.length}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Only show action buttons for Pending Approval reports */}
                {report.status === 'Pending Approval' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center space-x-2">
                            <Button
                                id="acceptAssignAction"
                                variant={selectedAction === 'accept' ? 'primary' : 'outline'}
                                size="md"
                                onClick={() => setSelectedAction('accept')}
                                disabled={loading}
                                style={selectedAction === 'accept' ? { backgroundColor: '#16a34a' } : { borderColor: '#16a34a', color: '#16a34a' }}
                            >
                                Accept & Assign
                            </Button>
                            <Button
                                id="rejectAction"
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
                                                {user.username}
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
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" id="rejectReasonInput" placeholder="Provide rejection reason" rows={4} />
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <Button
                                id="submmitChoice"
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

                {/* Assign/Edit Maintainer section for Technical Officers */}
                {report.status === 'Assigned' && user?.userRoles.some((r) => r.role_type === 'technical_officer') && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        {!report.maintainer_id ? (
                            <>
                                <p className="text-sm text-gray-600 mb-3">
                                    Assign this report to a maintainer for execution.
                                </p>
                                <Button
                                    id="assignMaintainerAction"
                                    onClick={() => {
                                        setShowMaintainerDropdown(true)
                                        fetchMaintainers()
                                    }}
                                    variant="primary"
                                    className="flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Assign Maintainer
                                </Button>
                            </>
                        ) : (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-800 mb-1">✓ Maintainer Assigned</p>
                                    <p className="text-sm text-green-700">
                                        {report.maintainer ? `${report.maintainer.first_name} ${report.maintainer.last_name}` : 'Maintainer'}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        setShowMaintainerDropdown(true)
                                        fetchMaintainers()
                                    }}
                                    variant="outline"
                                    size="md"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                    Edit
                                </Button>
                            </div>
                        )}

                        {/* Maintainer Selection Dropdown */}
                        {showMaintainerDropdown && (
                            <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
                                <div className="mb-4">
                                    <label htmlFor="maintainer-dropdown" className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Maintainer
                                    </label>
                                    {loadingMaintainers ? (
                                        <p className="text-gray-500 text-sm">Loading maintainers...</p>
                                    ) : maintainers.length === 0 ? (
                                        <p className="text-red-500 text-sm">No maintainers available</p>
                                    ) : (
                                        <select
                                            id="maintainer-dropdown"
                                            value={selectedMaintainerId || ''}
                                            onChange={(e) => setSelectedMaintainerId(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            disabled={assigningMaintainer}
                                        >
                                            {maintainers.map((maintainer) => (
                                                <option key={maintainer.id} value={maintainer.id}>
                                                    {maintainer.first_name} {maintainer.last_name} ({maintainer.username})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setShowMaintainerDropdown(false)}
                                        variant="outline"
                                        size="md"
                                        disabled={assigningMaintainer}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        id="assignMaintainer"
                                        onClick={() => {
                                            if (selectedMaintainerId) {
                                                handleAssignMaintainer(selectedMaintainerId)
                                            }
                                        }}
                                        variant="primary"
                                        size="md"
                                        disabled={
                                            assigningMaintainer ||
                                            loadingMaintainers ||
                                            maintainers.length === 0 ||
                                            !selectedMaintainerId
                                        }
                                    >
                                        {assigningMaintainer ? 'Assigning...' : 'Assign'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ReportDetail