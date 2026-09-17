import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap authentication status on initial application startup
  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res?.success && res?.data) {
        setUser(res.data);
        return res.data;
      }
      setUser(null);
      return null;
    } catch {
      // A 401 Unauthorized or guest state from /me is normal, not an application crash
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await authService.getCurrentUser();
        if (isMounted) {
          if (res?.success && res?.data) {
            setUser(res.data);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authService.login({ email, password });
    if (res?.success && res?.data) {
      setUser(res.data);
      return res.data;
    }
    throw new Error(res?.message || 'Login failed.');
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const res = await authService.register({ name, email, password });
    if (res?.success && res?.data) {
      setUser(res.data);
      return res.data;
    }
    throw new Error(res?.message || 'Registration failed.');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
