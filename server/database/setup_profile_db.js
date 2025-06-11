// setup_profile_db.js
// Script untuk membuat tabel-tabel profile di database MySQL

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jubel_db',
  charset: 'utf8mb4',
  multipleStatements: true
});

// Function to execute SQL file
const executeSQLFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    db.query(sql, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Main setup function
const setupProfileDatabase = async () => {
  try {
    console.log('🔄 Connecting to MySQL database...');
    
    // Connect to database
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    console.log('✅ Connected to MySQL database');
    
    // Execute SQL file
    const sqlFilePath = path.join(__dirname, 'profile_tables.sql');
    console.log('🔄 Executing SQL file:', sqlFilePath);
    
    await executeSQLFile(sqlFilePath);
    
    console.log('✅ Profile tables created successfully!');
    
    // Verify tables were created
    console.log('🔄 Verifying tables...');
    
    const tables = [
      'wallet_profiles',
      'user_wallets', 
      'user_transaction_stats',
      'user_activities'
    ];
    
    for (const table of tables) {
      await new Promise((resolve, reject) => {
        db.query(`SHOW TABLES LIKE '${table}'`, (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            reject(new Error(`Table ${table} was not created`));
          } else {
            console.log(`✅ Table ${table} exists`);
            resolve();
          }
        });
      });
    }
    
    // Check if users table has new columns
    await new Promise((resolve, reject) => {
      db.query('DESCRIBE users', (error, results) => {
        if (error) {
          reject(error);
        } else {
          const columns = results.map(row => row.Field);
          const requiredColumns = ['wallet_address', 'is_email_verified', 'account_type', 'last_login', 'updated_at'];
          
          for (const col of requiredColumns) {
            if (columns.includes(col)) {
              console.log(`✅ Column users.${col} exists`);
            } else {
              console.log(`⚠️  Column users.${col} not found`);
            }
          }
          resolve();
        }
      });
    });
    
    // Check if games table has data
    await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM games', (error, results) => {
        if (error) {
          reject(error);
        } else {
          const count = results[0].count;
          console.log(`✅ Games table has ${count} records`);
          resolve();
        }
      });
    });
    
    console.log('\n🎉 Profile database setup completed successfully!');
    console.log('\nNew endpoints available:');
    console.log('- GET    /api/profile (enhanced with transaction stats)');
    console.log('- PUT    /api/profile (enhanced)');
    console.log('- POST   /api/profile/connect-wallet');
    console.log('- DELETE /api/profile/disconnect-wallet');
    console.log('- GET    /api/profile/activities');
    console.log('- GET    /api/wallet-profile/:wallet_address');
    console.log('- POST   /api/wallet-profile');
    
  } catch (error) {
    console.error('❌ Error setting up profile database:', error);
    process.exit(1);
  } finally {
    db.end();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupProfileDatabase();
}

module.exports = { setupProfileDatabase };