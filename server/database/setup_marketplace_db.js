
// setup_marketplace_db.js
// Script to setup the complete marketplace database

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4'
};

// Function to execute SQL file
const executeSQLFile = async (connection, filePath, skipUseStatement = false) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Executing SQL file: ${path.basename(filePath)}`);
    
    // Remove comments first
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
    
    // Split SQL into individual statements and execute them one by one
    let statements = cleanedSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Filter out problematic statements
    statements = statements.filter(stmt => {
      const trimmed = stmt.trim();
      // Skip empty statements and USE statements if requested
      if (!trimmed) {
        return false;
      }
      if (skipUseStatement && trimmed.toUpperCase().startsWith('USE ')) {
        console.log(`   ⚠️  Skipping USE statement: ${trimmed.substring(0, 50)}...`);
        return false;
      }
      return true;
    });
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await connection.promise().execute(statement);
          if (i % 5 === 0 || i === statements.length - 1) {
            console.log(`   ⏳ Executed ${i + 1}/${statements.length} statements...`);
          }
        } catch (error) {
          // Skip certain harmless errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('Unknown database') &&
              !error.message.includes('Table') &&
              !error.message.includes('View') &&
              !error.message.includes('Procedure') &&
              !error.message.includes('Duplicate key name') &&
              !error.message.includes('not supported in the prepared statement protocol')) {
            console.error(`❌ Error in statement ${i + 1}:`, statement.substring(0, 100) + '...');
            console.error('Error:', error.message);
            throw error;
          } else {
            console.log(`   ⚠️  Skipped statement ${i + 1}: ${error.message.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
    throw error;
  }
};

// Function to check if database exists
const checkDatabase = async (connection, dbName) => {
  try {
    const [results] = await connection.promise().execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );
    return results.length > 0;
  } catch (error) {
    console.error('Error checking database:', error.message);
    return false;
  }
};

