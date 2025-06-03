import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// Menggunakan konstanta yang sama dengan Marketplace.js
const ORDER_STATUS = {
  CART: 'keranjang',
  ORDER: 'pesanan', 
  FAILED: 'gagal',
  COMPLETED: 'selesai'
};

const STATUS_LABELS = {
  [ORDER_STATUS.CART]: 'Keranjang',
  [ORDER_STATUS.ORDER]: 'Pesanan',
  [ORDER_STATUS.FAILED]: 'Gagal',
  [ORDER_STATUS.COMPLETED]: 'Selesai'
};

const STATUS_COLORS = {
  [ORDER_STATUS.CART]: 'bg-blue-500',
  [ORDER_STATUS.ORDER]: 'bg-yellow-500',
  [ORDER_STATUS.FAILED]: 'bg-red-500',
  [ORDER_STATUS.COMPLETED]: 'bg-green-500'
};

const STATUS_ICONS = {
  [ORDER_STATUS.CART]: '♡',
  [ORDER_STATUS.ORDER]: '⏱',
  [ORDER_STATUS.FAILED]: '✗',
  [ORDER_STATUS.COMPLETED]: '✓'
};

const EMPTY_STATE = {
  [ORDER_STATUS.CART]: {
    icon: '🛒',
    title: 'Keranjang Kosong',
    description: 'Tambahkan produk favorit Anda ke keranjang'
  },
  [ORDER_STATUS.ORDER]: {
    icon: '📦',
    title: 'Belum Ada Pesanan',
    description: 'Belum ada pesanan yang sedang diproses'
  },
  [ORDER_STATUS.FAILED]: {
    icon: '❌',
    title: 'Tidak Ada Gagal',
    description: 'Tidak ada pesanan yang gagal'
  },
  [ORDER_STATUS.COMPLETED]: {
    icon: '✅',
    title: 'Belum Ada Selesai',
    description: 'Belum ada pesanan yang selesai'
  }
};

