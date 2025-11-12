import React from 'react';
import Card from '../../components/Card';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-3">Create Municipality User</h3>
                        <p className="text-gray-600 mb-4">Create internal municipality accounts (municipal officers, technicians, admins).</p>

                        <Link to="/admin/create-municipality-user">
                            <Button
                                type="submit"
                                style={{ backgroundColor: '#5199CD' }}
                            >
                                Create User
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-3">Assign Roles to Users</h3>
                        <p className="text-gray-600 mb-4">Assign or update predefined roles to municipality users.</p>

                        <Link to="/admin/assign-roles">
                            <Button
                                type="submit"
                                style={{ backgroundColor: '#5199CD' }}
                            >
                                Assign Roles
                            </Button>
                        </Link>
                    </Card>
                </div>

                <Card className="p-8 mt-6">
                    <p className="text-gray-600">Other admin functionality coming soon...</p>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;