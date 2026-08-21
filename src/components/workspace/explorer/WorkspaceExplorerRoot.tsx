import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Folder, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkspaceExplorerRoot = () => {
  const { workspaces } = useWorkspace();
  const navigate = useNavigate();

  // Group by Subject
  const groupedWorkspaces = workspaces.reduce((acc, ws) => {
    if (!acc[ws.subject]) {
      acc[ws.subject] = [];
    }
    acc[ws.subject].push(ws);
    return acc;
  }, {} as Record<string, typeof workspaces>);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">WORKSPACE SAYA</h1>
          <p className="text-muted-foreground text-sm">Pilih workspace untuk mengelola pembelajaran</p>
        </div>
        
        {/* Toolbar Placeholder */}
        <div className="flex items-center gap-2 bg-card border-2 border-foreground rounded-md shadow-brutal-sm p-1">
          <button className="p-1.5 bg-primary/20 text-primary rounded-sm">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-muted text-muted-foreground rounded-sm">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {Object.keys(groupedWorkspaces).length === 0 ? (
        <div className="text-center py-20 bg-card border-2 border-foreground border-dashed rounded-xl">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Belum ada Workspace</h3>
          <p className="text-muted-foreground text-sm mb-4">Buat workspace baru dari menu di atas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedWorkspaces).map(([subject, wss]) => (
            <div key={subject} className="space-y-4">
              <h2 className="text-lg font-bold font-heading flex items-center gap-2 uppercase border-b-2 border-foreground/10 pb-2">
                <Folder className="w-5 h-5 text-primary" />
                {subject}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wss.map((ws) => (
                  <div 
                    key={ws.id}
                    onClick={() => navigate(`/app/workspace/${ws.id}`)}
                    className="bg-card border-2 border-foreground shadow-brutal-sm p-4 rounded-xl cursor-pointer hover:translate-y-[-4px] hover:shadow-brutal transition-all flex flex-col group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Folder className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.2} />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1 truncate">Kelas {ws.grade}</h3>
                    <p className="text-sm text-muted-foreground">Fase {ws.phase}</p>
                    <p className="text-xs text-muted-foreground mb-4">{ws.academic_year}</p>
                    
                    <div className="mt-auto pt-4 border-t-2 border-foreground/10">
                      <p className="text-xs text-muted-foreground mb-2">Belum ada Program Semester</p>
                      <div className="flex justify-between text-xs font-bold mb-1 text-muted-foreground">
                        <span>0 / 0 JP</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-foreground/20">
                        <div className="bg-primary h-full w-[0%]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
