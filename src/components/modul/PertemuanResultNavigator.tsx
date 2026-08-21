import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, RefreshCw, ChevronDown, Maximize2, AlignJustify, AlertTriangle } from 'lucide-react';
import type {
  GenerationResultV2,
  JenisDokumenPertemuan,
  StatusGenerateDokumen,
} from '@/types/modul';
import {
  JENIS_DOKUMEN_ORDER,
  LABEL_DOKUMEN,
  LABEL_STATUS,
} from '@/lib/pertemuan-generation';
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

export type RegenerateMode = 'default' | 'detail' | 'ringkas';

interface Props {
  result: GenerationResultV2;
  /** Renderer dokumen — memakai renderer lama dengan data pertemuan aktif. */
  renderDokumen: (args: {
    pertemuanId: string;
    jenis: JenisDokumenPertemuan;
    dokumen: unknown;
  }) => React.ReactNode;
  onRetry?: (pertemuanId: string, jenis: JenisDokumenPertemuan) => void;
  /**
   * Dipanggil saat user menekan tombol "Buat Soal Pertemuan X" di tab Soal.
   * Harus membuka SoalConfigModal agar user bisa memilih konfigurasi soal
   * sebelum generate — sama seperti flow V1.
   */
  onOpenSoalModal?: (pertemuanId: string) => void;
  /** Controlled state (opsional) — bila tidak diisi, memakai state internal. */
  activePertemuanId?: string;
  activeJenis?: JenisDokumenPertemuan;
  onChangePertemuan?: (pertemuanId: string) => void;
  onChangeJenis?: (jenis: JenisDokumenPertemuan) => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const statusClass: Record<StatusGenerateDokumen, string> = {
  idle: 'bg-muted text-muted-foreground',
  pending: 'bg-primary/20 text-primary',
  ok: 'bg-emerald-500/20 text-emerald-700',
  error: 'bg-destructive/20 text-destructive',
};

// ─── Regenerate Dropdown (Portal) ─────────────────────────────────────────────
interface RegenDropdownProps {
  onRegenerate: (mode: RegenerateMode) => void;
  isModul?: boolean;
}

const RegenDropdown = ({ onRegenerate, isModul }: RegenDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Hitung posisi dropdown saat dibuka
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(v => !v);
  };

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        // cek apakah klik di dalam dropdown portal
        const dropEl = document.getElementById('regen-dropdown-portal');
        if (!dropEl || !dropEl.contains(target)) setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        title="Opsi Regenerate"
        aria-label="Opsi Regenerate"
        className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold rounded-r-md border-2 border-l-0 border-foreground/40 bg-card text-foreground hover:bg-primary/10 transition-colors flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          id="regen-dropdown-portal"
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-48 bg-card border-2 border-foreground rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          {isModul && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-b border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] text-amber-700 font-medium leading-tight">
                Akan mereset dokumen turunan
              </span>
            </div>
          )}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-primary/10 transition-colors text-left"
            onClick={() => { onRegenerate('default'); setOpen(false); }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            Generate Ulang
          </button>
          <div className="h-px bg-border" />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-primary/10 transition-colors text-left text-muted-foreground"
            onClick={() => { onRegenerate('detail'); setOpen(false); }}
          >
            <Maximize2 className="w-3.5 h-3.5 flex-shrink-0" />
            Buat Lebih Detail
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-primary/10 transition-colors text-left text-muted-foreground"
            onClick={() => { onRegenerate('ringkas'); setOpen(false); }}
          >
            <AlignJustify className="w-3.5 h-3.5 flex-shrink-0" />
            Buat Lebih Ringkas
          </button>
        </div>,
        document.body
      )}
    </>
  );
};



/**
 * Navigasi hasil V2: pilih pertemuan → pilih tab dokumen milik pertemuan itu.
 * Tidak pernah menampilkan dokumen milik pertemuan lain.
 */
