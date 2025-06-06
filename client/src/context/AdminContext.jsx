// src/context/AdminContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Status escrow
export const ESCROW_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_RECEIVED: 'payment_received',
  ACCOUNT_DELIVERED: 'account_delivered',
  BUYER_CONFIRMED: 'buyer_confirmed',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded'
};

export const ESCROW_STATUS_LABELS = {
  [ESCROW_STATUS.PENDING_PAYMENT]: 'Menunggu Pembayaran',
  [ESCROW_STATUS.PAYMENT_RECEIVED]: 'Pembayaran Diterima',
  [ESCROW_STATUS.ACCOUNT_DELIVERED]: 'Akun Dikirim',
  [ESCROW_STATUS.BUYER_CONFIRMED]: 'Pembeli Konfirmasi',
  [ESCROW_STATUS.COMPLETED]: 'Selesai',
  [ESCROW_STATUS.DISPUTED]: 'Sengketa',
  [ESCROW_STATUS.REFUNDED]: 'Dikembalikan'
};

export const ESCROW_STATUS_COLORS = {
  [ESCROW_STATUS.PENDING_PAYMENT]: 'bg-yellow-500',
  [ESCROW_STATUS.PAYMENT_RECEIVED]: 'bg-blue-500',
  [ESCROW_STATUS.ACCOUNT_DELIVERED]: 'bg-purple-500',
  [ESCROW_STATUS.BUYER_CONFIRMED]: 'bg-green-500',
  [ESCROW_STATUS.COMPLETED]: 'bg-green-600',
  [ESCROW_STATUS.DISPUTED]: 'bg-red-500',
  [ESCROW_STATUS.REFUNDED]: 'bg-gray-500'
};

// Admin wallet addresses (untuk demo)
const ADMIN_WALLETS = [
  '0x742d35Cc6635C0532925a3b8D1c9E5e7c5f47F1a',
  '0xAdminWallet123456789012345678901234567890'
];

