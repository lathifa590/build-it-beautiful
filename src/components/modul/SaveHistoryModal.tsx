import { Save, Loader2, Check, X } from 'lucide-react';
import type { V2HistorySummary } from '@/lib/history-v2';
import { Button } from '@/components/ui/button';
import type { 
  GeneratedSteps, 
  LKPDData, 
  AsesmenData, 
  MateriData, 
  TindakLanjutData, 
  BankSoalData,
  ProtaData,
  KKTPData,
  ProsemData,
} from '@/types/modul';

interface ContentStatus {
  modul: GeneratedSteps | null;
  lkpd: LKPDData | null;
  asesmen: AsesmenData | null;
  materi: MateriData | null;
  bankSoal: BankSoalData | null;
  tindakLanjut: TindakLanjutData | null;
  prota: ProtaData | null;
  kktp: KKTPData | null;
  prosem: { sem1: ProsemData | null; sem2: ProsemData | null };
}

interface SaveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyName: string;
  setHistoryName: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  contentStatus: ContentStatus;
  selectedHistoryId?: string | null;
  selectedHistoryName?: string;
  onUpdate?: () => void;
  isUpdating?: boolean;
  /** Ringkasan mode "Dokumen per Pertemuan" (V2). */
  v2Summary?: V2HistorySummary | null;
}

export const SaveHistoryModal = ({
  isOpen,
  onClose,
  historyName,
  setHistoryName,
  onSave,
  isSaving,
  contentStatus,
  selectedHistoryId,
  selectedHistoryName,
  onUpdate,
  isUpdating,
  v2Summary,
}: SaveHistoryModalProps) => {
  if (!isOpen) return null;

  const contentItems = [
    { key: 'modul', label: 'Modul Ajar', data: contentStatus.modul },
    { key: 'lkpd', label: 'LKPD', data: contentStatus.lkpd },
    { key: 'asesmen', label: 'Asesmen', data: contentStatus.asesmen },
    { key: 'materi', label: 'Materi', data: contentStatus.materi },
    { key: 'bankSoal', label: 'Bank Soal', data: contentStatus.bankSoal },
    { key: 'tindakLanjut', label: 'Refleksi', data: contentStatus.tindakLanjut },
    { key: 'prota', label: 'Program Tahunan (Prota)', data: contentStatus.prota },
    { key: 'kktp', label: 'KKTP', data: contentStatus.kktp },
    { key: 'prosem', label: 'Program Semester (Prosem)', data: contentStatus.prosem.sem1 || contentStatus.prosem.sem2 },
  ];

  const availableCount = v2Summary
    ? v2Summary.totalDokumen
    : contentItems.filter((item) => item.data).length;

  const V2_LABEL: Record<string, string> = {
    modul: 'Modul Ajar',
    lkpd: 'LKPD',
    asesmen: 'Asesmen',
    soal: 'Bank Soal',
    materi: 'Materi',
    refleksi: 'Refleksi',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md p-6 rounded-xl border-2 border-foreground shadow-brutal m-4">
        <h3 className="text-xl font-extrabold flex items-center gap-2 mb-2">
          <Save className="w-5 h-5" /> Simpan Riwayat Konten
        </h3>
        {selectedHistoryId && selectedHistoryName ? (
          <div className="mb-4 p-2 rounded-lg bg-primary/10 border border-primary/30 text-xs">
            <span className="font-semibold">Riwayat aktif:</span> {selectedHistoryName}
            <div className="text-muted-foreground mt-0.5">
              Pilih <b>Update</b> untuk menimpa, atau <b>Simpan sebagai Baru</b> untuk membuat entri baru.
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Simpan semua konten yang sudah di-generate ke cloud.
          </p>
        )}

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Nama Riwayat</label>
          <input
            type="text"
            value={historyName}
            onChange={(e) => setHistoryName(e.target.value)}
            className="w-full p-3 border-2 border-foreground rounded-lg focus:outline-none focus:shadow-brutal-sm transition-all bg-card font-medium placeholder-muted-foreground"
            placeholder="Contoh: IPA Kelas 7 - Pengukuran"
            autoFocus
          />
        </div>

        {/* Ringkasan V2 */}
        {v2Summary ? (
          <div className="mb-6" data-testid="v2-summary">
            <label className="block text-sm font-semibold mb-2">
              Dokumen per Pertemuan ({v2Summary.jumlahPertemuan} pertemuan,{' '}
              {v2Summary.totalDokumen} dokumen)
            </label>
            <div className="space-y-2">
              {Object.entries(v2Summary.perJenis).map(([jenis, jumlah]) => (
                <div
                  key={jenis}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    jumlah > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {jumlah > 0 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span className="text-sm">
                    {V2_LABEL[jenis] ?? jenis}: {jumlah} dokumen berhasil
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
        /* Content Status (mode legacy).
           FASE 4A.2: dalam mode V2, Prota/Prosem/KKTP TIDAK ditampilkan karena
           bukan bagian paket "Dokumen per Pertemuan". */
        <div className="mb-6" data-testid="legacy-content-list">
          <label className="block text-sm font-semibold mb-2">
            Konten yang akan disimpan ({availableCount}/9)
          </label>
          <div className="space-y-2">
            {contentItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  item.data ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.data ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {item.label}
                  {item.data ? ' (tersedia)' : ' (belum digenerate)'}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isSaving || isUpdating}>
            Batal
          </Button>
          {selectedHistoryId && onUpdate && (
            <Button
              onClick={onUpdate}
              disabled={isSaving || isUpdating || !historyName.trim() || availableCount === 0}
              className="border-2 border-foreground shadow-brutal-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Mengupdate...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Riwayat Ini
                </>
              )}
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={isSaving || isUpdating || !historyName.trim() || availableCount === 0}
            variant={selectedHistoryId ? 'outline' : 'default'}
            className="border-2 border-foreground shadow-brutal-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {selectedHistoryId ? 'Simpan sebagai Baru' : 'Simpan Riwayat'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
