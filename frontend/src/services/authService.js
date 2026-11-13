import api from './api';

export const authService = {
  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data?.token) {
      localStorage.setItem('umny_token', response.data.token);
      localStorage.setItem('umny_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      localStorage.setItem('umny_token', response.data.token);
      localStorage.setItem('umny_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    if (response.data?.user) {
      localStorage.setItem('umny_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  },

  async updateProfile(updates) {
    const response = await api.put('/users/profile', updates);
    if (response.data?.user) {
      localStorage.setItem('umny_user', JSON.stringify(response.data.user));
    }
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('umny_token');
    localStorage.removeItem('umny_user');
  },

  getCurrentUser() {
    const stored = localStorage.getItem('umny_user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken() {
    return localStorage.getItem('umny_token');
  }
};
