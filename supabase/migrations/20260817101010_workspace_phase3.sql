-- Migration for Workspace Phase 3 (Documents, TP, Prosem, Meeting Slots)
-- Note: Includes creation of curriculum_plans which was missing

-- 0. Curriculum Plans


CREATE TABLE IF NOT EXISTS public.curriculum_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('cp', 'tp', 'kktp', 'prota', 'prosem')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    semester SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_curriculum_plans_updated_at
  BEFORE UPDATE ON public.curriculum_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1. TP Master (Learning Objectives)
CREATE TABLE public.tp_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    tp_plan_id UUID NOT NULL REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
    code VARCHAR(50), 
    sequence INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tp_items_sequence UNIQUE (tp_plan_id, sequence)
);

CREATE TRIGGER update_tp_items_updated_at
  BEFORE UPDATE ON public.tp_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tp_items_ws ON public.tp_items(workspace_id);

-- Integrity trigger: TP workspace must equal curriculum_plan workspace and be immutable
CREATE OR REPLACE FUNCTION check_tp_item_workspace()
RETURNS TRIGGER AS $$
DECLARE
    plan_ws UUID;
    plan_type TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            RAISE EXCEPTION 'tp_items.workspace_id is immutable';
        END IF;
        IF OLD.tp_plan_id IS DISTINCT FROM NEW.tp_plan_id THEN
            RAISE EXCEPTION 'tp_items.tp_plan_id is immutable';
        END IF;
    END IF;

    SELECT workspace_id, type INTO plan_ws, plan_type FROM public.curriculum_plans WHERE id = NEW.tp_plan_id;
    IF plan_type != 'tp' THEN
        RAISE EXCEPTION 'tp_plan_id must point to a curriculum_plan with type tp';
    END IF;
    IF NEW.workspace_id != plan_ws THEN
        RAISE EXCEPTION 'tp_item workspace must match curriculum_plan workspace';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_tp_item_ws
  BEFORE INSERT OR UPDATE ON public.tp_items
  FOR EACH ROW EXECUTE FUNCTION check_tp_item_workspace();


-- 2. Prosem Items (Topik / Materi)
CREATE TABLE public.prosem_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    prosem_plan_id UUID NOT NULL REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    sequence INTEGER NOT NULL,
    materi_pokok TEXT NOT NULL,
    tp_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    allocated_jp INTEGER NOT NULL CHECK (allocated_jp > 0),
    weeks JSONB NOT NULL DEFAULT '{}'::jsonb, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prosem_items_sequence UNIQUE (prosem_plan_id, sequence)
);

CREATE TRIGGER update_prosem_items_updated_at
  BEFORE UPDATE ON public.prosem_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prosem_items_ws_sem ON public.prosem_items(workspace_id, semester);

-- Integrity trigger: Prosem workspace must equal curriculum_plan workspace and be immutable
CREATE OR REPLACE FUNCTION check_prosem_item_workspace()
RETURNS TRIGGER AS $$
DECLARE
    plan_ws UUID;
    plan_type TEXT;
    plan_sem SMALLINT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            RAISE EXCEPTION 'prosem_items.workspace_id is immutable';
        END IF;
        IF OLD.prosem_plan_id IS DISTINCT FROM NEW.prosem_plan_id THEN
            RAISE EXCEPTION 'prosem_items.prosem_plan_id is immutable';
        END IF;
    END IF;

    SELECT workspace_id, type, semester INTO plan_ws, plan_type, plan_sem FROM public.curriculum_plans WHERE id = NEW.prosem_plan_id;
    IF plan_type != 'prosem' THEN
        RAISE EXCEPTION 'prosem_plan_id must point to a curriculum_plan with type prosem';
    END IF;
    IF plan_sem != NEW.semester THEN
        RAISE EXCEPTION 'prosem_item semester must match curriculum_plan semester';
    END IF;
    IF NEW.workspace_id != plan_ws THEN
        RAISE EXCEPTION 'prosem_item workspace must match curriculum_plan workspace';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_prosem_item_ws
  BEFORE INSERT OR UPDATE ON public.prosem_items
  FOR EACH ROW EXECUTE FUNCTION check_prosem_item_workspace();


-- 3. Prosem TP Links (M:N)
CREATE TABLE public.prosem_item_tp_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prosem_item_id UUID NOT NULL REFERENCES public.prosem_items(id) ON DELETE CASCADE,
    tp_id UUID NOT NULL REFERENCES public.tp_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prosem_tp_link UNIQUE (prosem_item_id, tp_id)
);

CREATE INDEX idx_prosem_tp_links_tp ON public.prosem_item_tp_links(tp_id);

-- Integrity function for Prosem TP Link
CREATE OR REPLACE FUNCTION check_prosem_tp_workspace()
RETURNS TRIGGER AS $$
DECLARE
    prosem_ws UUID;
    tp_ws UUID;
