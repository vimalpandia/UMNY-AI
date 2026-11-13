import api from './api';

export const agentService = {
  async getAvailableTools() {
    const res = await api.get('/agents/tools');
    return res.data;
  },

  async getConfiguration() {
    const res = await api.get('/agents/config');
    return res.data;
  },

  async updateConfiguration(config) {
    const res = await api.put('/agents/config', config);
    return res.data;
  }
};
