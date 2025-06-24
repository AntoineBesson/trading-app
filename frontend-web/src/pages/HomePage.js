import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  background: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '3rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    margin: '0 auto',
  },
  headline: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '1.2rem',
    color: '#222',
    letterSpacing: '0.01em',
  },
  description: {
    fontSize: '1.15rem',
    color: '#555',
    marginBottom: '2.2rem',
    lineHeight: 1.6,
  },
  ctaButton: {
    padding: '0.9rem 2.2rem',
    fontSize: '1.1rem',
    color: '#fff',
    background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
    border: 'none',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
    cursor: 'pointer',
    margin: '0 10px',
    transition: 'background 0.2s',
    display: 'inline-block',
  },
  secondaryButton: {
    padding: '0.9rem 2.2rem',
    fontSize: '1.1rem',
    color: '#6366f1',
    background: '#f8fafc',
    border: '1px solid #6366f1',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
    cursor: 'pointer',
    margin: '0 10px',
    display: 'inline-block',
    transition: 'background 0.2s',
  },
};

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={styles.background}>
        <div style={styles.hero}>
          <div style={styles.headline}>Welcome to the Trading App</div>
          <div style={styles.description}>
            Learn, practice, and master trading with our interactive platform. Whether you're a beginner or an experienced trader, our app provides the tools and resources you need to succeed.
          </div>
          <div>
            {isAuthenticated ? (
              <Link to="/dashboard" style={styles.ctaButton}>Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/register" style={styles.ctaButton}>Get Started</Link>
                <Link to="/login" style={styles.secondaryButton}>Login</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
