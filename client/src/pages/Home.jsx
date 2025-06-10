// src/pages/Home.jsx - Simplified with card games
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  const navigate = useNavigate();

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
    const accounts = getGameAccounts().filter(acc => !acc.isSold && !acc.isInEscrow);

    // Count available accounts per game
    const gameCounts = gameList.map(game => ({
      ...game,
      accounts: accounts.filter(acc => acc.gameId === game.id).length
    }));

    setFeaturedGames(gameCounts);

    // Get recent accounts (max 3)
    const sortedAccounts = [...accounts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(acc => {
        const game = gameList.find(g => g.id === acc.gameId);
        return {
          ...acc,
          game: game ? game.name : 'Unknown Game',
          image: acc.image || (game ? game.image : '/images/games/default.jpg')
        };
      });

    setRecentAccounts(sortedAccounts);
  }, []);

  const handleBuyNow = (account) => {
    navigate(isAuthenticated ? '/marketplace' : '/login', {
      state: { selectedAccountId: account.id }
    });
  };

  const formatPrice = (ethPrice) => {
    const eth = parseFloat(ethPrice.replace(' ETH', ''));
    return {
      eth: ethPrice,
      idr: `Rp ${(eth * 50000000).toLocaleString('id-ID')}`
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Jual Beli Akun Game</h1>
          <p className="text-xl mb-8">Platform terpercaya untuk transaksi akun game</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold"
            >
              Jelajahi Marketplace
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
              className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold"
            >
              Mulai Jual Akun
            </button>
          </div>
        </div>
      </section>

      {/* Game Cards */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Game Populer</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredGames.map(game => (
            <div key={game.id} 
              onClick={() => navigate(`/marketplace?game=${game.id}`)}
              className="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition"
            >
              <img src={game.image} alt={game.name} className="w-16 h-16 mx-auto mb-2 rounded" />
              <h3 className="font-semibold">{game.name}</h3>
              <p className="text-sm text-gray-500">{game.accounts} akun tersedia</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Accounts */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Akun Terbaru</h2>
          
          {recentAccounts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {recentAccounts.map(account => {
                const price = formatPrice(account.price);
                return (
                  <div key={account.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <img src={account.image} alt={account.game} className="w-12 h-12 rounded mr-3" />
                        <div>
                          <h3 className="font-semibold">{account.title}</h3>
                          <p className="text-sm text-gray-500">{account.game}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <p><span className="font-medium">Rank:</span> {account.rank || 'N/A'}</p>
                        <p><span className="font-medium">Level:</span> {account.level || 'N/A'}</p>
                      </div>

                      <div className="border-t pt-3">
                        <div className="mb-3">
                          <span className="text-xl font-bold text-blue-600">{price.eth}</span>
                          <p className="text-sm text-gray-500">{price.idr}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBuyNow(account)}
                            className={`flex-1 py-2 rounded-lg ${
                              isAuthenticated ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                            }`}
                          >
                            {isAuthenticated ? 'Beli' : 'Login'}
                          </button>
                          <button
                            onClick={() => navigate('/marketplace', { state: { viewAccountId: account.id } })}
                            className="py-2 px-3 bg-blue-600 text-white rounded-lg"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center bg-white rounded-lg shadow p-8 max-w-md mx-auto">
              <p className="text-lg mb-4">Belum ada akun yang dijual</p>
              <button
                onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {isAuthenticated ? 'Jual Akun' : 'Login'}
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;