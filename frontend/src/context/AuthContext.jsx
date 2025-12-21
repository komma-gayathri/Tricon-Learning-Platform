import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);
  const login = async (email, password, navigate) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    // Redirect based on role
    if (res.data.user.role === "HR") navigate("/dashboard");
    if (res.data.user.role === "TRAINER") navigate("/trainer/schedule");
    if (res.data.user.role === "Intern") navigate("/schedule");
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);