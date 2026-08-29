import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, CheckCircle2, AlertTriangle, FileText, BarChart3, Settings, MoreVertical, Copy, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ProtaData, ProsemData, KKTPData } from '@/types/modul';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmContext';
import { StorePublishModal } from '../store/StorePublishModal';
import { Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const WorkspaceDashboard = ({ 
  onNavigate,
  protaData,
  prosemSem1,
  prosemSem2,
  kktpData,
  isLocked,
  onShowUpsell,
}: { 
  onNavigate: (path: string) => void;
  protaData: ProtaData | null;
  prosemSem1: ProsemData | null;
  prosemSem2: ProsemData | null;
  kktpData: KKTPData | null;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}) => {
  const { activeWorkspace, duplicateWorkspace, archiveWorkspace } = useWorkspace();
  const { user, isAdmin } = useAuth();
  const { confirm, prompt } = useConfirm();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);

  const handleArchive = async () => {
    if (!activeWorkspace) return;
    const confirmed = await confirm({
      title: "Arsipkan Workspace?",
      description: `Arsipkan workspace "${activeWorkspace.subject} - Kelas ${activeWorkspace.grade}"?\n\nWorkspace akan disembunyikan dari daftar aktif. Anda dapat memulihkannya kapan saja dari section Arsip.`,
      confirmText: "Arsipkan"
    });
    if (!confirmed) return;
    setIsArchiving(true);
    const ok = await archiveWorkspace(activeWorkspace.id);
    setIsArchiving(false);
    if (ok) toast.success('Workspace diarsipkan. Lihat section Arsip untuk memulihkan.');
    else toast.error('Gagal mengarsipkan workspace.');
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <FolderOpenIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-black mb-2">Selamat Datang!</h2>
        <p className="text-muted-foreground mb-6">
          Silakan pilih atau buat Workspace baru untuk mulai merencanakan pembelajaran. Workspace memisahkan data antar kelas dan mata pelajaran.
        </p>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          Buat Workspace Pertama
        </button>
        <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      </div>
    );
  }

  // Calculate actual progress data
  const defaultJpPerMeeting = 2; // Can be dynamic later

  let totalPlannedJp = 0;
  let createdJp = 0;
  let missingModules = 0;

  const processProsem = (prosem: ProsemData | null) => {
    if (!prosem) return;
    prosem.rows.forEach(row => {
      totalPlannedJp += row.alokasi_jp;
      const meetingCount = Math.ceil(row.alokasi_jp / defaultJpPerMeeting);
      for (let i = 1; i <= meetingCount; i++) {
        const jpForThisMeeting = i === meetingCount && row.alokasi_jp % defaultJpPerMeeting !== 0 
          ? row.alokasi_jp % defaultJpPerMeeting 
          : defaultJpPerMeeting;
          
        if (row.generated_meetings?.[i]) {
          createdJp += jpForThisMeeting;
        } else {
          missingModules += 1;
        }
      }
    });
  };

  processProsem(prosemSem1);
  processProsem(prosemSem2);

  const progressData = {
    totalPlannedJp: totalPlannedJp || (protaData ? protaData.total_jp_sem1 + protaData.total_jp_sem2 : 0),
    createdJp,
    missingModules,
    protaDone: !!protaData,
    prosemDone: !!prosemSem1 || !!prosemSem2,
    kktpCoverage: `${kktpData?.kktp?.length || 0}/${protaData?.prota?.length || 0} TP`,
  };

  const totalProtaJp = protaData ? (protaData.total_jp_sem1 + protaData.total_jp_sem2) : 0;
  const isMismatch = (protaData && (prosemSem1 || prosemSem2)) && totalProtaJp !== totalPlannedJp;

  const percentage = progressData.totalPlannedJp > 0 ? Math.round((progressData.createdJp / progressData.totalPlannedJp) * 100) : 0;

  let ctaText = 'Lanjutkan Pembelajaran';
  let ctaAction = () => onNavigate('modul');

  if (!progressData.protaDone) {
    ctaText = 'Mulai Perencanaan (Prota)';
    ctaAction = () => onNavigate('perencanaan');
  } else if (!progressData.prosemDone) {
    ctaText = 'Susun Program Semester';
    ctaAction = () => onNavigate('perencanaan');
  } else if (progressData.createdJp === 0) {
    ctaText = 'Mulai Membuat Modul';
    ctaAction = () => onNavigate('modul');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isLocked && (
        <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4 flex items-center justify-between shadow-brutal-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Mode Preview</h3>
              <p className="text-amber-800 text-sm">Anda hanya dapat melihat Workspace. Upgrade ke PRO untuk mengaktifkan pembuatan Modul Ajar dan fitur Perencanaan.</p>
            </div>
          </div>
          {onShowUpsell && (
            <button onClick={onShowUpsell} className="btn btn-primary whitespace-nowrap">
              Upgrade PRO
            </button>
          )}
        </div>
      )}

      <div className="workspace-card">
        <div>
          <h1 className="workspace-title">{activeWorkspace.subject}</h1>
          <p className="workspace-meta">
            Kelas {activeWorkspace.grade} • Fase {activeWorkspace.phase} • {activeWorkspace.academic_year}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-secondary !px-3">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-medium">
              <DropdownMenuItem onClick={() => onNavigate('settings')} className="cursor-pointer py-2">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan Workspace
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={async () => {
                  const newYear = await prompt({
                    title: "Duplikasi Workspace",
                    description: "Masukkan Tahun Ajaran baru",
                    inputPlaceholder: "contoh: 2025/2026",
                    defaultValue: "2025/2026"
                  });
                  if (newYear) {
                    duplicateWorkspace(activeWorkspace.id, newYear).then((success) => {
                      if (success) toast.success('Workspace berhasil diduplikasi!');
                      else toast.error('Gagal menduplikasi workspace.');
                    });
                  }
                }}
                className="cursor-pointer py-2"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplikasi Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(isAdmin || user?.email === 'jagofeed@gmail.com') && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsPublishModalOpen(true)}
                    className="cursor-pointer py-2 text-green-700 focus:text-green-800 focus:bg-green-50"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Publish ke Toko
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleArchive}
                disabled={isArchiving}
                className="cursor-pointer py-2 text-amber-600 focus:text-amber-700 focus:bg-amber-50"
              >
                <Archive className="w-4 h-4 mr-2" />
                {isArchiving ? 'Mengarsipkan...' : 'Arsipkan Workspace'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <StorePublishModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        protaData={protaData}
        prosemSem1={prosemSem1}
        prosemSem2={prosemSem2}
        formData={{
          mataPelajaran: activeWorkspace.subject,
          kelas: activeWorkspace.grade,
          fase: activeWorkspace.phase,
        } as FormData}
      />

      {isMismatch && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3 shadow-brutal-sm">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-lg">Health Check Perencanaan: Ada Ketidaksesuaian!</h4>
            <p className="text-red-700 mt-1">
              Total Jam Pelajaran (JP) yang direncanakan di Program Tahunan (<b>{totalProtaJp} JP</b>) 
              berbeda dengan yang dialokasikan di Program Semester (<b>{totalPlannedJp} JP</b>).
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 border-red-500 text-red-700 hover:bg-red-100"
              onClick={() => onNavigate('planning')}
            >
              Perbaiki Perencanaan
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planning Status Card */}
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Status Perencanaan
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-foreground/10">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">Program Tahunan</span>
              </div>
              {progressData.protaDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <span className="badge badge-warning">Belum ada</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-foreground/10">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">Program Semester</span>
              </div>
              {progressData.prosemDone ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <span className="badge badge-warning">Belum ada</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-foreground/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">KKTP Tersedia</span>
              </div>
              <span className="font-bold">{progressData.kktpCoverage}</span>
            </div>
          </div>

          <button 
            className="btn btn-secondary w-full mt-6 justify-center" 
            onClick={() => onNavigate('perencanaan')}
          >
            Buka Perencanaan
          </button>
        </div>

        {/* Module Progress Card */}
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Progres Modul Ajar
          </h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-muted-foreground">Semester 1</span>
              <span className="font-bold">{progressData.createdJp} / {progressData.totalPlannedJp} JP</span>
            </div>
            <div className="progress-wrap">
              <div 
                className={`progress-fill ${percentage === 100 ? 'done' : ''}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-semibold mb-1">Modul Tersedia</p>
              <p className="text-2xl font-black text-green-800">{progressData.createdJp} <span className="text-sm font-normal">JP</span></p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 font-semibold mb-1">Belum Dibuat</p>
              <p className="text-2xl font-black text-yellow-800">{progressData.totalPlannedJp - progressData.createdJp} <span className="text-sm font-normal">JP</span></p>
            </div>
          </div>

          {progressData.missingModules > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Perhatian</p>
                <p className="text-xs text-amber-700 mt-0.5">Ada {progressData.missingModules} pertemuan yang belum mempunyai Modul Ajar.</p>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary w-full mt-6 justify-center"
            onClick={ctaAction}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper icon
function FolderOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
