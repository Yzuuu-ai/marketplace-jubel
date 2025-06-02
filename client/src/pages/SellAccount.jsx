// src/pages/SellAccount.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const SellAccount = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sell');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [formData, setFormData] = useState({
    gameId: '',
    title: '',
    level: '',
    rank: '',
    price: '',
    description: '',
    image: '/images/games/default.jpg'
  });
  const [games, setGames] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [myListings, setMyListings] = useState([]);

  // Daftar game yang tersedia
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    
    setGames([
      { id: 1, name: 'Mobile Legends', code: 'ML', image: '/images/games/ml.jpg' },
      { id: 2, name: 'PUBG Mobile', code: 'PUBG', image: '/images/games/pubg.jpg' },
      { id: 3, name: 'Free Fire', code: 'FF', image: '/images/games/ff.jpg' },
      { id: 4, name: 'Genshin Impact', code: 'GI', image: '/images/games/genshin.jpg' }
    ]);
  }, [isAuthenticated, navigate]);

  // Fungsi untuk menghasilkan judul akun secara otomatis
  const generateAccountTitle = useCallback((gameId) => {
    const game = games.find(g => g.id === parseInt(gameId));
    if (!game) return '';
    const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const gameAccounts = existingAccounts.filter(acc => acc.gameId === parseInt(gameId));
    const nextNumber = gameAccounts.length + 1;
    return `${game.code}-${nextNumber.toString().padStart(3, '0')}`;
  }, [games]);

  // Fungsi untuk mendapatkan daftar akun dari localStorage milik wallet saat ini
  const getMyListings = useCallback(() => {
    const allAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    return allAccounts.filter(acc => acc.sellerWallet === walletAddress);
  }, [walletAddress]);

  // Perbarui daftar akun yang terdaftar
  const refreshListings = useCallback(() => {
    setMyListings(getMyListings());
  }, [getMyListings]);

  useEffect(() => {
    if (activeTab === 'list') {
      refreshListings();
    }
  }, [activeTab, refreshListings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Jika game dipilih, generate judul otomatis dan pasang gambar default game
    if (name === 'gameId' && value) {
      const selectedGame = games.find(g => g.id === parseInt(value));
      newFormData.title = generateAccountTitle(value);
      newFormData.image = selectedGame?.image || '/images/games/default.jpg';
      setPreviewImage(selectedGame?.image || '/images/games/default.jpg');
    }
    setFormData(newFormData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validasi form: pastikan field yang wajib diisi sudah terisi
      if (!formData.gameId || !formData.title || !formData.price) {
        throw new Error('Harap isi semua field yang wajib diisi');
      }
      
      const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');

      // Jika dalam mode editing, perbarui data akun yang ada
      if (isEditing) {
        const updatedAccounts = existingAccounts.map(acc =>
          acc.id === editingAccountId
            ? {
                ...acc,
                gameId: parseInt(formData.gameId),
                title: formData.title,
                level: formData.level,
                rank: formData.rank,
                price: `${formData.price} ETH`,
                description: formData.description,
                image: formData.image,
              }
            : acc
        );
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      } else {
        // Buat akun baru
        const newAccount = {
          id: Date.now(), // ID unik berdasarkan timestamp
          gameId: parseInt(formData.gameId),
          title: formData.title,
          level: formData.level,
          rank: formData.rank,
          price: `${formData.price} ETH`,
          description: formData.description,
          image: formData.image,
          sellerWallet: walletAddress,
          sellerName: `Seller-${walletAddress.substring(0, 6)}`,
          createdAt: new Date().toISOString()
        };
        const updatedAccounts = [...existingAccounts, newAccount];
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      }
      
      // Reset form dan mode editing
      setFormData({
        gameId: '',
        title: '',
        level: '',
        rank: '',
        price: '',
        description: '',
        image: '/images/games/default.jpg'
      });
      setPreviewImage('');
      setIsEditing(false);
      setEditingAccountId(null);

      setSuccess(true);
      refreshListings();
      
      setTimeout(() => {
        setSuccess(false);
        if (!isEditing) {
          setActiveTab('list');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan akun');
    } finally {
      setSubmitting(false);
    }
  };

  // Fungsi hapus akun
  const handleDelete = (id) => {
    const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const updatedAccounts = existingAccounts.filter(acc => acc.id !== id);
    localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
    refreshListings();
  };

  // Fungsi edit akun: masukkan data akun ke form untuk diperbarui
  const handleEdit = (account) => {
    setFormData({
      gameId: account.gameId.toString(),
      title: account.title,
      level: account.level,
      rank: account.rank,
      price: account.price.replace(' ETH', ''),
      description: account.description,
      image: account.image
    });
    setPreviewImage(account.image);
    setIsEditing(true);
    setEditingAccountId(account.id);
    setActiveTab('sell');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isEditing ? 'Edit Akun Game Anda' : 'Jual Akun Game Anda'}
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              {isEditing
                ? 'Perbarui informasi akun yang terdaftar'
                : 'Dapatkan keuntungan dari akun game yang tidak lagi Anda gunakan'}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center gap-4">
          <button
            onClick={() => { 
              setActiveTab('sell'); 
              setIsEditing(false); 
              setEditingAccountId(null);
              setFormData({
                gameId: '',
                title: '',
                level: '',
                rank: '',
                price: '',
                description: '',
                image: '/images/games/default.jpg'
              });
              setPreviewImage('');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'sell' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {isEditing ? 'Edit Akun' : 'Jual Akun Baru'}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Akun Terdaftar
          </button>
        </div>
      </section>

      {/* Konten Tab */}
      {activeTab === 'sell' ? (
        // Form Jual Akun / Edit
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isEditing ? 'Akun Berhasil Diedit!' : 'Akun Berhasil Dijual!'}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {isEditing
                      ? 'Informasi akun telah diperbarui.'
                      : 'Akun Anda sekarang tersedia di marketplace'}
                  </p>
                  <p className="text-gray-500">Anda akan diarahkan ke daftar akun...</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Detail Akun Game</h2>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    {/* Image Preview and Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Akun
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                          <img 
                            src={previewImage || formData.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="imageUpload"
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                          >
                            Unggah Gambar
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Format: JPG, PNG (Maks. 2MB)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-1">
                          Pilih Game <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="gameId"
                          name="gameId"
                          value={formData.gameId}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Pilih Game</option>
                          {games.map((game) => (
                            <option key={game.id} value={game.id}>
                              {game.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Judul Akun <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="Contoh: ML-001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                          required
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                          Level Akun
                        </label>
                        <input
                          type="number"
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          placeholder="Contoh: 30"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
                          Rank Akun
                        </label>
                        <input
                          type="text"
                          id="rank"
                          name="rank"
                          value={formData.rank}
                          onChange={handleChange}
                          placeholder="Contoh: Mythic Glory"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Harga (ETH) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Contoh: 0.05"
                        step="0.001"
                        min="0.001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi Akun
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Deskripsikan detail akun, skin, hero, item, dll."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Informasi Penjual
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="w-full sm:w-1/2">
                            <p className="font-medium text-gray-700 mb-1">Wallet Penjual:</p>
                            <p className="text-gray-700 break-all text-sm">{walletAddress}</p>
                          </div>
                          <div className="w-full sm:w-1/2">
                            <p className="font-medium text-gray-700 mb-1">Nama Penjual:</p>
                            <p className="text-gray-700 text-sm">Seller-{walletAddress.substring(0, 6)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Jual Akun Sekarang'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
            
            {/* Informasi tambahan */}
            <div className="mt-8 bg-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Tips Menjual Akun</h3>
              <ul className="space-y-3 text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Berikan deskripsi yang jelas dan jujur tentang kondisi akun</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Harga yang wajar akan membuat akun Anda lebih cepat terjual</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Pastikan Anda tidak lagi menggunakan akun yang dijual</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Transaksi aman melalui sistem blockchain kami</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Gunakan gambar yang jelas untuk menarik pembeli</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      ) : (
        // Daftar Akun Terdaftar
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Akun Terdaftar</h2>
            {myListings.length === 0 ? (
              <p className="text-center text-gray-600">Belum ada akun yang dijual.</p>
            ) : (
              <div className="grid gap-6">
                {myListings.map(account => (
                  <div key={account.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                        <img src={account.image} alt={account.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{account.title}</h4>
                        <p className="text-sm text-gray-600">Harga: {account.price}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button
                        onClick={() => handleEdit(account)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 GameMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SellAccount;