// components/OrderModal.jsx
import React from 'react';

const OrderModal = ({ account, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Detail Pembelian</h2>
        <p><strong>Judul:</strong> {account.title}</p>
        <p><strong>Game:</strong> {account.gameName}</p>
        <p><strong>Harga:</strong> {account.price}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Bayar</button>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
