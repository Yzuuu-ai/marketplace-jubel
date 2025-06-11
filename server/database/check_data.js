// check_data.js
// Script untuk memeriksa data di database

const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jubel_db',
  charset: 'utf8mb4'
};

const checkData = async () => {
  let connection;
  
  try {
    console.log('🔍 Memeriksa Data di Database...');
    console.log('=====================================');
    
    // Create connection
    connection = mysql.createConnection(dbConfig);
    
    console.log('🔌 Connecting to MySQL...');
    await connection.promise().connect();
    console.log('✅ Connected to MySQL successfully');
    
    // Check game accounts
    console.log('\n📊 Game Accounts:');
    const [accounts] = await connection.promise().query(`
      SELECT 
        ga.id,
        ga.title,
        g.name as game_name,
        ga.price,
        ga.seller_wallet,
        ga.is_sold,
        ga.is_in_escrow,
        ga.created_at
      FROM game_accounts ga
      JOIN games g ON ga.game_id = g.id
      ORDER BY ga.created_at DESC
      LIMIT 10
    `);
    
    if (accounts.length === 0) {
      console.log('❌ Tidak ada akun game ditemukan di database');
    } else {
      console.log(`✅ Ditemukan ${accounts.length} akun game:`);
      accounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.title} (${account.game_name})`);
        console.log(`   - ID: ${account.id}`);
        console.log(`   - Harga: ${account.price} ETH`);
        console.log(`   - Seller: ${account.seller_wallet}`);
        console.log(`   - Status: ${account.is_sold ? 'TERJUAL' : account.is_in_escrow ? 'ESCROW' : 'TERSEDIA'}`);
        console.log(`   - Dibuat: ${account.created_at}`);
        console.log('');
      });
    }
    
    // Check available accounts (yang seharusnya muncul di marketplace)
    console.log('\n🛒 Akun Tersedia untuk Marketplace:');
    const [availableAccounts] = await connection.promise().query(`
      SELECT 
        ga.id,
        ga.title,
        g.name as game_name,
        ga.price,
        ga.seller_wallet,
        ga.created_at
      FROM game_accounts ga
      JOIN games g ON ga.game_id = g.id
      WHERE ga.is_sold = FALSE AND ga.is_in_escrow = FALSE
      ORDER BY ga.created_at DESC
    `);
    
    if (availableAccounts.length === 0) {
      console.log('❌ Tidak ada akun tersedia untuk marketplace');
      console.log('   Kemungkinan semua akun sudah terjual atau dalam escrow');
    } else {
      console.log(`✅ ${availableAccounts.length} akun tersedia untuk marketplace:`);
      availableAccounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.title} (${account.game_name}) - ${account.price} ETH`);
      });
    }
    
    // Check games
    console.log('\n🎮 Games:');
    const [games] = await connection.promise().query('SELECT * FROM games ORDER BY id');
    console.log(`✅ ${games.length} games tersedia:`);
    games.forEach(game => {
      console.log(`- ${game.name} (${game.code})`);
    });
    
    // Check users
    console.log('\n👥 Users:');
    const [users] = await connection.promise().query('SELECT id, name, email, wallet_address FROM users');
    console.log(`✅ ${users.length} users terdaftar:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Wallet: ${user.wallet_address || 'Tidak ada'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
};

// Run the check if this file is executed directly
if (require.main === module) {
  checkData();
}

module.exports = { checkData };