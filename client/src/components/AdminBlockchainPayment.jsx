import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const NETWORKS = {
  MAINNET: {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io/tx/'
  },
  SEPOLIA: {
    chainId: '0xaa36a7',
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io/tx/'
  },
  POLYGON: {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    explorerUrl: 'https://polygonscan.com/tx/'
  }
};

const AdminBlockchainPayment = ({ transaction, action, onPaymentComplete, onCancel }) => {
  const { walletAddress } = useAuth();
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [walletBalance, setWalletBalance] = useState('0');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [canCancel, setCanCancel] = useState(true);

  // Debug logging
  console.log('🔍 AdminBlockchainPayment received:', {
    transaction,
    action,
    walletAddress
  });

  const isRefund = action === 'refund';
  
  // Handle different field names for wallet addresses
  const buyerWallet = transaction.buyerWallet || transaction.buyer_wallet;
  const sellerWallet = transaction.sellerWallet || transaction.seller_wallet;
  
  const recipientWallet = isRefund ? buyerWallet : sellerWallet;
  const recipientLabel = isRefund ? 'Buyer' : 'Seller';
  const paymentAmount = transaction.priceETH || transaction.amount;

  // Additional validation
  console.log('💰 Payment details:', {
    isRefund,
    recipientWallet,
    recipientLabel,
    paymentAmount,
    buyerWallet,
    sellerWallet,
    originalBuyerWallet: transaction.buyerWallet,
    originalSellerWallet: transaction.sellerWallet,
    originalBuyer_wallet: transaction.buyer_wallet,
    originalSeller_wallet: transaction.seller_wallet
  });

  // Early validation with fallback field names
  if (!transaction || !buyerWallet || !sellerWallet || !paymentAmount) {
    console.error('❌ Missing required transaction data:', {
      transaction: !!transaction,
      buyerWallet: !!buyerWallet,
      sellerWallet: !!sellerWallet,
      paymentAmount: !!paymentAmount,
      originalBuyerWallet: !!transaction?.buyerWallet,
      originalSellerWallet: !!transaction?.sellerWallet,
      originalBuyer_wallet: !!transaction?.buyer_wallet,
      originalSeller_wallet: !!transaction?.seller_wallet
    });
  }

  // Auto-detect network based on buyer's payment network
  const getPaymentNetwork = useCallback(() => {
    // Assuming transaction has a paymentNetwork field that stores the network used by buyer
    const buyerNetwork = transaction.paymentNetwork || transaction.network;
    
    // Map common network names to our NETWORKS object
    const networkMapping = {
      'ethereum': 'MAINNET',
      'mainnet': 'MAINNET',
      'sepolia': 'SEPOLIA',
      'polygon': 'POLYGON',
      'matic': 'POLYGON'
    };

    const normalizedNetwork = buyerNetwork?.toLowerCase();
    return networkMapping[normalizedNetwork] || 'SEPOLIA'; // Default to Sepolia if unknown
  }, [transaction]);

  const checkCurrentNetwork = useCallback(async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
      setCurrentNetwork(network ? network.name : 'Unknown Network');
    } catch (error) {
      console.error('Error checking network:', error);
    }
  }, []);

  const getWalletBalance = useCallback(async () => {
    try {
      if (!walletAddress) return;
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      });
      
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setWalletBalance(balanceInEth.toFixed(6));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  }, [walletAddress]);

  useEffect(() => {
    // Auto-set network based on buyer's payment
    const autoNetwork = getPaymentNetwork();
    setSelectedNetwork(autoNetwork);
    
    if (window.ethereum) {
      checkCurrentNetwork();
      getWalletBalance();
    }
  }, [walletAddress, checkCurrentNetwork, getWalletBalance, getPaymentNetwork]);

  const switchNetwork = async (networkKey) => {
    const network = NETWORKS[networkKey];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
      
      setSelectedNetwork(networkKey);
      setCurrentNetwork(network.name);
      getWalletBalance();
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: network.chainId,
              chainName: network.name,
              nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl]
            }]
          });
          setSelectedNetwork(networkKey);
          setCurrentNetwork(network.name);
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', error);
      }
    }
  };

  const sendPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setCanCancel(false); // Disable cancel during processing
    
    try {
      console.log('🚀 Starting payment process...');
      console.log('📋 Raw transaction data:', {
        transaction,
        action,
        walletAddress,
        recipientWallet,
        paymentAmount
      });

      // Validate recipient wallet address
      console.log('🔍 Validating recipient wallet:', recipientWallet);
      if (!recipientWallet) {
        throw new Error('Recipient wallet address is missing');
      }
      if (typeof recipientWallet !== 'string') {
        throw new Error('Recipient wallet address must be a string');
      }
      if (!recipientWallet.startsWith('0x')) {
        throw new Error('Recipient wallet address must start with 0x');
      }
      if (recipientWallet.length !== 42) {
        throw new Error(`Recipient wallet address must be 42 characters, got ${recipientWallet.length}`);
      }

      // Validate sender wallet address
      console.log('🔍 Validating sender wallet:', walletAddress);
      if (!walletAddress) {
        throw new Error('Sender wallet address is missing');
      }
      if (typeof walletAddress !== 'string') {
        throw new Error('Sender wallet address must be a string');
      }
      if (!walletAddress.startsWith('0x')) {
        throw new Error('Sender wallet address must start with 0x');
      }
      if (walletAddress.length !== 42) {
        throw new Error(`Sender wallet address must be 42 characters, got ${walletAddress.length}`);
      }

      // Convert ETH to Wei (ensure proper conversion)
      console.log('💰 Converting payment amount:', paymentAmount);
      const amountInEth = parseFloat(paymentAmount);
      if (isNaN(amountInEth)) {
        throw new Error(`Payment amount is not a valid number: ${paymentAmount}`);
      }
      if (amountInEth <= 0) {
        throw new Error(`Payment amount must be positive: ${amountInEth}`);
      }

      // Convert to Wei using simple and reliable method
      // For most practical amounts (< 1000 ETH), this will work fine
      const weiMultiplier = 1000000000000000000; // 10^18
      const amountInWei = Math.round(amountInEth * weiMultiplier);
      
      // Convert to hex string
      let amountInWeiHex;
      if (amountInWei === 0) {
        throw new Error('Payment amount converts to zero Wei');
      }
      
      // Use toString(16) for hex conversion
      amountInWeiHex = '0x' + amountInWei.toString(16);
      
      console.log('🔄 Payment conversion:', {
        amountInEth,
        weiMultiplier,
        amountInWei,
        amountInWeiHex,
        isSafeInteger: Number.isSafeInteger(amountInWei),
        // Test conversion back to ETH for verification
        backToEth: amountInWei / weiMultiplier
      });
      
      // Additional validation
      if (!Number.isSafeInteger(amountInWei)) {
        throw new Error(`Amount too large for safe conversion: ${amountInEth} ETH. Please use smaller amounts.`);
      }

      // Create transaction parameters with explicit validation
      // Use checksum addresses for better compatibility
      const checksumTo = recipientWallet; // Keep original case for checksum
      const checksumFrom = walletAddress; // Keep original case for checksum
      
      const transactionParameters = {
        to: checksumTo,
        from: checksumFrom,
        value: amountInWeiHex,
        // Remove gas parameter to let MetaMask estimate
        // gas: '0x5208', 
      };

      console.log('📤 Final transaction parameters:', transactionParameters);

      // Double-check parameters before sending
      if (!transactionParameters.to || transactionParameters.to.length !== 42) {
        throw new Error(`Invalid "to" address: ${transactionParameters.to}`);
      }
      if (!transactionParameters.from || transactionParameters.from.length !== 42) {
        throw new Error(`Invalid "from" address: ${transactionParameters.from}`);
      }
      if (!transactionParameters.value || transactionParameters.value === '0x0' || transactionParameters.value === '0x') {
        throw new Error(`Invalid "value": ${transactionParameters.value}`);
      }
      
      // Validate hex format
      if (!transactionParameters.value.startsWith('0x')) {
        throw new Error(`Value must be hex format: ${transactionParameters.value}`);
      }

      console.log('✅ All validations passed, checking MetaMask connection...');

      // Check if MetaMask is connected and on the right network
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('🔗 Connected accounts:', accounts);
      
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🌐 Current chain ID:', currentChainId);
      console.log('🎯 Expected chain ID:', NETWORKS[selectedNetwork].chainId);
      
      if (accounts.length === 0) {
        throw new Error('No MetaMask accounts connected');
      }
      
      if (currentChainId !== NETWORKS[selectedNetwork].chainId) {
        throw new Error(`Wrong network. Expected ${NETWORKS[selectedNetwork].name} (${NETWORKS[selectedNetwork].chainId}), but got ${currentChainId}`);
      }

      console.log('🚀 Sending transaction to MetaMask...');

      // Request transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log('✅ Transaction sent successfully:', txHash);
      setTransactionHash(txHash);
      setPaymentStep(3);
      
      // Monitor transaction status
      monitorTransaction(txHash);
      
    } catch (error) {
      console.error('❌ Payment error details:', {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      setPaymentStatus('failed');
      setIsProcessing(false);
      setCanCancel(true); // Re-enable cancel on error
      
      if (error.code === 4001) {
        alert('Transaksi dibatalkan oleh user');
      } else if (error.message.includes('Invalid transaction params')) {
        alert(`Parameter transaksi tidak valid: ${error.message}\n\nPastikan:\n- Alamat wallet benar\n- Saldo mencukupi\n- Network sesuai`);
      } else {
        alert('Gagal mengirim transaksi: ' + error.message);
      }
    }
  };

  const monitorTransaction = async (txHash) => {
    const checkTransaction = async () => {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });

        if (receipt) {
          if (receipt.status === '0x1') {
            setPaymentStatus('success');
            setIsProcessing(false);
            
            // Call parent component with payment data
            onPaymentComplete({
              transactionHash: txHash,
              amount: paymentAmount,
              network: NETWORKS[selectedNetwork].name,
              status: 'confirmed',
              recipient: recipientWallet,
              action: action
            });
          } else {
            setPaymentStatus('failed');
            setIsProcessing(false);
            setCanCancel(true); // Re-enable cancel on failure
          }
        } else {
          // Transaction still pending, check again in 5 seconds
          setTimeout(checkTransaction, 5000);
        }
      } catch (error) {
        console.error('Error checking transaction:', error);
        setTimeout(checkTransaction, 5000);
      }
    };

    checkTransaction();
  };

  const handleCancel = () => {
    if (canCancel) {
      onCancel();
    }
  };

  const getNetworkColor = (networkKey) => {
    switch (networkKey) {
      case 'MAINNET': return 'text-red-600 bg-red-50';
      case 'SEPOLIA': return 'text-blue-600 bg-blue-50';
      case 'POLYGON': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Network Pembayaran</h3>
        <p className="text-gray-600">Network otomatis dipilih berdasarkan pembayaran buyer</p>
      </div>

      {/* Auto-selected Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Network Otomatis Dipilih:</p>
            <p>Buyer membayar menggunakan <strong>{NETWORKS[selectedNetwork]?.name}</strong></p>
            <p className="mt-1">Admin akan melakukan {isRefund ? 'refund' : 'pembayaran'} menggunakan network yang sama.</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Peringatan Admin:</p>
            <p>Anda akan mentransfer <strong>{paymentAmount} ETH</strong> ke {recipientLabel}</p>
            <p className="mt-1">Pastikan wallet admin memiliki saldo yang cukup di network <strong>{NETWORKS[selectedNetwork]?.name}</strong>.</p>
          </div>
        </div>
      </div>

      {/* Selected Network Display */}
      <div className="space-y-3">
        <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{NETWORKS[selectedNetwork]?.name}</h4>
                <p className="text-sm text-gray-600">{NETWORKS[selectedNetwork]?.symbol} • {
                  selectedNetwork === 'MAINNET' ? '⚠️ Live Network' : 
                  selectedNetwork === 'SEPOLIA' ? '🧪 Testnet (Auto-Selected)' : 
                  '🔷 Layer 2 (Auto-Selected)'
                }</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getNetworkColor(selectedNetwork)}`}>
              AUTO-SELECTED
            </span>
          </div>
        </div>

        {/* Option to change network manually */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            🔧 Ganti Network Manual (Tidak Disarankan)
          </summary>
          <div className="mt-3 space-y-2">
            {Object.entries(NETWORKS).map(([key, network]) => (
              key !== selectedNetwork && (
                <div
                  key={key}
                  className="border rounded-lg p-3 cursor-pointer hover:border-gray-300 transition-all"
                  onClick={() => setSelectedNetwork(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="network-override"
                        className="text-blue-600"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{network.name}</h4>
                        <p className="text-sm text-gray-600">{network.symbol}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getNetworkColor(key)}`}>
                      {key === 'MAINNET' ? 'LIVE' : key === 'SEPOLIA' ? 'TEST' : 'L2'}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        </details>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Current Network:</span>
          <span className="font-medium">{currentNetwork || 'Not Connected'}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-600">Admin Wallet Balance:</span>
          <span className="font-medium">{walletBalance} ETH</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={!canCancel}
          className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canCancel ? 'Cancel' : 'Processing...'}
        </button>
        <button
          onClick={() => {
            if (selectedNetwork) {
              switchNetwork(selectedNetwork);
              setPaymentStep(2);
            }
          }}
          disabled={!selectedNetwork}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Konfirmasi {isRefund ? 'Refund' : 'Pembayaran'}
        </h3>
        <p className="text-gray-600">Review detail transaksi sebelum mengirim</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800">Detail Transaksi</h4>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Item:</span>
          <span className="font-medium">{transaction.accountTitle}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Game:</span>
          <span className="font-medium">{transaction.gameName}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Jumlah Transfer:</span>
          <span className="font-medium">{paymentAmount} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Gas:</span>
          <span className="font-medium">~0.002 ETH</span>
        </div>
        
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-gray-800">Total dari Admin Wallet:</span>
          <span className="font-bold text-blue-600">
            {(parseFloat(paymentAmount) + 0.002).toFixed(6)} ETH
          </span>
        </div>
      </div>

      {/* Admin Payment Info */}
      <div className={`${isRefund ? 'bg-red-50' : 'bg-blue-50'} rounded-lg p-4`}>
        <h4 className={`font-semibold ${isRefund ? 'text-red-800' : 'text-blue-800'} mb-2`}>
          Admin Payment Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={isRefund ? 'text-red-700' : 'text-blue-700'}>From (Admin):</span>
            <span className={`font-mono ${isRefund ? 'text-red-800' : 'text-blue-800'}`}>
              {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isRefund ? 'text-red-700' : 'text-blue-700'}>
              To ({recipientLabel}):
            </span>
            <span className={`font-mono ${isRefund ? 'text-red-800' : 'text-blue-800'}`}>
              {recipientWallet?.substring(0, 6)}...{recipientWallet?.substring(recipientWallet.length - 4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isRefund ? 'text-red-700' : 'text-blue-700'}>Network:</span>
            <span className={isRefund ? 'text-red-800' : 'text-blue-800'}>
              {NETWORKS[selectedNetwork].name}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Responsibility Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">⚠️ Admin Responsibility</p>
        <p className="text-yellow-700 text-sm">
          Sebagai admin, Anda bertanggung jawab untuk memastikan {isRefund ? 'refund' : 'pembayaran'} ini valid.
          {isRefund 
            ? ' Pastikan dispute telah diverifikasi sebelum melakukan refund.'
            : ' Pastikan buyer telah mengkonfirmasi penerimaan akun.'}
        </p>
      </div>

      {/* Balance Check */}
      {parseFloat(walletBalance) < (parseFloat(paymentAmount) + 0.002) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">⚠️ Insufficient Balance</p>
          <p className="text-red-700 text-sm">
            Admin wallet membutuhkan minimal {(parseFloat(paymentAmount) + 0.002).toFixed(6)} ETH
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setPaymentStep(1)}
          disabled={!canCancel}
          className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handleCancel}
          disabled={!canCancel}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={sendPayment}
          disabled={parseFloat(walletBalance) < (parseFloat(paymentAmount) + 0.002)}
          className={`flex-1 px-4 py-3 rounded-lg transition font-semibold ${
            isRefund 
              ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400'
              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
          } disabled:cursor-not-allowed`}
        >
          {isRefund ? '💸 Refund to Buyer' : '💰 Pay to Seller'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Admin Payment Processing
        </h3>
        <p className="text-gray-600">
          {isRefund ? 'Refund' : 'Pembayaran'} sedang diproses di blockchain
        </p>
      </div>

      {/* Status Indicator */}
      <div className="flex flex-col items-center gap-4">
        {isProcessing ? (
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        ) : paymentStatus === 'success' ? (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        <div>
          <p className="font-semibold text-lg">
            {isProcessing ? 'Processing...' : 
             paymentStatus === 'success' ? `${isRefund ? 'Refund' : 'Payment'} Successful!` : 
             'Payment Failed'}
          </p>
          <p className="text-gray-600">
            {isProcessing ? 'Please wait while your transaction is confirmed' :
             paymentStatus === 'success' ? `${isRefund ? 'Refund' : 'Payment'} has been confirmed on the blockchain` :
             'There was an error processing your payment'}
          </p>
        </div>
      </div>

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Transaction Hash:</h4>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-600 break-all">{transactionHash}</span>
            <button
              onClick={() => {
                const url = NETWORKS[selectedNetwork].explorerUrl + transactionHash;
                window.open(url, '_blank');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View on Explorer
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className={`${isRefund ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
          <p className={`${isRefund ? 'text-red-800' : 'text-green-800'} font-medium`}>
            {isRefund ? '↩️ Refund Completed' : '✅ Payment Completed'}
          </p>
          <p className={`${isRefund ? 'text-red-700' : 'text-green-700'} text-sm mt-1`}>
            {isRefund 
              ? `Dana sebesar ${paymentAmount} ETH telah dikembalikan ke buyer.`
              : `Dana sebesar ${paymentAmount} ETH telah dibayarkan ke seller.`}
          </p>
          <p className={`${isRefund ? 'text-red-600' : 'text-green-600'} text-xs mt-2`}>
            Recipient: {recipientWallet}
          </p>
        </div>
      )}

      {/* Cancel/Close Button for final step */}
      {paymentStatus === 'success' || paymentStatus === 'failed' ? (
        <button
          onClick={handleCancel}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Close
        </button>
      ) : (
        <button
          onClick={handleCancel}
          disabled={!canCancel}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canCancel ? 'Cancel Payment' : 'Processing...'}
        </button>
      )}
    </div>
  );

  // Show error if transaction data is invalid
  if (!transaction || !buyerWallet || !sellerWallet || !paymentAmount) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-800 mb-4">Error: Data Transaksi Tidak Valid</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">
                Data transaksi yang diperlukan tidak lengkap:
              </p>
              <ul className="text-red-600 text-xs mt-2 space-y-1">
                {!transaction && <li>• Transaction object missing</li>}
                {!buyerWallet && <li>• Buyer wallet address missing (checked: buyerWallet, buyer_wallet)</li>}
                {!sellerWallet && <li>• Seller wallet address missing (checked: sellerWallet, seller_wallet)</li>}
                {!paymentAmount && <li>• Payment amount missing (checked: priceETH, amount)</li>}
              </ul>
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                <p className="font-medium">Debug Info:</p>
                <p>buyerWallet: {buyerWallet || 'null'}</p>
                <p>sellerWallet: {sellerWallet || 'null'}</p>
                <p>paymentAmount: {paymentAmount || 'null'}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Admin {isRefund ? 'Refund' : 'Payment'} System
            </h2>
            <button 
              onClick={handleCancel} 
              disabled={!canCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= paymentStep 
                    ? isRefund ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 ${
                    step < paymentStep 
                      ? isRefund ? 'bg-red-600' : 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {paymentStep === 1 && renderStep1()}
          {paymentStep === 2 && renderStep2()}
          {paymentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default AdminBlockchainPayment;