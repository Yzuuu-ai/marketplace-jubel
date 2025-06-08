import React from 'react';

const AccountDetailModal = ({ 
  account, 
  gameList, 
  formatPriceDisplay, 
  isAuthenticated, 
  onClose, 
  onBuy 
}) => {
  if (!account) return null;
  
  const priceDisplay = formatPriceDisplay(account.price);
  const game = gameList.find(g => g.id === account.gameId);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Detail Akun Game</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ✕
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img 
                src={account.image} 
                alt={account.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Informasi Penjual</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {account.sellerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{account.sellerName}</p>
                    <div className="flex items-center text-yellow-500 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1">4.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{account.title}</h3>
              <p className="text-gray-600 mb-4">{game?.name || 'Game Tidak Dikenal'}</p>
              
              <div className="space-y-3 mb-6">
                {account.level && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium">{account.level}</span>
                  </div>
                )}
                {account.rank && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rank:</span>
                    <span className="font-medium">{account.rank}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga:</span>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{priceDisplay.eth}</p>
                    <p className="text-sm text-gray-500">{priceDisplay.idr}</p>
                  </div>
                </div>
              </div>
              
              {account.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Deskripsi</h4>
                  <p className="text-gray-600">{account.description}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    onBuy(account);
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-bold"
                  disabled={!isAuthenticated}
                >
                  {isAuthenticated ? '⟠ Beli dengan ETH' : 'Login untuk Membeli'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Tutup
                </button>
              </div>
              
              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Silakan login terlebih dahulu untuk melakukan pembelian
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailModal;