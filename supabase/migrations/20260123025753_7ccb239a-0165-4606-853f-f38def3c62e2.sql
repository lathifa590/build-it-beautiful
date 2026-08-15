-- Drop the problematic policy that requires JWT
DROP POLICY IF EXISTS "Anyone can check email existence" ON public.allowed_customers;

-- Create a public read policy for email checking (used by edge function with service role)
-- No additional policy needed since edge function uses service role key