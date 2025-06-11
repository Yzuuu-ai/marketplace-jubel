// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Buat koneksi ke database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jubel_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Helper function untuk normalize email
const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

// Endpoint registrasi dengan perbaikan
app.post('/api/register', async (req, res) => {
  const { nama, email, password, nomor } = req.body;

  // Validasi sederhana
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

  // Normalize email
  const normalizedEmail = normalizeEmail(email);
  
  console.log('Register attempt for email:', normalizedEmail);

  try {
    // Cek apakah email sudah terdaftar dengan normalisasi
    const checkEmailQuery = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
    db.query(checkEmailQuery, [normalizedEmail], (error, results) => {
      if (error) {
        console.error('Error checking email:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length > 0) {
        console.log('Email already exists:', normalizedEmail);
        return res.status(400).json({ 
          message: 'Registrasi gagal',
          errors: { email: 'Email sudah terdaftar' } 
        });
      }

      // Hash password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          console.error('Error generating salt:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        bcrypt.hash(password, salt, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Buat user baru dengan email yang sudah di-normalize
          const newUser = {
            name: nama,
            email: normalizedEmail, // Gunakan normalized email
            password: hashedPassword,
            phone: nomor || null,
            created_at: new Date(),
            is_email_verified: 0,
            account_type: 'email'
          };

          // Simpan ke database
          const insertQuery = 'INSERT INTO users SET ?';
          db.query(insertQuery, newUser, (error, results) => {
            if (error) {
              console.error('Error inserting user:', error);
              return res.status(500).json({ message: 'Internal server error' });
            }

            console.log('User registered successfully:', {
              id: results.insertId,
              email: normalizedEmail,
              name: nama
            });
            
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
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Endpoint login dengan perbaikan
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email dan password wajib diisi',
      errors: {
        email: !email ? 'Email wajib diisi' : undefined,
        password: !password ? 'Password wajib diisi' : undefined
      }
    });
  }

  // Normalize email
  const normalizedEmail = normalizeEmail(email);
  
  console.log('Login attempt for email:', normalizedEmail);

  // Cari user berdasarkan email yang di-normalize
  const query = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
  db.query(query, [normalizedEmail], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    console.log('Query results:', {
      found: results.length > 0,
      count: results.length
    });

    if (results.length === 0) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({ 
        message: 'Login gagal',
        errors: { email: 'Email tidak terdaftar' } 
      });
    }

    const user = results[0];
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Verifikasi password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      console.log('Password match result:', isMatch);

      if (!isMatch) {
        return res.status(401).json({ 
          message: 'Login gagal',
          errors: { password: 'Password salah' } 
        });
      }

      console.log('Login successful for:', user.email);

      // Jika login berhasil
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

// Endpoint untuk mengecek koneksi
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

// ===== ENDPOINT DEBUG (HAPUS DI PRODUCTION!) =====

// Endpoint debug untuk melihat semua users
app.get('/api/debug/users', (req, res) => {
  const query = 'SELECT id, name, email, phone, created_at, account_type FROM users ORDER BY created_at DESC';
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    console.log('Total users in database:', results.length);
    results.forEach(user => {
      console.log(`User: ${user.email} (ID: ${user.id}, Name: ${user.name})`);
    });
    
    res.json({
      totalUsers: results.length,
      users: results
    });
  });
});

// Endpoint untuk cek email specific
app.post('/api/debug/check-email', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  const normalizedEmail = normalizeEmail(email);
  console.log('Checking email:', email, '-> normalized:', normalizedEmail);
  
  const queries = [
    {
      name: 'exact',
      query: 'SELECT id, email, name FROM users WHERE email = ?',
      params: [email]
    },
    {
      name: 'trimmed',
      query: 'SELECT id, email, name FROM users WHERE TRIM(email) = TRIM(?)',
      params: [email]
    },
    {
      name: 'lowercase',
      query: 'SELECT id, email, name FROM users WHERE LOWER(email) = LOWER(?)',
      params: [email]
    },
    {
      name: 'normalized',
      query: 'SELECT id, email, name FROM users WHERE LOWER(TRIM(email)) = ?',
      params: [normalizedEmail]
    },
    {
      name: 'like',
      query: 'SELECT id, email, name FROM users WHERE email LIKE ?',
      params: [`%${email}%`]
    }
  ];
  
  const results = {};
  let completed = 0;
  
  queries.forEach(({ name, query, params }) => {
    db.query(query, params, (error, queryResults) => {
      if (error) {
        results[name] = { error: error.message };
      } else {
        results[name] = {
          found: queryResults.length > 0,
          count: queryResults.length,
          data: queryResults
        };
      }
      
      completed++;
      if (completed === queries.length) {
        res.json({
          searchEmail: email,
          normalizedEmail: normalizedEmail,
          results
        });
      }
    });
  });
});

// Endpoint untuk cleanup email (trim spasi)
app.post('/api/debug/cleanup-emails', (req, res) => {
  const updateQuery = 'UPDATE users SET email = TRIM(LOWER(email))';
  
  db.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error cleaning up emails:', error);
      return res.status(500).json({ message: 'Error cleaning up emails', error: error.message });
    }
    
    console.log('Emails cleaned up:', results.affectedRows);
    res.json({
      message: 'Email cleanup completed',
      affectedRows: results.affectedRows
    });
  });
});

