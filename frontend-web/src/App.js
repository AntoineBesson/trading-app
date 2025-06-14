import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // AuthProvider is in index.js

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContentListPage from './pages/ContentListPage';
import ContentDetailPage from './pages/ContentDetailPage';
import TradingPage from './pages/TradingPage';
import PortfolioPage from './pages/PortfolioPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute
import './App.css';

// Navigation component to access useAuth and useNavigate
const Navigation = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/content">Content</Link></li>
            <li><Link to="/trade">Trade</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li>
              <button onClick={handleLogout} style={{background: 'none', border: 'none', color: 'white', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                Logout ({currentUser?.username || currentUser?.access_token?.substring(0,10) })
                {/* Display username if available from token, or part of token as fallback.
                    Note: currentUser from basic setup only has access_token.
                    For username, authService/AuthContext needs to be enhanced to store decoded token or user profile. */}
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <hr />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/content" element={<ContentListPage />} />
            <Route path="/content/:contentId" element={<ContentDetailPage />} />
            <Route path="/trade" element={<TradingPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
