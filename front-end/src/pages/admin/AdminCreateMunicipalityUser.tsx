import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Input from '../../components/Input'
import Button from '../../components/Button'
import {useAuth} from "../../context/AuthContext.tsx";
import type {UserRole} from "../../types/user.ts";
import {authAPI} from "../../api/auth.ts";

const AdminCreateMunicipalityUser: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [roles, setRoles] = useState<UserRole[]>([])
    const [selectedRoles, setSelectedRoles] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [rolesError, setRolesError] = useState('');

    const navigate = useNavigate()
    const { registerMunicipalityUser } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const fetchRoles = async () => {
            setRolesError('');
            try {
                const rolesData = await authAPI.getRoles();
                setRoles(rolesData || []);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
                setRolesError('Failed to load user roles. Please try refreshing the page.');
            }
        };

        fetchRoles();
    }, [])

    const toggleRole = (id: number) => {
        setSelectedRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 💡 Validation check
        if (!validate()) {
            setErrors(prev => ({ ...prev, submit: 'Please correct the errors below.' }));
            return;
        }

        setLoading(true)
        setErrors(prev => ({ ...prev, submit: '' }));

        try {
            await registerMunicipalityUser({
                ...formData,
                rolesArray: selectedRoles,
            });

            navigate('/admin')
        } catch (err: unknown) {
            console.error('User creation failed:', err);
            setErrors(prev => ({
                ...prev,
                submit: 'Failed to create municipality user. Username or email may already exist.',
            }));

        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Create Municipality User</h1>

                <Card className="p-4 sm:p-6">
                    {errors.submit && <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded mb-4 sm:mb-6">{errors.submit}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <Input
                            id="InputUsername"
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            error={errors.username}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <Input
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                error={errors.first_name}
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                error={errors.last_name}
                            />
                        </div>

                        <Input
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            required
                            error={errors.email}
                        />
                        <Input
                            id="InputPassword"
                            label="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            type="password"
                            required
                            error={errors.password} // 💡 Pass error prop
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles (optional)</label>
                            {rolesError && <div className="text-xs sm:text-sm text-red-600 mb-2">{rolesError}</div>} {/* Display roles fetching error */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {roles.map(r => (
                                    <label key={r.id} className="flex items-center space-x-2 bg-white p-2 sm:p-3 rounded border">
                                        <input
                                            type="checkbox"
                                            checked={selectedRoles.includes(r.id)}
                                            onChange={() => toggleRole(r.id)}
                                        />
                                        <span className="text-xs sm:text-sm">{r.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <Button type="submit" disabled={loading} style={{ backgroundColor: '#5199CD' }} className="w-full sm:w-auto">
                                {loading ? 'Creating...' : 'Create Municipality User'}
                            </Button>
                            <Link to="/admin" className="text-xs sm:text-sm text-gray-600">Back to Admin</Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default AdminCreateMunicipalityUser