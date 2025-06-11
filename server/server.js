// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Manual CORS middleware (menggantikan package cors)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jubel_db',
  charset: 'utf8mb4'
});

// Connect to database
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    console.error('Make sure MySQL is running and database jubel_db exists');
    return;
  }
  console.log('Connected to MySQL database');
});

// Helper functions
const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

// JWT token generation
const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ===== USER AUTHENTICATION ENDPOINTS =====

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { nama, email, password, nomor } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ 
      message: 'Nama, email, dan password wajib diisi',
      errors: {
        nama: !nama ? 'Nama wajib diisi' : undefined,
        email: !email ? 'Email wajib diisi' : undefined,
        password: !password ? 'Password wajib diisi' : undefined
      }
    });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // Check if email already exists
    const checkEmailQuery = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
    db.query(checkEmailQuery, [normalizedEmail], (error, results) => {
      if (error) {
        console.error('Error checking email:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ 
          message: 'Registrasi gagal',
          errors: { email: 'Email sudah terdaftar' } 
        });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const newUser = {
          name: nama,
          email: normalizedEmail,
          password: hashedPassword,
          phone: nomor || null,
          created_at: new Date(),
          is_email_verified: 0,
          account_type: 'email'
        };

        const insertQuery = 'INSERT INTO users SET ?';
        db.query(insertQuery, newUser, (error, results) => {
          if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          const token = generateToken(results.insertId);
          
          res.status(201).json({ 
            message: 'User registered successfully',
            token: token,
            user: {
              id: results.insertId,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone,
              account_type: newUser.account_type
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email dan password wajib diisi',
      errors: {
        email: !email ? 'Email wajib diisi' : undefined,
        password: !password ? 'Password wajib diisi' : undefined
      }
    });
  }

  const normalizedEmail = normalizeEmail(email);

  const query = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
  db.query(query, [normalizedEmail], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ 
        message: 'Login gagal',
        errors: { email: 'Email tidak terdaftar' } 
      });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (!isMatch) {
        return res.status(401).json({ 
          message: 'Login gagal',
          errors: { password: 'Password salah' } 
        });
      }

      const token = generateToken(user.id);
      
      res.json({
        message: 'Login berhasil',
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          account_type: user.account_type || 'email'
        }
      });
    });
  });
});

// ===== GAME ENDPOINTS =====

// Get all games
app.get('/api/games', (req, res) => {
  const query = 'SELECT * FROM games ORDER BY id';
  
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching games' 
      });
    }
    
    res.json({
      success: true,
      games: results
    });
  });
});

// ===== GAME ACCOUNTS ENDPOINTS =====

