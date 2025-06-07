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
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

export const ESCROW_STATUS_LABELS = {
  [ESCROW_STATUS.PENDING_PAYMENT]: 'Menunggu Pembayaran',
  [ESCROW_STATUS.PAYMENT_RECEIVED]: 'Pembayaran Diterima',
  [ESCROW_STATUS.ACCOUNT_DELIVERED]: 'Akun Dikirim',
  [ESCROW_STATUS.BUYER_CONFIRMED]: 'Pembeli Konfirmasi',
  [ESCROW_STATUS.COMPLETED]: 'Selesai',
  [ESCROW_STATUS.DISPUTED]: 'Sengketa',
  [ESCROW_STATUS.REFUNDED]: 'Dikembalikan',
  [ESCROW_STATUS.CANCELLED]: 'Dibatalkan'
};

export const ESCROW_STATUS_COLORS = {
  [ESCROW_STATUS.PENDING_PAYMENT]: 'bg-yellow-500',
  [ESCROW_STATUS.PAYMENT_RECEIVED]: 'bg-blue-500',
  [ESCROW_STATUS.ACCOUNT_DELIVERED]: 'bg-purple-500',
  [ESCROW_STATUS.BUYER_CONFIRMED]: 'bg-green-500',
  [ESCROW_STATUS.COMPLETED]: 'bg-green-600',
  [ESCROW_STATUS.DISPUTED]: 'bg-red-500',
  [ESCROW_STATUS.REFUNDED]: 'bg-gray-500',
  [ESCROW_STATUS.CANCELLED]: 'bg-gray-600'
};

// Admin wallet addresses (untuk demo)
const ADMIN_WALLETS = [
  '0x742d35Cc6635C0532925a3b8D1c9E5e7c5f47F1a',
  '0x00c120AFdda61E957C524B03b67498938a19eE4D'
];

