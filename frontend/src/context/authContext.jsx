import { createContext, useState, useEffect, useContext } from 'react';
import { login, signup, logout } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Read auth state synchronously from localStorage on module load
// This ensures the initial state is correct before first render
const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData && userData !== 'undefined' && userData !== 'null') {
      return JSON.parse(userData);
    }
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  // Initialize synchronously — no loading flash
  const [user, setUser] = useState(getInitialUser);

  const handleLogin = async (credentials) => {
    try {
      const data = await login(credentials.email, credentials.password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (userData) => {
    try {
      const data = await signup(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const value = {
    user,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    isAuthenticated: !!user,
    loading: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};