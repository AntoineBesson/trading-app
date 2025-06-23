// frontend-web/src/services/assetService.js
import apiClient from './api'; // Use the new apiClient

// Fetch all available assets
const getAllAssets = () => {
  return apiClient.get(`/assets`);
};

// Fetch the current price for a specific asset symbol
const getAssetPrice = (symbol) => {
  return apiClient.get(`/assets/${symbol.toUpperCase()}/price`);
};

// Place a trade order
const placeOrder = (assetSymbol, orderType, quantity) => {
  const payload = {
    asset_symbol: assetSymbol.toUpperCase(),
    order_type: orderType,
    quantity: String(quantity), // Backend expects Decimal, string is a common way to send it
  };
  return apiClient.post(`/trades/order`, payload);
};

// Fetch historical price data for a specific asset symbol and range
const getAssetHistory = (symbol, range) => {
  // range: '1d', '1m', '6m', 'ytd', '1y', '3y'
  return apiClient.get(`/assets/${symbol.toUpperCase()}/history?range=${range}`);
};

const assetService = {
  getAllAssets,
  getAssetPrice,
  placeOrder,
  getAssetHistory,
};

export default assetService;
