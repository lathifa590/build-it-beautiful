-- Migration: Allow zero JP in prosem_items and robustify save_prosem_plan
-- Fixes error: violates check constraint "prosem_items_allocated_jp_check" when saving Prosem with 0 JP or pengayaan

-- 1. Relax check constraint from allocated_jp > 0 to allocated_jp >= 0
ALTER TABLE public.prosem_items DROP CONSTRAINT IF EXISTS prosem_items_allocated_jp_check;
ALTER TABLE public.prosem_items ADD CONSTRAINT prosem_items_allocated_jp_check CHECK (allocated_jp >= 0);

-- 2. Update save_prosem_plan to safely handle missing or 0 allocated_jp
CREATE OR REPLACE FUNCTION public.save_prosem_plan(
  p_workspace_id   UUID,
  p_prosem_plan_id UUID,
  p_semester       SMALLINT,
  p_content        JSONB,
  p_items          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id      UUID := auth.uid();
  v_plan_ws      UUID; v_plan_type TEXT; v_plan_sem SMALLINT;
  v_item         JSONB; v_item_id UUID; v_tp_id UUID;
  v_incoming_ids UUID[];
  v_blocked_id   UUID; v_blocked_name TEXT;
  v_inserted_ids UUID[] := '{}'; v_updated_ids UUID[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM id FROM public.workspaces WHERE id = p_workspace_id AND user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workspace not found or access denied'; END IF;
  SELECT workspace_id, type, semester INTO v_plan_ws, v_plan_type, v_plan_sem FROM public.curriculum_plans WHERE id = p_prosem_plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'curriculum_plan not found'; END IF;
  IF v_plan_ws != p_workspace_id THEN RAISE EXCEPTION 'Plan not in this workspace'; END IF;
  IF v_plan_type != 'prosem' THEN RAISE EXCEPTION 'Plan must be type prosem'; END IF;
  IF v_plan_sem != p_semester THEN RAISE EXCEPTION 'Semester mismatch'; END IF;

  SELECT ARRAY(SELECT (elem->>'id')::UUID FROM jsonb_array_elements(p_items) elem WHERE elem->>'id' IS NOT NULL AND elem->>'id' != '') INTO v_incoming_ids;

  -- PREFLIGHT: block if any removed prosem_item still has meeting_slots
  SELECT pi.id, pi.materi_pokok INTO v_blocked_id, v_blocked_name
    FROM public.prosem_items pi
    WHERE pi.prosem_plan_id = p_prosem_plan_id
      AND pi.id != ALL(COALESCE(v_incoming_ids, '{}'))
      AND EXISTS (SELECT 1 FROM public.meeting_slots ms WHERE ms.prosem_item_id = pi.id)
    LIMIT 1;
  IF v_blocked_id IS NOT NULL THEN
    RAISE EXCEPTION 'Topik "%" tidak dapat dihapus karena sudah memiliki jadwal pertemuan. Hapus atau pindahkan pertemuan terlebih dahulu.', v_blocked_name;
  END IF;

  -- All clear: update snapshot atomically
  UPDATE public.curriculum_plans SET content = p_content, updated_at = now() WHERE id = p_prosem_plan_id;

  -- Delete removed items (safe: preflight guarantees no meeting_slots)
  DELETE FROM public.prosem_items
    WHERE prosem_plan_id = p_prosem_plan_id
      AND id != ALL(COALESCE(v_incoming_ids, '{}'));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF v_item->>'id' IS NOT NULL AND v_item->>'id' != '' THEN
      v_item_id := (v_item->>'id')::UUID;
      UPDATE public.prosem_items SET 
        sequence = (v_item->>'sequence')::INTEGER, 
        materi_pokok = COALESCE(v_item->>'materi_pokok', ''), 
        allocated_jp = GREATEST(0, COALESCE((v_item->>'allocated_jp')::INTEGER, 0)), 
        tp_snapshot = COALESCE(v_item->'tp_snapshot', '[]'::jsonb), 
        updated_at = now() 
      WHERE id = v_item_id AND prosem_plan_id = p_prosem_plan_id;
      v_updated_ids := array_append(v_updated_ids, v_item_id);
    ELSE
      INSERT INTO public.prosem_items (workspace_id, prosem_plan_id, semester, sequence, materi_pokok, allocated_jp, tp_snapshot, weeks) 
      VALUES (
        p_workspace_id, 
        p_prosem_plan_id, 
        p_semester, 
        (v_item->>'sequence')::INTEGER, 
        COALESCE(v_item->>'materi_pokok', ''), 
        GREATEST(0, COALESCE((v_item->>'allocated_jp')::INTEGER, 0)), 
        COALESCE(v_item->'tp_snapshot', '[]'::jsonb), 
        '{}'::jsonb
      ) RETURNING id INTO v_item_id;
      v_inserted_ids := array_append(v_inserted_ids, v_item_id);
    END IF;
    DELETE FROM public.prosem_item_tp_links WHERE prosem_item_id = v_item_id;
    IF v_item->'tp_ids' IS NOT NULL THEN
      FOR v_tp_id IN SELECT (jsonb_array_elements_text(v_item->'tp_ids'))::UUID LOOP
        INSERT INTO public.prosem_item_tp_links (prosem_item_id, tp_id) VALUES (v_item_id, v_tp_id) ON CONFLICT (prosem_item_id, tp_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('inserted', to_jsonb(v_inserted_ids), 'updated', to_jsonb(v_updated_ids));
END;
$function$;
