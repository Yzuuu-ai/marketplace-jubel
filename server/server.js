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

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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
    
    // Parse images JSON with error handling
    const accounts = results.map(account => {
      let images = [];
      if (account.images) {
        try {
          // Check if it's already a JSON string
          if (typeof account.images === 'string') {
            // If it starts with data:image, it's a base64 string, wrap it in an array
            if (account.images.startsWith('data:image')) {
              images = [account.images];
            } else {
              // Try to parse as JSON
              images = JSON.parse(account.images);
            }
          } else if (Array.isArray(account.images)) {
            images = account.images;
          }
        } catch (error) {
          console.error('Error parsing images for account', account.id, ':', error.message);
          console.log('Images data:', account.images);
          // If parsing fails, treat as single image string
          images = [account.images];
        }
      }
      
      return {
        ...account,
        images: images,
        price: account.price + ' ETH'
      };
    });
    
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
    
    // Parse images with error handling
    let images = [];
    if (account.images) {
      try {
        if (typeof account.images === 'string') {
          // If it starts with data:image, it's a base64 string, wrap it in an array
          if (account.images.startsWith('data:image')) {
            images = [account.images];
          } else {
            // Try to parse as JSON
            images = JSON.parse(account.images);
          }
        } else if (Array.isArray(account.images)) {
          images = account.images;
        }
      } catch (error) {
        console.error('Error parsing images for account', account.id, ':', error.message);
        console.log('Images data:', account.images);
        // If parsing fails, treat as single image string
        images = [account.images];
      }
    }
    
    account.images = images;
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
app.post('/api/wallet-profile', async (req, res) => {
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
  
  // Validate email-wallet combination if email is provided
  if (email && email.trim()) {
    try {
      const { validateEmailWalletCombination, mergeWalletWithEmailAccount } = require('./middleware/emailWalletValidation');
      
      const validation = await validateEmailWalletCombination(email, wallet_address, 'update');
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      // If email exists in users table and wallet matches, merge the accounts
      if (validation.emailCheck.existsInUsers && validation.emailCheck.userRecord) {
        const userRecord = validation.emailCheck.userRecord;
        
        // Check if this wallet should be merged with email account
        if (!userRecord.wallet_address || userRecord.wallet_address === wallet_address) {
          try {
            const mergeResult = await mergeWalletWithEmailAccount(email, wallet_address);
            
            return res.json({
              success: true,
              message: 'Akun wallet berhasil digabung dengan akun email',
              merged: true,
              user: mergeResult.user,
              note: 'Silakan login ulang menggunakan email untuk mengakses akun yang telah digabung'
            });
          } catch (mergeError) {
            console.error('Error merging accounts:', mergeError);
            // Continue with normal wallet profile update if merge fails
          }
        }
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Wallet profile warnings:', validation.warnings);
      }
      
    } catch (validationError) {
      console.error('Error validating email-wallet combination:', validationError);
      return res.status(500).json({
        success: false,
        message: 'Gagal memvalidasi data: ' + validationError.message
      });
    }
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

// Check for existing accounts with same email/wallet
app.post('/api/profile/check-conflicts', async (req, res) => {
  const { email, wallet_address } = req.body;
  
  if (!email && !wallet_address) {
    return res.status(400).json({
      success: false,
      message: 'Email atau wallet address harus diisi'
    });
  }
  
  try {
    const { checkEmailExists, checkWalletExists } = require('./middleware/emailWalletValidation');
    
    const conflicts = {
      email_conflicts: null,
      wallet_conflicts: null,
      can_merge: false,
      merge_suggestions: []
    };
    
    if (email) {
      conflicts.email_conflicts = await checkEmailExists(email);
    }
    
    if (wallet_address) {
      conflicts.wallet_conflicts = await checkWalletExists(wallet_address);
    }
    
    // Check if accounts can be merged
    if (email && wallet_address) {
      const emailCheck = conflicts.email_conflicts;
      const walletCheck = conflicts.wallet_conflicts;
      
      // Case 1: Email exists in users, wallet exists in wallet_profiles
      if (emailCheck.existsInUsers && walletCheck.existsInWalletProfiles) {
        const userRecord = emailCheck.userRecord;
        const walletRecord = walletCheck.walletRecord;
        
        if (!userRecord.wallet_address) {
          conflicts.can_merge = true;
          conflicts.merge_suggestions.push({
            type: 'merge_wallet_to_email',
            description: `Gabungkan profil wallet (${walletRecord.name}) dengan akun email (${userRecord.name})`,
            primary_account: 'email',
            data: {
              email_account: userRecord,
              wallet_account: walletRecord
            }
          });
        }
      }
      
      // Case 2: Same email in both systems
      if (emailCheck.existsInUsers && emailCheck.existsInWalletProfiles) {
        conflicts.merge_suggestions.push({
          type: 'resolve_email_conflict',
          description: 'Email yang sama ditemukan di sistem email dan wallet',
          requires_manual_resolution: true
        });
      }
    }
    
    res.json({
      success: true,
      conflicts,
      has_conflicts: conflicts.email_conflicts?.existsInUsers || 
                    conflicts.email_conflicts?.existsInWalletProfiles ||
                    conflicts.wallet_conflicts?.existsInUsers ||
                    conflicts.wallet_conflicts?.existsInConnectedWallets ||
                    conflicts.wallet_conflicts?.existsInWalletProfiles
    });
    
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa konflik: ' + error.message
    });
  }
});

// Merge accounts endpoint
app.post('/api/profile/merge-accounts', async (req, res) => {
  const { email, wallet_address, merge_type } = req.body;
  
  if (!email || !wallet_address || !merge_type) {
    return res.status(400).json({
      success: false,
      message: 'Email, wallet address, dan merge type wajib diisi'
    });
  }
  
  try {
    const { mergeWalletWithEmailAccount } = require('./middleware/emailWalletValidation');
    
    if (merge_type === 'merge_wallet_to_email') {
      const result = await mergeWalletWithEmailAccount(email, wallet_address);
      
      res.json({
        success: true,
        message: 'Akun berhasil digabung',
        merged_account: result.user,
        note: 'Gunakan email dan password untuk login ke akun yang telah digabung'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Tipe merge tidak didukung'
      });
    }
    
  } catch (error) {
    console.error('Error merging accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menggabungkan akun: ' + error.message
    });
  }
});

