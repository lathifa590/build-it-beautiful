import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { SchoolMeetingFullDetail, SchoolDocument } from '@/types/school';
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
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useV2Export } from '@/hooks/useV2Export';
import { useSchool } from '@/contexts/SchoolContext';
import { schoolApi } from '@/lib/school-api';
import { V2ExportDialog } from '@/components/modul/V2ExportDialog';
import type { V2ExportScope, V2ExportFormat } from '@/lib/pertemuan-export';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  const { school } = useSchool();
  const [activeJenis, setActiveJenis] = useState<JenisDokumenPertemuan>('modul');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // State Kurasi & Review Mutu Waka
  const [schoolDoc, setSchoolDoc] = useState<SchoolDocument | null>(null);
  const [isLoadingSchoolDoc, setIsLoadingSchoolDoc] = useState<boolean>(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'revision' | 'template'>('approved');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [checklist, setChecklist] = useState({
    cp_tp_sesuai: true,
    waktu_sesuai: true,
    asesmen_lengkap: true,
    diferensiasi_ada: true,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const { meeting, workspace, documents } = meetingDetail;
  const letterheadUrl = school?.kop_logo_url || null;
  const isLetterheadEnabled = Boolean(letterheadUrl);

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
      namaSekolah: school?.name || workspace.school_name || 'Sekolah',
      tahunAjaran: workspace.academic_year || '2026/2027',
      semester: '1',
    };
  }, [meeting, workspace, school?.name]);

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
    letterheadUrl,
    isLetterheadEnabled,
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

  const fetchSchoolDoc = useCallback(async () => {
    const currentDoc = documents[activeJenis];
    if (!school?.id || !currentDoc?.document_id) {
      setSchoolDoc(null);
      return;
    }
    setIsLoadingSchoolDoc(true);
    try {
      const doc = await schoolApi.getSchoolDocumentBySourceId(school.id, currentDoc.document_id);
      setSchoolDoc(doc);
      if (doc) {
        setReviewStatus(doc.is_template ? 'template' : (doc.status as any) || 'approved');
        setReviewNotes(doc.review_notes || '');
      } else {
        setReviewStatus('approved');
        setReviewNotes('');
      }
    } catch (err) {
      console.error('Error fetching school doc for review:', err);
    } finally {
      setIsLoadingSchoolDoc(false);
    }
  }, [school?.id, documents, activeJenis]);

  useEffect(() => {
    fetchSchoolDoc();
  }, [fetchSchoolDoc]);

  const handlePromoteCurrent = async () => {
    const currentDoc = documents[activeJenis];
    if (!currentDoc?.document_id || !onPromoteTemplate) return;
    setIsPromoting(true);
    try {
      await onPromoteTemplate(currentDoc.document_id, activeJenis);
      await fetchSchoolDoc();
    } finally {
      setIsPromoting(false);
    }
  };

  const handleSubmitReview = async () => {
    const currentDoc = documents[activeJenis];
    if (!school?.id || !currentDoc?.document_id) return;
    setIsSubmittingReview(true);
    try {
      const res = await schoolApi.reviewMeetingComponent({
        schoolId: school.id,
        documentId: currentDoc.document_id,
        status: reviewStatus,
        notes: reviewNotes,
        isTemplate: reviewStatus === 'template',
        checklist,
      });

      if (res.success) {
        toast.success(
          reviewStatus === 'approved'
            ? 'Perangkat ajar berhasil disetujui (Layak)!'
            : reviewStatus === 'template'
            ? 'Perangkat ajar berhasil disetujui sebagai Template Resmi Sekolah!'
            : 'Catatan revisi berhasil disimpan untuk ditinjau guru!'
        );
        await fetchSchoolDoc();
        setIsReviewDialogOpen(false);
      } else {
        toast.error(res.message || 'Gagal menyimpan hasil kurasi');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan kurasi');
    } finally {
      setIsSubmittingReview(false);
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

            {canReview && currentDocExists && (
              <Button
                size="sm"
                onClick={() => setIsReviewDialogOpen(true)}
                className="h-9 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
                title="Buka rubrik kurasi mutu perangkat ajar Waka Kurikulum"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Kurasi Mutu Waka</span>
              </Button>
            )}

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
          <div className="space-y-1.5">
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
              <span className="text-xs font-bold text-muted-foreground">•</span>
              {/* Badge Status Kurasi Terkini */}
              {isLoadingSchoolDoc ? (
                <Badge variant="outline" className="text-xs font-bold border-foreground/30">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Memeriksa...
                </Badge>
              ) : schoolDoc ? (
                schoolDoc.is_template ? (
                  <Badge className="bg-amber-100 text-amber-950 border-amber-600 border-2 font-black text-xs gap-1 shadow-xs">
                    <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>Template Resmi</span>
                  </Badge>
                ) : schoolDoc.status === 'approved' ? (
                  <Badge className="bg-emerald-100 text-emerald-950 border-emerald-600 border-2 font-black text-xs gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Disetujui Waka</span>
                  </Badge>
                ) : schoolDoc.status === 'revision' ? (
                  <Badge className="bg-rose-100 text-rose-950 border-rose-600 border-2 font-black text-xs gap-1 shadow-xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Perlu Revisi</span>
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-950 border-blue-600 border-2 font-black text-xs gap-1 shadow-xs">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Menunggu Kurasi</span>
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="border-2 border-dashed border-foreground/30 font-bold text-muted-foreground text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Belum Dikurasi</span>
                </Badge>
              )}
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

        {/* Feedback / Catatan Kurasi Banner jika ada */}
        {schoolDoc?.review_notes && (
          <div className="p-3.5 rounded-xl border-2 border-foreground bg-amber-50/90 shadow-brutal-sm flex items-start gap-3 mt-2">
            <div className="w-8 h-8 rounded-lg bg-amber-200 border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
              <MessageSquare className="w-4 h-4 text-amber-950" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-950">
                  Catatan Masukan Waka / Tim Kurikulum:
                </span>
                {schoolDoc.reviewed_at && (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {new Date(schoolDoc.reviewed_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap">
                {schoolDoc.review_notes}
              </p>
            </div>
          </div>
        )}
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
              letterheadUrl={letterheadUrl}
              isLetterheadEnabled={isLetterheadEnabled}
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

      {/* 5. MODAL KURASI MUTU WAKA KURIKULUM */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-xl border-2 border-foreground shadow-brutal rounded-2xl bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              Kurasi Mutu & Supervisi Perangkat Ajar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rubrik kurasi penjaminan mutu kurikulum untuk komponen{' '}
              <strong className="text-foreground uppercase">
                {TAB_CONFIG.find((t) => t.id === activeJenis)?.label}
              </strong>{' '}
              (Pertemuan {meeting.sequence} - {workspace.subject}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Rubrik 4 Checklist */}
            <div className="space-y-2.5 bg-muted/40 p-3.5 rounded-xl border-2 border-foreground/20">
              <span className="text-xs font-black text-foreground block">
                Rubrik 4 Poin Keselarasan Standar Mutu Sekolah:
              </span>
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
                  <Checkbox
                    checked={checklist.cp_tp_sesuai}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, cp_tp_sesuai: !!checked }))
                    }
                    className="mt-0.5 border-2 border-foreground"
                  />
                  <div>
                    <span className="font-black text-foreground">1. CP & TP Selaras dan Terukur</span>
                    <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                      Tujuan pembelajaran terukur, jelas, dan selaras dengan capaian fase kurikulum.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
                  <Checkbox
                    checked={checklist.waktu_sesuai}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, waktu_sesuai: !!checked }))
                    }
                    className="mt-0.5 border-2 border-foreground"
                  />
                  <div>
                    <span className="font-black text-foreground">2. Alokasi Waktu & Sintaks Realistis</span>
                    <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                      Tahapan pendahuluan, inti, dan penutup proporsional dengan alokasi {meeting.planned_jp || 2} JP.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
                  <Checkbox
                    checked={checklist.asesmen_lengkap}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, asesmen_lengkap: !!checked }))
                    }
                    className="mt-0.5 border-2 border-foreground"
                  />
                  <div>
                    <span className="font-black text-foreground">3. Asesmen & Instrumen Terukur</span>
                    <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                      Dilengkapi kriteria/rubrik penilaian yang aplikatif dan relevan dengan materi ajar.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-foreground">
                  <Checkbox
                    checked={checklist.diferensiasi_ada}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, diferensiasi_ada: !!checked }))
                    }
                    className="mt-0.5 border-2 border-foreground"
                  />
                  <div>
                    <span className="font-black text-foreground">4. Pembelajaran Terdiferensiasi / Aktif</span>
                    <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                      Aktivitas pembelajaran mendorong keaktifan siswa dan variasi kebutuhan belajar.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Pilihan Status */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-foreground">Keputusan Kurasi:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('approved')}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                    reviewStatus === 'approved'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-brutal-sm'
                      : 'border-foreground/20 hover:border-foreground/50 bg-card text-foreground font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Disetujui</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Layak digunakan mengajar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStatus('revision')}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                    reviewStatus === 'revision'
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-black shadow-brutal-sm'
                      : 'border-foreground/20 hover:border-foreground/50 bg-card text-foreground font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Perlu Revisi</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Butuh perbaikan guru.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStatus('template')}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                    reviewStatus === 'template'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-black shadow-brutal-sm'
                      : 'border-foreground/20 hover:border-foreground/50 bg-card text-foreground font-bold'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black mb-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Template Resmi</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Standar percontohan sekolah.
                  </p>
                </button>
              </div>
            </div>

            {/* Catatan Feedback */}
            <div className="space-y-1.5">
              <Label htmlFor="review-notes" className="text-xs font-black text-foreground">
                Catatan Masukan & Saran Pembinaan (Opsional):
              </Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Misal: 'Kegiatan apersepsi sangat kontekstual. Pada bagian asesmen, tambahkan rubrik penilaian observasi siswa.'"
                rows={3}
                className="text-xs border-2 border-foreground resize-none rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isSubmittingReview}
              className="h-9 text-xs font-bold border-2 border-foreground rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
              className="h-9 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
            >
              {isSubmittingReview ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Hasil Kurasi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
