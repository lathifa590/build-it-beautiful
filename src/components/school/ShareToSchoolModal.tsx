import React, { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { schoolApi } from '@/lib/school-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, School, Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareToSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentType: string;
  contentJson: Record<string, any>;
  workspaceId?: string;
  sourceDocumentId?: string;
  subject?: string;
  grade?: string;
  phase?: string;
  academicYear?: string;
  semester?: number;
  onShared?: () => void;
}

export const ShareToSchoolModal: React.FC<ShareToSchoolModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentType,
  contentJson,
  workspaceId,
  sourceDocumentId,
  subject,
  grade,
  phase,
  academicYear,
  semester,
  onShared,
}) => {
  const { school, isSchoolActive } = useSchool();
  const [title, setTitle] = useState(documentTitle || 'Modul Ajar Pembelajaran');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync title saat modal dibuka jika title berganti
  React.useEffect(() => {
    if (documentTitle) setTitle(documentTitle);
  }, [documentTitle, isOpen]);

  if (!isSchoolActive || !school) {
    return null;
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul dokumen tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await schoolApi.shareDocumentToSchool({
        school_id: school.id,
        title: title.trim(),
        document_type: documentType || 'modul',
        content_json: contentJson || {},
        workspace_id: workspaceId,
        source_document_id: sourceDocumentId,
        subject: subject || null,
        grade: grade || null,
        phase: phase || null,
        academic_year: academicYear || school.academic_year_active || null,
        semester: semester || null,
      });

      if (result.success) {
        toast.success(result.message || 'Berhasil dibagikan ke Bank Modul Sekolah!');
        onClose();
        if (onShared) onShared();
      } else {
        toast.error(result.message || 'Gagal membagikan modul');
      }
    } catch (err: any) {
      console.error('Error sharing to school bank:', err);
      toast.error(err?.message || 'Terjadi kesalahan saat membagikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'modul':
        return 'Modul Ajar (RPP+)';
      case 'lkpd':
        return 'Lembar Kerja (LKPD)';
      case 'asesmen':
        return 'Asesmen & Rubrik';
      case 'materi':
        return 'Bahan Bacaan Siswa';
      case 'refleksi':
        return 'Tindak Lanjut & Refleksi';
      case 'soal':
        return 'Bank Soal Evaluasi';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Bagikan ke Bank Modul Sekolah
              </DialogTitle>
              <DialogDescription className="text-xs">
                {school.name} • Tahun Ajaran {academicYear || school.academic_year_active || '2024/2025'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-4 py-2">
          {/* Info Card */}
          <div className="p-3 bg-muted/70 rounded-xl border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Tipe Dokumen:</span>
              <Badge variant="outline" className="font-bold bg-background text-[11px]">
                {getDocTypeBadge(documentType)}
              </Badge>
            </div>
            {subject && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Mata Pelajaran:</span>
                <span className="font-bold text-foreground">{subject}</span>
              </div>
            )}
            {(grade || phase) && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Kelas / Fase:</span>
                <span className="font-semibold text-foreground">
                  {grade ? `Kelas ${grade}` : ''} {phase ? `(Fase ${phase})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Input Judul */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Judul Dokumen di Bank Sekolah</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul Ajar Eksponen & Logaritma - Pertemuan 1"
              required
              disabled={isSubmitting}
              className="text-xs border-foreground/40 font-medium"
            />
          </div>

          {/* Garansi Copy-on-Share */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900 rounded-lg text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Prinsip Independensi Dokumen
            </p>
            <p className="text-[11px] leading-relaxed">
              Dokumen ini akan disalin sebagai arsip publik sekolah dan masuk ke antrean verifikasi mutu Waka Kurikulum. Workspace pribadi Anda tetap aman dan tidak akan terganggu.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-brutal-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Membagikan...
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Kirim ke Bank Sekolah
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
