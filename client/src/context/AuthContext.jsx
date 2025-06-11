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
  const [isInitialized, setIsInitialized] = useState(false);

  // Fungsi untuk inisialisasi data profil wallet
  const initializeWalletProfile = useCallback((address) => {
    const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const profile = userProfiles[address];
    
    if (profile) {
      setProfileData(profile);
    } else {
      const newProfile = {
        nama: `User-${address.substring(0, 6)}`,
        email: '',
        nomor: ''
      };
      setProfileData(newProfile);
      // Simpan profil baru ke localStorage
      userProfiles[address] = newProfile;
      localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }
  }, []);

  // Fungsi untuk menghubungkan wallet MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask tidak terdeteksi. Silakan install MetaMask terlebih dahulu.');
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada akun yang dipilih');
      }

      const newWalletAddress = accounts[0];
      setWalletAddress(newWalletAddress);
      setIsAuthenticated(true);
      setConnectionMethod('manual');
      setAccountType('wallet');
      localStorage.removeItem('walletManuallyDisconnected');

      // Inisialisasi profil wallet
      initializeWalletProfile(newWalletAddress);

      return newWalletAddress;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error(`Gagal menghubungkan wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Fungsi untuk menyimpan wallet address secara manual
  const saveWalletAddress = (address) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Alamat wallet tidak valid');
    }

    setWalletAddress(address);
    setIsAuthenticated(true);
    setConnectionMethod('manual');
    setAccountType('wallet');
    localStorage.removeItem('walletManuallyDisconnected');
    initializeWalletProfile(address);
  };

  // Fungsi untuk memutuskan koneksi
  const handleDisconnection = useCallback(() => {
    setWalletAddress('');
    setIsAuthenticated(false);
    setConnectionMethod(null);
    setProfileData({ nama: '', email: '', nomor: '' });
    setAccountType(null);
    setCurrentUser(null);
  }, []);

  // Fungsi logout komplit
  const logout = useCallback(() => {
    if (accountType === 'email') {
      localStorage.removeItem('currentSession');
    } else {
      localStorage.setItem('walletManuallyDisconnected', 'true');
    }
    handleDisconnection();
  }, [accountType, handleDisconnection]);

  // Fungsi untuk mendengarkan perubahan akun wallet
  const setupEventListeners = useCallback(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accountType !== 'wallet') return;
      
      if (accounts.length === 0) {
        logout();
      } else {
        const wasManuallyDisconnected = localStorage.getItem('walletManuallyDisconnected') === 'true';
        if (!wasManuallyDisconnected) {
          setWalletAddress(accounts[0]);
          initializeWalletProfile(accounts[0]);
        }
      }
    };

    const handleChainChanged = () => {
      if (accountType === 'wallet') {
        window.location.reload();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [accountType, logout, initializeWalletProfile]);

  // Fungsi untuk memeriksa koneksi yang ada
  const checkExistingConnection = useCallback(async () => {
    try {
      // Cek sesi email terlebih dahulu
      const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
      if (session.userId) {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = registeredUsers.find(u => u.id === session.userId);
        
        if (user) {
          setCurrentUser(user);
          setProfileData({
            nama: user.nama,
            email: user.email,
            nomor: user.nomor || ''
          });
          setIsAuthenticated(true);
          setConnectionMethod('email');
          setAccountType('email');
          return;
        }
      }

      // Cek koneksi wallet
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const wasManuallyDisconnected = localStorage.getItem('walletManuallyDisconnected') === 'true';

      if (accounts.length > 0 && !wasManuallyDisconnected) {
        setWalletAddress(accounts[0]);
        setIsAuthenticated(true);
        setConnectionMethod('auto');
        setAccountType('wallet');
        initializeWalletProfile(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [initializeWalletProfile]);

  // Inisialisasi saat mount
  useEffect(() => {
    checkExistingConnection();
    const cleanup = setupEventListeners();
    return cleanup;
  }, [checkExistingConnection, setupEventListeners]);

  // Fungsi untuk update data profil
  const updateProfileData = useCallback((newProfileData) => {
    setProfileData(newProfileData);
    
    if (accountType === 'email' && currentUser) {
      // Update untuk user email
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const updatedUsers = registeredUsers.map(u => 
        u.id === currentUser.id ? { ...u, ...newProfileData } : u
      );
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      setCurrentUser(prev => ({ ...prev, ...newProfileData }));
    } else if (accountType === 'wallet' && walletAddress) {
      // Update untuk user wallet
      const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      userProfiles[walletAddress] = newProfileData;
      localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }
  }, [accountType, currentUser, walletAddress]);

  // Fungsi untuk mengecek apakah wallet di-disconnect secara manual
  const wasManuallyDisconnected = useCallback(() => {
    return localStorage.getItem('walletManuallyDisconnected') === 'true';
  }, []);

  // Fungsi untuk force disconnect dan clear semua data
  const forceDisconnect = useCallback(() => {
    // Clear all localStorage data
    localStorage.removeItem('currentSession');
    localStorage.removeItem('registeredUsers');
    localStorage.removeItem('userProfiles');
    localStorage.removeItem('walletManuallyDisconnected');
    localStorage.removeItem('gameAccounts');
    
    // Reset all states
    handleDisconnection();
    
    // Reload page to ensure clean state
    window.location.reload();
  }, [handleDisconnection]);

  // Fungsi login untuk email dan wallet
  const login = useCallback(async (identifier) => {
    try {
      // Check if it's email login (starts with 'email_')
      if (identifier.startsWith('email_')) {
        const userId = identifier.replace('email_', '');
        const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
        
        if (session.userId === parseInt(userId)) {
          const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const user = registeredUsers.find(u => u.id === parseInt(userId));
          
          if (user) {
            setCurrentUser(user);
            setProfileData({
              nama: user.nama,
              email: user.email,
              nomor: user.nomor || ''
            });
            setIsAuthenticated(true);
            setConnectionMethod('email');
            setAccountType('email');
            return true;
          }
        }
        throw new Error('Session tidak valid');
      } else {
        // Wallet login
        if (!/^0x[a-fA-F0-9]{40}$/.test(identifier)) {
          throw new Error('Alamat wallet tidak valid');
        }
        
        setWalletAddress(identifier);
        setIsAuthenticated(true);
        setConnectionMethod('manual');
        setAccountType('wallet');
        localStorage.removeItem('walletManuallyDisconnected');
        initializeWalletProfile(identifier);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [initializeWalletProfile]);

  const value = {
    walletAddress,
    isAuthenticated,
    isConnecting,
    isInitialized,
    connectionMethod,
    profileData,
    accountType,
    currentUser,
    connectWallet,
    saveWalletAddress,
    login,
    logout,
    updateProfileData,
    initializeWalletProfile,
    wasManuallyDisconnected,
    forceDisconnect
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