import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { userType } = useParams<{ userType?: string }>();


  const isCitizenLogin = userType === 'citizen';
  const isAdminLogin = userType === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ username, password });
      
    
      if (isCitizenLogin && user.user_type !== 'citizen') {
        setError('This login is for citizens only. Please use the Admin/Staff login.');
        setLoading(false);
        return;
      }
      
      if (isAdminLogin && user.user_type === 'citizen') {
        setError('This login is for admin and staff only. Please use the Citizen login.');
        setLoading(false);
        return;
      }
      

      if (user) {
        switch (user.user_type) {
          case 'admin':
            navigate('/admin');
            break;
          case 'municipality':
            navigate('/municipality');
            break;
          case 'citizen':
          default:
            navigate('/citizen');
            break;
        }
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
          <div className="flex justify-center mb-4">
            <svg style={{ color: '#5199CD' }} className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCitizenLogin ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              )}
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {isCitizenLogin ? 'Citizen Login' : 'Admin / Staff Login'}
          </h2>
          <p className="text-gray-600">
            {isCitizenLogin 
              ? 'Sign in to report and track issues' 
              : 'Sign in with your official credentials'}
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: '#5199CD' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">
              {isCitizenLogin ? "Don't have an account yet?" : 'Are you a citizen?'}
            </p>
            {isCitizenLogin ? (
              <Link
                to="/auth/register"
                className="block w-3/4 mx-auto text-center border-2 py-2.5 px-4 rounded-md font-medium transition-colors hover:bg-gray-50 mb-4"
                style={{ borderColor: '#5199CD', color: '#5199CD' }}
              >
                Sign Up as Citizen
              </Link>
            ) : (
              <Link
                to="/auth/login/citizen"
                className="block w-3/4 mx-auto text-center border-2 py-2.5 px-4 rounded-md font-medium transition-colors hover:bg-gray-50 mb-4"
                style={{ borderColor: '#5199CD', color: '#5199CD' }}
              >
                Go to Citizen Login
              </Link>
            )}
            {!isCitizenLogin && (
              <p className="text-xs text-center text-gray-500 mt-1">
                Staff accounts are created by system administrators
              </p>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/auth/account" className="text-gray-600 hover:text-gray-900">
            ← Back to Account Selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
