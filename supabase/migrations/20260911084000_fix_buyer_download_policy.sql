
-- Fix buyer_id bug: column does not exist in modul_store_orders
DROP POLICY IF EXISTS "Buyers can download files" ON storage.objects;

CREATE POLICY "Authenticated users can download purchased files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'modul_store_files'
  AND EXISTS (
    SELECT 1 FROM public.modul_store_orders o
    WHERE o.status = 'PAID'
    AND (o.listing_id)::text = split_part(name, '/', 1)
  )
);