const ESCROW_WALLET = '0xEscrowWallet123456789012345678901234567890';

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [pendingDisputes, setPendingDisputes] = useState([]);

  // Check if current user is admin
  const checkAdminStatus = (walletAddress) => {
    const adminStatus = ADMIN_WALLETS.includes(walletAddress);
    setIsAdmin(adminStatus);
    return adminStatus;
  };

  // Load escrow transactions
  useEffect(() => {
    const loadEscrowData = () => {
      const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      const disputes = JSON.parse(localStorage.getItem('pendingDisputes') || '[]');
      setEscrowTransactions(transactions);
      setPendingDisputes(disputes);
    };

    loadEscrowData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadEscrowData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Create escrow transaction
  const createEscrowTransaction = (orderData) => {
    const escrowTransaction = {
      id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: orderData.id,
      buyerWallet: orderData.buyerWallet || 'current_buyer',
      sellerWallet: orderData.sellerWallet,
      accountTitle: orderData.title,
      gameName: orderData.gameName,
      priceETH: orderData.totalPriceETH,
      priceIDR: orderData.totalPriceIDR,
      escrowWallet: ESCROW_WALLET,
      status: ESCROW_STATUS.PENDING_PAYMENT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accountDetails: {
        level: orderData.level,
        rank: orderData.rank,
        description: orderData.description,
        image: orderData.image
      },
      timeline: [
        {
          status: ESCROW_STATUS.PENDING_PAYMENT,
          timestamp: Date.now(),
          note: 'Escrow transaction created'
        }
      ],
      paymentHash: null,
      deliveryProof: null,
      buyerConfirmation: null,
      disputeReason: null
    };

    const updatedTransactions = [...escrowTransactions, escrowTransaction];
    setEscrowTransactions(updatedTransactions);
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    
    return escrowTransaction;
  };

  // Update escrow status
  const updateEscrowStatus = (escrowId, newStatus, additionalData = {}) => {
    const updatedTransactions = escrowTransactions.map(transaction => {
      if (transaction.id === escrowId) {
        const updatedTransaction = {
          ...transaction,
          status: newStatus,
          updatedAt: Date.now(),
          ...additionalData,
          timeline: [
            ...transaction.timeline,
            {
              status: newStatus,
              timestamp: Date.now(),
              note: additionalData.note || `Status updated to ${ESCROW_STATUS_LABELS[newStatus]}`
            }
          ]
        };
        return updatedTransaction;
      }
      return transaction;
    });

    setEscrowTransactions(updatedTransactions);
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
    
    return updatedTransactions.find(t => t.id === escrowId);
  };

  // Admin confirms payment received
  const confirmPaymentReceived = (escrowId, paymentHash) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.PAYMENT_RECEIVED, {
      paymentHash,
      note: `Payment confirmed with hash: ${paymentHash}`
    });
  };

  // Seller delivers account
  const deliverAccount = (escrowId, deliveryData) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.ACCOUNT_DELIVERED, {
      deliveryProof: deliveryData,
      note: 'Account details delivered to buyer'
    });
  };

  // Buyer confirms receipt
  const confirmReceipt = (escrowId, confirmationData) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.BUYER_CONFIRMED, {
      buyerConfirmation: confirmationData,
      note: 'Buyer confirmed account receipt'
    });
  };

  // Admin releases funds to seller
  const releaseFunds = (escrowId) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.COMPLETED, {
      releasedAt: Date.now(),
      note: 'Funds released to seller'
    });
  };

  // Create dispute
  const createDispute = (escrowId, disputeReason, disputedBy) => {
    const dispute = {
      id: `dispute_${Date.now()}`,
      escrowId,
      reason: disputeReason,
      disputedBy,
      createdAt: Date.now(),
      status: 'open'
    };

    const updatedDisputes = [...pendingDisputes, dispute];
    setPendingDisputes(updatedDisputes);
    localStorage.setItem('pendingDisputes', JSON.stringify(updatedDisputes));

    updateEscrowStatus(escrowId, ESCROW_STATUS.DISPUTED, {
      disputeId: dispute.id,
      disputeReason,
      note: `Dispute created by ${disputedBy}: ${disputeReason}`
    });

    return dispute;
  };

  // Resolve dispute
  const resolveDispute = (disputeId, resolution, refundToBuyer = false) => {
    const updatedDisputes = pendingDisputes.map(dispute => {
      if (dispute.id === disputeId) {
        return { ...dispute, status: 'resolved', resolution, resolvedAt: Date.now() };
      }
      return dispute;
    });

    setPendingDisputes(updatedDisputes.filter(d => d.status !== 'resolved'));
    localStorage.setItem('pendingDisputes', JSON.stringify(updatedDisputes));

    const dispute = updatedDisputes.find(d => d.id === disputeId);
    if (dispute) {
      const newStatus = refundToBuyer ? ESCROW_STATUS.REFUNDED : ESCROW_STATUS.COMPLETED;
      updateEscrowStatus(dispute.escrowId, newStatus, {
        disputeResolution: resolution,
        note: `Dispute resolved: ${resolution}. ${refundToBuyer ? 'Funds refunded to buyer' : 'Funds released to seller'}`
      });
    }
  };

  // Get escrow transaction by order ID
  const getEscrowByOrderId = (orderId) => {
    return escrowTransactions.find(transaction => transaction.orderId === orderId);
  };

  // Get admin statistics
  const getAdminStats = () => {
    const totalTransactions = escrowTransactions.length;
    const completedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.COMPLETED).length;
    const activeTransactions = escrowTransactions.filter(t => 
      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
    ).length;
    const disputedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.DISPUTED).length;
    
    const totalVolume = escrowTransactions
      .filter(t => t.status === ESCROW_STATUS.COMPLETED)
      .reduce((sum, t) => sum + parseFloat(t.priceETH || 0), 0);

    return {
      totalTransactions,
      completedTransactions,
      activeTransactions,
      disputedTransactions,
      totalVolume,
      pendingDisputes: pendingDisputes.length
    };
  };

  const value = {
    isAdmin,
    escrowTransactions,
    pendingDisputes,
    checkAdminStatus,
    createEscrowTransaction,
    updateEscrowStatus,
    confirmPaymentReceived,
    deliverAccount,
    confirmReceipt,
    releaseFunds,
    createDispute,
    resolveDispute,
    getEscrowByOrderId,
    getAdminStats,
    ESCROW_WALLET
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};