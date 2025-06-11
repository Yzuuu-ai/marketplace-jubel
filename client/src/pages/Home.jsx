// src/pages/Home.jsx - Database Connected Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, gameAccountsAPI, healthAPI } from '../services/api';

const Home = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load games and accounts from database
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Loading home page data from database...');

        // Check server health first
        try {
          const healthResponse = await healthAPI.check();
          console.log('🏥 Server health:', healthResponse);
        } catch (healthError) {
          console.warn('⚠️ Server health check failed:', healthError);
          // Continue anyway, might be a network issue
        }

        // Load games from database
        const gamesResponse = await gamesAPI.getAll();
        console.log('🎮 Games response:', gamesResponse);

        if (!gamesResponse.success) {
          throw new Error('Failed to load games');
        }

        // Load available game accounts from database
        const accountsResponse = await gameAccountsAPI.getAll({ isAvailable: 'true' });
        console.log('🎯 Accounts response:', accountsResponse);

        if (!accountsResponse.success) {
          throw new Error('Failed to load game accounts');
        }

        const games = gamesResponse.games || [];
        const accounts = accountsResponse.accounts || [];

        // Count available accounts per game
        const gameCounts = games.map(game => ({
          ...game,
          accounts: accounts.filter(acc => acc.game_id === game.id).length,
          image: `/images/games/${game.code?.toLowerCase() || 'default'}.jpg`
        }));

        setFeaturedGames(gameCounts);

        // Get recent accounts (max 3)
        const sortedAccounts = [...accounts]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .map(acc => {
            const game = games.find(g => g.id === acc.game_id);
            return {
              ...acc,
              game: game ? game.name : 'Unknown Game',
              gameCode: game ? game.code : 'DEFAULT',
              image: `/images/games/${game?.code?.toLowerCase() || 'default'}.jpg`,
              // Parse price to remove ' ETH' suffix for calculations
              priceValue: parseFloat(acc.price.replace(' ETH', ''))
            };
          });

        setRecentAccounts(sortedAccounts);
        console.log('✅ Home data loaded successfully');

      } catch (error) {
        console.error('❌ Error loading home data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleBuyNow = (account) => {
    navigate(isAuthenticated ? '/marketplace' : '/login', {
      state: { selectedAccountId: account.id }
    });
  };

  const formatPrice = (priceValue) => {
    return {
      eth: `${priceValue} ETH`,
      idr: `Rp ${(priceValue * 50000000).toLocaleString('id-ID')}`
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Jual Beli Akun Game Terpercaya</h1>
          <p className="text-xl mb-4">Platform marketplace dengan sistem escrow blockchain untuk keamanan maksimal</p>
          <p className="text-lg mb-8 text-blue-100">✅ Transaksi Aman • 🔒 Escrow Protection • ⚡ Pembayaran Crypto</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              🛒 Jelajahi Marketplace
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/sell' : '/login')}
              className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
            >
              💰 Mulai Jual Akun
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-600">{featuredGames.reduce((sum, game) => sum + game.accounts, 0)}</div>
              <div className="text-gray-600">Akun Tersedia</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-600">{featuredGames.length}</div>
              <div className="text-gray-600">Game Populer</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-gray-600">Keamanan Escrow</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Cards */}
      <section className="py-12 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Game Populer</h2>
        {featuredGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredGames.map(game => (
              <div key={game.id} 
                onClick={() => navigate(`/marketplace?game=${game.id}`)}
                className="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition"
              >
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-16 h-16 mx-auto mb-2 rounded object-cover"
                  onError={(e) => {
                    e.target.src = '/images/games/default.jpg';
                  }}
                />
                <h3 className="font-semibold">{game.name}</h3>
                <p className="text-sm text-gray-500">{game.accounts} akun tersedia</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-lg shadow p-8">
            <p className="text-gray-600">Belum ada game yang tersedia</p>
          </div>
        )}
      </section>

      {/* Recent Accounts */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Akun Terbaru</h2>
          
          {recentAccounts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {recentAccounts.map(account => {
                const price = formatPrice(account.priceValue);
                return (
                  <div key={account.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <img 
                          src={account.image} 
                          alt={account.game} 
                          className="w-12 h-12 rounded mr-3 object-cover"
                          onError={(e) => {
                            e.target.src = '/images/games/default.jpg';
                          }}
                        />
                        <div>
                          <h3 className="font-semibold">{account.title}</h3>
                          <p className="text-sm text-gray-500">{account.game}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <p><span className="font-medium">Rank:</span> {account.rank || 'N/A'}</p>
                        <p><span className="font-medium">Level:</span> {account.level || 'N/A'}</p>
                        <p><span className="font-medium">Status:</span> 
                          <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            Tersedia
                          </span>
                        </p>
                      </div>

                      <div className="border-t pt-3">
                        <div className="mb-3">
                          <span className="text-xl font-bold text-blue-600">{price.eth}</span>
                          <p className="text-sm text-gray-500">{price.idr}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBuyNow(account)}
                            className={`flex-1 py-2 rounded-lg transition ${
                              isAuthenticated 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                          >
                            {isAuthenticated ? 'Beli Sekarang' : 'Login untuk Beli'}
                          </button>
                          <button
                            onClick={() => navigate('/marketplace', { state: { viewAccountId: account.id } })}
                            className="py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cara Kerja Platform Escrow</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Pilih & Beli</h3>
              <p className="text-gray-600">Pilih akun game yang diinginkan dan lakukan pembayaran dengan cryptocurrency (ETH)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Escrow Protection</h3>
              <p className="text-gray-600">Dana Anda diamankan dalam smart contract escrow hingga akun berhasil diterima</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Konfirmasi & Selesai</h3>
              <p className="text-gray-600">Setelah menerima akun, konfirmasi transaksi dan dana akan dirilis ke penjual</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Mengapa Pilih Platform Kami?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-3">Keamanan Blockchain</h3>
              <p className="text-gray-600">Sistem escrow berbasis smart contract Ethereum untuk keamanan maksimal</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Transaksi Cepat</h3>
              <p className="text-gray-600">Proses pembayaran dan transfer akun yang cepat dengan konfirmasi real-time</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-3">Perlindungan Buyer</h3>
              <p className="text-gray-600">Dana dikembalikan 100% jika akun tidak sesuai deskripsi atau bermasalah</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-3">Akun Berkualitas</h3>
              <p className="text-gray-600">Semua akun diverifikasi dan dijamin keasliannya oleh sistem kami</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Global Access</h3>
              <p className="text-gray-600">Dapat diakses dari seluruh dunia dengan dukungan multiple cryptocurrency</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-xl font-semibold mb-3">Support 24/7</h3>
              <p className="text-gray-600">Tim support siap membantu Anda kapan saja untuk menyelesaikan masalah</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;