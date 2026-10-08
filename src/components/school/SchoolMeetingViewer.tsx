import React, { useState, useRef, useMemo, useCallback } from 'react';
import type { SchoolMeetingFullDetail } from '@/types/school';
import type {
  FormData,
  GeneratedSteps,
  LKPDData,
  AsesmenData,
  MateriData,
  TindakLanjutData,
  BankSoalData,
  JenisDokumenPertemuan,
  GenerationResultV2,
} from '@/types/modul';
import { DocumentPreview } from '@/components/modul/DocumentPreview';
import { DEFAULT_FORM_DATA } from '@/lib/constants';
import {
  ArrowLeft,
  Printer,
  FileDown,
  Star,
  CheckCircle2,
  Clock,
  UserCheck,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useV2Export } from '@/hooks/useV2Export';
import { V2ExportDialog } from '@/components/modul/V2ExportDialog';
import type { V2ExportScope, V2ExportFormat } from '@/lib/pertemuan-export';

interface SchoolMeetingViewerProps {
  meetingDetail: SchoolMeetingFullDetail;
  onBack: () => void;
  canReview?: boolean;
  onPromoteTemplate?: (documentId: string, docType: string) => Promise<void>;
}

const V2_TAB_MAP: Record<JenisDokumenPertemuan, string> = {
  modul: 'modul',
  lkpd: 'lkpd',
  asesmen: 'asesmen',
  materi: 'materi',
  soal: 'bank-soal',
  refleksi: 'tindak-lanjut',
};

const TAB_CONFIG: { id: JenisDokumenPertemuan; label: string }[] = [
  { id: 'modul', label: 'Modul Ajar' },
  { id: 'lkpd', label: 'LKPD' },
  { id: 'asesmen', label: 'Asesmen' },
  { id: 'soal', label: 'Bank Soal' },
  { id: 'materi', label: 'Materi' },
  { id: 'refleksi', label: 'Refleksi' },
];

