import { useState, useEffect } from 'react';
import { Calendar, Loader2, FileText, ClipboardList, ListChecks, PenLine, CalendarDays, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KalenderPendidikanForm } from './KalenderPendidikanForm';
import { ProtaPreview } from './ProtaPreview';
import { KKTPPreview } from './KKTPPreview';
import { ProsemEventForm } from './ProsemEventForm';
import { ProsemPreview } from './ProsemPreview';
import type { KalenderPendidikan, ProtaData, ProtaItem, KKTPData, ProsemData, ProsemEvent, FormData } from '@/types/modul';

interface PlanningTabProps {
  formData: FormData;
  kalender: KalenderPendidikan;
  onKalenderChange: (kalender: KalenderPendidikan) => void;
  protaData: ProtaData | null;
  isGeneratingProta: boolean;
  onGenerateProta: () => void;
  onExportProtaWord: () => void;
  isExportingProta?: boolean;
  // KKTP props
  kktpData: KKTPData | null;
  isGeneratingKKTP: boolean;
  onGenerateKKTP: (tpList: string[]) => void;
  onExportKKTPWord: () => void;
  isExportingKKTP?: boolean;
  // Prosem props
  prosemSem1: ProsemData | null;
  prosemSem2: ProsemData | null;
  prosemEvents: ProsemEvent[];
  isGeneratingProsem: boolean;
  onGenerateProsem: () => void;
  onExportProsemWord: (semester: 1 | 2) => void;
  isExportingProsem?: boolean;
  onProsemEventsChange: (events: ProsemEvent[]) => void;
  // Data change handlers (inline edit)
  onProtaDataChange?: (data: ProtaData | null) => void;
  onKktpDataChange?: (data: KKTPData | null) => void;
  // Create modul from TP
  onCreateModulFromTP?: (item: ProtaItem) => void;
}

type PlanningSubTab = 'prota' | 'prosem' | 'kktp';

