
-- Create stimulus-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stimulus-images', 'stimulus-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload stimulus images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stimulus-images');

-- Allow public read access
CREATE POLICY "Public can view stimulus images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stimulus-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete stimulus images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stimulus-images');
