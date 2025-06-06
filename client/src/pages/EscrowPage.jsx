// src/pages/EscrowPage.jsx
import React, { useState, useEffect } from 'react';
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

const EscrowTransactionCard = ({ transaction, userRole, onAction }) => {
  const getActionButtons = () => {
    if (userRole === 'seller') {
      switch (transaction.status) {
        case ESCROW_STATUS.PAYMENT_RECEIVED:
          return (
            <button
              onClick={() => onAction('deliver', transaction)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Kirim Detail Akun
            </button>
          );
        case ESCROW_STATUS.ACCOUNT_DELIVERED:
          return (
            <div className="text-sm text-gray-600">
              ⏳ Menunggu konfirmasi pembeli
            </div>
          );
        case ESCROW_STATUS.BUYER_CONFIRMED:
          return (
            <div className="text-sm text-green-600">
              ✅ Pembeli telah konfirmasi, menunggu admin release dana
            </div>
          );
        case ESCROW_STATUS.COMPLETED:
          return (
            <div className="text-sm text-green-600">
              ✅ Transaksi selesai, dana telah dirilis
            </div>
          );
        case ESCROW_STATUS.DISPUTED:
          return (
            <div className="text-sm text-red-600">
              ⚠️ Sedang dalam sengketa
            </div>
          );
        default:
          return null;
      }
    } else if (userRole === 'buyer') {
      switch (transaction.status) {
        case ESCROW_STATUS.PENDING_PAYMENT:
          return (
            <div className="text-sm text-yellow-600">
              💰 Menunggu pembayaran
            </div>
          );
        case ESCROW_STATUS.PAYMENT_RECEIVED:
          return (
            <div className="text-sm text-blue-600">
              ⏳ Pembayaran diterima, menunggu penjual kirim akun
            </div>
          );
        case ESCROW_STATUS.ACCOUNT_DELIVERED:
          return (
            <button
              onClick={() => onAction('confirm', transaction)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              Verifikasi Akun
            </button>
          );
        case ESCROW_STATUS.BUYER_CONFIRMED:
          return (
            <div className="text-sm text-green-600">
              ✅ Anda telah konfirmasi, menunggu admin release dana
            </div>
          );
        case ESCROW_STATUS.COMPLETED:
          return (
            <div className="text-sm text-green-600">
              ✅ Transaksi selesai
            </div>
          );
        case ESCROW_STATUS.DISPUTED:
          return (
            <div className="text-sm text-red-600">
              ⚠️ Sengketa sedang diproses admin
            </div>
          );
        default:
          return null;
      }
    }
    return null;
  };

  const isUserTransaction = (userRole === 'seller' && transaction.sellerWallet === transaction.currentUserWallet) ||
                           (userRole === 'buyer' && transaction.buyerWallet === transaction.currentUserWallet);

  if (!isUserTransaction) return null;

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

      <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
        <div>
          <p className="text-gray-600">
            {userRole === 'seller' ? 'Pembeli:' : 'Penjual:'}
          </p>
          <p className="font-mono text-xs break-all">
            {userRole === 'seller' ? transaction.buyerWallet : transaction.sellerWallet}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Dibuat:</p>
          <p>{formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Pembayaran</span>
          <span>Kirim Akun</span>
          <span>Konfirmasi</span>
          <span>Selesai</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              transaction.status === ESCROW_STATUS.PENDING_PAYMENT ? 'bg-yellow-500 w-1/4' :
              transaction.status === ESCROW_STATUS.PAYMENT_RECEIVED ? 'bg-blue-500 w-2/4' :
              transaction.status === ESCROW_STATUS.ACCOUNT_DELIVERED ? 'bg-purple-500 w-3/4' :
              transaction.status === ESCROW_STATUS.BUYER_CONFIRMED ? 'bg-green-500 w-full' :
              transaction.status === ESCROW_STATUS.COMPLETED ? 'bg-green-600 w-full' :
              transaction.status === ESCROW_STATUS.DISPUTED ? 'bg-red-500 w-2/4' :
              'bg-gray-300 w-1/4'
            }`}
          ></div>
        </div>
      </div>

      {/* Account Details if delivered */}
      {transaction.deliveryProof && userRole === 'buyer' && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">Detail Akun Diterima:</p>
          <div className="text-xs text-green-700 space-y-1">
            <p><strong>Username:</strong> {transaction.deliveryProof.username}</p>
            <p><strong>Password:</strong> {transaction.deliveryProof.password}</p>
            {transaction.deliveryProof.notes && (
              <p><strong>Catatan:</strong> {transaction.deliveryProof.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Dispute Info */}
      {transaction.disputeReason && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm font-medium text-red-800">Alasan Sengketa:</p>
          <p className="text-xs text-red-700">{transaction.disputeReason}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => onAction('viewDetails', transaction)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
        >
          Detail
        </button>
        <div>
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detail Transaksi Escrow</h2>
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
                <p className="font-mono text-xs break-all">{transaction.id}</p>
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
                <p className="text-gray-600">Harga:</p>
                <p className="font-semibold">{transaction.priceETH} ETH</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-blue-50 p-4 rounded-lg">
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
          {transaction.deliveryProof && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Detail Akun</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Username:</strong> {transaction.deliveryProof.username}</p>
                <p><strong>Password:</strong> {transaction.deliveryProof.password}</p>
                {transaction.deliveryProof.email && (
                  <p><strong>Email:</strong> {transaction.deliveryProof.email}</p>
                )}
                {transaction.deliveryProof.additionalInfo && (
                  <p><strong>Info Tambahan:</strong> {transaction.deliveryProof.additionalInfo}</p>
                )}
                {transaction.deliveryProof.notes && (
                  <p><strong>Catatan:</strong> {transaction.deliveryProof.notes}</p>
                )}
              </div>
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

  // Add current user wallet to transactions for filtering
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
    return transactionsWithUser.filter(t => t.buyerWallet === walletAddress);
  };

  const getSellerTransactions = () => {
    return transactionsWithUser.filter(t => t.sellerWallet === walletAddress);
  };

  const buyerTransactions = getBuyerTransactions();
  const sellerTransactions = getSellerTransactions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Escrow Management</h1>
          <p className="text-xl">Kelola transaksi pembelian dan penjualan Anda</p>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Sebagai Pembeli</p>
                  <p className="text-3xl font-bold text-blue-600">{buyerTransactions.length}</p>
                </div>
                <div className="text-4xl">🛒</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Sebagai Penjual</p>
                  <p className="text-3xl font-bold text-green-600">{sellerTransactions.length}</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Aktif (Buyer)</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {buyerTransactions.filter(t => 
                      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED].includes(t.status)
                    ).length}
                  </p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Aktif (Seller)</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {sellerTransactions.filter(t => 
                      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
                    ).length}
                  </p>
                </div>
                <div className="text-4xl">🔄</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'as_buyer'
                    ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => setActiveTab('as_buyer')}
              >
                <span className="mr-2">Sebagai Pembeli</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                  activeTab === 'as_buyer'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {buyerTransactions.length}
                </span>
              </button>
              
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'as_seller'
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => setActiveTab('as_seller')}
              >
                <span className="mr-2">Sebagai Penjual</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                  activeTab === 'as_seller'
                    ? 'bg-white/20 text-white'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {sellerTransactions.length}
                </span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === 'as_buyer' && buyerTransactions.map(transaction => (
              <EscrowTransactionCard
                key={transaction.id}
                transaction={transaction}
                userRole="buyer"
                onAction={handleAction}
              />
            ))}
            
            {activeTab === 'as_seller' && sellerTransactions.map(transaction => (
              <EscrowTransactionCard
                key={transaction.id}
                transaction={transaction}
                userRole="seller"
                onAction={handleAction}
              />
            ))}
          </div>

          {/* Empty State */}
          {((activeTab === 'as_buyer' && buyerTransactions.length === 0) || 
            (activeTab === 'as_seller' && sellerTransactions.length === 0)) && (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                <div className="text-6xl mb-6">
                  {activeTab === 'as_buyer' ? '🛒' : '💰'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Belum Ada Transaksi
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'as_buyer' 
                    ? 'Anda belum melakukan pembelian dengan sistem escrow'
                    : 'Anda belum menjual akun dengan sistem escrow'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
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