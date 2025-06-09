// src/context/AuthContext.jsx - Updated to support email authentication and wallet disconnection
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState(null); // 'auto', 'manual', or 'email'
  const [profileData, setProfileData] = useState({ nama: '', email: '', nomor: '' });
  const [accountType, setAccountType] = useState(null); // 'wallet' or 'email'
  const [currentUser, setCurrentUser] = useState(null);

  // Function to handle disconnection of the wallet or email account
  const handleDisconnection = useCallback(() => {
    setWalletAddress('');
    setIsAuthenticated(false);
    setConnectionMethod(null);
    setIsConnecting(false);
    setProfileData({ nama: '', email: '', nomor: '' });
    setAccountType(null);
    setCurrentUser(null);
    localStorage.removeItem('currentSession');
    localStorage.removeItem('walletManuallyDisconnected');
  }, []);

  // Function to handle wallet change (MetaMask)
  const setupAccountChangeListener = useCallback(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      console.log('Account changed:', accounts);

      if (accounts.length === 0) {
        // Only disconnect if it's a wallet account
        if (accountType === 'wallet') {
          handleDisconnection();
        }
      } else {
        const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';
        if (!wasManuallyLoggedOut && accountType === 'wallet') {
          setWalletAddress(accounts[0]);
          setIsAuthenticated(true);
          setConnectionMethod('auto');
        }
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      if (accountType === 'wallet') {
        window.location.reload();
      }
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected:', error);
      if (accountType === 'wallet') {
        handleDisconnection();
      }
    });
  }, [handleDisconnection, accountType]);

  // Function to check for existing connection (wallet or email)
  const checkExistingConnection = useCallback(async () => {
    try {
      // Check for email session first
      const session = localStorage.getItem('currentSession');
      if (session) {
        const sessionData = JSON.parse(session);
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = registeredUsers.find(u => u.id === sessionData.userId);
        
        if (user) {
          setWalletAddress(`email_${user.id}`);
          setIsAuthenticated(true);
          setConnectionMethod('email');
          setAccountType('email');
          setCurrentUser(user);
          setProfileData({
            nama: user.nama,
            email: user.email,
            nomor: user.nomor || ''
          });
          return;
        }
      }

      // Check for MetaMask connection
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const wasManuallyLoggedOut = localStorage.getItem('walletManuallyDisconnected') === 'true';

      if (accounts.length > 0 && !wasManuallyLoggedOut) {
        setWalletAddress(accounts[0]);
        setIsAuthenticated(true);
        setConnectionMethod('auto');
        setAccountType('wallet');
        localStorage.removeItem('walletManuallyDisconnected');
        
        // Load profile data from localStorage if exists
        const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        const profile = userProfiles[accounts[0]];
        if (profile) {
          setProfileData(profile);
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }, []);

  useEffect(() => {
    checkExistingConnection();
    setupAccountChangeListener();
  }, [checkExistingConnection, setupAccountChangeListener]);

  // Function for login (either email or wallet)
  const login = async (identifier) => {
    setIsConnecting(true);

    try {
      // Check if it's an email login (starts with 'email_')
      if (identifier && identifier.startsWith('email_')) {
        // Email login
        const session = localStorage.getItem('currentSession');
        if (session) {
          const sessionData = JSON.parse(session);
          const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const user = registeredUsers.find(u => u.id === sessionData.userId);
          
          if (user) {
            setWalletAddress(identifier);
            setIsAuthenticated(true);
            setConnectionMethod('email');
            setAccountType('email');
            setCurrentUser(user);
            setProfileData({
              nama: user.nama,
              email: user.email,
              nomor: user.nomor || ''
            });
            
            return { success: true, address: identifier };
          }
        }
        throw new Error('Invalid email session');
      }

      // MetaMask login
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
        setAccountType('wallet');
        localStorage.removeItem('walletManuallyDisconnected');
        
        // Load profile data from localStorage if exists
        const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        const profile = userProfiles[accounts[0]];
        if (profile) {
          setProfileData(profile);
        } else {
          // Set default profile name for wallet users
          setProfileData({
            nama: `User-${accounts[0].substring(0, 6)}`,
            email: '',
            nomor: ''
          });
        }
        
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

  // Logout function
  const logout = async () => {
    try {
      if (accountType === 'email') {
        // Email logout
        localStorage.removeItem('currentSession');
      } else {
        // Wallet logout
        localStorage.setItem('walletManuallyDisconnected', 'true');
        
        if (window.ethereum && window.ethereum.disconnect) {
          await window.ethereum.disconnect();
        }
      }

      handleDisconnection();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      handleDisconnection();
      return { success: true };
    }
  };

  // Force disconnect function
  const forceDisconnect = () => {
    localStorage.setItem('walletManuallyDisconnected', 'true');
    localStorage.removeItem('currentSession');
    localStorage.removeItem('gameAccounts');
    localStorage.removeItem('escrowTransactions');
    handleDisconnection();

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Reconnect function
  const reconnect = async () => {
    localStorage.removeItem('walletManuallyDisconnected');
    return await login();
  };

  // Function to check if the wallet was manually disconnected
  const wasManuallyDisconnected = () => {
    return localStorage.getItem('walletManuallyDisconnected') === 'true';
  };

  // Function to update profile data
  const updateProfileData = (newProfileData) => {
    setProfileData(newProfileData);
    
    if (accountType === 'email' && currentUser) {
      // Update email user profile
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const updatedUsers = registeredUsers.map(u => 
        u.id === currentUser.id 
          ? { ...u, nama: newProfileData.nama, nomor: newProfileData.nomor }
          : u
      );
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      setCurrentUser({ ...currentUser, nama: newProfileData.nama, nomor: newProfileData.nomor });
    } else if (accountType === 'wallet') {
      // Update wallet user profile
      const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      userProfiles[walletAddress] = newProfileData;
      localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }
  };

  const value = {
    walletAddress,
    isAuthenticated,
    isConnecting,
    connectionMethod,
    profileData,
    accountType,
    currentUser,
    login,
    logout,
    forceDisconnect,
    reconnect,
    wasManuallyDisconnected,
    updateProfileData,
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
