import apiClient from './api';

const NewsService = {
  getAll: () => apiClient.get('/admin/news'),
  create: (data) => apiClient.post('/admin/news', data),
  update: (id, data) => apiClient.put(`/admin/news/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/news/${id}`),
};

export default NewsService;
