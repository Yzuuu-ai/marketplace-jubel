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
    wasManuallyDisconnected
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
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${connectionMethod === 'auto' ? 'bg-green-400' : 'bg-blue-400'}`} />
        <span className="text-gray-600">
          {connectionMethod === 'auto' ? 'Auto-connected' : 'Manual login'}
        </span>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">GM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">GameMarket</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Beranda</Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-blue-600 font-medium">Marketplace</Link>
            {isAuthenticated && (
              <Link to="/riwayat" className="text-gray-700 hover:text-blue-600 font-medium">Riwayat</Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <div className="flex items-center gap-3">
                  {getConnectionStatus()}
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {shortenAddress(walletAddress)}
                      </span>
                      <span className="text-xs text-gray-500">Dompet Terhubung</span>
                    </div>
                  </button>
                </div>

                {/* Dropdown */}
                {showOptions && (
                  <>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-2 space-y-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowOptions(false)}
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Profil Akun
                        </Link>
                        <Link
                          to="/sell"
                          onClick={() => setShowOptions(false)}
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Jual Akun
                        </Link>
                        <Link
                          to="/escrow"
                          onClick={() => setShowOptions(false)}
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Escrow
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={handleSoftLogout}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Soft Logout
                        </button>
                        <button
                          onClick={handleForceLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md"
                        >
                          Force Logout
                        </button>
                      </div>
                    </div>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowOptions(false)}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {wasManuallyDisconnected() && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Sebelumnya logout manual
                  </div>
                )}
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Login Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/riwayat" className="text-gray-700 hover:text-blue-600 text-sm font-medium">
                Riwayat
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
