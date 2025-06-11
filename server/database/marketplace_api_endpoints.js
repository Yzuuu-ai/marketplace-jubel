// marketplace_api_endpoints.js
// Additional API endpoints for marketplace functionality
// Add these to your server.js file

const express = require('express');
const mysql = require('mysql2');

// ===== MARKETPLACE SPECIFIC ENDPOINTS =====

// Get marketplace statistics
app.get('/api/marketplace/stats', (req, res) => {
  const queries = {
    totalAccounts: 'SELECT COUNT(*) as count FROM game_accounts WHERE is_sold = FALSE AND is_in_escrow = FALSE',
    totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE',
    totalTransactions: 'SELECT COUNT(*) as count FROM escrow_transactions WHERE status = "completed"',
    totalVolume: 'SELECT COALESCE(SUM(amount), 0) as volume FROM escrow_transactions WHERE status = "completed"',
    gameStats: `
      SELECT g.name, g.code, COUNT(ga.id) as account_count, AVG(ga.price) as avg_price
      FROM games g 
      LEFT JOIN game_accounts ga ON g.id = ga.game_id AND ga.is_sold = FALSE AND ga.is_in_escrow = FALSE
      GROUP BY g.id, g.name, g.code
      ORDER BY account_count DESC
    `,
    recentAccounts: `
      SELECT ga.*, g.name as game_name 
      FROM game_accounts ga 
      JOIN games g ON ga.game_id = g.id 
      WHERE ga.is_sold = FALSE AND ga.is_in_escrow = FALSE 
      ORDER BY ga.created_at DESC 
      LIMIT 5
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (error, result) => {
      if (error) {
        console.error(`Error in ${key} query:`, error);
        results[key] = { error: error.message };
      } else {
        results[key] = result;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json({
          success: true,
          stats: {
            totalAccounts: results.totalAccounts[0]?.count || 0,
            totalUsers: results.totalUsers[0]?.count || 0,
            totalTransactions: results.totalTransactions[0]?.count || 0,
            totalVolume: parseFloat(results.totalVolume[0]?.volume || 0),
            gameStats: results.gameStats || [],
            recentAccounts: results.recentAccounts || []
          }
        });
      }
    });
  });
});

// Search game accounts with advanced filters
app.get('/api/marketplace/search', (req, res) => {
  const {
    q, // search query
    game_id,
    min_price,
    max_price,
    level_min,
    level_max,
    seller_wallet,
    sort_by = 'created_at',
    sort_order = 'DESC',
    page = 1,
    limit = 20,
    featured_only = false
  } = req.query;

  let query = `
    SELECT ga.*, g.name as game_name, g.code as game_code, g.category as game_category,
           COALESCE(u.name, wp.name, CONCAT('User-', SUBSTRING(ga.seller_wallet, 1, 6))) as seller_name,
           COALESCE(u.reputation_score, wp.reputation_score, 5.00) as seller_reputation,
           COALESCE(u.total_sales, wp.total_sales, 0) as seller_total_sales
    FROM game_accounts ga
    JOIN games g ON ga.game_id = g.id
    LEFT JOIN users u ON ga.seller_id = u.id
    LEFT JOIN wallet_profiles wp ON ga.seller_wallet = wp.wallet_address
    WHERE ga.is_sold = FALSE AND ga.is_in_escrow = FALSE
  `;
  
  const params = [];

  // Search query
  if (q) {
    query += ` AND (ga.title LIKE ? OR ga.description LIKE ? OR g.name LIKE ?)`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Game filter
  if (game_id) {
    query += ` AND ga.game_id = ?`;
    params.push(parseInt(game_id));
  }

  // Price range
  if (min_price) {
    query += ` AND ga.price >= ?`;
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    query += ` AND ga.price <= ?`;
    params.push(parseFloat(max_price));
  }

  // Level range
  if (level_min) {
    query += ` AND ga.level >= ?`;
    params.push(parseInt(level_min));
  }
  if (level_max) {
    query += ` AND ga.level <= ?`;
    params.push(parseInt(level_max));
  }

  // Seller filter
  if (seller_wallet) {
    query += ` AND LOWER(ga.seller_wallet) = LOWER(?)`;
    params.push(seller_wallet);
  }

  // Featured only
  if (featured_only === 'true') {
    query += ` AND ga.is_featured = TRUE AND (ga.featured_until IS NULL OR ga.featured_until > NOW())`;
  }

  // Sorting
  const allowedSortFields = ['created_at', 'price', 'level', 'view_count', 'seller_reputation'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY ${sortField} ${sortDirection}`;

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  
  query += ` LIMIT ? OFFSET ?`;
  params.push(limitNum, offset);

  // Execute search query
  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error searching accounts:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching accounts'
      });
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM game_accounts ga
      JOIN games g ON ga.game_id = g.id
      WHERE ga.is_sold = FALSE AND ga.is_in_escrow = FALSE
    `;
    
    const countParams = [];
    let paramIndex = 0;

    // Apply same filters for count
    if (q) {
      countQuery += ` AND (ga.title LIKE ? OR ga.description LIKE ? OR g.name LIKE ?)`;
      const searchTerm = `%${q}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }
    if (game_id) {
      countQuery += ` AND ga.game_id = ?`;
      countParams.push(parseInt(game_id));
      paramIndex++;
    }
    if (min_price) {
      countQuery += ` AND ga.price >= ?`;
      countParams.push(parseFloat(min_price));
      paramIndex++;
    }
    if (max_price) {
      countQuery += ` AND ga.price <= ?`;
      countParams.push(parseFloat(max_price));
      paramIndex++;
    }
    if (level_min) {
      countQuery += ` AND ga.level >= ?`;
      countParams.push(parseInt(level_min));
      paramIndex++;
    }
    if (level_max) {
      countQuery += ` AND ga.level <= ?`;
      countParams.push(parseInt(level_max));
      paramIndex++;
    }
    if (seller_wallet) {
      countQuery += ` AND LOWER(ga.seller_wallet) = LOWER(?)`;
      countParams.push(seller_wallet);
      paramIndex++;
    }
    if (featured_only === 'true') {
      countQuery += ` AND ga.is_featured = TRUE AND (ga.featured_until IS NULL OR ga.featured_until > NOW())`;
    }

    db.query(countQuery, countParams, (countError, countResults) => {
      if (countError) {
        console.error('Error counting accounts:', countError);
        return res.status(500).json({
          success: false,
          message: 'Error counting accounts'
        });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / limitNum);

      // Process images for each account
      const accounts = results.map(account => {
        let images = [];
        if (account.images) {
          try {
            if (typeof account.images === 'string') {
              if (account.images.startsWith('data:image')) {
                images = [account.images];
              } else {
                images = JSON.parse(account.images);
              }
            } else if (Array.isArray(account.images)) {
              images = account.images;
            }
          } catch (error) {
            console.error('Error parsing images for account', account.id, ':', error.message);
            images = [account.images];
          }
        }

        return {
          ...account,
          images: images,
          price_display: `${account.price} ETH`,
          price_idr: Math.round(account.price * 50000000)
        };
      });

      res.json({
        success: true,
        accounts: accounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          q, game_id, min_price, max_price, level_min, level_max,
          seller_wallet, sort_by, sort_order, featured_only
        }
      });
    });
  });
});

