import api from './api';

export const adminService = {
  async getDashboardStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async getUsers(page = 1, limit = 20) {
    const res = await api.get('/admin/users', { params: { page, limit } });
    return res.data;
  },

  async updateUserRole(userId, role) {
    const res = await api.put(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  async getLogs(limit = 50) {
    const res = await api.get('/admin/logs', { params: { limit } });
    return res.data;
  },

  async getHealth() {
    const res = await api.get('/admin/health');
    return res.data;
  }
};

