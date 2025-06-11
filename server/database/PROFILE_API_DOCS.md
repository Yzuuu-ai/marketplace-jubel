# Profile API Documentation

## Overview
API endpoints untuk mengelola profil user, wallet connection, dan statistik transaksi berdasarkan Profile.jsx component.

## Database Tables

### 1. wallet_profiles
Menyimpan profil untuk wallet-based accounts
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- wallet_address (VARCHAR(42), UNIQUE, NOT NULL)
- name (VARCHAR(255), NOT NULL)
- email (VARCHAR(255), NULL)
- phone (VARCHAR(20), NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. user_wallets
Menghubungkan email users dengan wallet addresses
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY to users.id)
- wallet_address (VARCHAR(42), NOT NULL)
- is_primary (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. user_transaction_stats
Menyimpan statistik transaksi user
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- user_id (INT, NULL, FOREIGN KEY to users.id)
- wallet_address (VARCHAR(42), NULL)
- total_transactions (INT, DEFAULT 0)
- as_seller (INT, DEFAULT 0)
- as_buyer (INT, DEFAULT 0)
- completed_sales (INT, DEFAULT 0)
- completed_purchases (INT, DEFAULT 0)
- total_sales_amount (DECIMAL(18,8), DEFAULT 0)
- total_purchases_amount (DECIMAL(18,8), DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4. user_activities
Log aktivitas user
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- user_id (INT, NULL, FOREIGN KEY to users.id)
- wallet_address (VARCHAR(42), NULL)
- activity_type (ENUM: login, register, profile_update, wallet_connect, wallet_disconnect, transaction_create, transaction_complete)
- description (TEXT, NULL)
- metadata (JSON, NULL)
- ip_address (VARCHAR(45), NULL)
- user_agent (TEXT, NULL)
- created_at (TIMESTAMP)
```

## API Endpoints

### 1. Get User Profile (Enhanced)
**GET** `/api/profile`
- **Auth**: Required (Bearer token)
- **Description**: Mendapatkan profil user lengkap dengan statistik transaksi
- **Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "account_type": "email",
    "wallet_address": "0x1234...5678",
    "is_email_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T12:00:00.000Z",
    "transaction_stats": {
      "total_transactions": 5,
      "as_seller": 3,
      "as_buyer": 2,
      "completed_sales": 2,
      "completed_purchases": 1,
      "total_sales_amount": "0.15000000",
      "total_purchases_amount": "0.05000000"
    }
  }
}
```

### 2. Update User Profile (Enhanced)
**PUT** `/api/profile`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "name": "John Doe Updated",
  "phone": "081234567890",
  "email": "john.new@example.com" // Only for wallet accounts
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### 3. Connect Wallet to Email Account
**POST** `/api/profile/connect-wallet`
- **Auth**: Required (Bearer token)
- **Description**: Menghubungkan wallet address ke email account
- **Body**:
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Wallet connected successfully",
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

### 4. Disconnect Wallet from Email Account
**DELETE** `/api/profile/disconnect-wallet`
- **Auth**: Required (Bearer token)
- **Description**: Melepas wallet address dari email account
- **Response**:
```json
{
  "success": true,
  "message": "Wallet disconnected successfully"
}
```

### 5. Get Wallet Profile
**GET** `/api/wallet-profile/:wallet_address`
- **Auth**: Not required
- **Description**: Mendapatkan profil wallet-based account
- **Response**:
```json
{
  "success": true,
  "profile": {
    "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
    "name": "Wallet User",
    "email": "wallet@example.com",
    "phone": "081234567890",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z",
    "transaction_stats": {
      "total_transactions": 3,
      "as_seller": 2,
      "as_buyer": 1,
      "completed_sales": 1,
      "completed_purchases": 1,
      "total_sales_amount": "0.10000000",
      "total_purchases_amount": "0.03000000"
    }
  }
}
```

### 6. Create/Update Wallet Profile
**POST** `/api/wallet-profile`
- **Auth**: Not required
- **Description**: Membuat atau update profil wallet
- **Body**:
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "Wallet User",
  "email": "wallet@example.com",
  "phone": "081234567890"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Wallet profile saved successfully"
}
```

### 7. Get User Activities
**GET** `/api/profile/activities`
- **Auth**: Required (Bearer token)
- **Description**: Mendapatkan log aktivitas user
- **Query Parameters**:
  - `limit` (optional, default: 10)
  - `offset` (optional, default: 0)
- **Response**:
```json
{
  "success": true,
  "activities": [
    {
      "activity_type": "profile_update",
      "description": "User updated profile information",
      "created_at": "2024-01-01T12:00:00.000Z",
      "metadata": null
    },
    {
      "activity_type": "wallet_connect",
      "description": "Connected wallet 0x1234...5678",
      "created_at": "2024-01-01T11:00:00.000Z",
      "metadata": null
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Setup Instructions

1. **Install Dependencies** (jika belum):
```bash
cd server
npm install mysql2 bcryptjs jsonwebtoken dotenv
```

2. **Setup Database**:
```bash
node database/setup_profile_db.js
```

3. **Environment Variables** (.env):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jubel_db
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. **Start Server**:
```bash
npm start
# atau
node server.js
```

## Integration dengan Profile.jsx

Endpoint-endpoint ini dirancang untuk mendukung semua fitur yang ada di Profile.jsx:

1. **Account Type Detection**: Mendukung email dan wallet accounts
2. **Profile Management**: CRUD operations untuk profil user
3. **Wallet Connection**: Menghubungkan/melepas wallet dari email account
4. **Transaction Statistics**: Statistik transaksi real-time
5. **Activity Logging**: Log semua aktivitas user
6. **Data Validation**: Validasi wallet address format dan data input

## Database Triggers

Sistem menggunakan MySQL triggers untuk otomatis update statistik transaksi:
- `update_user_stats_after_transaction`: Update stats saat transaksi baru
- `update_user_stats_after_transaction_complete`: Update stats saat transaksi selesai

## Security Features

1. **JWT Authentication**: Endpoint yang sensitif memerlukan token
2. **Input Validation**: Validasi format wallet address dan data input
3. **SQL Injection Prevention**: Menggunakan prepared statements
4. **Activity Logging**: Log semua aktivitas untuk audit trail