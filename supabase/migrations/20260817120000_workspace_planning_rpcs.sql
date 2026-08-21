-- Migration: Workspace Planning RPCs (Final)
-- save_tp_plan      : preflight validation + atomic snapshot + UPSERT/DELETE tp_items
-- save_prosem_plan  : preflight validation + atomic snapshot + UPSERT/DELETE prosem_items + tp_links
-- save_meeting_slots: preflight validation + UPSERT/DELETE meeting_slots per prosem_item
-- upsert_curriculum_plan: idempotent create-or-get plan

-- RPC 1: save_tp_plan
CREATE OR REPLACE FUNCTION public.save_tp_plan(
  p_workspace_id UUID,
  p_tp_plan_id   UUID,
  p_content      JSONB,
  p_items        JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_plan_ws      UUID;
  v_plan_type    TEXT;
  v_item         JSONB;
  v_item_id      UUID;
  v_incoming_ids UUID[];
  v_blocked_tp   UUID;
  v_blocked_desc TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM id FROM public.workspaces WHERE id = p_workspace_id AND user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workspace not found or access denied'; END IF;
  SELECT workspace_id, type INTO v_plan_ws, v_plan_type FROM public.curriculum_plans WHERE id = p_tp_plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'curriculum_plan not found'; END IF;
  IF v_plan_ws != p_workspace_id THEN RAISE EXCEPTION 'curriculum_plan does not belong to this workspace'; END IF;
  IF v_plan_type != 'tp' THEN RAISE EXCEPTION 'curriculum_plan must be of type tp'; END IF;

  SELECT ARRAY(SELECT (elem->>'id')::UUID FROM jsonb_array_elements(p_items) elem WHERE elem->>'id' IS NOT NULL AND elem->>'id' != '') INTO v_incoming_ids;

  -- PREFLIGHT: block if any removed TP is still linked to a prosem_item
  SELECT ti.id, ti.description INTO v_blocked_tp, v_blocked_desc
    FROM public.tp_items ti
    WHERE ti.tp_plan_id = p_tp_plan_id
      AND ti.id != ALL(COALESCE(v_incoming_ids, '{}'))
      AND EXISTS (SELECT 1 FROM public.prosem_item_tp_links l WHERE l.tp_id = ti.id)
    LIMIT 1;
  IF v_blocked_tp IS NOT NULL THEN
    RAISE EXCEPTION 'TP "%" tidak dapat dihapus karena masih digunakan dalam Program Semester. Hapus pemetaan TP tersebut dari Prosem terlebih dahulu.', v_blocked_desc;
  END IF;

  -- All clear: update snapshot atomically with items
  UPDATE public.curriculum_plans SET content = p_content, updated_at = now() WHERE id = p_tp_plan_id;

  DELETE FROM public.tp_items
    WHERE tp_plan_id = p_tp_plan_id
      AND id != ALL(COALESCE(v_incoming_ids, '{}'));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF v_item->>'id' IS NOT NULL AND v_item->>'id' != '' THEN
      UPDATE public.tp_items SET code = v_item->>'code', sequence = (v_item->>'sequence')::INTEGER, description = v_item->>'description', updated_at = now() WHERE id = (v_item->>'id')::UUID AND tp_plan_id = p_tp_plan_id;
    ELSE
      INSERT INTO public.tp_items (workspace_id, tp_plan_id, code, sequence, description) VALUES (p_workspace_id, p_tp_plan_id, v_item->>'code', (v_item->>'sequence')::INTEGER, v_item->>'description');
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.save_tp_plan(UUID, UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_tp_plan(UUID, UUID, JSONB, JSONB) TO authenticated;


-- RPC 2: save_prosem_plan (no meeting_slots, preflight blocks deletion if slots exist)
CREATE OR REPLACE FUNCTION public.save_prosem_plan(
  p_workspace_id   UUID,
  p_prosem_plan_id UUID,
  p_semester       SMALLINT,
  p_content        JSONB,
  p_items          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      UPDATE public.prosem_items SET sequence = (v_item->>'sequence')::INTEGER, materi_pokok = v_item->>'materi_pokok', allocated_jp = (v_item->>'allocated_jp')::INTEGER, tp_snapshot = COALESCE(v_item->'tp_snapshot', '[]'::jsonb), updated_at = now() WHERE id = v_item_id AND prosem_plan_id = p_prosem_plan_id;
      v_updated_ids := array_append(v_updated_ids, v_item_id);
    ELSE
      INSERT INTO public.prosem_items (workspace_id, prosem_plan_id, semester, sequence, materi_pokok, allocated_jp, tp_snapshot, weeks) VALUES (p_workspace_id, p_prosem_plan_id, p_semester, (v_item->>'sequence')::INTEGER, v_item->>'materi_pokok', (v_item->>'allocated_jp')::INTEGER, COALESCE(v_item->'tp_snapshot', '[]'::jsonb), '{}'::jsonb) RETURNING id INTO v_item_id;
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
$$;
REVOKE ALL ON FUNCTION public.save_prosem_plan(UUID, UUID, SMALLINT, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_prosem_plan(UUID, UUID, SMALLINT, JSONB, JSONB) TO authenticated;


-- RPC 3: save_meeting_slots (scoped per prosem_item, blocks deletion if doc-linked)
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
      UPDATE public.meeting_slots SET sequence = (v_slot->>'sequence')::INTEGER, title = COALESCE(v_slot->>'title', title), planned_jp = (v_slot->>'planned_jp')::INTEGER, week_number = NULLIF(v_slot->>'week_number', '')::INTEGER, planned_date = NULLIF(v_slot->>'planned_date', '')::DATE, updated_at = now() WHERE id = v_slot_id AND prosem_item_id = p_prosem_item_id;
      v_updated_ids := array_append(v_updated_ids, v_slot_id);
    ELSE
      INSERT INTO public.meeting_slots (workspace_id, prosem_item_id, sequence, title, planned_jp, week_number, planned_date) VALUES (p_workspace_id, p_prosem_item_id, (v_slot->>'sequence')::INTEGER, COALESCE(v_slot->>'title', 'Pertemuan ' || (v_slot->>'sequence')), (v_slot->>'planned_jp')::INTEGER, NULLIF(v_slot->>'week_number', '')::INTEGER, NULLIF(v_slot->>'planned_date', '')::DATE) RETURNING id INTO v_slot_id;
      v_inserted_ids := array_append(v_inserted_ids, v_slot_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('inserted', to_jsonb(v_inserted_ids), 'updated', to_jsonb(v_updated_ids));
END;
$$;
REVOKE ALL ON FUNCTION public.save_meeting_slots(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_meeting_slots(UUID, UUID, JSONB) TO authenticated;


-- RPC 4: upsert_curriculum_plan (idempotent, does NOT update content)
CREATE OR REPLACE FUNCTION public.upsert_curriculum_plan(
  p_workspace_id UUID,
  p_type         TEXT,
  p_semester     SMALLINT DEFAULT NULL,
  p_content      JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM id FROM public.workspaces WHERE id = p_workspace_id AND user_id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workspace not found or access denied'; END IF;
  IF p_semester IS NULL THEN
    SELECT id INTO v_plan_id FROM public.curriculum_plans WHERE workspace_id = p_workspace_id AND type = p_type AND semester IS NULL LIMIT 1;
  ELSE
    SELECT id INTO v_plan_id FROM public.curriculum_plans WHERE workspace_id = p_workspace_id AND type = p_type AND semester = p_semester LIMIT 1;
  END IF;
  IF v_plan_id IS NULL THEN
    INSERT INTO public.curriculum_plans (workspace_id, type, semester, content) VALUES (p_workspace_id, p_type, p_semester, p_content) RETURNING id INTO v_plan_id;
  END IF;
  RETURN v_plan_id;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_curriculum_plan(UUID, TEXT, SMALLINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_curriculum_plan(UUID, TEXT, SMALLINT, JSONB) TO authenticated;
