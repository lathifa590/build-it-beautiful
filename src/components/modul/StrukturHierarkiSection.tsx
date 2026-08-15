// Section UI untuk mode hierarki Bab → Submateri → Pertemuan.
// CATATAN PENTING:
// - Komponen ini SELF-CONTAINED (state lokal). Belum mengubah formData/Index.tsx.
// - Tujuan tahap ini: user bisa mendesain struktur + lihat estimasi kredit.
// - Wiring ke alur generate dilakukan di tahap berikutnya.

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, BookOpen, Layers, Zap, Info, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { StrukturHierarki, BabInput, SubmateriInput, FormData, BabResult } from '@/types/modul';
import {
  createDefaultStruktur,
  createSubmateri,
  createPertemuan,
  recomputeTotalJP,
  renumberPertemuan,
  estimateCredits,
} from '@/lib/hierarki-helpers';
import { BabGenerateDialog } from './BabGenerateDialog';

const inputStyle =
  'w-full p-2.5 border-2 border-foreground rounded-lg focus:outline-none focus:shadow-brutal-sm transition-all bg-card font-medium text-sm';

interface Props {
  /** Opsional: kalau diberikan, perubahan struktur dikirim ke parent (Tahap 3+). */
  onChange?: (s: StrukturHierarki | undefined) => void;
  /** Initial state opsional (untuk hydrate dari history kelak). */
  initial?: StrukturHierarki;
  /** FormData saat ini — dipakai untuk tombol "Generate Bab" (opsional). */
  formData?: FormData;
  /** Handler untuk menerapkan hasil generate Bab ke editor utama. */
  onApplyBabResult?: (result: BabResult) => void;
}

