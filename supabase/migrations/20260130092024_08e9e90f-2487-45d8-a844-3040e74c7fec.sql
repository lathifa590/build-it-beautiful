-- Create table for tracking content generation
CREATE TABLE public.generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.generation_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Users can view their own logs
CREATE POLICY "Users can view own logs" ON public.generation_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_generation_logs_created_at ON public.generation_logs(created_at DESC);
CREATE INDEX idx_generation_logs_user_id ON public.generation_logs(user_id);
CREATE INDEX idx_generation_logs_content_type ON public.generation_logs(content_type);