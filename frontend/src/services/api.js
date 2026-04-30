import axios from 'axios';

// In production Express serves both the frontend and API on the same origin,
// so an empty baseURL makes the browser call the same domain automatically.
// For local dev, set VITE_API_URL=http://localhost:3000 in frontend/.env.local
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
