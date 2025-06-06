// src/components/Header.jsx - Fixed ESLint warnings
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';

const Header = () => {
  const { isAuthenticated, walletAddress, logout } = useAuth();
  const { isAdmin, checkAdminStatus } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check admin status when wallet changes
  useEffect(() => {
    if (walletAddress) {
      checkAdminStatus(walletAddress);
    }
  }, [walletAddress, checkAdminStatus]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  const navigationLinks = [
    { to: '/', label: 'Beranda', icon: '🏠' },
    { to: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { to: '/sell', label: 'Jual Akun', icon: '💰', requireAuth: true },
    { to: '/escrow', label: 'Escrow', icon: '🔒', requireAuth: true },
    { to: '/pesanan', label: 'Pesanan', icon: '📦', requireAuth: true },
    { to: '/riwayat-transaksi', label: 'Riwayat', icon: '📊', requireAuth: true }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: '⚙️' }
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GM</span>
            </div>
            <span className="text-xl font-bold text-gray-800">GameMarket</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => {
              if (link.requireAuth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {/* Admin Links */}
            {isAuthenticated && isAdmin && (
              <div className="border-l border-gray-300 ml-2 pl-2">
                {adminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-100 hover:text-purple-800 transition-colors font-medium"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Admin Badge */}
                {isAdmin && (
                  <div className="hidden sm:flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    <span className="mr-1">👑</span>
                    <span>Admin</span>
                  </div>
                )}
                
                {/* Wallet Info */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-700">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                  </span>
                  <span className="text-xs text-gray-500">Connected</span>
                </div>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="flex items-center space-x-2 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {walletAddress.substring(2, 4).toUpperCase()}
                      </span>
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Wallet Connected</p>
                        <p className="text-xs text-gray-500 font-mono break-all">{walletAddress}</p>
                        {isAdmin && (
                          <div className="mt-1 flex items-center text-xs text-purple-600">
                            <span className="mr-1">👑</span>
                            <span>Administrator</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="mr-2">👤</span>
                          Profile
                        </Link>
                        
                        <Link
                          to="/escrow"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="mr-2">🔒</span>
                          Escrow Management
                        </Link>
                        
                        <Link
                          to="/pesanan"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="mr-2">📦</span>
                          Pesanan Saya
                        </Link>
                        
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-200 my-1"></div>
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span className="mr-2">⚙️</span>
                              Admin Dashboard
                            </Link>
                          </>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <span className="mr-2">🔌</span>
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect Wallet
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navigationLinks.map((link) => {
              if (link.requireAuth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile Admin Links */}
            {isAuthenticated && isAdmin && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-1 text-xs font-medium text-purple-600 uppercase tracking-wide">
                  Admin
                </div>
                {adminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;