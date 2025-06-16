// frontend-web/src/services/portfolioService.js
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = authService.getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const getPortfolio = () => {
  return axios.get(`${API_URL}/portfolio`, { headers: getAuthHeaders() });
};

const portfolioService = {
  getPortfolio,
};

export default portfolioService;
