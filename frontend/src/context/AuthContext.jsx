import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by calling /me endpoint
    setLoading(true);
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      // Cookie is set by backend automatically
      const res = await api.post('/auth/login', { email, password });

      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (payload) => {
    try {
      // Cookie is set by backend automatically
      const res = await api.post('/auth/register', payload);

      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Backend clears cookie
    } catch (err) {
      console.error("Logout error", err);
    }
    setUser(null);
    // localStorage.removeItem('token'); // No longer used
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);