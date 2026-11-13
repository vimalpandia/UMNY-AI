import axios from 'axios';

export const getApiBaseUrl = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
  let normalized = rawApiUrl.trim().replace(/\/+$/, '');
  if (normalized.startsWith('http') && !normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized || '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('umny_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already checking auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('umny_token');
        localStorage.removeItem('umny_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