export const SchoolMeetingViewer: React.FC<SchoolMeetingViewerProps> = ({
  meetingDetail,
  onBack,
  canReview = false,
  onPromoteTemplate,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeJenis, setActiveJenis] = useState<JenisDokumenPertemuan>('modul');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  const { meeting, workspace, documents } = meetingDetail;

  // Bangun formData sintetis agar DocumentPreview ter-render dengan identitas lengkap
  const formData: FormData = useMemo(() => {
    const jpDuration = workspace.jp_duration_minutes || (workspace.phase === 'F' || workspace.phase === 'E' ? 45 : 40);
    const totalMinutes = (meeting.planned_jp || 2) * jpDuration;

    return {
      ...DEFAULT_FORM_DATA,
      mataPelajaran: workspace.subject || '',
      fase: workspace.phase || '',
      kelas: workspace.grade || '',
      materi: meeting.materi_pokok || meeting.title || '',
      alokasiWaktu: `${meeting.planned_jp || 2} JP (${totalMinutes} Menit)`,
      namaPenyusun: workspace.teacher_name || 'Guru',
      namaSekolah: 'Sekolah',
      tahunAjaran: workspace.academic_year || '2024/2025',
      semester: '1',
    };
  }, [meeting, workspace]);

  // Ekstrak data masing-masing komponen
  const generatedSteps: GeneratedSteps = useMemo(() => {
    const raw = documents.modul?.content_json;
    if (!raw) return { pertemuan: [] } as unknown as GeneratedSteps;
    if (raw.pertemuan && Array.isArray(raw.pertemuan)) return raw as GeneratedSteps;
    return { pertemuan: [raw] } as unknown as GeneratedSteps;
  }, [documents.modul]);

  const lkpdData: LKPDData | null = documents.lkpd?.content_json || null;
  const asesmenData: AsesmenData | null = documents.asesmen?.content_json || null;
  const materiData: MateriData | null = documents.materi?.content_json || null;
  const bankSoalData: BankSoalData | null = documents.soal?.content_json || null;
  const tindakLanjutData: TindakLanjutData | null = documents.refleksi?.content_json || null;

  // Struktur V2 Generation Result untuk fitur Export
  const resultV2: GenerationResultV2 = useMemo(() => {
    return {
      modulPreface: {},
      pertemuanList: [
        {
          pertemuanId: meeting.id,
          nomorPertemuan: meeting.sequence || 1,
          modul: documents.modul?.content_json,
          lkpd: documents.lkpd?.content_json,
          asesmen: documents.asesmen?.content_json,
          materi: documents.materi?.content_json,
          soal: documents.soal?.content_json,
          refleksi: documents.refleksi?.content_json,
        },
      ],
    };
  }, [meeting, documents]);

  // Hook Export V2
  const v2Export = useV2Export({
    result: resultV2,
    formData,
    notify: (msg, type) => {
      if (type === 'error') toast.error(msg);
      else toast.success(msg);
    },
  });

  const handleRunExport = useCallback(
    async ({ scope, format }: { scope: V2ExportScope; format: V2ExportFormat }) => {
      const ok = await v2Export.runExport({
        scope,
        format,
        activePertemuanId: meeting.id,
        activeJenisDokumen: activeJenis,
      });
      if (ok) setShowExportModal(false);
    },
    [v2Export, meeting.id, activeJenis]
  );

  const handlePrint = () => {
    window.print();
  };

  const handlePromoteCurrent = async () => {
    const currentDoc = documents[activeJenis];
    if (!currentDoc?.document_id || !onPromoteTemplate) return;
    setIsPromoting(true);
    try {
      await onPromoteTemplate(currentDoc.document_id, activeJenis);
    } finally {
      setIsPromoting(false);
    }
  };

  const currentDocExists = !!documents[activeJenis];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & SUPERVISION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-card shadow-brutal-sm space-y-4">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-foreground/10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-black text-foreground hover:text-primary transition-all self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pertemuan</span>
          </button>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-9 text-xs font-bold border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="h-9 text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
              title="Download dokumen ke format Microsoft Word (.docx)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Dokumen (.docx)</span>
            </Button>

            {canReview && onPromoteTemplate && currentDocExists && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePromoteCurrent}
                disabled={isPromoting}
                className="h-9 text-xs font-black border-2 border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-950 shadow-brutal-sm rounded-xl gap-1.5"
                title="Tetapkan dokumen ini sebagai Template Resmi Sekolah"
              >
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{isPromoting ? 'Menyimpan...' : 'Jadikan Template Sekolah'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Meeting & Teacher Identity Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs font-black bg-[#fef08a] border-foreground">
                Pertemuan {meeting.sequence}
              </Badge>
              <span className="text-xs font-bold text-muted-foreground">•</span>
              <span className="text-xs font-black text-primary">
                {workspace.subject} • {workspace.grade} {workspace.phase ? `(Fase ${workspace.phase})` : ''}
              </span>
              <span className="text-xs font-bold text-muted-foreground">•</span>
              <span className="text-xs font-bold text-muted-foreground">
                Alokasi: {meeting.planned_jp || 2} JP
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-black text-foreground leading-snug">
              {meeting.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60 border-2 border-foreground/20 text-xs shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-xs shrink-0 border border-foreground">
              {workspace.teacher_name?.charAt(0) || 'G'}
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block leading-none">Penyusun:</span>
              <span className="font-black text-foreground">{workspace.teacher_name}</span>
              <span className="text-[10px] text-muted-foreground block">{workspace.teacher_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6-IN-1 SUB-DOCUMENT TABS (PERSIS SEPERTI DI WORKSPACE GURU) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-muted/70 rounded-2xl border-2 border-foreground shadow-brutal-sm overflow-x-auto">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeJenis === tab.id;
          const hasDoc = !!documents[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveJenis(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${
                isActive
                  ? 'bg-card text-foreground border-2 border-foreground shadow-brutal-sm'
                  : 'text-muted-foreground hover:text-foreground border-2 border-transparent hover:bg-card/40'
              }`}
            >
              <span>{tab.label}</span>
              {hasDoc ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" title="Dokumen lengkap" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30" title="Belum dibuat" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. DOCUMENT PREVIEW CONTENT (FORMAT CETAK RESMI A4) */}
      <div className="bg-muted/30 p-2 sm:p-6 rounded-2xl border-2 border-foreground shadow-brutal">
        {currentDocExists ? (
          <div className="max-w-4xl mx-auto bg-card rounded-2xl border-2 border-foreground shadow-brutal p-4 sm:p-10 min-h-[600px]">
            <DocumentPreview
              contentRef={contentRef}
              activeTab={V2_TAB_MAP[activeJenis]}
              formData={formData}
              generatedSteps={generatedSteps}
              lkpdData={lkpdData}
              asesmenData={asesmenData}
              materiData={materiData}
              tindakLanjutData={tindakLanjutData}
              bankSoalData={bankSoalData}
              isModulComplete={true}
              v2Mode={true}
              generatedImage={null}
              soalImage={null}
              letterheadUrl={null}
              isLetterheadEnabled={false}
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 border-2 border-foreground/30 flex items-center justify-center mx-auto text-muted-foreground">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-foreground">
              {TAB_CONFIG.find((t) => t.id === activeJenis)?.label} Belum Disusun
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guru penyusun belum menyelesaikan bagian {TAB_CONFIG.find((t) => t.id === activeJenis)?.label} untuk
              pertemuan ini. Anda dapat memeriksa tab komponen lainnya di atas.
            </p>
          </div>
        )}
      </div>

      {/* 4. EXPORT V2 MODAL */}
      <V2ExportDialog
        open={showExportModal}
        onOpenChange={setShowExportModal}
        currentJenis={activeJenis}
        onExport={handleRunExport}
      />
    </div>
  );
};
