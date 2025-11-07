import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';
import type { User, LoginData, RegisterData } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false); // Always false - don't block rendering for public pages

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authAPI.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // User not logged in - this is normal for public pages
        setUser(null);
      }
    };

    // Check auth in background, don't block rendering
    checkAuth();
  }, []);

  const login = async (credentials: LoginData) => {
    const loggedInUser = await authAPI.login(credentials);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (userData: RegisterData) => {
    const newUser = await authAPI.registerCitizen(userData);
    setUser(newUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
