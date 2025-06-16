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

// Fetch all available assets
const getAllAssets = () => {
  return axios.get(`${API_URL}/assets`, { headers: getAuthHeaders() });
};

// Fetch the current price for a specific asset symbol
const getAssetPrice = (symbol) => {
  return axios.get(`${API_URL}/assets/${symbol.toUpperCase()}/price`, { headers: getAuthHeaders() });
};

// Place a trade order
const placeOrder = (assetSymbol, orderType, quantity) => {
  // Ensure quantity is a string for the backend if it expects Decimal as string
  const payload = {
    asset_symbol: assetSymbol.toUpperCase(),
    order_type: orderType, // e.g., 'market_buy', 'market_sell'
    quantity: String(quantity), // Backend expects Decimal, string is a common way to send it
  };
  return axios.post(`${API_URL}/trades/order`, payload, { headers: getAuthHeaders() });
};

const assetService = {
  getAllAssets,
  getAssetPrice,
  placeOrder,
};

export default assetService;