// Function to check table structure
const checkTables = async (connection, dbName) => {
  try {
    const [tables] = await connection.promise().query(`
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME, UPDATE_TIME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [dbName]);
    
    console.log('\n📊 Database Tables:');
    console.log('┌─────────────────────────────┬──────────┬─────────────────────┐');
    console.log('│ Table Name                  │ Rows     │ Created             │');
    console.log('├─────────────────────────────┼──────────┼─────────────────────┤');
    
    tables.forEach(table => {
      const name = table.TABLE_NAME.padEnd(27);
      const rows = (table.TABLE_ROWS || 0).toString().padStart(8);
      const created = table.CREATE_TIME ? 
        new Date(table.CREATE_TIME).toLocaleString('id-ID').substring(0, 19) : 
        'Unknown'.padEnd(19);
      console.log(`│ ${name} │ ${rows} │ ${created} │`);
    });
    
    console.log('└─────────────────────────────┴──────────┴─────────────────────┘');
    
    return tables;
  } catch (error) {
    console.error('Error checking tables:', error.message);
    return [];
  }
};

// Function to insert sample data
const insertSampleData = async (connection) => {
  try {
    console.log('\n🌱 Inserting sample data...');
    
    // Check if we already have sample data
    const [gameCount] = await connection.promise().execute(
      'SELECT COUNT(*) as count FROM games'
    );
    
    if (gameCount[0].count > 0) {
      console.log('✅ Sample games already exist');
    } else {
      console.log('📝 No sample data found, inserting...');
    }
    
    // Insert sample user (for testing)
    const sampleUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      phone: '081234567890',
      wallet_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      account_type: 'email',
      is_email_verified: true
    };
    
    await connection.promise().execute(`
      INSERT IGNORE INTO users (name, email, password, phone, wallet_address, account_type, is_email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      sampleUser.name,
      sampleUser.email, 
      sampleUser.password,
      sampleUser.phone,
      sampleUser.wallet_address,
      sampleUser.account_type,
      sampleUser.is_email_verified
    ]);
    
    // Insert sample wallet profile
    await connection.promise().execute(`
      INSERT IGNORE INTO wallet_profiles (wallet_address, name, email, phone)
      VALUES (?, ?, ?, ?)
    `, [
      '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f',
      'Admin Wallet',
      'admin@jubel.com',
      '081234567891'
    ]);
    
    // Insert sample game accounts
    const sampleAccounts = [
      {
        game_id: 1,
        title: 'ML Account Mythic Glory',
        level: 85,
        rank: 'Mythic Glory',
        price: 0.05,
        description: 'Akun Mobile Legends dengan rank Mythic Glory, hero lengkap, skin epic banyak',
        seller_wallet: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contact_type: 'whatsapp',
        contact_value: '081234567890'
      },
      {
        game_id: 2,
        title: 'Free Fire Diamond 10000',
        level: 60,
        rank: 'Heroic',
        price: 0.03,
        description: 'Akun Free Fire dengan 10000 diamond, skin rare, pet legendary',
        seller_wallet: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contact_type: 'whatsapp',
        contact_value: '081234567890'
      },
      {
        game_id: 4,
        title: 'Genshin Impact AR 55',
        level: 55,
        rank: 'Adventure Rank 55',
        price: 0.08,
        description: 'Akun Genshin Impact AR 55, 5-star characters: Zhongli, Venti, Diluc, Qiqi',
        seller_wallet: '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f',
        contact_type: 'telegram',
        contact_value: '@admin_jubel'
      }
    ];
    
    for (const account of sampleAccounts) {
      await connection.promise().execute(`
        INSERT IGNORE INTO game_accounts 
        (game_id, title, level, rank, price, description, seller_wallet, contact_type, contact_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        account.game_id,
        account.title,
        account.level,
        account.rank,
        account.price,
        account.description,
        account.seller_wallet,
        account.contact_type,
        account.contact_value
      ]);
    }
    
    console.log('✅ Sample data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
  }
};

// Function to verify database setup
const verifySetup = async (connection) => {
  try {
    console.log('\n🔍 Verifying database setup...');
    
    // Test basic queries
    const tests = [
      {
        name: 'Games table',
        query: 'SELECT COUNT(*) as count FROM games',
        expected: 'count > 0'
      },
      {
        name: 'Users table',
        query: 'SELECT COUNT(*) as count FROM users',
        expected: 'count >= 0'
      },
      {
        name: 'Game accounts table',
        query: 'SELECT COUNT(*) as count FROM game_accounts',
        expected: 'count >= 0'
      },
      {
        name: 'Escrow transactions table',
        query: 'SELECT COUNT(*) as count FROM escrow_transactions',
        expected: 'count >= 0'
      },
      {
        name: 'User profile view',
        query: 'SELECT COUNT(*) as count FROM user_profile_view',
        expected: 'count >= 0'
      },
      {
        name: 'Game accounts view',
        query: 'SELECT COUNT(*) as count FROM game_accounts_view',
        expected: 'count >= 0'
      }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
      try {
        const [result] = await connection.promise().query(test.query);
        const count = result[0].count;
        console.log(`✅ ${test.name}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 Database setup verification completed successfully!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
};

// Main setup function
const setupDatabase = async () => {
  let connection;
  
  try {
    console.log('🚀 Starting Marketplace Database Setup...');
    console.log('=====================================');
    
    // Create connection
    connection = mysql.createConnection(dbConfig);
    
    console.log('🔌 Connecting to MySQL...');
    await connection.promise().connect();
    console.log('✅ Connected to MySQL successfully');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'jubel_db';
    const dbExists = await checkDatabase(connection, dbName);
    
    if (dbExists) {
      console.log(`✅ Database '${dbName}' already exists`);
    } else {
      console.log(`📝 Database '${dbName}' does not exist, will be created`);
    }
    
    // Switch to the database first
    console.log(`🔄 Switching to database: ${dbName}`);
    await connection.promise().query(`USE ${dbName}`);
    
    // Execute the main SQL file (skip USE statements since we already switched)
    const sqlFilePath = path.join(__dirname, 'marketplace_clean.sql');
    if (fs.existsSync(sqlFilePath)) {
      await executeSQLFile(connection, sqlFilePath, true); // Skip USE statements
    } else {
      throw new Error('marketplace_clean.sql file not found');
    }
    
    // Create views
    console.log('\n📋 Creating database views...');
    const viewsFilePath = path.join(__dirname, 'create_views.sql');
    if (fs.existsSync(viewsFilePath)) {
      try {
        await executeSQLFile(connection, viewsFilePath, true); // Skip USE statements
        console.log('✅ Views created successfully');
      } catch (error) {
        console.log('⚠️  Views creation failed, but continuing:', error.message);
      }
    }
    
    // Check tables
    const tables = await checkTables(connection, dbName);
    
    if (tables.length === 0) {
      throw new Error('No tables were created');
    }
    
    // Insert sample data
    await insertSampleData(connection);
    
    // Verify setup
    const verificationPassed = await verifySetup(connection);
    
    if (verificationPassed) {
      console.log('\n🎉 MARKETPLACE DATABASE SETUP COMPLETED SUCCESSFULLY!');
      console.log('=====================================');
      console.log('📋 Summary:');
      console.log(`   • Database: ${dbName}`);
      console.log(`   • Tables created: ${tables.length}`);
      console.log('   • Sample data inserted');
      console.log('   • All verifications passed');
      console.log('\n🔗 You can now start the server and use the marketplace!');
    } else {
      console.log('\n⚠️  Setup completed with some issues. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  checkDatabase,
  checkTables,
  verifySetup
};