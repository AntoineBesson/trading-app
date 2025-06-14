import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser()); // Initialize from localStorage

  useEffect(() => {
    // This effect ensures that if localStorage is updated manually or by another tab,
    // the state reflects it. Or, if we implement token expiry checks, this could be a place.
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    // Could add an event listener for storage changes here if needed for multi-tab sync
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const data = await authService.login(usernameOrEmail, password);
      setCurrentUser(data); // data should contain the access_token
      return data;
    } catch (error) {
      // Handle or rethrow error for the component to display
      console.error("Login failed in AuthContext:", error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authService.register(username, email, password);
      // Optionally, log the user in directly after registration or redirect to login
      return response.data;
    } catch (error) {
      console.error("Registration failed in AuthContext:", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    // Redirect to home or login page can be handled by the component calling logout
  };

  // The value provided to consuming components
  const value = {
    currentUser, // Contains the token and any user info stored from login
    login,
    register,
    logout,
    isAuthenticated: !!currentUser, // Boolean flag for convenience
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