BEGIN
    SELECT workspace_id INTO prosem_ws FROM public.prosem_items WHERE id = NEW.prosem_item_id;
    SELECT workspace_id INTO tp_ws FROM public.tp_items WHERE id = NEW.tp_id;
    IF prosem_ws != tp_ws THEN
        RAISE EXCEPTION 'Cross-workspace linking is not allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_prosem_tp_ws
  BEFORE INSERT OR UPDATE ON public.prosem_item_tp_links
  FOR EACH ROW EXECUTE FUNCTION check_prosem_tp_workspace();

-- 4. Meeting Slots
CREATE TABLE public.meeting_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    prosem_item_id UUID NOT NULL REFERENCES public.prosem_items(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL, 
    title TEXT NOT NULL, 
    planned_jp INTEGER NOT NULL CHECK (planned_jp > 0),
    week_number INTEGER,
    planned_date DATE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'taught', 'completed', 'skipped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_meeting_slots_sequence UNIQUE (prosem_item_id, sequence)
);

CREATE INDEX idx_meeting_slots_ws ON public.meeting_slots(workspace_id);

-- Integrity trigger: meeting slot workspace must equal prosem item workspace and be immutable
CREATE OR REPLACE FUNCTION check_meeting_slot_workspace()
RETURNS TRIGGER AS $$
DECLARE
    prosem_ws UUID;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            RAISE EXCEPTION 'meeting_slots.workspace_id is immutable';
        END IF;
    END IF;

    SELECT workspace_id INTO prosem_ws FROM public.prosem_items WHERE id = NEW.prosem_item_id;
    IF NEW.workspace_id != prosem_ws THEN
        RAISE EXCEPTION 'Meeting slot workspace must match prosem item workspace';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_meeting_slot_ws
  BEFORE INSERT OR UPDATE ON public.meeting_slots
  FOR EACH ROW EXECUTE FUNCTION check_meeting_slot_workspace();

CREATE TRIGGER update_meeting_slots_updated_at
  BEFORE UPDATE ON public.meeting_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Documents & Versions
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('modul', 'lkpd', 'materi', 'asesmen', 'soal', 'refleksi')),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'completed', 'archived')),
    source_type TEXT NOT NULL DEFAULT 'prosem' CHECK (source_type IN ('prosem', 'quick', 'legacy')),
    source_id UUID,
    current_version_id UUID, -- Will add FK constraint later
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_document_source_workspace CHECK (source_type != 'prosem' OR workspace_id IS NOT NULL)
);

CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_ws ON public.documents(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_documents_ws_type ON public.documents(workspace_id, document_type) WHERE deleted_at IS NULL;

-- Integrity Trigger for Document Workspace = User Workspace & Immutability checks
CREATE OR REPLACE FUNCTION check_document_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
    ws_user UUID;
    has_links BOOLEAN;
BEGIN
    -- Prevent workspace change if already linked
    IF TG_OP = 'UPDATE' THEN
        IF OLD.workspace_id IS NOT NULL AND NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
            SELECT EXISTS(
                SELECT 1 FROM public.meeting_document_links WHERE document_id = NEW.id
            ) INTO has_links;
            IF has_links THEN
                RAISE EXCEPTION 'Cannot change workspace_id of a document that is linked to a meeting slot';
            END IF;
        END IF;
    END IF;

    IF NEW.workspace_id IS NOT NULL THEN
        SELECT user_id INTO ws_user FROM public.workspaces WHERE id = NEW.workspace_id;
        IF ws_user != NEW.user_id THEN
            RAISE EXCEPTION 'Document owner must match workspace owner';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_document_ws_user
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION check_document_user_workspace();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_json JSONB NOT NULL,
    input_snapshot JSONB,
    generation_metadata JSONB,
    change_type TEXT NOT NULL DEFAULT 'generated' CHECK (change_type IN ('generated', 'regenerated', 'edited', 'restored', 'imported')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_versions_number UNIQUE (document_id, version_number)
);

-- Add FK for current_version_id
ALTER TABLE public.documents
  ADD CONSTRAINT fk_documents_current_version
  FOREIGN KEY (current_version_id) REFERENCES public.document_versions(id) ON DELETE SET NULL;

-- Integrity Trigger to ensure current_version_id belongs to the document
CREATE OR REPLACE FUNCTION check_document_current_version()
RETURNS TRIGGER AS $$
DECLARE
    v_doc_id UUID;
BEGIN
    IF NEW.current_version_id IS NOT NULL THEN
        SELECT document_id INTO v_doc_id FROM public.document_versions WHERE id = NEW.current_version_id;
        IF v_doc_id != NEW.id THEN
            RAISE EXCEPTION 'current_version_id must belong to the same document';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_doc_version
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION check_document_current_version();

-- 6. Meeting Document Links
CREATE TABLE public.meeting_document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_slot_id UUID NOT NULL REFERENCES public.meeting_slots(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_meeting_doc_link UNIQUE (meeting_slot_id, document_id)
);

CREATE INDEX idx_mdl_doc ON public.meeting_document_links(document_id);

-- Integrity trigger: meeting slot and document workspace must match
CREATE OR REPLACE FUNCTION check_meeting_doc_link_workspace()
RETURNS TRIGGER AS $$
DECLARE
    meeting_ws UUID;
    doc_ws UUID;
BEGIN
    SELECT workspace_id INTO meeting_ws FROM public.meeting_slots WHERE id = NEW.meeting_slot_id;
    SELECT workspace_id INTO doc_ws FROM public.documents WHERE id = NEW.document_id;
    
    IF doc_ws IS NULL THEN
        RAISE EXCEPTION 'Document must be adopted into a workspace before linking to a meeting slot';
    END IF;
    
    IF meeting_ws != doc_ws THEN
        RAISE EXCEPTION 'Meeting slot and document must belong to the same workspace';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_meeting_doc_ws
  BEFORE INSERT OR UPDATE ON public.meeting_document_links
  FOR EACH ROW EXECUTE FUNCTION check_meeting_doc_link_workspace();


-- 7. Transactional RPC for Document Versioning
CREATE OR REPLACE FUNCTION create_document_version(
    p_document_id UUID,
    p_content_json JSONB,
    p_input_snapshot JSONB,
    p_generation_metadata JSONB,
    p_change_type TEXT
) RETURNS UUID AS $$
DECLARE
    v_next_version INTEGER;
    v_version_id UUID;
    v_user_id UUID;
BEGIN
    -- Check permissions
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Lock document row for concurrency safety, check ownership, and ensure it's not soft-deleted
    PERFORM id FROM public.documents WHERE id = p_document_id AND user_id = v_user_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found, access denied, or document is deleted';
    END IF;

    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM public.document_versions
    WHERE document_id = p_document_id;

    INSERT INTO public.document_versions (
        document_id, version_number, content_json, input_snapshot, generation_metadata, change_type, created_by
    ) VALUES (
        p_document_id, v_next_version, p_content_json, p_input_snapshot, p_generation_metadata, p_change_type, v_user_id
    ) RETURNING id INTO v_version_id;

    UPDATE public.documents 
    SET current_version_id = v_version_id, updated_at = now()
    WHERE id = p_document_id;

    RETURN v_version_id;
END;
-- Change to SECURITY DEFINER to allow insert despite RLS restrictions
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly configure permissions for the RPC
REVOKE EXECUTE ON FUNCTION create_document_version(UUID, JSONB, JSONB, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_document_version(UUID, JSONB, JSONB, JSONB, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION create_document_version(UUID, JSONB, JSONB, JSONB, TEXT) TO authenticated;

-- 8. Setup RLS
ALTER TABLE public.curriculum_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prosem_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prosem_item_tp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can manage curriculum plans" ON public.curriculum_plans
  FOR ALL USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can manage tp_items" ON public.tp_items
  FOR ALL USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can manage prosem_items" ON public.prosem_items
  FOR ALL USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Workspace owners can manage prosem_item_tp_links" ON public.prosem_item_tp_links
  FOR ALL USING (
    prosem_item_id IN (
      SELECT id FROM public.prosem_items WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace owners can manage meeting_slots" ON public.meeting_slots
  FOR ALL USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

-- Soft-delete only for documents
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can select their own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid());
-- Explicitly NOT adding DELETE policy to prevent hard deletes by users

-- Block clients from directly updating current_version_id; only the SECURITY DEFINER RPC can change it
REVOKE UPDATE (current_version_id) ON public.documents FROM authenticated;
REVOKE UPDATE (current_version_id) ON public.documents FROM anon;

CREATE POLICY "Users can select their document versions" ON public.document_versions
  FOR SELECT USING (
    document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid())
  );
-- INSERT is disabled via RLS. Must go through SECURITY DEFINER RPC.
-- UPDATE and DELETE are also disabled.

CREATE POLICY "Workspace owners can select and delete meeting document links" ON public.meeting_document_links
  FOR SELECT USING (
    meeting_slot_id IN (
      SELECT id FROM public.meeting_slots WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace owners can delete meeting document links" ON public.meeting_document_links
  FOR DELETE USING (
    meeting_slot_id IN (
      SELECT id FROM public.meeting_slots WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace owners can insert meeting document links" ON public.meeting_document_links
  FOR INSERT WITH CHECK (
    meeting_slot_id IN (
      SELECT id FROM public.meeting_slots WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE user_id = auth.uid()
      )
    )
    AND
    document_id IN (
      SELECT id FROM public.documents WHERE user_id = auth.uid()
    )
  );
