-- =====================================================
-- MARKETPLACE JUBEL - COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates all necessary tables for the marketplace
-- Run this script in MySQL Workbench or command line

-- Create database
CREATE DATABASE IF NOT EXISTS jubel_db;
USE jubel_db;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    wallet_address VARCHAR(42) NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    account_type ENUM('email', 'wallet') DEFAULT 'email',
    profile_image TEXT NULL,
    bio TEXT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 5.00,
    total_sales INT DEFAULT 0,
    total_purchases INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified_seller BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_account_type (account_type),
    INDEX idx_is_active (is_active),
    INDEX idx_reputation_score (reputation_score)
);

-- Games table (enhanced)
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    icon VARCHAR(10) NULL,
    image_url TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
);

-- Game accounts table (enhanced)
CREATE TABLE IF NOT EXISTS game_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    level INT NULL,
    rank VARCHAR(100) NULL,
    server_region VARCHAR(50) NULL,
    price DECIMAL(18, 8) NOT NULL,
    original_price DECIMAL(18, 8) NULL,
    currency ENUM('ETH', 'BTC', 'USDT') DEFAULT 'ETH',
    description TEXT NULL,
    images JSON NULL,
    additional_info JSON NULL, -- For storing extra game-specific data
    contact_type ENUM('whatsapp', 'instagram', 'telegram', 'discord') DEFAULT 'whatsapp',
    contact_value VARCHAR(255) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    seller_id INT NULL,
    is_sold BOOLEAN DEFAULT FALSE,
    is_in_escrow BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    escrow_id VARCHAR(100) NULL,
    sold_at TIMESTAMP NULL,
    featured_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_game_id (game_id),
    INDEX idx_seller_wallet (seller_wallet),
    INDEX idx_seller_id (seller_id),
    INDEX idx_is_sold (is_sold),
    INDEX idx_is_in_escrow (is_in_escrow),
    INDEX idx_is_featured (is_featured),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at),
    INDEX idx_view_count (view_count),
    FULLTEXT idx_search (title, description)
);

-- =====================================================
-- TRANSACTION & ESCROW TABLES
-- =====================================================

-- Escrow transactions table (enhanced)
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id VARCHAR(100) PRIMARY KEY,
    account_id INT NOT NULL,
    account_title VARCHAR(255) NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    buyer_wallet VARCHAR(42) NOT NULL,
    escrow_wallet VARCHAR(42) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency ENUM('ETH', 'BTC', 'USDT') DEFAULT 'ETH',
    amount_idr DECIMAL(15, 2) NULL,
    exchange_rate DECIMAL(15, 2) NULL,
    status ENUM(
        'pending_payment', 
        'payment_received', 
        'account_delivered', 
        'buyer_confirmed', 
        'completed', 
        'disputed', 
        'refunded', 
        'cancelled'
    ) DEFAULT 'pending_payment',
    payment_hash VARCHAR(66) NULL,
    admin_payment_hash VARCHAR(66) NULL,
    network VARCHAR(50) NULL,
    dispute_reason TEXT NULL,
    dispute_by ENUM('buyer', 'seller') NULL,
    dispute_id VARCHAR(100) NULL,
    resolution TEXT NULL,
    account_details JSON NULL,
    delivery_proof JSON NULL,
    buyer_confirmation JSON NULL,
    timeline JSON NULL,
    metadata JSON NULL,
    expires_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES game_accounts(id) ON DELETE CASCADE,
    INDEX idx_seller_wallet (seller_wallet),
    INDEX idx_buyer_wallet (buyer_wallet),
    INDEX idx_status (status),
    INDEX idx_payment_hash (payment_hash),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

-- Transaction history table
CREATE TABLE IF NOT EXISTS transaction_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    escrow_id VARCHAR(100) NOT NULL,
    action ENUM(
        'created', 
        'payment_received', 
        'account_delivered', 
        'buyer_confirmed', 
        'completed', 
        'disputed', 
        'resolved', 
        'refunded', 
        'cancelled'
    ) NOT NULL,
    actor_wallet VARCHAR(42) NOT NULL,
    actor_type ENUM('buyer', 'seller', 'admin') NOT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escrow_id) REFERENCES escrow_transactions(id) ON DELETE CASCADE,
    INDEX idx_escrow_id (escrow_id),
    INDEX idx_actor_wallet (actor_wallet),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- USER PROFILE & WALLET TABLES
-- =====================================================

-- Wallet profiles table (for standalone wallet users)
CREATE TABLE IF NOT EXISTS wallet_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    profile_image TEXT NULL,
    bio TEXT NULL,
    reputation_score DECIMAL(3,2) DEFAULT 5.00,
    total_sales INT DEFAULT 0,
    total_purchases INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_email (email),
    INDEX idx_reputation_score (reputation_score)
);

