CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to allow for re-running the migration
DROP TABLE IF EXISTS reward_coins CASCADE;
DROP TABLE IF EXISTS customer_wallets CASCADE;
DROP TABLE IF EXISTS recently_viewed CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    gender TEXT,
    date_of_birth DATE,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profiles: authenticated users can view their own profile
CREATE POLICY "Authenticated users can view their own profile" ON profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy for profiles: authenticated users can update their own profile
CREATE POLICY "Authenticated users can update their own profile" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create customer_addresses table
CREATE TABLE customer_addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    phone TEXT NOT NULL
);

-- Enable Row Level Security for customer_addresses table
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policy for customer_addresses: authenticated users can view their own addresses
CREATE POLICY "Authenticated users can view their own addresses" ON customer_addresses
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy for customer_addresses: authenticated users can insert their own addresses
CREATE POLICY "Authenticated users can insert their own addresses" ON customer_addresses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy for customer_addresses: authenticated users can update their own addresses
CREATE POLICY "Authenticated users can update their own addresses" ON customer_addresses
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for customer_addresses: authenticated users can delete their own addresses
CREATE POLICY "Authenticated users can delete their own addresses" ON customer_addresses
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create wishlists table
CREATE TABLE wishlists (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    product_id UUID,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Enable Row Level Security for wishlists table
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Policy for wishlists: authenticated users can view their own wishlists
CREATE POLICY "Authenticated users can view their own wishlists" ON wishlists
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy for wishlists: authenticated users can insert into their own wishlists
CREATE POLICY "Authenticated users can insert into their own wishlists" ON wishlists
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy for wishlists: authenticated users can delete from their own wishlists
CREATE POLICY "Authenticated users can delete from their own wishlists" ON wishlists
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create recently_viewed table
CREATE TABLE recently_viewed (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    product_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Enable Row Level Security for recently_viewed table
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Policy for recently_viewed: authenticated users can view their own recently viewed products
CREATE POLICY "Authenticated users can view their own recently viewed products" ON recently_viewed
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy for recently_viewed: authenticated users can insert into their own recently viewed products
CREATE POLICY "Authenticated users can insert into their own recently viewed products" ON recently_viewed
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy for recently_viewed: authenticated users can delete from their own recently viewed products
CREATE POLICY "Authenticated users can delete from their own recently viewed products" ON recently_viewed
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create customer_wallets table
CREATE TABLE customer_wallets (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    balance NUMERIC(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD'
);

-- Enable Row Level Security for customer_wallets table
ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;

-- Policy for customer_wallets: authenticated users can view their own wallet
CREATE POLICY "Authenticated users can view their own wallet" ON customer_wallets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy for customer_wallets: authenticated users can update their own wallet (e.g., balance changes)
CREATE POLICY "Authenticated users can update their own wallet" ON customer_wallets
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create reward_coins table
CREATE TABLE reward_coins (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for reward_coins table
ALTER TABLE reward_coins ENABLE ROW LEVEL SECURITY;

-- Policy for reward_coins: authenticated users can view their own reward coins
CREATE POLICY "Authenticated users can view their own reward coins" ON reward_coins
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy for reward_coins: authenticated users can update their own reward coins
CREATE POLICY "Authenticated users can update their own reward coins" ON reward_coins
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
