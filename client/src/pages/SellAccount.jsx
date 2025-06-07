// src/pages/SellAccount.jsx - Fixed unused import
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useAdmin, ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from '../context/AdminContext';
// Removed unused import 'ESCROW_STATUS'

const SellAccount = () => {
  const { walletAddress, isAuthenticated } = useAuth();
  const { escrowTransactions } = useAdmin();
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
  const [filterStatus, setFilterStatus] = useState('all');

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

  const generateAccountTitle = useCallback((gameId) => {
    const game = games.find(g => g.id === parseInt(gameId));
    if (!game) return '';
    const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const gameAccounts = existingAccounts.filter(acc => acc.gameId === parseInt(gameId));
    const nextNumber = gameAccounts.length + 1;
    return `${game.code}-${nextNumber.toString().padStart(3, '0')}`;
  }, [games]);

  const getMyListings = useCallback(() => {
    const allAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
    const myAccounts = allAccounts.filter(acc => acc.sellerWallet === walletAddress);
    
    // Add escrow status to accounts
    const accountsWithEscrow = myAccounts.map(account => {
      if (account.escrowId) {
        const escrowTx = escrowTransactions.find(tx => tx.id === account.escrowId);
        if (escrowTx) {
          return {
            ...account,
            escrowStatus: escrowTx.status,
            escrowTransaction: escrowTx
          };
        }
      }
      return account;
    });
    
    if (filterStatus === 'available') {
      return accountsWithEscrow.filter(acc => !acc.isSold && !acc.isInEscrow);
    } else if (filterStatus === 'sold') {
      return accountsWithEscrow.filter(acc => acc.isSold);
    } else if (filterStatus === 'escrow') {
      return accountsWithEscrow.filter(acc => acc.isInEscrow);
    }
    return accountsWithEscrow;
  }, [walletAddress, filterStatus, escrowTransactions]);

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
      if (!formData.gameId || !formData.title || !formData.price) {
        throw new Error('Harap isi semua field yang wajib diisi');
      }
      
      const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');

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
        const newAccount = {
          id: Date.now(),
          gameId: parseInt(formData.gameId),
          title: formData.title,
          level: formData.level,
          rank: formData.rank,
          price: `${formData.price} ETH`,
          description: formData.description,
          image: formData.image,
          sellerWallet: walletAddress,
          sellerName: `Seller-${walletAddress.substring(0, 6)}`,
          createdAt: new Date().toISOString(),
          isSold: false,
          isInEscrow: false,
          soldAt: null,
          buyerWallet: null,
          buyerName: null
        };
        const updatedAccounts = [...existingAccounts, newAccount];
        localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      }
      
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

  const handleDelete = (id) => {
    const account = myListings.find(acc => acc.id === id);
    if (account.isInEscrow) {
      alert('Tidak dapat menghapus akun yang sedang dalam proses escrow');
      return;
    }
    
    if (window.confirm('Yakin ingin menghapus akun ini?')) {
      const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');
      const updatedAccounts = existingAccounts.filter(acc => acc.id !== id);
      localStorage.setItem('gameAccounts', JSON.stringify(updatedAccounts));
      refreshListings();
    }
  };

  const handleEdit = (account) => {
    if (account.isSold || account.isInEscrow) {
      alert('Akun yang sudah terjual atau dalam escrow tidak dapat diedit');
      return;
    }

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

  const getAccountStats = () => {
    const allMyAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]')
      .filter(acc => acc.sellerWallet === walletAddress);
    
    return {
      total: allMyAccounts.length,
      available: allMyAccounts.filter(acc => !acc.isSold && !acc.isInEscrow).length,
      sold: allMyAccounts.filter(acc => acc.isSold).length,
      inEscrow: allMyAccounts.filter(acc => acc.isInEscrow).length
    };
  };

  const stats = getAccountStats();

  const getEscrowStatusBadge = (account) => {
    if (!account.escrowStatus) return null;
    
    return (
      <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${ESCROW_STATUS_COLORS[account.escrowStatus]}`}>
        {ESCROW_STATUS_LABELS[account.escrowStatus]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
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
            Akun Terdaftar ({stats.total})
          </button>
        </div>
      </section>

      {activeTab === 'sell' ? (
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
                  <span className="text-left">Transaksi aman melalui sistem escrow blockchain kami</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">Dana akan dirilis setelah pembeli konfirmasi penerimaan</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Akun Terdaftar</h2>
                
                <div className="flex gap-4 text-sm">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    Total: {stats.total}
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Tersedia: {stats.available}
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    Escrow: {stats.inEscrow}
                  </div>
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    Terjual: {stats.sold}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  onClick={() => setFilterStatus('available')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterStatus === 'available' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tersedia ({stats.available})
                </button>
                <button
                  onClick={() => setFilterStatus('escrow')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterStatus === 'escrow' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  In Escrow ({stats.inEscrow})
                </button>
                <button
                  onClick={() => setFilterStatus('sold')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterStatus === 'sold' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Terjual ({stats.sold})
                </button>
              </div>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {filterStatus === 'all' ? 'Belum ada akun yang dijual.' :
                   filterStatus === 'available' ? 'Belum ada akun yang tersedia.' :
                   filterStatus === 'escrow' ? 'Belum ada akun dalam proses escrow.' :
                   'Belum ada akun yang terjual.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {myListings.map(account => (
                  <div key={account.id} className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${
                    account.isSold ? 'border-red-500 bg-red-50' : 
                    account.isInEscrow ? 'border-purple-500 bg-purple-50' : 
                    'border-green-500'
                  }`}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                            <img src={account.image} alt={account.title} className="w-full h-full object-cover" />
                          </div>
                          {account.isSold && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                              SOLD
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{account.title}</h4>
                          <p className="text-sm text-gray-600">Harga: {account.price}</p>
                          {account.level && <p className="text-sm text-gray-500">Level: {account.level}</p>}
                          {account.rank && <p className="text-sm text-gray-500">Rank: {account.rank}</p>}
                        </div>
                      </div>

                      {account.isInEscrow && account.escrowStatus ? (
                        <div className="flex items-center gap-2">
                          {getEscrowStatusBadge(account)}
                          <button
                            onClick={() => navigate('/escrow')}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                          >
                            View Escrow
                          </button>
                        </div>
                      ) : account.isSold ? (
                        <div className="bg-red-100 border border-red-200 rounded-lg p-3 min-w-0 lg:min-w-[250px]">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-red-800">TERJUAL</span>
                          </div>
                          <div className="text-xs text-red-700 space-y-1">
                            <p><strong>Tanggal:</strong> {new Date(account.soldAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-100 border border-green-200 rounded-lg p-3 min-w-0 lg:min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">TERSEDIA</span>
                          </div>
                          <p className="text-xs text-green-700">
                            Ditambahkan: {new Date(account.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {!account.isSold && !account.isInEscrow && (
                          <>
                            <button
                              onClick={() => handleEdit(account)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                        {account.isInEscrow && (
                          <button
                            onClick={() => navigate('/escrow')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            Lihat Detail Escrow
                          </button>
                        )}
                      </div>
                    </div>

                    {account.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">{account.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {myListings.length > 0 && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Info Escrow:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Akun yang sedang dalam proses escrow tidak dapat diedit atau dihapus</li>
                  <li>• Dana akan dirilis ke wallet Anda setelah pembeli konfirmasi penerimaan</li>
                  <li>• Anda dapat melihat status escrow di halaman Escrow Management</li>
                  <li>• Kirim detail akun segera setelah pembayaran dikonfirmasi admin</li>
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

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