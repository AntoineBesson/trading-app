import React, { useState, useEffect, useCallback } from 'react';
import assetService from '../services/assetService';
import portfolioService from '../services/portfolioService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
    width: 'calc(100% - 22px)',
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
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [timeframe, setTimeframe] = useState('1d'); // '1d', '1m', '6m', 'ytd', '1y', '3y'
  const [cashBalance, setCashBalance] = useState(null);

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
      console.error(`Failed to fetch price for ${selectedAssetSymbol}`, err);
      setFormError(`Failed to fetch price for ${selectedAssetSymbol}. Service may be unavailable.`);
    } finally {
      // This block will run regardless of whether the try block succeeded or failed.
      setPriceLoading(false); 
    }
  }, [selectedAssetSymbol]);

  useEffect(() => {
    if(selectedAssetSymbol) { // Only fetch if an asset is selected
        fetchPriceForSelectedAsset();
    }
  }, [selectedAssetSymbol, fetchPriceForSelectedAsset]);

  // Fetch historical data when asset or timeframe changes
  useEffect(() => {
    if (!selectedAssetSymbol) return;
    setHistoryLoading(true);
    setHistoryError('');
    assetService.getAssetHistory(selectedAssetSymbol, timeframe)
      .then(res => {
        setHistory(res.data.history || []);
      })
      .catch(() => {
        setHistory([]);
        setHistoryError('Failed to fetch price history.');
      })
      .finally(() => setHistoryLoading(false));
  }, [selectedAssetSymbol, timeframe]);

  // Fetch cash balance (from portfolio summary)
  const fetchCashBalance = useCallback(() => {
    portfolioService.getPortfolio().then(res => {
      setCashBalance(res.data?.summary?.user_cash_balance || null);
    }).catch(() => setCashBalance(null));
  }, []);

  useEffect(() => {
    fetchCashBalance();
  }, [fetchCashBalance]);

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
      fetchCashBalance(); // Update cash after trade
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to place order.');
    }
    setOrderSubmitting(false);
  };

  if (assetsLoading) return <p style={styles.loading}>Loading assets...</p>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', padding: '2.5rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '2rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#222', marginBottom: '1.5rem' }}>Trade Assets</h1>
          {cashBalance !== null && (
            <div style={{ marginBottom: '1.5rem', fontWeight: 600, color: '#2563eb', fontSize: '1.15rem' }}>
              Cash Available: ${parseFloat(cashBalance).toFixed(2)}
            </div>
          )}
          <div style={{ marginBottom: '2.5rem' }}>
            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label htmlFor="assetSelect" style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Select Asset</label>
                <select
                  id="assetSelect"
                  value={selectedAssetSymbol}
                  onChange={handleAssetChange}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1.08rem' }}
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
              <div style={{ flex: 1, minWidth: 120 }}>
                <label htmlFor="quantity" style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1.08rem' }}
                  min="0.00000001"
                  step="any"
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label htmlFor="orderType" style={{ fontWeight: 600, color: '#222', marginBottom: 6, display: 'block' }}>Order Type</label>
                <select
                  id="orderType"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1.08rem' }}
                >
                  <option value="market_buy">Buy</option>
                  <option value="market_sell">Sell</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <button
                  type="submit"
                  disabled={orderSubmitting || priceLoading || !currentPrice || assets.length === 0 || !selectedAssetSymbol}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem 2rem', fontWeight: 600, fontSize: '1.1rem', cursor: orderSubmitting ? 'not-allowed' : 'pointer', marginTop: 24, boxShadow: '0 2px 8px rgba(99,102,241,0.08)', transition: 'background 0.2s' }}
                >
                  {orderSubmitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
            {formError && !orderSubmitting && <p style={{ color: '#e11d48', marginTop: 10 }}>{formError}</p>}
            {formSuccess && !orderSubmitting && <p style={{ color: '#10b981', marginTop: 10 }}>{formSuccess}</p>}
          </div>

          {/* Asset Info and Chart */}
          {selectedAssetSymbol && (
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(99,102,241,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#222', marginBottom: 8 }}>{selectedAssetSymbol} Price</h3>
                  {priceLoading && <p style={{ fontStyle: 'italic' }}>Fetching price...</p>}
                  {!priceLoading && currentPrice !== null && (
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2563eb' }}>Current Price: ${parseFloat(currentPrice).toFixed(2)}</p>
                  )}
                  {!priceLoading && currentPrice === null && (
                    <p style={{ color: '#e11d48' }}>Could not fetch price. <button type="button" onClick={fetchPriceForSelectedAsset} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', marginLeft: 8 }}>Retry</button></p>
                  )}
                </div>
                <div style={{ flex: 2, minWidth: 320 }}>
                  {/* Timeframe selector and chart */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 10 }}>
                    {/*
                      { label: t('timeframe_1d', '24h'), value: '1d' },
                      { label: t('timeframe_1m', '1M'), value: '1m' },
                      { label: t('timeframe_6m', '6M'), value: '6m' },
                      { label: t('timeframe_ytd', 'YTD'), value: 'ytd' },
                      { label: t('timeframe_1y', '1Y'), value: '1y' },
                      { label: t('timeframe_3y', '3Y'), value: '3y' }
                    */}
                    {[
                      { label: '24h', value: '1d' },
                      { label: '1M', value: '1m' },
                      { label: '6M', value: '6m' },
                      { label: 'YTD', value: 'ytd' },
                      { label: '1Y', value: '1y' },
                      { label: '3Y', value: '3y' }
                    ].map(tf => (
                      <button
                        key={tf.value}
                        onClick={() => setTimeframe(tf.value)}
                        style={{
                          background: timeframe === tf.value ? '#2563eb' : '#e0e7ef',
                          color: timeframe === tf.value ? '#fff' : '#222',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 16px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'background 0.18s',
                        }}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                  {historyLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading chart...</div>
                  ) : historyError ? (
                    <div style={{ color: '#e11d48', padding: '1rem' }}>{historyError}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
