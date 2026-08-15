import type { GenerationResultV2, JenisDokumenPertemuan } from '@/types/modul';
import {
  JENIS_DOKUMEN_ORDER,
  LABEL_DOKUMEN,
  estimateGenerateCalls,
} from '@/lib/pertemuan-generation';

interface Props {
  result: GenerationResultV2;
  onToggle: (pertemuanId: string, jenis: JenisDokumenPertemuan, value: boolean) => void;
  disabled?: boolean;
}

/**
 * UI pilihan dokumen per pertemuan (Fase 3 V2). Modul selalu aktif & disabled.
 * Hanya dirender ketika feature flag V2 aktif (dijaga oleh pemanggil).
 */
export const PilihanDokumenPertemuanEditor = ({ result, onToggle, disabled }: Props) => {
  if (!result.pertemuan.length) return null;
  const estimasi = estimateGenerateCalls(result, { mode: 'missing' });

  return (
    <div className="mt-3 space-y-3">
      {result.pertemuan.map((p) => (
        <div
          key={p.id}
          className="border-2 border-foreground/20 rounded-lg p-3 bg-card"
        >
          <p className="text-xs font-bold mb-2">
            Pilih dokumen yang akan dibuat untuk Pertemuan {p.nomor} ·{' '}
            {p.durasiMenit} menit
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {JENIS_DOKUMEN_ORDER.map((jenis) => {
              const wajib = jenis === 'modul';
              const checked = wajib ? true : !!p.pilihanDokumen[jenis];
              return (
                <label
                  key={jenis}
                  className={`flex items-center gap-1.5 text-sm font-medium ${
                    wajib ? 'opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={wajib || disabled}
                    onChange={(e) => onToggle(p.id, jenis, e.target.checked)}
                    className="w-4 h-4 accent-primary"
                    aria-label={`${LABEL_DOKUMEN[jenis]} Pertemuan ${p.nomor}`}
                  />
                  {LABEL_DOKUMEN[jenis]}
                  {wajib && (
                    <span className="text-[10px] text-muted-foreground">(wajib)</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Estimasi <strong>{estimasi}</strong> panggilan AI untuk dokumen yang belum
        dibuat.
      </p>
    </div>
  );
};
