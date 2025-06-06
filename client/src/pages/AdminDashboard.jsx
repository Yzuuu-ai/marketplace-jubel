// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAdmin, ESCROW_STATUS, ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const EscrowTransactionCard = ({ transaction, onAction }) => {
  const canConfirmPayment = transaction.status === ESCROW_STATUS.PENDING_PAYMENT;
  const canReleaseFunds = transaction.status === ESCROW_STATUS.BUYER_CONFIRMED;
  const isDisputed = transaction.status === ESCROW_STATUS.DISPUTED;
  const isCompleted = transaction.status === ESCROW_STATUS.COMPLETED;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{transaction.accountTitle}</h3>
          <p className="text-gray-600 text-sm">{transaction.gameName}</p>
          <p className="text-blue-600 font-semibold">{transaction.priceETH} ETH</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${ESCROW_STATUS_COLORS[transaction.status]}`}>
          {ESCROW_STATUS_LABELS[transaction.status]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Penjual:</p>
          <p className="font-mono text-xs break-all">{transaction.sellerWallet}</p>
        </div>
        <div>
          <p className="text-gray-600">Pembeli:</p>
          <p className="font-mono text-xs break-all">{transaction.buyerWallet}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">Timeline:</p>
        <div className="space-y-1">
          {transaction.timeline.slice(-2).map((event, index) => (
            <div key={index} className="text-xs text-gray-500">
              {formatDate(event.timestamp)} - {event.note}
            </div>
          ))}
        </div>
      </div>

      {transaction.paymentHash && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Payment Hash:</p>
          <p className="text-xs font-mono text-blue-600 break-all">{transaction.paymentHash}</p>
        </div>
      )}

      {transaction.deliveryProof && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800">Account Delivered:</p>
          <div className="text-xs text-green-600">
            <p><strong>Username:</strong> {transaction.deliveryProof.username}</p>
            <p><strong>Password:</strong> {transaction.deliveryProof.password}</p>
            {transaction.deliveryProof.notes && (
              <p><strong>Notes:</strong> {transaction.deliveryProof.notes}</p>
            )}
          </div>
        </div>
      )}

      {transaction.disputeReason && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm font-medium text-red-800">Dispute:</p>
          <p className="text-xs text-red-600">{transaction.disputeReason}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {canConfirmPayment && (
          <button
            onClick={() => onAction('confirmPayment', transaction)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            Konfirmasi Pembayaran
          </button>
        )}
        
        {canReleaseFunds && (
          <button
            onClick={() => onAction('releaseFunds', transaction)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Release Dana
          </button>
        )}

        {isDisputed && (
          <>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: true })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              Refund Buyer
            </button>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: false })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              Release to Seller
            </button>
          </>
        )}

        <button
          onClick={() => onAction('viewDetails', transaction)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
        >
          Detail
        </button>
      </div>
    </div>
  );
};


const ConfirmPaymentModal = ({ transaction, onClose, onConfirm }) => {
  const [paymentHash, setPaymentHash] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentHash.trim()) {
      onConfirm(paymentHash.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Konfirmasi Pembayaran</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Transaksi: {transaction.accountTitle}</p>
          <p className="text-sm text-gray-600 mb-2">Jumlah: {transaction.priceETH} ETH</p>
          <p className="text-sm text-gray-600">Pembeli: {transaction.buyerWallet}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash
            </label>
            <input
              type="text"
              value={paymentHash}
              onChange={(e) => setPaymentHash(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detail Escrow Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Informasi Dasar</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">ID Escrow:</p>
                <p className="font-mono">{transaction.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <span className={`px-2 py-1 rounded text-white text-xs ${ESCROW_STATUS_COLORS[transaction.status]}`}>
                  {ESCROW_STATUS_LABELS[transaction.status]}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Item:</p>
                <p>{transaction.accountTitle}</p>
              </div>
              <div>
                <p className="text-gray-600">Game:</p>
                <p>{transaction.gameName}</p>
              </div>
              <div>
                <p className="text-gray-600">Harga:</p>
                <p className="font-semibold">{transaction.priceETH} ETH</p>
              </div>
              <div>
                <p className="text-gray-600">Dibuat:</p>
                <p>{formatDate(transaction.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Pihak Terlibat</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Penjual:</p>
                <p className="font-mono text-xs break-all">{transaction.sellerWallet}</p>
              </div>
              <div>
                <p className="text-gray-600">Pembeli:</p>
                <p className="font-mono text-xs break-all">{transaction.buyerWallet}</p>
              </div>
              <div>
                <p className="text-gray-600">Escrow Wallet:</p>
                <p className="font-mono text-xs break-all">{transaction.escrowWallet}</p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Detail Akun</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {transaction.accountDetails.level && (
                <div>
                  <p className="text-gray-600">Level:</p>
                  <p>{transaction.accountDetails.level}</p>
                </div>
              )}
              {transaction.accountDetails.rank && (
                <div>
                  <p className="text-gray-600">Rank:</p>
                  <p>{transaction.accountDetails.rank}</p>
                </div>
              )}
              {transaction.accountDetails.description && (
                <div className="col-span-2">
                  <p className="text-gray-600">Deskripsi:</p>
                  <p>{transaction.accountDetails.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
            <div className="space-y-3">
              {transaction.timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{ESCROW_STATUS_LABELS[event.status]}</p>
                    <p className="text-gray-600">{event.note}</p>
                    <p className="text-gray-500 text-xs">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          {(transaction.paymentHash || transaction.deliveryProof || transaction.disputeReason) && (
            <div className="space-y-4">
              {transaction.paymentHash && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Payment Hash</h3>
                  <p className="font-mono text-xs break-all text-blue-600">{transaction.paymentHash}</p>
                </div>
              )}

              {transaction.deliveryProof && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Account Delivery</h3>
                  <div className="text-sm text-green-700">
                    <p><strong>Username:</strong> {transaction.deliveryProof.username}</p>
                    <p><strong>Password:</strong> {transaction.deliveryProof.password}</p>
                    {transaction.deliveryProof.notes && (
                      <p><strong>Notes:</strong> {transaction.deliveryProof.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {transaction.disputeReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Dispute</h3>
                  <p className="text-sm text-red-700">{transaction.disputeReason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { walletAddress } = useAuth();
  const { 
    isAdmin, 
    escrowTransactions, 
    pendingDisputes,
    checkAdminStatus,
    confirmPaymentReceived,
    releaseFunds,
    resolveDispute,
    getAdminStats
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      checkAdminStatus(walletAddress);
    }
  }, [walletAddress, checkAdminStatus]);

  const handleAction = (action, transaction, params = {}) => {
    switch (action) {
      case 'confirmPayment':
        setSelectedTransaction(transaction);
        setShowPaymentModal(true);
        break;

      case 'releaseFunds':
        releaseFunds(transaction.id);
        break;

      case 'resolveDispute':
        const resolution = params.refund ? 'Refunded to buyer due to valid dispute' : 'Released to seller - dispute resolved in favor of seller';
        resolveDispute(transaction.disputeId, resolution, params.refund);
        break;

      case 'viewDetails':
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
        break;

      default:
        break;
    }
  };

  const handleConfirmPayment = (paymentHash) => {
    if (selectedTransaction) {
      confirmPaymentReceived(selectedTransaction.id, paymentHash);
      setShowPaymentModal(false);
      setSelectedTransaction(null);
    }
  };

  const stats = getAdminStats();

  const filterTransactions = (status) => {
    if (status === 'active') {
      return escrowTransactions.filter(t => 
        [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
      );
    }
    if (status === 'disputed') {
      return escrowTransactions.filter(t => t.status === ESCROW_STATUS.DISPUTED);
    }
    if (status === 'pending') {
      return escrowTransactions.filter(t => t.status === ESCROW_STATUS.PENDING_PAYMENT);
    }
    return escrowTransactions;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Akses Ditolak</h1>
            <p className="text-red-600">Anda tidak memiliki akses admin untuk melihat halaman ini.</p>
            <p className="text-red-500 text-sm mt-2">
              Admin wallets: {['0x742d35Cc6635C0532925a3b8D1c9E5e7c5f47F1a'].join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100">Kelola transaksi escrow dan dispute</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
              </div>
              <div className="text-blue-500 text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Escrow</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeEscrows}</p>
              </div>
              <div className="text-green-500 text-3xl">🔄</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Disputes</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingDisputes}</p>
              </div>
              <div className="text-red-500 text-3xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVolume.toFixed(4)} ETH</p>
              </div>
              <div className="text-blue-500 text-3xl">💰</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview ({escrowTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({filterTransactions('active').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Payment ({filterTransactions('pending').length})
            </button>
            <button
              onClick={() => setActiveTab('disputed')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'disputed'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disputed ({filterTransactions('disputed').length})
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filterTransactions(activeTab === 'overview' ? 'all' : activeTab).length > 0 ? (
            filterTransactions(activeTab === 'overview' ? 'all' : activeTab).map(transaction => (
              <EscrowTransactionCard
                key={transaction.id}
                transaction={transaction}
                onAction={handleAction}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Tidak Ada Transaksi
                </h3>
                <p className="text-gray-500">
                  Belum ada transaksi untuk kategori ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Actions Info */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-800 mb-4">Admin Actions Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
            <div>
              <h4 className="font-semibold mb-2">Payment Confirmation:</h4>
              <ul className="space-y-1">
                <li>• Verify payment hash on blockchain</li>
                <li>• Confirm payment amount matches</li>
                <li>• Update transaction status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dispute Resolution:</h4>
              <ul className="space-y-1">
                <li>• Review dispute reason</li>
                <li>• Check account delivery details</li>
                <li>• Make fair decision based on evidence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedTransaction && (
        <ConfirmPaymentModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedTransaction(null);
          }}
          onConfirm={handleConfirmPayment}
        />
      )}

      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;