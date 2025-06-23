import apiClient from './api';

const QuizzesService = {
  getAll: (lesson_id) => apiClient.get('/admin/quizzes', { params: lesson_id ? { lesson_id } : {} }),
  create: (data) => apiClient.post('/admin/quizzes', data),
  update: (id, data) => apiClient.put(`/admin/quizzes/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/quizzes/${id}`),
  getQuestions: (quiz_id) => apiClient.get(`/admin/quizzes/${quiz_id}/questions`),
  addQuestion: (quiz_id, data) => apiClient.post(`/admin/quizzes/${quiz_id}/questions`, data),
  updateQuestion: (quiz_id, question_id, data) => apiClient.put(`/admin/quizzes/${quiz_id}/questions/${question_id}`, data),
  deleteQuestion: (quiz_id, question_id) => apiClient.delete(`/admin/quizzes/${quiz_id}/questions/${question_id}`),
};

export default QuizzesService;