// ===== ESCROW TRANSACTION ENDPOINTS =====

// Escrow status constants
const ESCROW_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_RECEIVED: 'payment_received',
  ACCOUNT_DELIVERED: 'account_delivered',
  BUYER_CONFIRMED: 'buyer_confirmed',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Generate unique escrow ID
const generateEscrowId = () => {
  return 'escrow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Safe JSON parsing helper
const parseJsonSafely = (jsonString, defaultValue = null) => {
  if (!jsonString) return defaultValue;
  try {
    if (typeof jsonString === 'string') {
      return JSON.parse(jsonString);
    }
    return jsonString; // Already parsed
  } catch (error) {
    console.error('Error parsing JSON:', error.message, 'Data:', jsonString);
    return defaultValue;
  }
};

// Create escrow transaction
app.post('/api/escrow/create', (req, res) => {
  const {
    accountId,
    accountTitle,
    gameName,
    sellerWallet,
    buyerWallet,
    amount,
    currency = 'ETH',
    amountIdr,
    exchangeRate,
    paymentHash,
    network,
    accountDetails
  } = req.body;

  console.log('📝 Creating escrow transaction:', {
    accountId, accountTitle, sellerWallet, buyerWallet, amount
  });

  if (!accountId || !accountTitle || !sellerWallet || !buyerWallet || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  const escrowId = generateEscrowId();
  const escrowWallet = process.env.ESCROW_WALLET || '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f';

  try {
    // Create initial timeline
    const timeline = [
      {
        status: ESCROW_STATUS.PENDING_PAYMENT,
        timestamp: Date.now(),
        note: 'Escrow transaction created, waiting for payment confirmation'
      }
    ];

    // If payment hash exists, add payment received status
    if (paymentHash) {
      timeline.push({
        status: ESCROW_STATUS.PAYMENT_RECEIVED,
        timestamp: Date.now() + 1000,
        note: `Payment received. Hash: ${paymentHash}`
      });
    }

    const escrowData = {
      id: escrowId,
      account_id: accountId,
      account_title: accountTitle,
      game_name: gameName,
      seller_wallet: sellerWallet,
      buyer_wallet: buyerWallet,
      escrow_wallet: escrowWallet,
      amount: parseFloat(amount),
      currency: currency,
      amount_idr: amountIdr ? parseFloat(amountIdr) : null,
      exchange_rate: exchangeRate ? parseFloat(exchangeRate) : null,
      status: paymentHash ? ESCROW_STATUS.PAYMENT_RECEIVED : ESCROW_STATUS.PENDING_PAYMENT,
      payment_hash: paymentHash || null,
      network: network || null,
      account_details: JSON.stringify(accountDetails || {}),
      timeline: JSON.stringify(timeline),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      created_at: new Date(),
      updated_at: new Date()
    };

    const insertQuery = 'INSERT INTO escrow_transactions SET ?';
    
    db.query(insertQuery, escrowData, (error, results) => {
      if (error) {
        console.error('❌ Error creating escrow transaction:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating escrow transaction: ' + error.message
        });
      }

      console.log('✅ Escrow transaction created successfully:', escrowId);

      // Update game account status
      const updateAccountQuery = 'UPDATE game_accounts SET is_in_escrow = TRUE, escrow_id = ? WHERE id = ?';
      db.query(updateAccountQuery, [escrowId, accountId], (updateError) => {
        if (updateError) {
          console.error('⚠️ Error updating account status:', updateError);
        }
      });

      // Add to transaction history
      const historyData = {
        escrow_id: escrowId,
        action: paymentHash ? 'payment_received' : 'created',
        actor_wallet: buyerWallet,
        actor_type: 'buyer',
        description: paymentHash ? 'Payment received' : 'Escrow transaction created',
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      res.status(201).json({
        success: true,
        message: 'Escrow transaction created successfully',
        escrow_id: escrowId,
        escrow: {
          ...escrowData,
          timeline: timeline
        }
      });
    });

  } catch (error) {
    console.error('❌ Error in createEscrow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Get escrow transactions
app.get('/api/escrow/transactions', (req, res) => {
  const { wallet_address, status, role } = req.query;

  let query = 'SELECT * FROM escrow_transactions WHERE 1=1';
  const params = [];

  if (wallet_address) {
    if (role === 'seller') {
      query += ' AND seller_wallet = ?';
      params.push(wallet_address);
    } else if (role === 'buyer') {
      query += ' AND buyer_wallet = ?';
      params.push(wallet_address);
    } else {
      query += ' AND (seller_wallet = ? OR buyer_wallet = ?)';
      params.push(wallet_address, wallet_address);
    }
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  db.query(query, params, (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transactions: ' + error.message
      });
    }

    // Parse JSON fields with error handling
    const transactions = results.map(tx => {
      const parseJsonSafely = (jsonString, defaultValue = null) => {
        if (!jsonString) return defaultValue;
        try {
          if (typeof jsonString === 'string') {
            return JSON.parse(jsonString);
          }
          return jsonString; // Already parsed
        } catch (error) {
          console.error('Error parsing JSON:', error.message, 'Data:', jsonString);
          return defaultValue;
        }
      };

      return {
        ...tx,
        account_details: parseJsonSafely(tx.account_details, {}),
        timeline: parseJsonSafely(tx.timeline, []),
        delivery_proof: parseJsonSafely(tx.delivery_proof, null),
        buyer_confirmation: parseJsonSafely(tx.buyer_confirmation, null),
        metadata: parseJsonSafely(tx.metadata, null)
      };
    });

    res.json({
      success: true,
      transactions: transactions
    });
  });
});

// Get single escrow transaction
app.get('/api/escrow/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const transaction = results[0];
    
    // Parse JSON fields with error handling
    const parseJsonSafely = (jsonString, defaultValue = null) => {
      if (!jsonString) return defaultValue;
      try {
        if (typeof jsonString === 'string') {
          return JSON.parse(jsonString);
        }
        return jsonString; // Already parsed
      } catch (error) {
        console.error('Error parsing JSON:', error.message, 'Data:', jsonString);
        return defaultValue;
      }
    };

    const parsedTransaction = {
      ...transaction,
      account_details: parseJsonSafely(transaction.account_details, {}),
      timeline: parseJsonSafely(transaction.timeline, []),
      delivery_proof: parseJsonSafely(transaction.delivery_proof, null),
      buyer_confirmation: parseJsonSafely(transaction.buyer_confirmation, null),
      metadata: parseJsonSafely(transaction.metadata, null)
    };

    res.json({
      success: true,
      transaction: parsedTransaction
    });
  });
});

// Confirm payment (admin)
app.patch('/api/escrow/:id/confirm-payment', (req, res) => {
  const { id } = req.params;
  const { payment_hash, admin_wallet } = req.body;

  const updateData = {
    status: ESCROW_STATUS.PAYMENT_RECEIVED,
    payment_hash: payment_hash,
    updated_at: new Date()
  };

  const query = 'UPDATE escrow_transactions SET ? WHERE id = ?';
  
  db.query(query, [updateData, id], (error) => {
    if (error) {
      console.error('❌ Error confirming payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error confirming payment: ' + error.message
      });
    }

    // Add to transaction history
    const historyData = {
      escrow_id: id,
      action: 'payment_received',
      actor_wallet: admin_wallet,
      actor_type: 'admin',
      description: 'Payment confirmed by admin',
      created_at: new Date()
    };

    const historyQuery = 'INSERT INTO transaction_history SET ?';
    db.query(historyQuery, historyData, (historyError) => {
      if (historyError) {
        console.error('⚠️ Error adding transaction history:', historyError);
      }
    });

    console.log('✅ Payment confirmed for escrow:', id);

    res.json({
      success: true,
      message: 'Payment confirmed successfully'
    });
  });
});

