import React, {createContext, useContext, useEffect, useState} from 'react';
import {authAPI} from '../api/auth';
import type {LoginData, MunicipalityUser, RegisterData, User} from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginData) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
  registerMunicipalityUser: (userData: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    rolesArray: number[]
  }) => Promise<User>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authAPI.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginData): Promise<User> => {
    const loggedInUser = await authAPI.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<User> => {
    const newUser = await authAPI.registerCitizen(userData);
    setUser(newUser);
    return newUser;
  };

  const registerMunicipalityUser = async (userData: MunicipalityUser): Promise<User> => {
    return await authAPI.createMunicipalityUser(userData);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    registerMunicipalityUser,
    isAuthenticated: !!user,
    setUser,
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
