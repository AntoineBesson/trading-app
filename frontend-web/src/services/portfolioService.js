// frontend-web/src/services/portfolioService.js
import apiClient from './api'; // Changed from axios
import authService from './authService';

// API_URL is now managed by apiClient
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = authService.getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const getPortfolio = () => {
  // Changed from axios.get(`${API_URL}/portfolio`...) to apiClient.get('/portfolio'...)
  return apiClient.get(`/portfolio`, { headers: getAuthHeaders() });
};

const portfolioService = {
  getPortfolio,
};

export default portfolioService;