// Escrow wallet address
export const ESCROW_WALLET = '0x742d35Cc6635C0532925a3b8D1c9E5e7c5f47F1a';

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

  // Create escrow transaction when buyer purchases
  const createEscrowTransaction = (orderData) => {
    const escrowTransaction = {
      id: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId: orderData.accountId, // Link to game account
      buyerWallet: orderData.buyerWallet,
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
          note: 'Escrow transaction created - waiting for payment'
        }
      ],
      paymentHash: null,
      deliveryProof: null,
      buyerConfirmation: null,
      disputeReason: null,
      paymentDeadline: Date.now() + (15 * 60 * 1000), // 15 minutes
      autoReleaseDate: null
    };

    const updatedTransactions = [...escrowTransactions, escrowTransaction];
    setEscrowTransactions(updatedTransactions);
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    
    // Update game account status
    const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const updatedAccounts = gameAccounts.map(acc =>
      acc.id === orderData.accountId
        ? { ...acc, escrowId: escrowTransaction.id, isInEscrow: true }
        : acc
    );
    localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
    
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
        
        // Set auto-release date when buyer confirms
        if (newStatus === ESCROW_STATUS.BUYER_CONFIRMED) {
          updatedTransaction.autoReleaseDate = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        }
        
        return updatedTransaction;
      }
      return transaction;
    });

    setEscrowTransactions(updatedTransactions);
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    
    // Update game account status when completed or cancelled
    if (newStatus === ESCROW_STATUS.COMPLETED || newStatus === ESCROW_STATUS.CANCELLED || newStatus === ESCROW_STATUS.REFUNDED) {
      const transaction = updatedTransactions.find(t => t.id === escrowId);
      if (transaction) {
        const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
        const updatedAccounts = gameAccounts.map(acc => {
          if (acc.id === transaction.accountId) {
            if (newStatus === ESCROW_STATUS.COMPLETED) {
              return { 
                ...acc, 
                isInEscrow: false, 
                isSold: true, 
                soldAt: Date.now(),
                buyerWallet: transaction.buyerWallet 
              };
            } else {
              return { ...acc, isInEscrow: false, escrowId: null };
            }
          }
          return acc;
        });
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      }
    }
    
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
      deliveryProof: {
        ...deliveryData,
        deliveredAt: Date.now()
      },
      note: 'Account details delivered to buyer'
    });
  };

  // Buyer confirms receipt
  const confirmReceipt = (escrowId, confirmationData) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.BUYER_CONFIRMED, {
      buyerConfirmation: {
        ...confirmationData,
        confirmedAt: Date.now()
      },
      note: 'Buyer confirmed account receipt - waiting for admin to release funds'
    });
  };

  // Admin releases funds to seller
  const releaseFunds = (escrowId) => {
    const transaction = escrowTransactions.find(t => t.id === escrowId);
    if (!transaction) return null;
    
    return updateEscrowStatus(escrowId, ESCROW_STATUS.COMPLETED, {
      releasedAt: Date.now(),
      releasedTo: transaction.sellerWallet,
      note: `Funds released to seller: ${transaction.sellerWallet}`
    });
  };

  // Cancel escrow transaction
  const cancelEscrow = (escrowId, reason) => {
    return updateEscrowStatus(escrowId, ESCROW_STATUS.CANCELLED, {
      cancelledAt: Date.now(),
      cancellationReason: reason,
      note: `Escrow cancelled: ${reason}`
    });
  };

  // Refund to buyer
  const refundToBuyer = (escrowId, reason) => {
    const transaction = escrowTransactions.find(t => t.id === escrowId);
    if (!transaction) return null;
    
    return updateEscrowStatus(escrowId, ESCROW_STATUS.REFUNDED, {
      refundedAt: Date.now(),
      refundedTo: transaction.buyerWallet,
      refundReason: reason,
      note: `Funds refunded to buyer: ${reason}`
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
      status: 'open',
      evidence: [],
      resolution: null
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
  const resolveDispute = (disputeId, resolution, favorBuyer = false) => {
    const updatedDisputes = pendingDisputes.map(dispute => {
      if (dispute.id === disputeId) {
        return { 
          ...dispute, 
          status: 'resolved', 
          resolution, 
          resolvedAt: Date.now(),
          resolvedInFavorOf: favorBuyer ? 'buyer' : 'seller'
        };
      }
      return dispute;
    });

    setPendingDisputes(updatedDisputes.filter(d => d.status !== 'resolved'));
    localStorage.setItem('pendingDisputes', JSON.stringify(updatedDisputes));

    const dispute = updatedDisputes.find(d => d.id === disputeId);
    if (dispute) {
      if (favorBuyer) {
        refundToBuyer(dispute.escrowId, `Dispute resolved in favor of buyer: ${resolution}`);
      } else {
        releaseFunds(dispute.escrowId);
      }
    }
  };

  // Get escrow transaction by ID
  const getEscrowById = (escrowId) => {
    return escrowTransactions.find(transaction => transaction.id === escrowId);
  };

  // Get escrow transactions by wallet
  const getEscrowByWallet = (walletAddress, role = 'both') => {
    if (role === 'buyer') {
      return escrowTransactions.filter(t => t.buyerWallet === walletAddress);
    } else if (role === 'seller') {
      return escrowTransactions.filter(t => t.sellerWallet === walletAddress);
    }
    return escrowTransactions.filter(t => 
      t.buyerWallet === walletAddress || t.sellerWallet === walletAddress
    );
  };

  // Check for expired payments
  const checkExpiredPayments = () => {
    const now = Date.now();
    const expired = escrowTransactions.filter(t => 
      t.status === ESCROW_STATUS.PENDING_PAYMENT && 
      t.paymentDeadline < now
    );
    
    expired.forEach(transaction => {
      cancelEscrow(transaction.id, 'Payment deadline expired');
    });
  };

  // Check for auto-release
  const checkAutoRelease = () => {
    const now = Date.now();
    const readyForRelease = escrowTransactions.filter(t => 
      t.status === ESCROW_STATUS.BUYER_CONFIRMED && 
      t.autoReleaseDate && 
      t.autoReleaseDate < now
    );
    
    readyForRelease.forEach(transaction => {
      releaseFunds(transaction.id);
    });
  };

  // Run periodic checks
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredPayments();
      checkAutoRelease();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [escrowTransactions]);

  // Get admin statistics
  const getAdminStats = () => {
    const totalTransactions = escrowTransactions.length;
    const completedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.COMPLETED).length;
    const activeTransactions = escrowTransactions.filter(t => 
      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
    ).length;
    const pendingPayments = escrowTransactions.filter(t => t.status === ESCROW_STATUS.PENDING_PAYMENT).length;
    const disputedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.DISPUTED).length;
    
    const totalVolume = escrowTransactions
      .filter(t => t.status === ESCROW_STATUS.COMPLETED)
      .reduce((sum, t) => sum + parseFloat(t.priceETH || 0), 0);

    const totalInEscrow = escrowTransactions
      .filter(t => [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status))
      .reduce((sum, t) => sum + parseFloat(t.priceETH || 0), 0);

    return {
      totalTransactions,
      completedTransactions,
      activeTransactions,
      pendingPayments,
      disputedTransactions,
      totalVolume,
      totalInEscrow,
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
    cancelEscrow,
    refundToBuyer,
    createDispute,
    resolveDispute,
    getEscrowById,
    getEscrowByWallet,
    getAdminStats,
    ESCROW_WALLET
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};