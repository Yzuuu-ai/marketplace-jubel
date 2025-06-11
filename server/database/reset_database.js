// reset_database.js
// Script to completely reset the database

const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4'
};

const resetDatabase = async () => {
  let connection;
  
  try {
    console.log('🔄 Resetting Marketplace Database...');
    console.log('=====================================');
    
    // Create connection
    connection = mysql.createConnection(dbConfig);
    
    console.log('🔌 Connecting to MySQL...');
    await connection.promise().connect();
    console.log('✅ Connected to MySQL successfully');
    
    const dbName = process.env.DB_NAME || 'jubel_db';
    
    // Drop database if exists
    console.log(`🗑️  Dropping database '${dbName}' if it exists...`);
    await connection.promise().query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('✅ Database dropped successfully');
    
    // Create fresh database
    console.log(`📝 Creating fresh database '${dbName}'...`);
    await connection.promise().query(`CREATE DATABASE ${dbName}`);
    console.log('✅ Fresh database created successfully');
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('You can now run the setup script to create all tables.');
    
  } catch (error) {
    console.error('\n❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the reset if this file is executed directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };