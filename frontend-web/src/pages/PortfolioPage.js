// frontend-web/src/pages/PortfolioPage.js
import React, { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';
import tradeService from '../services/tradeService';
import assetService from '../services/assetService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceDot } from 'recharts';

const styles = {
  background: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    padding: '2.5rem 0',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '2.5rem 2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '1.2rem',
    color: '#222',
  },
  section: {
    margin: '2rem 0',
  },
  summary: {
    fontSize: '1.1rem',
    color: '#444',
    marginBottom: '1.5rem',
  },
  error: {
    color: '#ef4444',
    marginBottom: '1rem',
    fontSize: '1rem',
    textAlign: 'center',
  },
};

const COLORS = ['#6366f1', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#38bdf8'];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [holdingCharts, setHoldingCharts] = useState({});
  // Add timeframe selector state for each holding
  const [timeframes, setTimeframes] = useState({});
  const TIMEFRAME_OPTIONS = [
    { label: '24h', value: '1d' },
    { label: '1M', value: '1m' },
    { label: '6M', value: '6m' },
    { label: 'YTD', value: 'ytd' },
    { label: '1Y', value: '1y' },
    { label: '3Y', value: '3y' }
  ];

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await portfolioService.getPortfolio();
        setPortfolio(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch portfolio data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolioData();
  }, []);

  // Fetch price history and trades for each holding and timeframe
  useEffect(() => {
    if (!portfolio || !portfolio.holdings) return;
    portfolio.holdings.forEach(async (holding) => {
      const symbol = holding.symbol;
      const tf = timeframes[symbol] || '6m';
      try {
        const [historyRes, tradesRes] = await Promise.all([
          assetService.getAssetHistory(symbol, tf),
          tradeService.getTrades(symbol)
        ]);
        setHoldingCharts(prev => ({
          ...prev,
          [symbol]: {
            history: historyRes.data.history || [],
            trades: tradesRes.data.trades || []
          }
        }));
      } catch (err) {
        setHoldingCharts(prev => ({ ...prev, [symbol]: { history: [], trades: [] } }));
      }
    });
  }, [portfolio, timeframes]);

  if (loading) {
    return <div style={styles.background}><div style={styles.card}>Loading portfolio...</div></div>;
  }
  if (error) {
    return <div style={styles.background}><div style={styles.card}><div style={styles.error}>Error: {error}</div></div></div>;
  }
  if (!portfolio || !portfolio.summary) {
    return (
      <div style={styles.background}>
        <div style={styles.card}>
          <div style={styles.title}>Portfolio</div>
          <p>No portfolio data available or portfolio is empty.</p>
        </div>
      </div>
    );
  }

  // Calculate invested and uninvested (cash) for pie chart
  const invested = (portfolio.holdings || []).reduce((sum, h) => sum + Number(h.current_value || 0), 0);
  const cash = Number(portfolio.summary.user_cash_balance || 0);
  const total = invested + cash;

  // Pie chart data: show each holding and cash as separate slices
  const pieData = [
    ...(portfolio.holdings || []).map((h) => ({
      name: h.name || h.symbol || 'Asset',
      value: Number(h.current_value || 0)
    })),
    { name: 'Cash', value: cash }
  ];

  // Pie chart colors: one per holding, last color for cash (nav blue)
  const NAV_BLUE = '#2563eb';
  const PIE_COLORS = [
    '#6366f1', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#38bdf8', '#f59e42', '#10b981', '#e11d48', '#f43f5e', '#0ea5e9', '#facc15', '#a3e635', '#fbbf24', '#f472b6', '#818cf8', '#f87171'
  ];

  return (
    <div style={styles.background}>
      <div style={styles.card}>
        <div style={styles.title}>Portfolio</div>
        <div style={styles.section}>
          <div style={styles.summary}><b>Total Value:</b> ${portfolio.summary.total_portfolio_value || 'N/A'}</div>
          <div style={styles.summary}><b>Total Cost:</b> ${portfolio.summary.total_portfolio_cost || 'N/A'}</div>
          <div style={styles.summary}><b>Profit/Loss:</b> ${portfolio.summary.overall_profit_loss || 'N/A'} ({portfolio.summary.overall_profit_loss_percent || 'N/A'})</div>
          <div style={styles.summary}><b>Total Cash:</b> ${portfolio.summary.user_cash_balance || 'N/A'}</div>
        </div>
        <div style={styles.section}>
          <h3 style={{marginBottom: '1rem', color: '#333'}}>Portfolio Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.name === 'Cash' ? NAV_BLUE : PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.section}>
          <h3 style={{marginBottom: '1rem', color: '#333'}}>Holdings</h3>
          {(portfolio.holdings || []).length === 0 && <p>No holdings.</p>}
          {(portfolio.holdings || []).map((holding, idx) => {
            const chartData = holdingCharts[holding.symbol] || { history: [], trades: [] };
            const tf = timeframes[holding.symbol] || '6m';
            return (
              <div key={idx} style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.2rem',
                boxShadow: '0 1px 4px rgba(99,102,241,0.04)'
              }}>
                <h3 style={{margin: 0, color: '#6366f1'}}>{holding.name} ({holding.symbol})</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 10, flexWrap: 'wrap' }}>
                  {TIMEFRAME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTimeframes(prev => ({ ...prev, [holding.symbol]: opt.value }))}
                      style={{
                        background: tf === opt.value ? '#2563eb' : '#e0e7ef',
                        color: tf === opt.value ? '#fff' : '#222',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'background 0.18s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData.history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
                      {/* Buy/Sell markers */}
                      {chartData.trades.map((trade, i) => (
                        <ReferenceDot
                          key={i}
                          x={(() => {
                            // Find the closest date in history to the trade timestamp
                            const t = new Date(trade.timestamp);
                            let closest = chartData.history[0]?.date;
                            let minDiff = Math.abs(new Date(chartData.history[0]?.date) - t);
                            chartData.history.forEach(h => {
                              const diff = Math.abs(new Date(h.date) - t);
                              if (diff < minDiff) { minDiff = diff; closest = h.date; }
                            });
                            return closest;
                          })()}
                          y={parseFloat(trade.price_at_execution)}
                          r={7}
                          fill={trade.order_type === 'market_buy' ? '#10b981' : '#e11d48'}
                          stroke="#fff"
                          label={{ value: trade.order_type === 'market_buy' ? 'Buy' : 'Sell', position: 'top', fill: trade.order_type === 'market_buy' ? '#10b981' : '#e11d48', fontSize: 11 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
        {/* <pre>{JSON.stringify(portfolio, null, 2)}</pre> */}
      </div>
    </div>
  );
}