export const StrukturHierarkiSection = ({ onChange, initial, formData, onApplyBabResult }: Props) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(!!initial);
  const [struktur, setStruktur] = useState<StrukturHierarki>(
    initial ?? createDefaultStruktur()
  );
  const [genOpen, setGenOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('babModeHelpSeen');
  });
  const dismissHelp = () => {
    setShowHelp(false);
    try {
      localStorage.setItem('babModeHelpSeen', '1');
    } catch {
      /* ignore */
    }
  };

  const estimate = useMemo(() => estimateCredits(struktur), [struktur]);

  const update = (next: StrukturHierarki) => {
    setStruktur(next);
    if (enabled) onChange?.(next);
  };

  const updateBab = (patch: Partial<BabInput>) => {
    update({ ...struktur, bab: recomputeTotalJP({ ...struktur.bab, ...patch }) });
  };

  const updateSubmateri = (subId: string, patch: Partial<SubmateriInput>) => {
    const bab = {
      ...struktur.bab,
      submateri: struktur.bab.submateri.map((s) =>
        s.id === subId ? renumberPertemuan({ ...s, ...patch }) : s
      ),
    };
    update({ ...struktur, bab: recomputeTotalJP(bab) });
  };

  const addSubmateri = () => {
    const newSub = createSubmateri(`Submateri ${struktur.bab.submateri.length + 1}`);
    update({
      ...struktur,
      bab: recomputeTotalJP({
        ...struktur.bab,
        submateri: [...struktur.bab.submateri, newSub],
      }),
    });
  };

  const removeSubmateri = (subId: string) => {
    if (struktur.bab.submateri.length <= 1) return;
    update({
      ...struktur,
      bab: recomputeTotalJP({
        ...struktur.bab,
        submateri: struktur.bab.submateri.filter((s) => s.id !== subId),
      }),
    });
  };

  const addPertemuan = (subId: string) => {
    const sub = struktur.bab.submateri.find((s) => s.id === subId);
    if (!sub) return;
    updateSubmateri(subId, {
      pertemuan: [...sub.pertemuan, createPertemuan(sub.pertemuan.length + 1)],
    });
  };

  const removePertemuan = (subId: string, pertId: string) => {
    const sub = struktur.bab.submateri.find((s) => s.id === subId);
    if (!sub || sub.pertemuan.length <= 1) return;
    updateSubmateri(subId, {
      pertemuan: sub.pertemuan.filter((p) => p.id !== pertId),
    });
  };

  const toggleEnabled = (v: boolean) => {
    setEnabled(v);
    onChange?.(v ? struktur : undefined);
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold text-base">Struktur Bab & Submateri</span>
          <span className="text-[10px] font-black tracking-wider bg-amber-200 text-amber-900 border-2 border-amber-900 px-1.5 py-0.5 rounded">
            BETA
          </span>
        </div>
        {enabled && (
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <Zap className="w-3 h-3" />
            ~{estimate.total} kredit
          </span>
        )}
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-4 border-t-2 border-foreground">
          {/* Toggle aktivasi + tombol panduan */}
          <div className="flex items-start gap-3 p-3 bg-secondary/40 rounded-lg border-2 border-foreground">
            <Switch checked={enabled} onCheckedChange={toggleEnabled} />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm">Aktifkan Mode Bab & Submateri</div>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  aria-label="Buka panduan"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Panduan
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Generate dokumen terpisah untuk tiap pertemuan, dikelompokkan per submateri.
                Bila nonaktif, aplikasi tetap pakai mode lama (1 modul untuk semua pertemuan).
              </div>
            </div>
          </div>

          {/* Panduan singkat — muncul otomatis pertama kali, bisa dibuka lagi via tombol */}
          {showHelp && (
            <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-lg text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-black text-amber-900 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Cara Pakai Mode Bab & Submateri
                </div>
                <button
                  type="button"
                  onClick={dismissHelp}
                  className="text-amber-900 font-bold hover:underline shrink-0"
                >
                  Mengerti ✕
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-amber-900">
                <li>
                  Isi <b>Judul Bab</b> (mis. "Narrative Text"). Field <b>Materi</b> di form utama
                  akan tersinkron otomatis, jadi tombol <b>Cari CP Resmi</b> & <b>Generate TP</b>
                  ikut aktif.
                </li>
                <li>
                  Tambahkan <b>Submateri</b> + jumlah <b>Pertemuan</b> per submateri. Alokasi JP
                  otomatis dikonversi jadi pertemuan (4 JP = 2 pertemuan).
                </li>
                <li>
                  Atur toggle <b>Materi Ajar</b> & <b>Asesmen</b>: <i>per pertemuan</i> (dokumen
                  berseri) atau <i>per submateri</i> (satu dokumen utuh).
                </li>
                <li>
                  Klik <b>Generate Bab Sekarang</b>. AI akan generate Preface Bab → tiap Pertemuan
                  (Modul+LKPD+Refleksi) → Materi/Asesmen → Bank Soal, semua dalam 1 klik.
                </li>
                <li>
                  Klik <b>Terapkan ke Editor</b> untuk memindahkan hasil ke tab Modul/LKPD/Materi/
                  Asesmen/Bank Soal — semua pertemuan digabung otomatis.
                </li>
              </ol>
              <div className="text-[11px] text-amber-800 italic">
                Tips: Bank Soal selalu 1 per Bab. Kalau kredit tipis, generate 1 submateri kecil
                dulu untuk uji hasilnya.
              </div>
            </div>
          )}

          {!enabled && !showHelp && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg text-xs text-blue-900">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Mode hierarki masih beta — kamu bisa mendesain strukturnya & lihat estimasi kredit
                tanpa mempengaruhi alur generate yang sedang berjalan.
              </span>
            </div>
          )}

          {/* Bab */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Judul Bab
            </label>
            <input
              type="text"
              value={struktur.bab.judul}
              onChange={(e) => updateBab({ judul: e.target.value })}
              placeholder="Contoh: Konsep Dasar Ilmu Ekonomi"
              className={inputStyle}
            />
            <div className="text-xs text-muted-foreground">
              Total alokasi:{' '}
              <span className="font-bold text-foreground">{struktur.bab.totalJP} JP</span>{' '}
              · {struktur.bab.submateri.length} submateri ·{' '}
              {estimate.totalPertemuan} pertemuan
            </div>
          </div>

          {/* Submateri list */}
          <div className="space-y-3">
            {struktur.bab.submateri.map((sub, sIdx) => (
              <div
                key={sub.id}
                className="border-2 border-foreground rounded-lg p-3 bg-background space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-black text-muted-foreground">
                    SUBMATERI {sIdx + 1}
                  </span>
                  <div className="flex-1" />
                  {struktur.bab.submateri.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubmateri(sub.id)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      aria-label="Hapus submateri"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={sub.judul}
                  onChange={(e) => updateSubmateri(sub.id, { judul: e.target.value })}
                  placeholder="Judul submateri"
                  className={inputStyle}
                />

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold whitespace-nowrap">Alokasi JP:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={sub.alokasiJP}
                    onChange={(e) =>
                      updateSubmateri(sub.id, { alokasiJP: Number(e.target.value) || 1 })
                    }
                    className={`${inputStyle} w-20`}
                  />
                  <span className="text-xs text-muted-foreground">
                    ({sub.pertemuan.length} pertemuan)
                  </span>
                </div>

                {/* Pertemuan dalam submateri */}
                <div className="pl-3 border-l-2 border-foreground/30 space-y-1.5 mt-2">
                  {sub.pertemuan.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="font-bold w-20 shrink-0">Pertemuan {p.nomor}</span>
                      <input
                        type="text"
                        value={p.durasi}
                        onChange={(e) => {
                          const pertemuan = sub.pertemuan.map((pp) =>
                            pp.id === p.id ? { ...pp, durasi: e.target.value } : pp
                          );
                          updateSubmateri(sub.id, { pertemuan });
                        }}
                        className={`${inputStyle} flex-1`}
                        placeholder="Durasi"
                      />
                      {sub.pertemuan.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePertemuan(sub.id, p.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                          aria-label="Hapus pertemuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPertemuan(sub.id)}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Tambah Pertemuan
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addSubmateri}
              className="w-full border-2 border-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Tambah Submateri
            </Button>
          </div>

          {/* Toggles materi & asesmen */}
          <div className="space-y-2 pt-2 border-t-2 border-dashed border-foreground/30">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Skala Dokumen
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg border-2 border-foreground/50">
              <Switch
                checked={struktur.toggleMateriPerPertemuan}
                onCheckedChange={(v) =>
                  update({ ...struktur, toggleMateriPerPertemuan: v })
                }
              />
              <div className="flex-1 text-xs">
                <div className="font-bold">
                  Materi Ajar:{' '}
                  {struktur.toggleMateriPerPertemuan ? 'per pertemuan' : '1 per submateri'}
                </div>
                <div className="text-muted-foreground">
                  Pilih per pertemuan untuk materi berseri, atau per submateri untuk materi utuh.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg border-2 border-foreground/50">
              <Switch
                checked={struktur.toggleAsesmenPerPertemuan}
                onCheckedChange={(v) =>
                  update({ ...struktur, toggleAsesmenPerPertemuan: v })
                }
              />
              <div className="flex-1 text-xs">
                <div className="font-bold">
                  Asesmen:{' '}
                  {struktur.toggleAsesmenPerPertemuan ? 'per pertemuan' : '1 per submateri'}
                </div>
                <div className="text-muted-foreground">
                  Per pertemuan = formatif harian. Per submateri = sumatif akhir topik.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg border-2 border-foreground/50 bg-secondary/30">
              <div className="w-9 h-5 rounded-full bg-muted-foreground/30 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-bold">Bank Soal: 1 per Bab (fixed)</div>
                <div className="text-muted-foreground">
                  Bank soal selalu di level Bab — 2 file terpisah (soal + kunci jawaban).
                </div>
              </div>
            </div>
          </div>

          {/* Estimator kredit */}
          <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Zap className="w-4 h-4 text-primary" />
              Estimasi Panggilan AI: {estimate.total} kredit
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              {estimate.breakdown}
            </div>
            <div className="text-[11px] text-muted-foreground italic pt-1">
              Generate per pertemuan/dokumen tetap opsional — kamu tidak harus generate semua
              sekaligus.
            </div>
          </div>

          {/* Tombol Generate Bab (opt-in, hanya jika formData & enabled) */}
          {enabled && formData && (
            <Button
              type="button"
              onClick={() => setGenOpen(true)}
              className="w-full border-2 border-foreground shadow-brutal-sm"
            >
              <Sparkles className="w-4 h-4 mr-1" /> Generate Bab Sekarang (~{estimate.total} kredit)
            </Button>
          )}
        </div>
      )}

      {formData && (
        <BabGenerateDialog
          open={genOpen}
          onOpenChange={setGenOpen}
          formData={formData}
          struktur={struktur}
          onApply={onApplyBabResult}
        />
      )}
    </div>
  );
};
