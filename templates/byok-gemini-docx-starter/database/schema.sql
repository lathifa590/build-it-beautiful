-- ==============================================================================
-- BYOK GEMINI POOL - SUPABASE DATABASE MIGRATION
-- Table: user_api_keys
-- Features: Multi-key storage, active toggle, labels, provider tagging, Row Level Security
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gemini' CHECK (provider IN ('gemini', 'openai', 'anthropic', 'openrouter')),
  api_key TEXT NOT NULL,
  label TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists then recreate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_api_keys' 
      AND policyname = 'Users manage own api keys'
  ) THEN
    CREATE POLICY "Users manage own api keys" ON public.user_api_keys
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Fast index for fetching active keys per user & provider
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider
  ON public.user_api_keys(user_id, provider, is_active);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_api_keys_updated_at ON public.user_api_keys;
CREATE TRIGGER tr_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_api_keys_updated_at();
