/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, not null)
      - `first_name` (text)
      - `last_name` (text)
      - `username` (text, unique)
      - `location` (text)
      - `description` (text)
      - `interests` (text[])
      - `photos` (text[])
      - `physical_info` (jsonb)
      - `personal_info` (jsonb)
      - `prestations` (text)
      - `user_type` (text, not null)
      - `phone` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to read and update their own data
    - Add policy for public read access to profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  location TEXT,
  description TEXT,
  interests TEXT[],
  photos TEXT[],
  physical_info JSONB,
  personal_info JSONB,
  prestations TEXT,
  user_type TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to read all profiles (public data)
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles 
  FOR SELECT 
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();