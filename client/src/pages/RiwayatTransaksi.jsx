import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// Transaction types
const TRANSACTION_TYPES = {
  PURCHASE: 'pembelian',
  SALE: 'penjualan'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'selesai',
  FAILED: 'gagal',
  CANCELLED: 'dibatalkan'
};

// Using status from ORDER_STATUS for mapping
const ORDER_STATUS = {
  CART: 'keranjang',
  ORDER: 'pesanan', 
  FAILED: 'gagal',
  COMPLETED: 'selesai'
};

const STATUS_LABELS = {
  [TRANSACTION_STATUS.PENDING]: 'Pending',
  [TRANSACTION_STATUS.COMPLETED]: 'Selesai',
  [TRANSACTION_STATUS.FAILED]: 'Gagal',
  [TRANSACTION_STATUS.CANCELLED]: 'Dibatalkan'
};

const STATUS_COLORS = {
  [TRANSACTION_STATUS.PENDING]: 'bg-yellow-500',
  [TRANSACTION_STATUS.COMPLETED]: 'bg-green-500',
  [TRANSACTION_STATUS.FAILED]: 'bg-red-500',
  [TRANSACTION_STATUS.CANCELLED]: 'bg-gray-500'
};

const STATUS_ICONS = {
  [TRANSACTION_STATUS.PENDING]: '⏳',
  [TRANSACTION_STATUS.COMPLETED]: '✅',
  [TRANSACTION_STATUS.FAILED]: '❌',
  [TRANSACTION_STATUS.CANCELLED]: '🚫'
};

const TYPE_ICONS = {
  [TRANSACTION_TYPES.PURCHASE]: '🛒',
  [TRANSACTION_TYPES.SALE]: '💰'
};

const TYPE_COLORS = {
  [TRANSACTION_TYPES.PURCHASE]: 'text-blue-600',
  [TRANSACTION_TYPES.SALE]: 'text-green-600'
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount, currency = 'IDR') => {
  if (currency === 'IDR') {
    return `Rp ${parseInt(amount).toLocaleString('id-ID')}`;
  }
  return amount;
};

// Convert order status to transaction status with improved logic
const mapOrderStatusToTransactionStatus = (order) => {
  if (order.status === ORDER_STATUS.COMPLETED) {
    return TRANSACTION_STATUS.COMPLETED;
  }
  
  if (order.status === ORDER_STATUS.FAILED) {
    return TRANSACTION_STATUS.FAILED;
  }
  
  // Check if order has transaction hash (assume completed if has hash)
  if (order.transactionHash) {
    return TRANSACTION_STATUS.COMPLETED;
  }
  
  // Check if order is expired (older than 15 minutes)
  const orderAge = Date.now() - (order.createdAt || Date.now());
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  
  if (orderAge > FIFTEEN_MINUTES) {
    return TRANSACTION_STATUS.FAILED;
  }
  
  return TRANSACTION_STATUS.PENDING;
};

// Convert orders to transactions with improved status handling
const convertOrdersToTransactions = (orders) => {
  return orders
    .filter(order => order.status !== ORDER_STATUS.CART) // Exclude cart items
    .map(order => {
      const basePrice = parseFloat(order.originalPrice?.toString().replace(/[^\d.]/g, '') || 
                       parseFloat(order.price?.toString().replace(/[^\d.]/g, '') || 0));
      
      const status = mapOrderStatusToTransactionStatus(order);
      const isCompleted = status === TRANSACTION_STATUS.COMPLETED;
      const isFailed = status === TRANSACTION_STATUS.FAILED;
      
      return {
        id: order.id,
        type: TRANSACTION_TYPES.PURCHASE, // Assuming all orders are purchases
        status,
        itemTitle: order.title,
        gameName: order.gameName,
        price: order.price,
        priceIDR: order.totalPriceIDR ? parseFloat(order.totalPriceIDR) : basePrice,
        sellerName: order.sellerName || 'Penjual',
        buyerName: 'Anda', // Current user is always the buyer
        paymentMethod: order.paymentMethod || 'Ethereum (ETH)',
        transactionHash: order.transactionHash || null,
        networkFee: order.gasFee ? `${order.gasFee} ETH` : '0.000050 ETH',
        totalAmount: order.totalPriceETH ? `${order.totalPriceETH} ETH` : order.price,
        createdAt: order.createdAt || Date.now(),
        completedAt: isCompleted ? (order.completedAt || order.createdAt) : null,
        failedAt: isFailed ? (order.failedAt || order.createdAt) : null,
        failureReason: isFailed ? (order.failureReason || 'Waktu pembayaran habis') : null,
        image: order.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
        // Additional order specific data
        level: order.level,
        rank: order.rank,
        description: order.description,
        paymentAddress: order.paymentAddress,
        paymentNetwork: order.paymentNetwork,
        minConfirmations: order.minConfirmations
      };
    });
};

