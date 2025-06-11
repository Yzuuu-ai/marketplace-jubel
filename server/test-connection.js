// Test database connection and API endpoints
const mysql = require('mysql2');
require('dotenv').config();

console.log('🔄 Testing database connection...');

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jubel_db',
  charset: 'utf8mb4'
});

// Test connection
db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
  
  // Test games table
  db.query('SELECT * FROM games ORDER BY id', (error, results) => {
    if (error) {
      console.error('❌ Error fetching games:', error.message);
    } else {
      console.log('🎮 Games in database:', results.length);
      results.forEach(game => {
        console.log(`  - ${game.name} (${game.code})`);
      });
    }
    
    // Test game accounts table
    db.query('SELECT COUNT(*) as count FROM game_accounts WHERE is_sold = FALSE AND is_in_escrow = FALSE', (error, results) => {
      if (error) {
        console.error('❌ Error fetching game accounts:', error.message);
      } else {
        console.log('🎯 Available game accounts:', results[0].count);
      }
      
      // Test escrow transactions table
      db.query('SELECT COUNT(*) as count FROM escrow_transactions', (error, results) => {
        if (error) {
          console.error('❌ Error fetching escrow transactions:', error.message);
        } else {
          console.log('🔒 Escrow transactions:', results[0].count);
        }
        
        console.log('✅ Database test completed');
        db.end();
      });
    });
  });
});