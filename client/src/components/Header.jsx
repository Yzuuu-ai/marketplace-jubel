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
    login,
    logout,
    forceDisconnect,
    connectionMethod,
    wasManuallyDisconnected,
    profileData,  // Get profile data from AuthContext
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

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getConnectionStatus = () => {
    if (!isAuthenticated) return null;
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
            <Link to="/riwayat" className="text-gray-700 text-sm hover:text-blue-600">Riwayat</Link>
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
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                  {profileData && profileData.nama ? profileData.nama.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col items-start max-w-[120px]">
                  <span className="font-medium truncate">{shortenAddress(walletAddress)}</span>
                  {getConnectionStatus()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showOptions && (
                <>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-md z-50 border text-sm">
                    <Link to="/profile" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">Profil Akun</Link>
                    <Link to="/sell" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">Jual Akun</Link>
                    <Link to="/escrow" onClick={() => setShowOptions(false)} className="block px-4 py-2 hover:bg-gray-100">Escrow</Link>
                    <hr className="my-1 border-gray-200" />
                    <button onClick={handleSoftLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">Soft Logout</button>
                    <button onClick={handleForceLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Force Logout</button>
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
              <button
                onClick={handleLogin}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Login Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation - Always Visible */}
      <div className="md:hidden border-t py-2 px-4 flex justify-center gap-4 text-sm">
        <Link to="/" className="text-gray-700 hover:text-blue-600">Beranda</Link>
        <Link to="/marketplace" className="text-gray-700 hover:text-blue-600">Marketplace</Link>
        {isAuthenticated && (
          <Link to="/riwayat" className="text-gray-700 hover:text-blue-600">Riwayat</Link>
        )}
      </div>
    </header>
  );
};

export default Header;
