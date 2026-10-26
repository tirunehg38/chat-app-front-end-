import axios from 'axios';
const axiosbase = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});
axiosbase.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axiosbase.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/login') && localStorage.getItem('token')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('session-expired'));
  }
  return Promise.reject(error);
});
export const errorMessage = (error, fallback) => error.response?.data?.message || error.response?.data?.msg || fallback;
export default axiosbase;
