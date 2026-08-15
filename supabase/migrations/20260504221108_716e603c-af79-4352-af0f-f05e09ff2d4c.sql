ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'gemini';

ALTER TABLE public.user_api_keys
  ADD CONSTRAINT user_api_keys_provider_check
  CHECK (provider IN ('gemini', 'grok', 'openai'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_provider text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_provider_check
  CHECK (preferred_provider IS NULL OR preferred_provider IN ('gemini', 'grok', 'openai'));

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider
  ON public.user_api_keys(user_id, provider, is_active);