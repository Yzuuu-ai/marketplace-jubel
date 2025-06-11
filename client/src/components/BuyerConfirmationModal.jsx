// src/components/BuyerConfirmationModal.jsx
import React, { useState } from 'react';

const BuyerConfirmationModal = ({ escrowTransaction, onClose, onConfirm, onDispute }) => {
  const [confirmationType, setConfirmationType] = useState(''); // 'confirm' atau 'dispute'
  const [feedback, setFeedback] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const confirmationData = {
        confirmedAt: Date.now(),
        feedback: feedback,
        rating: 5, // Default good rating
        accountVerified: true
      };
      
      await onConfirm(confirmationData);
      onClose();
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Terjadi kesalahan saat konfirmasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      alert('Alasan sengketa harus diisi');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onDispute(disputeReason.trim());
      onClose();
    } catch (error) {
      console.error('Error creating dispute:', error);
      alert('Terjadi kesalahan saat membuat sengketa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryProof = escrowTransaction.deliveryProof;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Konfirmasi Penerimaan Akun</h2>
            <p className="text-gray-600">Verifikasi akun yang telah dikirim penjual</p>
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
              <p className="text-blue-600">Penjual:</p>
              <p className="font-mono text-xs break-all">{escrowTransaction.sellerWallet}</p>
            </div>
          </div>
        </div>

        {/* Account Details Received */}
        {deliveryProof && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-3">Detail Akun yang Diterima</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-green-600 font-medium">Username/Email:</p>
                  <p className="bg-white p-2 rounded border font-mono text-xs break-all">
                    {deliveryProof.username}
                  </p>
                </div>
                <div>
                  <p className="text-green-600 font-medium">Password:</p>
                  <p className="bg-white p-2 rounded border font-mono text-xs">
                    {deliveryProof.password}
                  </p>
                </div>
              </div>
              
              {deliveryProof.email && (
                <div>
                  <p className="text-green-600 font-medium">Email Terdaftar:</p>
                  <p className="bg-white p-2 rounded border text-xs">{deliveryProof.email}</p>
                </div>
              )}
              
              {deliveryProof.additionalInfo && (
                <div>
                  <p className="text-green-600 font-medium">Informasi Tambahan:</p>
                  <p className="bg-white p-2 rounded border text-xs">{deliveryProof.additionalInfo}</p>
                </div>
              )}
              
              {deliveryProof.notes && (
                <div>
                  <p className="text-green-600 font-medium">Catatan dari Penjual:</p>
                  <p className="bg-white p-2 rounded border text-xs">{deliveryProof.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Original Account Description */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Deskripsi Akun Original</h3>
          <div className="text-sm text-gray-700 space-y-1">
            {escrowTransaction.accountDetails?.level && (
              <p><strong>Level:</strong> {escrowTransaction.accountDetails.level}</p>
            )}
            {escrowTransaction.accountDetails?.rank && (
              <p><strong>Rank:</strong> {escrowTransaction.accountDetails.rank}</p>
            )}
            {escrowTransaction.accountDetails?.description && (
              <p><strong>Deskripsi:</strong> {escrowTransaction.accountDetails.description}</p>
            )}
            {!escrowTransaction.accountDetails && (
              <p className="text-gray-500 italic">Detail akun tidak tersedia</p>
            )}
          </div>
        </div>

        {/* Confirmation Form */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-800">Verifikasi Akun</h3>
          
          <div className="space-y-3">
            <label className="flex items-center p-4 border border-green-300 rounded-lg cursor-pointer hover:bg-green-50">
              <input
                type="radio"
                name="confirmation"
                value="confirm"
                checked={confirmationType === 'confirm'}
                onChange={(e) => setConfirmationType(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium text-green-700">✅ Akun Sesuai Deskripsi</span>
                <p className="text-sm text-green-600 mt-1">
                  Akun dapat diakses dan sesuai dengan deskripsi yang dijanjikan
                </p>
              </div>
            </label>

            <label className="flex items-center p-4 border border-red-300 rounded-lg cursor-pointer hover:bg-red-50">
              <input
                type="radio"
                name="confirmation"
                value="dispute"
                checked={confirmationType === 'dispute'}
                onChange={(e) => setConfirmationType(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1">
                <span className="font-medium text-red-700">❌ Ada Masalah dengan Akun</span>
                <p className="text-sm text-red-600 mt-1">
                  Akun tidak dapat diakses atau tidak sesuai deskripsi
                </p>
              </div>
            </label>
          </div>

          {confirmationType === 'confirm' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback untuk Penjual (Opsional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Berikan feedback positif untuk penjual..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              ></textarea>
            </div>
          )}

          {confirmationType === 'dispute' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Sengketa <span className="text-red-500">*</span>
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                placeholder="Jelaskan masalah yang Anda temukan dengan detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              ></textarea>
              
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-700">
                  <strong>Tips untuk sengketa yang valid:</strong>
                </p>
                <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                  <li>• Sertakan screenshot jika memungkinkan</li>
                  <li>• Jelaskan perbedaan antara yang dijanjikan dan diterima</li>
                  <li>• Berikan detail yang jelas dan objektif</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Tutup
          </button>
          
          {confirmationType === 'confirm' && (
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSubmitting ? 'Mengkonfirmasi...' : 'Konfirmasi Akun Diterima'}
            </button>
          )}
          
          {confirmationType === 'dispute' && (
            <button
              onClick={handleDispute}
              disabled={isSubmitting || !disputeReason.trim()}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                isSubmitting || !disputeReason.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isSubmitting ? 'Membuat Sengketa...' : 'Buat Sengketa'}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Panduan Verifikasi:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Login ke akun menggunakan detail yang diberikan</li>
            <li>2. Periksa apakah level, rank, dan item sesuai deskripsi</li>
            <li>3. Pastikan Anda dapat mengakses semua fitur akun</li>
            <li>4. Konfirmasi jika semuanya sesuai, atau buat sengketa jika ada masalah</li>
            <li>5. Dana akan dirilis ke penjual setelah konfirmasi Anda</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BuyerConfirmationModal;