import axios from 'axios';
import authService from './authService'; // For getting the auth token

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = authService.getAuthToken();
  if (token) {
    return { Authorization: \`Bearer \${token}\` };
  }
  // Should not happen for portfolio calls, as they are protected
  console.error("Auth token not found for portfolioService call.");
  return {};
};

// Fetch the user's current portfolio
const getPortfolio = () => {
  return axios.get(\`\${API_URL}/portfolio\`, { headers: getAuthHeaders() });
};

const portfolioService = {
  getPortfolio,
};

export default portfolioService;
