import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace } from '@/types/workspace';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];           // only active (not archived)
  archivedWorkspaces: Workspace[];   // only archived
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  duplicateWorkspace: (workspaceId: string, newAcademicYear: string) => Promise<boolean>;
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'user_id' | 'created_at'>) => Promise<Workspace | null>;
  archiveWorkspace: (workspaceId: string) => Promise<boolean>;
  restoreWorkspace: (workspaceId: string) => Promise<boolean>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [archivedWorkspaces, setArchivedWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setArchivedWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const all = data as Workspace[];
      const active = all.filter(w => !w.is_archived);
      const archived = all.filter(w => w.is_archived);

      setWorkspaces(active);
      setArchivedWorkspaces(archived);
      
      // Auto-select first active workspace if none is selected
      if (active.length > 0 && !activeWorkspace) {
        const savedId = localStorage.getItem('active_workspace_id');
        const toSelect = savedId ? active.find(w => w.id === savedId) || active[0] : active[0];
        setActiveWorkspace(toSelect);
      } else if (active.length === 0) {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, [user]);

  const archiveWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ is_archived: true, archived_at: new Date().toISOString() } as any)
        .eq('id', workspaceId);
      if (error) throw error;
      // If archiving the active workspace, clear it
      if (activeWorkspace?.id === workspaceId) {
        setActiveWorkspace(null);
      }
      await refreshWorkspaces();
      return true;
    } catch (err) {
      console.error('Error archiving workspace:', err);
      return false;
    }
  };

  const restoreWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ is_archived: false, archived_at: null } as any)
        .eq('id', workspaceId);
      if (error) throw error;
      await refreshWorkspaces();
      return true;
    } catch (err) {
      console.error('Error restoring workspace:', err);
      return false;
    }
  };

  const deleteWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);
      if (error) throw error;
      if (activeWorkspace?.id === workspaceId) {
        setActiveWorkspace(null);
      }
      await refreshWorkspaces();
      return true;
    } catch (err) {
      console.error('Error deleting workspace:', err);
      return false;
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates as any)
        .eq('id', workspaceId);
      if (error) throw error;
      await refreshWorkspaces();
      if (activeWorkspace?.id === workspaceId) {
        setActiveWorkspace({ ...activeWorkspace, ...updates } as Workspace);
      }
      return true;
    } catch (err) {
      console.error('Error updating workspace:', err);
      return false;
    }
  };

  const duplicateWorkspace = async (workspaceId: string, newAcademicYear: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      const { data: originalWs, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (wsError || !originalWs) throw wsError || new Error('Workspace not found');
      
      const { data: newWs, error: insertError } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          subject: originalWs.subject,
          grade: originalWs.grade,
          phase: originalWs.phase,
          academic_year: newAcademicYear,
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      const { data: originalPlans, error: plansError } = await supabase
        .from('curriculum_plans')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      if (!plansError && originalPlans && originalPlans.length > 0) {
        const newPlans = originalPlans.map(plan => ({
          workspace_id: newWs.id,
          type: plan.type,
          content: plan.content,
        }));
        await supabase.from('curriculum_plans').insert(newPlans);
      }
      
      await refreshWorkspaces();
      setActiveWorkspace(newWs as Workspace);
      return true;
    } catch (err) {
      console.error('Error duplicating workspace:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (workspace: Omit<Workspace, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          ...workspace
        })
        .select()
        .single();
        
      if (error) throw error;
      
      await refreshWorkspaces();
      setActiveWorkspace(data as Workspace);
      return data as Workspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Persist active workspace choice
  useEffect(() => {
    if (activeWorkspace) {
      localStorage.setItem('active_workspace_id', activeWorkspace.id);
    } else {
      localStorage.removeItem('active_workspace_id');
    }
  }, [activeWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        workspaces,
        archivedWorkspaces,
        isLoading,
        refreshWorkspaces,
        duplicateWorkspace,
        createWorkspace,
        archiveWorkspace,
        restoreWorkspace,
        deleteWorkspace,
        updateWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