// Format time function
const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Payment Modal Component (sesuai dengan Marketplace.js)
const PaymentDetailModal = ({ order, onClose, onConfirm }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [selectedPayment, setSelectedPayment] = useState('');

  const paymentMethods = [
    { 
      id: 'ethereum', 
      name: 'Ethereum (ETH)', 
      fee: 0.002, // Gas fee dalam ETH
      address: '0x742d35Cc6635C0532925a3b8D1c9E5e7c5f47F1a',
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

  const formatTimePayment = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price) => {
    // Handle jika price sudah dalam format ETH atau IDR
    if (typeof price === 'string' && price.includes('ETH')) {
      return parseFloat(price.replace(/[^\d.]/g, '')) * 50000000; // Convert ETH to IDR
    }
    return parseFloat(price.toString().replace(/[^\d.]/g, ''));
  };

  // Convert IDR to ETH (example rate: 1 ETH = 50,000,000 IDR)
  const convertToETH = (idrPrice) => {
    const ethRate = 50000000; // 1 ETH = 50 juta IDR
    return (idrPrice / ethRate).toFixed(6);
  };

  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPayment);
  const basePriceIDR = formatPrice(order.originalPrice || order.price);
  const basePriceETH = parseFloat(convertToETH(basePriceIDR));
  const fee = selectedPaymentMethod ? selectedPaymentMethod.fee : 0;
  const totalPriceETH = basePriceETH + fee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Detail Pembayaran</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Detail Item</h3>
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
              <span className="text-gray-600 font-bold">
                {order.gameName?.charAt(0) || 'G'}
              </span>
            </div>
            <div>
              <p className="font-medium">{order.title}</p>
              <p className="text-sm text-gray-600">{order.gameName}</p>
            </div>
          </div>
          {order.level && <p className="text-sm"><span className="font-medium">Level:</span> {order.level}</p>}
          {order.rank && <p className="text-sm"><span className="font-medium">Rank:</span> {order.rank}</p>}
          <p className="text-sm mt-2"><span className="font-medium">Penjual:</span> {order.sellerName}</p>
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
                    <p><span className="font-medium">Address:</span> 
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

        {/* Payment Instructions */}
        {selectedPaymentMethod && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2 text-blue-800">Instruksi Pembayaran</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. Salin alamat wallet di atas</p>
              <p>2. Transfer <strong>{totalPriceETH.toFixed(6)} ETH</strong> ke alamat tersebut</p>
              <p>3. Pastikan menggunakan network <strong>{selectedPaymentMethod.network}</strong></p>
              <p>4. Tunggu minimal {selectedPaymentMethod.minConfirmations} konfirmasi</p>
              <p>5. Pesanan akan diproses setelah pembayaran terverifikasi</p>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="mb-6">
          <p className="text-red-600 font-medium text-center">
            Selesaikan pembayaran dalam: {formatTimePayment(timeLeft)}
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
            onClick={() => onConfirm(selectedPaymentMethod, totalPriceETH)}
            disabled={timeLeft === 0 || !selectedPayment}
            className={`flex-1 px-4 py-3 rounded-lg font-medium ${
              timeLeft > 0 && selectedPayment
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-400 cursor-not-allowed text-white'
            }`}
          >
            {timeLeft > 0 ? 'Konfirmasi Pembayaran' : 'Waktu Habis'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Pesanan = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState(ORDER_STATUS.CART);
  const [countdowns, setCountdowns] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderToBuy, setOrderToBuy] = useState(null);

  // Load initial data from localStorage and gameAccounts
  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // If no orders in cart, check for game accounts in cart
    if (storedOrders.filter(o => o.status === ORDER_STATUS.CART).length === 0) {
      const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
      const cartItems = gameAccounts
        .filter(account => account.isInCart)
        .map(account => ({
          id: `cart-${account.id}`,
          title: account.title,
          gameName: account.gameName,
          price: account.price,
          level: account.level,
          rank: account.rank,
          description: account.description,
          image: account.image,
          sellerName: account.sellerName,
          sellerWallet: account.sellerWallet,
          status: ORDER_STATUS.CART,
          isAccount: true,
          accountId: account.id
        }));
      
      if (cartItems.length > 0) {
        const updatedOrders = [...storedOrders, ...cartItems];
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        return;
      }
    }
    
    setOrders(storedOrders);
  }, []);

  // Handle countdowns and status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let shouldUpdate = false;
      
      const updatedOrders = orders.map(order => {
        if (order.status === ORDER_STATUS.ORDER && now - order.createdAt > 15 * 60 * 1000) {
          shouldUpdate = true;
          return { ...order, status: ORDER_STATUS.FAILED };
        }
        return order;
      });

      const updatedCountdowns = {};
      updatedOrders.forEach(order => {
        if (order.status === ORDER_STATUS.ORDER) {
          updatedCountdowns[order.id] = Math.max(15 * 60 * 1000 - (now - order.createdAt), 0);
        }
      });

      if (shouldUpdate) {
        setOrders(updatedOrders);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
      }
      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleAction = {
    buy: (order) => {
      setOrderToBuy(order);
      setShowPaymentModal(true);
    },
    pay: (id) => updateOrderStatus(id, ORDER_STATUS.COMPLETED),
    retry: (order) => {
      setOrderToBuy(order);
      setShowPaymentModal(true);
    },
    remove: (id) => {
      const updated = orders.filter(order => order.id !== id);
      
      // If removing a cart item that's an account, update gameAccounts
      const orderToRemove = orders.find(o => o.id === id);
      if (orderToRemove?.isAccount) {
        const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
        const updatedAccounts = gameAccounts.map(account => 
          account.id === orderToRemove.accountId ? { ...account, isInCart: false } : account
        );
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      }
      
      setOrders(updated);
      localStorage.setItem('orders', JSON.stringify(updated));
      setSelectedOrder(null);
    }
  };

  const updateOrderStatus = (id, status) => {
    const updated = orders.map(order => {
      if (order.id === id) {
        return { 
          ...order, 
          status,
          ...(status === ORDER_STATUS.ORDER && { createdAt: Date.now() })
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
    setSelectedOrder(null);
  };

  const handleConfirmPayment = (paymentMethod, totalPriceETH) => {
    try {
      const updatedOrder = {
        ...orderToBuy,
        status: ORDER_STATUS.ORDER,
        createdAt: Date.now(),
        price: `${totalPriceETH.toFixed(6)} ETH`, // Update price untuk display
        paymentMethod: paymentMethod?.name,
        paymentId: paymentMethod?.id,
        paymentAddress: paymentMethod?.address,
        paymentNetwork: paymentMethod?.network,
        totalPriceETH: totalPriceETH.toFixed(6),
        totalPriceIDR: (totalPriceETH * 50000000).toFixed(0),
        gasFee: paymentMethod?.fee,
        minConfirmations: paymentMethod?.minConfirmations
      };

      const updatedOrders = orders.map(order => 
        order.id === orderToBuy.id ? updatedOrder : order
      );

      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      // If this was an account purchase, mark as sold in gameAccounts
      if (orderToBuy.isAccount) {
        const gameAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
        const updatedAccounts = gameAccounts.map(account => 
          account.id === orderToBuy.accountId 
            ? { ...account, isSold: true, soldAt: new Date().toISOString() } 
            : account
        );
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      }
      
      setShowPaymentModal(false);
      setOrderToBuy(null);
      setSelectedOrder(null);
      setActiveTab(ORDER_STATUS.ORDER); // Switch to orders tab
      
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Daftar Pesanan</h1>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.values(ORDER_STATUS).map(tab => (
                <button
                  key={tab}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  <span className="mr-2">{STATUS_LABELS[tab]}</span>
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {orders.filter(o => o.status === tab).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  countdown={countdowns[order.id]}
                  onViewDetails={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          ) : (
            <EmptyState status={activeTab} />
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          countdown={countdowns[selectedOrder.id]}
          onClose={() => setSelectedOrder(null)}
          onAction={handleAction}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && orderToBuy && (
        <PaymentDetailModal
          order={orderToBuy}
          onClose={() => {
            setShowPaymentModal(false);
            setOrderToBuy(null);
          }}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
};

const OrderCard = ({ order, countdown, onViewDetails }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={order.image} 
                alt={order.title} 
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${STATUS_COLORS[order.status]}`}>
                {STATUS_ICONS[order.status]}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg mb-1">{order.title}</h3>
              <p className="text-blue-600 font-semibold text-lg">{order.price}</p>
              {order.gameName && (
                <p className="text-gray-500 text-sm">{order.gameName}</p>
              )}
            </div>
          </div>
        </div>
        
        {order.status === ORDER_STATUS.ORDER && countdown !== undefined && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 font-semibold text-sm text-center">
              ⏰ Sisa waktu: {formatTime(countdown)}
            </p>
          </div>
        )}
        
        {order.status === ORDER_STATUS.FAILED && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 font-medium text-sm text-center">❌ Pembayaran gagal</p>
          </div>
        )}
        
        {order.status === ORDER_STATUS.COMPLETED && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 font-medium text-sm text-center">✅ Pembayaran berhasil</p>
          </div>
        )}
        
        <button 
          onClick={onViewDetails}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ status }) => (
  <div className="text-center py-16">
    <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
      <div className="text-6xl mb-6">{EMPTY_STATE[status].icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {EMPTY_STATE[status].title}
      </h3>
      <p className="text-gray-500">
        {EMPTY_STATE[status].description}
      </p>
    </div>
  </div>
);

const OrderModal = ({ order, countdown, onClose, onAction }) => {
  const getActions = () => {
    switch (order.status) {
      case ORDER_STATUS.CART:
        return [
          { label: 'Beli Sekarang', color: 'bg-blue-600 hover:bg-blue-700', action: () => onAction.buy(order) },
          { label: 'Hapus', color: 'bg-red-500 hover:bg-red-600', action: () => onAction.remove(order.id) }
        ];
      case ORDER_STATUS.ORDER:
        return [
          { label: 'Bayar Sekarang', color: 'bg-green-600 hover:bg-green-700', action: () => onAction.pay(order.id) }
        ];
      case ORDER_STATUS.FAILED:
        return [
          { label: 'Beli Ulang', color: 'bg-yellow-500 hover:bg-yellow-600', action: () => onAction.retry(order) }
        ];
      case ORDER_STATUS.COMPLETED:
        return [];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Detail Produk</h3>
            <button 
              className="text-gray-400 hover:text-gray-600 text-2xl"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          <img 
            src={order.image} 
            alt={order.title} 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            {order.title}
          </h4>
          
          <p className="text-blue-600 font-semibold text-lg mb-2">
            {order.price}
          </p>

          {order.gameName && (
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">Game:</span> {order.gameName}
            </p>
          )}

          {order.level && (
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">Level:</span> {order.level}
            </p>
          )}

          {order.rank && (
            <p className="text-gray-600 text-sm mb-2">
              <span className="font-medium">Rank:</span> {order.rank}
            </p>
          )}

          {order.sellerName && (
            <p className="text-gray-600 text-sm mb-4">
              <span className="font-medium">Penjual:</span> {order.sellerName}
            </p>
          )}
          
          <p className="text-gray-600 text-sm mb-6">
            {order.description}
          </p>

          {order.status === ORDER_STATUS.ORDER && countdown !== undefined && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
              <p className="text-yellow-800 font-medium">Waktu pembayaran tersisa:</p>
              <p className="text-2xl font-bold text-red-600">
                {formatTime(countdown)}
              </p>
              {order.paymentAddress && (
                <div className="mt-3 text-sm text-gray-600">
                  <p><span className="font-medium">Transfer ke:</span></p>
                  <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                    {order.paymentAddress}
                  </p>
                  <p className="mt-1"><span className="font-medium">Jumlah:</span> {order.totalPriceETH} ETH</p>
                </div>
              )}
            </div>
          )}

          {order.status === ORDER_STATUS.FAILED && (
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
              <p className="text-red-800 font-medium">Pembayaran Gagal</p>
              <p className="text-red-600 text-sm">Batas waktu pembayaran telah habis</p>
            </div>
          )}

          {order.status === ORDER_STATUS.COMPLETED && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <p className="text-green-800 font-semibold text-lg">Pembayaran Berhasil</p>
              <p className="text-green-600 text-sm">Produk telah berhasil dibeli</p>
            </div>
          )}

          <div className="space-y-3">
            {getActions().map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`w-full text-white py-3 rounded-lg transition-colors font-medium ${action.color}`}
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pesanan;