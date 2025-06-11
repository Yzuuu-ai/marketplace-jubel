-- SQL untuk membuat tabel-tabel yang diperlukan untuk Profile.jsx
-- Database: jubel_db

-- Tabel untuk menyimpan profil wallet users (untuk wallet-based accounts)
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

-- Tabel untuk menyimpan hubungan antara email users dan wallet address
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

-- Tabel untuk menyimpan statistik transaksi user
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

-- Tabel untuk menyimpan aktivitas user (untuk riwayat aktivitas)
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

-- Update tabel users untuk menambahkan kolom wallet_address jika belum ada
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) NULL,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_type ENUM('email', 'wallet') DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Tambahkan index untuk wallet_address di tabel users
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Insert data games default jika belum ada
INSERT IGNORE INTO games (id, name, description, icon, created_at) VALUES
(1, 'Mobile Legends', 'MOBA game populer untuk mobile', '🎮', NOW()),
(2, 'Free Fire', 'Battle royale game', '🔥', NOW()),
(3, 'PUBG Mobile', 'PlayerUnknown\'s Battlegrounds Mobile', '🎯', NOW()),
(4, 'Genshin Impact', 'Open-world action RPG', '⚔️', NOW()),
(5, 'Call of Duty Mobile', 'First-person shooter mobile', '🔫', NOW()),
(6, 'Valorant', 'Tactical first-person shooter', '💥', NOW()),
(7, 'League of Legends', 'Multiplayer online battle arena', '🏆', NOW()),
(8, 'Dota 2', 'Multiplayer online battle arena', '⚡', NOW());

-- Trigger untuk update user_transaction_stats ketika ada transaksi baru
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_user_stats_after_transaction
AFTER INSERT ON escrow_transactions
FOR EACH ROW
BEGIN
    -- Update stats untuk seller
    INSERT INTO user_transaction_stats (wallet_address, total_transactions, as_seller)
    VALUES (NEW.seller_wallet, 1, 1)
    ON DUPLICATE KEY UPDATE
        total_transactions = total_transactions + 1,
        as_seller = as_seller + 1;
    
    -- Update stats untuk buyer
    INSERT INTO user_transaction_stats (wallet_address, total_transactions, as_buyer)
    VALUES (NEW.buyer_wallet, 1, 1)
    ON DUPLICATE KEY UPDATE
        total_transactions = total_transactions + 1,
        as_buyer = as_buyer + 1;
END//

CREATE TRIGGER IF NOT EXISTS update_user_stats_after_transaction_complete
AFTER UPDATE ON escrow_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update completed sales untuk seller
        UPDATE user_transaction_stats 
        SET completed_sales = completed_sales + 1,
            total_sales_amount = total_sales_amount + NEW.amount
        WHERE wallet_address = NEW.seller_wallet;
        
        -- Update completed purchases untuk buyer
        UPDATE user_transaction_stats 
        SET completed_purchases = completed_purchases + 1,
            total_purchases_amount = total_purchases_amount + NEW.amount
        WHERE wallet_address = NEW.buyer_wallet;
    END IF;
END//

DELIMITER ;

-- View untuk mendapatkan profil lengkap user
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
    uts.total_transactions,
    uts.as_seller,
    uts.as_buyer,
    uts.completed_sales,
    uts.completed_purchases,
    uts.total_sales_amount,
    uts.total_purchases_amount
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = TRUE
LEFT JOIN wallet_profiles wp ON uw.wallet_address = wp.wallet_address
LEFT JOIN user_transaction_stats uts ON (u.id = uts.user_id OR uw.wallet_address = uts.wallet_address);