import apiClient from './client';
import type {User, LoginData, RegisterData, MunicipalityUser, UserRole} from '../types/user';

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

  // Register a new municipality user
  createMunicipalityUser: async (userData: MunicipalityUser): Promise<User> => {
    const backendData = {
      username: userData.username,
      name: userData.first_name,
      surname: userData.last_name,
      email: userData.email,
      password: userData.password,
      rolesArray: userData.rolesArray,
    };
    const response = await apiClient.post('/users/admin/create-municipality-user', backendData);
    return response.data;
  },

  assignRoles: async (data: { userId: number; rolesArray: number[] }) => {
    const response = await apiClient.post('/users/admin/assign-roles', data);
    return response.data;
  },

  getRoles: async (): Promise<UserRole[]> => {
    const response = await apiClient.get('/users/get-roles');
    return response.data;
  },

  searchUsers: async (role?: string): Promise<User[]> => {
    let url = '/users/search-users?page_num=1&page_size=100';

    if (role) {
      url += `&role=${role}`;
    }

    const response = await apiClient.get(url);
    return response.data?.items || [];
  },

  getUserRoles: async (userId: number): Promise<UserRole[]> => {
    const response = await apiClient.get(`/users/get-roles/${userId}`);
    return response.data.map((r: any) => ({
      id: r.RoleID,
      label: r.RoleName
    }));
  },
};
