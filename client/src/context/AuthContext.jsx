// src/context/AuthContext.jsx - Enhanced with proper logout (Fixed)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState(null); // 'auto' or 'manual'

  const handleDisconnection = useCallback(() => {
    setWalletAddress('');
    setIsAuthenticated(false);
    setConnectionMethod(null);
    setIsConnecting(false);
  }, []);

  const setupAccountChangeListener = useCallback(() => {
    if (window.ethereum) {
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts);
        
        if (accounts.length === 0) {
          // User disconnected from MetaMask
          handleDisconnection();
        } else {
          // User switched accounts
          const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';
          
          if (!wasManuallyLoggedOut) {
            setWalletAddress(accounts[0]);
            setIsAuthenticated(true);
            setConnectionMethod('auto');
          }
        }
      });

      // Handle chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId);
        // Optionally handle network changes
        // For now, just reload the page to reset state
        window.location.reload();
      });

      // Handle disconnect
      window.ethereum.on('disconnect', (error) => {
        console.log('MetaMask disconnected:', error);
        handleDisconnection();
      });
    }
  }, [handleDisconnection]);

  const checkExistingConnection = useCallback(async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';
        
        // Only auto-reconnect if user didn't manually logout
        if (accounts.length > 0 && !wasManuallyLoggedOut) {
          setWalletAddress(accounts[0]);
          setIsAuthenticated(true);
          setConnectionMethod('auto');
          // Clear the logout flag on successful auto-reconnect
          localStorage.removeItem('walletManuallyDisconnected');
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }, []);

  // Check for existing connection on app load
  useEffect(() => {
    checkExistingConnection();
    setupAccountChangeListener();
  }, [checkExistingConnection, setupAccountChangeListener]);

  const login = async () => {
    setIsConnecting(true);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask tidak ditemukan. Silakan install MetaMask terlebih dahulu.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsAuthenticated(true);
        setConnectionMethod('manual');
        
        // Clear any previous logout flag
        localStorage.removeItem('walletManuallyDisconnected');
        
        return { success: true, address: accounts[0] };
      } else {
        throw new Error('Tidak ada akun yang dipilih');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.code === 4001 ? 'Koneksi ditolak oleh user' : error.message 
      };
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = async () => {
    try {
      // Method 1: Set flag to prevent auto-reconnection
      localStorage.setItem('walletManuallyDisconnected', 'true');
      
      // Method 2: Try to disconnect from MetaMask (if supported)
      if (window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }
      
      // Method 3: Clear application state
      handleDisconnection();
      
      // Method 4: Clear any application-specific data
      // Uncomment if you want to clear all data on logout
      // localStorage.removeItem('gameAccounts');
      // localStorage.removeItem('escrowTransactions');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if MetaMask disconnect fails, we still clear app state
      handleDisconnection();
      return { success: true }; // Return success anyway
    }
  };

  const forceDisconnect = () => {
    // Nuclear option: completely clear everything
    localStorage.setItem('walletManuallyDisconnected', 'true');
    localStorage.removeItem('gameAccounts');
    localStorage.removeItem('escrowTransactions');
    handleDisconnection();
    
    // Reload page to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const reconnect = async () => {
    // Clear the manual disconnect flag and try to reconnect
    localStorage.removeItem('walletManuallyDisconnected');
    return await login();
  };

  // Check if user manually logged out
  const wasManuallyDisconnected = () => {
    return localStorage.getItem('walletManuallyDisconnected') === 'true';
  };

  const value = {
    walletAddress,
    isAuthenticated,
    isConnecting,
    connectionMethod,
    login,
    logout,
    forceDisconnect,
    reconnect,
    wasManuallyDisconnected
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};