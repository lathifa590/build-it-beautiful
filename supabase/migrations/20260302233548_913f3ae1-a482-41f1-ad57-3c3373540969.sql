
-- Create user_api_keys table
CREATE TABLE public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_key text NOT NULL,
  label text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON public.user_api_keys
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Migrate existing gemini_api_key from profiles to user_api_keys
INSERT INTO public.user_api_keys (user_id, api_key, label)
SELECT user_id, gemini_api_key, 'Migrated from Settings'
FROM public.profiles
WHERE gemini_api_key IS NOT NULL AND gemini_api_key != '';
