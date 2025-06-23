import apiClient from './api';

export const getEducationProgress = () => apiClient.get('/education/progress');
export const setEducationProgress = (progress, quiz) =>
  apiClient.post('/education/progress', { progress, quiz });
