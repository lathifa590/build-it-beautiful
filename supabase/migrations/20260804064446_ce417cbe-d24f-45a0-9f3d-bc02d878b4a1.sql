ALTER TABLE public.content_history
  ADD COLUMN IF NOT EXISTS generation_result_v2 jsonb,
  ADD COLUMN IF NOT EXISTS content_schema_version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.content_history.generation_result_v2 IS
  'GenerationResultV2 lengkap (modulPreface, pertemuan[], dokumen per pertemuan, dokumenGlobal/Submateri). NULL untuk history legacy.';
COMMENT ON COLUMN public.content_history.content_schema_version IS
  '1 = history legacy (kolom *_data), 2 = history Dokumen per Pertemuan V2 (generation_result_v2).';

CREATE INDEX IF NOT EXISTS content_history_schema_version_idx
  ON public.content_history (user_id, content_schema_version);