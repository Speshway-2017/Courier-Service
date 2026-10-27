import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('courier_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('courier_token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('courier_token');
    localStorage.removeItem('courier_user');
    setToken(null);
    setUser(null);
  }, []);

  // Validate session against server on startup and refresh
  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const storedToken = localStorage.getItem('courier_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (isMounted) {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('courier_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        }
      } catch (error) {
        console.warn('Session verification notice:', error.message);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (credentials) => {
    const res = await api.auth.login(credentials);
    if (res.success && res.token) {
      localStorage.setItem('courier_token', res.token);
      localStorage.setItem('courier_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Authentication failed');
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has superuser privileges
    return user.role === role;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin,
        hasRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
