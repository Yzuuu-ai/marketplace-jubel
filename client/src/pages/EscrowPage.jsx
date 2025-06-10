// src/pages/EscrowPage.jsx - Simplified Design
import React, { useState } from 'react';
import Header from '../components/Header';
import SellerDeliveryModal from '../components/SellerDeliveryModal';
import BuyerConfirmationModal from '../components/BuyerConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useAdmin, ESCROW_STATUS, ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from '../context/AdminContext';

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatETH = (ethAmount) => {
  return parseFloat(ethAmount).toFixed(6);
};

const formatIDR = (ethAmount) => {
  const idr = parseFloat(ethAmount) * 50000000;
  return `Rp ${idr.toLocaleString('id-ID')}`;
};

const STATUS_ICONS = {
  [ESCROW_STATUS.PENDING_PAYMENT]: '⏳',
  [ESCROW_STATUS.PAYMENT_RECEIVED]: '💳',
  [ESCROW_STATUS.ACCOUNT_DELIVERED]: '📦',
  [ESCROW_STATUS.BUYER_CONFIRMED]: '✅',
  [ESCROW_STATUS.COMPLETED]: '🎉',
  [ESCROW_STATUS.DISPUTED]: '⚠️',
  [ESCROW_STATUS.REFUNDED]: '↩️',
  [ESCROW_STATUS.CANCELLED]: '❌'
};

