// middleware/emailWalletValidation.js
const mysql = require('mysql2');

// Database connection (reuse from main server)
const createDbConnection = () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jubel_db',
    charset: 'utf8mb4'
  });
};

// Helper function to normalize email
const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

// Check if email exists in any table
const checkEmailExists = async (email, excludeWallet = null) => {
  const db = createDbConnection();
  const normalizedEmail = normalizeEmail(email);
  
  return new Promise((resolve, reject) => {
    // Check in users table
    const userQuery = 'SELECT id, email, wallet_address FROM users WHERE LOWER(TRIM(email)) = ?';
    
    db.query(userQuery, [normalizedEmail], (error, userResults) => {
      if (error) {
        db.end();
        return reject(error);
      }
      
      // Check in wallet_profiles table
      let walletQuery = 'SELECT wallet_address, email FROM wallet_profiles WHERE LOWER(TRIM(email)) = ?';
      let walletParams = [normalizedEmail];
      
      if (excludeWallet) {
        walletQuery += ' AND wallet_address != ?';
        walletParams.push(excludeWallet);
      }
      
      db.query(walletQuery, walletParams, (error, walletResults) => {
        db.end();
        
        if (error) {
          return reject(error);
        }
        
        resolve({
          existsInUsers: userResults.length > 0,
          existsInWalletProfiles: walletResults.length > 0,
          userRecord: userResults[0] || null,
          walletRecord: walletResults[0] || null
        });
      });
    });
  });
};

// Check if wallet exists and get associated data
const checkWalletExists = async (walletAddress) => {
  const db = createDbConnection();
  
  return new Promise((resolve, reject) => {
    // Check in users table (email users with connected wallet)
    const userQuery = `
      SELECT u.id, u.name, u.email, u.phone, u.wallet_address, 'email' as account_type
      FROM users u 
      WHERE u.wallet_address = ?
    `;
    
    db.query(userQuery, [walletAddress], (error, userResults) => {
      if (error) {
        db.end();
        return reject(error);
      }
      
      // Check in user_wallets table (connected wallets)
      const connectedWalletQuery = `
        SELECT u.id, u.name, u.email, u.phone, uw.wallet_address, 'email' as account_type
        FROM users u 
        JOIN user_wallets uw ON u.id = uw.user_id 
        WHERE uw.wallet_address = ? AND uw.is_primary = TRUE
      `;
      
      db.query(connectedWalletQuery, [walletAddress], (error, connectedResults) => {
        if (error) {
          db.end();
          return reject(error);
        }
        
        // Check in wallet_profiles table (standalone wallet users)
        const walletQuery = `
          SELECT wallet_address, name, email, phone, 'wallet' as account_type
          FROM wallet_profiles 
          WHERE wallet_address = ?
        `;
        
        db.query(walletQuery, [walletAddress], (error, walletResults) => {
          db.end();
          
          if (error) {
            return reject(error);
          }
          
          resolve({
            existsInUsers: userResults.length > 0,
            existsInConnectedWallets: connectedResults.length > 0,
            existsInWalletProfiles: walletResults.length > 0,
            userRecord: userResults[0] || null,
            connectedRecord: connectedResults[0] || null,
            walletRecord: walletResults[0] || null
          });
        });
      });
    });
  });
};

