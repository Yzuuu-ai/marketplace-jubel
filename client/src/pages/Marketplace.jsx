// src/pages/Marketplace.jsx - Enhanced dengan Search & Filter System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BlockchainPaymentSystem from '../components/BlockchainPaymentSystem';
import SuccessModal from '../components/SuccessModal';
import AccountDetailModal from '../components/AccountDetailModal';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';



// Data game untuk filter
const gameList = [
  { id: 1, name: 'Mobile Legends', code: 'ML', category: 'MOBA' },
  { id: 2, name: 'PUBG Mobile', code: 'PUBG', category: 'Battle Royale' },
  { id: 3, name: 'Free Fire', code: 'FF', category: 'Battle Royale' },
  { id: 4, name: 'Genshin Impact', code: 'GI', category: 'RPG' },
];

// Opsi sorting
const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
  LEVEL_LOW: 'level_low',
  LEVEL_HIGH: 'level_high',
  POPULAR: 'popular',
  SELLER_RATING: 'seller_rating'
};

const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: 'Terbaru',
  [SORT_OPTIONS.OLDEST]: 'Terlama',
  [SORT_OPTIONS.PRICE_LOW]: 'Harga Terendah',
  [SORT_OPTIONS.PRICE_HIGH]: 'Harga Tertinggi',
  [SORT_OPTIONS.LEVEL_LOW]: 'Level Terendah',
  [SORT_OPTIONS.LEVEL_HIGH]: 'Level Tertinggi',
  [SORT_OPTIONS.POPULAR]: 'Terpopuler',
  [SORT_OPTIONS.SELLER_RATING]: 'Rating Penjual'
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [levelRange, setLevelRange] = useState({ min: '', max: '' });
  const [selectedRank, setSelectedRank] = useState('all');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' atau 'list'
  
  // State untuk akun dan transaksi
  const [allAccounts, setAllAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Rank options berdasarkan game
  const rankOptions = {
    1: ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythic Glory'],
    2: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
    3: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'],
    4: ['Adventure Rank 1-20', 'Adventure Rank 21-40', 'Adventure Rank 41-60']
  };

  // Get game account data dengan seller profiles dan stats
  const getGameAccounts = useCallback(() => {
    try {
      const savedAccounts = localStorage.getItem('gameAccounts');
      const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
      const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      
      // Enhance account data dengan seller profile dan stats
      return accounts.map(account => {
        const sellerProfile = userProfiles[account.sellerWallet];
        
        // Simulasi view count dan rating (dalam production dari database)
        const viewCount = Math.floor(Math.random() * 1000) + 100;
        const sellerRating = (Math.random() * 2 + 3).toFixed(1); // Rating 3.0 - 5.0
        const reviewCount = Math.floor(Math.random() * 50) + 5;
        
        return {
          ...account,
          sellerName: sellerProfile?.nama || account.sellerName || `Seller-${account.sellerWallet.substring(0, 6)}`,
          viewCount,
          sellerRating: parseFloat(sellerRating),
          reviewCount,
          createdAt: account.createdAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      });
    } catch (error) {
      console.error('Error parsing game accounts:', error);
      return [];
    }
  }, []);

  // Load accounts
  useEffect(() => {
    setIsLoading(true);
    const accounts = getGameAccounts();
    const availableAccounts = accounts.filter(account => 
      !account.isSold && !account.isInEscrow
    );
    setAllAccounts(availableAccounts);
    setIsLoading(false);
  }, [getGameAccounts]);

  // Advanced filter function
  const applyFilters = useCallback(() => {
    let filtered = [...allAccounts];

    // 1. Search filter (judul, game, deskripsi, seller)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(account => 
        account.title.toLowerCase().includes(searchLower) ||
        account.description?.toLowerCase().includes(searchLower) ||
        account.sellerName.toLowerCase().includes(searchLower) ||
        gameList.find(g => g.id === account.gameId)?.name.toLowerCase().includes(searchLower)
      );
    }

    // 2. Game filter
    if (selectedGame !== 0) {
      filtered = filtered.filter(account => account.gameId === selectedGame);
    }

    // 3. Category filter
    if (selectedCategory !== 'all') {
      const gamesInCategory = gameList.filter(g => g.category === selectedCategory);
      const gameIds = gamesInCategory.map(g => g.id);
      filtered = filtered.filter(account => gameIds.includes(account.gameId));
    }

    // 4. Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(account => {
        const price = parseFloat(account.price.replace(' ETH', ''));
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // 5. Level range filter
    if (levelRange.min || levelRange.max) {
      filtered = filtered.filter(account => {
        const level = parseInt(account.level) || 0;
        const minLevel = levelRange.min ? parseInt(levelRange.min) : 0;
        const maxLevel = levelRange.max ? parseInt(levelRange.max) : Infinity;
        return level >= minLevel && level <= maxLevel;
      });
    }

    // 6. Rank filter
    if (selectedRank !== 'all' && selectedGame !== 0) {
      filtered = filtered.filter(account => account.rank === selectedRank);
    }

    // 7. Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.NEWEST:
          return new Date(b.createdAt) - new Date(a.createdAt);
        case SORT_OPTIONS.OLDEST:
          return new Date(a.createdAt) - new Date(b.createdAt);
        case SORT_OPTIONS.PRICE_LOW:
          return parseFloat(a.price.replace(' ETH', '')) - parseFloat(b.price.replace(' ETH', ''));
        case SORT_OPTIONS.PRICE_HIGH:
          return parseFloat(b.price.replace(' ETH', '')) - parseFloat(a.price.replace(' ETH', ''));
        case SORT_OPTIONS.LEVEL_LOW:
          return (parseInt(a.level) || 0) - (parseInt(b.level) || 0);
        case SORT_OPTIONS.LEVEL_HIGH:
          return (parseInt(b.level) || 0) - (parseInt(a.level) || 0);
        case SORT_OPTIONS.POPULAR:
          return b.viewCount - a.viewCount;
        case SORT_OPTIONS.SELLER_RATING:
          return b.sellerRating - a.sellerRating;
        default:
          return 0;
      }
    });

    setFilteredAccounts(filtered);
  }, [allAccounts, searchTerm, selectedGame, selectedCategory, priceRange, levelRange, selectedRank, sortBy]);

  // Apply filters setiap kali ada perubahan
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle search dengan debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, applyFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedGame(0);
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setLevelRange({ min: '', max: '' });
    setSelectedRank('all');
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
      
      setSuccessMessage(`Pembayaran blockchain berhasil! ID Escrow: ${escrowTransaction.id} Hash Transaksi: ${paymentData.transactionHash}`);
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
      idr: `≈ Rp ${idr}`
    };
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(gameList.map(g => g.category))];
    return ['all', ...uniqueCategories];
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedGame !== 0) count++;
    if (selectedCategory !== 'all') count++;
    if (priceRange.min || priceRange.max) count++;
    if (levelRange.min || levelRange.max) count++;
    if (selectedRank !== 'all') count++;
    return count;
  }, [searchTerm, selectedGame, selectedCategory, priceRange, levelRange, selectedRank]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Marketplace Akun Game</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Temukan akun game premium dengan sistem pembayaran blockchain yang aman
          </p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="sticky top-0 z-40 bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari akun game, seller, atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border ${
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
                className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:shadow-md transition"
              >
                <option value="">Urutkan</option>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Pencarian: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {selectedGame !== 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {gameList.find(g => g.id === selectedGame)?.name}
                  <button onClick={() => setSelectedGame(0)} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Harga: {priceRange.min || '0'} - {priceRange.max || '∞'} ETH
                  <button onClick={() => setPriceRange({ min: '', max: '' })} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Hapus semua filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Filter Panel */}
      {showFilters && (
        <section className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Game Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Semua Game</option>
                  {gameList.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'Semua Kategori' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Range Harga (ETH)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="py-2">-</span>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Level Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Range Level</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={levelRange.min}
                    onChange={(e) => setLevelRange({ ...levelRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="py-2">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={levelRange.max}
                    onChange={(e) => setLevelRange({ ...levelRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rank Filter (if game selected) */}
              {selectedGame !== 0 && rankOptions[selectedGame] && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
                  <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Semua Rank</option>
                    {rankOptions[selectedGame].map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={clearAllFilters}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results Count & Stats */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {filteredAccounts.length} Akun Ditemukan
              </h2>
              <p className="text-sm text-gray-600">
                dari total {allAccounts.length} akun tersedia
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-gray-600">Escrow Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⟠</span>
                <span className="text-gray-600">Blockchain</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
         {isLoading ? (
           <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
           </div>
         ) : filteredAccounts.length > 0 ? (
           <>
             {/* Accounts Grid/List */}
             {viewMode === 'grid' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
               <div className="space-y-4">
                 {filteredAccounts.map((account) => (
                   <AccountListItem
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
             )}
           </>
         ) : (
           /* Empty State */
           <div className="text-center py-20">
             <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
               <div className="text-6xl mb-6">🔍</div>
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

     {/* Footer */}
<footer className="bg-gray-900 text-white mt-16">
  <div className="max-w-7xl mx-auto px-4 py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4">GameMarket</h3>
        <p className="text-gray-400 text-sm">
          Platform jual beli akun game terpercaya dengan teknologi blockchain
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>
            <button 
              onClick={() => navigate('/help')} 
              className="hover:text-white transition-colors text-left"
            >
              Cara Membeli
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/help')} 
              className="hover:text-white transition-colors text-left"
            >
              Cara Menjual
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/faq')} 
              className="hover:text-white transition-colors text-left"
            >
              FAQ
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('/contact')} 
              className="hover:text-white transition-colors text-left"
            >
              Kontak
            </button>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Game Populer</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          {gameList.map(game => (
            <li key={game.id}>
              <button
                onClick={() => {
                  setSelectedGame(game.id);
                  window.scrollTo(0, 0);
                }}
                className="hover:text-white transition-colors text-left"
              >
                {game.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Ikuti Kami</h4>
        <div className="flex gap-4">
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
      </div>
    </div>
    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
      <p>&copy; 2025 GameMarket. Hak cipta dilindungi. | Didukung oleh Ethereum Blockchain</p>
    </div>
  </div>
</footer>
   </div>
 );
};

// Account Card Component (Grid View)
const AccountCard = ({ account, gameList, onBuy, onViewDetail, formatPriceDisplay, isAuthenticated }) => {
 const game = gameList.find(g => g.id === account.gameId);
 const priceDisplay = formatPriceDisplay(account.price);


 return (
   <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1 group">
     {/* Image Section */}
     <div className="relative h-48 overflow-hidden">
       <img
         src={account.image || 'https://via.placeholder.com/300x200?text=No+Image'}
         alt={account.title}
         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
         onError={(e) => {
           e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
         }}
       />
       
       {/* Badges */}
       <div className="absolute top-2 left-2 flex flex-wrap gap-2">
         {account.level && (
           <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
             Lv. {account.level}
           </span>
         )}
         {account.rank && (
           <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
             {account.rank}
           </span>
         )}
       </div>

       {/* View Count */}
       <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
         </svg>
         {account.viewCount}
       </div>

       {/* Quick View Button */}
       <button
         onClick={() => onViewDetail(account)}
         className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100"
       >
         <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium">
           Lihat Detail
         </span>
       </button>
     </div>

     {/* Content Section */}
     <div className="p-4">
       {/* Title & Game */}
       <div className="mb-3">
         <h3 className="font-semibold text-gray-800 text-lg line-clamp-1">{account.title}</h3>
         <p className="text-sm text-gray-600">{game?.name || 'Unknown Game'}</p>
       </div>

       {/* Price */}
       <div className="mb-3">
         <p className="text-xl font-bold text-blue-600">{priceDisplay.eth}</p>
         <p className="text-sm text-gray-500">{priceDisplay.idr}</p>
       </div>

       {/* Seller Info */}
       <div className="flex items-center justify-between mb-4 pb-4 border-b">
         <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
             <span className="text-white text-xs font-bold">
               {account.sellerName?.charAt(0).toUpperCase() || 'S'}
             </span>
           </div>
           <span className="text-sm text-gray-700">{account.sellerName}</span>
         </div>
         <div className="flex items-center gap-1">
           <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
           </svg>
           <span className="text-sm text-gray-600">{account.sellerRating}</span>
           <span className="text-xs text-gray-500">({account.reviewCount})</span>
         </div>
       </div>

       {/* Description */}
       {account.description && (
         <p className="text-sm text-gray-600 line-clamp-2 mb-4">
           {account.description}
         </p>
       )}

       {/* Action Buttons */}
       <div className="flex gap-2">
         <button
           onClick={() => onBuy(account)}
           className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
             isAuthenticated
               ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
               : 'bg-gray-400 text-white cursor-not-allowed'
           }`}
           disabled={!isAuthenticated}
         >
           {isAuthenticated ? '⟠ Beli Sekarang' : 'Login untuk Beli'}
         </button>
       </div>

       {/* Security Badge */}
       <div className="mt-3 flex justify-center">
         <span className="text-xs text-gray-500 flex items-center gap-1">
           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
           </svg>
           Dilindungi Escrow
         </span>
       </div>
     </div>
   </div>
 );
};

// Account List Item Component (List View)
const AccountListItem = ({ account, gameList, onBuy, onViewDetail, formatPriceDisplay, isAuthenticated }) => {
 const game = gameList.find(g => g.id === account.gameId);
 const priceDisplay = formatPriceDisplay(account.price);

 return (
   <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
     <div className="flex flex-col lg:flex-row gap-6">
       {/* Image */}
       <div className="lg:w-48 h-48 lg:h-32 rounded-lg overflow-hidden flex-shrink-0">
         <img
           src={account.image || 'https://via.placeholder.com/200x150?text=No+Image'}
           alt={account.title}
           className="w-full h-full object-cover"
           onError={(e) => {
             e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
           }}
         />
       </div>

       {/* Content */}
       <div className="flex-1">
         <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
           {/* Info Section */}
           <div className="flex-1">
             <div className="mb-2">
               <h3 className="text-xl font-semibold text-gray-800">{account.title}</h3>
               <p className="text-gray-600">{game?.name || 'Unknown Game'}</p>
             </div>

             {/* Stats */}
             <div className="flex flex-wrap gap-4 mb-3 text-sm">
               {account.level && (
                 <div className="flex items-center gap-1">
                   <span className="text-gray-500">Level:</span>
                   <span className="font-medium text-blue-600">{account.level}</span>
                 </div>
               )}
               {account.rank && (
                 <div className="flex items-center gap-1">
                   <span className="text-gray-500">Rank:</span>
                   <span className="font-medium text-purple-600">{account.rank}</span>
                 </div>
               )}
               <div className="flex items-center gap-1">
                 <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                   <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                 </svg>
                 <span className="text-gray-500">{account.viewCount} views</span>
               </div>
             </div>

             {/* Description */}
             {account.description && (
               <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                 {account.description}
               </p>
             )}

             {/* Seller Info */}
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-sm font-bold">
                     {account.sellerName?.charAt(0).toUpperCase() || 'S'}
                   </span>
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-700">{account.sellerName}</p>
                   <div className="flex items-center gap-1">
                     <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                     <span className="text-xs text-gray-600">{account.sellerRating} ({account.reviewCount})</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Price & Actions */}
           <div className="lg:text-right">
             <div className="mb-4">
               <p className="text-2xl font-bold text-blue-600">{priceDisplay.eth}</p>
               <p className="text-gray-500">{priceDisplay.idr}</p>
             </div>

             <div className="flex flex-col gap-2">
               <button
                 onClick={() => onBuy(account)}
                 className={`px-6 py-3 rounded-lg font-medium transition ${
                   isAuthenticated
                     ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                     : 'bg-gray-400 text-white cursor-not-allowed'
                 }`}
                 disabled={!isAuthenticated}
               >
                 {isAuthenticated ? '⟠ Beli Sekarang' : 'Login untuk Beli'}
               </button>
               <button
                 onClick={() => onViewDetail(account)}
                 className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
               >
                 Lihat Detail
               </button>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default Marketplace;