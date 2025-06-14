import React, { useState, useEffect, useCallback } from 'react';
import assetService from '../services/assetService';

// Basic inline styles
const styles = {
  page: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  formSection: {
    border: '1px solid #ccc',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9'
  },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
  input: {
    width: 'calc(100% - 22px)', // Adjust for padding and border
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '3px'
  },
  select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '3px' },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '1em'
  },
  buttonDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
  assetInfo: {
    border: '1px solid #eee',
    padding: '15px',
    marginTop: '20px',
    backgroundColor: '#fff',
    borderRadius: '5px'
  },
  currentPrice: { fontSize: '1.2em', fontWeight: 'bold', color: '#28a745' },
  error: { color: 'red', marginTop: '10px' },
  success: { color: 'green', marginTop: '10px' },
  loading: { fontStyle: 'italic' }
};

export default function TradingPage() {
  const [assets, setAssets] = useState([]);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('market_buy'); // 'market_buy' or 'market_sell'

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);

  // Fetch available assets on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      setAssetsLoading(true);
      try {
        const response = await assetService.getAllAssets();
        setAssets(response.data.assets || []);
        if (response.data.assets && response.data.assets.length > 0) {
          setSelectedAssetSymbol(response.data.assets[0].symbol);
        }
      } catch (err) {
        setFormError('Failed to fetch assets. Please try again later.');
        console.error("Error fetching assets:", err);
        setAssets([]);
      }
      setAssetsLoading(false);
    };
    fetchAssets();
  }, []);

  // Fetch price for the selected asset
  const fetchPriceForSelectedAsset = useCallback(async () => {
    if (!selectedAssetSymbol) {
      setCurrentPrice(null);
      return;
    }
    setPriceLoading(true);
    setCurrentPrice(null);
    setFormError(''); // Clear previous price related errors
    try {
      const response = await assetService.getAssetPrice(selectedAssetSymbol);
      setCurrentPrice(response.data.price);
    } catch (err) {
      setCurrentPrice(null);
      console.error(\`Failed to fetch price for \${selectedAssetSymbol}\`, err);
      setFormError(\`Failed to fetch price for \${selectedAssetSymbol}. Service may be unavailable.\`);
    }
    setPriceLoading(false);
  }, [selectedAssetSymbol]);

  useEffect(() => {
    if(selectedAssetSymbol) { // Only fetch if an asset is selected
        fetchPriceForSelectedAsset();
    }
  }, [selectedAssetSymbol, fetchPriceForSelectedAsset]);

  const handleAssetChange = (e) => {
    setSelectedAssetSymbol(e.target.value);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!selectedAssetSymbol || !quantity || !orderType) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (parseFloat(quantity) <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (!currentPrice) {
        setFormError('Cannot place order without current price. Please try again.');
        return;
    }

    setOrderSubmitting(true);
    try {
      const response = await assetService.placeOrder(selectedAssetSymbol, orderType, quantity);
      setFormSuccess(response.data.message || 'Order placed successfully!');
      setQuantity('');
      // Consider fetching portfolio/balance update here or rely on global state management
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to place order.');
    }
    setOrderSubmitting(false);
  };

  if (assetsLoading) return <p style={styles.loading}>Loading available assets...</p>;

  return (
    <div style={styles.page}>
      <h1>Trade Assets</h1>

      <div style={styles.formSection}>
        <form onSubmit={handleSubmitOrder}>
          <div style={styles.inputGroup}>
            <label htmlFor="assetSelect" style={styles.label}>Select Asset:</label>
            <select
              id="assetSelect"
              value={selectedAssetSymbol}
              onChange={handleAssetChange}
              style={styles.select}
              disabled={assets.length === 0}
            >
              {assets.length === 0 && <option value="">No assets available</option>}
              {assets.map(asset => (
                <option key={asset.id} value={asset.symbol}>
                  {asset.name} ({asset.symbol}) - {asset.asset_type}
                </option>
              ))}
            </select>
          </div>

          {selectedAssetSymbol && (
            <div style={styles.assetInfo}>
              <h3>{selectedAssetSymbol} Price</h3>
              {priceLoading && <p style={styles.loading}>Fetching price...</p>}
              {!priceLoading && currentPrice !== null && (
                <p style={styles.currentPrice}>Current Price: ${parseFloat(currentPrice).toFixed(2)}</p>
              )}
              {!priceLoading && currentPrice === null && (
                <p style={styles.error}>Could not fetch price. <button type="button" onClick={fetchPriceForSelectedAsset} style={{...styles.button, padding:'5px 10px'}}>Retry</button></p>
              )}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="quantity" style={styles.label}>Quantity:</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 10"
              style={styles.input}
              min="0.00000001"
              step="any"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="orderType" style={styles.label}>Order Type:</label>
            <select
              id="orderType"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              style={styles.select}
            >
              <option value="market_buy">Buy</option>
              <option value="market_sell">Sell</option>
            </select>
          </div>

          {formError && !orderSubmitting && <p style={styles.error}>{formError}</p>}
          {formSuccess && !orderSubmitting && <p style={styles.success}>{formSuccess}</p>}

          <button
            type="submit"
            disabled={orderSubmitting || priceLoading || !currentPrice || assets.length === 0 || !selectedAssetSymbol}
            style={{...styles.button, ...((orderSubmitting || priceLoading || !currentPrice || assets.length === 0 || !selectedAssetSymbol) ? styles.buttonDisabled : {})}}
          >
            {orderSubmitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
