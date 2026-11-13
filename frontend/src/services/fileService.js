import api from './api';

export const fileService = {
  async uploadFile(file, conversationId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const res = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getMyFiles() {
    const res = await api.get('/files');
    return res.data;
  },

  async deleteFile(id) {
    const res = await api.delete(`/files/${id}`);
    return res.data;
  }
};