// Get featured accounts
app.get('/api/marketplace/featured', (req, res) => {
  const query = `
    SELECT ga.*, g.name as game_name, g.code as game_code,
           COALESCE(u.name, wp.name, CONCAT('User-', SUBSTRING(ga.seller_wallet, 1, 6))) as seller_name
    FROM game_accounts ga
    JOIN games g ON ga.game_id = g.id
    LEFT JOIN users u ON ga.seller_id = u.id
    LEFT JOIN wallet_profiles wp ON ga.seller_wallet = wp.wallet_address
    WHERE ga.is_sold = FALSE 
      AND ga.is_in_escrow = FALSE 
      AND ga.is_featured = TRUE 
      AND (ga.featured_until IS NULL OR ga.featured_until > NOW())
    ORDER BY ga.created_at DESC
    LIMIT 10
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching featured accounts:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching featured accounts'
      });
    }

    const accounts = results.map(account => {
      let images = [];
      if (account.images) {
        try {
          if (typeof account.images === 'string') {
            if (account.images.startsWith('data:image')) {
              images = [account.images];
            } else {
              images = JSON.parse(account.images);
            }
          } else if (Array.isArray(account.images)) {
            images = account.images;
          }
        } catch (error) {
          console.error('Error parsing images for account', account.id, ':', error.message);
          images = [account.images];
        }
      }

      return {
        ...account,
        images: images,
        price_display: `${account.price} ETH`
      };
    });

    res.json({
      success: true,
      accounts: accounts
    });
  });
});

// Increment view count for account
app.post('/api/marketplace/accounts/:id/view', (req, res) => {
  const { id } = req.params;
  
  const query = 'UPDATE game_accounts SET view_count = view_count + 1 WHERE id = ?';
  
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error updating view count:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating view count'
      });
    }

    res.json({
      success: true,
      message: 'View count updated'
    });
  });
});

// Add to favorites
app.post('/api/marketplace/favorites', authenticateToken, (req, res) => {
  const { account_id, wallet_address } = req.body;
  const userId = req.user.userId;

  if (!account_id) {
    return res.status(400).json({
      success: false,
      message: 'Account ID is required'
    });
  }

  const query = `
    INSERT INTO user_favorites (user_id, wallet_address, account_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE created_at = created_at
  `;

  db.query(query, [userId, wallet_address, account_id], (error, results) => {
    if (error) {
      console.error('Error adding to favorites:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding to favorites'
      });
    }

    // Update favorite count in game_accounts table
    const updateCountQuery = `
      UPDATE game_accounts 
      SET favorite_count = (
        SELECT COUNT(*) FROM user_favorites WHERE account_id = ?
      ) 
      WHERE id = ?
    `;

    db.query(updateCountQuery, [account_id, account_id], (updateError) => {
      if (updateError) {
        console.error('Error updating favorite count:', updateError);
      }
    });

    res.json({
      success: true,
      message: 'Added to favorites'
    });
  });
});

// Remove from favorites
app.delete('/api/marketplace/favorites/:account_id', authenticateToken, (req, res) => {
  const { account_id } = req.params;
  const userId = req.user.userId;

  const query = 'DELETE FROM user_favorites WHERE user_id = ? AND account_id = ?';

  db.query(query, [userId, account_id], (error, results) => {
    if (error) {
      console.error('Error removing from favorites:', error);
      return res.status(500).json({
        success: false,
        message: 'Error removing from favorites'
      });
    }

    // Update favorite count in game_accounts table
    const updateCountQuery = `
      UPDATE game_accounts 
      SET favorite_count = (
        SELECT COUNT(*) FROM user_favorites WHERE account_id = ?
      ) 
      WHERE id = ?
    `;

    db.query(updateCountQuery, [account_id, account_id], (updateError) => {
      if (updateError) {
        console.error('Error updating favorite count:', updateError);
      }
    });

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  });
});

// Get user favorites
app.get('/api/marketplace/favorites', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT ga.*, g.name as game_name, uf.created_at as favorited_at
    FROM user_favorites uf
    JOIN game_accounts ga ON uf.account_id = ga.id
    JOIN games g ON ga.game_id = g.id
    WHERE uf.user_id = ?
    ORDER BY uf.created_at DESC
  `;

  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching favorites'
      });
    }

    const favorites = results.map(account => {
      let images = [];
      if (account.images) {
        try {
          if (typeof account.images === 'string') {
            if (account.images.startsWith('data:image')) {
              images = [account.images];
            } else {
              images = JSON.parse(account.images);
            }
          } else if (Array.isArray(account.images)) {
            images = account.images;
          }
        } catch (error) {
          console.error('Error parsing images for account', account.id, ':', error.message);
          images = [account.images];
        }
      }

      return {
        ...account,
        images: images,
        price_display: `${account.price} ETH`
      };
    });

    res.json({
      success: true,
      favorites: favorites
    });
  });
});

