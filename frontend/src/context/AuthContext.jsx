import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

  // Initialize auth state from localStorage or sessionStorage fallback
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('userToken');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('userToken');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      setUser(null);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'userToken') {
        if (!e.newValue) {
          // Session cleared (logout) on another browser tab
          sessionStorage.removeItem('userToken');
          sessionStorage.removeItem('user');
          setUser(null);
        } else {
          // Session created (login) on another browser tab
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (err) {
              console.error('Failed to parse synchronized user state:', err);
            }
          }
        }
      }
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await authApi.login(identifier, password);
      const { user: userData, token } = response;
      
      if (userData && token) {
        localStorage.setItem('userToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Trigger API logout without blocking client cache purge
      try {
        await authApi.logout();
      } catch (err) {
        console.error('Logout API call failed', err);
      }
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...userData };
      
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    });
  };

  // Memoizing values prevents redundant rerenders down the virtual component tree
  const value = useMemo(() => ({
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