const EscrowTransactionCard = ({ transaction, userRole, onAction }) => {
  const isUserTransaction = (userRole === 'seller' && transaction.sellerWallet === transaction.currentUserWallet) ||
                         (userRole === 'buyer' && transaction.buyerWallet === transaction.currentUserWallet);

  if (!isUserTransaction) return null;

  const getActionButtons = () => {
    if (userRole === 'seller') {
      switch (transaction.status) {
        case ESCROW_STATUS.PAYMENT_RECEIVED:
          return (
            <button
              onClick={() => onAction('deliver', transaction)}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Kirim Detail Akun
            </button>
          );
        case ESCROW_STATUS.ACCOUNT_DELIVERED:
          return <p className="text-sm text-gray-600">Menunggu konfirmasi pembeli</p>;
        case ESCROW_STATUS.BUYER_CONFIRMED:
          return <p className="text-sm text-gray-600">Menunggu admin release dana</p>;
        case ESCROW_STATUS.COMPLETED:
          return <p className="text-sm text-green-600">Transaksi selesai</p>;
        case ESCROW_STATUS.DISPUTED:
          return <p className="text-sm text-red-600">Dalam proses sengketa</p>;
        default:
          return null;
      }
    } else if (userRole === 'buyer') {
      switch (transaction.status) {
        case ESCROW_STATUS.PENDING_PAYMENT:
          return <p className="text-sm text-gray-600">Menunggu konfirmasi pembayaran</p>;
        case ESCROW_STATUS.PAYMENT_RECEIVED:
          return <p className="text-sm text-gray-600">Pembayaran diterima, menunggu penjual</p>;
        case ESCROW_STATUS.ACCOUNT_DELIVERED:
          return (
            <button
              onClick={() => onAction('confirm', transaction)}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Verifikasi Akun
            </button>
          );
        case ESCROW_STATUS.BUYER_CONFIRMED:
          return <p className="text-sm text-gray-600">Menunggu admin release dana</p>;
        case ESCROW_STATUS.COMPLETED:
          return <p className="text-sm text-green-600">Transaksi selesai</p>;
        case ESCROW_STATUS.DISPUTED:
          return <p className="text-sm text-red-600">Sengketa sedang diproses</p>;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold">{transaction.accountTitle}</h3>
          <p className="text-sm text-gray-600">{transaction.gameName}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${ESCROW_STATUS_COLORS[transaction.status]}`}>
          {ESCROW_STATUS_LABELS[transaction.status]}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-lg font-bold text-blue-600">{formatETH(transaction.priceETH)} ETH</p>
        <p className="text-sm text-gray-500">{formatIDR(transaction.priceETH)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-100 p-2 rounded">
          <p className="text-xs text-gray-600">
            {userRole === 'seller' ? 'Pembeli' : 'Penjual'}
          </p>
          <p className="text-xs font-mono truncate">
            {userRole === 'seller' ? transaction.buyerWallet : transaction.sellerWallet}
          </p>
        </div>
        <div className="bg-gray-100 p-2 rounded">
          <p className="text-xs text-gray-600">Tanggal</p>
          <p className="text-xs">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      {transaction.deliveryProof && userRole === 'buyer' && (
        <div className="mb-3 p-2 bg-gray-100 rounded">
          <h4 className="text-sm font-semibold mb-1">Detail Akun</h4>
          <div className="text-sm">
            <p>Username: {transaction.deliveryProof.username}</p>
            <p>Password: {transaction.deliveryProof.password}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {getActionButtons()}
        <button
          onClick={() => onAction('viewDetails', transaction)}
          className="w-full p-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">Detail Transaksi</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-bold">{ESCROW_STATUS_LABELS[transaction.status]}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Informasi Transaksi</h4>
              <div className="space-y-2">
                <p><span className="text-gray-600">Item:</span> {transaction.accountTitle}</p>
                <p><span className="text-gray-600">Game:</span> {transaction.gameName}</p>
                <p><span className="text-gray-600">Harga:</span> {formatETH(transaction.priceETH)} ETH</p>
                <p>{formatIDR(transaction.priceETH)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Pihak Terlibat</h4>
              <div className="space-y-2">
                <p><span className="text-gray-600">Penjual:</span> {transaction.sellerWallet}</p>
                <p><span className="text-gray-600">Pembeli:</span> {transaction.buyerWallet}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Timeline</h4>
              <div className="space-y-2">
                {transaction.timeline.map((event, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{ESCROW_STATUS_LABELS[event.status]}</p>
                    <p className="text-gray-600">{formatDate(event.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full p-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const EscrowPage = () => {
  const { walletAddress } = useAuth();
  const { 
    escrowTransactions, 
    deliverAccount, 
    confirmReceipt, 
    createDispute 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('as_buyer');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const transactionsWithUser = escrowTransactions.map(t => ({
    ...t,
    currentUserWallet: walletAddress
  }));

  const handleAction = (action, transaction) => {
    setSelectedTransaction(transaction);
    
    switch (action) {
      case 'deliver':
        setShowDeliveryModal(true);
        break;
      case 'confirm':
        setShowConfirmationModal(true);
        break;
      case 'viewDetails':
        setShowDetailModal(true);
        break;
      default:
        break;
    }
  };

  const handleDeliverAccount = async (deliveryData) => {
    if (selectedTransaction) {
      await deliverAccount(selectedTransaction.id, deliveryData);
      setShowDeliveryModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleConfirmReceipt = async (confirmationData) => {
    if (selectedTransaction) {
      await confirmReceipt(selectedTransaction.id, confirmationData);
      setShowConfirmationModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleCreateDispute = async (disputeReason) => {
    if (selectedTransaction) {
      await createDispute(selectedTransaction.id, disputeReason, 'buyer');
      setShowConfirmationModal(false);
      setSelectedTransaction(null);
    }
  };

  const getBuyerTransactions = () => {
    let transactions = transactionsWithUser.filter(t => t.buyerWallet === walletAddress);
    if (filterStatus !== 'all') {
      transactions = transactions.filter(t => t.status === filterStatus);
    }
    return transactions;
  };

  const getSellerTransactions = () => {
    let transactions = transactionsWithUser.filter(t => t.sellerWallet === walletAddress);
    if (filterStatus !== 'all') {
      transactions = transactions.filter(t => t.status === filterStatus);
    }
    return transactions;
  };

  const buyerTransactions = getBuyerTransactions();
  const sellerTransactions = getSellerTransactions();

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Escrow Management</h1>

        <div className="flex mb-6">
          <button
            className={`flex-1 p-2 ${activeTab === 'as_buyer' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('as_buyer')}
          >
            Sebagai Pembeli
          </button>
          <button
            className={`flex-1 p-2 ${activeTab === 'as_seller' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('as_seller')}
          >
            Sebagai Penjual
          </button>
        </div>

        <div className="mb-6">
          <select 
            className="w-full p-2 border rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            {Object.entries(ESCROW_STATUS).map(([key, value]) => (
              <option key={key} value={value}>
                {ESCROW_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'as_buyer' && (
          <div>
            {buyerTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buyerTransactions.map(transaction => (
                  <EscrowTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    userRole="buyer"
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 text-center rounded-lg">
                <p className="text-gray-600">
                  {filterStatus !== 'all' 
                    ? 'Tidak ada transaksi dengan status ini'
                    : 'Belum ada transaksi sebagai pembeli'}
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'as_seller' && (
          <div>
            {sellerTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellerTransactions.map(transaction => (
                  <EscrowTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    userRole="seller"
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 text-center rounded-lg">
                <p className="text-gray-600">
                  {filterStatus !== 'all' 
                    ? 'Tidak ada transaksi dengan status ini'
                    : 'Belum ada transaksi sebagai penjual'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeliveryModal && selectedTransaction && (
        <SellerDeliveryModal
          escrowTransaction={selectedTransaction}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedTransaction(null);
          }}
          onDeliver={handleDeliverAccount}
        />
      )}

      {showConfirmationModal && selectedTransaction && (
        <BuyerConfirmationModal
          escrowTransaction={selectedTransaction}
          onClose={() => {
            setShowConfirmationModal(false);
            setSelectedTransaction(null);
          }}
          onConfirm={handleConfirmReceipt}
          onDispute={handleCreateDispute}
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

export default EscrowPage;