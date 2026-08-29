-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('modul_store_assets', 'modul_store_assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('modul_store_files', 'modul_store_files', false) ON CONFLICT DO NOTHING;

-- 2. Setup RLS for modul_store_assets (Public)
CREATE POLICY "Public Read Assets" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'modul_store_assets' );

CREATE POLICY "Users can upload their own assets" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'modul_store_assets' AND auth.uid() = owner );

CREATE POLICY "Users can update their own assets" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'modul_store_assets' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own assets" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'modul_store_assets' AND auth.uid() = owner );

-- 3. Setup RLS for modul_store_files (Private)
CREATE POLICY "Sellers can manage their files" 
ON storage.objects FOR ALL 
USING ( bucket_id = 'modul_store_files' AND auth.uid() = owner );

-- Buyers can download files if they have a PAID order for the listing
-- We assume the file path convention is: {listing_id}/{filename}
CREATE POLICY "Buyers can download files" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'modul_store_files' AND 
  EXISTS (
    SELECT 1 FROM public.modul_store_orders o
    WHERE o.buyer_id = auth.uid() 
      AND o.status = 'PAID'
      AND (o.listing_id)::text = split_part(name, '/', 1)
  )
);

-- 4. RPC for safe metric increment
CREATE OR REPLACE FUNCTION increment_store_metric(p_store_id UUID, p_listing_id UUID, p_metric_type TEXT)
RETURNS void AS $$
BEGIN
  -- Insert or update metrics row atomically
  IF p_metric_type = 'views' THEN
    INSERT INTO public.modul_store_metrics (store_id, listing_id, views, clicks)
    VALUES (p_store_id, COALESCE(p_listing_id, p_store_id), 1, 0)
    ON CONFLICT (store_id, listing_id) DO UPDATE SET views = modul_store_metrics.views + 1, updated_at = now();
  ELSIF p_metric_type = 'clicks' THEN
    INSERT INTO public.modul_store_metrics (store_id, listing_id, views, clicks)
    VALUES (p_store_id, COALESCE(p_listing_id, p_store_id), 0, 1)
    ON CONFLICT (store_id, listing_id) DO UPDATE SET clicks = modul_store_metrics.clicks + 1, updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
