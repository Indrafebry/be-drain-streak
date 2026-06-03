-- Tabel Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Gamification Profiles
CREATE TABLE gamification_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    xp_total INT DEFAULT 0,
    level INT DEFAULT 1,
    drain_coins INT DEFAULT 0,
    streak_freeze_count INT DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE
);

-- Tabel Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    note VARCHAR(255),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount_limit DECIMAL(12,2) NOT NULL,
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT
);

-- Tabel Daily Missions
CREATE TABLE daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('any_tx', 'food_tx', 'total_amount')),
    target INT NOT NULL,
    current INT DEFAULT 0,
    xp_reward INT NOT NULL,
    coin_reward INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE
);

-- Insert Default Categories (Contoh)
INSERT INTO categories (name, icon, color, is_default, user_id) VALUES
('Makanan', '🍔', '#FF5733', true, NULL),
('Transportasi', '🚗', '#3357FF', true, NULL),
('Gaji', '💰', '#33FF57', true, NULL);
