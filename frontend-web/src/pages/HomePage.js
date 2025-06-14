import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // To show different CTA if logged in

// Basic inline styles for demonstration
const styles = {
  container: {
    textAlign: 'center',
    padding: '50px 20px',
  },
  headline: {
    fontSize: '2.5em',
    marginBottom: '20px',
    color: '#333',
  },
  description: {
    fontSize: '1.2em',
    marginBottom: '30px',
    color: '#555',
    maxWidth: '600px',
    margin: '0 auto 30px auto', // Center the description
  },
  ctaButton: {
    padding: '10px 20px',
    fontSize: '1em',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    textDecoration: 'none',
    cursor: 'pointer',
    margin: '0 10px',
  },
  secondaryButton: {
    padding: '10px 20px',
    fontSize: '1em',
    color: '#007bff',
    backgroundColor: 'white',
    border: '1px solid #007bff',
    borderRadius: '5px',
    textDecoration: 'none',
    cursor: 'pointer',
    margin: '0 10px',
  }
};

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={styles.container}>
      <h1 style={styles.headline}>Welcome to Your Trading Journey!</h1>
      <p style={styles.description}>
        Learn the ins and outs of trading with our comprehensive educational resources
        and practice your skills with our realistic trading simulator.
        Start building your financial knowledge today.
      </p>
      <div>
        {isAuthenticated ? (
          <Link to="/dashboard" style={styles.ctaButton}>Go to Dashboard</Link>
        ) : (
          <Link to="/register" style={styles.ctaButton}>Get Started</Link>
        )}
        <Link to="/content" style={styles.secondaryButton}>Explore Content</Link>
      </div>
    </div>
  );
}
