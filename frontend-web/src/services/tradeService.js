// frontend-web/src/services/tradeService.js
import apiClient from './api';

const getTrades = (assetSymbol) => {
  // If assetSymbol is provided, filter by asset
  const url = assetSymbol ? `/trades?asset=${encodeURIComponent(assetSymbol)}` : '/trades';
  return apiClient.get(url);
};

const tradeService = {
  getTrades,
};

export default tradeService;
