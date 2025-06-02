// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const gameList = [
  { id: 1, name: 'Mobile Legends', code: 'ML', image: '/images/games/ml.jpg' },
  { id: 2, name: 'PUBG Mobile', code: 'PUBG', image: '/images/games/pubg.jpg' },
  { id: 3, name: 'Free Fire', code: 'FF', image: '/images/games/ff.jpg' },
  { id: 4, name: 'Genshin Impact', code: 'GI', image: '/images/games/genshin.jpg' }
];

const Home = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const { isAuthenticated } = useAuth();

  const getGameAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('gameAccounts');
      return savedAccounts ? JSON.parse(savedAccounts) : [];
    } catch (error) {
      console.error('Error parsing game accounts:', error);
      return [];
    }
  };

  useEffect(() => {
    const accounts = getGameAccounts();

    const gameCounts = gameList.map(game => {
      const count = accounts.filter(acc => acc.gameId === game.id).length;
      return { ...game, accounts: count };
    });

    setFeaturedGames(gameCounts);

    const sortedAccounts = [...accounts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    const formattedAccounts = sortedAccounts.map(acc => {
      const game = gameList.find(g => g.id === acc.gameId);
      return {
        id: acc.id,
        game: game ? game.name : 'Unknown Game',
        rank: acc.rank || 'N/A',
        price: acc.price,
        image: acc.image || (game ? game.image : '/images/games/default.jpg')
      };
    });

    setRecentAccounts(formattedAccounts);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Jual Beli Akun Game
              <span className="block text-yellow-300">Dengan Blockchain</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100">
              Platform terpercaya untuk transaksi akun game menggunakan cryptocurrency
            </p>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Game Populer</h3>
            <p className="text-gray-600">Temukan akun game favoritmu dengan harga terbaik</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredGames.map(game => (
              <div key={game.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{game.name}</h4>
                  <p className="text-sm text-gray-500">{game.accounts} akun tersedia</p>
                  <Link
                    to={`/marketplace?game=${game.id}`}
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Lihat Akun
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Accounts */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Akun Terbaru</h3>
            <p className="text-gray-600">Akun game berkualitas yang baru saja ditambahkan</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {recentAccounts.map(account => (
              <div key={account.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center">
                      <img
                        src={account.image}
                        alt={account.game}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{account.game}</h4>
                      <p className="text-sm text-gray-500">Rank: {account.rank}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{account.price}</span>
                    <button
                      className={`px-4 py-2 rounded-lg ${
                        isAuthenticated
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-400 text-white cursor-not-allowed'
                      }`}
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? 'Beli Sekarang' : 'Login untuk Beli'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/marketplace"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Lihat Semua Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Mengapa Pilih GameMarket?</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Aman & Terpercaya</h4>
              <p className="text-gray-600">Transaksi menggunakan blockchain untuk keamanan maksimal</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Harga Transparan</h4>
              <p className="text-gray-600">Tanpa biaya tersembunyi, semua transaksi jelas dan adil</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Transaksi Cepat</h4>
              <p className="text-gray-600">Proses pembelian dan transfer akun yang mudah dan cepat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">GameMarket</h4>
              <p className="text-gray-400">Platform terpercaya untuk jual beli akun game dengan teknologi blockchain.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Marketplace</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/marketplace" className="hover:text-white">Semua Game</Link></li>
                <li><Link to="/marketplace?category=mobile" className="hover:text-white">Mobile Games</Link></li>
                <li><Link to="/marketplace?category=pc" className="hover:text-white">PC Games</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Bantuan</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Cara Membeli</Link></li>
                <li><Link to="/help" className="hover:text-white">Cara Menjual</Link></li>
                <li><Link to="/contact" className="hover:text-white">Kontak</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Ikuti Kami</h5>
              <div className="flex space-x-4">
                <a href="https://facebook.com/gamemarket" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="https://twitter.com/gamemarket" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="https://instagram.com/gamemarket" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GameMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