// Endpoint untuk melihat struktur tabel
app.get('/api/debug/table-structure', (req, res) => {
  const query = 'DESCRIBE users';
  
  db.query(query, (error, results) => {
    if (error) {
      console.error('Error getting table structure:', error);
      return res.status(500).json({ message: 'Error getting table structure', error: error.message });
    }
    
    res.json({
      tableName: 'users',
      structure: results
    });
  });
});

// Middleware
app.use(bodyParser.json());

// API: Mendapatkan semua akun game
app.get('/api/game-accounts', (req, res) => {
  const { sellerWallet, isAvailable } = req.query;
  
  // Query untuk mengambil akun berdasarkan status dan dompet seller
  const query = `
    SELECT * FROM game_accounts
    WHERE seller_wallet = ? AND (is_sold = ? OR is_in_escrow = ?)
  `;
  
  db.query(query, [sellerWallet, isAvailable === 'true' ? 0 : 1, isAvailable === 'escrow' ? 1 : 0], (err, results) => {
    if (err) {
      console.error('Error fetching game accounts:', err);
      return res.status(500).json({ success: false, message: 'Error fetching data' });
    }
    res.json({ success: true, accounts: results });
  });
});

// API: Membuat akun game baru
app.post('/api/game-accounts', (req, res) => {
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue, sellerWallet, sellerId
  } = req.body;

  const query = `
    INSERT INTO game_accounts (game_id, title, level, rank, price, description, images,
      contact_type, contact_value, seller_wallet, seller_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [gameId, title, level, rank, price, description, JSON.stringify(images),
    contactType, contactValue, sellerWallet, sellerId], (err, results) => {
    if (err) {
      console.error('Error inserting game account:', err);
      return res.status(500).json({ success: false, message: 'Error inserting data' });
    }
    res.json({ success: true, message: 'Akun game berhasil dibuat!' });
  });
});

// API: Memperbarui akun game
app.put('/api/game-accounts/:id', (req, res) => {
  const accountId = req.params.id;
  const {
    gameId, title, level, rank, price, description, images,
    contactType, contactValue
  } = req.body;

  const query = `
    UPDATE game_accounts
    SET game_id = ?, title = ?, level = ?, rank = ?, price = ?, description = ?, images = ?,
        contact_type = ?, contact_value = ?
    WHERE id = ?
  `;
  
  db.query(query, [gameId, title, level, rank, price, description, JSON.stringify(images),
    contactType, contactValue, accountId], (err, results) => {
    if (err) {
      console.error('Error updating game account:', err);
      return res.status(500).json({ success: false, message: 'Error updating data' });
    }
    res.json({ success: true, message: 'Akun game berhasil diperbarui!' });
  });
});

// API: Menghapus akun game
app.delete('/api/game-accounts/:id', (req, res) => {
  const accountId = req.params.id;

  const query = `
    DELETE FROM game_accounts WHERE id = ?
  `;
  
  db.query(query, [accountId], (err, results) => {
    if (err) {
      console.error('Error deleting game account:', err);
      return res.status(500).json({ success: false, message: 'Error deleting data' });
    }
    res.json({ success: true, message: 'Akun game berhasil dihapus!' });
  });
});

// Server berjalan di port 5000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// ===== END DEBUG ENDPOINTS =====

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
  console.log('Available endpoints:');
  console.log('- POST /api/register');
  console.log('- POST /api/login');
  console.log('- GET  /api/health');
  console.log('Debug endpoints (remove in production):');
  console.log('- GET  /api/debug/users');
  console.log('- POST /api/debug/check-email');
  console.log('- POST /api/debug/cleanup-emails');
  console.log('- GET  /api/debug/table-structure');
});