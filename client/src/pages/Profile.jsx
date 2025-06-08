import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';

const Profile = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const { escrowTransactions } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nama: '',
    email: '',
    nomor: ''
  });
  const [editData, setEditData] = useState({...profileData});
  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    asSeller: 0,
    asBuyer: 0,
    completedSales: 0,
    completedPurchases: 0
  });

  // Load profile data from localStorage based on wallet
  useEffect(() => {
    if (walletAddress) {
      const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      const userProfile = savedProfiles[walletAddress];
      
      if (userProfile) {
        setProfileData(userProfile);
        setEditData(userProfile);
      } else {
        // Default profile name based on wallet
        const defaultProfile = {
          nama: `User-${walletAddress.substring(0, 6)}`,
          email: '',
          nomor: ''
        };
        setProfileData(defaultProfile);
        setEditData(defaultProfile);
      }
    }
  }, [walletAddress]);

  // Calculate transaction statistics
  useEffect(() => {
    if (walletAddress && escrowTransactions) {
      const sellerTransactions = escrowTransactions.filter(tx => tx.sellerWallet === walletAddress);
      const buyerTransactions = escrowTransactions.filter(tx => tx.buyerWallet === walletAddress);
      
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
  }, [walletAddress, escrowTransactions]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({...profileData});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Validate name
    if (!editData.nama.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }

    // Save to localStorage
    const savedProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    savedProfiles[walletAddress] = editData;
    localStorage.setItem('userProfiles', JSON.stringify(savedProfiles));

    // Update profile data
    setProfileData({...editData});
    setIsEditing(false);

    // Update seller name in game accounts
    const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const updatedAccounts = gameAccounts.map(account => {
      if (account.sellerWallet === walletAddress) {
        return { ...account, sellerName: editData.nama };
      }
      return account;
    });
    localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));

    console.log('Profile updated:', editData);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
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
    <Header/>
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
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {profileData.nama ? profileData.nama.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {profileData.nama || 'Unnamed User'}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  Wallet: {shortenAddress(walletAddress)}
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-600">Aktif</span>
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
                <div className="space-y-6">
                  {/* Nama (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Tampilan <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={editData.nama}
                          onChange={(e) => handleInputChange('nama', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Masukkan nama tampilan"
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
                        <span className="text-gray-900">{profileData.nama || 'Belum diatur'}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500">(Opsional)</span>
                    </label>
                    {isEditing ? (
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
                        <span className="text-gray-900">{profileData.email || 'Belum diatur'}</span>
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
                        <span className="text-gray-900">{profileData.nomor || 'Belum diatur'}</span>
                      </div>
                    )}
                  </div>

                  {/* Wallet Address (Read Only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Wallet
                    </label>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-gray-900 font-mono text-sm">{walletAddress}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(walletAddress)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Alamat wallet tidak dapat diubah</p>
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-700">
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
              </div>
            </div>

            {/* Transaction History Preview */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
                <a href="/riwayat" className="text-blue-600 hover:text-blue-700 text-sm">
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
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;