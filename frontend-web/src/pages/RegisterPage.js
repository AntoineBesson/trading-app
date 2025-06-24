import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  background: {
    minHeight: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'auto',
  },
  card: {
    background: '#fff',
    padding: '2.5rem 2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    minWidth: 320,
    maxWidth: 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    color: '#222',
    letterSpacing: '0.01em',
  },
  label: {
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: '#444',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginBottom: '1.25rem',
    fontSize: '1rem',
    outline: 'none',
    background: '#f9fafb',
    transition: 'border 0.2s',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '1.1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
    transition: 'background 0.2s',
  },
  error: {
    color: '#ef4444',
    marginBottom: '1rem',
    fontSize: '0.98rem',
    textAlign: 'center',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: 500,
    marginTop: '1rem',
    display: 'inline-block',
    fontSize: '1rem',
  },
  already: {
    color: '#555',
    fontSize: '1rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  success: {
    color: '#10b981',
    marginBottom: '1rem',
    fontSize: '0.98rem',
    textAlign: 'center',
  }
};

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setError('');
    setLoading(true);
    setSuccessMessage('');
    try {
      const data = await register(username, email, password);
      setSuccessMessage((data && data.message ? data.message : 'Registration successful!') + ' You can now login.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.background}>
      <div style={styles.card}>
        <div style={styles.title}>Register</div>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <label htmlFor="username" style={styles.label}>Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
            autoComplete="username"
          />
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            autoComplete="email"
          />
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            autoComplete="new-password"
          />
          <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
            autoComplete="new-password"
          />
          {error && <div style={styles.error}>{error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div style={styles.already}>
          Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