// ===== ESCROW TRANSACTION ENDPOINTS =====

// Create escrow transaction
app.post('/api/escrow/create', (req, res) => {
  const {
    account_id,
    seller_wallet,
    buyer_wallet,
    amount,
    payment_hash,
    network
  } = req.body;

  if (!account_id || !seller_wallet || !buyer_wallet || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Generate escrow ID
  const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get account details
  const getAccountQuery = `
    SELECT ga.*, g.name as game_name
    FROM game_accounts ga
    JOIN games g ON ga.game_id = g.id
    WHERE ga.id = ?
  `;

  db.query(getAccountQuery, [account_id], (error, accountResults) => {
    if (error) {
      console.error('Error fetching account:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching account details'
      });
    }

    if (accountResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const account = accountResults[0];

    // Create escrow transaction
    const escrowData = {
      id: escrowId,
      account_id: account_id,
      account_title: account.title,
      game_name: account.game_name,
      seller_wallet: seller_wallet,
      buyer_wallet: buyer_wallet,
      escrow_wallet: process.env.ESCROW_WALLET || '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f',
      amount: parseFloat(amount),
      currency: 'ETH',
      amount_idr: parseFloat(amount) * 50000000,
      exchange_rate: 50000000,
      status: payment_hash ? 'payment_received' : 'pending_payment',
      payment_hash: payment_hash || null,
      network: network || null,
      account_details: JSON.stringify({
        level: account.level,
        rank: account.rank,
        description: account.description,
        images: account.images
      }),
      timeline: JSON.stringify([
        {
          status: 'pending_payment',
          timestamp: Date.now(),
          note: 'Escrow transaction created'
        }
      ]),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    if (payment_hash) {
      const timeline = JSON.parse(escrowData.timeline);
      timeline.push({
        status: 'payment_received',
        timestamp: Date.now() + 1000,
        note: `Payment received. Hash: ${payment_hash}`
      });
      escrowData.timeline = JSON.stringify(timeline);
    }

    const insertQuery = 'INSERT INTO escrow_transactions SET ?';

    db.query(insertQuery, escrowData, (insertError, insertResults) => {
      if (insertError) {
        console.error('Error creating escrow transaction:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Error creating escrow transaction'
        });
      }

      // Update account status
      const updateAccountQuery = 'UPDATE game_accounts SET is_in_escrow = TRUE, escrow_id = ? WHERE id = ?';
      
      db.query(updateAccountQuery, [escrowId, account_id], (updateError) => {
        if (updateError) {
          console.error('Error updating account status:', updateError);
        }
      });

      res.status(201).json({
        success: true,
        message: 'Escrow transaction created successfully',
        escrow_id: escrowId,
        escrow: escrowData
      });
    });
  });
});

// Get escrow transactions for user
app.get('/api/escrow/transactions', (req, res) => {
  const { wallet_address, status, role } = req.query;

  if (!wallet_address) {
    return res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
  }

  let query = 'SELECT * FROM escrow_transactions WHERE ';
  const params = [];

  if (role === 'seller') {
    query += 'seller_wallet = ?';
    params.push(wallet_address);
  } else if (role === 'buyer') {
    query += 'buyer_wallet = ?';
    params.push(wallet_address);
  } else {
    query += '(seller_wallet = ? OR buyer_wallet = ?)';
    params.push(wallet_address, wallet_address);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching escrow transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transactions'
      });
    }

    const transactions = results.map(tx => ({
      ...tx,
      account_details: tx.account_details ? JSON.parse(tx.account_details) : null,
      timeline: tx.timeline ? JSON.parse(tx.timeline) : [],
      delivery_proof: tx.delivery_proof ? JSON.parse(tx.delivery_proof) : null,
      buyer_confirmation: tx.buyer_confirmation ? JSON.parse(tx.buyer_confirmation) : null,
      metadata: tx.metadata ? JSON.parse(tx.metadata) : null
    }));

    res.json({
      success: true,
      transactions: transactions
    });
  });
});

