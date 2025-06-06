// src/components/SellerDeliveryModal.jsx
import React, { useState } from 'react';

const SellerDeliveryModal = ({ escrowTransaction, onClose, onDeliver }) => {
  const [deliveryData, setDeliveryData] = useState({
    username: '',
    password: '',
    email: '',
    additionalInfo: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryData.username || !deliveryData.password) {
      alert('Username dan password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeliver(deliveryData);
      onClose();
    } catch (error) {
      console.error('Error delivering account:', error);
      alert('Terjadi kesalahan saat mengirim akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setDeliveryData({
      ...deliveryData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Kirim Detail Akun</h2>
            <p className="text-gray-600">Kirim detail akun kepada pembeli</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Transaction Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Detail Transaksi</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Item:</p>
              <p className="font-medium">{escrowTransaction.accountTitle}</p>
            </div>
            <div>
              <p className="text-blue-600">Game:</p>
              <p className="font-medium">{escrowTransaction.gameName}</p>
            </div>
            <div>
              <p className="text-blue-600">Harga:</p>
              <p className="font-medium">{escrowTransaction.priceETH} ETH</p>
            </div>
            <div>
              <p className="text-blue-600">Pembeli:</p>
              <p className="font-mono text-xs break-all">{escrowTransaction.buyerWallet}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username/Email Akun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={deliveryData.username}
                  onChange={handleChange}
                  placeholder="contoh@email.com atau username123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Akun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="password"
                  value={deliveryData.password}
                  onChange={handleChange}
                  placeholder="password123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Terdaftar (jika berbeda)
              </label>
              <input
                type="email"
                name="email"
                value={deliveryData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informasi Tambahan
              </label>
              <textarea
                name="additionalInfo"
                value={deliveryData.additionalInfo}
                onChange={handleChange}
                rows={3}
                placeholder="ID Pemain, Server, Bind Phone, dll."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan untuk Pembeli
              </label>
              <textarea
                name="notes"
                value={deliveryData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Tips atau instruksi khusus untuk pembeli..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Penting!</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pastikan data akun yang Anda berikan benar dan dapat diakses</li>
                    <li>Setelah mengirim, pembeli akan melakukan verifikasi</li>
                    <li>Dana akan dirilis setelah pembeli mengkonfirmasi akun sesuai deskripsi</li>
                    <li>Jangan mengubah password setelah pengiriman</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Detail Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerDeliveryModal;