// server.js
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const app = express();
const port = 5000;

// Manual CORS middleware (menggantikan package cors)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
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
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jubel_db'
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

          res.status(201).json({ 
            message: 'User registered successfully',
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

      res.json({
        message: 'Login berhasil',
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
  
  let query = 'SELECT ga.*, g.name as game_name FROM game_accounts ga JOIN games g ON ga.game_id = g.id WHERE 1=1';
  const params = [];
  
  if (sellerWallet) {
    query += ' AND ga.seller_wallet = ?';
    params.push(sellerWallet);
  }
  
  if (isAvailable === 'true') {
    query += ' AND ga.is_sold = 0 AND ga.is_in_escrow = 0';
  } else if (isAvailable === 'false') {
    query += ' AND (ga.is_sold = 1 OR ga.is_in_escrow = 1)';
  }
  
  if (gameId) {
    query += ' AND ga.game_id = ?';
    params.push(gameId);
  }
  
  if (minPrice) {
    query += ' AND ga.price >= ?';
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice) {
    query += ' AND ga.price <= ?';
    params.push(parseFloat(maxPrice));
  }
  
  query += ' ORDER BY ga.created_at DESC';
  
  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching game accounts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching game accounts' 
      });
    }
    
    // Parse images JSON
    const accounts = results.map(account => ({
      ...account,
      images: account.images ? JSON.parse(account.images) : [],
      price: account.price + ' ETH'
    }));
    
    res.json({
      success: true,
      accounts: accounts
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
app.post('/api/game-accounts', (req, res) => {
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue, sellerWallet, sellerId
  } = req.body;
  
  // Validation
  if (!gameId || !price || !contactValue || !sellerWallet) {
    return res.status(400).json({
      success: false,
      message: 'GameId, price, contactValue, dan sellerWallet wajib diisi'
    });
  }
  
  const newAccount = {
    game_id: gameId,
    title: title || '',
    level: level || null,
    rank: rank || null,
    price: parseFloat(price),
    description: description || null,
    images: JSON.stringify(images || []),
    contact_type: contactType || 'whatsapp',
    contact_value: contactValue,
    seller_wallet: sellerWallet,
    seller_id: sellerId || null
  };
  
  const query = 'INSERT INTO game_accounts SET ?';
  
  db.query(query, newAccount, (error, results) => {
    if (error) {
      console.error('Error creating game account:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating game account' 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Game account created successfully',
      accountId: results.insertId
    });
  });
});

// Update game account
app.put('/api/game-accounts/:id', (req, res) => {
  const { id } = req.params;
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue
  } = req.body;
  
  // First check if account exists and belongs to seller
  const checkQuery = 'SELECT * FROM game_accounts WHERE id = ? AND seller_wallet = ?';
  
  db.query(checkQuery, [id, req.body.sellerWallet], (error, results) => {
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
      contact_value: contactValue
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
app.delete('/api/game-accounts/:id', (req, res) => {
  const { id } = req.params;
  const { sellerWallet } = req.query;
  
  if (!sellerWallet) {
    return res.status(400).json({ 
      success: false, 
      message: 'Seller wallet is required' 
    });
  }
  
  // First check if account exists and belongs to seller
  const checkQuery = 'SELECT * FROM game_accounts WHERE id = ? AND seller_wallet = ?';
  
  db.query(checkQuery, [id, sellerWallet], (error, results) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
  console.log('\nGames:');
  console.log('- GET    /api/games');
  console.log('\nGame Accounts:');
  console.log('- GET    /api/game-accounts');
  console.log('- GET    /api/game-accounts/:id');
  console.log('- POST   /api/game-accounts');
  console.log('- PUT    /api/game-accounts/:id');
  console.log('- DELETE /api/game-accounts/:id');
  console.log('- PATCH  /api/game-accounts/:id/status');
  console.log('\nOther:');
  console.log('- GET    /api/health');
});