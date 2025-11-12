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
    // Transform frontend field names to backend field names
    const backendData = {
      username: userData.username,
      name: userData.first_name,
      surname: userData.last_name,
      email: userData.email,
      password: userData.password,
    };
    const response = await apiClient.post('/users/register-citizen', backendData);
    return response.data;
  },

  // Update current user profile
  updateProfile: async (userId: number, updates: { 
    username?: string; 
    name?: string; 
    surname?: string; 
    email?: string;
  }): Promise<User> => {
    const response = await apiClient.patch('/users/edit-me', {
      id: userId,
      ...updates,
    });
    return response.data;
  },
};
