/*
  # Create wallet and transactions tables

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `balance` (decimal, not null, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `type` (text, not null) - 'credit' or 'debit'
      - `amount` (decimal, not null)
      - `description` (text, not null)
      - `method` (text) - 'card', 'bank', 'paypal', 'wallet'
      - `status` (text, not null) - 'pending', 'completed', 'failed', 'cancelled'
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to access their own wallet and transactions
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT positive_balance CHECK (balance >= 0),
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  method TEXT CHECK (method IN ('card', 'bank', 'paypal', 'wallet')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON wallets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update the updated_at column for wallets
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column for wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallets_updated_at();

-- Create function to update wallet balance when a transaction is completed
CREATE OR REPLACE FUNCTION update_wallet_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed transactions
  IF NEW.status = 'completed' THEN
    -- Check if wallet exists
    IF EXISTS (SELECT 1 FROM wallets WHERE user_id = NEW.user_id) THEN
      -- Update wallet balance
      IF NEW.type = 'credit' THEN
        UPDATE wallets SET balance = balance + NEW.amount WHERE user_id = NEW.user_id;
      ELSIF NEW.type = 'debit' THEN
        -- Ensure there are sufficient funds
        IF (SELECT balance FROM wallets WHERE user_id = NEW.user_id) >= NEW.amount THEN
          UPDATE wallets SET balance = balance - NEW.amount WHERE user_id = NEW.user_id;
        ELSE
          RAISE EXCEPTION 'Insufficient funds in wallet';
        END IF;
      END IF;
    ELSE
      -- Create wallet if it doesn't exist (for credit transactions)
      IF NEW.type = 'credit' THEN
        INSERT INTO wallets (user_id, balance) VALUES (NEW.user_id, NEW.amount);
      ELSE
        RAISE EXCEPTION 'Wallet does not exist for user';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update wallet balance when a transaction is completed
CREATE TRIGGER update_wallet_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction();