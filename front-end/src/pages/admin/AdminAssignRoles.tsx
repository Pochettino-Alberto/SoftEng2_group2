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

    const [rolesError, setRolesError] = useState('');
    const [usersError, setUsersError] = useState('');

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const fetchInitialData = async () => {
            setRolesError('');
            setUsersError('');

            // Fetch Roles
            try {
                const rolesData = await authAPI.getRoles();
                setRoles(rolesData || []);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
                setRolesError('Failed to load roles list.');
            }

            // Fetch Users
            try {
                const usersData = await authAPI.searchUsers();
                setUsers(usersData || []);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setUsersError('Failed to load user list.');
            }
        };

        fetchInitialData();
    }, [])

    useEffect(() => {
        setAssignedRoles([]); // Clear previous assigned roles
        setSelectedRoles([]); // Clear previous selections

        if (selectedUserId !== null) {
            const fetchAssignedRoles = async (userId: number) => {
                try {
                    // Use the new API function
                    const userRoles = await authAPI.getUserRoles(userId);
                    // Map the fetched roles to just an array of IDs
                    const roleIds = userRoles.map(r => r.id);
                    setAssignedRoles(roleIds);
                    setSelectedRoles(roleIds);
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
        setMessage(''); // Clear previous message on user change
    }

    const toggleRole = (id: number) => {
        // You cannot toggle roles that are part of the 'assignedRoles' list
        if (assignedRoles.includes(id)) {
            return;
        }

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
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6">Assign Roles to User</h1>

                <Card className="p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                            {usersError && <div className="text-sm text-red-600 mb-2">{usersError}</div>}
                            <select
                                className="w-full p-2 border rounded"
                                onChange={(e) => handleUserChange(Number(e.target.value))}
                                value={selectedUserId ?? ''}
                                disabled={usersError !== ''}
                            >
                                <option value="">-- choose user --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.username} — {u.first_name} {u.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                            {rolesError && <div className="text-sm text-red-600 mb-2">{rolesError}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {roles.map(r => {
                                    const isAssigned = assignedRoles.includes(r.id);
                                    const isDisabled = isAssigned;

                                    return (
                                        <label
                                            key={r.id}
                                            className={`flex items-center space-x-2 p-2 rounded border transition-colors 
                                                ${isDisabled
                                                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(r.id)}
                                                onChange={() => toggleRole(r.id)}
                                                disabled={isDisabled} // Apply the disable logic here
                                                className={isDisabled ? 'opacity-50' : ''}
                                            />
                                            <span className="text-sm">
                                                {r.label}
                                                {isAssigned && ' (Assigned)'}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Message */}
                        {message && <div className={`text-sm ${message.includes('success') ? 'text-green-700' : 'text-red-700'}`}>{message}</div>}

                        <div className="flex items-center justify-between">
                            <Button
                                type="submit"
                                disabled={loading || selectedUserId === null || usersError !== '' || rolesError !== ''}
                                style={{ backgroundColor: '#5199CD' }}
                            >
                                {loading ? 'Saving...' : 'Save Roles'}
                            </Button>
                            <Link to="/admin" className="text-sm text-gray-600">
                                Back to Admin
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default AdminAssignRoles