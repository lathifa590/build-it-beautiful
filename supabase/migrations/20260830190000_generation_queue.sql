-- Create generation_queue table
CREATE TABLE IF NOT EXISTS public.generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    pertemuan_id TEXT NOT NULL,
    jenis_dokumen TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.generation_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own queues via workspace linkage
CREATE POLICY "Users can view generation_queue for their workspaces"
    ON public.generation_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id AND w.user_id = auth.uid()
        )
    );

-- Allow users to insert queue for their workspaces
CREATE POLICY "Users can insert generation_queue for their workspaces"
    ON public.generation_queue FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id AND w.user_id = auth.uid()
        )
    );

-- Allow users to update their own queue (e.g., to cancel)
CREATE POLICY "Users can update generation_queue for their workspaces"
    ON public.generation_queue FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id AND w.user_id = auth.uid()
        )
    );

-- Allow users to delete their own queue
CREATE POLICY "Users can delete generation_queue for their workspaces"
    ON public.generation_queue FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id AND w.user_id = auth.uid()
        )
    );

-- Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_generation_queue_updated_at
BEFORE UPDATE ON public.generation_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'generation_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_queue;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
