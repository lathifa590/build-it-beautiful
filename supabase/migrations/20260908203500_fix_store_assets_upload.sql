-- Allow anyone (including anon users for guest checkout) to upload payment proofs
CREATE POLICY "Allow anyone to upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'modul_store_assets' AND name LIKE 'payments/%' );
