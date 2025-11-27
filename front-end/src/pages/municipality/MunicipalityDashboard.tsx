import React from 'react';
import Card from '../../components/Card';
import ReportsPage from './ReportsPage';
import { useAuth } from '../../context/AuthContext';

const MunicipalityDashboard: React.FC = () => {
  const { user } = useAuth();

  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Municipality' : 'Municipality';
  const roleLabel = user?.user_type ? String(user.user_type).replace('_', ' ') : 'Municipality';
  const initials = user ? `${(user.first_name?.[0] || '')}${(user.last_name?.[0] || '')}`.toUpperCase() : 'M';

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 lg:p-8 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
              {initials}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</div>
              {/* email intentionally hidden in dashboard */}
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {roleLabel}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <ReportsPage />
      </div>
    </div>
  );
};

export default MunicipalityDashboard;
