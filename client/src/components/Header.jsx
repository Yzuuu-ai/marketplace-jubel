// src/components/Header.jsx - Updated to support email users
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const shortenAddress = (address) => {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
};

const Header = () => {
  const {
    isAuthenticated,
    walletAddress,
    logout,
    forceDisconnect,
    connectionMethod,
    wasManuallyDisconnected,
    profileData,
    accountType,
    currentUser
  } = useAuth();

  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const handleSoftLogout = async () => {
    setShowOptions(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleForceLogout = () => {
    setShowOptions(false);
    if (window.confirm('Ini akan menghapus semua data lokal dan memaksa logout. Lanjutkan?')) {
      forceDisconnect();
    }
  };

  const getConnectionStatus = () => {
    if (!isAuthenticated) return null;
    
    if (accountType === 'email') {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
          Email Account
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connectionMethod === 'auto' ? 'bg-green-500' : 'bg-blue-500'
          }`}
        ></span>
        {connectionMethod === 'auto' ? 'Auto-connected' : 'Manual login'}
      </div>
    );
  };

  const getDisplayName = () => {
    if (accountType === 'email' && currentUser) {
      return currentUser.email;
    }
    return shortenAddress(walletAddress);
  };

  const getAvatar = () => {
    if (profileData && profileData.nama) {
      return profileData.nama.charAt(0).toUpperCase();
    }
    if (accountType === 'email' && currentUser) {
      return currentUser.nama.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-md font-bold text-sm">GM</div>
          <span className="font-semibold text-lg text-gray-800">GameMarket</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 text-sm hover:text-blue-600">Beranda</Link>
          <Link to="/marketplace" className="text-gray-700 text-sm hover:text-blue-600">Marketplace</Link>
          {isAuthenticated && (
            <Link to="/riwayat-transaksi" className="text-gray-700 text-sm hover:text-blue-600">Riwayat</Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition text-sm"
              >
                {/* Avatar */}
                <div className={`w-8 h-8 ${accountType === 'email' ? 'bg-purple-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center text-xs`}>
                  {getAvatar()}
                </div>
                <div className="flex flex-col items-start max-w-[150px]">
                  <span className="font-medium truncate">{getDisplayName()}</span>
                  {getConnectionStatus()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showOptions && (
                <>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-md z-50 border text-sm">
                    <Link to="/profile" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Akun
                      </div>
                    </Link>
                    <Link to="/sell" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Jual Akun
                      </div>
                    </Link>
                    <Link to="/escrow" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Escrow
                      </div>
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    
                    {accountType === 'email' && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {currentUser?.email}
                        </div>
                      </div>
                    )}
                    
                    {accountType === 'wallet' && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {shortenAddress(walletAddress)}
                        </div>
                      </div>
                    )}
                    
                    <button onClick={handleSoftLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </div>
                    </button>
                    
                    {accountType === 'wallet' && (
                      <button onClick={handleForceLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Force Logout
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {wasManuallyDisconnected() && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">Logout manual</span>
              )}
              <Link
                to="/login"
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="border border-blue-600 text-blue-600 text-sm px-4 py-2 rounded-md hover:bg-blue-50 transition"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation - Always Visible */}
      <div className="md:hidden border-t py-2 px-4 flex justify-center gap-4 text-sm">
        <Link to="/" className="text-gray-700 hover:text-blue-600">Beranda</Link>
        <Link to="/marketplace" className="text-gray-700 hover:text-blue-600">Marketplace</Link>
        {isAuthenticated && (
          <Link to="/riwayat-transaksi" className="text-gray-700 hover:text-blue-600">Riwayat</Link>
        )}
      </div>
    </header>
  );
};

export default Header;