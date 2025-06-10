// src/pages/SellAccount.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useAdmin, ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from '../context/AdminContext';

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
    images: [], // Changed to array for multiple images
    contactType: 'whatsapp', // Default contact type
    contactValue: '' // Single contact value
  });
  const [games, setGames] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState([]); // Array for multiple previews
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
      // Set default image if no images uploaded
      if (newFormData.images.length === 0) {
        newFormData.images = [selectedGame?.image || '/images/games/default.jpg'];
        setPreviewImages([selectedGame?.image || '/images/games/default.jpg']);
      }
    }
    setFormData(newFormData);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5; // Maximum 5 images
    
    if (files.length + formData.images.length > maxImages) {
      alert(`Maksimal ${maxImages} gambar yang dapat diunggah`);
      return;
    }

    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result);
        newPreviews.push(reader.result);
        
        if (newImages.length === files.length) {
          setFormData(prev => ({ 
            ...prev, 
            images: [...prev.images, ...newImages] 
          }));
          setPreviewImages(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    setPreviewImages(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.gameId || !formData.title || !formData.price) {
        throw new Error('Harap isi semua field yang wajib diisi');
      }

      if (!formData.contactValue.trim()) {
        throw new Error('Harap isi informasi kontak');
      }
      
      // Get user profile for seller name
      const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      const sellerProfile = userProfiles[walletAddress];
      const sellerName = sellerProfile?.nama || `Seller-${walletAddress.substring(0, 6)}`;
      
      const existingAccounts = JSON.parse(localStorage.getItem('gameAccounts') || '[]');

      // Use first image as main image, or default
      const mainImage = formData.images.length > 0 ? formData.images[0] : '/images/games/default.jpg';

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
                image: mainImage,
                images: formData.images,
                sellerName: sellerName,
                contactType: formData.contactType,
                contactValue: formData.contactValue
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
          image: mainImage,
          images: formData.images,
          sellerWallet: walletAddress,
          sellerName: sellerName,
          contactType: formData.contactType,
          contactValue: formData.contactValue,
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
        images: [],
        contactType: 'whatsapp',
        contactValue: ''
      });
      setPreviewImages([]);
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

    // Handle old data format (with whatsapp, instagram, telegram fields)
    let contactType = 'whatsapp';
    let contactValue = '';
    
    if (account.contactType && account.contactValue) {
      // New format
      contactType = account.contactType;
      contactValue = account.contactValue;
    } else {
      // Old format - get the first available contact
      if (account.whatsapp) {
        contactType = 'whatsapp';
        contactValue = account.whatsapp;
      } else if (account.instagram) {
        contactType = 'instagram';
        contactValue = account.instagram;
      } else if (account.telegram) {
        contactType = 'telegram';
        contactValue = account.telegram;
      }
    }

    setFormData({
      gameId: account.gameId.toString(),
      title: account.title,
      level: account.level || '',
      rank: account.rank || '',
      price: account.price.replace(' ETH', ''),
      description: account.description || '',
      images: account.images || [account.image] || [],
      contactType: contactType,
      contactValue: contactValue
    });
    setPreviewImages(account.images || [account.image] || []);
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

  const getContactDisplay = (account) => {
    if (account.contactType && account.contactValue) {
      const icons = {
        whatsapp: '📱',
        instagram: '📷',
        telegram: '✈️'
      };
      const labels = {
        whatsapp: 'WA',
        instagram: 'IG',
        telegram: 'TG'
      };
      return `${icons[account.contactType]} ${labels[account.contactType]}: ${account.contactValue}`;
    }
    
    // Handle old format
    if (account.whatsapp) return `📱 WA: ${account.whatsapp}`;
    if (account.instagram) return `📷 IG: ${account.instagram}`;
    if (account.telegram) return `✈️ TG: ${account.telegram}`;
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              {isEditing ? 'Edit Akun Game' : 'Jual Akun Game'}
            </h1>
            <p className="text-lg">
              {isEditing
                ? 'Perbarui informasi akun Anda'
                : 'Jual akun game dengan mudah dan aman'}
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
                images: [],
                contactType: 'whatsapp',
                contactValue: ''
              });
              setPreviewImages([]);
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
        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md p-6">
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
                  <p className="text-gray-600">
                    {isEditing
                      ? 'Informasi akun telah diperbarui.'
                      : 'Akun Anda sekarang tersedia di marketplace'}
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Detail Akun Game</h2>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    {/* Image Upload Section */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Akun <span className="text-gray-500">(Maks. 5 gambar)</span>
                      </label>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {previewImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        {previewImages.length < 5 && (
                          <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs text-gray-500 mt-1">Tambah</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Harga (ETH) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.05"
                          step="0.001"
                          min="0.001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Game Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Kode Akun
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                          Level
                        </label>
                        <input
                          type="number"
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          placeholder="30"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
                          Rank
                        </label>
                        <input
                          type="text"
                          id="rank"
                          name="rank"
                          value={formData.rank}
                          onChange={handleChange}
                          placeholder="Mythic"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="mb-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Deskripsikan akun Anda (skin, hero, item, dll)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Informasi Kontak <span className="text-red-500">*</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contactType" className="block text-sm text-gray-600 mb-1">
                            Pilih Platform
                          </label>
                          <select
                            id="contactType"
                            name="contactType"
                            value={formData.contactType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="instagram">Instagram</option>
                            <option value="telegram">Telegram</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="contactValue" className="block text-sm text-gray-600 mb-1">
                            {formData.contactType === 'whatsapp' ? 'Nomor WhatsApp' :
                             formData.contactType === 'instagram' ? 'Username Instagram' :
                             'Username Telegram'}
                          </label>
                          <input
                            type="text"
                            id="contactValue"
                            name="contactValue"
                            value={formData.contactValue}
                            onChange={handleChange}
                            placeholder={
                              formData.contactType === 'whatsapp' ? '628123456789' :
                              formData.contactType === 'instagram' ? '@username' :
                              '@username'
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        * Kontak akan ditampilkan kepada pembeli untuk memudahkan komunikasi
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Jual Akun'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Akun Terdaftar</h2>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Semua ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilterStatus('available')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'available' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Tersedia ({stats.available})
                  </button>
                  <button
                    onClick={() => setFilterStatus('escrow')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'escrow' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Escrow ({stats.inEscrow})
                  </button>
                  <button
                    onClick={() => setFilterStatus('sold')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'sold' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Terjual ({stats.sold})
                  </button>
                </div>
              </div>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-600">
                  {filterStatus === 'all' ? 'Belum ada akun yang dijual.' :
                   filterStatus === 'available' ? 'Belum ada akun yang tersedia.' :
                   filterStatus === 'escrow' ? 'Belum ada akun dalam proses escrow.' :
                   'Belum ada akun yang terjual.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map(account => {
                  const game = games.find(g => g.id === account.gameId);
                  const contactInfo = getContactDisplay(account);
                  
                  return (
                    <div key={account.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            src={account.images?.[0] || account.image} 
                            alt={account.title} 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{account.title}</h3>
                            <p className="text-sm text-gray-600">{game?.name} • {account.price}</p>
                            {account.level && <p className="text-sm text-gray-500">Level: {account.level}</p>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {account.isInEscrow && account.escrowStatus && getEscrowStatusBadge(account)}
                          
                          {account.isSold ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              Terjual
                            </span>
                          ) : account.isInEscrow ? (
                            <button
                              onClick={() => navigate('/escrow')}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                            >
                              Lihat Escrow
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(account)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      {contactInfo && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm text-gray-600">{contactInfo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 GameMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SellAccount;