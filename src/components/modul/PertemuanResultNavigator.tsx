import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

  return (
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

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {JENIS_DOKUMEN_ORDER.map((jenis) => {
            const jStatus = aktif.status[jenis] ?? 'idle';
            const isCompleted = !!aktif.dokumen[jenis];
            const isPending = jStatus === 'pending';

            return (
              <button
                key={jenis}
                type="button"
                onClick={() => selectJenis(jenis)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-md border-2 flex items-center gap-1.5 transition-all ${
                  jenis === currentJenis
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
  );
};
