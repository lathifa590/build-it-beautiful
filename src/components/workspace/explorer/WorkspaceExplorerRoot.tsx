import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Folder, LayoutGrid, List, Archive, RotateCcw, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProsemData } from '@/hooks/useProsemData';
import { toast } from 'sonner';
import { Workspace } from '@/types/workspace';

// ─────────────────────────────────────────────────────────────
// Shared progress hook
// ─────────────────────────────────────────────────────────────
const useWorkspaceProgress = (wsId: string) => {
  const { prosemPlans, prosemItems, isLoading } = useProsemData(wsId);
  const totalJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.allocated_jp, 0), 0
  );
  const completedJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce(
      (ss, i) => ss + i.meeting_slots.filter(m => m.status === 'completed').reduce((sss, m) => sss + m.planned_jp, 0), 0
    ), 0
  );
  const progress = totalJp > 0 ? Math.round((completedJp / totalJp) * 100) : 0;
  const statusText = prosemPlans.length > 0 ? 'Program Semester Tersedia' : 'Belum ada Program Semester';
  return { totalJp, completedJp, progress, statusText, isLoading };
};

// ─────────────────────────────────────────────────────────────
// Active workspace cards (unchanged look, same as before)
// ─────────────────────────────────────────────────────────────
const WorkspaceCard = ({ ws, onClick }: { ws: Workspace; onClick: () => void }) => {
  const { totalJp, completedJp, progress, statusText, isLoading } = useWorkspaceProgress(ws.id);
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
        <p className="text-xs text-muted-foreground mb-2">{isLoading ? 'Memuat...' : statusText}</p>
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

const WorkspaceListCard = ({ ws, onClick }: { ws: Workspace; onClick: () => void }) => {
  const { totalJp, completedJp, progress, statusText, isLoading } = useWorkspaceProgress(ws.id);
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
        <p className="text-xs text-muted-foreground mb-2">{isLoading ? 'Memuat...' : statusText}</p>
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

// ─────────────────────────────────────────────────────────────
// Archived card with Restore + Delete actions
// ─────────────────────────────────────────────────────────────
const ArchivedCard = ({ ws }: { ws: Workspace }) => {
  const { restoreWorkspace, deleteWorkspace } = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    const ok = await restoreWorkspace(ws.id);
    setIsRestoring(false);
    if (ok) toast.success(`Workspace "${ws.subject} - Kelas ${ws.grade}" dipulihkan!`);
    else toast.error('Gagal memulihkan workspace.');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const ok = await deleteWorkspace(ws.id);
    setIsDeleting(false);
    if (ok) toast.success('Workspace dihapus permanen.');
    else toast.error('Gagal menghapus workspace.');
    setShowDeleteModal(false);
  };

  const confirmTarget = ws.subject;
  const isConfirmed = confirmText === confirmTarget;

  return (
    <>
      <div className="bg-card border-2 border-foreground/30 border-dashed rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Folder className="w-8 h-8 text-muted-foreground shrink-0" fill="currentColor" fillOpacity={0.1} />
          <div className="min-w-0">
            <h3 className="font-bold truncate">{ws.subject} – Kelas {ws.grade}</h3>
            <p className="text-xs text-muted-foreground">Fase {ws.phase} • {ws.academic_year}</p>
            {ws.archived_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Diarsipkan {new Date(ws.archived_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-foreground/30 rounded-lg bg-background hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isRestoring ? 'Memulihkan...' : 'Pulihkan'}
          </button>
          <button
            onClick={() => { setConfirmText(''); setShowDeleteModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-destructive/30 text-destructive rounded-lg bg-background hover:bg-destructive/10 hover:border-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Permanen
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg">Hapus Workspace Permanen</h2>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-destructive/5 border-2 border-destructive/20 rounded-xl space-y-1">
              <p className="text-sm font-semibold text-destructive">⚠️ Semua data berikut akan dihapus permanen:</p>
              <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-0.5">
                <li>Program Semester & Perencanaan JP</li>
                <li>Semua modul ajar, LKPD, soal, asesmen</li>
                <li>Riwayat dan versi dokumen</li>
                <li>Capaian pembelajaran & TP</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Ketik <span className="font-extrabold bg-muted px-1.5 py-0.5 rounded border border-foreground/20">{confirmTarget}</span> untuk mengkonfirmasi:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={confirmTarget}
                className="w-full px-3 py-2.5 border-2 border-foreground/30 rounded-lg focus:border-destructive outline-none bg-background transition-colors text-sm font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 text-sm font-bold border-2 border-foreground/30 rounded-lg hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                className="flex-1 py-2.5 text-sm font-bold bg-destructive text-white border-2 border-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Menghapus...' : '🗑️ Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Explorer Root
// ─────────────────────────────────────────────────────────────
export const WorkspaceExplorerRoot = () => {
  const { workspaces, archivedWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = React.useState(false);

  // Group by Subject (active only)
  const groupedWorkspaces = workspaces.reduce((acc, ws) => {
    if (!acc[ws.subject]) acc[ws.subject] = [];
    acc[ws.subject].push(ws);
    return acc;
  }, {} as Record<string, typeof workspaces>);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in pb-24">
      {/* Header */}
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

      {/* Active workspaces */}
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
                    <WorkspaceCard key={ws.id} ws={ws} onClick={() => navigate(`/app/workspace/${ws.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {wss.map((ws) => (
                    <WorkspaceListCard key={ws.id} ws={ws} onClick={() => navigate(`/app/workspace/${ws.id}`)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archived workspaces section */}
      {archivedWorkspaces.length > 0 && (
        <div className="border-t-2 border-foreground/10 pt-6">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            {showArchived ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Archive className="w-4 h-4" />
            Arsip ({archivedWorkspaces.length})
          </button>

          {showArchived && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-muted-foreground mb-4">
                Workspace diarsipkan disembunyikan dari daftar aktif. Pulihkan kapan saja, atau hapus permanen jika tidak diperlukan lagi.
              </p>
              {archivedWorkspaces.map(ws => (
                <ArchivedCard key={ws.id} ws={ws} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
