-- Fix: Allow users to read their own subscription status by user_id
-- Previously, non-admin users had no way to read their own row by user_id.
-- This caused workspace to always appear locked even for PRO users.

CREATE POLICY "Users can view their own customer record by user_id"
ON public.allowed_customers FOR SELECT
USING (auth.uid() = user_id);
