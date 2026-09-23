-- Fix autogenerate background queue: dedup, atomic claim, completion, cron fallback
-- ponytail: minimal safety net; scale to dedicated worker / BullMQ when >100 jobs/min

-- 1. Dedup: cegah enqueue ganda untuk dokumen yang masih pending/processing
CREATE UNIQUE INDEX IF NOT EXISTS uq_generation_queue_pending
ON public.generation_queue (workspace_id, pertemuan_id, jenis_dokumen)
WHERE status IN ('pending','processing');

-- 2. Claim atomik: ambil N job pending tertua dan tandai processing dalam 1 statement
CREATE OR REPLACE FUNCTION public.claim_generation_jobs(p_limit INT DEFAULT 3)
RETURNS SETOF public.generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id FROM public.generation_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.generation_queue g
    SET status = 'processing', updated_at = now()
    FROM claimed c
    WHERE g.id = c.id
    RETURNING g.*
  )
  SELECT * FROM updated ORDER BY created_at ASC;
END;
$func$;
GRANT EXECUTE ON FUNCTION public.claim_generation_jobs(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_generation_jobs(INT) TO authenticated;

-- 3. Fix append_generation_result
CREATE OR REPLACE FUNCTION public.append_generation_result(
    p_workspace_id UUID,
    p_pertemuan_id TEXT,
    p_jenis_dokumen TEXT,
    p_generated_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $inner$
DECLARE
    v_current_result JSONB;
    v_pertemuan_array JSONB;
    v_pertemuan_obj JSONB;
    v_index INT;
    v_should_complete BOOLEAN;
BEGIN
    SELECT generation_result INTO v_current_result FROM public.workspaces WHERE id = p_workspace_id FOR UPDATE;
    IF v_current_result IS NULL OR NOT (v_current_result ? 'version') THEN
        v_current_result := '{"version": 2, "pertemuan": []}'::jsonb;
    END IF;
    v_pertemuan_array := COALESCE(v_current_result->'pertemuan', '[]'::jsonb);
    SELECT (ordinality - 1)::INT INTO v_index FROM jsonb_array_elements(v_pertemuan_array) WITH ORDINALITY WHERE value->>'id' = p_pertemuan_id LIMIT 1;
    IF v_index IS NULL THEN
        v_pertemuan_obj := jsonb_build_object('id', p_pertemuan_id,'status', jsonb_build_object(p_jenis_dokumen, 'ok'),'dokumen', jsonb_build_object(p_jenis_dokumen, p_generated_data));
        v_current_result := jsonb_set(v_current_result,'{pertemuan}',v_pertemuan_array || v_pertemuan_obj);
        v_index := jsonb_array_length(v_pertemuan_array);
    ELSE
        IF NOT (v_current_result->'pertemuan'->v_index ? 'status') THEN v_current_result := jsonb_set(v_current_result,ARRAY['pertemuan', v_index::TEXT, 'status'],'{}'::jsonb,true); END IF;
        IF NOT (v_current_result->'pertemuan'->v_index ? 'dokumen') THEN v_current_result := jsonb_set(v_current_result,ARRAY['pertemuan', v_index::TEXT, 'dokumen'],'{}'::jsonb,true); END IF;
        v_current_result := jsonb_set(v_current_result,ARRAY['pertemuan', v_index::TEXT, 'status', p_jenis_dokumen],'"ok"'::jsonb,true);
        v_current_result := jsonb_set(v_current_result,ARRAY['pertemuan', v_index::TEXT, 'dokumen', p_jenis_dokumen],p_generated_data,true);
    END IF;
    v_should_complete :=
        (v_current_result->'pertemuan'->v_index->'status'->>'modul' = 'ok')
        AND (COALESCE((v_current_result->'pertemuan'->v_index->'pilihanDokumen'->>'lkpd')::BOOLEAN, false) = false OR v_current_result->'pertemuan'->v_index->'status'->>'lkpd' = 'ok')
        AND (COALESCE((v_current_result->'pertemuan'->v_index->'pilihanDokumen'->>'asesmen')::BOOLEAN, false) = false OR v_current_result->'pertemuan'->v_index->'status'->>'asesmen' = 'ok')
        AND (COALESCE((v_current_result->'pertemuan'->v_index->'pilihanDokumen'->>'materi')::BOOLEAN, false) = false OR v_current_result->'pertemuan'->v_index->'status'->>'materi' = 'ok')
        AND (COALESCE((v_current_result->'pertemuan'->v_index->'pilihanDokumen'->>'soal')::BOOLEAN, false) = false OR v_current_result->'pertemuan'->v_index->'status'->>'soal' = 'ok')
        AND (COALESCE((v_current_result->'pertemuan'->v_index->'pilihanDokumen'->>'tindakLanjut')::BOOLEAN, false) = false OR v_current_result->'pertemuan'->v_index->'status'->>'tindakLanjut' = 'ok');
    IF v_should_complete THEN
        BEGIN UPDATE public.meeting_slots SET status = 'completed' WHERE id = p_pertemuan_id::UUID;
        EXCEPTION WHEN invalid_text_representation THEN UPDATE public.meeting_slots SET status = 'completed' WHERE id::text = p_pertemuan_id; END;
    END IF;
    UPDATE public.workspaces SET generation_result = v_current_result WHERE id = p_workspace_id;
END;
$inner$;

-- 4. Cron fallback tiap menit
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
DO $$ BEGIN PERFORM cron.unschedule('process-generation-queue-poll'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('process-generation-queue-poll','* * * * *',$$ SELECT net.http_post(url:='https://jjgfpcedibgkkodydrci.supabase.co/functions/v1/process-generation-queue',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2ZwY2VkaWJna2tvZHlkcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTE2NDYsImV4cCI6MjEwMjE2NzY0Nn0.5oOBZXsyVQbW0JCmrxMYR8WOZi7QYq4JcyT6zLl5r4A'),body:='{}'::jsonb); $$);

-- 5. Reclaim stuck processing
CREATE OR REPLACE FUNCTION public.reclaim_stuck_generation_jobs() RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $reclaim$ DECLARE v_count INT; BEGIN WITH stuck AS (SELECT id FROM public.generation_queue WHERE status='processing' AND updated_at < now() - interval '10 minutes' LIMIT 20 FOR UPDATE SKIP LOCKED) UPDATE public.generation_queue g SET status='pending', updated_at=now() FROM stuck s WHERE g.id=s.id; GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count; END; $reclaim$;
DO $$ BEGIN PERFORM cron.unschedule('reclaim-stuck-generation-jobs'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('reclaim-stuck-generation-jobs','*/5 * * * *',$$ SELECT public.reclaim_stuck_generation_jobs(); $$);
