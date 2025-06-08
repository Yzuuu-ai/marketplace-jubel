// src/context/AdminContext.jsx - Updated dengan admin wallet dan payment hash
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminContext = createContext();

// Escrow status constants
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
  [ESCROW_STATUS.BUYER_CONFIRMED]: 'Buyer Konfirmasi',
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
  [ESCROW_STATUS.REFUNDED]: 'bg-orange-500',
  [ESCROW_STATUS.CANCELLED]: 'bg-gray-500'
};

// UPDATED: Tambahkan wallet admin Anda
const ADMIN_WALLETS = [
  '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f'
];

// Escrow wallet (menggunakan admin wallet Anda)
export const ESCROW_WALLET = '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f';

const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [escrowTransactions, setEscrowTransactions] = useState([]);

  const checkAutoRelease = useCallback(() => {
    const now = Date.now();
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    let hasUpdates = false;

    const updatedTransactions = transactions.map(tx => {
      if (tx.status === ESCROW_STATUS.BUYER_CONFIRMED) {
        const confirmedTime = tx.timeline.find(t => t.status === ESCROW_STATUS.BUYER_CONFIRMED)?.timestamp;
        if (confirmedTime && (now - confirmedTime) > 24 * 60 * 60 * 1000) { // 24 hours
          hasUpdates = true;
          return {
            ...tx,
            status: ESCROW_STATUS.COMPLETED,
            releasedAt: now,
            timeline: [
              ...tx.timeline,
              {
                status: ESCROW_STATUS.COMPLETED,
                timestamp: now,
                note: 'Auto-released after 24 hours'
              }
            ]
          };
        }
      }
      return tx;
    });

    if (hasUpdates) {
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      setEscrowTransactions(updatedTransactions);
    }
  }, []);

  const checkExpiredPayments = useCallback(() => {
    const now = Date.now();
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    let hasUpdates = false;

    const updatedTransactions = transactions.map(tx => {
      if (tx.status === ESCROW_STATUS.PENDING_PAYMENT && (now - tx.createdAt) > 24 * 60 * 60 * 1000) {
        hasUpdates = true;
        return {
          ...tx,
          status: ESCROW_STATUS.CANCELLED,
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.CANCELLED,
              timestamp: now,
              note: 'Cancelled due to payment timeout'
            }
          ]
        };
      }
      return tx;
    });

    if (hasUpdates) {
      localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
      setEscrowTransactions(updatedTransactions);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const savedTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    setEscrowTransactions(savedTransactions);
  }, []);

  // Auto-check for expired payments and auto-release
  useEffect(() => {
    const interval = setInterval(() => {
      checkAutoRelease();
      checkExpiredPayments();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAutoRelease, checkExpiredPayments]);

  const checkAdminStatus = (walletAddress) => {
    console.log('🔍 Checking admin status for:', walletAddress);
    console.log('📋 Admin wallets:', ADMIN_WALLETS);
    
    const isAdminWallet = ADMIN_WALLETS.map(addr => addr.toLowerCase()).includes(walletAddress.toLowerCase());
    console.log('✅ Is admin:', isAdminWallet);
    
    setIsAdmin(isAdminWallet);
    return isAdminWallet;
  };

  const createEscrowTransaction = (orderData) => {
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const escrowTransaction = {
      id: escrowId,
      accountTitle: orderData.title,
      gameName: orderData.gameName,
      priceETH: orderData.totalPriceETH,
      priceIDR: orderData.priceIDR,
      sellerWallet: orderData.sellerWallet,
      buyerWallet: orderData.buyerWallet,
      escrowWallet: ESCROW_WALLET,
      status: ESCROW_STATUS.PENDING_PAYMENT,
      createdAt: Date.now(),
      paymentHash: orderData.paymentHash || null,
      network: orderData.network || 'Unknown',
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
          note: 'Escrow transaction created, waiting for admin payment confirmation'
        }
      ]
    };

    // If payment hash exists, automatically confirm payment
    if (orderData.paymentHash) {
      escrowTransaction.status = ESCROW_STATUS.PAYMENT_RECEIVED;
      escrowTransaction.paymentHash = orderData.paymentHash;
      escrowTransaction.timeline.push({
        status: ESCROW_STATUS.PAYMENT_RECEIVED,
        timestamp: Date.now() + 1000,
        note: `Payment received to escrow wallet. Hash: ${orderData.paymentHash}`
      });
    }

    const existingTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = [...existingTransactions, escrowTransaction];
    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);

    // Mark account as in escrow
    const accounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const updatedAccounts = accounts.map(acc => 
      acc.id === orderData.accountId 
        ? { ...acc, isInEscrow: true, escrowId: escrowId }
        : acc
    );
    localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));

    console.log('✅ Escrow transaction created:', escrowId);
    return escrowTransaction;
  };

  const confirmPaymentReceived = (escrowId, paymentHash) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === escrowId) {
        return {
          ...tx,
          status: ESCROW_STATUS.PAYMENT_RECEIVED,
          paymentHash,
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.PAYMENT_RECEIVED,
              timestamp: Date.now(),
              note: 'Payment confirmed by admin'
            }
          ]
        };
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('✅ Payment confirmed for escrow:', escrowId);
  };

  const deliverAccount = (escrowId, deliveryData) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === escrowId) {
        return {
          ...tx,
          status: ESCROW_STATUS.ACCOUNT_DELIVERED,
          deliveryProof: {
            ...deliveryData,
            deliveredAt: Date.now()
          },
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.ACCOUNT_DELIVERED,
              timestamp: Date.now(),
              note: 'Account details delivered to buyer'
            }
          ]
        };
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('✅ Account delivered for escrow:', escrowId);
  };

  const confirmReceipt = (escrowId, confirmationData) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === escrowId) {
        return {
          ...tx,
          status: ESCROW_STATUS.BUYER_CONFIRMED,
          buyerConfirmation: {
            ...confirmationData,
            confirmedAt: Date.now()
          },
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.BUYER_CONFIRMED,
              timestamp: Date.now(),
              note: confirmationData.satisfied 
                ? 'Buyer confirmed receipt - satisfied'
                : 'Buyer confirmed receipt with notes'
            }
          ]
        };
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('✅ Receipt confirmed for escrow:', escrowId);
  };

  const createDispute = (escrowId, reason, disputeBy) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === escrowId) {
        return {
          ...tx,
          status: ESCROW_STATUS.DISPUTED,
          disputeReason: reason,
          disputeBy,
          disputeId: `dispute_${Date.now()}`,
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.DISPUTED,
              timestamp: Date.now(),
              note: `Dispute created by ${disputeBy}: ${reason}`
            }
          ]
        };
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('⚠️ Dispute created for escrow:', escrowId);
  };

  const releaseFunds = (escrowId, adminPaymentHash) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === escrowId) {
        const completedTx = {
          ...tx,
          status: ESCROW_STATUS.COMPLETED,
          releasedAt: Date.now(),
          adminPaymentHash: adminPaymentHash, // Track admin's payment to seller
          timeline: [
            ...tx.timeline,
            {
              status: ESCROW_STATUS.COMPLETED,
              timestamp: Date.now(),
              note: `Funds released to seller by admin. Payment hash: ${adminPaymentHash}`
            }
          ]
        };

        // Mark the sold account
        const accounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
        const updatedAccounts = accounts.map(acc => 
          acc.escrowId === escrowId 
            ? { 
                ...acc, 
                isSold: true, 
                isInEscrow: false,
                soldAt: Date.now(),
                buyerWallet: tx.buyerWallet,
                buyerName: `Buyer-${tx.buyerWallet.substring(0, 6)}`
              }
            : acc
        );
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));

        return completedTx;
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('💰 Funds released for escrow:', escrowId);
  };

  const resolveDispute = (disputeId, resolution, refund = false, adminPaymentHash = null) => {
    const transactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const updatedTransactions = transactions.map(tx => {
      if (tx.disputeId === disputeId || tx.id === disputeId) {
        const newStatus = refund ? ESCROW_STATUS.REFUNDED : ESCROW_STATUS.COMPLETED;
        const resolvedTx = {
          ...tx,
          status: newStatus,
          disputeResolution: resolution,
          resolvedAt: Date.now(),
          adminPaymentHash: adminPaymentHash, // Track admin's payment
          timeline: [
            ...tx.timeline,
            {
              status: newStatus,
              timestamp: Date.now(),
              note: `Dispute resolved: ${resolution}${adminPaymentHash ? `. Payment hash: ${adminPaymentHash}` : ''}`
            }
          ]
        };

        // Update account status
        const accounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
        const updatedAccounts = accounts.map(acc => 
          acc.escrowId === tx.id 
            ? { 
                ...acc, 
                isSold: !refund,
                isInEscrow: false,
                ...(refund ? {} : {
                  soldAt: Date.now(),
                  buyerWallet: tx.buyerWallet,
                  buyerName: `Buyer-${tx.buyerWallet.substring(0, 6)}`
                })
              }
            : acc
        );
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));

        return resolvedTx;
      }
      return tx;
    });

    localStorage.setItem('escrowTransactions', JSON.stringify(updatedTransactions));
    setEscrowTransactions(updatedTransactions);
    console.log('⚖️ Dispute resolved:', disputeId);
  };

  const getAdminStats = () => {
    const totalTransactions = escrowTransactions.length;
    const activeTransactions = escrowTransactions.filter(t => 
      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
    ).length;
    const pendingPayments = escrowTransactions.filter(t => t.status === ESCROW_STATUS.PENDING_PAYMENT).length;
    const disputedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.DISPUTED).length;
    const completedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.COMPLETED).length;
    
    const totalVolume = escrowTransactions.reduce((sum, tx) => sum + parseFloat(tx.priceETH || 0), 0);
    const totalInEscrow = escrowTransactions
      .filter(t => [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status))
      .reduce((sum, tx) => sum + parseFloat(tx.priceETH || 0), 0);

    return {
      totalTransactions,
      activeTransactions,
      pendingPayments,
      disputedTransactions,
      completedTransactions,
      totalVolume,
      totalInEscrow
    };
  };

  const value = {
    isAdmin,
    escrowTransactions,
    ESCROW_WALLET,
    checkAdminStatus,
    createEscrowTransaction,
    confirmPaymentReceived,
    deliverAccount,
    confirmReceipt,
    createDispute,
    releaseFunds,
    resolveDispute,
    getAdminStats
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export { AdminProvider };
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};