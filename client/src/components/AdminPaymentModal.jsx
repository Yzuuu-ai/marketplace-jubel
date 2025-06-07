// src/components/AdminPaymentModal.jsx
import React, { useState } from 'react';

const AdminPaymentModal = ({ transaction, action, onClose, onConfirm }) => {
  const [paymentHash, setPaymentHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentHash.trim()) {
      alert('Transaction hash wajib diisi');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(paymentHash.trim());
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const isRefund = action === 'refund';
  const recipientWallet = isRefund ? transaction.buyerWallet : transaction.sellerWallet;
  const recipientLabel = isRefund ? 'Buyer' : 'Seller';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {isRefund ? 'Refund ke Buyer' : 'Bayar ke Seller'}
        </h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Transaksi: {transaction.accountTitle}</p>
          <p className="text-sm text-gray-600 mb-2">Jumlah: {transaction.priceETH} ETH</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Penting!</h3>
          <p className="text-sm text-yellow-700 mb-2">
            Admin harus transfer {transaction.priceETH} ETH ke:
          </p>
          <div className="bg-yellow-100 p-2 rounded">
            <p className="text-xs text-yellow-800 font-medium">{recipientLabel}:</p>
            <p className="font-mono text-xs break-all">{recipientWallet}</p>
          </div>
          <p className="text-xs text-yellow-600 mt-2">
            Dari wallet escrow: {transaction.escrowWallet}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash Pembayaran ke {recipientLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentHash}
              onChange={(e) => setPaymentHash(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Masukkan hash transaksi setelah mengirim {transaction.priceETH} ETH ke {recipientLabel}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : isRefund
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPaymentModal;