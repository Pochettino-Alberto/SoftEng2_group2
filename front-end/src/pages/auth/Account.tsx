import React from 'react';
import { Link } from 'react-router-dom';

const Account: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg style={{ color: '#5199CD' }} className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Participium</h2>
          <p className="text-gray-600">Choose your account type to continue</p>
        </div>

        <div className="space-y-6">
          {/* Citizen Option */}
          <Link to="/auth/login/citizen" className="block mb-6">
            <div className="p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-blue-400 rounded-lg shadow-md" style={{ backgroundColor: '#E8F4FD' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div style={{ backgroundColor: '#5199CD' }} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#5199CD' }}>Citizen</h3>
                </div>
                <svg style={{ color: '#5199CD' }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Admin Option */}
          <Link to="/auth/login/admin" className="block">
            <div className="p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-purple-400 rounded-lg shadow-md" style={{ backgroundColor: '#F3E8FF' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div style={{ backgroundColor: '#9333EA' }} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-purple-700">Admin / Municipality Staff</h3>
                </div>
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-3">Don't have an account yet?</p>
          <Link
            to="/auth/register"
            className="inline-block border-2 py-2 px-6 rounded-md font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#5199CD', color: '#5199CD' }}
          >
            Sign Up as Citizen
          </Link>
          <p className="text-xs text-gray-500 mt-3">
            Admin and staff accounts are created by system administrators
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Account;
