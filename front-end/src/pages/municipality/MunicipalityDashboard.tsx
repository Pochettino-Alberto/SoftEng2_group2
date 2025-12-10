import React, { useState } from 'react';
import Card from '../../components/Card';
import ReportsPage from './ReportsPage';
import { useAuth } from '../../context/AuthContext';

const MunicipalityDashboard: React.FC = () => {
  const { user } = useAuth();

  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Municipality' : 'Municipality';
  const roleLabel = user?.user_type ? String(user.user_type).replace('_', ' ') : 'Municipality';
  const initials = user ? `${(user.first_name?.[0] || '')}${(user.last_name?.[0] || '')}`.toUpperCase() : 'M';
  const userRoles = user ? user.userRoles || [] : [];
  const [showInstructions, setShowInstructions] = useState(false);

  const roleTypes = userRoles.map(r => r.role_type);
  let primaryRole: string | null = null;
  if (roleTypes.includes('publicRelations_officer')) primaryRole = 'publicRelations_officer';
  else if (roleTypes.includes('technical_officer')) primaryRole = 'technical_officer';
  else if (roleTypes.includes('external_maintainer')) primaryRole = 'external_maintainer';

  const roleConfig: Record<string, { avatarBg: string; badgeBg: string; badgeText: string; title: string; instructions: string }> = {
    publicRelations_officer: {
      avatarBg: '#2563EB',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF',
      title: 'Public Relations Officer Dashboard',
      instructions: 'Review and approve or reject incoming reports. Rejections must include a short explanation; approved reports are forwarded to the technical office responsible for the report category.'
    },
    technical_officer: {
      avatarBg: '#D97706',
      badgeBg: '#FFFBEB',
      badgeText: '#92400E',
      title: 'Technical Officer Dashboard',
      instructions: 'Assign reports to external maintainers when needed so specialists can handle interventions. Update status and add brief notes as work progresses.'
    },
    external_maintainer: {
      avatarBg: '#059669',
      badgeBg: '#ECFDF5',
      badgeText: '#065F46',
      title: 'External Maintainer Dashboard',
      instructions: 'View tasks assigned to you, update progress and notes, and mark interventions as completed when finished.'
    }
  };

  const cfg = primaryRole ? roleConfig[primaryRole] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Card className="p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg sm:text-xl font-semibold"
              style={{ backgroundColor: cfg ? cfg.avatarBg : '#4F46E5' }}
            >
              {initials}
            </div>
            <div className="flex-1 w-full">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</div>
              
              {cfg && (
                <div className="mt-1">
                  <span className="text-sm font-semibold" style={{ color: cfg.badgeText }}>{cfg.title}</span>
                </div>
              )}
              

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: cfg ? cfg.badgeBg : '#D1FAE5', color: cfg ? cfg.badgeText : '#065F46' }}
                >
                  {roleLabel}
                </span>
                
                {userRoles.length > 0 && (
                  <span className="text-sm font-medium text-gray-500 mr-1 hidden sm:inline">| Roles:</span>
                )}

                {userRoles.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300 transition-colors"
                    >
                      {role.label}
                    </span>
                ))}
                {cfg && (
                  <button
                    onClick={() => setShowInstructions(true)}
                    className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200"
                    type="button"
                  >
                    How to use
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {showInstructions && cfg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowInstructions(false)} />
            <div className="relative max-w-md w-full mx-auto">
              <Card className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: cfg.badgeText }}>{cfg.title}</h3>
                    <p className="mt-2 text-sm text-gray-700">{cfg.instructions}</p>
                  </div>
                  <button onClick={() => setShowInstructions(false)} className="text-gray-500 hover:text-gray-700 flex-shrink-0 text-xl">✕</button>
                </div>
                <div className="mt-4 text-right">
                  <button onClick={() => setShowInstructions(false)} className="px-4 py-2 bg-gray-100 rounded text-sm font-medium hover:bg-gray-200">Close</button>
                </div>
              </Card>
            </div>
          </div>
        )}

        <ReportsPage />
      </div>
    </div>
  );
};

export default MunicipalityDashboard;
