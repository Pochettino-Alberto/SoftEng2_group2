import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-2">Manage your reports and track their progress</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Create Report</h3>
                <p className="text-sm text-gray-600">Report a new issue</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">My Reports</h3>
                <p className="text-sm text-gray-600">View all your reports</p>
              </div>
            </div>
          </Card>

          <Link to="/citizen/profile">
            <Card className="p-6 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Profile</h3>
                  <p className="text-sm text-gray-600">Manage your account</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Reports Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Your Recent Reports</h2>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-4">You haven't created any reports yet</p>
            <Link to="/citizen/report/new">
              <Button>Create Your First Report</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CitizenDashboard;
