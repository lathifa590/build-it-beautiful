-- Add pollinations_api_key column for user-specific API key storage
ALTER TABLE public.profiles 
ADD COLUMN pollinations_api_key text;