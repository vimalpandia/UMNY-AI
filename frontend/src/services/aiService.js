import api from './api';

export const aiService = {
  async getModels() {
    const res = await api.get('/models');
    return res.data;
  },

  async getUsageStats() {
    const res = await api.get('/usage/my-stats');
    return res.data;
  }
};

