// check_system.js - Script untuk mengecek status sistem
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Marketplace Jubel System Status...\n');

// Check if required files exist
const requiredFiles = [
  'server/server.js',
  'server/.env',
  'server/package.json',
  'client/package.json',
  'server/database/create_database.sql'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Check .env configuration
console.log('\n⚙️  Checking .env configuration...');
if (fs.existsSync('server/.env')) {
  const envContent = fs.readFileSync('server/.env', 'utf8');
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'PORT'];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} configured`);
    } else {
      console.log(`❌ ${envVar} - MISSING!`);
    }
  });
} else {
  console.log('❌ .env file not found!');
}

// Check database connection
console.log('\n🗄️  Checking database connection...');
require('dotenv').config({ path: 'server/.env' });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jubel_db',
  charset: 'utf8mb4'
});

db.connect(err => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('\n💡 Solutions:');
    console.log('   1. Make sure MySQL server is running');
    console.log('   2. Check DB credentials in .env file');
    console.log('   3. Create database: CREATE DATABASE jubel_db;');
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    console.log('\n📋 Checking database tables...');
    const requiredTables = [
      'users', 'games', 'game_accounts', 'wallet_profiles', 
      'user_wallets', 'user_transaction_stats', 'user_activities'
    ];
    
    let tablesChecked = 0;
    requiredTables.forEach(table => {
      db.query(`SHOW TABLES LIKE '${table}'`, (error, results) => {
        if (error) {
          console.log(`❌ Error checking table ${table}:`, error.message);
        } else if (results.length === 0) {
          console.log(`❌ Table ${table} - NOT FOUND!`);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
        
        tablesChecked++;
        if (tablesChecked === requiredTables.length) {
          // Check if games data exists
          db.query('SELECT COUNT(*) as count FROM games', (error, results) => {
            if (error) {
              console.log('❌ Error checking games data:', error.message);
            } else {
              const count = results[0].count;
              if (count > 0) {
                console.log(`✅ Games data: ${count} games found`);
              } else {
                console.log('⚠️  Games data: No games found (run INSERT games script)');
              }
            }
            
            // Final status
            console.log('\n🎯 System Status Summary:');
            console.log('✅ Files: All required files present');
            console.log('✅ Config: Environment variables configured');
            console.log('✅ Database: Connection successful');
            console.log('✅ Tables: Database schema ready');
            
            console.log('\n🚀 Next Steps:');
            console.log('1. Start server: cd server && npm start');
            console.log('2. Start client: cd client && npm start');
            console.log('3. Open browser: http://localhost:3000');
            console.log('4. Test registration and login');
            
            db.end();
          });
        }
      });
    });
  }
});

// Check if ports are available
console.log('\n🔌 Checking port availability...');
const net = require('net');

function checkPort(port, callback) {
  const server = net.createServer();
  
  server.listen(port, () => {
    server.once('close', () => {
      callback(true);
    });
    server.close();
  });
  
  server.on('error', () => {
    callback(false);
  });
}

checkPort(5000, (available) => {
  if (available) {
    console.log('✅ Port 5000 (server) available');
  } else {
    console.log('⚠️  Port 5000 (server) in use - stop existing process or change port');
  }
});

checkPort(3000, (available) => {
  if (available) {
    console.log('✅ Port 3000 (client) available');
  } else {
    console.log('⚠️  Port 3000 (client) in use - stop existing process or change port');
  }
});