import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('userToken');

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('userToken');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await authApi.login(identifier, password);
      
      const { user, token } = response;
      
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Optional: Call logout API if needed, but don't block client logout
      try {
        await authApi.logout();
      } catch (err) {
        console.error('Logout API call failed', err);
      }
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = React.useMemo(() => ({
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