// Get game accounts with filters
app.get('/api/game-accounts', (req, res) => {
  const { sellerWallet, isAvailable, gameId, minPrice, maxPrice } = req.query;
  
  console.log('GET /api/game-accounts dipanggil dengan parameter:', {
    sellerWallet,
    isAvailable,
    gameId,
    minPrice,
    maxPrice
  });
  
  let query = 'SELECT ga.*, g.name as game_name FROM game_accounts ga JOIN games g ON ga.game_id = g.id WHERE 1=1';
  const params = [];
  
  if (sellerWallet) {
    // Gunakan LOWER untuk case-insensitive comparison
    query += ' AND LOWER(ga.seller_wallet) = LOWER(?)';
    params.push(sellerWallet);
    console.log('Filter berdasarkan seller_wallet:', sellerWallet);
  }
  
  if (isAvailable === 'true') {
    query += ' AND ga.is_sold = 0 AND ga.is_in_escrow = 0';
    console.log('Filter: hanya akun yang tersedia');
  } else if (isAvailable === 'false') {
    query += ' AND (ga.is_sold = 1 OR ga.is_in_escrow = 1)';
    console.log('Filter: hanya akun yang terjual/escrow');
  }
  
  if (gameId) {
    query += ' AND ga.game_id = ?';
    params.push(gameId);
    console.log('Filter berdasarkan game_id:', gameId);
  }
  
  if (minPrice) {
    query += ' AND ga.price >= ?';
    params.push(parseFloat(minPrice));
    console.log('Filter harga minimum:', minPrice);
  }
  
  if (maxPrice) {
    query += ' AND ga.price <= ?';
    params.push(parseFloat(maxPrice));
    console.log('Filter harga maksimum:', maxPrice);
  }
  
  query += ' ORDER BY ga.created_at DESC';
  
  console.log('Query SQL yang akan dijalankan:', query);
  console.log('Parameter query:', params);
  
  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error saat mengambil game accounts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error mengambil daftar akun game: ' + error.message
      });
    }
    
    console.log('Hasil query dari database:', results.length, 'akun ditemukan');
    
    if (results.length > 0) {
      console.log('Sample akun pertama:', {
        id: results[0].id,
        title: results[0].title,
        seller_wallet: results[0].seller_wallet,
        game_name: results[0].game_name,
        price: results[0].price,
        is_sold: results[0].is_sold,
        is_in_escrow: results[0].is_in_escrow
      });
    }
    
    // Parse images JSON
    const accounts = results.map(account => ({
      ...account,
      images: account.images ? JSON.parse(account.images) : [],
      price: account.price + ' ETH'
    }));
    
    console.log('Mengirim response dengan', accounts.length, 'akun');
    
    // Pastikan response selalu konsisten
    res.json({
      success: true,
      accounts: accounts || [],
      total: accounts.length,
      message: `Ditemukan ${accounts.length} akun untuk wallet ${sellerWallet || 'semua'}`
    });
  });
});

