-- Fix RLS policy for modul_store_listings
-- Issue: FOR ALL USING check fails on INSERT because store_id doesn't exist yet in DB
-- Solution: Separate INSERT policy from SELECT/UPDATE policies

-- Drop all existing policies for this table (if any)
DROP POLICY IF EXISTS ""Users can manage their own listings"" ON public.modul_store_listings;
DROP POLICY IF EXISTS ""Users can insert their own listings"" ON public.modul_store_listings;
DROP POLICY IF EXISTS ""Users can view and update their own listings"" ON public.modul_store_listings;

-- Create new INSERT policy (with CHECK)
CREATE POLICY ""Users can insert their own listings"" ON public.modul_store_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_listings.store_id 
      AND p.owner_user_id = auth.uid()
    )
  );

-- Create new SELECT/UPDATE policy (with USING)
CREATE POLICY ""Users can view and update their own listings"" ON public.modul_store_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.modul_store_profiles p
      WHERE p.store_id = modul_store_listings.store_id 
      AND p.owner_user_id = auth.uid()
    )
  );
