// src/context/AdminContext.jsx - Database Connected Version
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { escrowAPI } from '../services/api';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWalletAddress, setCurrentWalletAddress] = useState(null);

  // Load escrow transactions from database
  const loadEscrowTransactions = useCallback(async (walletAddress = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {};
      if (walletAddress) {
        filters.wallet_address = walletAddress;
      }
      
      const response = await escrowAPI.getTransactions(filters);
      
      if (response.success) {
        // Transform database transactions to match component expectations
        const transformedTransactions = (response.transactions || []).map(t => {
          // Safe JSON parsing helper
          const parseJsonSafely = (jsonData, defaultValue = null) => {
            if (!jsonData) return defaultValue;
            if (typeof jsonData === 'object') return jsonData; // Already parsed
            try {
              return JSON.parse(jsonData);
            } catch (error) {
              console.error('Error parsing JSON:', error.message, 'Data:', jsonData);
              return defaultValue;
            }
          };

          // Transform database fields to frontend fields
          return {
            id: t.id || '',
            accountTitle: t.account_title || 'Unknown Account',
            gameName: t.game_name || 'Unknown Game',
            priceETH: t.amount || 0,
            amount: t.amount || 0, // Keep both for compatibility
            sellerWallet: t.seller_wallet || '',
            buyerWallet: t.buyer_wallet || '',
            status: t.status || ESCROW_STATUS.PENDING_PAYMENT,
            createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
            timeline: parseJsonSafely(t.timeline, []),
            deliveryProof: parseJsonSafely(t.delivery_proof, null),
            buyerConfirmation: parseJsonSafely(t.buyer_confirmation, null),
            accountDetails: parseJsonSafely(t.account_details, null),
            paymentHash: t.payment_hash || null,
            disputeReason: t.dispute_reason || null,
            disputeId: t.dispute_id || null,
            adminPaymentHash: t.admin_payment_hash || null
          };
        });

        console.log('🔄 Transformed transactions:', transformedTransactions);
        setEscrowTransactions(transformedTransactions);
      } else {
        setError('Failed to load escrow transactions');
      }
    } catch (error) {
      console.error('Error loading escrow transactions:', error);
      setError('Failed to load escrow transactions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadEscrowTransactions();
  }, [loadEscrowTransactions]);

  const checkAdminStatus = (walletAddress) => {
    console.log('🔍 Checking admin status for:', walletAddress);
    console.log('📋 Admin wallets:', ADMIN_WALLETS);
    
    const isAdminWallet = ADMIN_WALLETS.map(addr => addr.toLowerCase()).includes(walletAddress.toLowerCase());
    console.log('✅ Is admin:', isAdminWallet);
    
    setIsAdmin(isAdminWallet);
    setCurrentWalletAddress(walletAddress);
    return isAdminWallet;
  };

  const createEscrowTransaction = async (orderData) => {
    try {
      console.log('🔄 Creating escrow transaction in database:', orderData);
      
      const escrowData = {
        accountId: orderData.accountId,
        accountTitle: orderData.title,
        gameName: orderData.gameName,
        sellerWallet: orderData.sellerWallet,
        buyerWallet: orderData.buyerWallet,
        amount: orderData.totalPriceETH,
        currency: 'ETH',
        amountIdr: parseFloat(orderData.priceIDR.replace(/[^0-9]/g, '')),
        exchangeRate: 50000000, // ETH to IDR rate
        paymentHash: orderData.paymentHash || null,
        network: orderData.network || 'Ethereum',
        accountDetails: {
          level: orderData.level,
          rank: orderData.rank,
          description: orderData.description,
          image: orderData.image
        }
      };

      const response = await escrowAPI.create(escrowData);
      
      if (response.success) {
        console.log('✅ Escrow transaction created in database:', response.escrow_id);
        
        // Reload transactions to get updated list
        await loadEscrowTransactions();
        
        return {
          id: response.escrow_id,
          ...response.escrow
        };
      } else {
        throw new Error(response.message || 'Failed to create escrow transaction');
      }
    } catch (error) {
      console.error('❌ Error creating escrow transaction:', error);
      throw error;
    }
  };

  const confirmPaymentReceived = async (escrowId, paymentHash, adminWallet) => {
    try {
      console.log('🔄 Confirming payment in database:', escrowId);
      
      const response = await escrowAPI.confirmPayment(escrowId, {
        payment_hash: paymentHash,
        admin_wallet: adminWallet
      });
      
      if (response.success) {
        console.log('✅ Payment confirmed in database:', escrowId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      throw error;
    }
  };

  const deliverAccount = async (escrowId, deliveryData) => {
    try {
      console.log('🔄 Delivering account in database:', escrowId);
      console.log('📦 Delivery data:', deliveryData);
      console.log('🌐 API URL will be:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/escrow/${escrowId}/deliver`);
      
      const response = await escrowAPI.deliverAccount(escrowId, {
        delivery_data: deliveryData
      });
      
      if (response.success) {
        console.log('✅ Account delivered in database:', escrowId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to deliver account');
      }
    } catch (error) {
      console.error('❌ Error delivering account:', error);
      console.error('❌ Error details:', {
        escrowId,
        deliveryData,
        error: error.message
      });
      throw error;
    }
  };

  const confirmReceipt = async (escrowId, confirmationData) => {
    try {
      console.log('🔄 Confirming receipt in database:', escrowId);
      
      const response = await escrowAPI.confirmReceipt(escrowId, {
        confirmation_data: confirmationData
      });
      
      if (response.success) {
        console.log('✅ Receipt confirmed in database:', escrowId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to confirm receipt');
      }
    } catch (error) {
      console.error('❌ Error confirming receipt:', error);
      throw error;
    }
  };

  const createDispute = async (escrowId, reason, disputeBy) => {
    try {
      console.log('🔄 Creating dispute in database:', escrowId);
      
      const response = await escrowAPI.createDispute(escrowId, {
        reason: reason,
        dispute_by: disputeBy
      });
      
      if (response.success) {
        console.log('⚠️ Dispute created in database:', escrowId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('❌ Error creating dispute:', error);
      throw error;
    }
  };

  const releaseFunds = async (escrowId, adminPaymentHash) => {
    try {
      console.log('🔄 Releasing funds in database:', escrowId);
      
      const response = await escrowAPI.releaseFunds(escrowId, {
        admin_payment_hash: adminPaymentHash,
        admin_wallet: currentWalletAddress
      });
      
      if (response.success) {
        console.log('✅ Funds released in database:', escrowId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to release funds');
      }
    } catch (error) {
      console.error('❌ Error releasing funds:', error);
      throw error;
    }
  };

  const resolveDispute = async (disputeId, resolution, refund = false, adminPaymentHash = null) => {
    try {
      console.log('🔄 Resolving dispute in database:', disputeId);
      
      const response = await escrowAPI.resolveDispute(disputeId, {
        resolution: resolution,
        refund: refund,
        admin_payment_hash: adminPaymentHash,
        admin_wallet: currentWalletAddress
      });
      
      if (response.success) {
        console.log('⚖️ Dispute resolved in database:', disputeId);
        await loadEscrowTransactions();
      } else {
        throw new Error(response.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('❌ Error resolving dispute:', error);
      throw error;
    }
  };

  const getAdminStats = () => {
    const totalTransactions = escrowTransactions.length;
    const activeTransactions = escrowTransactions.filter(t => 
      [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status)
    ).length;
    const pendingPayments = escrowTransactions.filter(t => t.status === ESCROW_STATUS.PENDING_PAYMENT).length;
    const disputedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.DISPUTED).length;
    const completedTransactions = escrowTransactions.filter(t => t.status === ESCROW_STATUS.COMPLETED).length;
    
    const totalVolume = escrowTransactions.reduce((sum, tx) => sum + parseFloat(tx.priceETH || tx.amount || 0), 0);
    const totalInEscrow = escrowTransactions
      .filter(t => [ESCROW_STATUS.PAYMENT_RECEIVED, ESCROW_STATUS.ACCOUNT_DELIVERED, ESCROW_STATUS.BUYER_CONFIRMED].includes(t.status))
      .reduce((sum, tx) => sum + parseFloat(tx.priceETH || tx.amount || 0), 0);

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
    isLoading,
    error,
    ESCROW_WALLET,
    checkAdminStatus,
    createEscrowTransaction,
    confirmPaymentReceived,
    loadEscrowTransactions,
    // TODO: Update these functions to use database API
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