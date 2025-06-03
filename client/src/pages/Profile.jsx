import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Profile = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nama: 'John Doe',
    email: 'john.doe@example.com',
    nomor: '+62 812-3456-7890'
  });

  const [editData, setEditData] = useState({...profileData});

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({...profileData});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setProfileData({...editData});
    setIsEditing(false);
    // Di sini bisa ditambahkan logic untuk menyimpan ke backend
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
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {profileData.nama}
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
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-gray-500">Transaksi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-xs text-gray-500">Akun Dijual</div>
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
                  {/* Nama */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.nama}
                        onChange={(e) => handleInputChange('nama', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan nama lengkap"
                      />
                    ) : (
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-900">{profileData.nama}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
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
                        <span className="text-gray-900">{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Nomor Telepon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.nomor}
                        onChange={(e) => handleInputChange('nomor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan nomor telepon"
                      />
                    ) : (
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-900">{profileData.nomor}</span>
                      </div>
                    )}
                  </div>

                  {/* Wallet Address */}
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

          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;