// src/components/BlockchainPaymentSystem.jsx - Real Blockchain Payment (Fixed)
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

// FIXED: Use the correct escrow wallet address
const ESCROW_WALLET = '0xE14fcb0fDb1256445DC6ddd876225a8fAd9D211F';

const BlockchainPaymentSystem = ({ order, onPaymentComplete, onCancel }) => {
  const { walletAddress } = useAuth();
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState('SEPOLIA'); // Default to testnet
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [walletBalance, setWalletBalance] = useState('0');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

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
      
      // Convert from Wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setWalletBalance(balanceInEth.toFixed(6));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (window.ethereum) {
      checkCurrentNetwork();
      getWalletBalance();
    }
  }, [walletAddress, getWalletBalance, checkCurrentNetwork]);

  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, paymentStatus]);

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
        // Network not added, try to add it
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
    
    try {
      // Convert ETH to Wei
      const amountInWei = '0x' + (parseFloat(order.totalPriceETH) * Math.pow(10, 18)).toString(16);
      
      const transactionParameters = {
        to: ESCROW_WALLET,
        from: walletAddress,
        value: amountInWei,
        gas: '0x5208', // 21000 gas limit for simple transfer
      };

      // Request transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setTransactionHash(txHash);
      setPaymentStep(3);
      
      // Monitor transaction status
      monitorTransaction(txHash);
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      setIsProcessing(false);
      
      if (error.code === 4001) {
        alert('Transaksi dibatalkan oleh user');
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
              amount: order.totalPriceETH,
              network: NETWORKS[selectedNetwork].name,
              status: 'confirmed'
            });
          } else {
            setPaymentStatus('failed');
            setIsProcessing(false);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Pilih Network Blockchain</h3>
        <p className="text-gray-600">Pilih network yang ingin digunakan untuk pembayaran</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Peringatan:</p>
            <p>Gunakan <strong>Sepolia Testnet</strong> untuk testing. Mainnet menggunakan ETH asli!</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(NETWORKS).map(([key, network]) => (
          <div
            key={key}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedNetwork === key 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedNetwork(key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={selectedNetwork === key}
                  readOnly
                  className="text-blue-600"
                />
                <div>
                  <h4 className="font-medium text-gray-800">{network.name}</h4>
                  <p className="text-sm text-gray-600">{network.symbol} • {
                    key === 'MAINNET' ? '⚠️ Live Network' : 
                    key === 'SEPOLIA' ? '🧪 Testnet (Recommended)' : 
                    '🔷 Layer 2'
                  }</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getNetworkColor(key)}`}>
                {key === 'MAINNET' ? 'LIVE' : key === 'SEPOLIA' ? 'TEST' : 'L2'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Current Network:</span>
          <span className="font-medium">{currentNetwork || 'Not Connected'}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-gray-600">Wallet Balance:</span>
          <span className="font-medium">{walletBalance} ETH</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Pembayaran</h3>
        <p className="text-gray-600">Review detail transaksi sebelum mengirim</p>
      </div>

      {/* Timer */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Selesaikan pembayaran dalam:</p>
        <p className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800">Detail Transaksi</h4>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Item:</span>
          <span className="font-medium">{order.title}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Harga:</span>
          <span className="font-medium">{order.totalPriceETH} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Gas:</span>
          <span className="font-medium">~0.002 ETH</span>
        </div>
        
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold text-gray-800">Total:</span>
          <span className="font-bold text-blue-600">
            {(parseFloat(order.totalPriceETH) + 0.002).toFixed(6)} ETH
          </span>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Payment Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">From:</span>
            <span className="font-mono text-blue-800">{walletAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">To (Escrow):</span>
            <span className="font-mono text-blue-800">{ESCROW_WALLET}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Network:</span>
            <span className="text-blue-800">{NETWORKS[selectedNetwork].name}</span>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      {parseFloat(walletBalance) < (parseFloat(order.totalPriceETH) + 0.002) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">⚠️ Insufficient Balance</p>
          <p className="text-red-700 text-sm">
            You need at least {(parseFloat(order.totalPriceETH) + 0.002).toFixed(6)} ETH
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setPaymentStep(1)}
          className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Back
        </button>
        <button
          onClick={sendPayment}
          disabled={parseFloat(walletBalance) < (parseFloat(order.totalPriceETH) + 0.002) || timeLeft === 0}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Send Payment
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Processing</h3>
        <p className="text-gray-600">Your transaction is being processed on the blockchain</p>
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
             paymentStatus === 'success' ? 'Payment Successful!' : 
             'Payment Failed'}
          </p>
          <p className="text-gray-600">
            {isProcessing ? 'Please wait while your transaction is confirmed' :
             paymentStatus === 'success' ? 'Your payment has been confirmed on the blockchain' :
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✅ Payment Completed</p>
          <p className="text-green-700 text-sm mt-1">
            Your escrow transaction has been created and the seller will be notified.
          </p>
          <p className="text-green-600 text-xs mt-2">
            Escrow Wallet: {ESCROW_WALLET}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Blockchain Payment</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl">
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= paymentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 ${
                    step < paymentStep ? 'bg-blue-600' : 'bg-gray-200'
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

export default BlockchainPaymentSystem;