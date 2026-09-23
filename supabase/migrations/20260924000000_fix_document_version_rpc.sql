-- Fix permission issue where create_document_version fails because current_version_id update is revoked for authenticated users
-- Adding SECURITY DEFINER allows the function to bypass the REVOKE UPDATE (current_version_id) restriction
-- while still securely checking document ownership (user_id = auth.uid()) within the function body.

CREATE OR REPLACE FUNCTION public.create_document_version(
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
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the document and verify ownership
    PERFORM id FROM public.documents 
    WHERE id = p_document_id AND user_id = v_user_id AND deleted_at IS NULL 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found or access denied';
    END IF;

    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM public.document_versions
    WHERE document_id = p_document_id;

    -- Insert new version
    INSERT INTO public.document_versions (
        document_id, version_number, content_json, input_snapshot, generation_metadata, change_type, created_by
    ) VALUES (
        p_document_id, v_next_version, p_content_json, p_input_snapshot, p_generation_metadata, p_change_type, v_user_id
    ) RETURNING id INTO v_version_id;

    -- Update current_version_id on the document (Requires SECURITY DEFINER because UPDATE is revoked)
    UPDATE public.documents 
    SET current_version_id = v_version_id, updated_at = now()
    WHERE id = p_document_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
