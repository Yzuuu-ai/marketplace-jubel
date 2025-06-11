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
  const initializeWalletProfile = useCallback(async (address) => {
    try {
      // Coba ambil dari server terlebih dahulu
      const response = await fetch(`http://localhost:5000/api/wallet-profile/${address}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          const serverProfile = {
            nama: data.profile.name,
            email: data.profile.email || '',
            nomor: data.profile.phone || ''
          };
          setProfileData(serverProfile);
          
          // Sinkronisasi dengan localStorage
          const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
          userProfiles[address] = serverProfile;
          localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
          return;
        }
      }
    } catch (error) {
      console.log('Server wallet profile not available, checking for conflicts');
      
      // Check if this wallet might be connected to an email account
      try {
        const conflictResponse = await fetch('http://localhost:5000/api/profile/check-conflicts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: address
          })
        });
        
        if (conflictResponse.ok) {
          const conflictData = await conflictResponse.json();
          
          if (conflictData.success && conflictData.has_conflicts) {
            const walletConflicts = conflictData.conflicts.wallet_conflicts;
            
            // If wallet is connected to an email account, suggest login with email
            if (walletConflicts?.existsInUsers || walletConflicts?.existsInConnectedWallets) {
              const connectedRecord = walletConflicts.userRecord || walletConflicts.connectedRecord;
              
              if (connectedRecord) {
                console.log('Wallet is connected to email account:', connectedRecord.email);
                
                // Show notification to user about existing email account
                if (window.confirm(`Wallet ini sudah terhubung dengan akun email ${connectedRecord.email}. Apakah Anda ingin login dengan email tersebut?`)) {
                  // Redirect to login page or show email login form
                  window.location.href = '/login?email=' + encodeURIComponent(connectedRecord.email);
                  return;
                }
              }
            }
          }
        }
      } catch (conflictError) {
        console.log('Could not check for conflicts:', conflictError.message);
      }
    }
    
    // Fallback ke localStorage
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
      
      // Coba simpan ke server juga
      try {
        const saveResponse = await fetch('http://localhost:5000/api/wallet-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet_address: address,
            name: newProfile.nama,
            email: newProfile.email,
            phone: newProfile.nomor
          })
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          
          // Check if accounts were merged
          if (saveData.merged) {
            alert(saveData.message + '\n\n' + saveData.note);
            // Redirect to login page
            window.location.href = '/login';
            return;
          }
        }
      } catch (error) {
        console.log('Could not save wallet profile to server:', error.message);
      }
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
      
      // Clear logout flags when connecting via MetaMask
      localStorage.removeItem('walletManuallyDisconnected');
      localStorage.removeItem('lastDisconnectedWallet');
      localStorage.removeItem('walletPermanentlyDisconnected');

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
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Alamat wallet tidak valid');
    }

    setWalletAddress(address);
    
    // Only change account type if not already an email user
    if (accountType !== 'email') {
      setIsAuthenticated(true);
      setConnectionMethod('manual');
      setAccountType('wallet');
      
      // Clear logout flags when manually connecting
      localStorage.removeItem('walletManuallyDisconnected');
      localStorage.removeItem('lastDisconnectedWallet');
      localStorage.removeItem('walletPermanentlyDisconnected');
      
      initializeWalletProfile(address);
    }
    // For email users, just update wallet address without changing account type
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
    console.log('🚪 Logout called for account type:', accountType);
    console.log('🔗 Wallet address:', walletAddress);
    
    if (accountType === 'email') {
      localStorage.removeItem('currentSession');
      localStorage.removeItem('authToken');
    } else {
      // For wallet users (including admin), set manual disconnect flag
      localStorage.setItem('walletManuallyDisconnected', 'true');
      
      // Also store the specific wallet that was disconnected
      if (walletAddress) {
        localStorage.setItem('lastDisconnectedWallet', walletAddress);
      }
    }
    
    // Clear any admin session data
    localStorage.removeItem('adminSession');
    
    handleDisconnection();
    
    console.log('✅ Logout completed');
  }, [accountType, handleDisconnection, walletAddress]);

  // Fungsi untuk mendengarkan perubahan akun wallet
  const setupEventListeners = useCallback(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      console.log('🔄 MetaMask accounts changed:', accounts);
      console.log('👤 Current account type:', accountType);
      
      if (accountType !== 'wallet') return;
      
      const wasManuallyDisconnected = localStorage.getItem('walletManuallyDisconnected') === 'true';
      const lastDisconnectedWallet = localStorage.getItem('lastDisconnectedWallet');
      const isPermanentlyDisconnected = localStorage.getItem('walletPermanentlyDisconnected') === 'true';
      
      console.log('🚪 Was manually disconnected:', wasManuallyDisconnected);
      console.log('💾 Last disconnected wallet:', lastDisconnectedWallet);
      console.log('🔒 Is permanently disconnected:', isPermanentlyDisconnected);
      
      // If permanently disconnected, never auto-connect
      if (isPermanentlyDisconnected) {
        console.log('🚫 Wallet permanently disconnected, ignoring account change');
        return;
      }
      
      if (accounts.length === 0) {
        console.log('❌ No accounts available, logging out');
        logout();
      } else {
        const newWallet = accounts[0];
        console.log('🔗 New wallet detected:', newWallet);
        
        // Check if this is the same wallet that was manually disconnected
        if (wasManuallyDisconnected && lastDisconnectedWallet && 
            newWallet.toLowerCase() === lastDisconnectedWallet.toLowerCase()) {
          console.log('🚫 Preventing auto-reconnect of manually disconnected wallet');
          return;
        }
        
        // Check if user manually disconnected any wallet
        if (wasManuallyDisconnected) {
          console.log('🚫 User manually disconnected, not auto-connecting');
          return;
        }
        
        console.log('✅ Auto-connecting to new wallet');
        setWalletAddress(newWallet);
        initializeWalletProfile(newWallet);
      }
    };

    const handleChainChanged = () => {
      console.log('🔗 Chain changed');
      if (accountType === 'wallet') {
        const wasManuallyDisconnected = localStorage.getItem('walletManuallyDisconnected') === 'true';
        if (!wasManuallyDisconnected) {
          window.location.reload();
        }
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
      // Cek sesi yang ada
      const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
      
      if (session.userId && session.token) {
        // Email user session - fetch from API
        try {
          const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${session.token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCurrentUser(data.user);
              setProfileData({
                nama: data.user.name,
                email: data.user.email,
                nomor: data.user.phone || ''
              });
              setIsAuthenticated(true);
              setConnectionMethod('email');
              setAccountType('email');
              
              // Set wallet if connected
              if (data.user.wallet_address) {
                setWalletAddress(data.user.wallet_address);
              }
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching profile from API:', error);
          // Clear invalid session
          localStorage.removeItem('currentSession');
          localStorage.removeItem('authToken');
        }
      } else if (session.walletAddress) {
        // Legacy wallet user session - remove it
        console.log('🗑️ Removing legacy wallet session from localStorage');
        localStorage.removeItem('currentSession');
        // Don't auto-connect from session, let MetaMask handle it
      }

      // Fallback: Check MetaMask connection for wallet users only
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const wasManuallyDisconnected = localStorage.getItem('walletManuallyDisconnected') === 'true';
      const lastDisconnectedWallet = localStorage.getItem('lastDisconnectedWallet');
      const isPermanentlyDisconnected = localStorage.getItem('walletPermanentlyDisconnected') === 'true';

      console.log('🔍 Checking existing MetaMask connection:');
      console.log('📱 Available accounts:', accounts);
      console.log('🚪 Was manually disconnected:', wasManuallyDisconnected);
      console.log('💾 Last disconnected wallet:', lastDisconnectedWallet);
      console.log('🔒 Is permanently disconnected:', isPermanentlyDisconnected);
      console.log('👤 Has email session:', !!session.userId);

      // If permanently disconnected, never auto-connect
      if (isPermanentlyDisconnected) {
        console.log('🚫 Wallet permanently disconnected, not auto-connecting');
        return;
      }

      if (accounts.length > 0 && !session.userId) {
        const currentWallet = accounts[0];
        
        // Check if this specific wallet was manually disconnected
        if (wasManuallyDisconnected && lastDisconnectedWallet && 
            currentWallet.toLowerCase() === lastDisconnectedWallet.toLowerCase()) {
          console.log('🚫 Not auto-connecting manually disconnected wallet:', currentWallet);
          return;
        }
        
        // Check if any wallet was manually disconnected
        if (wasManuallyDisconnected) {
          console.log('🚫 User manually disconnected, not auto-connecting');
          return;
        }
        
        // Only auto-connect if no email session exists and not manually disconnected
        console.log('✅ Auto-connecting to wallet:', currentWallet);
        setWalletAddress(currentWallet);
        setIsAuthenticated(true);
        setConnectionMethod('auto');
        setAccountType('wallet');
        initializeWalletProfile(currentWallet);
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
      // Update untuk user email - mapping field nama ke name dan nomor ke phone
      const mappedData = {
        ...newProfileData,
        name: newProfileData.nama, // Map nama ke name untuk server
        phone: newProfileData.nomor // Map nomor ke phone untuk server
      };
      
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const updatedUsers = registeredUsers.map(u => 
        u.id === currentUser.id ? { ...u, ...mappedData } : u
      );
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      setCurrentUser(prev => ({ ...prev, ...mappedData }));
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
    console.log('🔥 Force disconnect called');
    
    // Clear all localStorage data
    localStorage.removeItem('currentSession');
    localStorage.removeItem('registeredUsers');
    localStorage.removeItem('userProfiles');
    localStorage.removeItem('walletManuallyDisconnected');
    localStorage.removeItem('lastDisconnectedWallet');
    localStorage.removeItem('gameAccounts');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('authToken');
    
    // Reset all states
    handleDisconnection();
    
    // Reload page to ensure clean state
    window.location.reload();
  }, [handleDisconnection]);

  // Fungsi untuk disconnect wallet secara permanen
  const permanentWalletDisconnect = useCallback(async () => {
    console.log('🚫 Permanent wallet disconnect called');
    
    if (walletAddress) {
      // Set permanent disconnect flags
      localStorage.setItem('walletManuallyDisconnected', 'true');
      localStorage.setItem('lastDisconnectedWallet', walletAddress);
      localStorage.setItem('walletPermanentlyDisconnected', 'true');
      
      // Clear any session data
      localStorage.removeItem('currentSession');
      localStorage.removeItem('adminSession');
      
      // Try to disconnect from MetaMask if possible
      try {
        if (window.ethereum && window.ethereum.selectedAddress) {
          // Note: MetaMask doesn't have a programmatic disconnect method
          // But we can clear our internal state
          console.log('🔌 Clearing internal wallet state');
        }
      } catch (error) {
        console.log('Could not disconnect from MetaMask:', error.message);
      }
      
      // Reset all states
      handleDisconnection();
      
      console.log('✅ Wallet permanently disconnected');
    }
  }, [walletAddress, handleDisconnection]);

  // Fungsi login untuk email dan wallet
  const login = useCallback(async (identifier) => {
    try {
      // Check if it's email login (starts with 'email_')
      if (identifier.startsWith('email_')) {
        const userId = identifier.replace('email_', '');
        const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
        
        if (session.userId === parseInt(userId) && session.token) {
          // Fetch user data from API using token
          try {
            const response = await fetch('http://localhost:5000/api/profile', {
              headers: {
                'Authorization': `Bearer ${session.token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setCurrentUser(data.user);
                setProfileData({
                  nama: data.user.name,
                  email: data.user.email,
                  nomor: data.user.phone || ''
                });
                setIsAuthenticated(true);
                setConnectionMethod('email');
                setAccountType('email');
                
                // Check if user has connected wallet
                if (data.user.wallet_address) {
                  setWalletAddress(data.user.wallet_address);
                }
                return true;
              }
            } else {
              // Token invalid, clear session
              localStorage.removeItem('currentSession');
              localStorage.removeItem('authToken');
              throw new Error('Token tidak valid');
            }
          } catch (fetchError) {
            console.error('Error fetching user profile:', fetchError);
            throw new Error('Gagal mengambil data profil');
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
    forceDisconnect,
    permanentWalletDisconnect
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