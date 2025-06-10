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

// Endpoint registrasi
app.post('/api/register', async (req, res) => {
  const { nama, email, password, nomor } = req.body;

  // Validasi sederhana
  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
  }

  try {
    // Cek apakah email sudah terdaftar
    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailQuery, [email], (error, results) => {
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

          // Buat user baru
          const newUser = {
            name: nama,
            email,
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

            res.status(201).json({ 
              message: 'User registered successfully',
              user: {
                id: results.insertId,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
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

// Endpoint login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  // Cari user berdasarkan email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (error, results) => {
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

    // Verifikasi password
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

      // Jika login berhasil
      res.json({
        message: 'Login berhasil',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          account_type: user.account_type
        }
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
