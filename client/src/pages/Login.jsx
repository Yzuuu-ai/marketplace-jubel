import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Cek apakah Metamask terinstall
      if (!window.ethereum) {
        throw new Error('Metamask tidak ditemukan. Silakan install ekstensi Metamask terlebih dahulu.');
      }

      // Meminta koneksi ke akun Metamask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        // Simpan alamat wallet
        const walletAddress = accounts[0];
        login(walletAddress);
      }
    } catch (err) {
      console.error('Kesalahan koneksi wallet:', err);
      setError(err.message || 'Terjadi kesalahan saat menghubungkan ke Metamask');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handler untuk placeholder terms dan privacy
  const handlePlaceholderLink = (page) => {
    alert(`Halaman ${page} akan segera tersedia`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
          <div>
            <div className="mx-auto flex items-center justify-center bg-blue-100 rounded-full w-16 h-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Masuk ke GameMarket
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Gunakan Metamask untuk masuk ke platform kami
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isConnecting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center">
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 318.6 318.6">
                        <path fill="#e2761b" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
                        <path fill="#e4761b" d="M44.4 35.5l98.7 74.6-17.5-44.3zm193.9 171.3l-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z"/>
                        <path fill="#e4761b" d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5zm111.3 0l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5l33.9 16.5-4.7-39.3z"/>
                        <path fill="#d7c1b3" d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zm-105 0l31.5 14.9-.2-9.3 2.5-22.1z"/>
                        <path fill="#233447" d="M138.8 193.5l-28.2-8.3 19.9-9.1zm40.9 0l8.3-17.4 20 9.1z"/>
                        <path fill="#cd6116" d="M106.8 247.4l4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
                        <path fill="#e4751f" d="M87.8 162.1l23.6 46-.8-22.9zm120.3 23.1l-1 22.9 23.7-46zm-64-20.6l-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0l-2.7 18 1.2 45 6.7-34.1z"/>
                        <path fill="#f6851b" d="M179.8 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"/>
                        <path fill="#c0ad9e" d="M180.3 262.3l.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"/>
                        <path fill="#161616" d="M177.9 230.9l-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"/>
                        <path fill="#763d16" d="M278.3 114.2l8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"/>
                        <path fill="#f6851b" d="M267.2 153.5l-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.9-15.3l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"/>
                      </svg>
                      Masuk dengan Metamask
                    </>
                  )}
                </div>
              </button>
              
              {error && (
                <div className="mt-4 text-red-600 text-center bg-red-50 py-2 px-4 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Belum punya wallet?{' '}
                <a 
                  href="https://metamask.io/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Download Metamask
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center">
              Dengan masuk, Anda menyetujui{' '}
              <button 
                type="button"
                onClick={() => handlePlaceholderLink('Syarat & Ketentuan')}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Syarat & Ketentuan
              </button>{' '}
              dan{' '}
              <button 
                type="button"
                onClick={() => handlePlaceholderLink('Kebijakan Privasi')}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Kebijakan Privasi
              </button>{' '}
              kami
            </p>
          </div>

          {/* Tambahkan tombol untuk kembali ke beranda */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 GameMarket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;