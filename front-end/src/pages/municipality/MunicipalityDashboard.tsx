import React from 'react';
import Card from '../../components/Card';
import ReportsPage from './ReportsPage';


const MunicipalityDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Municipality Dashboard</h1>
        
        <Card className="p-4 sm:p-6 lg:p-8">
          <p className="text-sm sm:text-base text-gray-600">Municipality functionality coming soon...</p>
        </Card>
        <ReportsPage></ReportsPage>
      </div>
    </div>
  );
};

export default MunicipalityDashboard;
