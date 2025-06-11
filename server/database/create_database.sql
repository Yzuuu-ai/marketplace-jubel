-- Create database and tables for Marketplace Jubel
-- Run this script in MySQL Workbench or command line

-- Create database
CREATE DATABASE IF NOT EXISTS jubel_db;
USE jubel_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    wallet_address VARCHAR(42) NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    account_type ENUM('email', 'wallet') DEFAULT 'email',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_account_type (account_type)
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create game_accounts table
CREATE TABLE IF NOT EXISTS game_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    level INT NULL,
    rank VARCHAR(100) NULL,
    price DECIMAL(18, 8) NOT NULL,
    description TEXT NULL,
    images JSON NULL,
    contact_type ENUM('whatsapp', 'instagram', 'telegram') DEFAULT 'whatsapp',
    contact_value VARCHAR(255) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    seller_id INT NULL,
    is_sold BOOLEAN DEFAULT FALSE,
    is_in_escrow BOOLEAN DEFAULT FALSE,
    escrow_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_game_id (game_id),
    INDEX idx_seller_wallet (seller_wallet),
    INDEX idx_seller_id (seller_id),
    INDEX idx_is_sold (is_sold),
    INDEX idx_is_in_escrow (is_in_escrow)
);

-- Create wallet_profiles table (for standalone wallet users)
CREATE TABLE IF NOT EXISTS wallet_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address)
);

-- Create user_wallets table (for email users with connected wallets)
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet (user_id, wallet_address),
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address)
);

-- Create user_transaction_stats table
CREATE TABLE IF NOT EXISTS user_transaction_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    wallet_address VARCHAR(42) NULL,
    total_transactions INT DEFAULT 0,
    as_seller INT DEFAULT 0,
    as_buyer INT DEFAULT 0,
    completed_sales INT DEFAULT 0,
    completed_purchases INT DEFAULT 0,
    total_sales_amount DECIMAL(18, 8) DEFAULT 0,
    total_purchases_amount DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address)
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    wallet_address VARCHAR(42) NULL,
    activity_type ENUM('login', 'register', 'profile_update', 'wallet_connect', 'wallet_disconnect', 'transaction_create', 'transaction_complete') NOT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Create escrow_transactions table (if not exists)
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    buyer_wallet VARCHAR(42) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    status ENUM('pending', 'paid', 'delivered', 'completed', 'disputed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES game_accounts(id) ON DELETE CASCADE,
    INDEX idx_seller_wallet (seller_wallet),
    INDEX idx_buyer_wallet (buyer_wallet),
    INDEX idx_status (status)
);

-- Insert default games
INSERT IGNORE INTO games (id, name, description, icon, created_at) VALUES
(1, 'Mobile Legends', 'MOBA game populer untuk mobile', '🎮', NOW()),
(2, 'Free Fire', 'Battle royale game', '🔥', NOW()),
(3, 'PUBG Mobile', 'PlayerUnknown\'s Battlegrounds Mobile', '🎯', NOW()),
(4, 'Genshin Impact', 'Open-world action RPG', '⚔️', NOW()),
(5, 'Call of Duty Mobile', 'First-person shooter mobile', '🔫', NOW()),
(6, 'Valorant', 'Tactical first-person shooter', '💥', NOW()),
(7, 'League of Legends', 'Multiplayer online battle arena', '🏆', NOW()),
(8, 'Dota 2', 'Multiplayer online battle arena', '⚡', NOW());

-- Create view for user profile with wallet and stats
CREATE OR REPLACE VIEW user_profile_view AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    u.account_type,
    u.wallet_address as primary_wallet,
    u.is_email_verified,
    u.created_at as user_created_at,
    u.last_login,
    uw.wallet_address as connected_wallet,
    wp.name as wallet_name,
    wp.email as wallet_email,
    wp.phone as wallet_phone,
    COALESCE(uts.total_transactions, 0) as total_transactions,
    COALESCE(uts.as_seller, 0) as as_seller,
    COALESCE(uts.as_buyer, 0) as as_buyer,
    COALESCE(uts.completed_sales, 0) as completed_sales,
    COALESCE(uts.completed_purchases, 0) as completed_purchases,
    COALESCE(uts.total_sales_amount, 0) as total_sales_amount,
    COALESCE(uts.total_purchases_amount, 0) as total_purchases_amount
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = TRUE
LEFT JOIN wallet_profiles wp ON uw.wallet_address = wp.wallet_address
LEFT JOIN user_transaction_stats uts ON (u.id = uts.user_id OR uw.wallet_address = uts.wallet_address);

-- Show success message
SELECT 'Database jubel_db created successfully!' as message;
SELECT 'Tables created:' as info;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'jubel_db';