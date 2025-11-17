import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { authAPI } from '../../api/auth';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: { username?: string; name?: string; surname?: string; email?: string } = {};
      
      if (formData.username !== user?.username) updates.username = formData.username;
      if (formData.first_name !== user?.first_name) updates.name = formData.first_name;
      if (formData.last_name !== user?.last_name) updates.surname = formData.last_name;
      if (formData.email !== user?.email) updates.email = formData.email;

      if (Object.keys(updates).length === 0) {
        setError('No changes detected');
        setLoading(false);
        return;
      }

      const updatedUser = await authAPI.updateProfile(user!.id, updates);
      setUser(updatedUser);
      
      setFormData({
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your personal information</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm sm:text-base font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 text-sm sm:text-base font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <Card>
          {/* User Header */}
          <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #5199CD 0%, #6BA9D8 100%)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#5199CD' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{user.first_name} {user.last_name}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm capitalize">{user.user_type} Account</p>
                </div>
              </div>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-white hover:bg-blue-50 w-full sm:w-auto" 
                  style={{ color: '#5199CD' }}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#5199CD' } as React.CSSProperties}
                      required
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2.5 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#5199CD' } as React.CSSProperties}
                      required
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2.5 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                )}
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#5199CD' } as React.CSSProperties}
                      required
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-2.5 rounded-lg">
                      <p className="text-gray-900">{user.first_name}</p>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#5199CD' } as React.CSSProperties}
                      required
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-2.5 rounded-lg">
                      <p className="text-gray-900">{user.last_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  style={{ backgroundColor: '#5199CD' }}
                  className="flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Info Note */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border" style={{ backgroundColor: '#E3F2FD', borderColor: '#5199CD' }}>
          <div className="flex items-start">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" style={{ color: '#5199CD' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs sm:text-sm font-medium" style={{ color: '#5199CD' }}>Account Information</p>
              <p className="text-xs sm:text-sm text-gray-700 mt-1">
                You can update your personal information at any time. Changes will be saved immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
