import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <svg style={{ color: '#5199CD' }} className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-2xl font-bold text-gray-800">Participium</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              disabled 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              title="Coming Soon"
            >
              View Reports
            </button>
            <button 
              disabled 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              title="Coming Soon"
            >
              Statistics
            </button>

            {isAuthenticated ? (
              <>
                <Link 
                  to={`/${user?.user_type}`} 
                  style={{ color: '#5199CD' }}
                  className="hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/account"
                  style={{ backgroundColor: '#5199CD' }}
                  className="text-white hover:opacity-90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
