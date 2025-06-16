// frontend-web/src/services/api.js
import axios from 'axios';
import authService from './authService'; // Assuming authService is in the same directory

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // Check if the error is a 401, not from a login attempt, and not already a retry
    if (error.response && error.response.status === 401 && originalRequest.url !== `${API_URL}/auth/login` && originalRequest.url !== `${API_URL}/auth/register`) {
      console.warn('Axios interceptor: Detected 401 error. Logging out.');
      authService.logout(); // Clear token and user state

      // Redirect to login page
      // Avoid redirect loop if already on login or if public pages are involved
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
        // For React Router, you might use a navigation service or history object
        // e.g., history.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
