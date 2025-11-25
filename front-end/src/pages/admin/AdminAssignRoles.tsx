import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Link } from 'react-router-dom'
import type {Role, User} from "../../types/user.ts";
import { authAPI } from '../../api/auth.ts';

const AdminAssignRoles: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [selectedRoles, setSelectedRoles] = useState<number[]>([])
    const [assignedRoles, setAssignedRoles] = useState<number[]>([])
    const [showRoles, setShowRoles] = useState(false)
    const [updatedUsers, setUpdatedUsers] = useState<Array<{ userId: number; username: string; roles: string[] }>>([])

    const [rolesError, setRolesError] = useState('');
    const [usersError, setUsersError] = useState('');

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const fetchInitialData = async () => {
            setRolesError('');
            setUsersError('');

            try {
                const rolesData = await authAPI.getRoles();
                setRoles(rolesData || []);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
                setRolesError('Failed to load roles list.');
            }

            try {
                const usersData = await authAPI.searchUsers('municipality');
                setUsers(usersData || []);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setUsersError('Failed to load user list.');
            }
        };

        fetchInitialData();
    }, [])

    useEffect(() => {
        setAssignedRoles([]);
        setSelectedRoles([]);
        setShowRoles(false);

        if (selectedUserId !== null) {
            const fetchAssignedRoles = async (userId: number) => {
                try {
                    const userRoles = await authAPI.getUserRoles(userId);
                    const roleIds = userRoles.map(r => r.id);
                    setAssignedRoles(roleIds);
                    setSelectedRoles(roleIds);
                    setShowRoles(true);
                } catch (err) {
                    console.error(`Failed to fetch roles for user ${userId}:`, err);
                    setMessage('Could not load current roles for the selected user.');
                }
            };
            fetchAssignedRoles(selectedUserId);
        }
    }, [selectedUserId])

    const handleUserChange = (id: number) => {
        setSelectedUserId(id);
        setMessage('');
    }

    const toggleRole = (id: number) => {
        setSelectedRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedUserId === null) {
            setMessage('Select a user first');
            return;
        }
        setLoading(true)
        setMessage('')
        try {
            await authAPI.assignRoles({ userId: selectedUserId, rolesArray: selectedRoles });
            setMessage('Roles updated successfully');
            setAssignedRoles(selectedRoles);
            
            // Add to updated users list
            const selectedUser = users.find(u => u.id === selectedUserId);
            const assignedRoleNames = roles.filter(r => selectedRoles.includes(r.id)).map(r => r.label);
            
            if (selectedUser) {
                setUpdatedUsers(prev => {
                    const existing = prev.findIndex(u => u.userId === selectedUserId);
                    const newEntry = {
                        userId: selectedUserId,
                        username: selectedUser.username,
                        roles: assignedRoleNames
                    };
                    
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = newEntry;
                        return updated;
                    }
                    return [...prev, newEntry];
                });
            }
            
            // Collapse roles section
            setShowRoles(false);
            setSelectedUserId(null);
        } catch (err: unknown) {
            console.error('Failed to update roles:', err);
            let errorMsg = 'Failed to update roles.';
            if (err instanceof Error) {
                errorMsg = err.message || errorMsg;
            }
            setMessage(errorMsg);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Assign Roles to User</h1>
                    <Link to="/admin">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Success/Error Notification */}
                {message && (
                    <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border-l-4 ${
                        message.includes('success') 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                    }`}>
                        <div className="flex items-start">
                            {message.includes('success') ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <div>
                                <p className={`text-sm sm:text-base font-semibold ${
                                    message.includes('success') ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    {message.includes('success') ? 'Success!' : 'Error'}
                                </p>
                                <p className={`text-xs sm:text-sm mt-1 ${
                                    message.includes('success') ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <Card className="p-4 sm:p-6">
                    <form onSubmit={submit} className="space-y-4 sm:space-y-6">
                        {/* User Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <svg className="w-4 h-4 inline mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Select User
                            </label>
                            {usersError && (
                                <div className="mb-2 p-2 bg-red-50 border-l-4 border-red-500 rounded-r text-xs sm:text-sm text-red-700">
                                    {usersError}
                                </div>
                            )}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <select
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                                    style={{ '--tw-ring-color': '#5199CD' } as React.CSSProperties}
                                    onChange={(e) => handleUserChange(Number(e.target.value))}
                                    value={selectedUserId ?? ''}
                                    disabled={usersError !== ''}
                                >
                                    <option value="">Choose a user...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.username} — {u.first_name} {u.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Show roles section only when a user is selected and showRoles is true */}
                        {showRoles && selectedUserId !== null && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <svg className="w-4 h-4 inline mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Assign Roles
                                    </label>
                                    {rolesError && (
                                        <div className="mb-2 p-2 bg-red-50 border-l-4 border-red-500 rounded-r text-xs sm:text-sm text-red-700">
                                            {rolesError}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                        {roles.map(r => {
                                            const isAssigned = assignedRoles.includes(r.id);
                                            const isSelected = selectedRoles.includes(r.id);

                                            return (
                                                <label
                                                    key={r.id}
                                                    className={`flex items-center space-x-3 p-3 sm:p-3.5 rounded-lg border-2 transition-all cursor-pointer
                                                        ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleRole(r.id)}
                                                        className="w-4 h-4 rounded focus:ring-2"
                                                        style={{ accentColor: '#5199CD' }}
                                                    />
                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                        {r.label}
                                                        {isAssigned && (
                                                            <span className="ml-2 text-xs text-gray-500 font-normal">(Current)</span>
                                                        )}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading || selectedUserId === null || usersError !== '' || rolesError !== ''}
                                        style={{ backgroundColor: '#5199CD' }}
                                        className="w-full sm:w-auto"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Save Roles
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>
                </Card>

                {/* Selected Users List */}
                {updatedUsers.length > 0 && (
                    <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
                        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Selected Users</h2>
                        <div className="space-y-2 sm:space-y-3">
                            {updatedUsers.map((user) => (
                                <div key={user.userId} className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm sm:text-base text-gray-900">{user.username}</p>
                                            <div className="mt-1 flex flex-wrap gap-1 sm:gap-2">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {role}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs sm:text-sm text-gray-500 italic">No roles assigned</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    setSelectedUserId(user.userId);
                                                    setMessage('');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white rounded-md transition-colors hover:opacity-90"
                                                style={{ backgroundColor: '#5199CD' }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span className="hidden sm:inline">Edit Roles</span>
                                                <span className="sm:hidden">Edit</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default AdminAssignRoles