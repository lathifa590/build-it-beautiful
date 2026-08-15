ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS prota_data jsonb;
ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS kktp_data jsonb;
ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS prosem_data jsonb;