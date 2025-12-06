import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scrollToTop } from '../../utils';

const Account: React.FC = () => {
  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <svg style={{ color: '#5199CD' }} className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Welcome to Participium</h2>
          <p className="text-sm sm:text-base text-gray-600">Choose your account type to continue</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Citizen Account Option */}
          <Link to="/auth/login/citizen" className="block">
            <div id="SignIn_citizen" className="p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-blue-400 rounded-lg shadow-md" style={{ backgroundColor: '#E8F4FD' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div style={{ backgroundColor: '#5199CD' }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold" style={{ color: '#5199CD' }}>Citizen</h3>
                </div>
                <svg style={{ color: '#5199CD' }} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Admin Option */}
          <Link to="/auth/login/admin" className="block">
            <div id="SignIn_admin" className="p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-blue-300 rounded-lg shadow-md" style={{ backgroundColor: '#E6EDF5' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div style={{ backgroundColor: '#6B83A1' }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold" style={{ color: '#6B83A1' }}>Admin / Municipality Staff</h3>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#6B83A1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-3">Don't have an account yet?</p>
          <Link
            to="/auth/register"
            className="inline-block border-2 py-2 px-4 sm:px-6 rounded-md text-sm sm:text-base font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#5199CD', color: '#5199CD' }}
          >
            Sign Up as Citizen
          </Link>
          <p className="text-xs text-gray-500 mt-3">
            Admin and staff accounts are created by system administrators
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm sm:text-base text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Account;
