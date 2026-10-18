-- Migration: Add group_id and group_title to meeting_slots for Multi-Pertemuan support in Workspace
-- Date: 18 Oktober 2026

-- 1. Alter meeting_slots table
ALTER TABLE public.meeting_slots 
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS group_title TEXT;

CREATE INDEX IF NOT EXISTS idx_meeting_slots_group ON public.meeting_slots(group_id) WHERE group_id IS NOT NULL;

-- 2. Update save_meeting_slots RPC to persist group_id and group_title
CREATE OR REPLACE FUNCTION public.save_meeting_slots(
  p_workspace_id   UUID,
  p_prosem_item_id UUID,
  p_slots          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_item_ws      UUID; v_slot JSONB; v_slot_id UUID;
  v_incoming_ids UUID[];
  v_blocked_id   UUID; v_blocked_seq INTEGER;
  v_inserted_ids UUID[] := '{}'; v_updated_ids UUID[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT pi.workspace_id INTO v_item_ws FROM public.prosem_items pi JOIN public.workspaces w ON w.id = pi.workspace_id WHERE pi.id = p_prosem_item_id AND w.user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'prosem_item not found or access denied'; END IF;
  IF v_item_ws != p_workspace_id THEN RAISE EXCEPTION 'prosem_item not in this workspace'; END IF;

  SELECT ARRAY(SELECT (elem->>'id')::UUID FROM jsonb_array_elements(p_slots) elem WHERE elem->>'id' IS NOT NULL AND elem->>'id' != '') INTO v_incoming_ids;

  -- PREFLIGHT: block if any removed slot has document links
  SELECT ms.id, ms.sequence INTO v_blocked_id, v_blocked_seq
    FROM public.meeting_slots ms
    WHERE ms.prosem_item_id = p_prosem_item_id
      AND ms.id != ALL(COALESCE(v_incoming_ids, '{}'))
      AND EXISTS (SELECT 1 FROM public.meeting_document_links dl WHERE dl.meeting_slot_id = ms.id)
    LIMIT 1;
  IF v_blocked_id IS NOT NULL THEN
    RAISE EXCEPTION 'Pertemuan % tidak dapat dihapus karena sudah memiliki dokumen terhubung. Hapus dokumen pertemuan tersebut terlebih dahulu.', v_blocked_seq;
  END IF;

  -- All clear: delete removed slots
  DELETE FROM public.meeting_slots WHERE prosem_item_id = p_prosem_item_id AND id != ALL(COALESCE(v_incoming_ids, '{}'));

  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
    IF v_slot->>'id' IS NOT NULL AND v_slot->>'id' != '' THEN
      v_slot_id := (v_slot->>'id')::UUID;
      UPDATE public.meeting_slots 
      SET sequence = (v_slot->>'sequence')::INTEGER, 
          title = COALESCE(v_slot->>'title', title), 
          planned_jp = (v_slot->>'planned_jp')::INTEGER, 
          week_number = NULLIF(v_slot->>'week_number', '')::INTEGER, 
          planned_date = NULLIF(v_slot->>'planned_date', '')::DATE,
          group_id = NULLIF(v_slot->>'group_id', '')::UUID,
          group_title = NULLIF(v_slot->>'group_title', ''),
          updated_at = now() 
      WHERE id = v_slot_id AND prosem_item_id = p_prosem_item_id;
      v_updated_ids := array_append(v_updated_ids, v_slot_id);
    ELSE
      INSERT INTO public.meeting_slots (
        workspace_id, prosem_item_id, sequence, title, planned_jp, week_number, planned_date, group_id, group_title
      ) VALUES (
        p_workspace_id, 
        p_prosem_item_id, 
        (v_slot->>'sequence')::INTEGER, 
        COALESCE(v_slot->>'title', 'Pertemuan ' || (v_slot->>'sequence')), 
        (v_slot->>'planned_jp')::INTEGER, 
        NULLIF(v_slot->>'week_number', '')::INTEGER, 
        NULLIF(v_slot->>'planned_date', '')::DATE,
        NULLIF(v_slot->>'group_id', '')::UUID,
        NULLIF(v_slot->>'group_title', '')
      ) RETURNING id INTO v_slot_id;
      v_inserted_ids := array_append(v_inserted_ids, v_slot_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('inserted', to_jsonb(v_inserted_ids), 'updated', to_jsonb(v_updated_ids));
END;
$$;
REVOKE ALL ON FUNCTION public.save_meeting_slots(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_meeting_slots(UUID, UUID, JSONB) TO authenticated;

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
