// frontend-web/src/pages/PortfolioPage.js
import React, { useState, useEffect } from 'react';
import portfolioService from '../services/portfolioService'; // Adjust path if needed

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
        console.error("Error fetching portfolio:", err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch portfolio data.');
        // If 401, it might be useful to redirect to login or show specific message
        if (err.response?.status === 401) {
          setError('Unauthorized: Please log in again.');
          // Potentially call authService.logout() or redirect
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
    return (
      <div>
        <h1>Portfolio Page</h1>
        <p>You have no holdings in your portfolio.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Portfolio Page</h1>
      <h2>Summary</h2>
      <p>Total Portfolio Value: ${portfolio.summary?.total_portfolio_value || 'N/A'}</p>
      <p>Total Portfolio Cost: ${portfolio.summary?.total_portfolio_cost || 'N/A'}</p>
      <p>Overall Profit/Loss: ${portfolio.summary?.overall_profit_loss || 'N/A'} ({portfolio.summary?.overall_profit_loss_percent || 'N/A'})</p>

      <h2>Holdings</h2>
      {portfolio.holdings.map((holding, index) => (
        <div key={index} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{holding.name} ({holding.symbol})</h3>
          <p>Quantity: {holding.quantity}</p>
          <p>Average Purchase Price: ${holding.average_purchase_price}</p>
          <p>Current Price: ${holding.current_price || 'N/A'}</p>
          <p>Current Value: ${holding.current_value || 'N/A'}</p>
          <p>Holding Cost: ${holding.holding_cost || 'N/A'}</p>
          <p>Profit/Loss: ${holding.profit_loss || 'N/A'} ({holding.profit_loss_percent || 'N/A'})</p>
        </div>
      ))}
      {/* For debugging, show raw data: */}
      {/* <pre>{JSON.stringify(portfolio, null, 2)}</pre> */}
    </div>
  );
}
