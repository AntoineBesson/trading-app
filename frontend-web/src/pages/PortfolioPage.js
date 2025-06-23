// frontend-web/src/pages/PortfolioPage.js
import React, { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
          {(portfolio.holdings || []).map((holding, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.2rem',
              boxShadow: '0 1px 4px rgba(99,102,241,0.04)'
            }}>
              <h3 style={{margin: 0, color: '#6366f1'}}>{holding.name} ({holding.symbol})</h3>
              <p style={{margin: '0.3rem 0'}}>Quantity: {holding.quantity}</p>
              <p style={{margin: '0.3rem 0'}}>Average Purchase Price: ${holding.average_purchase_price}</p>
              <p style={{margin: '0.3rem 0'}}>Current Price: ${holding.current_price || 'N/A'}</p>
              <p style={{margin: '0.3rem 0'}}>Current Value: ${holding.current_value || 'N/A'}</p>
              <p style={{margin: '0.3rem 0'}}>Holding Cost: ${holding.holding_cost || 'N/A'}</p>
              <p style={{margin: '0.3rem 0'}}>Profit/Loss: ${holding.profit_loss || 'N/A'} ({holding.profit_loss_percent || 'N/A'})</p>
            </div>
          ))}
        </div>
        {/* <pre>{JSON.stringify(portfolio, null, 2)}</pre> */}
      </div>
    </div>
  );
}