export const PertemuanResultNavigator = ({
  result,
  renderDokumen,
  onRetry,
  onOpenSoalModal,
  activePertemuanId,
  activeJenis,
  onChangePertemuan,
  onChangeJenis,
  className = 'space-y-3',
  headerClassName = 'space-y-3',
  bodyClassName = '',
}: Props) => {
  const [innerPertemuanId, setInnerPertemuanId] = useState<string>(
    result.pertemuan[0]?.id ?? '',
  );
  const [innerJenis, setInnerJenis] = useState<JenisDokumenPertemuan>('modul');

  // Alert dialog konfirmasi regenerate Modul
  const [showModulAlert, setShowModulAlert] = useState(false);

  const currentPertemuanId = activePertemuanId ?? innerPertemuanId;
  const currentJenis = activeJenis ?? innerJenis;
  const selectPertemuan = (id: string) => {
    setInnerPertemuanId(id);
    onChangePertemuan?.(id);
  };
  const selectJenis = (j: JenisDokumenPertemuan) => {
    setInnerJenis(j);
    onChangeJenis?.(j);
  };

  const aktif =
    result.pertemuan.find((p) => p.id === currentPertemuanId) ?? result.pertemuan[0];
  if (!aktif) return null;

  const status: StatusGenerateDokumen = aktif.status[currentJenis] ?? 'idle';
  const dipilih = currentJenis === 'modul' ? true : !!aktif.pilihanDokumen[currentJenis];
  const dokumen = aktif.dokumen[currentJenis];

  /** Tangani klik regenerate dari dropdown — Modul perlu konfirmasi lebih dulu */
  const handleRegenerate = (jenis: JenisDokumenPertemuan, _mode: RegenerateMode) => {
    if (jenis === 'modul') {
      setShowModulAlert(true);
    } else {
      onRetry?.(aktif.id, jenis);
    }
  };

  return (
    <>
    <div className={className}>
      <div className={headerClassName}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {result.pertemuan.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPertemuan(p.id)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-md border-2 ${
                p.id === aktif.id
                  ? 'bg-primary text-primary-foreground border-foreground'
                  : 'bg-card text-foreground border-foreground/30'
              }`}
            >
              Pertemuan {p.nomor} · {p.durasiMenit} menit
            </button>
          ))}
        </div>

        {/* Tab jenis dokumen + tombol regenerate dropdown */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
          {JENIS_DOKUMEN_ORDER.map((jenis) => {
            const jStatus = aktif.status[jenis] ?? 'idle';
            const isCompleted = !!aktif.dokumen[jenis];
            const isPending = jStatus === 'pending';
            const isActive = jenis === currentJenis;

            return (
              <div key={jenis} className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => selectJenis(jenis)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-l-md border-2 flex items-center gap-1.5 transition-all ${
                    isCompleted && isActive ? 'rounded-r-none border-r-0' : 'rounded-md'
                  } ${
                    isActive
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-foreground/30'
                  }`}
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {LABEL_DOKUMEN[jenis]}
                  {!isPending && isCompleted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Selesai" />
                  )}
                </button>

                {/* Tombol dropdown regenerate — hanya saat tab aktif & sudah ada konten */}
                {isActive && isCompleted && !isPending && onRetry && (
                  <RegenDropdown
                    isModul={jenis === 'modul'}
                    onRegenerate={(mode) => handleRegenerate(jenis, mode)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${statusClass[status]}`}
          >
            {LABEL_STATUS[status]}
          </span>
          {status === 'error' && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(aktif.id, currentJenis)}
              className="text-[11px] font-bold underline"
            >
              Coba lagi
            </button>
          )}
        </div>
      </div>

      <div className={bodyClassName}>
        {!dipilih ? (
          // Tab Soal: tampilkan tombol "Buat Soal" agar user bisa set konfigurasi
          currentJenis === 'soal' && onOpenSoalModal ? (
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Soal untuk Pertemuan {aktif.nomor} belum dikonfigurasi.
              </p>
              <button
                type="button"
                onClick={() => onOpenSoalModal(aktif.id)}
                className="px-4 py-2 text-sm font-bold rounded-md border-2 border-foreground bg-primary text-primary-foreground hover:opacity-90"
              >
                Buat Soal Pertemuan {aktif.nomor}…
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">
              {LABEL_DOKUMEN[currentJenis]} tidak dipilih untuk Pertemuan {aktif.nomor}.
            </p>
          )
        ) : status === 'error' ? (
          <div className="p-4 border-2 border-dashed border-destructive rounded-lg space-y-2">
            <p className="text-sm font-bold text-destructive">
              {LABEL_DOKUMEN[currentJenis]} Pertemuan {aktif.nomor} gagal dibuat
              {aktif.errors?.[currentJenis] ? ` — ${aktif.errors[currentJenis]}` : ''}.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(aktif.id, currentJenis)}
                className="px-3 py-1.5 text-xs font-bold rounded-md border-2 border-foreground bg-card"
              >
                Coba lagi
              </button>
            )}
          </div>
        ) : dokumen === undefined ? (
          // Tab Soal idle setelah dipilih: tampilkan CTA konfigurasi
          currentJenis === 'soal' && status === 'idle' && onOpenSoalModal ? (
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Soal Pertemuan {aktif.nomor} belum dibuat. Pilih konfigurasi jenis soal
                terlebih dahulu.
              </p>
              <button
                type="button"
                onClick={() => onOpenSoalModal(aktif.id)}
                className="px-4 py-2 text-sm font-bold rounded-md border-2 border-foreground bg-primary text-primary-foreground hover:opacity-90"
              >
                Buat Soal Pertemuan {aktif.nomor}…
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">
              {LABEL_DOKUMEN[currentJenis]} Pertemuan {aktif.nomor}:{' '}
              {LABEL_STATUS[status].toLowerCase()}.
            </p>
          )
        ) : (
          renderDokumen({ pertemuanId: aktif.id, jenis: currentJenis, dokumen })
        )}
      </div>
    </div>

    {/* Alert Dialog: konfirmasi regenerate Modul (dokumen turunan akan direset) */}
    <AlertDialog open={showModulAlert} onOpenChange={setShowModulAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Regenerate Modul Pertemuan {aktif.nomor}?</AlertDialogTitle>
          <AlertDialogDescription>
            Modul adalah fondasi. Jika Anda men-generate ulang Modul ini, <strong>dokumen turunannya</strong> (LKPD, Asesmen, Materi, Refleksi, Soal) pada Pertemuan {aktif.nomor} akan terdampak dan perlu di-generate ulang juga.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => { onRetry?.(aktif.id, 'modul'); setShowModulAlert(false); }}
          >
            Ya, Regenerate Modul
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