// TransactionDetailModal component remains the same
const TransactionDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Detail Transaksi</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{TYPE_ICONS[transaction.type]}</span>
                <span className={`font-semibold capitalize ${TYPE_COLORS[transaction.type]}`}>
                  {transaction.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${STATUS_COLORS[transaction.status]}`}>
                  {STATUS_ICONS[transaction.status]} {STATUS_LABELS[transaction.status]}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Transaction ID */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-medium text-gray-600 mb-1">ID Transaksi</p>
            <p className="font-mono text-sm text-gray-800">{transaction.id}</p>
          </div>

          {/* Item Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Detail Item</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={transaction.image} 
                    alt={transaction.itemTitle}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{transaction.itemTitle}</p>
                    <p className="text-sm text-gray-600">{transaction.gameName}</p>
                    {transaction.level && (
                      <p className="text-sm text-gray-600">Level: {transaction.level}</p>
                    )}
                    {transaction.rank && (
                      <p className="text-sm text-gray-600">Rank: {transaction.rank}</p>
                    )}
                  </div>
                </div>
                {transaction.description && (
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Informasi Pihak</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Penjual</p>
                  <p className="text-gray-800">{transaction.sellerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pembeli</p>
                  <p className="text-gray-800">{transaction.buyerName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Detail Pembayaran</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Item:</span>
                  <span className="font-medium">{transaction.price}</span>
                </div>
                {transaction.priceIDR && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dalam IDR:</span>
                    <span className="font-medium">{formatCurrency(transaction.priceIDR)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee:</span>
                  <span className="font-medium">{transaction.networkFee}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{transaction.totalAmount}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Metode Pembayaran</p>
                  <p className="text-gray-800">{transaction.paymentMethod}</p>
                </div>
                {transaction.paymentNetwork && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network</p>
                    <p className="text-gray-800">{transaction.paymentNetwork}</p>
                  </div>
                )}
                {transaction.paymentAddress && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Address</p>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {transaction.paymentAddress}
                    </p>
                  </div>
                )}
                {transaction.transactionHash && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transaction Hash</p>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {transaction.transactionHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Timeline Transaksi</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-800">Transaksi Dibuat</p>
                  <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                </div>
              </div>
              
              {transaction.completedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-800">Transaksi Selesai</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.completedAt)}</p>
                  </div>
                </div>
              )}
              
              {transaction.failedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-800">Transaksi Gagal</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.failedAt)}</p>
                    {transaction.failureReason && (
                      <p className="text-sm text-red-600">Alasan: {transaction.failureReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {transaction.transactionHash && (
              <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Lihat di Blockchain
              </button>
            )}
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// TransactionCard component remains the same
const TransactionCard = ({ transaction, onClick }) => {
  const isPurchase = transaction.type === TRANSACTION_TYPES.PURCHASE;
  
  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={transaction.image} 
                alt={transaction.itemTitle}
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
              <div className="absolute -top-2 -right-2 text-2xl">
                {TYPE_ICONS[transaction.type]}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">
                {transaction.itemTitle}
              </h3>
              <p className="text-gray-500 text-sm">{transaction.gameName}</p>
              <p className={`font-semibold ${TYPE_COLORS[transaction.type]}`}>
                {transaction.price}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${STATUS_COLORS[transaction.status]}`}>
            {STATUS_ICONS[transaction.status]}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {isPurchase ? 'Penjual:' : 'Pembeli:'}
            </span>
            <span className="font-medium">
              {isPurchase ? transaction.sellerName : transaction.buyerName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tanggal:</span>
            <span className="font-medium">{formatDate(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              transaction.status === TRANSACTION_STATUS.COMPLETED ? 'text-green-600' :
              transaction.status === TRANSACTION_STATUS.FAILED ? 'text-red-600' :
              transaction.status === TRANSACTION_STATUS.PENDING ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {STATUS_LABELS[transaction.status]}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
            <span className="font-bold text-lg text-blue-600">
              {transaction.totalAmount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RiwayatTransaksi = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load transactions from orders data
    const loadTransactions = () => {
      try {
        // Get orders from localStorage
        const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Convert orders to transactions with improved status handling
        const transactionsFromOrders = convertOrdersToTransactions(storedOrders);
        
        // Sort by date (newest first)
        transactionsFromOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setTransactions(transactionsFromOrders);
        
        // Update localStorage with clean transactions
        localStorage.setItem('transactions', JSON.stringify(transactionsFromOrders));
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    };

    loadTransactions();

    // Listen for storage changes (when orders are updated)
    const handleStorageChange = (e) => {
      if (e.key === 'orders') {
        loadTransactions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesSearch = transaction.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.gameName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate transaction statistics
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.COMPLETED).length;
  const failedTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.FAILED).length;
  const pendingTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.PENDING).length;

  // Status tabs for responsive filtering
  const statusTabs = [
    { id: 'all', label: 'Semua', count: totalTransactions },
    { id: TRANSACTION_STATUS.PENDING, label: 'Pending', count: pendingTransactions },
    { id: TRANSACTION_STATUS.COMPLETED, label: 'Selesai', count: completedTransactions },
    { id: TRANSACTION_STATUS.FAILED, label: 'Gagal', count: failedTransactions },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Riwayat Transaksi</h1>
            <p className="text-gray-600">Pantau semua aktivitas pembelian dan penjualan Anda</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Transaksi</p>
                  <p className="text-3xl font-bold text-gray-800">{totalTransactions}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Transaksi Selesai</p>
                  <p className="text-3xl font-bold text-green-600">{completedTransactions}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Transaksi Gagal</p>
                  <p className="text-3xl font-bold text-red-600">{failedTransactions}</p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </div>
          </div>

          {/* Responsive Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Search Input */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Type Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Transaksi
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Tipe</option>
                  <option value={TRANSACTION_TYPES.PURCHASE}>Pembelian</option>
                  <option value={TRANSACTION_TYPES.SALE}>Penjualan</option>
                </select>
              </div>
              
              {/* Status Filter Tabs */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Transaksi
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterStatus(tab.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        filterStatus === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label} <span className="ml-1">({tab.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Grid */}
          {filteredTransactions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => setSelectedTransaction(transaction)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                <div className="text-6xl mb-6">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Tidak Ada Transaksi
                </h3>
                <p className="text-gray-500">
                  {transactions.length === 0 
                    ? "Belum ada transaksi yang dilakukan"
                    : "Tidak ada transaksi yang sesuai dengan filter yang dipilih"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default RiwayatTransaksi;