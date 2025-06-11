// src/components/AccountConflictModal.jsx
import React, { useState } from 'react';

const AccountConflictModal = ({ isOpen, onClose, conflicts, onMerge }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMergeOption, setSelectedMergeOption] = useState(null);

  if (!isOpen || !conflicts) return null;

  const handleMerge = async (mergeOption) => {
    setIsProcessing(true);
    setSelectedMergeOption(mergeOption);
    
    try {
      await onMerge(mergeOption);
    } catch (error) {
      console.error('Error merging accounts:', error);
      alert('Gagal menggabungkan akun: ' + error.message);
    } finally {
      setIsProcessing(false);
      setSelectedMergeOption(null);
    }
  };

  const renderConflictInfo = () => {
    const { email_conflicts, wallet_conflicts } = conflicts;
    
    return (
      <div className="space-y-4">
        {email_conflicts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Konflik Email</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              {email_conflicts.existsInUsers && (
                <p>• Email sudah terdaftar di sistem akun email</p>
              )}
              {email_conflicts.existsInWalletProfiles && (
                <p>• Email sudah terdaftar di sistem wallet</p>
              )}
            </div>
          </div>
        )}
        
        {wallet_conflicts && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Konflik Wallet</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {wallet_conflicts.existsInUsers && (
                <p>• Wallet sudah terhubung dengan akun email</p>
              )}
              {wallet_conflicts.existsInConnectedWallets && (
                <p>• Wallet sudah terdaftar sebagai wallet terhubung</p>
              )}
              {wallet_conflicts.existsInWalletProfiles && (
                <p>• Wallet sudah terdaftar sebagai akun wallet standalone</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMergeSuggestions = () => {
    if (!conflicts.can_merge || conflicts.merge_suggestions.length === 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Tidak Dapat Digabung Otomatis</h4>
          <p className="text-sm text-red-700">
            Konflik ini memerlukan penanganan manual. Silakan hubungi administrator untuk bantuan.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Opsi Penggabungan Akun</h4>
        {conflicts.merge_suggestions.map((suggestion, index) => (
          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-green-800 mb-1">
                  {suggestion.type === 'merge_wallet_to_email' ? 'Gabungkan ke Akun Email' : 'Resolusi Konflik'}
                </h5>
                <p className="text-sm text-green-700 mb-3">
                  {suggestion.description}
                </p>
                
                {suggestion.data && (
                  <div className="text-xs text-green-600 space-y-1">
                    <p><strong>Akun Email:</strong> {suggestion.data.email_account?.name} ({suggestion.data.email_account?.email})</p>
                    <p><strong>Akun Wallet:</strong> {suggestion.data.wallet_account?.name}</p>
                  </div>
                )}
              </div>
              
              {!suggestion.requires_manual_resolution && (
                <button
                  onClick={() => handleMerge(suggestion)}
                  disabled={isProcessing}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 text-sm flex items-center gap-2"
                >
                  {isProcessing && selectedMergeOption === suggestion ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menggabung...
                    </>
                  ) : (
                    'Gabungkan'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Konflik Akun Terdeteksi
            </h3>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-medium text-orange-800">Perhatian</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Sistem mendeteksi bahwa email atau wallet yang Anda gunakan sudah terdaftar di sistem. 
                  Silakan pilih opsi di bawah untuk menyelesaikan konflik ini.
                </p>
              </div>
            </div>
          </div>
          
          {renderConflictInfo()}
          {renderMergeSuggestions()}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountConflictModal;