// src/context/RatingContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const RatingContext = createContext();

export const RatingProvider = ({ children }) => {
  const [ratings, setRatings] = useState([]);
  const [sellerStats, setSellerStats] = useState({});

  // Load ratings dari localStorage
  useEffect(() => {
    const savedRatings = JSON.parse(localStorage.getItem('sellerRatings') || '[]');
    const savedStats = JSON.parse(localStorage.getItem('sellerStats') || '{}');
    setRatings(savedRatings);
    setSellerStats(savedStats);
  }, []);

  // Calculate seller statistics
  const calculateSellerStats = (sellerWallet) => {
    const sellerRatings = ratings.filter(r => r.sellerWallet === sellerWallet);
    
    if (sellerRatings.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        totalSales: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verified: false,
        badges: []
      };
    }

    const totalRating = sellerRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / sellerRatings.length).toFixed(1);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    sellerRatings.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    const badges = [];
    if (sellerRatings.length >= 100) badges.push('trusted_seller');
    if (averageRating >= 4.8) badges.push('top_rated');
    if (sellerRatings.length >= 50 && averageRating >= 4.5) badges.push('power_seller');

    const responseRate = Math.random() * 40 + 60; // 60-100%
    if (responseRate >= 90) badges.push('fast_response');

    return {
      averageRating: parseFloat(averageRating),
      totalReviews: sellerRatings.length,
      totalSales: sellerRatings.length, // Simulasi dari jumlah rating
      ratingDistribution,
      verified: sellerRatings.length >= 10 && averageRating >= 4.0,
      badges,
      responseRate: responseRate.toFixed(0),
      responseTime: '< 1 jam' // Simulasi
    };
  };

  // Add new rating
  const addRating = (ratingData) => {
    const newRating = {
      id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ratingData,
      createdAt: Date.now(),
      helpful: 0,
      notHelpful: 0,
      buyerVerified: true
    };

    const updatedRatings = [...ratings, newRating];
    setRatings(updatedRatings);
    localStorage.setItem('sellerRatings', JSON.stringify(updatedRatings));

    const stats = calculateSellerStats(ratingData.sellerWallet);
    const updatedStats = { ...sellerStats, [ratingData.sellerWallet]: stats };
    setSellerStats(updatedStats);
    localStorage.setItem('sellerStats', JSON.stringify(updatedStats));

    return newRating;
  };

  // Get ratings for specific seller
  const getSellerRatings = (sellerWallet) => {
    return ratings.filter(r => r.sellerWallet === sellerWallet)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  // Get seller statistics
  const getSellerStats = (sellerWallet) => {
    if (!sellerStats[sellerWallet]) {
      const stats = calculateSellerStats(sellerWallet);
      setSellerStats(prev => ({ ...prev, [sellerWallet]: stats }));
      return stats;
    }
    return sellerStats[sellerWallet];
  };

  // Check if user can rate
  const canUserRate = (buyerWallet, sellerWallet, transactionId) => {
    const existingRating = ratings.find(r => 
      r.transactionId === transactionId && 
      r.buyerWallet === buyerWallet
    );
    return !existingRating;
  };

  // Vote rating as helpful or not
  const voteRating = (ratingId, voteType) => {
    const updatedRatings = ratings.map(r => {
      if (r.id === ratingId) {
        return {
          ...r,
          [voteType]: r[voteType] + 1
        };
      }
      return r;
    });

    setRatings(updatedRatings);
    localStorage.setItem('sellerRatings', JSON.stringify(updatedRatings));
  };

  const value = {
    ratings,
    sellerStats,
    addRating,
    getSellerRatings,
    getSellerStats,
    canUserRate,
    voteRating,
    calculateSellerStats
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
};

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within RatingProvider');
  }
  return context;
};
