-- =====================================================
-- MARKETPLACE JUBEL - DATABASE VIEWS
-- =====================================================

USE jubel_db;

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