// Deliver account (seller)
app.patch('/api/escrow/:id/deliver', (req, res) => {
  console.log('🔄 DELIVER ENDPOINT CALLED with ID:', req.params.id);
  console.log('📦 Request body:', req.body);
  const { id } = req.params;
  const { delivery_data } = req.body;

  // Get current transaction to update timeline
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const currentTx = results[0];
    
    // Safe JSON parsing for timeline
    const currentTimeline = parseJsonSafely(currentTx.timeline, []);

    // Add delivery timeline entry
    const newTimelineEntry = {
      status: ESCROW_STATUS.ACCOUNT_DELIVERED,
      timestamp: Date.now(),
      note: 'Account details delivered to buyer'
    };

    const updatedTimeline = [...currentTimeline, newTimelineEntry];

    const deliveryProof = {
      ...delivery_data,
      delivered_at: Date.now()
    };

    const updateData = {
      status: ESCROW_STATUS.ACCOUNT_DELIVERED,
      delivery_proof: JSON.stringify(deliveryProof),
      timeline: JSON.stringify(updatedTimeline),
      updated_at: new Date()
    };

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('❌ Error delivering account:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error delivering account: ' + updateError.message
        });
      }

      // Add to transaction history
      const historyData = {
        escrow_id: id,
        action: 'account_delivered',
        actor_wallet: currentTx.seller_wallet,
        actor_type: 'seller',
        description: 'Account details delivered to buyer',
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      console.log('✅ Account delivered for escrow:', id);

      res.json({
        success: true,
        message: 'Account delivered successfully'
      });
    });
  });
});