// Validate email-wallet combination
const validateEmailWalletCombination = async (email, walletAddress, operation = 'create') => {
  try {
    const emailCheck = await checkEmailExists(email, operation === 'update' ? walletAddress : null);
    const walletCheck = await checkWalletExists(walletAddress);
    
    const errors = [];
    const warnings = [];
    
    // Rule 1: Email should not exist in multiple places
    if (emailCheck.existsInUsers && emailCheck.existsInWalletProfiles) {
      errors.push('Email sudah terdaftar di sistem dengan wallet yang berbeda');
    }
    
    // Rule 2: If email exists in users table, wallet should match or be empty
    if (emailCheck.existsInUsers && emailCheck.userRecord) {
      const existingWallet = emailCheck.userRecord.wallet_address;
      if (existingWallet && existingWallet !== walletAddress) {
        errors.push(`Email sudah terhubung dengan wallet ${existingWallet.substring(0, 6)}...${existingWallet.substring(38)}`);
      }
    }
    
    // Rule 3: If wallet exists, check for conflicts
    if (walletCheck.existsInUsers || walletCheck.existsInConnectedWallets) {
      const existingRecord = walletCheck.userRecord || walletCheck.connectedRecord;
      if (existingRecord && existingRecord.email && existingRecord.email !== normalizeEmail(email)) {
        errors.push(`Wallet sudah terhubung dengan email ${existingRecord.email}`);
      }
    }
    
    // Rule 4: Wallet should not exist in both email and wallet systems
    if ((walletCheck.existsInUsers || walletCheck.existsInConnectedWallets) && walletCheck.existsInWalletProfiles) {
      warnings.push('Wallet ini sudah terdaftar di sistem email dan wallet terpisah');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      emailCheck,
      walletCheck
    };
  } catch (error) {
    throw new Error('Gagal memvalidasi kombinasi email-wallet: ' + error.message);
  }
};

// Merge wallet profile with email account
const mergeWalletWithEmailAccount = async (email, walletAddress) => {
  const db = createDbConnection();
  
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) {
        db.end();
        return reject(err);
      }
      
      // Get wallet profile data
      const getWalletQuery = 'SELECT * FROM wallet_profiles WHERE wallet_address = ?';
      
      db.query(getWalletQuery, [walletAddress], (error, walletResults) => {
        if (error) {
          return db.rollback(() => {
            db.end();
            reject(error);
          });
        }
        
        if (walletResults.length === 0) {
          return db.rollback(() => {
            db.end();
            reject(new Error('Wallet profile not found'));
          });
        }
        
        const walletProfile = walletResults[0];
        
        // Get user account
        const getUserQuery = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = ?';
        
        db.query(getUserQuery, [normalizeEmail(email)], (error, userResults) => {
          if (error) {
            return db.rollback(() => {
              db.end();
              reject(error);
            });
          }
          
          if (userResults.length === 0) {
            return db.rollback(() => {
              db.end();
              reject(new Error('User account not found'));
            });
          }
          
          const user = userResults[0];
          
          // Update user with wallet data (merge names if different)
          const mergedName = walletProfile.name || user.name;
          const mergedPhone = walletProfile.phone || user.phone;
          
          const updateUserQuery = `
            UPDATE users 
            SET wallet_address = ?, name = ?, phone = ?, updated_at = NOW() 
            WHERE id = ?
          `;
          
          db.query(updateUserQuery, [walletAddress, mergedName, mergedPhone, user.id], (error) => {
            if (error) {
              return db.rollback(() => {
                db.end();
                reject(error);
              });
            }
            
            // Add to user_wallets table
            const insertWalletQuery = `
              INSERT INTO user_wallets (user_id, wallet_address, is_primary) 
              VALUES (?, ?, TRUE)
              ON DUPLICATE KEY UPDATE is_primary = TRUE
            `;
            
            db.query(insertWalletQuery, [user.id, walletAddress], (error) => {
              if (error) {
                return db.rollback(() => {
                  db.end();
                  reject(error);
                });
              }
              
              // Remove from wallet_profiles (move to email system)
              const deleteWalletQuery = 'DELETE FROM wallet_profiles WHERE wallet_address = ?';
              
              db.query(deleteWalletQuery, [walletAddress], (error) => {
                if (error) {
                  return db.rollback(() => {
                    db.end();
                    reject(error);
                  });
                }
                
                db.commit((err) => {
                  db.end();
                  
                  if (err) {
                    return reject(err);
                  }
                  
                  resolve({
                    merged: true,
                    user: {
                      id: user.id,
                      name: mergedName,
                      email: user.email,
                      phone: mergedPhone,
                      wallet_address: walletAddress,
                      account_type: 'email'
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  checkEmailExists,
  checkWalletExists,
  validateEmailWalletCombination,
  mergeWalletWithEmailAccount,
  normalizeEmail
};