// src/pages/AdminDashboard.jsx - Complete with Admin Payment Requirements
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AdminBlockchainPayment from '../components/AdminBlockchainPayment';
import { useAdmin, ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS, ESCROW_STATUS } from '../context/AdminContext';
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

const formatETH = (amount) => {
  return parseFloat(amount).toFixed(6);
};

const EscrowTransactionCard = ({ transaction, onAction }) => {
  const canReleaseFunds = transaction.status === 'buyer_confirmed';
  const isDisputed = transaction.status === 'disputed';
  const isCompleted = transaction.status === 'completed';
  const isRefunded = transaction.status === 'refunded';

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
          <p className="text-sm font-medium text-blue-800">Buyer Payment Hash:</p>
          <p className="text-xs font-mono text-blue-600 break-all">{transaction.paymentHash}</p>
        </div>
      )}

      {transaction.deliveryProof && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800">Account Delivered:</p>
          <div className="text-xs text-green-600">
            <p className="font-medium">✅ Akun telah dikirim ke buyer</p>
            <p><strong>Delivered at:</strong> {formatDate(transaction.deliveryProof.deliveredAt)}</p>
            <p className="text-xs text-gray-500 mt-1">
              <em>Detail akun hanya dapat dilihat oleh buyer dan seller</em>
            </p>
          </div>
        </div>
      )}

      {transaction.disputeReason && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm font-medium text-red-800">Dispute:</p>
          <p className="text-xs text-red-600">{transaction.disputeReason}</p>
        </div>
      )}

      {/* Show admin payment info if completed or refunded */}
      {(isCompleted || isRefunded) && transaction.adminPaymentHash && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-800">
            Admin {isRefunded ? 'Refund' : 'Payment'} Hash:
          </p>
          <p className="text-xs font-mono text-purple-600 break-all">{transaction.adminPaymentHash}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {canReleaseFunds && (
          <button
            onClick={() => onAction('releaseFunds', transaction)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            💰 Bayar ke Seller
          </button>
        )}

        {isDisputed && (
          <>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: true })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              💸 Refund ke Buyer
            </button>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: false })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              💰 Bayar ke Seller
            </button>
          </>
        )}

        {(isCompleted || isRefunded) && (
          <div className="text-sm text-gray-600">
            {isCompleted ? '✅ Dana telah dibayar ke seller' : '↩️ Dana telah direfund ke buyer'}
          </div>
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

const AdminDashboard = () => {
  const { walletAddress } = useAuth();
  const { 
    isAdmin, 
    escrowTransactions, 
    checkAdminStatus,
    releaseFunds,
    resolveDispute,
    getAdminStats
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdminPaymentModal, setShowAdminPaymentModal] = useState(false);
  const [adminPaymentAction, setAdminPaymentAction] = useState('');

  useEffect(() => {
    if (walletAddress) {
      checkAdminStatus(walletAddress);
    }
  }, [walletAddress, checkAdminStatus]);

  const handleAction = (action, transaction, params = {}) => {
    switch (action) {
      case 'releaseFunds':
        // Show payment modal for admin to pay seller
        setSelectedTransaction(transaction);
        setAdminPaymentAction('release');
        setShowAdminPaymentModal(true);
        break;

      case 'resolveDispute':
        if (params.refund) {
          // Show payment modal for refund to buyer
          setSelectedTransaction(transaction);
          setAdminPaymentAction('refund');
          setShowAdminPaymentModal(true);
        } else {
          // Show payment modal for release to seller
          setSelectedTransaction(transaction);
          setAdminPaymentAction('release');
          setShowAdminPaymentModal(true);
        }
        break;

      case 'viewDetails':
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
        break;

      default:
        break;
    }
  };

  const handleAdminPayment = (paymentData) => {
    if (!selectedTransaction) return;

    const { transactionHash, action } = paymentData;

    if (action === 'release') {
      // Release funds to seller
      releaseFunds(selectedTransaction.id, transactionHash);
    } else if (action === 'refund') {
      // Refund to buyer
      const resolution = 'Refunded to buyer due to valid dispute';
      resolveDispute(selectedTransaction.disputeId || selectedTransaction.id, resolution, true, transactionHash);
    }

    setShowAdminPaymentModal(false);
    setSelectedTransaction(null);
    setAdminPaymentAction('');
  };

  const stats = getAdminStats();

  const filterTransactions = (status) => {
    switch (status) {
      case 'active':
        return escrowTransactions.filter(t => 
          ['payment_received', 'account_delivered', 'buyer_confirmed'].includes(t.status)
        );
      case 'disputed':
        return escrowTransactions.filter(t => t.status === 'disputed');
      case 'pending':
        return escrowTransactions.filter(t => t.status === 'pending_payment');
      case 'completed':
        return escrowTransactions.filter(t => t.status === 'completed');
      default:
        return escrowTransactions;
    }
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
              Admin wallets: 0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f
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
                <p className="text-2xl font-bold text-green-600">{stats.activeTransactions}</p>
              </div>
              <div className="text-green-500 text-3xl">🔄</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">{formatETH(stats.totalVolume)} ETH</p>
              </div>
              <div className="text-blue-500 text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Escrow</p>
                <p className="text-2xl font-bold text-purple-600">{formatETH(stats.totalInEscrow)} ETH</p>
              </div>
              <div className="text-purple-500 text-3xl">🔒</div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-50 rounded-xl shadow-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
              </div>
              <div className="text-yellow-500 text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl shadow-lg p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 text-sm">Disputes</p>
                <p className="text-2xl font-bold text-red-600">{stats.disputedTransactions}</p>
              </div>
              <div className="text-red-500 text-3xl">⚠️</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTransactions}</p>
              </div>
              <div className="text-green-500 text-3xl">✅</div>
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
              onClick={() => setActiveTab('disputed')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'disputed'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disputed ({filterTransactions('disputed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({filterTransactions('completed').length})
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-yellow-700">
            <div>
              <h4 className="font-semibold mb-2">Payment Confirmation:</h4>
              <ul className="space-y-1">
                <li>• Verify payment on blockchain</li>
                <li>• Check amount matches</li>
                <li>• Confirm payment received</li>
                <li>• Use "Simulasi Bayar" for testing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Fund Release:</h4>
              <ul className="space-y-1">
                <li>• Wait for buyer confirmation</li>
                <li>• Transfer ETH to seller</li>
                <li>• Input payment hash</li>
                <li>• Auto-release after 24h</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dispute Resolution:</h4>
              <ul className="space-y-1">
                <li>• Review dispute reason</li>
                <li>• Check evidence from both parties</li>
                <li>• Decide fair resolution</li>
                <li>• Refund buyer or release to seller</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-sm text-yellow-700">
            <p><strong>Escrow Wallet:</strong> <span className="font-mono">0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f</span></p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {showAdminPaymentModal && selectedTransaction && (
        <AdminBlockchainPayment
          transaction={selectedTransaction}
          action={adminPaymentAction}
          onPaymentComplete={handleAdminPayment}
          onCancel={() => {
            setShowAdminPaymentModal(false);
            setSelectedTransaction(null);
            setAdminPaymentAction('');
          }}
        />
      )}
    </div>
  );
};

// TransactionDetailModal component
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
          {(transaction.paymentHash || transaction.deliveryProof || transaction.disputeReason || transaction.adminPaymentHash) && (
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
                    <p><strong>Status:</strong> ✅ Akun telah dikirim ke buyer</p>
                    <p><strong>Delivered at:</strong> {formatDate(transaction.deliveryProof.deliveredAt)}</p>
                    <div className="mt-2 p-2 bg-green-100 rounded">
                      <p className="text-xs text-green-800">
                        <em>⚠️ Detail akun (username/password) hanya dapat dilihat oleh buyer dan seller untuk keamanan</em>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {transaction.disputeReason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Dispute</h3>
                  <p className="text-sm text-red-700">{transaction.disputeReason}</p>
                </div>
              )}

              {transaction.adminPaymentHash && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Admin Payment</h3>
                  <p className="text-sm text-purple-700">
                    {transaction.status === ESCROW_STATUS.COMPLETED ? 'Payment to Seller:' : 'Refund to Buyer:'}
                  </p>
                  <p className="font-mono text-xs break-all text-purple-600">{transaction.adminPaymentHash}</p>
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

export default AdminDashboard;