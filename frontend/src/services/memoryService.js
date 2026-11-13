import api from './api';

export const memoryService = {
  async getMemories() {
    const res = await api.get('/memories');
    return res.data;
  },

  async addMemory(content, category = 'general', importance = 3) {
    const res = await api.post('/memories', { content, category, importance });
    return res.data;
  },

  async updateMemory(id, updates) {
    const res = await api.put(`/memories/${id}`, updates);
    return res.data;
  },

  async deleteMemory(id) {
    const res = await api.delete(`/memories/${id}`);
    return res.data;
  },

  async toggleMemorySetting(enabled) {
    const res = await api.put('/users/preferences', { memoryEnabled: enabled });
    return res.data;
  }
};

