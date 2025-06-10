import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'metamask'
  const [emailCredentials, setEmailCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsConnecting(true);

    try {
      const { email, password } = emailCredentials;

      if (!email || !password) {
        throw new Error('Email dan password wajib diisi');
      }

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const backendErrors = {};
          if (data.errors.email) {
            backendErrors.email = data.errors.email;
          }
          if (data.errors.password) {
            backendErrors.password = data.errors.password;
          }
          throw new Error(data.message || 'Login gagal');
        } else {
          throw new Error(data.message || 'Login gagal');
        }
      }

      // Login successful
      const sessionData = {
        userId: data.user.id,
        email: data.user.email,
        nama: data.user.name,
        accountType: data.user.account_type,
        loginAt: new Date().toISOString()
      };

      // Save session
      localStorage.setItem('currentSession', JSON.stringify(sessionData));

      // If remember me is checked, save email
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(`email_${data.user.id}`);
      navigate('/');

    } catch (err) {
      console.error('Email login error:', err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (!window.ethereum) {
        throw new Error('Metamask tidak ditemukan. Silakan install ekstensi Metamask terlebih dahulu.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        await login(walletAddress);
        navigate('/');
      }
    } catch (err) {
      console.error('Kesalahan koneksi wallet:', err);
      setError(err.message || 'Terjadi kesalahan saat menghubungkan ke Metamask');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmailCredentials(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Masuk ke GameMarket
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Pilih metode login yang Anda inginkan
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm font-medium ${
                loginMethod === 'email' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMethod('metamask')}
              className={`flex-1 py-2 text-sm font-medium ${
                loginMethod === 'metamask' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              MetaMask Wallet
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-6">
            {loginMethod === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailCredentials.email}
                    onChange={handleEmailChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="nama@email.com"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={emailCredentials.password}
                      onChange={handleEmailChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Ingat saya
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => alert('Fitur lupa password akan segera tersedia')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Lupa password?
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isConnecting}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isConnecting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Masuk...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center text-sm">
                  <span className="text-gray-600">Belum punya akun?</span>{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Daftar sekarang
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
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
                          <path fill="#e4761b" d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zm-105 0l31.5 14.9-.2-9.3 2.5-22.1z"/>
                          <path fill="#d7c1b3" d="M138.8 193.5l-28.2-8.3 19.9-9.1zm40.9 0l8.3-17.4 20 9.1z"/>
                          <path fill="#233447" d="M106.8 247.4l4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
                        </svg>
                        Masuk dengan Metamask
                      </>
                    )}
                  </div>
                </button>
                
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
            )}
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

          {/* Button for returning to the homepage */}
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
