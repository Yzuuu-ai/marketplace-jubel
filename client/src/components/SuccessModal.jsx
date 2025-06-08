import React from 'react';

const SuccessModal = ({ 
  message, 
  onClose, 
  onNavigate, 
  transactionHash, 
  explorerUrl 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Pembayaran Berhasil!</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          
          {transactionHash && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Hash Transaksi:</p>
              <p className="text-xs font-mono text-gray-600 break-all mb-2">{transactionHash}</p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Lihat di Blockchain Explorer
                </a>
              )}
            </div>
          )}
          
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
              Lanjutkan Belanja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;