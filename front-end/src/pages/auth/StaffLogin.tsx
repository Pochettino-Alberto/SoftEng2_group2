import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { scrollToTop } from '../../utils';

const StaffLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    scrollToTop();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ username, password });
      
      // Only allow municipality and admin users
      if (user.user_type === 'citizen') {
        setError('This page is for staff only. Citizens should use the regular sign up.');
        setLoading(false);
        return;
      }
      
      // Route based on user type
      if (user.user_type === 'admin') {
        navigate('/admin');
      } else if (user.user_type === 'municipality') {
        navigate('/municipality');
      }
    } catch (err: unknown) {
      setError('Invalid username or password');
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#E3F2FD' }}>
            <svg style={{ color: '#5199CD' }} className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Staff Portal</h2>
          <p className="text-gray-600">Sign in with your official credentials</p>
          <p className="text-sm text-gray-500 mt-2">For Municipality Officers and Administrators</p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              id="InputUsername"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />

            <Input
              id="InputPassword"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button
              id="loginBtnSubmit"
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: '#5199CD' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-1">
                👤 Are you a citizen?
              </p>
              <p className="text-sm text-blue-600 mb-3">
                Citizens can create their own accounts and start reporting issues right away!
              </p>
              <Link 
                to="/auth/register" 
                className="text-sm font-medium hover:underline"
                style={{ color: '#5199CD' }}
              >
                Create a citizen account →
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Staff accounts are created by system administrators.
          </p>
          <p className="text-xs text-gray-500">
            If you need access, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
