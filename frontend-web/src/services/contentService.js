import axios from 'axios';
import authService from './authService'; // To get the token for authenticated requests if needed

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Function to get default headers, including Auth token if available
const getAuthHeaders = () => {
  const token = authService.getAuthToken();
  if (token) {
    return { Authorization: \`Bearer \${token}\` };
  }
  return {};
};

// Fetch all educational content (paginated)
const getAllContent = (page = 1, perPage = 10) => {
  // The backend /content endpoint is public, so auth headers might not be strictly necessary
  // unless we change its protection level later.
  // For now, sending them if available doesn't hurt.
  return axios.get(\`\${API_URL}/content\`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage }
  });
};

// Fetch a single piece of educational content by its ID
const getContentById = (id) => {
  return axios.get(\`\${API_URL}/content/\${id}\`, {
    headers: getAuthHeaders() // Same as above, potentially not needed if public
  });
};

// Create new content (Example, if we add admin UI later)
// This would definitely require authentication
const createContent = (contentData) => {
  return axios.post(\`\${API_URL}/content\`, contentData, {
    headers: getAuthHeaders()
  });
};

// Update content (Example)
const updateContent = (id, contentData) => {
  return axios.put(\`\${API_URL}/content/\${id}\`, contentData, {
    headers: getAuthHeaders()
  });
};

// Delete content (Example)
const deleteContent = (id) => {
  return axios.delete(\`\${API_URL}/content/\${id}\`, {
    headers: getAuthHeaders()
  });
};


const contentService = {
  getAllContent,
  getContentById,
  createContent, // Included for completeness, though Phase 1 UI might not use it
  updateContent,
  deleteContent
};

export default contentService;
