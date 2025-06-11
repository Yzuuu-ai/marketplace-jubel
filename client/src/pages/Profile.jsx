// src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import AccountConflictModal from '../components/AccountConflictModal';

const Profile = () => {
  const { 
    walletAddress, 
    isAuthenticated, 
    profileData, 
    updateProfileData, 
    accountType, 
    currentUser,
    connectWallet,
    saveWalletAddress,
    logout
  } = useAuth();
  const { escrowTransactions } = useAdmin();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    nama: '', 
    email: '', 
    nomor: '' 
  });
  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    asSeller: 0,
    asBuyer: 0,
    completedSales: 0,
    completedPurchases: 0
  });
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  // Load profile data with proper loading state
  useEffect(() => {
    const loadProfileData = async () => {
      if (accountType === 'email' && currentUser) {
        setEditData({
          nama: currentUser.name || currentUser.nama || '', // Server mengirim 'name', fallback ke 'nama'
          email: currentUser.email || '',
          nomor: currentUser.phone || currentUser.nomor || '' // Server mengirim 'phone', fallback ke 'nomor'
        });
      } else if (accountType === 'wallet' && walletAddress) {
        setIsLoadingProfile(true);
        setProfileError(null);
        
        try {
          // Coba ambil dari server terlebih dahulu
          const response = await fetch(`http://localhost:5000/api/wallet-profile/${walletAddress}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile) {
              const serverProfile = {
                nama: data.profile.name,
                email: data.profile.email || '',
                nomor: data.profile.phone || ''
              };
              setEditData(serverProfile);
              
              // Sinkronisasi dengan localStorage
              const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
              userProfiles[walletAddress] = serverProfile;
              localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
              setIsLoadingProfile(false);
              return;
            }
          }
        } catch (error) {
          console.log('Server wallet profile not available, using localStorage');
          setProfileError('Server tidak tersedia, menggunakan data lokal');
        }
        
        // Fallback ke localStorage
        try {
          const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
          const userProfile = savedProfiles[walletAddress];

          if (userProfile) {
            setEditData(userProfile);
          } else {
            const defaultProfile = {
              nama: `User-${walletAddress.substring(0, 6)}`,
              email: '',
              nomor: ''
            };
            setEditData(defaultProfile);
            
            // Simpan default profile ke localStorage dan server
            savedProfiles[walletAddress] = defaultProfile;
            localStorage.setItem('userProfiles', JSON.stringify(savedProfiles));
            
            // Coba simpan ke server
            try {
              await fetch('http://localhost:5000/api/wallet-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  wallet_address: walletAddress,
                  name: defaultProfile.nama,
                  email: defaultProfile.email,
                  phone: defaultProfile.nomor
                })
              });
            } catch (error) {
              console.log('Could not save default profile to server:', error.message);
            }
          }
        } catch (error) {
          console.error('Error loading profile from localStorage:', error);
          setProfileError('Gagal memuat profil');
        }
        
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [walletAddress, accountType, currentUser]);

  useEffect(() => {
    if (walletAddress && escrowTransactions) {
      const effectiveWallet = accountType === 'email' ? walletAddress : walletAddress;
      
      const sellerTransactions = escrowTransactions.filter(tx => tx.sellerWallet === effectiveWallet);
      const buyerTransactions = escrowTransactions.filter(tx => tx.buyerWallet === effectiveWallet);

      const completedSales = sellerTransactions.filter(tx => tx.status === 'completed').length;
      const completedPurchases = buyerTransactions.filter(tx => tx.status === 'completed').length;

      setTransactionStats({
        totalTransactions: sellerTransactions.length + buyerTransactions.length,
        asSeller: sellerTransactions.length,
        asBuyer: buyerTransactions.length,
        completedSales,
        completedPurchases
      });
    }
  }, [walletAddress, escrowTransactions, accountType]);

  const handleEditToggle = () => {
    if (isEditing) {
      if (accountType === 'email' && currentUser) {
        setEditData({
          nama: currentUser.name || currentUser.nama || '',
          email: currentUser.email || '',
          nomor: currentUser.phone || currentUser.nomor || ''
        });
      } else {
        setEditData({ ...profileData });
      }
    }
    setIsEditing(!isEditing);
  };

  // Check for account conflicts
  const checkAccountConflicts = async (email, walletAddr) => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/check-conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email || undefined,
          wallet_address: walletAddr || undefined
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Gagal memeriksa konflik');
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  };

  // Handle account merging
  const handleAccountMerge = async (mergeOption) => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/merge-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: editData.email,
          wallet_address: walletAddress,
          merge_type: mergeOption.type
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(data.message + (data.note ? '\n\n' + data.note : ''));
        setShowConflictModal(false);
        
        // Redirect to login if accounts were merged
        if (data.merged_account) {
          window.location.href = '/login';
        }
      } else {
        throw new Error(data.message || 'Gagal menggabungkan akun');
      }
    } catch (error) {
      console.error('Error merging accounts:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!editData.nama.trim()) {
      alert('Nama lengkap tidak boleh kosong');
      return;
    }

    // Check for conflicts before saving (for wallet users with email)
    if (accountType === 'wallet' && editData.email && editData.email.trim()) {
      try {
        const conflictCheck = await checkAccountConflicts(editData.email, walletAddress);
        
        if (conflictCheck.has_conflicts && conflictCheck.conflicts.can_merge) {
          setConflictData(conflictCheck.conflicts);
          setShowConflictModal(true);
          return; // Stop save process, let user handle conflicts first
        } else if (conflictCheck.has_conflicts) {
          alert('Email atau wallet sudah terdaftar di sistem. Silakan gunakan email atau wallet yang berbeda.');
          return;
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
        // Continue with save if conflict check fails
      }
    }

    try {
      if (accountType === 'email') {
        // Simpan ke server menggunakan API
        const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
        const token = session.token || localStorage.getItem('authToken');
        
        if (!token) {
          alert('Token autentikasi tidak ditemukan. Silakan login ulang.');
          return;
        }

        const response = await fetch('http://localhost:5000/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editData.nama, // Server menggunakan field 'name'
            phone: editData.nomor,
            email: editData.email
          })
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            alert('Token tidak valid. Silakan login ulang.');
            return;
          }
          throw new Error(data.message || 'Gagal menyimpan profil');
        }

        // Update localStorage untuk sinkronisasi
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUsers = registeredUsers.map(user => {
          if (user.id === currentUser.id) {
            return {
              ...user,
              nama: editData.nama,
              name: editData.nama, // Tambahkan field name juga
              nomor: editData.nomor,
              phone: editData.nomor
            };
          }
          return user;
        });
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

        // Update session
        if (session.userId === currentUser.id) {
          session.nama = editData.nama;
          session.name = editData.nama;
          localStorage.setItem('currentSession', JSON.stringify(session));
        }

        alert('Profil berhasil disimpan!');
      } else {
        // Untuk wallet user, simpan ke server terlebih dahulu, kemudian localStorage
        try {
          const response = await fetch('http://localhost:5000/api/wallet-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet_address: walletAddress,
              name: editData.nama,
              email: editData.email,
              phone: editData.nomor
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Gagal menyimpan profil ke server');
          }

          console.log('Wallet profile saved to server successfully');
        } catch (error) {
          console.error('Error saving wallet profile to server:', error);
          // Lanjutkan dengan localStorage saja jika server gagal
          console.log('Continuing with localStorage only');
        }

        // Simpan ke localStorage
        const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        savedProfiles[walletAddress] = editData;
        localStorage.setItem('userProfiles', JSON.stringify(savedProfiles));

        alert('Profil berhasil disimpan!');
      }

      // Update context
      updateProfileData(editData);

      // Update game accounts
      const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
      const updatedAccounts = gameAccounts.map(account => {
        if (account.sellerWallet === walletAddress) {
          return { ...account, sellerName: editData.nama };
        }
        return account;
      });
      localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));

      setIsEditing(false);
      
      // Refresh data dari server
      if (accountType === 'email') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Gagal menyimpan profil: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnectWalletClick = async () => {
    setIsConnectingWallet(true);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask tidak terdeteksi. Silakan install MetaMask terlebih dahulu.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        await handleWalletConnection(walletAddress);
      }
      setShowWalletForm(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Gagal menghubungkan wallet: ' + error.message);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleManualWalletConnect = async () => {
    if (!newWalletAddress) {
      alert('Alamat wallet tidak boleh kosong');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newWalletAddress)) {
      alert('Alamat wallet tidak valid');
      return;
    }

    try {
      await handleWalletConnection(newWalletAddress);
      setShowWalletForm(false);
      setNewWalletAddress('');
    } catch (error) {
      alert('Gagal menghubungkan wallet: ' + error.message);
    }
  };

  const handleWalletConnection = async (walletAddress) => {
    try {
      const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
      const token = session.token || localStorage.getItem('authToken');
      
      console.log('Session:', session);
      console.log('Token found:', !!token);
      console.log('Account type:', accountType);
      console.log('Current user:', currentUser);
      
      if (!token) {
        // Try to get fresh token by re-authenticating
        if (accountType === 'email' && currentUser && currentUser.email) {
          throw new Error('Token tidak ditemukan. Silakan login ulang untuk menghubungkan wallet.');
        } else {
          throw new Error('Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.');
        }
      }

      console.log('Making API call with token...');
      const response = await fetch('http://localhost:5000/api/profile/connect-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          wallet_address: walletAddress
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Token tidak valid. Silakan login ulang.');
        }
        throw new Error(data.message || 'Gagal menghubungkan wallet');
      }

      // Update session with connected wallet (but keep email account type)
      const updatedSession = {
        ...session,
        connectedWallet: walletAddress
      };
      localStorage.setItem('currentSession', JSON.stringify(updatedSession));

      // Update context without changing account type
      saveWalletAddress(walletAddress);
      
      alert('Wallet berhasil terhubung!');
      
      // Refresh page to update profile data
      window.location.reload();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const handleDisconnectWallet = () => {
    alert('Wallet yang sudah terhubung tidak dapat dilepas untuk keamanan akun. Jika Anda ingin mengganti wallet, silakan hubungi administrator.');
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h2>
          <p className="text-gray-600">Silakan login terlebih dahulu untuk mengakses halaman profil.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <AccountConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflicts={conflictData}
        onMerge={handleAccountMerge}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
              <p className="text-gray-600 mt-1">Kelola informasi profil dan akun Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Profile Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className={`w-24 h-24 ${accountType === 'email' ? 'bg-purple-600' : 'bg-blue-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-3xl font-bold text-white">
                      {editData.nama ? editData.nama.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {editData.nama || 'Pengguna Tanpa Nama'}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4">
                    {accountType === 'email' ? 'Akun Email' : `Wallet: ${shortenAddress(walletAddress)}`}
                  </p>

                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Aktif</span>
                  </div>
                  

                  {/* Account Type Badge */}
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${accountType === 'email' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {accountType === 'email' ? '✉️ Pengguna Email' : '🔗 Pengguna Wallet'}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {transactionStats.totalTransactions}
                      </div>
                      <div className="text-xs text-gray-500">Total Transaksi</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {transactionStats.completedSales + transactionStats.completedPurchases}
                      </div>
                      <div className="text-xs text-gray-500">Selesai</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sebagai Penjual:</span>
                      <span className="font-medium">{transactionStats.asSeller}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sebagai Pembeli:</span>
                      <span className="font-medium">{transactionStats.asBuyer}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h2>
                  <button
                    onClick={handleEditToggle}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {isEditing ? 'Batal' : 'Edit Profil'}
                  </button>
                </div>

                <div className="p-6">
                  {isLoadingProfile && accountType === 'wallet' ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center space-x-3">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Memuat profil wallet...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {profileError && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-yellow-800 text-sm">{profileError}</span>
                          </div>
                        </div>
                      )}
                      <div className="space-y-6">
                        {/* Nama (Required) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Lengkap <span className="text-red-500">*</span>
                          </label>
                          {isEditing ? (
                            <div>
                              <input
                                type="text"
                                value={editData.nama}
                                onChange={(e) => handleInputChange('nama', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Masukkan nama lengkap"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Nama ini akan ditampilkan sebagai penjual/pembeli di marketplace
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-gray-900">{editData.nama || 'Belum diatur'}</span>
                            </div>
                          )}
                        </div>

                    {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email {accountType === 'email' && <span className="text-gray-500">(Tidak dapat diubah)</span>}
                          </label>
                          {isEditing && accountType === 'wallet' ? (
                            <input
                              type="email"
                              value={editData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Masukkan email"
                            />
                          ) : (
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-900">
                                {accountType === 'email' && currentUser ? currentUser.email : (editData.email || 'Belum diatur')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Nomor Telepon (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nomor Telepon <span className="text-gray-500">(Opsional)</span>
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editData.nomor}
                              onChange={(e) => handleInputChange('nomor', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Masukkan nomor telepon"
                            />
                          ) : (
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-gray-900">{editData.nomor || 'Belum diatur'}</span>
                            </div>
                          )}
                        </div>

                        {/* Wallet Address Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {accountType === 'email' ? 'Wallet Terhubung' : 'Alamat Wallet'}
                          </label>
                          
                          {accountType === 'email' && !walletAddress ? (
                            <div className="space-y-3">
                              {!showWalletForm ? (
                                <button
                                  onClick={() => setShowWalletForm(true)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  Tambahkan Wallet
                                </button>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleConnectWalletClick}
                                      disabled={isConnectingWallet}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                                    >
                                      {isConnectingWallet ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Menghubungkan...
                                        </>
                                      ) : 'Hubungkan MetaMask'}
                                    </button>
                                    <button
                                      onClick={() => setShowWalletForm(false)}
                                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                  
                                  <div className="relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                      <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                      <span className="px-2 bg-white text-sm text-gray-500">ATAU</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Masukkan Alamat Wallet Manual
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newWalletAddress}
                                        onChange={(e) => setNewWalletAddress(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0x..."
                                      />
                                      <button
                                        onClick={handleManualWalletConnect}
                                        disabled={!newWalletAddress}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-900 font-mono text-sm">{shortenAddress(walletAddress)}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(walletAddress)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Salin
                              </button>
                              {accountType === 'email' && walletAddress && (
                                <button
                                  onClick={handleDisconnectWallet}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Lepas
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {accountType === 'email' 
                              ? walletAddress 
                                ? 'Alamat wallet yang terhubung dengan akun email Anda' 
                                : 'Hubungkan wallet untuk melakukan transaksi'
                              : 'Alamat wallet tidak dapat diubah'}
                          </p>
                        </div>

                    {/* Account Type Info */}
                        <div className={`${accountType === 'email' ? 'bg-purple-50' : 'bg-blue-50'} p-4 rounded-lg`}>
                          <div className="flex items-start gap-2">
                            <svg className={`w-5 h-5 ${accountType === 'email' ? 'text-purple-600' : 'text-blue-600'} mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className={`text-sm ${accountType === 'email' ? 'text-purple-700' : 'text-blue-700'}`}>
                              <p className="font-medium mb-1">
                                {accountType === 'email' ? 'Akun Email' : 'Akun Wallet'}
                              </p>
                              <p>
                                {accountType === 'email' 
                                  ? 'Anda login menggunakan email dan password. Untuk melakukan transaksi, Anda perlu menghubungkan wallet MetaMask.' 
                                  : 'Anda login menggunakan MetaMask wallet. Semua transaksi akan menggunakan wallet ini.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Privacy Notice */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div className="text-sm text-gray-700">
                              <p className="font-medium mb-1">Informasi Privasi</p>
                              <p>Nama yang Anda atur akan ditampilkan kepada pengguna lain saat bertransaksi sebagai penjual atau pembeli. Email dan nomor telepon bersifat privat dan tidak akan ditampilkan.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                  {/* Save Button */}
                      {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={handleEditToggle}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Transaction History Preview */}
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
                  <a href="/riwayat-transaksi" className="text-blue-600 hover:text-blue-700 text-sm">
                    Lihat Semua → 
                  </a>
                </div>

                {transactionStats.totalTransactions > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p>Anda telah melakukan {transactionStats.totalTransactions} transaksi</p>
                      <ul className="mt-2 space-y-1">
                        <li>• {transactionStats.asSeller} transaksi sebagai penjual</li>
                        <li>• {transactionStats.asBuyer} transaksi sebagai pembeli</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada aktivitas transaksi</p>
                )}
              </div>

              {/* Additional Info for Email Users */}
              {accountType === 'email' && !walletAddress && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Perhatian untuk Pengguna Email</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Untuk melakukan pembelian atau penjualan, Anda perlu menghubungkan wallet MetaMask. 
                        Wallet ini akan digunakan untuk transaksi cryptocurrency.
                      </p>
                      <button className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900">
                        Pelajari cara menghubungkan wallet → 
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
