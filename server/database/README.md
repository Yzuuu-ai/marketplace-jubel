# Marketplace Jubel - Database Setup Guide

## Overview

This directory contains all the necessary files to set up the complete database for the Marketplace Jubel application. The database includes tables for users, games, game accounts, escrow transactions, reviews, and more.

## Files Description

### 1. `marketplace_database.sql`
Complete SQL script that creates all necessary tables, views, stored procedures, and inserts default data.

### 2. `setup_marketplace_db.js`
Node.js script to automatically set up the database with verification and sample data insertion.

### 3. `marketplace_api_endpoints.js`
Additional API endpoints that should be added to your server.js file for marketplace functionality.

### 4. `create_database.sql` (Legacy)
Original database creation script - superseded by `marketplace_database.sql`.

## Database Schema

### Core Tables

1. **users** - User accounts (email-based)
2. **games** - Available games in the marketplace
3. **game_accounts** - Game accounts for sale
4. **wallet_profiles** - Standalone wallet user profiles
5. **user_wallets** - Connected wallets for email users

### Transaction Tables

6. **escrow_transactions** - Main escrow transaction records
7. **transaction_history** - Detailed transaction history log
8. **user_transaction_stats** - User transaction statistics
9. **user_activities** - User activity logs

### Marketplace Features

10. **user_favorites** - User favorite accounts
11. **reviews** - User reviews and ratings
12. **admin_settings** - System configuration settings

### Views

- **user_profile_view** - Complete user profile with stats
- **game_accounts_view** - Game accounts with seller information

## Setup Instructions

### Method 1: Automatic Setup (Recommended)

1. **Install Dependencies**
   ```bash
   cd server
   npm install mysql2 dotenv
   ```

2. **Configure Environment**
   Create or update your `.env` file:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=jubel_db
   JWT_SECRET=your_jwt_secret
   ESCROW_WALLET=0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f
   ```

3. **Run Setup Script**
   ```bash
   node database/setup_marketplace_db.js
   ```

   This will:
   - Create the database if it doesn't exist
   - Create all tables, views, and stored procedures
   - Insert default games and sample data
   - Verify the setup
   - Show a summary of created tables

### Method 2: Manual Setup

1. **Open MySQL Workbench or Command Line**

2. **Execute SQL Script**
   ```sql
   source /path/to/marketplace_database.sql
   ```
   
   Or copy and paste the contents of `marketplace_database.sql` into your MySQL client.

3. **Verify Setup**
   ```sql
   USE jubel_db;
   SHOW TABLES;
   SELECT COUNT(*) FROM games;
   ```

## Database Configuration

### Default Admin Settings

The database includes default admin settings:

- **Escrow Wallet**: `0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f`
- **Admin Wallets**: `["0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f"]`
- **ETH to IDR Rate**: `50,000,000`
- **Escrow Fee**: `2.5%`
- **Auto-release Time**: `24 hours`
- **Payment Timeout**: `24 hours`

### Default Games

The setup includes 10 popular games:
1. Mobile Legends (ML)
2. Free Fire (FF)
3. PUBG Mobile (PUBG)
4. Genshin Impact (GI)
5. Call of Duty Mobile (CODM)
6. Valorant (VAL)
7. League of Legends (LOL)
8. Dota 2 (DOTA2)
9. Clash of Clans (COC)
10. Clash Royale (CR)

## API Integration

### Adding New Endpoints

Copy the endpoints from `marketplace_api_endpoints.js` to your `server.js` file. These include:

- **Marketplace Statistics**: `GET /api/marketplace/stats`
- **Advanced Search**: `GET /api/marketplace/search`
- **Featured Accounts**: `GET /api/marketplace/featured`
- **Favorites Management**: `POST/DELETE /api/marketplace/favorites`
- **Escrow Management**: `POST /api/escrow/create`, `GET /api/escrow/transactions`

### Example Usage

```javascript
// Get marketplace statistics
fetch('/api/marketplace/stats')
  .then(response => response.json())
  .then(data => console.log(data.stats));

// Search accounts
fetch('/api/marketplace/search?q=mobile+legends&min_price=0.01&max_price=0.1')
  .then(response => response.json())
  .then(data => console.log(data.accounts));

// Create escrow transaction
fetch('/api/escrow/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_id: 1,
    seller_wallet: '0x...',
    buyer_wallet: '0x...',
    amount: 0.05,
    payment_hash: '0x...'
  })
});
```

## Sample Data

The setup includes sample data for testing:

### Sample User
- **Email**: test@example.com
- **Password**: password
- **Wallet**: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6

### Sample Game Accounts
1. ML Account Mythic Glory (0.05 ETH)
2. Free Fire Diamond 10000 (0.03 ETH)
3. Genshin Impact AR 55 (0.08 ETH)

## Database Maintenance

### Regular Tasks

1. **Clean Expired Escrow Transactions**
   ```sql
   UPDATE escrow_transactions 
   SET status = 'cancelled' 
   WHERE status = 'pending_payment' 
   AND expires_at < NOW();
   ```

2. **Update User Statistics**
   ```sql
   CALL UpdateUserTransactionStats(user_id, wallet_address, 'sale', amount, rating);
   ```

3. **Clean Old Activity Logs**
   ```sql
   DELETE FROM user_activities 
   WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
   ```

### Backup

```bash
mysqldump -u root -p jubel_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
mysql -u root -p jubel_db < backup_file.sql
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Check MySQL service is running
   - Verify credentials in `.env` file
   - Ensure database user has proper permissions

2. **Table Creation Failed**
   - Check MySQL version compatibility
   - Ensure sufficient privileges
   - Check for existing tables with same names

3. **Sample Data Not Inserted**
   - Check for duplicate key constraints
   - Verify foreign key relationships
   - Check table structure

### Verification Queries

```sql
-- Check all tables exist
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'jubel_db';

-- Check sample data
SELECT COUNT(*) as games FROM games;
SELECT COUNT(*) as accounts FROM game_accounts;
SELECT COUNT(*) as users FROM users;

-- Check views work
SELECT COUNT(*) FROM user_profile_view;
SELECT COUNT(*) FROM game_accounts_view;
```

## Support

If you encounter any issues:

1. Check the console output from the setup script
2. Verify your MySQL version (8.0+ recommended)
3. Ensure all required permissions are granted
4. Check the error logs in your MySQL installation

## Security Notes

- Change default admin wallet addresses in production
- Use strong passwords for database users
- Regularly backup your database
- Monitor transaction logs for suspicious activity
- Keep your MySQL installation updated

---

**Last Updated**: December 2024
**Version**: 1.0.0