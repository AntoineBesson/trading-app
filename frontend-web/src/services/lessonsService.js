import apiClient from './api';

const LessonsService = {
  getAll: () => apiClient.get('/admin/lessons'),
  create: (data) => apiClient.post('/admin/lessons', data),
  update: (id, data) => apiClient.put(`/admin/lessons/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/lessons/${id}`),
  setModule: (id, module_id, order) => apiClient.post(`/admin/lessons/${id}/set-module`, { module_id, order }),
};

export default LessonsService;