-- User wallets table (for email users with connected wallets)
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    wallet_name VARCHAR(100) NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet (user_id, wallet_address),
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_is_primary (is_primary)
);

-- =====================================================
-- STATISTICS & ANALYTICS TABLES
-- =====================================================

-- User transaction stats table
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
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    total_ratings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_total_transactions (total_transactions),
    INDEX idx_average_rating (average_rating)
);

-- User activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    wallet_address VARCHAR(42) NULL,
    activity_type ENUM(
        'login', 
        'register', 
        'profile_update', 
        'wallet_connect', 
        'wallet_disconnect', 
        'account_create', 
        'account_update', 
        'account_delete',
        'transaction_create', 
        'transaction_complete',
        'escrow_create',
        'escrow_complete',
        'dispute_create',
        'dispute_resolve'
    ) NOT NULL,
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

-- =====================================================
-- MARKETPLACE FEATURES TABLES
-- =====================================================

-- Favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    wallet_address VARCHAR(42) NULL,
    account_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES game_accounts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_favorite (user_id, account_id),
    UNIQUE KEY unique_wallet_favorite (wallet_address, account_id),
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_account_id (account_id)
);

-- Reviews and ratings table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    escrow_id VARCHAR(100) NOT NULL,
    reviewer_wallet VARCHAR(42) NOT NULL,
    reviewed_wallet VARCHAR(42) NOT NULL,
    reviewer_type ENUM('buyer', 'seller') NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escrow_id) REFERENCES escrow_transactions(id) ON DELETE CASCADE,
    INDEX idx_escrow_id (escrow_id),
    INDEX idx_reviewer_wallet (reviewer_wallet),
    INDEX idx_reviewed_wallet (reviewed_wallet),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- User profile view with wallet and stats
CREATE OR REPLACE VIEW user_profile_view AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    u.account_type,
    u.wallet_address as primary_wallet,
    u.profile_image,
    u.bio,
    u.reputation_score,
    u.total_sales,
    u.total_purchases,
    u.is_email_verified,
    u.is_verified_seller,
    u.created_at as user_created_at,
    u.last_login,
    uw.wallet_address as connected_wallet,
    wp.name as wallet_name,
    wp.email as wallet_email,
    wp.phone as wallet_phone,
    wp.reputation_score as wallet_reputation,
    COALESCE(uts.total_transactions, 0) as total_transactions,
    COALESCE(uts.as_seller, 0) as as_seller,
    COALESCE(uts.as_buyer, 0) as as_buyer,
    COALESCE(uts.completed_sales, 0) as completed_sales,
    COALESCE(uts.completed_purchases, 0) as completed_purchases,
    COALESCE(uts.total_sales_amount, 0) as total_sales_amount,
    COALESCE(uts.total_purchases_amount, 0) as total_purchases_amount,
    COALESCE(uts.average_rating, 5.00) as average_rating,
    COALESCE(uts.total_ratings, 0) as total_ratings
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = TRUE
LEFT JOIN wallet_profiles wp ON uw.wallet_address = wp.wallet_address
LEFT JOIN user_transaction_stats uts ON (u.id = uts.user_id OR uw.wallet_address = uts.wallet_address);

-- Game accounts with seller info view
CREATE OR REPLACE VIEW game_accounts_view AS
SELECT 
    ga.*,
    g.name as game_name,
    g.code as game_code,
    g.category as game_category,
    g.icon as game_icon,
    COALESCE(u.name, wp.name, CONCAT('User-', SUBSTRING(ga.seller_wallet, 1, 6))) as seller_name,
    COALESCE(u.reputation_score, wp.reputation_score, 5.00) as seller_reputation,
    COALESCE(u.total_sales, wp.total_sales, 0) as seller_total_sales,
    COALESCE(u.is_verified_seller, wp.is_verified, FALSE) as seller_is_verified,
    (SELECT COUNT(*) FROM user_favorites uf WHERE uf.account_id = ga.id) as favorite_count_actual
