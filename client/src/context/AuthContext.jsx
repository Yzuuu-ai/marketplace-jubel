// src/context/AuthContext.jsx
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
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts);

      if (accounts.length === 0) {
        handleDisconnection();
      } else {
        const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';
        if (!wasManuallyLoggedOut) {
          setWalletAddress(accounts[0]);
          setIsAuthenticated(true);
          setConnectionMethod('auto');
        }
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      window.location.reload();
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected:', error);
      handleDisconnection();
    });
  }, [handleDisconnection]);

  const checkExistingConnection = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';

      if (accounts.length > 0 && !wasManuallyLoggedOut) {
        setWalletAddress(accounts[0]);
        setIsAuthenticated(true);
        setConnectionMethod('auto');
        localStorage.removeItem('walletManuallyDisconnected');
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }, []);

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

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsAuthenticated(true);
        setConnectionMethod('manual');
        localStorage.removeItem('walletManuallyDisconnected');
        return { success: true, address: accounts[0] };
      } else {
        throw new Error('Tidak ada akun yang dipilih');
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.code === 4001 ? 'Koneksi ditolak oleh user' : error.message,
      };
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.setItem('walletManuallyDisconnected', 'true');

      if (window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }

      handleDisconnection();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      handleDisconnection();
      return { success: true };
    }
  };

  const forceDisconnect = () => {
    localStorage.setItem('walletManuallyDisconnected', 'true');
    localStorage.removeItem('gameAccounts');
    localStorage.removeItem('escrowTransactions');
    handleDisconnection();

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const reconnect = async () => {
    localStorage.removeItem('walletManuallyDisconnected');
    return await login();
  };

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
    wasManuallyDisconnected,
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
