-- Database schema for the Trading Education Platform
-- Target RDBMS: PostgreSQL

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Educational Content table
CREATE TABLE educational_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'tutorial'
    body TEXT,
    video_url VARCHAR(255),
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Optional: link to a user who authored it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL, -- e.g., AAPL, BTCUSD
    name VARCHAR(100) NOT NULL, -- e.g., Apple Inc., Bitcoin
    asset_type VARCHAR(50) NOT NULL -- 'stock', 'crypto'
);

-- Pre-populating some assets (examples)
INSERT INTO assets (symbol, name, asset_type) VALUES
    ('AAPL', 'Apple Inc.', 'stock'),
    ('MSFT', 'Microsoft Corp.', 'stock'),
    ('GOOGL', 'Alphabet Inc. (Class A)', 'stock'),
    ('AMZN', 'Amazon.com Inc.', 'stock'),
    ('TSLA', 'Tesla Inc.', 'stock'),
    ('BTCUSD', 'Bitcoin', 'crypto'),
    ('ETHUSD', 'Ethereum', 'crypto'),
    ('ADAUSD', 'Cardano', 'crypto'),
    ('SOLUSD', 'Solana', 'crypto'),
    ('DOTUSD', 'Polkadot', 'crypto');

-- Trades table
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    order_type VARCHAR(10) NOT NULL, -- 'market_buy', 'market_sell'
    quantity DECIMAL(18, 8) NOT NULL, -- Using DECIMAL for precision with crypto
    price_at_execution DECIMAL(18, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Holdings table
CREATE TABLE portfolio_holdings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    quantity DECIMAL(18, 8) NOT NULL,
    average_purchase_price DECIMAL(18, 8) NOT NULL,
    PRIMARY KEY (user_id, asset_id) -- Composite primary key
);

-- Trigger to automatically update 'updated_at' timestamp for educational_content
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON educational_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
