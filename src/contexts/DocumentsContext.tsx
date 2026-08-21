import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Document, DocumentVersion, DocumentType, SourceType, ChangeType } from '@/types/document';
import { toast } from 'sonner';

interface SaveDocumentParams {
  documentType: DocumentType;
  title: string;
  contentJson: any;
  sourceType?: SourceType;
  sourceId?: string;
  inputSnapshot?: any;
  generationMetadata?: any;
  changeType?: ChangeType;
}

interface DocumentsContextType {
  documents: Document[];
  isLoading: boolean;
  refreshDocuments: () => Promise<void>;
  saveDocument: (params: SaveDocumentParams) => Promise<Document | null>;
  getDocumentHistory: (documentId: string) => Promise<DocumentVersion[]>;
  deleteDocument: (documentId: string) => Promise<boolean>;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDocuments = useCallback(async () => {
    if (!user || !activeWorkspace) {
      setDocuments([]);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as Document[]);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Gagal mengambil daftar dokumen');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeWorkspace]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const saveDocument = async ({
    documentType,
    title,
    contentJson,
    sourceType = 'quick',
    sourceId,
    inputSnapshot,
    generationMetadata,
    changeType = 'generated'
  }: SaveDocumentParams): Promise<Document | null> => {
    if (!user || !activeWorkspace) {
      toast.error('Harap pilih workspace terlebih dahulu');
      return null;
    }

    try {
      // 1. Check if document already exists for this type/source_id
      let document: Document | null = null;
      
      if (sourceId && sourceType === 'prosem') {
        const { data: existingDocs } = await supabase
          .from('documents')
          .select('*')
          .eq('workspace_id', activeWorkspace.id)
          .eq('source_type', sourceType)
          .eq('source_id', sourceId)
          .eq('document_type', documentType)
          .is('deleted_at', null)
          .limit(1);
          
        if (existingDocs && existingDocs.length > 0) {
          document = existingDocs[0] as Document;
        }
      }

      // If no existing document, create one
      if (!document) {
        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert({
            workspace_id: activeWorkspace.id,
            document_type: documentType,
            title,
            status: 'ready',
            source_type: sourceType,
            source_id: sourceId
          })
          .select()
          .single();

        if (docError) throw docError;
        document = newDoc as Document;
      }

      // 2. Determine version number
      const { data: versions } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', document.id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersionNumber = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      // 3. Create version
      const { data: newVersion, error: verError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version_number: nextVersionNumber,
          content_json: contentJson,
          input_snapshot: inputSnapshot,
          generation_metadata: generationMetadata,
          change_type: changeType,
          created_by: user.id
        })
        .select()
        .single();

      if (verError) throw verError;

      // 4. Update document's current_version_id and updated_at
      const { data: updatedDoc, error: updateError } = await supabase
        .from('documents')
        .update({
          current_version_id: newVersion.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      refreshDocuments();
      return updatedDoc as Document;

    } catch (err) {
      console.error('Error saving document:', err);
      toast.error('Gagal menyimpan dokumen');
      return null;
    }
  };

  const getDocumentHistory = async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as DocumentVersion[];
    } catch (err) {
      console.error('Error fetching document history:', err);
      toast.error('Gagal mengambil riwayat dokumen');
      return [];
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;
      
      refreshDocuments();
      toast.success('Dokumen berhasil dihapus');
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Gagal menghapus dokumen');
      return false;
    }
  };

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        isLoading,
        refreshDocuments,
        saveDocument,
        getDocumentHistory,
        deleteDocument
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentsProvider');
  }
  return context;
}
