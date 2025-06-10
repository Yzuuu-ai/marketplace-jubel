import React, { useState } from 'react';

const AccountDetailModal = ({ 
  account, 
  gameList, 
  formatPriceDisplay, 
  isAuthenticated, 
  onClose, 
  onBuy 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  if (!account) return null;

  const priceDisplay = formatPriceDisplay(account.price);
  const game = gameList.find(g => g.id === account.gameId);
  const images = account.images || [account.image];

  // Fungsi navigasi gambar
  const nextImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const getContactInfo = () => {
    if (account.contactType && account.contactValue) {
      const icons = {
        whatsapp: 'fab fa-whatsapp',
        instagram: 'fab fa-instagram',
        telegram: 'fab fa-telegram'
      };
      return { 
        type: account.contactType, 
        value: account.contactValue, 
        icon: icons[account.contactType],
        label: account.contactType.charAt(0).toUpperCase() + account.contactType.slice(1)
      };
    }
    if (account.whatsapp) return { type: 'whatsapp', value: account.whatsapp, icon: 'fab fa-whatsapp', label: 'WhatsApp' };
    if (account.instagram) return { type: 'instagram', value: account.instagram, icon: 'fab fa-instagram', label: 'Instagram' };
    if (account.telegram) return { type: 'telegram', value: account.telegram, icon: 'fab fa-telegram', label: 'Telegram' };
    return null;
  };

  const contactInfo = getContactInfo();
  
  const handleContactClick = (e) => {
    e.stopPropagation();
    if (!contactInfo) return;
    
    let url = '';
    switch (contactInfo.type) {
      case 'whatsapp':
        url = `https://wa.me/${contactInfo.value.replace(/[^0-9]/g, '')}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${contactInfo.value.replace('@', '')}`;
        break;
      case 'telegram':
        url = `https://t.me/${contactInfo.value.replace('@', '')}`;
        break;
      default:
        return;
    }
    
    if (url) window.open(url, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Detail Akun Game</h2>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Kolom Kiri - Gambar */}
              <div>
                {/* Galeri Gambar */}
                <div 
                  className="relative bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in mb-4"
                  onClick={() => openImageModal(currentImageIndex)}
                >
                  <img 
                    src={images[currentImageIndex]} 
                    alt={account.title}
                    className="w-full h-64 object-cover"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                  
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Gambar */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${index === currentImageIndex ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Informasi Penjual dan Kontak dalam 1 baris */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {account.sellerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{account.sellerName}</p>
                    </div>
                  </div>
                  
                  {contactInfo && (
                    <button 
                      onClick={handleContactClick}
                      className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <i className={`${contactInfo.icon} text-lg`}></i>
                      <span>{contactInfo.label}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Kolom Kanan - Info Produk */}
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{account.title}</h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    <i className="fas fa-gamepad text-gray-400"></i>
                    <span>{game?.name || 'Game Tidak Dikenal'}</span>
                  </p>
                </div>
                
                {/* Detail Akun */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {account.level && (
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Level</span>
                        <span className="font-medium">{account.level}</span>
                      </div>
                    )}
                    
                    {account.rank && (
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Rank</span>
                        <span className="font-medium">{account.rank}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Harga</span>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 text-xl">{priceDisplay.eth}</p>
                        <p className="text-sm text-gray-500">{priceDisplay.idr}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Deskripsi */}
                {account.description && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Deskripsi</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 whitespace-pre-line">{account.description}</p>
                    </div>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-3">
                  <button 
                    onClick={onClose} 
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => { onClose(); onBuy(account); }} 
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    disabled={!isAuthenticated}
                  >
                    <i className="fab fa-ethereum"></i>
                    <span>{isAuthenticated ? 'Beli Sekarang' : 'Login untuk Membeli'}</span>
                  </button>
                </div>

                {!isAuthenticated && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Anda perlu login untuk melakukan pembelian
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gambar Besar */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button 
              onClick={closeImageModal} 
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 z-10"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <div className="relative">
              <img 
                src={images[modalImageIndex]} 
                alt="Detail gambar" 
                className="max-w-full max-h-[80vh] object-contain mx-auto" 
              />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-3 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-3 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                  
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                      {modalImageIndex + 1} / {images.length}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-center text-white mt-4">
              <p>Klik dimana saja untuk menutup</p>
              <p className="text-sm opacity-70 mt-1">Gunakan tombol panah untuk melihat gambar lainnya</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountDetailModal;