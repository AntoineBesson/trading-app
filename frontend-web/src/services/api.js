// frontend-web/src/services/api.js
import axios from 'axios';
import authService from './authService'; // Make sure path is correct

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Request Interceptor to add auth token to relevant requests
apiClient.interceptors.request.use(
  (config) => {
    // Only add token if request is not for auth endpoints
    // Assuming URLs passed to apiClient methods (get, post, etc.) are relative paths like '/assets'
    if (config.url && !config.url.endsWith('/auth/login') && !config.url.endsWith('/auth/register')) {
      const token = authService.getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // originalRequest.url will be the full path including baseURL
    // So, we check if it *ends with* these paths.
    if (error.response && error.response.status === 401 && 
        originalRequest.url && // Ensure URL exists
        !originalRequest.url.endsWith('/auth/login') && 
        !originalRequest.url.endsWith('/auth/register')) {
      
      console.warn('Axios interceptor: Detected 401 error. Logging out.');
      authService.logout(); // Clear token and user state
      
      // Avoid redirect loop if already on login or if public pages are involved
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
