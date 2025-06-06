import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';

// Data game untuk filter
const gameList = [
  { id: 1, name: 'Mobile Legends' },
  { id: 2, name: 'PUBG Mobile' },
  { id: 3, name: 'Free Fire' },
  { id: 4, name: 'Genshin Impact' },
];

// Generate unique ID for orders
const generateOrderId = () => {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Komponen Modal Detail Pembayaran
const PaymentDetailModal = ({ account, onClose, onConfirm }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [selectedPayment, setSelectedPayment] = useState('');
  const { ESCROW_WALLET } = useAdmin();

  const paymentMethods = [
    { 
      id: 'ethereum', 
      name: 'Ethereum (ETH)', 
      fee: 0.002, // Gas fee dalam ETH
      address: ESCROW_WALLET, // Use escrow wallet
      network: 'Ethereum Mainnet',
      minConfirmations: 12
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price) => {
    return parseFloat(price.replace(/[^\d.]/g, ''));
  };

  // Convert IDR to ETH (example rate: 1 ETH = 50,000,000 IDR)
  const convertToETH = (idrPrice) => {
    const ethRate = 50000000; // 1 ETH = 50 juta IDR
    return (idrPrice / ethRate).toFixed(6);
  };

  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPayment);
  const basePriceIDR = formatPrice(account.price);
  const basePriceETH = parseFloat(convertToETH(basePriceIDR));
  const fee = selectedPaymentMethod ? selectedPaymentMethod.fee : 0;
  const totalPriceETH = basePriceETH + fee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Detail Pembayaran - Escrow</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Escrow Notice */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Pembayaran Aman dengan Escrow</p>
              <p>Dana Anda akan disimpan di escrow wallet hingga Anda mengkonfirmasi penerimaan akun.</p>
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Detail Item</h3>
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
              {account.image ? (
                <img src={account.image} alt={account.title} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-gray-600 font-bold">
                  {account.gameName?.charAt(0) || 'G'}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">{account.title}</p>
              <p className="text-sm text-gray-600">{account.gameName}</p>
            </div>
          </div>
          {account.level && <p className="text-sm"><span className="font-medium">Level:</span> {account.level}</p>}
          {account.rank && <p className="text-sm"><span className="font-medium">Rank:</span> {account.rank}</p>}
          <p className="text-sm mt-2"><span className="font-medium">Penjual:</span> {account.sellerName}</p>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-4">
          <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label key={method.id} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={selectedPayment === method.id}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="mr-3 mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{method.name}</span>
                    <span className="text-sm text-gray-500">
                      Gas Fee: {method.fee} ETH
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Network:</span> {method.network}</p>
                    <p><span className="font-medium">Escrow Address:</span> 
                      <span className="font-mono text-xs break-all ml-1">{method.address}</span>
                    </p>
                    <p><span className="font-medium">Min Confirmations:</span> {method.minConfirmations}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-3">Rincian Harga</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Harga Item</span>
              <div className="text-right">
                <div>Rp {basePriceIDR.toLocaleString('id-ID')}</div>
                <div className="text-sm text-gray-500">{basePriceETH} ETH</div>
              </div>
            </div>
            {selectedPaymentMethod && (
              <div className="flex justify-between">
                <span>Gas Fee ({selectedPaymentMethod.name})</span>
                <span>{fee} ETH</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <div className="text-right">
                <div className="text-blue-600">{totalPriceETH.toFixed(6)} ETH</div>
                <div className="text-sm text-gray-500">
                  ≈ Rp {(totalPriceETH * 50000000).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow Process */}
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2 text-green-800">Proses Escrow</h3>
          <div className="text-sm text-green-700 space-y-2">
            <div className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Transfer ETH ke alamat escrow di atas</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Admin verifikasi pembayaran Anda</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Penjual kirim detail akun</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Anda verifikasi akun diterima</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Dana dirilis ke penjual</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <p className="text-red-600 font-medium text-center">
            Selesaikan pembayaran dalam: {formatTime(timeLeft)}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / (15 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 font-medium"
          >
            Batal
          </button>
          <button 
            onClick={() => onConfirm(selectedPaymentMethod, totalPriceETH, account)}
            disabled={timeLeft === 0 || !selectedPayment}
            className={`flex-1 px-4 py-3 rounded-lg font-medium ${
              timeLeft > 0 && selectedPayment
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-400 cursor-not-allowed text-white'
            }`}
          >
            {timeLeft > 0 ? 'Saya Sudah Transfer' : 'Waktu Habis'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen Success Modal
const SuccessModal = ({ message, onClose, onNavigate }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Berhasil!</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="space-y-2">
            <button
              onClick={onNavigate}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Lihat Status Escrow
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const gameIdParam = queryParams.get('game');
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [selectedGame, setSelectedGame] = useState(gameIdParam ? parseInt(gameIdParam) : 0);
  const { isAuthenticated, walletAddress } = useAuth();
  const { createEscrowTransaction } = useAdmin();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Dapatkan data akun dari localStorage
  const getGameAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('gameAccounts');
      return savedAccounts ? JSON.parse(savedAccounts) : [];
    } catch (error) {
      console.error('Error parsing game accounts:', error);
      return [];
    }
  };

  // Filter akun berdasarkan game yang dipilih
  useEffect(() => {
    const allAccounts = getGameAccounts();
    
    // Filter out sold accounts and accounts in escrow
    const availableAccounts = allAccounts.filter(account => 
      !account.isSold && !account.isInEscrow
    );

    if (selectedGame === 0) {
      setFilteredAccounts(availableAccounts);
    } else {
      const filtered = availableAccounts.filter(account => account.gameId === selectedGame);
      setFilteredAccounts(filtered);
    }
  }, [selectedGame]);

  useEffect(() => {
    if (gameIdParam) {
      setSelectedGame(parseInt(gameIdParam));
    }
  }, [gameIdParam]);

  const handleGameFilter = (gameId) => {
    setSelectedGame(gameId);
  };

  const handleBuyClick = (account) => {
    if (!isAuthenticated) {
      setSuccessMessage('Silakan login terlebih dahulu untuk melakukan pembelian');
      setShowSuccessModal(true);
      return;
    }
    setSelectedAccount(account);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (paymentMethod, totalPriceETH, account) => {
    try {
      // Create order data
      const orderData = {
        id: generateOrderId(),
        accountId: account.id,
        title: account.title,
        gameName: gameList.find(g => g.id === account.gameId)?.name || '',
        level: account.level,
        rank: account.rank,
        description: account.description,
        image: account.image,
        sellerWallet: account.sellerWallet,
        sellerName: account.sellerName,
        buyerWallet: walletAddress,
        totalPriceETH: totalPriceETH.toFixed(6),
        totalPriceIDR: (totalPriceETH * 50000000).toFixed(0),
      };

      // Create escrow transaction
      const escrowTransaction = createEscrowTransaction(orderData);
      
      setShowPaymentModal(false);
      setSelectedAccount(null);
      
      setSuccessMessage(`Transaksi escrow berhasil dibuat! ID: ${escrowTransaction.id}. Transfer ${totalPriceETH.toFixed(6)} ETH ke wallet escrow dan tunggu konfirmasi admin.`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      setSuccessMessage('Terjadi kesalahan saat membuat transaksi escrow. Silakan coba lagi.');
      setShowSuccessModal(true);
    }
  };

  const handleSuccessNavigate = () => {
    navigate('/escrow');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Marketplace Akun Game</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Temukan akun game premium dengan harga terbaik dan transaksi aman menggunakan sistem Escrow
          </p>
        </div>
      </section>

      {/* Escrow Info Banner */}
      <section className="bg-green-50 border-b border-green-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Transaksi Aman dengan Escrow - Dana dijamin hingga akun diterima</span>
          </div>
        </div>
      </section>

      {/* Filter Game */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedGame === 0
                ? 'Semua Akun Game'
                : `Akun ${gameList.find(g => g.id === selectedGame)?.name || ''}`}
            </h2>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGameFilter(0)}
                className={`px-4 py-2 rounded-lg ${
                  selectedGame === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semua Game
              </button>
              {gameList.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameFilter(game.id)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedGame === game.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Akun */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-xl mr-4 flex items-center justify-center">
                        {account.image ? (
                          <img
                            src={account.image}
                            alt={account.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-gray-500 text-lg">
                            {gameList.find(g => g.id === account.gameId)?.name.charAt(0) || 'G'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{account.title}</h3>
                        <p className="text-sm text-gray-500">
                          {gameList.find(g => g.id === account.gameId)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {account.level && (
                        <p className="text-sm">
                          <span className="font-medium">Level:</span> {account.level}
                        </p>
                      )}
                      {account.rank && (
                        <p className="text-sm">
                          <span className="font-medium">Rank:</span> {account.rank}
                        </p>
                      )}
                      {account.description && (
                        <p className="text-sm text-gray-600 mt-2">{account.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Penjual:</span> {account.sellerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <span className="text-xl font-bold text-blue-600">{account.price}</span>
                      <button
                        onClick={() => handleBuyClick(account)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isAuthenticated
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-400 text-white cursor-not-allowed'
                        }`}
                      >
                        {isAuthenticated ? 'Beli Sekarang' : 'Login untuk Beli'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 text-lg">Tidak ada akun yang tersedia untuk game ini</p>
                <button
                  onClick={() => handleGameFilter(0)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Lihat Semua Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedAccount && (
        <PaymentDetailModal
          account={{
            ...selectedAccount,
            gameName: gameList.find(g => g.id === selectedAccount.gameId)?.name || ''
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAccount(null);
          }}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
          }}
          onNavigate={handleSuccessNavigate}
        />
      )}

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center border-t border-gray-800 text-gray-400">
          <p>&copy; 2025 GameMarket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;