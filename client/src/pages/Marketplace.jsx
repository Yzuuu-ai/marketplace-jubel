// src/pages/Marketplace.jsx - Enhanced with Account Details and Seller Profiles
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BlockchainPaymentSystem from '../components/BlockchainPaymentSystem';
import SuccessModal from '../components/SuccessModal';
import AccountDetailModal from '../components/AccountDetailModal';
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
  const [paymentResult, setPaymentResult] = useState(null);
  
  // State untuk modal detail akun
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);

  // Get game account data with seller profiles
  const getGameAccounts = useCallback(() => {
    try {
      const savedAccounts = localStorage.getItem('gameAccounts');
      const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
      const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      
      // Enhance account data with seller profile names
      return accounts.map(account => {
        const sellerProfile = userProfiles[account.sellerWallet];
        return {
          ...account,
          sellerName: sellerProfile?.nama || account.sellerName || `Seller-${account.sellerWallet.substring(0, 6)}`
        };
      });
    } catch (error) {
      console.error('Error parsing game accounts:', error);
      return [];
    }
  }, []);

  // Filter accounts by selected game
  useEffect(() => {
    const allAccounts = getGameAccounts();
    
    // Filter out sold or escrowed accounts
    const availableAccounts = allAccounts.filter(account => 
      !account.isSold && !account.isInEscrow
    );

    if (selectedGame === 0) {
      setFilteredAccounts(availableAccounts);
    } else {
      const filtered = availableAccounts.filter(account => account.gameId === selectedGame);
      setFilteredAccounts(filtered);
    }
  }, [selectedGame, getGameAccounts]);

  // Set selected game on URL parameter change
  useEffect(() => {
    if (gameIdParam) {
      setSelectedGame(parseInt(gameIdParam));
    }
  }, [gameIdParam]);

  // Handle game filter change
  const handleGameFilter = useCallback((gameId) => {
    setSelectedGame(gameId);
  }, []);

  // Handle buy button click
  const handleBuyClick = useCallback((account) => {
    if (!isAuthenticated) {
      setSuccessMessage('Silakan login terlebih dahulu untuk melakukan pembelian');
      setShowSuccessModal(true);
      return;
    }
    
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
      priceETH: parseFloat(account.price.replace(' ETH', '')),
      totalPriceETH: parseFloat(account.price.replace(' ETH', '')),
      priceIDR: (parseFloat(account.price.replace(' ETH', '')) * 50000000).toFixed(0),
    };
    
    setSelectedAccount(orderData);
    setShowPaymentModal(true);
  }, [isAuthenticated, walletAddress]);

  // Handle navigation from the Home page
  useEffect(() => {
    if (location.state) {
      if (location.state.selectedAccountId) {
        const allAccounts = getGameAccounts();
        const account = allAccounts.find(acc => acc.id === location.state.selectedAccountId);
        if (account) {
          handleBuyClick(account);
        }
      } else if (location.state.viewAccountId) {
        const allAccounts = getGameAccounts();
        const account = allAccounts.find(acc => acc.id === location.state.viewAccountId);
        if (account) {
          const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
          const sellerProfile = userProfiles[account.sellerWallet];
          const enrichedAccount = {
            ...account,
            sellerName: sellerProfile?.nama || account.sellerName || `Seller-${account.sellerWallet.substring(0, 6)}`
          };
          setDetailAccount(enrichedAccount);
          setShowAccountDetail(true);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleBuyClick, getGameAccounts]);

  // Handle payment completion
  const handlePaymentComplete = useCallback((paymentData) => {
    try {
      if (!selectedAccount) return;

      const escrowData = {
        ...selectedAccount,
        paymentHash: paymentData.transactionHash,
        network: paymentData.network,
        paymentStatus: paymentData.status,
        paidAmount: paymentData.amount
      };

      const escrowTransaction = createEscrowTransaction(escrowData);
      
      setShowPaymentModal(false);
      setPaymentResult(paymentData);
      
      setSuccessMessage(`Pembayaran blockchain berhasil! ID Escrow: ${escrowTransaction.id} Hash Transaksi: ${paymentData.transactionHash}`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      setSuccessMessage('Pembayaran berhasil tapi terjadi kesalahan dalam membuat escrow. Hubungi admin.');
      setShowSuccessModal(true);
    }
  }, [selectedAccount, createEscrowTransaction]);

  // Handle payment cancel
  const handlePaymentCancel = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedAccount(null);
  }, []);

  // Navigate to escrow page
  const handleSuccessNavigate = useCallback(() => {
    navigate('/escrow');
  }, [navigate]);

  // Format ETH price to display
  const formatPriceDisplay = useCallback((ethPrice) => {
    const eth = parseFloat(ethPrice.replace(' ETH', ''));
    const idr = (eth * 50000000).toLocaleString('id-ID');
    return {
      eth: `${eth} ETH`,
      idr: `≈ Rp ${idr}`
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Marketplace Akun Game</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Temukan akun game premium dengan transaksi aman menggunakan <strong>Blockchain Ethereum</strong>
          </p>
        </div>
      </section>

      {/* Blockchain Info Banner */}
      <section className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">⟠</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Pembayaran Blockchain Nyata</h3>
                <p className="text-gray-600 text-sm">Pembayaran ETH langsung ke smart contract escrow</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Dukungan Multi-Jaringan</h3>
                <p className="text-gray-600 text-sm">Ethereum, Sepolia Testnet, Polygon</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Terverifikasi di Explorer</h3>
                <p className="text-gray-600 text-sm">Semua transaksi dapat diverifikasi di Etherscan</p>
              </div>
            </div>
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
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedGame === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semua Game
              </button>
              {gameList.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameFilter(game.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedGame === game.id
                      ? 'bg-blue-600 text-white shadow-lg'
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
              filteredAccounts.map((account) => {
                const priceDisplay = formatPriceDisplay(account.price);
                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-xl mr-4 flex items-center justify-center relative">
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
                          {/* Blockchain Badge */}
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">⟠</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{account.title}</h3>
                          <p className="text-sm text-gray-500">
                            {gameList.find(g => g.id === account.gameId)?.name}
                          </p>
                          <div className="mt-1">
                            <p className="text-lg font-bold text-blue-600">{priceDisplay.eth}</p>
                            <p className="text-sm text-gray-500">{priceDisplay.idr}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {account.level && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Level:</span> 
                            <span className="ml-1 text-blue-600 font-semibold">{account.level}</span>
                          </p>
                        )}
                        {account.rank && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Rank:</span> 
                            <span className="ml-1 text-purple-600 font-semibold">{account.rank}</span>
                          </p>
                        )}
                        {account.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{account.description}</p>
                        )}
                      </div>

                      {/* Seller Info */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Penjual</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {account.sellerName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{account.sellerName}</span>
                          <div className="flex items-center text-yellow-500">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs ml-1 text-gray-600">4.8</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Opsi Pembayaran</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">⟠ ETH</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">🔷 Polygon</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">🧪 Testnet</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          <span>🔒 Dilindungi Escrow</span>
                        </div>
                        <button
                          onClick={() => handleBuyClick(account)}
                          className={`px-6 py-3 rounded-lg transition-all font-semibold ${
                            isAuthenticated
                              ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-400 text-white cursor-not-allowed'
                          }`}
                        >
                          {isAuthenticated ? '⟠ Bayar dengan ETH' : 'Login untuk Beli'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <div className="text-6xl mb-6">🎮</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak Ada Akun Tersedia</h3>
                  <p className="text-gray-500 mb-6">
                    Tidak ada akun yang tersedia untuk game ini saat ini.
                  </p>
                  <button
                    onClick={() => handleGameFilter(0)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Lihat Semua Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blockchain Payment Modal */}
      {showPaymentModal && selectedAccount && (
        <BlockchainPaymentSystem
          order={selectedAccount}
          onPaymentComplete={handlePaymentComplete}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          transactionHash={paymentResult?.transactionHash}
          explorerUrl={paymentResult?.transactionHash ? `https://etherscan.io/tx/${paymentResult.transactionHash}` : null}
          onClose={() => {
            setShowSuccessModal(false);
            setPaymentResult(null);
          }}
          onNavigate={handleSuccessNavigate}
        />
      )}

      {/* Account Detail Modal */}
      {showAccountDetail && detailAccount && (
        <AccountDetailModal
          account={detailAccount}
          gameList={gameList}
          formatPriceDisplay={formatPriceDisplay}
          isAuthenticated={isAuthenticated}
          onClose={() => {
            setShowAccountDetail(false);
            setDetailAccount(null);
          }}
          onBuy={handleBuyClick}
        />
      )}

      {/* Info Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Keuntungan Pembayaran Blockchain</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transaksi langsung menggunakan blockchain untuk keamanan dan transparansi maksimal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Fitur 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⟠</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Pembayaran ETH Nyata</h4>
              <p className="text-gray-600">
                Pembayaran menggunakan Ethereum asli, dapat diverifikasi di blockchain explorer
              </p>
              <div className="mt-4 text-sm text-blue-600">
                <p>✓ Integrasi MetaMask</p>
                <p>✓ Dukungan Multi-Jaringan</p>
                <p>✓ Optimasi Biaya Gas</p>
              </div>
            </div>

            {/* Fitur 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Smart Contract Escrow</h4>
              <p className="text-gray-600">
                Dana ditahan di smart contract hingga transaksi dikonfirmasi kedua belah pihak
              </p>
              <div className="mt-4 text-sm text-green-600">
                <p>✓ Pelepasan Otomatis</p>
                <p>✓ Penyelesaian Sengketa</p>
                <p>✓ Tanpa Risiko Pihak Ketiga</p>
              </div>
            </div>

            {/* Fitur 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Transparansi Penuh</h4>
              <p className="text-gray-600">
                Semua transaksi tercatat di blockchain dan dapat diverifikasi siapa saja
              </p>
              <div className="mt-4 text-sm text-purple-600">
                <p>✓ Hash Transaksi</p>
                <p>✓ Konfirmasi Blok</p>
                <p>✓ Verifikasi Explorer</p>
              </div>
            </div>
          </div>

          {/* Network Support */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">Jaringan yang Didukung</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">⟠</span>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Ethereum Mainnet</h5>
                  <p className="text-sm text-gray-600">Jaringan produksi dengan ETH asli</p>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">LIVE</span>
                </div>
              </div>
              
            
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🧪</span>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Sepolia Testnet</h5>
                  <p className="text-sm text-gray-600">Jaringan uji dengan ETH gratis</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">TEST</span>
                </div>
              </div>
              
            
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🔷</span>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Polygon</h5>
                  <p className="text-sm text-gray-600">Layer 2 dengan biaya rendah</p>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">L2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center border-t border-gray-800 text-gray-400">
          <p>&copy; 2025 GameMarket. Hak cipta dilindungi. | Didukung oleh Ethereum Blockchain</p>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;
