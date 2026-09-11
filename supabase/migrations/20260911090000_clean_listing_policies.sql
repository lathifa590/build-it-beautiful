-- Clean RLS policies for listings
DROP POLICY IF EXISTS "Users can manage their own listings" ON public.modul_store_listings;
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.modul_store_listings;
DROP POLICY IF EXISTS "Users can view and update their own listings" ON public.modul_store_listings;
CREATE POLICY "owner_insert_listings" ON public.modul_store_listings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.modul_store_profiles p WHERE p.store_id = modul_store_listings.store_id AND p.owner_user_id = auth.uid()));
CREATE POLICY "owner_manage_listings" ON public.modul_store_listings FOR ALL USING (EXISTS (SELECT 1 FROM public.modul_store_profiles p WHERE p.store_id = modul_store_listings.store_id AND p.owner_user_id = auth.uid()));
CREATE POLICY "public_view_published" ON public.modul_store_listings FOR SELECT USING (status = 'PUBLISHED' AND EXISTS (SELECT 1 FROM public.modul_store_profiles p WHERE p.store_id = modul_store_listings.store_id AND p.status = 'ACTIVE'));