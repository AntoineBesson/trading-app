import axios from 'axios';
import authService from './authService'; // To get the token for authenticated requests if needed

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Function to get default headers, including Auth token if available
const getAuthHeaders = () => {
  const token = authService.getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` }; // Corrected
  }
  return {};
};

// Fetch all educational content (paginated)
const getAllContent = (page = 1, perPage = 10) => {
  return axios.get(`${API_URL}/content`, { // Corrected
    headers: getAuthHeaders(),
    params: { page, per_page: perPage }
  });
};

// Fetch a single piece of educational content by its ID
const getContentById = (id) => {
  return axios.get(`${API_URL}/content/${id}`, { // Corrected
    headers: getAuthHeaders()
  });
};

// Create new content (Example, if we add admin UI later)
const createContent = (contentData) => {
  return axios.post(`${API_URL}/content`, contentData, { // Corrected
    headers: getAuthHeaders()
  });
};

// Update content (Example)
const updateContent = (id, contentData) => {
  return axios.put(`${API_URL}/content/${id}`, contentData, { // Corrected
    headers: getAuthHeaders()
  });
};

// Delete content (Example)
const deleteContent = (id) => {
  return axios.delete(`${API_URL}/content/${id}`, { // Corrected
    headers: getAuthHeaders()
  });
};

const contentService = {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent
};

export default contentService;
