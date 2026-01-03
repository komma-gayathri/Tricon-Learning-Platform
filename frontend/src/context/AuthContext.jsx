import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
 
const AuthContext = createContext(null);
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
   
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);
 
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
     
      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);
     
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };
 
  const register = async (payload) => {
    try {
      const res = await api.post('/auth/register', payload);
      localStorage.setItem('token', res.data.token);
     
      const meRes = await api.get('/auth/me');
      setUser(meRes.data.user);
     
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };
 
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
 
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
 
export const useAuth = () => useContext(AuthContext);