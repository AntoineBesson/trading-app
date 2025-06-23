import apiClient from './api';

const ModulesService = {
  getAll: () => apiClient.get('/admin/modules'),
  create: (data) => apiClient.post('/admin/modules', data),
  update: (id, data) => apiClient.put(`/admin/modules/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/modules/${id}`),
};

export default ModulesService;
