import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { Link } from 'react-router-dom';
import ReportsMap from '../../components/Map';
import { reportAPI } from '../../api/reports';
import type { Report } from '../../types/report';

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [approvedReports, setApprovedReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchApprovedReports = async () => {
      try {
        const approvedStatuses = ["Assigned", "In Progress", "Suspended"]
        const reports = await reportAPI.getMapReports(approvedStatuses);
        setApprovedReports(reports || []);
      } catch (error) {
        console.error('Failed to load approved reports:', error);
        setApprovedReports([]);
      }
    };

    fetchApprovedReports();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Welcome, {user?.first_name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your reports and track their progress</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          <Link to="/citizen/report/new" className="sm:col-span-2 lg:col-span-1">
            <Card className="p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-shadow">
              <div id="createNewReportBtn" className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Create Report</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Report a new issue</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/citizen/profile" className="sm:col-span-2 lg:col-span-1">
            <Card className="p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Profile</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Manage your account</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mt-8 sm:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Citizens' Reports</h2>
          <Card className="p-2 sm:p-3 overflow-hidden">
            <div className="h-96 rounded-lg overflow-hidden">
              <ReportsMap 
                reports={approvedReports}
                currentPopUp={null}
                setCurrentPopUp={() => {}}
                hasSelect={false}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
