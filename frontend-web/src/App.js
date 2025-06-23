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
import AdminPanelPage from './pages/AdminPanelPage';
import './App.css';

const navStyles = {
  nav: {
    background: '#2563eb', // solid blue
    padding: '0.5rem 0',
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
    borderRadius: '0 0 18px 18px',
    marginBottom: '2.5rem',
    fontFamily: 'inherit',
  },
  ul: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '1.5rem',
  },
  li: {
    display: 'inline',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '1.08rem',
    padding: '10px 18px',
    borderRadius: '8px',
    transition: 'background 0.18s',
  },
  linkActive: {
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
  },
  button: {
    background: 'none',
    border: 'none',
    color: '#fff',
    padding: '10px 18px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '1.08rem',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'background 0.18s',
  }
};

// Navigation component to access useAuth and useNavigate
const Navigation = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!currentUser?.is_admin;

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <nav style={navStyles.nav}>
      <ul style={navStyles.ul}>
        <li style={navStyles.li}><Link to="/" style={navStyles.link}>Home</Link></li>
        {isAuthenticated ? (
          <>
            <li style={navStyles.li}><Link to="/dashboard" style={navStyles.link}>Dashboard</Link></li>
            <li style={navStyles.li}><Link to="/content" style={navStyles.link}>Content</Link></li>
            <li style={navStyles.li}><Link to="/trade" style={navStyles.link}>Trade</Link></li>
            <li style={navStyles.li}><Link to="/portfolio" style={navStyles.link}>Portfolio</Link></li>
            {isAdmin && (
              <li style={navStyles.li}><Link to="/admin" style={navStyles.link}>Admin Panel</Link></li>
            )}
            <li style={navStyles.li}>
              <button onClick={handleLogout} style={navStyles.button}>
                Logout ({currentUser?.username || currentUser?.access_token?.substring(0,10) })
              </button>
            </li>
          </>
        ) : (
          <>
            <li style={navStyles.li}><Link to="/login" style={navStyles.link}>Login</Link></li>
            <li style={navStyles.li}><Link to="/register" style={navStyles.link}>Register</Link></li>
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
            <Route path="/education" element={<ContentListPage />} />
            <Route path="/content/:contentId" element={<ContentDetailPage />} />
            <Route path="/trade" element={<TradingPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
