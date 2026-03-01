/*
  # Wallet and Transaction System

  1. New Tables
    - wallets: Stores user wallet balances
    - transactions: Records all financial transactions
    
  2. Security
    - Enables RLS on both tables
    - Creates policies for secure access
    
  3. Functions
    - Automatic wallet balance updates
    - Transaction processing
*/

-- Create wallets table if it doesn't exist
CREATETABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT positive_balance CHECK (balance >= 0),
  UNIQUE(user_id)
);

-- Create transactions table if it doesn't exist
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

-- Create policies for wallets - using DO blocks to check if they exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can view their own wallet'
  ) THEN
    CREATE POLICY "Users can view their own wallet"
      ON wallets
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can insert their own wallet'
  ) THEN
    CREATE POLICY "Users can insert their own wallet"
      ON wallets
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'wallets' AND policyname = 'Users can update their own wallet'
  ) THEN
    CREATE POLICY "Users can update their own wallet"
      ON wallets
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create policies for transactions - using DO blocks to check if they exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions'
  ) THEN
    CREATE POLICY "Users can view their own transactions"
      ON transactions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'transactions' AND policyname = 'Users can insert their own transactions'
  ) THEN
    CREATE POLICY "Users can insert their own transactions"
      ON transactions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create function to update the updated_at column for wallets
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
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

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS update_wallet_on_transaction ON transactions;
CREATE TRIGGER update_wallet_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance_on_transaction();