export const PlanningTab = ({
  formData,
  kalender,
  onKalenderChange,
  protaData,
  isGeneratingProta,
  onGenerateProta,
  onExportProtaWord,
  isExportingProta,
  kktpData,
  isGeneratingKKTP,
  onGenerateKKTP,
  onExportKKTPWord,
  isExportingKKTP,
  prosemSem1,
  prosemSem2,
  prosemEvents,
  isGeneratingProsem,
  onGenerateProsem,
  onExportProsemWord,
  isExportingProsem,
  onProsemEventsChange,
  onProtaDataChange,
  onKktpDataChange,
  onCreateModulFromTP,
}: PlanningTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<PlanningSubTab>('prota');
  const [kktpSource, setKktpSource] = useState<'prota' | 'manual'>(protaData ? 'prota' : 'manual');
  const [manualTP, setManualTP] = useState('');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<'prota' | 'kktp' | 'prosem' | null>(null);

  useEffect(() => {
    if (protaData) setKktpSource('prota');
  }, [protaData]);

  const subTabs: { id: PlanningSubTab; label: string; enabled: boolean; icon: React.ReactNode }[] = [
    { id: 'prota', label: 'Program Tahunan', enabled: true, icon: <Calendar className="w-3 h-3" /> },
    { id: 'kktp', label: 'KKTP', enabled: true, icon: <ClipboardList className="w-3 h-3" /> },
    { id: 'prosem', label: 'Program Semester', enabled: true, icon: <CalendarDays className="w-3 h-3" /> },
  ];

  const canGenerateProta = formData.capaianPembelajaran && formData.mataPelajaran;

  const handleGenerateKKTP = () => {
    let tpList: string[] = [];

    if (kktpSource === 'prota' && protaData) {
      tpList = protaData.prota.map(item => item.tujuan_pembelajaran);
    } else {
      tpList = manualTP
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    if (tpList.length === 0) return;
    onGenerateKKTP(tpList);
  };

  const canGenerateKKTP = kktpSource === 'prota'
    ? protaData && protaData.prota.length > 0
    : manualTP.trim().length > 0;

  const handleProtaClick = () => {
    if (protaData) {
      setShowRegenerateConfirm('prota');
    } else {
      onGenerateProta();
    }
  };

  const handleKKTPClick = () => {
    if (kktpData) {
      setShowRegenerateConfirm('kktp');
    } else {
      handleGenerateKKTP();
    }
  };

  const handleProsemClick = () => {
    if (prosemSem1 || prosemSem2) {
      setShowRegenerateConfirm('prosem');
    } else {
      onGenerateProsem();
    }
  };

  const handleConfirmRegenerate = () => {
    if (showRegenerateConfirm === 'prota') onGenerateProta();
    else if (showRegenerateConfirm === 'kktp') handleGenerateKKTP();
    else if (showRegenerateConfirm === 'prosem') onGenerateProsem();
    setShowRegenerateConfirm(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={!!showRegenerateConfirm} onOpenChange={(open) => !open && setShowRegenerateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {showRegenerateConfirm === 'prota' ? 'Program Tahunan' : showRegenerateConfirm === 'kktp' ? 'KKTP' : 'Program Semester'} yang sudah ada akan diganti dengan hasil generate baru. Perubahan manual yang sudah dilakukan akan hilang. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>Ya, Generate Ulang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sub-tabs */}
      <div className="flex border-b-2 border-foreground/20 px-4 pt-3 bg-card">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.enabled && setActiveSubTab(tab.id)}
            disabled={!tab.enabled}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'border-primary text-primary'
                : tab.enabled
                  ? 'border-transparent text-muted-foreground hover:text-foreground'
                  : 'border-transparent text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            {tab.icon}
            {tab.label}
            {!tab.enabled && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">Segera</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* === PROTA === */}
        {activeSubTab === 'prota' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-card border-2 border-foreground rounded-xl p-5 shadow-brutal-sm">
              <KalenderPendidikanForm kalender={kalender} onChange={onKalenderChange} />

              <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-foreground/10">
                <p className="text-xs text-muted-foreground mb-1 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Data dari Form Utama
                </p>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Mapel:</span> <span className="font-medium">{formData.mataPelajaran || '-'}</span></p>
                  <p><span className="text-muted-foreground">Fase/Kelas:</span> <span className="font-medium">{formData.fase ? `Fase ${formData.fase}` : '-'} / {formData.kelas || '-'}</span></p>
                  <p><span className="text-muted-foreground">CP:</span> <span className="font-medium">{formData.capaianPembelajaran ? `${formData.capaianPembelajaran.substring(0, 80)}...` : 'Belum dipilih'}</span></p>
                </div>
              </div>

              <Button
                onClick={handleProtaClick}
                disabled={isGeneratingProta || !canGenerateProta}
                className="w-full mt-4 border-2 border-foreground shadow-brutal-sm font-bold"
              >
                {isGeneratingProta ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Prota...</>
                ) : (
                  <><Calendar className="w-4 h-4 mr-2" />{protaData ? 'Regenerate Program Tahunan' : 'Generate Program Tahunan'}</>
                )}
              </Button>
              {!canGenerateProta && (
                <p className="text-xs text-destructive mt-2">
                  * Isi Mata Pelajaran dan pilih CP di form utama terlebih dahulu
                </p>
              )}
            </div>

            {protaData && (
              <ProtaPreview
                protaData={protaData}
                formData={formData}
                onExportWord={onExportProtaWord}
                isExporting={isExportingProta}
                onDataChange={onProtaDataChange ? (data) => onProtaDataChange(data) : undefined}
                onCreateModul={onCreateModulFromTP}
                kurikulum={formData.kurikulum}
              />
            )}
          </div>
        )}

        {/* === KKTP === */}
        {activeSubTab === 'kktp' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-card border-2 border-foreground rounded-xl p-5 shadow-brutal-sm">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Sumber Tujuan Pembelajaran
              </h3>

              {/* TP Source selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setKktpSource('prota')}
                  disabled={!protaData}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border-2 transition-colors flex items-center justify-center gap-1.5 ${
                    kktpSource === 'prota'
                      ? 'border-primary bg-primary/10 text-primary'
                      : protaData
                        ? 'border-foreground/20 text-muted-foreground hover:border-foreground/40'
                        : 'border-foreground/10 text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  Dari Prota
                  {!protaData && <span className="text-[10px] ml-1">(belum ada)</span>}
                </button>
                <button
                  onClick={() => setKktpSource('manual')}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border-2 transition-colors flex items-center justify-center gap-1.5 ${
                    kktpSource === 'manual'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-foreground/20 text-muted-foreground hover:border-foreground/40'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Input Manual
                </button>
              </div>

              {/* Prota TP list preview */}
              {kktpSource === 'prota' && protaData && (
                <div className="p-3 bg-muted/50 rounded-lg border border-foreground/10 mb-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {protaData.prota.length} Tujuan Pembelajaran dari Prota:
                  </p>
                  <ol className="text-xs space-y-1 list-decimal list-inside">
                    {protaData.prota.map((item) => (
                      <li key={item.no} className="text-foreground/80">
                        {item.tujuan_pembelajaran.substring(0, 100)}
                        {item.tujuan_pembelajaran.length > 100 ? '...' : ''}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Manual input */}
              {kktpSource === 'manual' && (
                <div className="mb-4">
                  <Textarea
                    value={manualTP}
                    onChange={(e) => setManualTP(e.target.value)}
                    placeholder="Masukkan Tujuan Pembelajaran (satu per baris):&#10;&#10;Peserta didik mampu memahami konsep bilangan...&#10;Peserta didik mampu menganalisis pola dan hubungan..."
                    className="min-h-[150px] text-sm border-2 border-foreground/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tulis satu TP per baris. Terdeteksi: {manualTP.split('\n').filter(l => l.trim()).length} TP
                  </p>
                </div>
              )}

              {/* Info mapel */}
              <div className="p-3 bg-muted/50 rounded-lg border border-foreground/10 mb-4">
                <p className="text-xs text-muted-foreground mb-1 font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Data dari Form Utama
                </p>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Mapel:</span> <span className="font-medium">{formData.mataPelajaran || '-'}</span></p>
                  <p><span className="text-muted-foreground">Fase/Kelas:</span> <span className="font-medium">{formData.fase ? `Fase ${formData.fase}` : '-'} / {formData.kelas || '-'}</span></p>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleKKTPClick}
                disabled={isGeneratingKKTP || !canGenerateKKTP}
                className="w-full border-2 border-foreground shadow-brutal-sm font-bold"
              >
                {isGeneratingKKTP ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating KKTP...</>
                ) : (
                  <><ClipboardList className="w-4 h-4 mr-2" />{kktpData ? 'Regenerate KKTP' : 'Generate KKTP'}</>
                )}
              </Button>
            </div>

            {/* KKTP Preview */}
            {kktpData && (
              <KKTPPreview
                kktpData={kktpData}
                formData={formData}
                onExportWord={onExportKKTPWord}
                isExporting={isExportingKKTP}
                onDataChange={onKktpDataChange ? (data) => onKktpDataChange(data) : undefined}
              />
            )}
          </div>
        )}

        {/* === PROSEM === */}
        {activeSubTab === 'prosem' && (
          <div className="max-w-full mx-auto space-y-6">
            {!protaData ? (
              <div className="bg-card border-2 border-foreground rounded-xl p-8 shadow-brutal-sm text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="font-bold text-sm">Generate Prota Terlebih Dahulu</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Program Semester membutuhkan data dari Program Tahunan (Prota). Buka tab Prota dan generate terlebih dahulu.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 text-xs border-2 border-foreground"
                  onClick={() => setActiveSubTab('prota')}
                >
                  <Calendar className="w-3 h-3 mr-1" /> Buka Tab Prota
                </Button>
              </div>
            ) : (
              <>
                {/* Event Form */}
                <div className="bg-card border-2 border-foreground rounded-xl p-5 shadow-brutal-sm">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Konfigurasi Event & Libur
                  </h3>

                  <ProsemEventForm events={prosemEvents} onChange={onProsemEventsChange} />

                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-foreground/10">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Prota:</span> {protaData.prota.length} TP |
                      <span className="font-semibold ml-2">Sem 1:</span> {protaData.total_jp_sem1} JP |
                      <span className="font-semibold ml-2">Sem 2:</span> {protaData.total_jp_sem2} JP |
                      <span className="font-semibold ml-2">JP/Minggu:</span> {kalender.jpPerMinggu}
                    </p>
                  </div>

                  <Button
                    onClick={handleProsemClick}
                    disabled={isGeneratingProsem}
                    className="w-full mt-4 border-2 border-foreground shadow-brutal-sm font-bold"
                  >
                    {isGeneratingProsem ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Prosem...</>
                    ) : (
                      <><CalendarDays className="w-4 h-4 mr-2" />{(prosemSem1 || prosemSem2) ? 'Regenerate Program Semester' : 'Generate Program Semester'}</>
                    )}
                  </Button>
                </div>

                {/* Prosem Preview */}
                {(prosemSem1 || prosemSem2) && (
                  <ProsemPreview
                    prosemSem1={prosemSem1}
                    prosemSem2={prosemSem2}
                    formData={formData}
                    onExportWord={onExportProsemWord}
                    isExporting={isExportingProsem}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
