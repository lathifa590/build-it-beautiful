import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Workspace } from '@/types/workspace';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  duplicateWorkspace: (workspaceId: string, newAcademicYear: string) => Promise<boolean>;
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'user_id' | 'created_at'>) => Promise<Workspace | null>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
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
      
      const loadedWorkspaces = data as Workspace[];
      setWorkspaces(loadedWorkspaces);
      
      // Auto-select the first workspace if none is active but we have workspaces
      if (loadedWorkspaces.length > 0 && !activeWorkspace) {
        // Look for a previously selected workspace in localStorage
        const savedId = localStorage.getItem('active_workspace_id');
        const toSelect = savedId ? loadedWorkspaces.find(w => w.id === savedId) || loadedWorkspaces[0] : loadedWorkspaces[0];
        setActiveWorkspace(toSelect);
      } else if (loadedWorkspaces.length === 0) {
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

  const duplicateWorkspace = async (workspaceId: string, newAcademicYear: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      // 1. Get the original workspace
      const { data: originalWs, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (wsError || !originalWs) throw wsError || new Error('Workspace not found');
      
      // 2. Create the new workspace
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
      
      // 3. Duplicate curriculum plans (Prota & KKTP)
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
        isLoading,
        refreshWorkspaces,
        duplicateWorkspace,
        createWorkspace,
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
