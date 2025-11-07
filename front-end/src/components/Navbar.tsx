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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-2xl font-bold text-gray-800">Participium</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/reports" style={{ color: '#5199CD' }} className="hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              View Reports
            </Link>
            <Link to="/statistics" style={{ color: '#5199CD' }} className="hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Statistics
            </Link>

            {isAuthenticated ? (
              <>
                <Link 
                  to={`/${user?.user_type}`} 
                  style={{ color: '#5199CD' }}
                  className="hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.first_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  style={{ color: '#5199CD' }}
                  className="hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  style={{ backgroundColor: '#5199CD' }}
                  className="text-white hover:opacity-90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
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
