import React from 'react';
import Card from '../../components/Card';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="p-4 sm:p-6 flex flex-col">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Create Municipality User</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex-grow">Create new municipality staff accounts</p>

                        <Link to="/admin/create-municipality-user" className="inline-block w-full sm:w-auto">
                            <Button
                                type="submit"
                                style={{ backgroundColor: '#5199CD' }}
                                className="w-full sm:w-auto"
                            >
                                Create User
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-4 sm:p-6 flex flex-col">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Assign Roles to Users</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex-grow">Manage user roles and permissions</p>

                        <Link to="/admin/assign-roles" className="inline-block w-full sm:w-auto">
                            <Button
                                type="submit"
                                style={{ backgroundColor: '#5199CD' }}
                                className="w-full sm:w-auto"
                            >
                                Assign Roles
                            </Button>
                        </Link>
                    </Card>
                </div>

                <Card className="p-4 sm:p-6 lg:p-8 mt-4 sm:mt-6">
                    <p className="text-sm sm:text-base text-gray-600">Other admin functionality coming soon...</p>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;