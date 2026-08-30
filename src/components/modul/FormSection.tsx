import { User, Layout, Sparkles, Loader2, Plus, Trash2, Users, BookOpen, Globe, ChevronDown, ChevronRight, Info, Search, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type {
  FormData,
  PertemuanInput,
  StrukturHierarki,
  BabResult,
  GenerationResultV2,
  JenisDokumenPertemuan,
} from '@/types/modul';
import { PilihanDokumenPertemuanEditor } from './PilihanDokumenPertemuanEditor';

import {
  faseOptions,
  FASE_KELAS_MAP,
  semesterOptions,
  DPL_OPTIONS,
  KBC_TOPIK_PANCA_CINTA,
  NILAI_KARAKTER_OPTIONS,
  modelOptions,
  metodeOptions,
} from '@/lib/constants';
import { StrukturHierarkiSection } from './StrukturHierarkiSection';

interface FormSectionProps {
  formData: FormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (field: keyof FormData, value: string) => void;
  onPertemuanChange: (pertemuan: PertemuanInput[]) => void;
  onNestedChange: (parent: keyof FormData, field: string, value: string) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string;
  onOpenCPSelector?: () => void;
  onGenerateTP?: () => void;
  isGeneratingTP?: boolean;
  onKontekstualisasiCP?: () => void;
  isKontekstualisasiCP?: boolean;
  onSuggestDesain?: () => void;
  isSuggestingDesain?: boolean;
  onStrukturChange?: (struktur: StrukturHierarki | undefined) => void;
  onApplyBabResult?: (result: BabResult) => void;
  // === Dokumen per Pertemuan V2 (Fase 3) — hanya diisi saat feature flag ON ===
  pertemuanV2Result?: GenerationResultV2;
  onTogglePilihanDokumenV2?: (
    pertemuanId: string,
    jenis: JenisDokumenPertemuan,
    value: boolean,
  ) => void;
  onGeneratePertemuanV2?: () => void;
  isGeneratingPertemuanV2?: boolean;
  /** Cek apakah pertemuan (by index) boleh dihapus / butuh konfirmasi (V2). */
  checkRemovePertemuanV2?: (index: number) => {
    allowed: boolean;
    requiresConfirm: boolean;
    reason?: string;
  };
  /** Dipanggil setelah user mengonfirmasi hapus pertemuan (V2, by index). */
  onRemovePertemuanV2?: (index: number) => void;
  isV2Enabled?: boolean;
  isWorkspaceMode?: boolean;
}


const inputStyle =
  'w-full p-3 border-2 border-foreground rounded-lg focus:outline-none focus:shadow-brutal-sm transition-all bg-card font-medium placeholder-muted-foreground';
const inputStyleRequired =
  'w-full p-3 border-2 border-primary rounded-lg focus:outline-none focus:shadow-brutal-sm focus:border-primary transition-all bg-card font-medium placeholder-muted-foreground ring-2 ring-primary/20';
const labelStyle = 'text-sm font-bold text-foreground mb-1 block';
const cardStyle = 'bg-card p-6 rounded-xl border-2 border-foreground shadow-brutal';
const cardStyleRequired = 'bg-card p-6 rounded-xl border-2 border-primary shadow-brutal ring-2 ring-primary/20';
const sectionHeaderStyle = 'flex items-center gap-2 mb-4 pb-2 border-b-2 border-foreground cursor-pointer';

// Badge components
const RequiredBadge = () => (
  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
    Wajib
  </span>
);

const OptionalBadge = () => (
  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
    <Sparkles className="w-3 h-3" />
    AI Auto-fill
  </span>
);

// Collapsible section component
const CollapsibleSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  badge 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  badge?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={cardStyle}>
      <div 
        className={sectionHeaderStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
        <h2 className="font-extrabold flex-1">{title}</h2>
        {badge && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {badge}
          </span>
        )}
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </div>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );
};

