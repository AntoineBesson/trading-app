import axios from 'axios';

// Configure an axios instance for API calls
// The API_URL should ideally come from an environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Backend API URL

const register = (username, email, password) => {
  return axios.post(\`\${API_URL}/auth/register\`, {
    username,
    email,
    password,
  });
};

const login = (usernameOrEmail, password) => {
  return axios.post(\`\${API_URL}/auth/login\`, {
    username_or_email: usernameOrEmail,
    password,
  }).then((response) => {
    if (response.data.access_token) {
      localStorage.setItem('user', JSON.stringify(response.data)); // Store token and basic user info
    }
    return response.data;
  });
};

const logout = () => {
  localStorage.removeItem('user');
  // Potentially call a backend /auth/logout endpoint if it exists and needs to invalidate server-side session/token
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Function to get the auth token, could be used by other services
const getAuthToken = () => {
  const user = getCurrentUser();
  return user ? user.access_token : null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getAuthToken,
};

export default authService;