// Confirm receipt (buyer)
app.patch('/api/escrow/:id/confirm-receipt', (req, res) => {
  const { id } = req.params;
  const { confirmation_data } = req.body;

  // Get current transaction to update timeline
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const currentTx = results[0];
    
    // Safe JSON parsing for timeline
    const currentTimeline = parseJsonSafely(currentTx.timeline, []);

    // Add confirmation timeline entry
    const newTimelineEntry = {
      status: ESCROW_STATUS.BUYER_CONFIRMED,
      timestamp: Date.now(),
      note: confirmation_data.satisfied 
        ? 'Buyer confirmed receipt - satisfied'
        : 'Buyer confirmed receipt with notes'
    };

    const updatedTimeline = [...currentTimeline, newTimelineEntry];

    const buyerConfirmation = {
      ...confirmation_data,
      confirmed_at: Date.now()
    };

    const updateData = {
      status: ESCROW_STATUS.BUYER_CONFIRMED,
      buyer_confirmation: JSON.stringify(buyerConfirmation),
      timeline: JSON.stringify(updatedTimeline),
      updated_at: new Date()
    };

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('❌ Error confirming receipt:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error confirming receipt: ' + updateError.message
        });
      }

      // Add to transaction history
      const historyData = {
        escrow_id: id,
        action: 'buyer_confirmed',
        actor_wallet: currentTx.buyer_wallet,
        actor_type: 'buyer',
        description: confirmation_data.satisfied 
          ? 'Buyer confirmed receipt - satisfied'
          : 'Buyer confirmed receipt with notes',
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      console.log('✅ Receipt confirmed for escrow:', id);

      res.json({
        success: true,
        message: 'Receipt confirmed successfully'
      });
    });
  });
});

