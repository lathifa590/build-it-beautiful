-- Create storage bucket for letterheads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('letterheads', 'letterheads', true);

-- RLS policy: Users can upload their own letterhead
CREATE POLICY "Users can upload own letterhead"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'letterheads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Users can update their own letterhead
CREATE POLICY "Users can update own letterhead"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'letterheads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Users can delete their own letterhead
CREATE POLICY "Users can delete own letterhead"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'letterheads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy: Anyone can view letterheads (public bucket)
CREATE POLICY "Letterheads are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'letterheads');

-- Add letterhead_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS letterhead_url text DEFAULT NULL;