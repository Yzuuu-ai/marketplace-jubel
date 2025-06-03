import React, { useState } from 'react';

// Sample account data structure
const generateSampleAccount = () => ({
  id: 'acc-001',
  title: 'Akun Mobile Legends Level 50',
  gameName: 'Mobile Legends',
  gameIcon: '🎮',
  level: 50,
  rank: 'Epic III',
  server: 'Indonesia',
  price: '0.001500 ETH',
  priceIDR: 75000,
  sellerName: 'GamerPro123',
  sellerRating: 4.8,
  sellerReviews: 127,
  description: 'Akun Mobile Legends dengan level tinggi dan banyak skin rare. Sudah memiliki berbagai hero legendaris dan skin collector. Akun ini sangat cocok untuk pemain yang ingin langsung bermain di rank tinggi.',
  features: [
    '150+ Heroes Unlocked',
    '25+ Legendary Skins',
    '5+ Collector Skins',
    'Elite Pass Season 1-20',
    '50,000+ Battle Points',
    '10,000+ Diamonds',
    'All Emblems Max Level'
  ],
  screenshots: [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
  ],
  mainImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=300&fit=crop',
  createdAt: Date.now() - 86400000,
  lastLogin: Date.now() - 3600000,
  accountAge: '2 tahun 3 bulan',
  winRate: '78%',
  totalMatches: 2547,
  verification: {
    isVerified: true,
    verifiedBy: 'GameTrader',
    verificationDate: Date.now() - 172800000
  },
  security: {
    hasEmailBind: true,
    hasPhoneBind: true,
    hasSocialBind: false,
    originalOwner: true
  }
});

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount, currency = 'IDR') => {
  if (currency === 'IDR') {
    return `Rp ${parseInt(amount).toLocaleString('id-ID')}`;
  }
  return amount;
};

const AccountDetailModal = ({ account, onClose, onBuyNow, onContact }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!account) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === account.screenshots.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? account.screenshots.length - 1 : prev - 1
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={account.mainImage} 
                  alt={account.title}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
                <div className="absolute -top-2 -right-2 text-3xl">
                  {account.gameIcon}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{account.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {account.gameName}
                  </span>
                  <span>Level {account.level}</span>
                  <span>{account.rank}</span>
                  <span>{account.server}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl"
            >
              ✕
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Features */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Screenshot Akun</h3>
                <div className="relative">
                  <img 
                    src={account.screenshots[currentImageIndex]}
                    alt={`Screenshot ${currentImageIndex + 1}`}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  
                  {/* Navigation Arrows */}
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    ←
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    →
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {account.screenshots.length}
                  </div>
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {account.screenshots.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-blue-500' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>

              {/* Account Features */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Fitur Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {account.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Statistics */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Statistik Akun</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{account.level}</p>
                    <p className="text-sm text-gray-600">Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{account.winRate}</p>
                    <p className="text-sm text-gray-600">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{account.totalMatches}</p>
                    <p className="text-sm text-gray-600">Total Match</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{account.accountAge}</p>
                    <p className="text-sm text-gray-600">Umur Akun</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Deskripsi</h3>
                <div className="text-gray-700 leading-relaxed">
                  {showFullDescription ? (
                    <p>{account.description}</p>
                  ) : (
                    <p>{account.description.substring(0, 200)}...</p>
                  )}
                  <button 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 hover:text-blue-800 font-medium mt-2"
                  >
                    {showFullDescription ? 'Sembunyikan' : 'Lihat Selengkapnya'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Purchase Info */}
            <div className="space-y-6">
              {/* Price & Purchase */}
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 sticky top-4">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {account.price}
                  </div>
                  <div className="text-lg text-gray-600">
                    {formatCurrency(account.priceIDR)}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => onBuyNow && onBuyNow(account)}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                  >
                    🛒 Beli Sekarang
                  </button>
                  <button 
                    onClick={() => onContact && onContact(account)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    💬 Hubungi Penjual
                  </button>
                </div>

                {/* Seller Info */}
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3">Informasi Penjual</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {account.sellerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{account.sellerName}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{account.sellerRating}</span>
                        <span className="text-sm text-gray-500">({account.sellerReviews} ulasan)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              {account.verification.isVerified && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-bold text-green-800">Akun Terverifikasi</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Diverifikasi oleh {account.verification.verifiedBy}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatDate(account.verification.verificationDate)}
                  </p>
                </div>
              )}

              {/* Security Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🔒 Keamanan Akun
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Email Bind:</span>
                    <span className={account.security.hasEmailBind ? 'text-green-600' : 'text-red-600'}>
                      {account.security.hasEmailBind ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Bind:</span>
                    <span className={account.security.hasPhoneBind ? 'text-green-600' : 'text-red-600'}>
                      {account.security.hasPhoneBind ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Owner:</span>
                    <span className={account.security.originalOwner ? 'text-green-600' : 'text-red-600'}>
                      {account.security.originalOwner ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-3">Informasi Tambahan</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="font-medium">{formatDate(account.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Login Terakhir:</span>
                    <span className="font-medium">{formatDate(account.lastLogin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Server:</span>
                    <span className="font-medium">{account.server}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Component
const AccountDetailDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const sampleAccount = generateSampleAccount();

  const handleBuyNow = (account) => {
    alert(`Membeli akun: ${account.title}`);
    setShowModal(false);
  };

  const handleContact = (account) => {
    alert(`Menghubungi penjual: ${account.sellerName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Account Detail Modal</h1>
          <p className="text-gray-600 mb-8">Modal untuk menampilkan detail lengkap akun game</p>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
          >
            Lihat Detail Akun
          </button>
        </div>

        {/* Sample Account Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={sampleAccount.mainImage}
              alt={sampleAccount.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-bold text-gray-800">{sampleAccount.title}</h3>
              <p className="text-gray-600 text-sm">{sampleAccount.gameName}</p>
              <p className="font-bold text-blue-600">{sampleAccount.price}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lihat Detail
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AccountDetailModal
          account={sampleAccount}
          onClose={() => setShowModal(false)}
          onBuyNow={handleBuyNow}
          onContact={handleContact}
        />
      )}
    </div>
  );
};

export default AccountDetailDemo;