import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Cek apakah sudah login di localStorage
    const address = localStorage.getItem('walletAddress');
    if (address) {
      setWalletAddress(address);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (address) => {
    localStorage.setItem('walletAddress', address);
    setWalletAddress(address);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('walletAddress');
    setWalletAddress(null);
    setIsAuthenticated(false);
  };

  const value = {
    walletAddress,
    login,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}