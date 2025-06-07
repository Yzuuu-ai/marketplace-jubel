// src/components/Header.jsx - Enhanced with better logout options
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { 
    walletAddress, 
    isAuthenticated, 
    logout, 
    forceDisconnect,
    connectionMethod,
    wasManuallyDisconnected 
  } = useAuth();
  const navigate = useNavigate();
  const [showLogoutOptions, setShowLogoutOptions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleSoftLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutOptions(false);
    
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleForceLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutOptions(false);
    
    // Show confirmation
    if (window.confirm('Ini akan menghapus semua data lokal dan memaksa logout. Lanjutkan?')) {
      forceDisconnect();
    } else {
      setIsLoggingOut(false);
    }
  };

  const getConnectionStatus = () => {
    if (!isAuthenticated) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${
          connectionMethod === 'auto' ? 'bg-green-400' : 'bg-blue-400'
        }`}></div>
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
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GameMarket</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Beranda
            </Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-blue-600 font-medium">
              Marketplace
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/sell" className="text-gray-700 hover:text-blue-600 font-medium">
                  Jual Akun
                </Link>
                <Link to="/escrow" className="text-gray-700 hover:text-blue-600 font-medium">
                  Escrow
                </Link>
                <Link to="/riwayat" className="text-gray-700 hover:text-blue-600 font-medium">
                  Riwayat
                </Link>
              </>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                {/* Wallet Info */}
                <div className="flex items-center gap-3">
                  {getConnectionStatus()}
                  
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {shortenAddress(walletAddress)}
                      </span>
                      <span className="text-xs text-gray-500">Connected</span>
                    </div>
                  </div>

                  {/* Logout Dropdown Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLogoutOptions(!showLogoutOptions)}
                      disabled={isLoggingOut}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isLoggingOut 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isLoggingOut ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Logging out...
                        </>
                      ) : (
                        <>
                          Logout
                          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Logout Options Dropdown */}
                    {showLogoutOptions && !isLoggingOut && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-2">
                          <button
                            onClick={handleSoftLogout}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-start gap-2"
                          >
                            <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <div>
                              <div className="font-medium">Soft Logout</div>
                              <div className="text-gray-500 text-xs">Disconnect dari app, data tetap tersimpan</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={handleForceLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md flex items-start gap-2"
                          >
                            <svg className="w-4 h-4 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <div className="font-medium">Force Logout</div>
                              <div className="text-gray-500 text-xs">Clear semua data + reload halaman</div>
                            </div>
                          </button>

                          <div className="border-t border-gray-100 my-2"></div>
                          
                          <Link
                            to="/profile"
                            onClick={() => setShowLogoutOptions(false)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile Settings
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Click outside to close dropdown */}
                {showLogoutOptions && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLogoutOptions(false)}
                  ></div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {wasManuallyDisconnected() && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Previously logged out
                  </div>
                )}
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/sell" className="text-gray-700 hover:text-blue-600 text-sm font-medium">
                Jual Akun
              </Link>
              <Link to="/escrow" className="text-gray-700 hover:text-blue-600 text-sm font-medium">
                Escrow
              </Link>
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