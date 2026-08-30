CREATE OR REPLACE FUNCTION append_generation_result(
    p_workspace_id UUID,
    p_pertemuan_id TEXT,
    p_jenis_dokumen TEXT,
    p_generated_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_result JSONB;
    v_pertemuan_array JSONB;
    v_pertemuan_obj JSONB;
    v_index INT;
BEGIN
    SELECT generation_result INTO v_current_result 
    FROM workspaces 
    WHERE id = p_workspace_id 
    FOR UPDATE;
    
    IF v_current_result IS NULL OR NOT (v_current_result ? 'version') THEN
        v_current_result := '{"version": 2, "pertemuan": []}'::jsonb;
    END IF;
    
    v_pertemuan_array := COALESCE(v_current_result->'pertemuan', '[]'::jsonb);
    
    SELECT (ordinality - 1)::INT INTO v_index
    FROM jsonb_array_elements(v_pertemuan_array) WITH ORDINALITY
    WHERE value->>'id' = p_pertemuan_id
    LIMIT 1;
    
    IF v_index IS NULL THEN
        v_pertemuan_obj := jsonb_build_object(
            'id', p_pertemuan_id,
            'status', jsonb_build_object(p_jenis_dokumen, 'ok'),
            'dokumen', jsonb_build_object(p_jenis_dokumen, p_generated_data)
        );
        v_current_result := jsonb_set(
            v_current_result,
            '{pertemuan}',
            v_pertemuan_array || v_pertemuan_obj
        );
    ELSE
        v_current_result := jsonb_set(
            v_current_result,
            ARRAY['pertemuan', v_index::TEXT, 'status', p_jenis_dokumen],
            '"ok"'::jsonb,
            true
        );
        v_current_result := jsonb_set(
            v_current_result,
            ARRAY['pertemuan', v_index::TEXT, 'dokumen', p_jenis_dokumen],
            p_generated_data,
            true
        );
        
        IF (v_current_result->'pertemuan'->v_index->'status'->>'modul' = 'ok') AND
           (v_current_result->'pertemuan'->v_index->'status'->>'lkpd' = 'ok') AND
           (v_current_result->'pertemuan'->v_index->'status'->>'asesmen' = 'ok') THEN
            UPDATE meeting_slots SET status = 'completed' WHERE id = p_pertemuan_id::UUID;
        END IF;
    END IF;
    
    UPDATE workspaces 
    SET generation_result = v_current_result
    WHERE id = p_workspace_id;
END;
$$;