export const FormSection = ({
  formData,
  onInputChange,
  onCheckboxChange,
  onPertemuanChange,
  onNestedChange,
  onGenerate,
  loading,
  error,
  onOpenCPSelector,
  onGenerateTP,
  isGeneratingTP,
  onKontekstualisasiCP,
  isKontekstualisasiCP,
  onSuggestDesain,
  isSuggestingDesain,
  onStrukturChange,
  onApplyBabResult,
  pertemuanV2Result,
  onTogglePilihanDokumenV2,
  onGeneratePertemuanV2,
  isGeneratingPertemuanV2,
  checkRemovePertemuanV2,
  onRemovePertemuanV2,
  isV2Enabled = false,
  isWorkspaceMode = false,
}: FormSectionProps) => {
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const [removeBlockedReason, setRemoveBlockedReason] = useState<string | null>(null);

  const handleAddPertemuan = () => {
    const newPertemuan: PertemuanInput = {
      nomorPertemuan: formData.pertemuan.length + 1,
      durasi: '40',
    };
    onPertemuanChange([...formData.pertemuan, newPertemuan]);
  };

  const applyRemovePertemuan = (index: number) => {
    if (formData.pertemuan.length <= 1) return;
    onRemovePertemuanV2?.(index);
    const updated = formData.pertemuan
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, nomorPertemuan: i + 1 }));
    onPertemuanChange(updated);
  };

  const handleRemovePertemuan = (index: number) => {
    if (formData.pertemuan.length <= 1) return;
    const check = checkRemovePertemuanV2?.(index);
    if (check && !check.allowed) {
      setRemoveBlockedReason(check.reason ?? 'Pertemuan tidak dapat dihapus saat ini.');
      return;
    }
    if (check?.requiresConfirm) {
      setPendingRemoveIndex(index);
      return;
    }
    applyRemovePertemuan(index);
  };


  const handlePertemuanDurasiChange = (index: number, durasi: string) => {
    const updated = formData.pertemuan.map((p, i) =>
      i === index ? { ...p, durasi } : p
    );
    onPertemuanChange(updated);
  };

  // Check if required fields are filled
  const isRequiredFilled = !!(
    formData.namaPenyusun &&
    formData.mataPelajaran &&
    formData.tujuanPembelajaran
  );

  const isKBC = formData.kurikulum === 'kbc';

  return (
    <div className="space-y-4">
      {/* Pilihan Kurikulum */}
      <div className={cardStyle}>
        <div className={sectionHeaderStyle} onClick={() => {}}>
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold flex-1">Pilih Jenis Kurikulum</h2>
        </div>
        <RadioGroup
          value={formData.kurikulum || 'merdeka'}
          onValueChange={(value) => {
            const syntheticEvent = {
              target: { name: 'kurikulum', value }
            } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(syntheticEvent);
            // Don't clear DPL when switching - DPL is used in both modes
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="merdeka" id="kurikulum-merdeka" />
            <Label htmlFor="kurikulum-merdeka" className="font-bold cursor-pointer">
              Kurikulum Merdeka (RPM)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="kbc" id="kurikulum-kbc" />
            <Label htmlFor="kurikulum-kbc" className="font-bold cursor-pointer">
              KBC (Kurikulum Berbasis Cinta - Kemenag)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Info Banner */}
      <div className="bg-info/10 border-2 border-info/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-info mb-1">Tips Pengisian Form</p>
          <p className="text-muted-foreground">
            Isi field <span className="text-primary font-bold">Wajib</span> (Section 1 & 4). 
            Field dengan label <span className="text-secondary-foreground font-medium">✨ AI Auto-fill</span> akan 
            diisi otomatis oleh AI berdasarkan konteks pembelajaran.
          </p>
        </div>
      </div>

      {/* 1. IDENTIFIKASI DASAR - REQUIRED */}
      <div className={cardStyleRequired}>
        <div 
          className={sectionHeaderStyle}
          onClick={() => {}}
        >
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold flex-1 text-primary">1. Identifikasi</h2>
          <RequiredBadge />
        </div>
        <div className="space-y-3">
        {/* Nama Penyusun & NIP */}
        <div className="grid grid-cols-2 gap-2">
          <input
            name="namaPenyusun"
            value={formData.namaPenyusun}
            onChange={onInputChange}
            className={inputStyleRequired}
            placeholder="Nama Penyusun *"
            required
          />
          <input
            name="nipPenyusun"
            value={formData.nipPenyusun}
            onChange={onInputChange}
            className={inputStyle}
            placeholder="NIP Penyusun"
          />
        </div>

        {/* Sekolah & Kepala Sekolah */}
        <input
          name="sekolah"
          value={formData.sekolah}
          onChange={onInputChange}
          className={inputStyle}
          placeholder="Nama Sekolah"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="kepalaSekolah"
            value={formData.kepalaSekolah}
            onChange={onInputChange}
            className={inputStyle}
            placeholder="Kepala Sekolah"
          />
          <input
            name="nipKepalaSekolah"
            value={formData.nipKepalaSekolah}
            onChange={onInputChange}
            className={inputStyle}
            placeholder="NIP Kepala Sekolah"
          />
        </div>

        <input
          name="mataPelajaran"
          value={formData.mataPelajaran}
          onChange={onInputChange}
          className={inputStyleRequired}
          placeholder="Mata Pelajaran *"
          required
        />
        
        {/* Materi & Sub Materi (NEW) */}
        <div className="space-y-2">
          <textarea
            name="materi"
            value={formData.materi}
            onChange={onInputChange}
            className={`${inputStyle} min-h-[60px] resize-y`}
            placeholder="Materi"
          />
          <textarea
            name="subMateri"
            value={formData.subMateri}
            onChange={onInputChange}
            className={`${inputStyle} min-h-[60px] resize-y`}
            placeholder="Sub Materi"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            name="fase"
            value={formData.fase}
            onChange={onInputChange}
            className={inputStyle}
          >
            {faseOptions.map((f) => (
              <option key={f} value={f}>
                Fase {f}
              </option>
            ))}
          </select>
          <select
            name="kelas"
            value={formData.kelas}
            onChange={onInputChange}
            className={`${inputStyle} col-span-2`}
          >
            <option value="">Pilih Kelas</option>
            {(FASE_KELAS_MAP[formData.fase] || []).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <select
          name="semester"
          value={formData.semester}
          onChange={onInputChange}
          className={inputStyle}
        >
          {semesterOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Multi-Pertemuan Section */}
        {isWorkspaceMode ? (
          <div className="border-2 border-primary/20 p-4 rounded-lg bg-primary/5 flex items-center justify-between">
            <span className={labelStyle + " mb-0"}>Alokasi Waktu</span>
            <div className="flex gap-2 items-center">
              {formData.pertemuan.map((p, index) => (
                <span key={index} className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-sm">
                  Pertemuan {p.nomorPertemuan} ({p.waktu || p.durasi + ' menit'})
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-primary/50 p-4 rounded-lg bg-primary/5">
            <span className={labelStyle}>Jumlah Pertemuan & Durasi</span>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Default <strong>40 menit</strong> (1 JP). Bisa diubah sesuai kebutuhan kelas.
            </p>
            <div className="space-y-2 mt-2">
              {formData.pertemuan.map((p, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-bold w-28 flex-shrink-0">
                    Pertemuan {p.nomorPertemuan}:
                  </span>
                  <input
                    type="number"
                    value={p.durasi}
                    onChange={(e) => handlePertemuanDurasiChange(index, e.target.value)}
                    disabled={isGeneratingPertemuanV2}
                    className={`${inputStyle} w-24 min-w-[80px] text-center disabled:opacity-60`}
                    placeholder="40"
                    min="1"
                  />
                  <span className="text-sm text-muted-foreground">menit</span>
                  {formData.pertemuan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePertemuan(index)}
                      disabled={isGeneratingPertemuanV2}
                      className="p-2.5 text-destructive bg-destructive/10 hover:bg-destructive/20 
                                 border border-destructive/30 hover:border-destructive/50 
                                 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Hapus Pertemuan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPertemuan}
                disabled={isGeneratingPertemuanV2}
                className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors border-2 border-dashed border-primary/30 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Tambah Pertemuan
              </button>
            </div>
          </div>
        )}

        {/* Konfirmasi hapus pertemuan (hasil V2 akan ikut terhapus) */}
            <AlertDialog
              open={pendingRemoveIndex !== null}
              onOpenChange={(open) => !open && setPendingRemoveIndex(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus pertemuan ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pertemuan{' '}
                    {pendingRemoveIndex !== null
                      ? formData.pertemuan[pendingRemoveIndex]?.nomorPertemuan
                      : ''}{' '}
                    sudah memiliki dokumen hasil generate. Menghapusnya akan
                    menghapus seluruh dokumen pertemuan tersebut. Dokumen
                    pertemuan lain tetap aman.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (pendingRemoveIndex !== null) applyRemovePertemuan(pendingRemoveIndex);
                      setPendingRemoveIndex(null);
                    }}
                  >
                    Hapus Pertemuan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Hapus diblokir (mis. sedang generate) */}
            <AlertDialog
              open={removeBlockedReason !== null}
              onOpenChange={(open) => !open && setRemoveBlockedReason(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tidak bisa menghapus</AlertDialogTitle>
                  <AlertDialogDescription>{removeBlockedReason}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setRemoveBlockedReason(null)}>
                    Mengerti
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>


            {/* V2 (Fase 3): pilihan dokumen per pertemuan — hanya saat flag ON */}
            {pertemuanV2Result && onTogglePilihanDokumenV2 && (
              <div className="pt-2 border-t-2 border-dashed border-primary/30">
                <PilihanDokumenPertemuanEditor
                  result={pertemuanV2Result}
                  onToggle={onTogglePilihanDokumenV2}
                  disabled={isGeneratingPertemuanV2}
                />
                {onGeneratePertemuanV2 && (
                  <button
                    type="button"
                    onClick={onGeneratePertemuanV2}
                    disabled={isGeneratingPertemuanV2}
                    className="mt-2 w-full px-3 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg border-2 border-foreground disabled:opacity-60"
                  >
                    {isGeneratingPertemuanV2
                      ? 'Sedang membuat dokumen…'
                      : 'Generate Dokumen per Pertemuan'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      {/* 2. IDENTIFIKASI MURID - OPTIONAL (AI Auto-fill) */}
      <CollapsibleSection 
        title="2. Identifikasi Murid" 
        icon={<Users className="w-5 h-5" />}
        defaultOpen={false}
        badge="✨ AI Auto-fill"
      >
        <textarea
          name="aspekPengetahuanAwal"
          value={formData.aspekPengetahuanAwal}
          onChange={onInputChange}
          className={`${inputStyle} h-20 text-sm resize-none`}
          placeholder="Aspek Pengetahuan Awal: Apa yang sudah diketahui siswa tentang topik ini?"
        />
        <textarea
          name="aspekMinat"
          value={formData.aspekMinat}
          onChange={onInputChange}
          className={`${inputStyle} h-20 text-sm resize-none`}
          placeholder="Aspek Minat: Apa yang menarik bagi siswa terkait topik ini?"
        />
        <textarea
          name="aspekLatarBelakang"
          value={formData.aspekLatarBelakang}
          onChange={onInputChange}
          className={`${inputStyle} h-20 text-sm resize-none`}
          placeholder="Aspek Latar Belakang: Konteks sosial, lingkungan, kebiasaan siswa..."
        />
        <textarea
          name="aspekKebutuhanBelajar"
          value={formData.aspekKebutuhanBelajar}
          onChange={onInputChange}
          className={`${inputStyle} h-20 text-sm resize-none`}
          placeholder="Aspek Kebutuhan Belajar: Metode dan media yang cocok untuk siswa..."
        />
      </CollapsibleSection>

      {/* 3. MATERI PELAJARAN - JENIS PENGETAHUAN - OPTIONAL (AI Auto-fill) */}
      <CollapsibleSection 
        title="3. Jenis Pengetahuan" 
        icon={<BookOpen className="w-5 h-5" />}
        defaultOpen={false}
        badge="✨ AI Auto-fill"
      >
        <textarea
          value={formData.materiPengetahuan?.faktual || ''}
          onChange={(e) => onNestedChange('materiPengetahuan', 'faktual', e.target.value)}
          className={`${inputStyle} h-16 text-sm resize-none`}
          placeholder="Pengetahuan Faktual: Data, fakta, istilah, simbol..."
        />
        <textarea
          value={formData.materiPengetahuan?.konseptual || ''}
          onChange={(e) => onNestedChange('materiPengetahuan', 'konseptual', e.target.value)}
          className={`${inputStyle} h-16 text-sm resize-none`}
          placeholder="Pengetahuan Konseptual: Hubungan antar konsep, prinsip, teori..."
        />
        <textarea
          value={formData.materiPengetahuan?.prosedural || ''}
          onChange={(e) => onNestedChange('materiPengetahuan', 'prosedural', e.target.value)}
          className={`${inputStyle} h-16 text-sm resize-none`}
          placeholder="Pengetahuan Prosedural: Cara mengerjakan, langkah-langkah, teknik..."
        />
        <textarea
          value={formData.materiPengetahuan?.metakognitif || ''}
          onChange={(e) => onNestedChange('materiPengetahuan', 'metakognitif', e.target.value)}
          className={`${inputStyle} h-16 text-sm resize-none`}
          placeholder="Pengetahuan Metakognitif: Kesadaran diri, strategi belajar..."
        />
      </CollapsibleSection>

      {/* 4. DESAIN PEMBELAJARAN - REQUIRED */}
      <div className={cardStyleRequired}>
        <div 
          className={sectionHeaderStyle}
        >
          <Layout className="w-5 h-5 text-primary" />
          <h2 className="font-extrabold flex-1 text-primary">4. Desain Pembelajaran</h2>
          <RequiredBadge />
        </div>
        <div className="space-y-3">
        <div>
          <div className="flex flex-col gap-1 mb-1">
            <span className={labelStyle}>Capaian Pembelajaran (CP)</span>
              <div className="flex flex-wrap gap-1.5">
                {!isWorkspaceMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenCPSelector}
                    disabled={!formData.mataPelajaran}
                    className="gap-1.5 text-xs h-7"
                    title={!formData.mataPelajaran ? 'Isi Mata Pelajaran terlebih dahulu' : 'Cari CP resmi dari Kemdikbud'}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Cari CP Resmi
                  </Button>
                )}
                {(!isWorkspaceMode || onKontekstualisasiCP) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onKontekstualisasiCP}
                    disabled={!formData.capaianPembelajaran || !formData.materi || isKontekstualisasiCP}
                    className="gap-1.5 text-xs h-7"
                    title={
                      !formData.capaianPembelajaran ? 'Isi CP terlebih dahulu' :
                      !formData.materi ? 'Isi Materi terlebih dahulu' :
                      'Sesuaikan CP dengan materi menggunakan AI'
                    }
                  >
                    {isKontekstualisasiCP ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    {isKontekstualisasiCP ? 'Menyesuaikan...' : 'Sesuaikan CP'}
                  </Button>
                )}
              </div>
          </div>
          <textarea
            name="capaianPembelajaran"
            value={formData.capaianPembelajaran}
            onChange={onInputChange}
            className={`${inputStyle} min-h-[120px] resize-y`}
            placeholder={isWorkspaceMode ? "CP dari Perencanaan" : "Capaian Pembelajaran (CP) — Klik 'Cari CP Resmi' untuk mengambil dari data Kemdikbud"}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={labelStyle}>Tujuan Pembelajaran *</span>
              {isWorkspaceMode ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!formData.capaianPembelajaran || isGeneratingTP}
                      className="gap-1.5 text-xs h-7"
                      title={!formData.capaianPembelajaran ? 'Isi CP terlebih dahulu' : 'Generate TP dengan AI berdasarkan CP dan Materi'}
                    >
                      {isGeneratingTP ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      {isGeneratingTP ? 'Generating...' : 'Generate TP'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Generate Ulang Tujuan Pembelajaran?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tujuan Pembelajaran (TP) ini awalnya didapatkan dari dokumen Perencanaan Anda (Prosem). 
                        <br /><br />
                        Jika Anda men-generate ulang TP di sini, TP untuk modul ini akan <b>berbeda</b> dengan yang ada di Perencanaan. 
                        <br />
                        (Catatan: Perencanaan awal Anda tidak akan diubah).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={onGenerateTP}>Ya, Generate Baru</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGenerateTP}
                  disabled={!formData.capaianPembelajaran || isGeneratingTP}
                  className="gap-1.5 text-xs h-7"
                  title={!formData.capaianPembelajaran ? 'Isi CP terlebih dahulu' : 'Generate TP dengan AI berdasarkan CP dan Materi'}
                >
                  {isGeneratingTP ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingTP ? 'Generating...' : 'Generate TP'}
                </Button>
              )}
          </div>
          <textarea
            name="tujuanPembelajaran"
            value={formData.tujuanPembelajaran}
            onChange={onInputChange}
            className={`${inputStyleRequired} min-h-[120px] resize-y`}
            placeholder={isWorkspaceMode ? "TP dari Prosem" : "Contoh: Peserta didik mampu menganalisis struktur teks argumentasi..."}
            required
          />
        </div>
        
        <textarea
          name="kaitanKehidupan"
          value={formData.kaitanKehidupan}
          onChange={onInputChange}
          className={`${inputStyle} h-16 text-sm resize-none`}
          placeholder="Kaitan dengan Kehidupan Sehari-hari"
        />
        
        {/* AI Suggest Desain Button */}
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Model Pembelajaran</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSuggestDesain}
            disabled={!formData.capaianPembelajaran || !formData.tujuanPembelajaran || isSuggestingDesain}
            className="gap-1.5 text-xs h-7"
            title={
              !formData.capaianPembelajaran ? 'Isi CP terlebih dahulu' :
              !formData.tujuanPembelajaran ? 'Isi TP terlebih dahulu' :
              'AI menyarankan Model, Metode, DPL & Nilai Karakter'
            }
          >
            {isSuggestingDesain ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isSuggestingDesain ? 'Menganalisis...' : 'AI Suggest Desain'}
          </Button>
        </div>
        <select
          name="modelPembelajaran"
          value={formData.modelPembelajaran}
          onChange={onInputChange}
          className={inputStyle}
        >
          <option value="">✨ AI Auto-Select (Biarkan AI yang memilih)</option>
          {modelOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {/* Metode */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/50">
          <span className={labelStyle}>Metode Pembelajaran</span>
          <div className="flex flex-wrap gap-2 mt-2">
            <label
              className={`cursor-pointer px-2 py-1 rounded-lg border-2 text-[10px] font-bold transition-all flex items-center gap-1 ${
                !formData.metodePembelajaran || formData.metodePembelajaran.length === 0
                  ? 'bg-purple-100 text-purple-800 border-purple-400'
                  : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={!formData.metodePembelajaran || formData.metodePembelajaran.length === 0}
                onChange={() => {
                  if (formData.metodePembelajaran && formData.metodePembelajaran.length > 0) {
                     formData.metodePembelajaran.forEach(m => onCheckboxChange('metodePembelajaran', m));
                  }
                }}
              />
              <Sparkles className="w-3 h-3" /> AI Auto-Select
            </label>
            {metodeOptions.map((opt) => (
              <label
                key={opt}
                className={`cursor-pointer px-2 py-1 rounded-lg border-2 text-[10px] font-bold transition-all ${
                  formData.metodePembelajaran?.includes(opt)
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.metodePembelajaran?.includes(opt) || false}
                  onChange={() => onCheckboxChange('metodePembelajaran', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Dimensi Profil Lulusan - ALWAYS SHOWN (both Merdeka and KBC) */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/50">
          <span className={labelStyle}>Dimensi Profil Lulusan (DPL)</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {DPL_OPTIONS.map((opt) => (
              <label
                key={opt.kode}
                className={`cursor-pointer px-2 py-1 rounded-lg border-2 text-[10px] font-bold transition-all ${
                  formData.dimensiProfilLulusan?.includes(opt.kode)
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
                }`}
                title={opt.nama}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.dimensiProfilLulusan?.includes(opt.kode) || false}
                  onChange={() => onCheckboxChange('dimensiProfilLulusan', opt.kode)}
                />
                {opt.kode}
              </label>
            ))}
          </div>
        </div>

        {/* Topik Panca Cinta - KBC ONLY */}
        {isKBC && (
          <div className="border-2 border-dashed border-primary/50 p-3 rounded-lg bg-primary/5">
            <span className={labelStyle}>Topik Panca Cinta (KBC)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {KBC_TOPIK_PANCA_CINTA.map((opt) => (
                <label
                  key={opt}
                  className={`cursor-pointer px-2 py-1 rounded-lg border-2 text-[10px] font-bold transition-all ${
                    (formData.topikPancaCinta || []).includes(opt)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-muted-foreground/30 hover:border-primary'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={(formData.topikPancaCinta || []).includes(opt)}
                    onChange={() => onCheckboxChange('topikPancaCinta' as keyof FormData, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Materi Integrasi KBC - KBC ONLY */}
        {isKBC && (
          <div className="border-2 border-dashed border-primary/50 p-3 rounded-lg bg-primary/5">
            <span className={labelStyle}>
              Materi Integrasi KBC
              <span className="text-xs font-normal text-muted-foreground ml-2">(opsional - AI akan generate jika kosong)</span>
            </span>
            <textarea
              name="materiIntegrasiKBC"
              value={formData.materiIntegrasiKBC || ''}
              onChange={onInputChange}
              className={`${inputStyle} h-24 text-sm resize-none mt-2`}
              placeholder="Jelaskan integrasi Panca Cinta dengan materi pelajaran. Kosongkan jika ingin AI yang mengisi."
            />
          </div>
        )}

        {/* Nilai Karakter */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/50">
          <span className={labelStyle}>Integrasi Nilai & Karakter</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {NILAI_KARAKTER_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`cursor-pointer px-2 py-1 rounded-lg border-2 text-[10px] font-bold transition-all ${
                  formData.nilaiKarakter?.includes(opt)
                    ? 'bg-accent text-accent-foreground border-foreground'
                    : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.nilaiKarakter?.includes(opt) || false}
                  onChange={() => onCheckboxChange('nilaiKarakter', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* 5. LINTAS DISIPLIN ILMU - OPTIONAL (AI Auto-fill) */}
      <CollapsibleSection 
        title="5. Lintas Disiplin Ilmu" 
        icon={<Globe className="w-5 h-5" />}
        defaultOpen={false}
        badge="✨ AI Auto-fill"
      >
        <input
          value={formData.lintasDisiplinIlmu?.ppkn || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'ppkn', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="PPKn: (Hak, kewajiban, peran pemerintah...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.ips || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'ips', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="IPS: (Hubungan sosial-ekonomi, dampak...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.matematika || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'matematika', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="Matematika: (Pengolahan data, analisis statistik...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.bahasaIndonesia || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'bahasaIndonesia', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="Bahasa Indonesia: (Penyusunan laporan, presentasi...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.seniBudaya || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'seniBudaya', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="Seni Budaya: (Kampanye, poster, infografis...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.prakarya || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'prakarya', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="Prakarya: (Pembuatan model, desain kemasan...)"
        />
        <input
          value={formData.lintasDisiplinIlmu?.penjaskes || ''}
          onChange={(e) => onNestedChange('lintasDisiplinIlmu', 'penjaskes', e.target.value)}
          className={`${inputStyle} text-sm`}
          placeholder="Penjaskes: (Aktivitas fisik, pola hidup sehat...)"
        />
      </CollapsibleSection>

      {/* 6. KEMITRAAN & LINGKUNGAN - OPTIONAL (AI Auto-fill) */}
      <CollapsibleSection 
        title="6. Kemitraan & Lingkungan" 
        icon={<Users className="w-5 h-5" />}
        defaultOpen={false}
        badge="✨ AI Auto-fill"
      >
        {/* Kemitraan */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/30">
          <span className={labelStyle}>Kemitraan Pembelajaran</span>
          <div className="space-y-2 mt-2">
            <input
              value={formData.kemitraanPembelajaran?.guruBidangStudiLain || ''}
              onChange={(e) => onNestedChange('kemitraanPembelajaran', 'guruBidangStudiLain', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Guru Bidang Studi Lain: (PPKn, Matematika, dll)"
            />
            <input
              value={formData.kemitraanPembelajaran?.orangTua || ''}
              onChange={(e) => onNestedChange('kemitraanPembelajaran', 'orangTua', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Orang Tua: (Peran dalam mendukung pembelajaran)"
            />
            <input
              value={formData.kemitraanPembelajaran?.instansiTerkait || ''}
              onChange={(e) => onNestedChange('kemitraanPembelajaran', 'instansiTerkait', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Instansi Terkait: (Dinas Kesehatan, Puskesmas, dll)"
            />
          </div>
        </div>

        {/* Lingkungan Pembelajaran */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/30">
          <span className={labelStyle}>Lingkungan Pembelajaran</span>
          <div className="space-y-2 mt-2">
            <input
              value={formData.lingkunganPembelajaranDetail?.ruangFisik || ''}
              onChange={(e) => onNestedChange('lingkunganPembelajaranDetail', 'ruangFisik', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Ruang Fisik: (Kelas, laboratorium, taman, dll)"
            />
            <input
              value={formData.lingkunganPembelajaranDetail?.ruangVirtual || ''}
              onChange={(e) => onNestedChange('lingkunganPembelajaranDetail', 'ruangVirtual', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Ruang Virtual: (Platform daring, LMS, sumber belajar digital)"
            />
            <input
              value={formData.lingkunganPembelajaranDetail?.budayaBelajar || ''}
              onChange={(e) => onNestedChange('lingkunganPembelajaranDetail', 'budayaBelajar', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Budaya Belajar: (Kolaboratif, partisipatif aktif, dll)"
            />
          </div>
        </div>

        {/* Pemanfaatan Digital */}
        <div className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg bg-secondary/30">
          <span className={labelStyle}>Pemanfaatan Digital</span>
          <div className="space-y-2 mt-2">
            <input
              value={formData.pemanfaatanDigitalDetail?.perencanaan || ''}
              onChange={(e) => onNestedChange('pemanfaatanDigitalDetail', 'perencanaan', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Perencanaan: (LMS untuk materi, jadwal, tugas)"
            />
            <input
              value={formData.pemanfaatanDigitalDetail?.pelaksanaan || ''}
              onChange={(e) => onNestedChange('pemanfaatanDigitalDetail', 'pelaksanaan', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Pelaksanaan: (Video edukasi, pertemuan daring, simulasi)"
            />
            <input
              value={formData.pemanfaatanDigitalDetail?.asesmen || ''}
              onChange={(e) => onNestedChange('pemanfaatanDigitalDetail', 'asesmen', e.target.value)}
              className={`${inputStyle} text-sm`}
              placeholder="Asesmen: (Kuis daring, pengumpulan proyek digital)"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 7. INTEGRASI PROGRAM NASIONAL */}
      <CollapsibleSection
        title="7. Integrasi Program Nasional"
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        defaultOpen={false}
        badge="Opsional"
      >
        <p className="text-xs text-muted-foreground mb-2">
          Centang program yang ingin diintegrasikan. AI akan menjahit substansinya secara cerdas
          ke Modul Ajar dan seluruh tab turunan (LKPD, Asesmen, Materi, Soal, Refleksi).
        </p>

        {[
          {
            key: 'kka' as const,
            label: 'KKA — Koding & Kecerdasan Artifisial',
            desc: 'Sisipkan kompetensi koding/AI sesuai jenjang (SD/SMP/SMA) ke aktivitas inti.',
          },
          {
            key: 'sikap' as const,
            label: 'SIKAP — Sekolah Inovatif Ketahanan Pangan',
            desc: 'Jadikan urban farming / hidroponik / akuaponik sebagai konteks pembelajaran.',
          },
          {
            key: 'kaih' as const,
            label: '7KAIH — 7 Kebiasaan Anak Indonesia Hebat',
            desc: 'Tambahkan rutinitas pembiasaan pada tahap awal & penutup pembelajaran.',
          },
          {
            key: 'adiwiyata' as const,
            label: 'ADIWIYATA — Sekolah Peduli Lingkungan',
            desc: 'Sisipkan aktivitas nyata pada salah satu aspek: sampah, air, energi, sanitasi, atau keanekaragaman hayati.',
          },
          {
            key: 'ssk' as const,
            label: 'SSK — Sekolah Siaga Kependudukan',
            desc: 'Sisipkan konteks kependudukan (bonus demografi, urbanisasi, keluarga berkualitas) sesuai jenjang, tanpa menambah JP.',
          },
          {
            key: 'sra' as const,
            label: 'SRA — Sekolah Ramah Anak',
            desc: 'Terapkan pendekatan menyenangkan, disiplin positif tanpa kekerasan, dan partisipasi murid pada langkah pembelajaran.',
          },
        ].map((opt) => {
          const checked = !!formData.integrasiProgram?.[opt.key];
          return (
            <label
              key={opt.key}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                checked
                  ? 'border-primary bg-primary/5 shadow-brutal-sm'
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = {
                    kka: !!formData.integrasiProgram?.kka,
                    sikap: !!formData.integrasiProgram?.sikap,
                    kaih: !!formData.integrasiProgram?.kaih,
                    adiwiyata: !!formData.integrasiProgram?.adiwiyata,
                    ssk: !!formData.integrasiProgram?.ssk,
                    sra: !!formData.integrasiProgram?.sra,
                    [opt.key]: e.target.checked,
                  };
                  const syntheticEvent = {
                    target: { name: 'integrasiProgram', value: next },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as any;
                  onInputChange(syntheticEvent);
                }}
                className="mt-1 w-4 h-4 accent-primary cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-bold text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
            </label>
          );
        })}
      </CollapsibleSection>

      {/* Mode Hierarki (Beta) — self-contained, tidak mempengaruhi alur lama */}
      {!isV2Enabled && (
        <StrukturHierarkiSection
          initial={formData.struktur}
          onChange={onStrukturChange}
          formData={formData}
          onApplyBabResult={onApplyBabResult}
        />
      )}

      {/* Generate Button — disembunyikan saat mode Bab/Submateri aktif
          (tombol Generate Bab di dalam StrukturHierarkiSection menggantikannya).
          Juga disembunyikan jika V2 (Multi-Pertemuan) aktif untuk menghindari kebingungan. */}
      {!formData.struktur && !isV2Enabled && (
        <Button
          onClick={onGenerate}
          disabled={loading}
          className="w-full justify-center text-lg py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
          {loading ? 'Meracik Modul...' : 'GENERATE MODUL'}
        </Button>
      )}

      {error && (
        <div className="text-destructive font-bold text-center bg-destructive/10 p-3 rounded-lg border-2 border-destructive">
          {error}
        </div>
      )}
    </div>
  );
};
