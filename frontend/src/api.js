import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Send cookies with requests
});

// Interceptor not needed for Authorization header anymore
/*
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*/

export default api;