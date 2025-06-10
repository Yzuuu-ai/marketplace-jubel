import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useAdmin, ESCROW_STATUS } from '../context/AdminContext';

// Transaction types
const TRANSACTION_TYPES = {
  PURCHASE: 'pembelian',
  SALE: 'penjualan'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'selesai',
  FAILED: 'gagal',
  CANCELLED: 'dibatalkan',
  ESCROW: 'escrow'
};

const STATUS_LABELS = {
  [TRANSACTION_STATUS.PENDING]: 'Pending',
  [TRANSACTION_STATUS.COMPLETED]: 'Selesai',
  [TRANSACTION_STATUS.FAILED]: 'Gagal',
  [TRANSACTION_STATUS.CANCELLED]: 'Dibatalkan',
  [TRANSACTION_STATUS.ESCROW]: 'In Escrow'
};

const STATUS_COLORS = {
  [TRANSACTION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TRANSACTION_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [TRANSACTION_STATUS.FAILED]: 'bg-red-100 text-red-800',
  [TRANSACTION_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
  [TRANSACTION_STATUS.ESCROW]: 'bg-purple-100 text-purple-800'
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

// Convert escrow transactions to transaction history format
const convertEscrowToTransactions = (escrowTransactions, walletAddress) => {
  const transactions = [];
  
  escrowTransactions.forEach(escrow => {
    // Create transaction for buyer
    if (escrow.buyerWallet === walletAddress) {
      transactions.push({
        id: `buy_${escrow.id}`,
        type: TRANSACTION_TYPES.PURCHASE,
        status: mapEscrowStatus(escrow.status),
        itemTitle: escrow.accountTitle,
        gameName: escrow.gameName,
        price: `${escrow.priceETH} ETH`,
        priceIDR: parseFloat(escrow.priceIDR),
        sellerName: `Seller-${escrow.sellerWallet.substring(0, 6)}`,
        buyerName: 'You',
        paymentMethod: 'Ethereum (ETH)',
        transactionHash: escrow.paymentHash,
        escrowId: escrow.id,
        escrowStatus: escrow.status,
        totalAmount: `${escrow.priceETH} ETH`,
        createdAt: escrow.createdAt,
        completedAt: escrow.status === ESCROW_STATUS.COMPLETED ? escrow.releasedAt : null,
        image: escrow.accountDetails?.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
        level: escrow.accountDetails?.level,
        rank: escrow.accountDetails?.rank,
        description: escrow.accountDetails?.description,
        timeline: escrow.timeline
      });
    }
    
    // Create transaction for seller
    if (escrow.sellerWallet === walletAddress) {
      transactions.push({
        id: `sell_${escrow.id}`,
        type: TRANSACTION_TYPES.SALE,
        status: mapEscrowStatus(escrow.status),
        itemTitle: escrow.accountTitle,
        gameName: escrow.gameName,
        price: `${escrow.priceETH} ETH`,
        priceIDR: parseFloat(escrow.priceIDR),
        sellerName: 'You',
        buyerName: `Buyer-${escrow.buyerWallet.substring(0, 6)}`,
        paymentMethod: 'Ethereum (ETH)',
        transactionHash: escrow.paymentHash,
        escrowId: escrow.id,
        escrowStatus: escrow.status,
        totalAmount: `${escrow.priceETH} ETH`,
        createdAt: escrow.createdAt,
        completedAt: escrow.status === ESCROW_STATUS.COMPLETED ? escrow.releasedAt : null,
        image: escrow.accountDetails?.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
        level: escrow.accountDetails?.level,
        rank: escrow.accountDetails?.rank,
        description: escrow.accountDetails?.description,
        timeline: escrow.timeline
      });
    }
  });
  
  return transactions;
};

// Map escrow status to transaction status
const mapEscrowStatus = (escrowStatus) => {
  switch (escrowStatus) {
    case ESCROW_STATUS.COMPLETED:
      return TRANSACTION_STATUS.COMPLETED;
    case ESCROW_STATUS.CANCELLED:
    case ESCROW_STATUS.REFUNDED:
      return TRANSACTION_STATUS.CANCELLED;
    case ESCROW_STATUS.DISPUTED:
      return TRANSACTION_STATUS.ESCROW;
    case ESCROW_STATUS.PENDING_PAYMENT:
    case ESCROW_STATUS.PAYMENT_RECEIVED:
    case ESCROW_STATUS.ACCOUNT_DELIVERED:
    case ESCROW_STATUS.BUYER_CONFIRMED:
      return TRANSACTION_STATUS.ESCROW;
    default:
      return TRANSACTION_STATUS.PENDING;
  }
};

// TransactionDetailModal component
const TransactionDetailModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Detail Transaksi</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">ID Transaksi</p>
            <p className="font-mono text-sm">{transaction.id}</p>
          </div>

          <div className="grid gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Detail Item</h3>
              <div className="flex items-center gap-3">
                <img 
                  src={transaction.image} 
                  alt={transaction.itemTitle}
                  className="w-14 h-14 rounded-lg"
                />
                <div>
                  <p className="font-medium">{transaction.itemTitle}</p>
                  <p className="text-sm text-gray-600">{transaction.gameName}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Informasi Pihak</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600">Penjual</p>
                  <p>{transaction.sellerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pembeli</p>
                  <p>{transaction.buyerName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Detail Pembayaran</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Harga:</span>
                <span className="font-medium">{transaction.price}</span>
              </div>
              {transaction.priceIDR && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dalam IDR:</span>
                  <span>{formatCurrency(transaction.priceIDR)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">{transaction.totalAmount}</span>
              </div>
            </div>
          </div>

          {transaction.escrowStatus && (
            <div className="bg-purple-50 p-3 rounded-lg mb-4">
              <h3 className="font-semibold text-purple-800 mb-1">Status Escrow</h3>
              <p className="text-purple-700 text-sm">
                {transaction.escrowStatus === ESCROW_STATUS.PENDING_PAYMENT && 'Menunggu pembayaran'}
                {transaction.escrowStatus === ESCROW_STATUS.PAYMENT_RECEIVED && 'Pembayaran diterima'}
                {transaction.escrowStatus === ESCROW_STATUS.ACCOUNT_DELIVERED && 'Akun telah dikirim'}
                {transaction.escrowStatus === ESCROW_STATUS.BUYER_CONFIRMED && 'Menunggu release dana'}
                {transaction.escrowStatus === ESCROW_STATUS.COMPLETED && 'Transaksi selesai'}
                {transaction.escrowStatus === ESCROW_STATUS.DISPUTED && 'Dalam sengketa'}
                {transaction.escrowStatus === ESCROW_STATUS.REFUNDED && 'Dana dikembalikan'}
                {transaction.escrowStatus === ESCROW_STATUS.CANCELLED && 'Dibatalkan'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {transaction.escrowId && transaction.status === TRANSACTION_STATUS.ESCROW && (
              <button 
                onClick={() => window.location.href = '/escrow'}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm"
              >
                Lihat Escrow
              </button>
            )}
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// TransactionCard component
const TransactionCard = ({ transaction, onClick }) => {
  const isPurchase = transaction.type === TRANSACTION_TYPES.PURCHASE;
  
  return (
    <div 
      className="bg-white rounded-lg border p-4 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <img 
            src={transaction.image} 
            alt={transaction.itemTitle}
            className="w-12 h-12 rounded-lg"
          />
          <div>
            <h3 className="font-bold">{transaction.itemTitle}</h3>
            <p className="text-sm text-gray-600">{transaction.gameName}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[transaction.status]}`}>
          {STATUS_LABELS[transaction.status]}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">
            {isPurchase ? 'Penjual:' : 'Pembeli:'}
          </span>
          <span>
            {isPurchase ? transaction.sellerName : transaction.buyerName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tanggal:</span>
          <span>{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Jumlah:</span>
          <span className="font-medium">{transaction.totalAmount}</span>
        </div>
      </div>
    </div>
  );
};

const RiwayatTransaksi = () => {
  const { walletAddress } = useAuth();
  const { escrowTransactions } = useAdmin();
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTransactions = () => {
      try {
        const escrowTxns = convertEscrowToTransactions(escrowTransactions, walletAddress);
        escrowTxns.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTransactions(escrowTxns);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    };

    loadTransactions();
  }, [escrowTransactions, walletAddress]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesSearch = transaction.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.gameName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === TRANSACTION_STATUS.COMPLETED).length;
  const escrowTransactionsCount = transactions.filter(t => t.status === TRANSACTION_STATUS.ESCROW).length;
  const purchaseTransactions = transactions.filter(t => t.type === TRANSACTION_TYPES.PURCHASE).length;
  const saleTransactions = transactions.filter(t => t.type === TRANSACTION_TYPES.SALE).length;

  const statusTabs = [
    { id: 'all', label: 'Semua', count: totalTransactions },
    { id: TRANSACTION_STATUS.ESCROW, label: 'Escrow', count: escrowTransactionsCount },
    { id: TRANSACTION_STATUS.COMPLETED, label: 'Selesai', count: completedTransactions },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Riwayat Transaksi</h1>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-gray-600 text-sm">Total Transaksi</p>
              <p className="text-xl font-bold">{totalTransactions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-gray-600 text-sm">Selesai</p>
              <p className="text-xl font-bold text-green-600">{completedTransactions}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Tipe Transaksi</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">Semua</option>
                  <option value={TRANSACTION_TYPES.PURCHASE}>Pembelian</option>
                  <option value={TRANSACTION_TYPES.SALE}>Penjualan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Status</label>
                <div className="flex flex-wrap gap-1">
                  {statusTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterStatus(tab.id)}
                      className={`px-3 py-1 rounded text-sm ${
                        filterStatus === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      {tab.label} {tab.count > 0 && `(${tab.count})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => setSelectedTransaction(transaction)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border">
              <p className="text-gray-500">
                {transactions.length === 0 
                  ? "Belum ada transaksi"
                  : "Tidak ditemukan transaksi"
                }
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
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