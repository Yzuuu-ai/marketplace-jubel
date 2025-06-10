// src/components/Footer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const gameList = [
    { id: 1, name: 'Mobile Legends' },
    { id: 2, name: 'PUBG Mobile' },
    { id: 3, name: 'Free Fire' },
    { id: 4, name: 'Genshin Impact' }
  ];

  const handleGameClick = (gameId) => {
    navigate(`/marketplace?game=${gameId}`);
    window.scrollTo(0, 0);
  };

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">GameMarket</h3>
            <p className="text-gray-400 text-sm">
              Platform jual beli akun game terpercaya dengan teknologi blockchain
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">GM</span>
              </div>
              <span className="text-sm text-gray-400">Secure Gaming Marketplace</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button 
                  onClick={() => handleNavigate('/marketplace')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Marketplace
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigate('/sell')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Jual Akun
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigate('/escrow')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Escrow Status
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigate('/riwayat-transaksi')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Riwayat Transaksi
                </button>
              </li>
            </ul>
          </div>

          {/* Game Populer */}
          <div>
            <h4 className="font-semibold mb-4">Game Populer</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {gameList.map(game => (
                <li key={game.id}>
                  <button
                    onClick={() => handleGameClick(game.id)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {game.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Support */}
          <div>
            <h4 className="font-semibold mb-4">Ikuti Kami</h4>
            <div className="flex gap-4 mb-6">
              <a 
                href="https://facebook.com/gamemarket" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com/gamemarket" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/gamemarket" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
            </div>
            
            <h4 className="font-semibold mb-2">Bantuan</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button 
                  onClick={() => alert('Halaman bantuan akan segera tersedia')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Pusat Bantuan
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('Halaman FAQ akan segera tersedia')} 
                  className="hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => alert('Halaman kontak akan segera tersedia')} 
                  className="hover:text-white transition-colors text-left"
                >
                  Hubungi Kami
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              &copy; 2025 GameMarket. Hak cipta dilindungi. | Didukung oleh Ethereum Blockchain
            </p>
            
            <div className="flex gap-6 text-sm text-gray-400">
              <button 
                onClick={() => alert('Halaman syarat & ketentuan akan segera tersedia')}
                className="hover:text-white transition-colors"
              >
                Syarat & Ketentuan
              </button>
              <button 
                onClick={() => alert('Halaman kebijakan privasi akan segera tersedia')}
                className="hover:text-white transition-colors"
              >
                Kebijakan Privasi
              </button>
              <button 
                onClick={() => navigate('/admin')}
                className="hover:text-white transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Security Badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Transaksi Aman</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⟠</span>
              <span>Ethereum Blockchain</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v2a1 1 0 102 0V7a5 5 0 00-5-5z" />
              </svg>
              <span>Escrow Protection</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;