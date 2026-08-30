-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger function that calls the edge function
CREATE OR REPLACE FUNCTION public.trigger_process_generation_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Edge Function URL for this specific project
    v_url TEXT := 'https://jjgfpcedibgkkodydrci.supabase.co/functions/v1/process-generation-queue';
    
    -- Anon Key for this specific project
    v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2ZwY2VkaWJna2tvZHlkcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTE2NDYsImV4cCI6MjEwMjE2NzY0Nn0.5oOBZXsyVQbW0JCmrxMYR8WOZi7QYq4JcyT6zLl5r4A';
    
    v_request_id BIGINT;
BEGIN
    -- Call the edge function asynchronously using pg_net
    SELECT net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := '{}'::jsonb
    ) INTO v_request_id;
    
    -- When returning from a FOR EACH STATEMENT trigger, we return NULL
    RETURN NULL;
END;
$$;

-- Attach the trigger to the generation_queue table
-- Menggunakan FOR EACH STATEMENT agar tidak DDOS / membuat server AI crash karena terlalu banyak request bersamaan
DROP TRIGGER IF EXISTS on_generation_queue_insert ON public.generation_queue;

CREATE TRIGGER on_generation_queue_insert
    AFTER INSERT ON public.generation_queue
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_process_generation_queue();
