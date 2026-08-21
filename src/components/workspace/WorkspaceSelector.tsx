import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Folder, ChevronDown, Plus, LayoutDashboard, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

export const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRootExplorer = location.pathname === '/app/workspace' || location.pathname === '/app/workspace/';
  const { activeWorkspace, workspaces, setActiveWorkspace } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleCreateWorkspace = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 min-w-[250px] justify-between bg-card border-2 border-foreground shadow-brutal-sm">
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-4 h-4 text-primary" />
              <div className="text-left flex flex-col">
                <span className="text-xs font-bold truncate">
                  {isRootExplorer ? 'Semua Workspace' : (activeWorkspace ? activeWorkspace.subject : 'Pilih Workspace')}
                </span>
                {!isRootExplorer && activeWorkspace && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {activeWorkspace.grade} • {activeWorkspace.academic_year}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px] max-h-[400px] overflow-y-auto">
          <DropdownMenuLabel>Workspace Tersedia</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {workspaces.length === 0 ? (
            <div className="p-3 text-xs text-center text-muted-foreground">
              Belum ada workspace
            </div>
          ) : (
            workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                className={`flex flex-col items-start cursor-pointer py-2 ${activeWorkspace?.id === ws.id ? 'bg-primary/10' : ''}`}
                onClick={() => setActiveWorkspace(ws)}
              >
                <div className="flex items-center w-full justify-between">
                  <span className="font-bold text-sm">{ws.subject}</span>
                  {activeWorkspace?.id === ws.id && (
                    <span className="text-xs text-primary font-bold">✓</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Kelas {ws.grade} — {ws.academic_year}</span>
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCreateWorkspace} className="cursor-pointer text-primary focus:text-primary">
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-bold">Buat Workspace Baru</span>
          </DropdownMenuItem>
          {!isRootExplorer && (
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/app/workspace')}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span className="font-bold">Lihat Semua Workspace</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            <span>Kelola Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};
