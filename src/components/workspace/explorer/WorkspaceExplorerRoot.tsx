import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Folder, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProsemData } from '@/hooks/useProsemData';

const WorkspaceCard = ({ ws, onClick }: { ws: any; onClick: () => void }) => {
  const { prosemPlans, prosemItems, isLoading } = useProsemData(ws.id);
  
  const totalJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.allocated_jp, 0),
    0
  );
  
  const completedJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.meeting_slots.filter(m => m.status === "completed").reduce((sss, m) => sss + m.planned_jp, 0), 0),
    0
  );
  
  const progress = totalJp > 0 ? Math.round((completedJp / totalJp) * 100) : 0;
  const statusText = prosemPlans.length > 0 ? "Program Semester Tersedia" : "Belum ada Program Semester";

  return (
    <div 
      onClick={onClick}
      className="bg-card border-2 border-foreground shadow-brutal-sm p-4 rounded-xl cursor-pointer hover:translate-y-[-4px] hover:shadow-brutal transition-all flex flex-col group"
    >
      <div className="flex items-start justify-between mb-2">
        <Folder className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.2} />
      </div>
      
      <h3 className="font-bold text-lg mb-1 truncate">Kelas {ws.grade}</h3>
      <p className="text-sm text-muted-foreground">Fase {ws.phase}</p>
      <p className="text-xs text-muted-foreground mb-4">{ws.academic_year}</p>
      
      <div className="mt-auto pt-4 border-t-2 border-foreground/10">
        <p className="text-xs text-muted-foreground mb-2">{isLoading ? "Memuat..." : statusText}</p>
        <div className="flex justify-between text-xs font-bold mb-1 text-muted-foreground">
          <span>{completedJp} / {totalJp} JP</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-foreground/20">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

const WorkspaceListCard = ({ ws, onClick }: { ws: any; onClick: () => void }) => {
  const { prosemPlans, prosemItems, isLoading } = useProsemData(ws.id);
  
  const totalJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.allocated_jp, 0),
    0
  );
  
  const completedJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.meeting_slots.filter(m => m.status === "completed").reduce((sss, m) => sss + m.planned_jp, 0), 0),
    0
  );
  
  const progress = totalJp > 0 ? Math.round((completedJp / totalJp) * 100) : 0;
  const statusText = prosemPlans.length > 0 ? "Program Semester Tersedia" : "Belum ada Program Semester";

  return (
    <div 
      onClick={onClick}
      className="bg-card border-2 border-foreground shadow-brutal-sm p-3 md:p-4 rounded-xl cursor-pointer hover:translate-x-1 hover:shadow-brutal transition-all flex flex-col md:flex-row items-start md:items-center gap-4 group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
        <Folder className="w-10 h-10 text-yellow-500 group-hover:scale-110 transition-transform shrink-0" fill="currentColor" fillOpacity={0.2} />
        <div className="min-w-0">
          <h3 className="font-bold text-lg truncate">Kelas {ws.grade}</h3>
          <p className="text-sm text-muted-foreground truncate">Fase {ws.phase} • {ws.academic_year}</p>
        </div>
      </div>
      
      <div className="w-full md:w-72 shrink-0 flex flex-col border-t-2 md:border-t-0 md:border-l-2 border-foreground/10 pt-3 md:pt-0 md:pl-4 mt-1 md:mt-0">
        <p className="text-xs text-muted-foreground mb-2">{isLoading ? "Memuat..." : statusText}</p>
        <div className="flex justify-between text-xs font-bold mb-1 text-muted-foreground">
          <span>{completedJp} / {totalJp} JP</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-foreground/20">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export const WorkspaceExplorerRoot = () => {
  const { workspaces } = useWorkspace();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

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
        
        <div className="flex items-center gap-2 bg-card border-2 border-foreground rounded-md shadow-brutal-sm p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
          >
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
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wss.map((ws) => (
                    <WorkspaceCard 
                      key={ws.id} 
                      ws={ws} 
                      onClick={() => navigate(`/app/workspace/${ws.id}`)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {wss.map((ws) => (
                    <WorkspaceListCard 
                      key={ws.id} 
                      ws={ws} 
                      onClick={() => navigate(`/app/workspace/${ws.id}`)} 
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
