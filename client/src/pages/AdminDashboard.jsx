// src/pages/AdminDashboard.jsx - Simplified Design
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
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-800">{transaction.accountTitle}</h3>
          <p className="text-gray-600 text-sm">{transaction.gameName}</p>
          <p className="text-blue-600 font-semibold">{transaction.priceETH} ETH</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${ESCROW_STATUS_COLORS[transaction.status]}`}>
          {ESCROW_STATUS_LABELS[transaction.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-600">Penjual:</p>
          <p className="font-mono text-xs break-all">{transaction.sellerWallet}</p>
        </div>
        <div>
          <p className="text-gray-600">Pembeli:</p>
          <p className="font-mono text-xs break-all">{transaction.buyerWallet}</p>
        </div>
      </div>

      {transaction.paymentHash && (
        <div className="mb-2 p-2 bg-blue-50 rounded">
          <p className="text-xs font-medium text-blue-800">Buyer Payment Hash:</p>
          <p className="text-xs font-mono text-blue-600 break-all">{transaction.paymentHash}</p>
        </div>
      )}

      {transaction.deliveryProof && (
        <div className="mb-2 p-2 bg-green-50 rounded">
          <p className="text-xs font-medium text-green-800">Account Delivered</p>
          <p className="text-xs text-green-600">✅ {formatDate(transaction.deliveryProof.deliveredAt)}</p>
        </div>
      )}

      {transaction.disputeReason && (
        <div className="mb-2 p-2 bg-red-50 rounded">
          <p className="text-xs font-medium text-red-800">Dispute:</p>
          <p className="text-xs text-red-600">{transaction.disputeReason}</p>
        </div>
      )}

      {(isCompleted || isRefunded) && transaction.adminPaymentHash && (
        <div className="mb-2 p-2 bg-purple-50 rounded">
          <p className="text-xs font-medium text-purple-800">
            Admin {isRefunded ? 'Refund' : 'Payment'} Hash:
          </p>
          <p className="text-xs font-mono text-purple-600 break-all">{transaction.adminPaymentHash}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mt-2">
        {canReleaseFunds && (
          <button
            onClick={() => onAction('releaseFunds', transaction)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
          >
            💰 Bayar ke Seller
          </button>
        )}

        {isDisputed && (
          <>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: true })}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs"
            >
              💸 Refund Buyer
            </button>
            <button
              onClick={() => onAction('resolveDispute', transaction, { refund: false })}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs"
            >
              💰 Bayar Seller
            </button>
          </>
        )}

        <button
          onClick={() => onAction('viewDetails', transaction)}
          className="px-3 py-1 bg-gray-600 text-white rounded text-xs"
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
        setSelectedTransaction(transaction);
        setAdminPaymentAction('release');
        setShowAdminPaymentModal(true);
        break;
      case 'resolveDispute':
        setSelectedTransaction(transaction);
        setAdminPaymentAction(params.refund ? 'refund' : 'release');
        setShowAdminPaymentModal(true);
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
      releaseFunds(selectedTransaction.id, transactionHash);
    } else if (action === 'refund') {
      resolveDispute(selectedTransaction.disputeId || selectedTransaction.id, 
        'Refunded to buyer due to valid dispute', true, transactionHash);
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
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-4xl mx-auto p-4 text-center">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-xl font-bold text-red-800 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600">Anda tidak memiliki akses admin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-blue-100 text-sm">Kelola transaksi escrow dan dispute</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Total Transaksi</p>
            <p className="font-bold">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Active Escrow</p>
            <p className="font-bold text-green-600">{stats.activeTransactions}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Total Volume</p>
            <p className="font-bold">{formatETH(stats.totalVolume)} ETH</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">In Escrow</p>
            <p className="font-bold">{formatETH(stats.totalInEscrow)} ETH</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 p-3 rounded shadow">
            <p className="text-yellow-800 text-sm">Pending</p>
            <p className="font-bold">{stats.pendingPayments}</p>
          </div>
          <div className="bg-red-50 p-3 rounded shadow">
            <p className="text-red-800 text-sm">Disputes</p>
            <p className="font-bold">{stats.disputedTransactions}</p>
          </div>
          <div className="bg-green-50 p-3 rounded shadow">
            <p className="text-green-800 text-sm">Completed</p>
            <p className="font-bold">{stats.completedTransactions}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded shadow mb-6">
          <div className="flex flex-wrap gap-2">
            {['overview', 'pending', 'active', 'disputed', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-sm ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filterTransactions(tab === 'overview' ? 'all' : tab).length})
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterTransactions(activeTab === 'overview' ? 'all' : activeTab).length > 0 ? (
            filterTransactions(activeTab === 'overview' ? 'all' : activeTab).map(transaction => (
              <EscrowTransactionCard
                key={transaction.id}
                transaction={transaction}
                onAction={handleAction}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="bg-white p-6 rounded shadow">
                <h3 className="font-bold text-gray-800">Tidak Ada Transaksi</h3>
                <p className="text-gray-500 text-sm">Belum ada transaksi untuk kategori ini.</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Guide */}
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Admin Guide</h3>
          <div className="text-sm space-y-2">
            <p><strong>Payment Confirmation:</strong> Verify payment on blockchain</p>
            <p><strong>Fund Release:</strong> Transfer ETH to seller after confirmation</p>
            <p><strong>Dispute Resolution:</strong> Review evidence and decide fair resolution</p>
            <p className="text-xs font-mono">Escrow Wallet: 0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f</p>
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

const TransactionDetailModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold">Detail Transaksi</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold mb-2">Informasi Dasar</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">ID:</p>
                <p>{transaction.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <span className={`px-2 py-1 rounded text-xs ${ESCROW_STATUS_COLORS[transaction.status]}`}>
                  {ESCROW_STATUS_LABELS[transaction.status]}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Item:</p>
                <p>{transaction.accountTitle}</p>
              </div>
              <div>
                <p className="text-gray-600">Harga:</p>
                <p>{transaction.priceETH} ETH</p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div>
            <h3 className="font-semibold mb-2">Pihak Terlibat</h3>
            <div className="text-sm space-y-1">
              <div>
                <p className="text-gray-600">Penjual:</p>
                <p className="font-mono text-xs break-all">{transaction.sellerWallet}</p>
              </div>
              <div>
                <p className="text-gray-600">Pembeli:</p>
                <p className="font-mono text-xs break-all">{transaction.buyerWallet}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-2">Timeline</h3>
            <div className="text-sm space-y-2">
              {transaction.timeline.map((event, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <p>{ESCROW_STATUS_LABELS[event.status]}</p>
                    <p className="text-gray-500 text-xs">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          {transaction.paymentHash && (
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs font-medium text-blue-800">Payment Hash:</p>
              <p className="text-xs font-mono break-all">{transaction.paymentHash}</p>
            </div>
          )}

          {transaction.deliveryProof && (
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs font-medium text-green-800">Account Delivered</p>
              <p className="text-xs">{formatDate(transaction.deliveryProof.deliveredAt)}</p>
            </div>
          )}

          {transaction.disputeReason && (
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs font-medium text-red-800">Dispute:</p>
              <p className="text-xs">{transaction.disputeReason}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-1 bg-gray-200 rounded text-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;