// Get single game account
app.get('/api/game-accounts/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT ga.*, g.name as game_name 
    FROM game_accounts ga 
    JOIN games g ON ga.game_id = g.id 
    WHERE ga.id = ?
  `;
  
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error fetching game account:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching game account' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game account not found' 
      });
    }
    
    const account = results[0];
    account.images = account.images ? JSON.parse(account.images) : [];
    account.price = account.price + ' ETH';
    
    res.json({
      success: true,
      account: account
    });
  });
});

// Create new game account
app.post('/api/game-accounts', authenticateToken, (req, res) => {
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue, sellerWallet
  } = req.body;
  
  console.log('📝 POST /api/game-accounts dipanggil dengan data:', {
    gameId,
    title,
    level,
    rank,
    price,
    description,
    contactType,
    contactValue,
    sellerWallet,
    userId: req.user.userId
  });
  
  // Validation
  if (!gameId || !price || !contactValue || !sellerWallet) {
    console.log('❌ Validasi gagal: field wajib tidak lengkap');
    return res.status(400).json({
      success: false,
      message: 'GameId, price, contactValue, dan sellerWallet wajib diisi'
    });
  }
  
  // Validate price is a positive number
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    console.log('❌ Validasi gagal: harga tidak valid:', price);
    return res.status(400).json({
      success: false,
      message: 'Harga harus berupa angka positif'
    });
  }
  
  const newAccount = {
    game_id: gameId,
    title: title || '',
    level: level || null,
    rank: rank || null,
    price: parsedPrice,
    description: description || null,
    images: JSON.stringify(images || []),
    contact_type: contactType || 'whatsapp',
    contact_value: contactValue,
    seller_wallet: sellerWallet,
    seller_id: req.user.userId,
    created_at: new Date()
  };
  
  console.log('💾 Data yang akan disimpan ke database:', newAccount);
  
  const query = 'INSERT INTO game_accounts SET ?';
  
  db.query(query, newAccount, (error, results) => {
    if (error) {
      console.error('❌ Error saat menyimpan game account:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error menyimpan akun game: ' + error.message
      });
    }
    
    console.log('�� Game account berhasil disimpan dengan ID:', results.insertId);
    console.log('📊 Insert results:', results);
    
    // Verifikasi data tersimpan dengan query ulang
    const verifyQuery = 'SELECT * FROM game_accounts WHERE id = ?';
    db.query(verifyQuery, [results.insertId], (verifyError, verifyResults) => {
      if (verifyError) {
        console.error('⚠️ Error saat verifikasi data tersimpan:', verifyError);
      } else {
        console.log('✅ Verifikasi: Data berhasil tersimpan:', verifyResults[0]);
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Akun game berhasil dibuat dan tersimpan ke database',
      accountId: results.insertId,
      account: {
        ...newAccount,
        id: results.insertId
      }
    });
  });
});

// Update game account
app.put('/api/game-accounts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue
  } = req.body;
  
  // Validate price if provided
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }
  }
  
  // First check if account exists and belongs to seller
  const checkQuery = 'SELECT * FROM game_accounts WHERE id = ? AND seller_id = ?';
  
  db.query(checkQuery, [id, req.user.userId], (error, results) => {
    if (error) {
      console.error('Error checking game account:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking game account' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game account not found or unauthorized' 
      });
    }
    
    if (results[0].is_sold || results[0].is_in_escrow) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot edit sold or in-escrow accounts' 
      });
    }
    
    const updateData = {
      game_id: gameId,
      title: title || '',
      level: level || null,
      rank: rank || null,
      price: parseFloat(price),
      description: description || null,
      images: JSON.stringify(images || []),
      contact_type: contactType || 'whatsapp',
      contact_value: contactValue,
      updated_at: new Date()
    };
    
    const updateQuery = 'UPDATE game_accounts SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (error, results) => {
      if (error) {
        console.error('Error updating game account:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating game account' 
        });
      }
      
      res.json({
        success: true,
        message: 'Game account updated successfully'
      });
    });
  });
});

// Delete game account
app.delete('/api/game-accounts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // First check if account exists and belongs to seller
  const checkQuery = 'SELECT * FROM game_accounts WHERE id = ? AND seller_id = ?';
  
  db.query(checkQuery, [id, req.user.userId], (error, results) => {
    if (error) {
      console.error('Error checking game account:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking game account' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game account not found or unauthorized' 
      });
    }
    
    if (results[0].is_sold || results[0].is_in_escrow) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete sold or in-escrow accounts' 
      });
    }
    
    const deleteQuery = 'DELETE FROM game_accounts WHERE id = ?';
    
    db.query(deleteQuery, [id], (error, results) => {
      if (error) {
        console.error('Error deleting game account:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error deleting game account' 
        });
      }
      
      res.json({
        success: true,
        message: 'Game account deleted successfully'
      });
    });
  });
});

// Update account status (for escrow)
app.patch('/api/game-accounts/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_sold, is_in_escrow, escrow_id } = req.body;
  
  const updateData = {};
  if (is_sold !== undefined) updateData.is_sold = is_sold;
  if (is_in_escrow !== undefined) updateData.is_in_escrow = is_in_escrow;
  if (escrow_id !== undefined) updateData.escrow_id = escrow_id;
  
  const query = 'UPDATE game_accounts SET ? WHERE id = ?';
  
  db.query(query, [updateData, id], (error, results) => {
    if (error) {
      console.error('Error updating account status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error updating account status' 
      });
    }
    
    res.json({
      success: true,
      message: 'Account status updated successfully'
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      solution: results[0].solution 
    });
  });
});

// Debug endpoint to check database tables
app.get('/api/debug/tables', (req, res) => {
  const queries = [
    'SHOW TABLES',
    'SELECT COUNT(*) as user_count FROM users',
    'DESCRIBE users'
  ];
  
  const results = {};
  let completed = 0;
  
  queries.forEach((query, index) => {
    db.query(query, (error, result) => {
      if (error) {
        results[`query_${index}`] = { error: error.message, query };
      } else {
        results[`query_${index}`] = { result, query };
      }
      
      completed++;
      if (completed === queries.length) {
        res.json({
          success: true,
          database_info: results
        });
      }
    });
  });
});

// Debug endpoint to check specific user
app.get('/api/debug/user/:id', (req, res) => {
  const userId = req.params.id;
  
  db.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      user_id: userId,
      found: results.length > 0,
      user_data: results[0] || null
    });
  });
});

// Debug endpoint untuk cek game accounts berdasarkan wallet
app.get('/api/debug/game-accounts/:wallet', (req, res) => {
  const walletAddress = req.params.wallet;
  
  console.log('Debug: Mencari game accounts untuk wallet:', walletAddress);
  
  const queries = [
    {
      name: 'Semua akun di database',
      query: 'SELECT id, title, seller_wallet, game_id, price, is_sold, is_in_escrow, created_at FROM game_accounts ORDER BY created_at DESC'
    },
    {
      name: 'Akun untuk wallet ini (exact match)',
      query: 'SELECT * FROM game_accounts WHERE seller_wallet = ? ORDER BY created_at DESC',
      params: [walletAddress]
    },
    {
      name: 'Akun untuk wallet ini (case insensitive)',
      query: 'SELECT * FROM game_accounts WHERE LOWER(seller_wallet) = LOWER(?) ORDER BY created_at DESC',
      params: [walletAddress]
    },
    {
      name: 'Cek struktur tabel game_accounts',
      query: 'DESCRIBE game_accounts'
    }
  ];
  
  const results = {};
  let completed = 0;
  
  queries.forEach((queryObj, index) => {
    const params = queryObj.params || [];
    
    db.query(queryObj.query, params, (error, result) => {
      if (error) {
        results[queryObj.name] = { 
          error: error.message, 
          query: queryObj.query,
          params: params
        };
      } else {
        results[queryObj.name] = { 
          result: result, 
          query: queryObj.query,
          params: params,
          count: Array.isArray(result) ? result.length : 'N/A'
        };
      }
      
      completed++;
      if (completed === queries.length) {
        console.log('Debug results untuk wallet', walletAddress, ':', results);
        res.json({
          success: true,
          wallet_address: walletAddress,
          debug_info: results
        });
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== PROFILE ENDPOINTS =====

// Get user profile with wallet and transaction stats
app.get('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  console.log('Profile API called for user ID:', userId);
  
  // First, try simple query to check if user exists
  const simpleQuery = 'SELECT * FROM users WHERE id = ?';
  
  db.query(simpleQuery, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user profile (simple query):', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error: ' + error.message,
        error_code: error.code
      });
    }
    
    console.log('Simple query results:', results);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        user_id: userId
      });
    }
    
    const user = results[0];
    console.log('User found:', user);
    
    // Return basic user info first, then try to get additional data
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        account_type: user.account_type || 'email',
        wallet_address: user.wallet_address,
        is_email_verified: user.is_email_verified || false,
        created_at: user.created_at,
        last_login: user.last_login,
        transaction_stats: {
          total_transactions: 0,
          as_seller: 0,
          as_buyer: 0,
          completed_sales: 0,
          completed_purchases: 0,
          total_sales_amount: 0,
          total_purchases_amount: 0
        }
      }
    });
  });
});

// Update user profile
app.put('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { name, phone, email } = req.body;
  
  console.log('Update profile request:', { userId, name, phone, email });
  
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nama wajib diisi'
    });
  }
  
  const updateData = {
    name: name.trim(),
    phone: phone || null,
    updated_at: new Date()
  };
  
  // Email can only be updated for wallet accounts
  if (email) {
    updateData.email = normalizeEmail(email);
  }
  
  console.log('Update data:', updateData);
  
  const query = 'UPDATE users SET ? WHERE id = ?';
  
  db.query(query, [updateData, userId], (error, results) => {
    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Gagal memperbarui profil: ' + error.message
      });
    }
    
    console.log('Profile update results:', results);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Log activity
    const activityQuery = 'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)';
    db.query(activityQuery, [userId, 'profile_update', `User memperbarui profil: ${name}`], (err) => {
      if (err) console.error('Error logging activity:', err);
    });
    
    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      updated_data: updateData
    });
  });
});

// Connect wallet to email account
app.post('/api/profile/connect-wallet', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { wallet_address } = req.body;
  
  if (!wallet_address) {
    return res.status(400).json({
      success: false,
      message: 'Wallet address is required'
    });
  }
  
  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid wallet address format'
    });
  }
  
  // Check if wallet is already connected to another user
  const checkQuery = 'SELECT * FROM user_wallets WHERE wallet_address = ?';
  
  db.query(checkQuery, [wallet_address], (error, results) => {
    if (error) {
      console.error('Error checking wallet:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking wallet' 
      });
    }
    
    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is already connected to another account'
      });
    }
    
    // Remove existing primary wallet for this user
    const removePrimaryQuery = 'UPDATE user_wallets SET is_primary = FALSE WHERE user_id = ?';
    
    db.query(removePrimaryQuery, [userId], (error) => {
      if (error) {
        console.error('Error removing primary wallet:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating wallet connection' 
        });
      }
      
      // Add new wallet connection
      const insertQuery = 'INSERT INTO user_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, TRUE)';
      
      db.query(insertQuery, [userId, wallet_address], (error, results) => {
        if (error) {
          console.error('Error connecting wallet:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'Error connecting wallet' 
          });
        }
        
        // Update user table with wallet address
        const updateUserQuery = 'UPDATE users SET wallet_address = ? WHERE id = ?';
        db.query(updateUserQuery, [wallet_address, userId], (err) => {
          if (err) console.error('Error updating user wallet:', err);
        });
        
        // Log activity
        const activityQuery = 'INSERT INTO user_activities (user_id, wallet_address, activity_type, description) VALUES (?, ?, ?, ?)';
        db.query(activityQuery, [userId, wallet_address, 'wallet_connect', `Connected wallet ${wallet_address}`], (err) => {
          if (err) console.error('Error logging activity:', err);
        });
        
        res.json({
          success: true,
          message: 'Wallet connected successfully',
          wallet_address: wallet_address
        });
      });
    });
  });
});

// Disconnect wallet from email account
app.delete('/api/profile/disconnect-wallet', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  // Get current wallet address
  const getWalletQuery = 'SELECT wallet_address FROM user_wallets WHERE user_id = ? AND is_primary = TRUE';
  
  db.query(getWalletQuery, [userId], (error, results) => {
    if (error) {
      console.error('Error getting wallet:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error getting wallet information' 
      });
    }
    
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No wallet connected to this account'
      });
    }
    
    const walletAddress = results[0].wallet_address;
    
    // Remove wallet connection
    const deleteQuery = 'DELETE FROM user_wallets WHERE user_id = ? AND wallet_address = ?';
    
    db.query(deleteQuery, [userId, walletAddress], (error) => {
      if (error) {
        console.error('Error disconnecting wallet:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error disconnecting wallet' 
        });
      }
      
      // Update user table to remove wallet address
      const updateUserQuery = 'UPDATE users SET wallet_address = NULL WHERE id = ?';
      db.query(updateUserQuery, [userId], (err) => {
        if (err) console.error('Error updating user wallet:', err);
      });
      
      // Log activity
      const activityQuery = 'INSERT INTO user_activities (user_id, wallet_address, activity_type, description) VALUES (?, ?, ?, ?)';
      db.query(activityQuery, [userId, walletAddress, 'wallet_disconnect', `Disconnected wallet ${walletAddress}`], (err) => {
        if (err) console.error('Error logging activity:', err);
      });
      
      res.json({
        success: true,
        message: 'Wallet disconnected successfully'
      });
    });
  });
});

// Get wallet profile (for wallet-based accounts)
app.get('/api/wallet-profile/:wallet_address', (req, res) => {
  const { wallet_address } = req.params;
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid wallet address format'
    });
  }
  
  const query = `
    SELECT 
      wp.*,
      COALESCE(uts.total_transactions, 0) as total_transactions,
      COALESCE(uts.as_seller, 0) as as_seller,
      COALESCE(uts.as_buyer, 0) as as_buyer,
      COALESCE(uts.completed_sales, 0) as completed_sales,
      COALESCE(uts.completed_purchases, 0) as completed_purchases,
      COALESCE(uts.total_sales_amount, 0) as total_sales_amount,
      COALESCE(uts.total_purchases_amount, 0) as total_purchases_amount
    FROM wallet_profiles wp
    LEFT JOIN user_transaction_stats uts ON wp.wallet_address = uts.wallet_address
    WHERE wp.wallet_address = ?
  `;
  
  db.query(query, [wallet_address], (error, results) => {
    if (error) {
      console.error('Error fetching wallet profile:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching wallet profile' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet profile not found' 
      });
    }
    
    const profile = results[0];
    
    res.json({
      success: true,
      profile: {
        wallet_address: profile.wallet_address,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        transaction_stats: {
          total_transactions: profile.total_transactions,
          as_seller: profile.as_seller,
          as_buyer: profile.as_buyer,
          completed_sales: profile.completed_sales,
          completed_purchases: profile.completed_purchases,
          total_sales_amount: profile.total_sales_amount,
          total_purchases_amount: profile.total_purchases_amount
        }
      }
    });
  });
});

// Create or update wallet profile
app.post('/api/wallet-profile', (req, res) => {
  const { wallet_address, name, email, phone } = req.body;
  
  console.log('Wallet profile update request:', { wallet_address, name, email, phone });
  
  if (!wallet_address || !name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Alamat wallet dan nama wajib diisi'
    });
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
    return res.status(400).json({
      success: false,
      message: 'Format alamat wallet tidak valid'
    });
  }
  
  const profileData = {
    wallet_address: wallet_address,
    name: name.trim(),
    email: email ? normalizeEmail(email) : null,
    phone: phone || null,
    updated_at: new Date()
  };
  
  const query = `
    INSERT INTO wallet_profiles (wallet_address, name, email, phone, created_at, updated_at) 
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE 
      name = VALUES(name),
      email = VALUES(email),
      phone = VALUES(phone),
      updated_at = VALUES(updated_at)
  `;
  
  db.query(query, [wallet_address, profileData.name, profileData.email, profileData.phone], (error, results) => {
    if (error) {
      console.error('Error saving wallet profile:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Gagal menyimpan profil wallet: ' + error.message
      });
    }
    
    console.log('Wallet profile save results:', results);
    
    // Log activity
    const activityQuery = 'INSERT INTO user_activities (wallet_address, activity_type, description) VALUES (?, ?, ?)';
    db.query(activityQuery, [wallet_address, 'profile_update', `Profil wallet diperbarui: ${profileData.name}`], (err) => {
      if (err) console.error('Error logging activity:', err);
    });
    
    res.json({
      success: true,
      message: 'Profil wallet berhasil disimpan',
      updated_data: profileData
    });
  });
});

// Get user activities
app.get('/api/profile/activities', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { limit = 10, offset = 0 } = req.query;
  
  const query = `
    SELECT activity_type, description, created_at, metadata
    FROM user_activities 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  db.query(query, [userId, parseInt(limit), parseInt(offset)], (error, results) => {
    if (error) {
      console.error('Error fetching user activities:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user activities' 
      });
    }
    
    res.json({
      success: true,
      activities: results.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null
      }))
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Database connected to jubel_db');
  console.log('\nAvailable endpoints:');
  console.log('Authentication:');
  console.log('- POST   /api/register');
  console.log('- POST   /api/login');
  console.log('\nUser Profile:');
  console.log('- GET    /api/profile (protected)');
  console.log('- PUT    /api/profile (protected)');
  console.log('- POST   /api/profile/connect-wallet (protected)');
  console.log('- DELETE /api/profile/disconnect-wallet (protected)');
  console.log('- GET    /api/profile/activities (protected)');
  console.log('\nWallet Profile:');
  console.log('- GET    /api/wallet-profile/:wallet_address');
  console.log('- POST   /api/wallet-profile');
  console.log('\nGames:');
  console.log('- GET    /api/games');
  console.log('\nGame Accounts:');
  console.log('- GET    /api/game-accounts');
  console.log('- GET    /api/game-accounts/:id');
  console.log('- POST   /api/game-accounts (protected)');
  console.log('- PUT    /api/game-accounts/:id (protected)');
  console.log('- DELETE /api/game-accounts/:id (protected)');
  console.log('- PATCH  /api/game-accounts/:id/status');
  console.log('\nOther:');
  console.log('- GET    /api/health');
});