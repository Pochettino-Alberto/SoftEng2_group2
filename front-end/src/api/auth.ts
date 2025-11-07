import apiClient from './client';
import type { User, LoginData, RegisterData } from '../types/user';

export const authAPI = {
  // Login a user
  login: async (credentials: LoginData): Promise<User> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Logout current user
  logout: async (): Promise<void> => {
    await apiClient.delete('/auth/logout');
  },

  // Get current logged-in user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/current');
    return response.data;
  },

  // Register a new citizen
  registerCitizen: async (userData: RegisterData): Promise<User> => {
    const response = await apiClient.post('/users/register-citizen', userData);
    return response.data;
  },
};