FROM game_accounts ga
JOIN games g ON ga.game_id = g.id
LEFT JOIN users u ON ga.seller_id = u.id
LEFT JOIN wallet_profiles wp ON ga.seller_wallet = wp.wallet_address
WHERE ga.is_sold = FALSE AND ga.is_in_escrow = FALSE;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default games
INSERT IGNORE INTO games (id, name, code, description, category, icon, created_at) VALUES
(1, 'Mobile Legends', 'ML', 'MOBA game populer untuk mobile', 'MOBA', '🎮', NOW()),
(2, 'Free Fire', 'FF', 'Battle royale game', 'Battle Royale', '🔥', NOW()),
(3, 'PUBG Mobile', 'PUBG', 'PlayerUnknown\'s Battlegrounds Mobile', 'Battle Royale', '🎯', NOW()),
(4, 'Genshin Impact', 'GI', 'Open-world action RPG', 'RPG', '⚔️', NOW()),
(5, 'Call of Duty Mobile', 'CODM', 'First-person shooter mobile', 'FPS', '🔫', NOW()),
(6, 'Valorant', 'VAL', 'Tactical first-person shooter', 'FPS', '💥', NOW()),
(7, 'League of Legends', 'LOL', 'Multiplayer online battle arena', 'MOBA', '🏆', NOW()),
(8, 'Dota 2', 'DOTA2', 'Multiplayer online battle arena', 'MOBA', '⚡', NOW()),
(9, 'Clash of Clans', 'COC', 'Strategy mobile game', 'Strategy', '🏰', NOW()),
(10, 'Clash Royale', 'CR', 'Real-time strategy game', 'Strategy', '👑', NOW());

-- Insert default admin settings
INSERT IGNORE INTO admin_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('escrow_wallet', '0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f', 'string', 'Main escrow wallet address', TRUE),
('admin_wallets', '["0xe14fcb0fdb1256445dc6ddd876225a8fad9d211f"]', 'json', 'List of admin wallet addresses', FALSE),
('eth_to_idr_rate', '50000000', 'number', 'ETH to IDR exchange rate', TRUE),
('escrow_fee_percentage', '2.5', 'number', 'Escrow fee percentage', TRUE),
('auto_release_hours', '24', 'number', 'Hours before auto-release funds', TRUE),
('payment_timeout_hours', '24', 'number', 'Hours before payment timeout', TRUE),
('min_account_price', '0.001', 'number', 'Minimum account price in ETH', TRUE),
('max_account_price', '10', 'number', 'Maximum account price in ETH', TRUE),
('featured_account_fee', '0.01', 'number', 'Fee for featuring account in ETH', TRUE),
('site_maintenance', 'false', 'boolean', 'Site maintenance mode', TRUE);

-- =====================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

DELIMITER //

-- Update user transaction stats
CREATE PROCEDURE UpdateUserTransactionStats(
    IN p_user_id INT,
    IN p_wallet_address VARCHAR(42),
    IN p_transaction_type ENUM('sale', 'purchase'),
    IN p_amount DECIMAL(18, 8),
    IN p_rating DECIMAL(3,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Update or insert user stats
    INSERT INTO user_transaction_stats (
        user_id, wallet_address, total_transactions,
        as_seller, as_buyer, completed_sales, completed_purchases,
        total_sales_amount, total_purchases_amount,
        average_rating, total_ratings
    ) VALUES (
        p_user_id, p_wallet_address, 1,
        IF(p_transaction_type = 'sale', 1, 0),
        IF(p_transaction_type = 'purchase', 1, 0),
        IF(p_transaction_type = 'sale', 1, 0),
        IF(p_transaction_type = 'purchase', 1, 0),
        IF(p_transaction_type = 'sale', p_amount, 0),
        IF(p_transaction_type = 'purchase', p_amount, 0),
        COALESCE(p_rating, 5.00),
        IF(p_rating IS NOT NULL, 1, 0)
    ) ON DUPLICATE KEY UPDATE
        total_transactions = total_transactions + 1,
        as_seller = as_seller + IF(p_transaction_type = 'sale', 1, 0),
        as_buyer = as_buyer + IF(p_transaction_type = 'purchase', 1, 0),
        completed_sales = completed_sales + IF(p_transaction_type = 'sale', 1, 0),
        completed_purchases = completed_purchases + IF(p_transaction_type = 'purchase', 1, 0),
        total_sales_amount = total_sales_amount + IF(p_transaction_type = 'sale', p_amount, 0),
        total_purchases_amount = total_purchases_amount + IF(p_transaction_type = 'purchase', p_amount, 0),
        average_rating = IF(p_rating IS NOT NULL, 
            (average_rating * total_ratings + p_rating) / (total_ratings + 1), 
            average_rating),
        total_ratings = total_ratings + IF(p_rating IS NOT NULL, 1, 0);

    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_accounts_search ON game_accounts(game_id, is_sold, is_in_escrow, price);
CREATE INDEX IF NOT EXISTS idx_game_accounts_featured ON game_accounts(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status_created ON escrow_transactions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type, created_at);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Marketplace database setup completed successfully!' as message;
SELECT 'Tables created:' as info;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'jubel_db' 
ORDER BY TABLE_NAME;