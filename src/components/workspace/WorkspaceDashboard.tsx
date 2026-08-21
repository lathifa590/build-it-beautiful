import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, CheckCircle2, AlertTriangle, FileText, BarChart3, Settings, MoreVertical, Copy, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { ProtaData, ProsemData, KKTPData } from '@/types/modul';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

export const WorkspaceDashboard = ({ 
  onNavigate,
  protaData,
  prosemSem1,
  prosemSem2,
  kktpData,
}: { 
  onNavigate: (path: string) => void;
  protaData: ProtaData | null;
  prosemSem1: ProsemData | null;
  prosemSem2: ProsemData | null;
  kktpData: KKTPData | null;
}) => {
  const { activeWorkspace, duplicateWorkspace } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <FolderOpenIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-black mb-2">Selamat Datang!</h2>
        <p className="text-muted-foreground mb-6">
          Silakan pilih atau buat Workspace baru untuk mulai merencanakan pembelajaran. Workspace memisahkan data antar kelas dan mata pelajaran.
        </p>
        <Button size="lg" className="border-2 border-foreground shadow-brutal font-bold" onClick={() => setIsCreateModalOpen(true)}>
          Buat Workspace Pertama
        </Button>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black">{activeWorkspace.subject}</h1>
          <p className="text-muted-foreground text-lg">
            Kelas {activeWorkspace.grade} • Fase {activeWorkspace.phase} • {activeWorkspace.academic_year}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-2 border-foreground hover:bg-muted">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-medium">
              <DropdownMenuItem onClick={() => onNavigate('settings')} className="cursor-pointer py-2">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan Workspace
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  const newYear = window.prompt("Masukkan Tahun Ajaran baru (contoh: 2025/2026):", "2025/2026");
                  if (newYear) {
                    duplicateWorkspace(activeWorkspace.id, newYear).then((success) => {
                      if (success) alert("Workspace berhasil diduplikasi!");
                      else alert("Gagal menduplikasi workspace.");
                    });
                  }
                }}
                className="cursor-pointer py-2"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplikasi Workspace
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                <Archive className="w-4 h-4 mr-2" />
                Arsipkan Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
        <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal p-6">
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
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">Belum ada</span>
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
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">Belum ada</span>
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

          <Button 
            className="w-full mt-6 border-2 border-foreground font-bold" 
            variant="outline"
            onClick={() => onNavigate('perencanaan')}
          >
            Buka Perencanaan
          </Button>
        </div>

        {/* Module Progress Card */}
        <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Progres Modul Ajar
          </h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-muted-foreground">Semester 1</span>
              <span className="font-bold">{progressData.createdJp} / {progressData.totalPlannedJp} JP</span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden border border-foreground/20">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
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

          <Button 
            className="w-full border-2 border-foreground font-bold"
            onClick={ctaAction}
          >
            {ctaText}
          </Button>
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