// Create dispute
app.post('/api/escrow/:id/dispute', (req, res) => {
  const { id } = req.params;
  const { reason, dispute_by } = req.body;

  // Get current transaction to update timeline
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const currentTx = results[0];
    const currentTimeline = parseJsonSafely(currentTx.timeline, []);

    // Add dispute timeline entry
    const newTimelineEntry = {
      status: ESCROW_STATUS.DISPUTED,
      timestamp: Date.now(),
      note: `Dispute created by ${dispute_by}: ${reason}`
    };

    const updatedTimeline = [...currentTimeline, newTimelineEntry];

    const disputeId = `dispute_${Date.now()}`;

    const updateData = {
      status: ESCROW_STATUS.DISPUTED,
      dispute_reason: reason,
      dispute_by: dispute_by,
      dispute_id: disputeId,
      timeline: JSON.stringify(updatedTimeline),
      updated_at: new Date()
    };

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('❌ Error creating dispute:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error creating dispute: ' + updateError.message
        });
      }

      // Add to transaction history
      const historyData = {
        escrow_id: id,
        action: 'disputed',
        actor_wallet: dispute_by === 'buyer' ? currentTx.buyer_wallet : currentTx.seller_wallet,
        actor_type: dispute_by,
        description: `Dispute created: ${reason}`,
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      console.log('⚠️ Dispute created for escrow:', id);

      res.json({
        success: true,
        message: 'Dispute created successfully',
        dispute_id: disputeId
      });
    });
  });
});

// Release funds (admin)
app.patch('/api/escrow/:id/release', (req, res) => {
  const { id } = req.params;
  const { admin_payment_hash, admin_wallet } = req.body;

  // Get current transaction to update timeline
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const currentTx = results[0];
    const currentTimeline = parseJsonSafely(currentTx.timeline, []);

    // Add completion timeline entry
    const newTimelineEntry = {
      status: ESCROW_STATUS.COMPLETED,
      timestamp: Date.now(),
      note: `Funds released to seller by admin. Payment hash: ${admin_payment_hash}`
    };

    const updatedTimeline = [...currentTimeline, newTimelineEntry];

    const updateData = {
      status: ESCROW_STATUS.COMPLETED,
      admin_payment_hash: admin_payment_hash,
      timeline: JSON.stringify(updatedTimeline),
      completed_at: new Date(),
      updated_at: new Date()
    };

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('❌ Error releasing funds:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error releasing funds: ' + updateError.message
        });
      }

      // Mark account as sold
      const updateAccountQuery = 'UPDATE game_accounts SET is_sold = TRUE, is_in_escrow = FALSE, sold_at = NOW() WHERE escrow_id = ?';
      db.query(updateAccountQuery, [id], (accountError) => {
        if (accountError) {
          console.error('⚠️ Error updating account status:', accountError);
        }
      });

      // Add to transaction history
      const historyData = {
        escrow_id: id,
        action: 'completed',
        actor_wallet: admin_wallet,
        actor_type: 'admin',
        description: `Funds released to seller. Payment hash: ${admin_payment_hash}`,
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      console.log('💰 Funds released for escrow:', id);

      res.json({
        success: true,
        message: 'Funds released successfully'
      });
    });
  });
});

