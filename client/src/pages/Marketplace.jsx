// src/pages/Marketplace.jsx - Database Connected Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BlockchainPaymentSystem from '../components/BlockchainPaymentSystem';
import SuccessModal from '../components/SuccessModal';
import AccountDetailModal from '../components/AccountDetailModal';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { gamesAPI, gameAccountsAPI } from '../services/api';


// Opsi sorting
const SORT_OPTIONS = {
  NEWEST: 'newest',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high'
};

const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: 'Terbaru',
  [SORT_OPTIONS.PRICE_LOW]: 'Harga Terendah',
  [SORT_OPTIONS.PRICE_HIGH]: 'Harga Tertinggi'
};

// Generate unique ID for orders
const generateOrderId = () => {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const gameIdParam = queryParams.get('game');
  
  // State untuk filter dan search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(gameIdParam ? parseInt(gameIdParam) : 0);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [showFilters, setShowFilters] = useState(false);
  
  // State untuk akun dan transaksi
  const [allAccounts, setAllAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameList, setGameList] = useState([]);
  const [error, setError] = useState(null);
  
  // State untuk modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);
  
  const { isAuthenticated, walletAddress } = useAuth();
  const { createEscrowTransaction } = useAdmin();

  // Load games from database
  const loadGames = useCallback(async () => {
    try {
      const response = await gamesAPI.getAll();
      if (response.success) {
        setGameList(response.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setError('Failed to load games');
    }
  }, []);

  // Load game accounts from database
  const loadGameAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await gameAccountsAPI.getAll({ isAvailable: true });
      
      if (response.success) {
        // Transform database data to match component expectations
        const transformedAccounts = response.accounts.map(account => ({
          id: account.id,
          gameId: account.game_id,
          title: account.title,
          level: account.level,
          rank: account.rank,
          price: account.price, // Already formatted as "X ETH"
          description: account.description,
          images: account.images || [],
          image: account.images && account.images.length > 0 ? account.images[0] : null,
          sellerWallet: account.seller_wallet,
          sellerName: account.seller_name || `Seller-${account.seller_wallet.substring(0, 6)}`,
          contactType: account.contact_type,
          contactValue: account.contact_value,
          createdAt: account.created_at,
          isSold: account.is_sold,
          isInEscrow: account.is_in_escrow,
          gameName: account.game_name
        }));
        
        setAllAccounts(transformedAccounts);
      } else {
        setError('Failed to load accounts');
        setAllAccounts([]);
      }
    } catch (error) {
      console.error('Error loading game accounts:', error);
      setError('Failed to load accounts: ' + error.message);
      setAllAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadGames();
    loadGameAccounts();
  }, [loadGames, loadGameAccounts]);

  // Filter function
  const applyFilters = useCallback(() => {
    let filtered = [...allAccounts];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(account => 
        account.title.toLowerCase().includes(searchLower) ||
        account.description?.toLowerCase().includes(searchLower) ||
        account.sellerName.toLowerCase().includes(searchLower) ||
        gameList.find(g => g.id === account.gameId)?.name.toLowerCase().includes(searchLower)
      );
    }

    // Game filter
    if (selectedGame !== 0) {
      filtered = filtered.filter(account => account.gameId === selectedGame);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(account => {
        const price = parseFloat(account.price.replace(' ETH', ''));
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.NEWEST:
          return new Date(b.createdAt) - new Date(a.createdAt);
        case SORT_OPTIONS.PRICE_LOW:
          return parseFloat(a.price.replace(' ETH', '')) - parseFloat(b.price.replace(' ETH', ''));
        case SORT_OPTIONS.PRICE_HIGH:
          return parseFloat(b.price.replace(' ETH', '')) - parseFloat(a.price.replace(' ETH', ''));
        default:
          return 0;
      }
    });

    setFilteredAccounts(filtered);
  }, [allAccounts, searchTerm, selectedGame, priceRange, sortBy]);

  // Apply filters setiap kali ada perubahan
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedGame(0);
    setPriceRange({ min: '', max: '' });
    setSortBy(SORT_OPTIONS.NEWEST);
  };

  // Handle buy button click
  const handleBuyClick = useCallback((account) => {
    if (!isAuthenticated) {
      setSuccessMessage('Silakan login terlebih dahulu untuk melakukan pembelian');
      setShowSuccessModal(true);
      return;
    }
    
    const orderData = {
      id: generateOrderId(),
      accountId: account.id,
      title: account.title,
      gameName: gameList.find(g => g.id === account.gameId)?.name || '',
      level: account.level,
      rank: account.rank,
      description: account.description,
      image: account.image,
      sellerWallet: account.sellerWallet,
      sellerName: account.sellerName,
      buyerWallet: walletAddress,
      priceETH: parseFloat(account.price.replace(' ETH', '')),
      totalPriceETH: parseFloat(account.price.replace(' ETH', '')),
      priceIDR: (parseFloat(account.price.replace(' ETH', '')) * 50000000).toFixed(0),
    };
    
    setSelectedAccount(orderData);
    setShowPaymentModal(true);
  }, [isAuthenticated, walletAddress]);

  // Handle payment completion
  const handlePaymentComplete = useCallback((paymentData) => {
    try {
      if (!selectedAccount) return;

      const escrowData = {
        ...selectedAccount,
        paymentHash: paymentData.transactionHash,
        network: paymentData.network,
        paymentStatus: paymentData.status,
        paidAmount: paymentData.amount
      };

      const escrowTransaction = createEscrowTransaction(escrowData);
      
      setShowPaymentModal(false);
      setPaymentResult(paymentData);
      
      setSuccessMessage(`Pembayaran blockchain berhasil! ID Escrow: ${escrowTransaction.id}`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      setSuccessMessage('Pembayaran berhasil tapi terjadi kesalahan dalam membuat escrow. Hubungi admin.');
      setShowSuccessModal(true);
    }
  }, [selectedAccount, createEscrowTransaction]);

  // Handle view detail
  const handleViewDetail = (account) => {
    setDetailAccount(account);
    setShowAccountDetail(true);
  };

  // Format ETH price to display
  const formatPriceDisplay = useCallback((ethPrice) => {
    const eth = parseFloat(ethPrice.replace(' ETH', ''));
    const idr = (eth * 50000000).toLocaleString('id-ID');
    return {
      eth: `${eth} ETH`,
      idr: `Rp ${idr}`
    };
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedGame !== 0) count++;
    if (priceRange.min || priceRange.max) count++;
    return count;
  }, [searchTerm, selectedGame, priceRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Marketplace Akun Game</h1>
          <p className="text-base">Temukan akun game premium dengan sistem pembayaran blockchain yang aman</p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="sticky top-0 z-40 bg-white shadow-md py-3">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari akun game..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border ${
                  showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                } hover:shadow-md transition flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Panel */}
      {showFilters && (
        <section className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Game Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Semua Game</option>
                  {gameList.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (ETH)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="py-2">-</span>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Clear Button */}
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Count */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredAccounts.length} Akun Ditemukan
            </h2>
          </div>

          {/* Loading State */}
          {isLoading ? (
          <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="ml-4 text-gray-600">Memuat akun game...</p>
          </div>
          ) : error ? (
          <div className="text-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-12 max-w-md mx-auto">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-800 mb-2">
          Terjadi Kesalahan
          </h3>
          <p className="text-red-600 mb-6">
          {error}
          </p>
          <button
          onClick={() => {
          setError(null);
          loadGameAccounts();
          }}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
          Coba Lagi
          </button>
          </div>
          </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  gameList={gameList}
                  onBuy={handleBuyClick}
                  onViewDetail={handleViewDetail}
                  formatPriceDisplay={formatPriceDisplay}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Tidak Ada Akun Ditemukan
                </h3>
                <p className="text-gray-500 mb-6">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Reset Semua Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      {showPaymentModal && selectedAccount && (
        <BlockchainPaymentSystem
          order={selectedAccount}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          transactionHash={paymentResult?.transactionHash}
          explorerUrl={paymentResult?.transactionHash ? `https://etherscan.io/tx/${paymentResult.transactionHash}` : null}
          onClose={() => {
            setShowSuccessModal(false);
            setPaymentResult(null);
          }}
          onNavigate={() => navigate('/escrow')}
        />
      )}

      {showAccountDetail && detailAccount && (
        <AccountDetailModal
          account={detailAccount}
          gameList={gameList}
          formatPriceDisplay={formatPriceDisplay}
          isAuthenticated={isAuthenticated}
          onClose={() => {
            setShowAccountDetail(false);
            setDetailAccount(null);
          }}
          onBuy={handleBuyClick}
        />
      )}

      <Footer />
    </div>
  );
};

// Simplified Account Card Component
const AccountCard = ({ account, gameList, onBuy, onViewDetail, formatPriceDisplay, isAuthenticated }) => {
  const game = gameList.find(g => g.id === account.gameId) || { name: account.gameName || 'Unknown Game' };
  const priceDisplay = formatPriceDisplay(account.price);

  // Handle image display
  const getImageSrc = () => {
    if (account.image) return account.image;
    if (account.images && account.images.length > 0) return account.images[0];
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        <img
          src={getImageSrc()}
          alt={account.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {account.level && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Lv. {account.level}
            </span>
          )}
          {account.rank && (
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
              {account.rank}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{account.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{game.name}</p>
        
        {/* Price */}
        <div className="mb-3">
          <p className="text-lg font-bold text-blue-600">{priceDisplay.eth}</p>
          <p className="text-sm text-gray-500">{priceDisplay.idr}</p>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-gray-600">Penjual:</span>
          <span className="font-medium">{account.sellerName}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetail(account)}
            className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
          >
            Detail
          </button>
          <button
            onClick={() => onBuy(account)}
            className={`flex-1 py-2 px-3 rounded font-medium transition text-sm ${
              isAuthenticated
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
          >
            {isAuthenticated ? 'Beli' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;