// Update escrow transaction status
app.patch('/api/escrow/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, delivery_proof, buyer_confirmation, admin_payment_hash, note } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  // Get current transaction
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const transaction = results[0];
    const timeline = transaction.timeline ? JSON.parse(transaction.timeline) : [];
    
    // Add new timeline entry
    timeline.push({
      status: status,
      timestamp: Date.now(),
      note: note || `Status updated to ${status}`
    });

    const updateData = {
      status: status,
      timeline: JSON.stringify(timeline),
      updated_at: new Date()
    };

    if (delivery_proof) {
      updateData.delivery_proof = JSON.stringify(delivery_proof);
    }

    if (buyer_confirmation) {
      updateData.buyer_confirmation = JSON.stringify(buyer_confirmation);
    }

    if (admin_payment_hash) {
      updateData.admin_payment_hash = admin_payment_hash;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';

    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('Error updating escrow transaction:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error updating escrow transaction'
        });
      }

      // Update account status if completed
      if (status === 'completed') {
        const updateAccountQuery = `
          UPDATE game_accounts 
          SET is_sold = TRUE, is_in_escrow = FALSE, sold_at = NOW() 
          WHERE id = ?
        `;
        
        db.query(updateAccountQuery, [transaction.account_id], (accountError) => {
          if (accountError) {
            console.error('Error updating account status:', accountError);
          }
        });
      }

      // Add transaction history
      const historyQuery = `
        INSERT INTO transaction_history (escrow_id, action, actor_wallet, actor_type, description)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(historyQuery, [
        id,
        status,
        req.body.actor_wallet || 'system',
        req.body.actor_type || 'admin',
        note || `Status updated to ${status}`
      ], (historyError) => {
        if (historyError) {
          console.error('Error adding transaction history:', historyError);
        }
      });

      res.json({
        success: true,
        message: 'Escrow transaction updated successfully'
      });
    });
  });
});

module.exports = {
  // Export functions if needed
};