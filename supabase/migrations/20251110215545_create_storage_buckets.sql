/*
  # Create storage buckets for file uploads

  1. Storage Buckets
    - `posts` - For post images and media
    - `profiles` - For profile photos
    - `messages` - For message attachments

  2. Security
    - Enable RLS on storage buckets
    - Add policies for authenticated users to upload/view their own files
    - Add public read access for post images
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('posts', 'posts', true),
  ('profiles', 'profiles', true),
  ('messages', 'messages', false)
ON CONFLICT (id) DO NOTHING;

-- Posts bucket policies
CREATE POLICY "Authenticated users can upload posts images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view posts images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'posts');

CREATE POLICY "Users can update own posts images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own posts images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Profiles bucket policies
CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

CREATE POLICY "Users can update own profile images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Messages bucket policies
CREATE POLICY "Authenticated users can upload message attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own message attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own message attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);
