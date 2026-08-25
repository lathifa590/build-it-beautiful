import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type DocumentType = 'modul' | 'lkpd' | 'materi' | 'asesmen' | 'soal' | 'refleksi' | 'form_data';

export interface MeetingDocument {
  document_id: string;
  document_type: DocumentType;
  title: string;
  content_json: any;
}

export function useMeetingDocuments(workspaceId: string, meetingId: string) {
  const [documents, setDocuments] = useState<Record<string, MeetingDocument>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    if (!meetingId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_document_links')
        .select(`
          document_id,
          documents (
            id, document_type, title, current_version_id,
            document_versions!fk_documents_current_version (
              content_json
            )
          )
        `)
        .eq('meeting_slot_id', meetingId);

      if (error) throw error;

      const docsMap: Record<string, MeetingDocument> = {};
      if (data) {
        for (const link of data) {
          const doc = link.documents as any;
          if (doc && doc.document_type) {
            const versions = doc.document_versions;
            const contentJson = Array.isArray(versions) ? versions[0]?.content_json : versions?.content_json;
            docsMap[doc.document_type] = {
              document_id: doc.id,
              document_type: doc.document_type,
              title: doc.title,
              content_json: contentJson || null,
            };
          }
        }
      }
      setDocuments(docsMap);
      return docsMap;
    } catch (err: any) {
      console.error("Error loading meeting documents:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  const saveDocument = useCallback(async (
    docType: DocumentType, 
    title: string, 
    contentJson: any
  ) => {
    if (!user || !workspaceId || !meetingId) return false;
    
    try {
      let documentId = documents[docType]?.document_id;

      // 1. Create document if it doesn't exist
      if (!documentId) {
        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            document_type: docType,
            title: title,
            source_type: 'prosem',
            status: 'ready'
          })
          .select('id')
          .single();

        if (docError) throw docError;
        documentId = newDoc.id;

        // Link it to the meeting
        const { error: linkError } = await supabase
          .from('meeting_document_links')
          .insert({
            meeting_slot_id: meetingId,
            document_id: documentId
          });
        
        if (linkError) throw linkError;
      }

      // 2. Create version
      const { error: rpcError } = await supabase.rpc('create_document_version', {
        p_document_id: documentId,
        p_content_json: contentJson,
        p_input_snapshot: {},
        p_generation_metadata: {},
        p_change_type: 'edited'
      });

      if (rpcError) throw rpcError;

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          document_id: documentId!,
          document_type: docType,
          title,
          content_json: contentJson
        }
      }));

      return true;
    } catch (err: any) {
      console.error(`Error saving ${docType}:`, err);
      return false;
    }
  }, [user, workspaceId, meetingId, documents]);

  const saveAllDocuments = useCallback(async (
    documentsToSave: Array<{ type: DocumentType, title: string, content: any }>
  ) => {
    setIsSaving(true);
    try {
      let successCount = 0;
      for (const doc of documentsToSave) {
        if (!doc.content) continue;
        const success = await saveDocument(doc.type, doc.title, doc.content);
        if (success) successCount++;
      }
      
      if (successCount > 0) {
        const { error: updateError } = await supabase
          .from('meeting_slots')
          .update({ status: 'completed' })
          .eq('id', meetingId);
          
        if (updateError) {
          console.error("Failed to update meeting status:", updateError);
        }

        toast({
          title: "Berhasil",
          description: `${successCount} dokumen berhasil disimpan ke Workspace.`,
        });
      }
      return successCount > 0;
    } finally {
      setIsSaving(false);
    }
  }, [saveDocument, toast]);

  return {
    documents,
    isLoading,
    isSaving,
    loadDocuments,
    saveDocument,
    saveAllDocuments
  };
}
