import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookie-based sessions
  timeout: 5000, // 5 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 if we're just checking auth status
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/current')) {
      // Handle unauthorized access
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