// Resolve dispute (admin)
app.patch('/api/escrow/:id/resolve-dispute', (req, res) => {
  const { id } = req.params;
  const { resolution, refund = false, admin_payment_hash, admin_wallet } = req.body;

  // Get current transaction to update timeline
  const getQuery = 'SELECT * FROM escrow_transactions WHERE id = ?';
  
  db.query(getQuery, [id], (error, results) => {
    if (error) {
      console.error('❌ Error fetching escrow transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching escrow transaction: ' + error.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction not found'
      });
    }

    const currentTx = results[0];
    const currentTimeline = currentTx.timeline ? JSON.parse(currentTx.timeline) : [];

    const newStatus = refund ? ESCROW_STATUS.REFUNDED : ESCROW_STATUS.COMPLETED;

    // Add resolution timeline entry
    const newTimelineEntry = {
      status: newStatus,
      timestamp: Date.now(),
      note: `Dispute resolved: ${resolution}${admin_payment_hash ? `. Payment hash: ${admin_payment_hash}` : ''}`
    };

    const updatedTimeline = [...currentTimeline, newTimelineEntry];

    const updateData = {
      status: newStatus,
      resolution: resolution,
      admin_payment_hash: admin_payment_hash,
      timeline: JSON.stringify(updatedTimeline),
      completed_at: new Date(),
      updated_at: new Date()
    };

    const updateQuery = 'UPDATE escrow_transactions SET ? WHERE id = ?';
    
    db.query(updateQuery, [updateData, id], (updateError) => {
      if (updateError) {
        console.error('❌ Error resolving dispute:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error resolving dispute: ' + updateError.message
        });
      }

      // Update account status
      const updateAccountQuery = 'UPDATE game_accounts SET is_sold = ?, is_in_escrow = FALSE WHERE escrow_id = ?';
      db.query(updateAccountQuery, [!refund, id], (accountError) => {
        if (accountError) {
          console.error('⚠️ Error updating account status:', accountError);
        }
      });

      // Add to transaction history
      const historyData = {
        escrow_id: id,
        action: refund ? 'refunded' : 'resolved',
        actor_wallet: admin_wallet,
        actor_type: 'admin',
        description: `Dispute resolved: ${resolution}`,
        created_at: new Date()
      };

      const historyQuery = 'INSERT INTO transaction_history SET ?';
      db.query(historyQuery, historyData, (historyError) => {
        if (historyError) {
          console.error('⚠️ Error adding transaction history:', historyError);
        }
      });

      console.log('⚖️ Dispute resolved for escrow:', id);

      res.json({
        success: true,
        message: 'Dispute resolved successfully'
      });
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
  console.log('\nEscrow Transactions:');
  console.log('- POST   /api/escrow/create');
  console.log('- GET    /api/escrow/transactions');
  console.log('- GET    /api/escrow/:id');
  console.log('- PATCH  /api/escrow/:id/confirm-payment');
  console.log('- PATCH  /api/escrow/:id/deliver (protected)');
  console.log('- PATCH  /api/escrow/:id/confirm-receipt (protected)');
  console.log('- POST   /api/escrow/:id/dispute (protected)');
  console.log('- PATCH  /api/escrow/:id/release');
  console.log('- PATCH  /api/escrow/:id/resolve-dispute');
  console.log('\nOther:');
  console.log('- GET    /api/health');
});