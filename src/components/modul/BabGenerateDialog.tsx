// Dialog untuk menjalankan orkestrator generateBab dan menampilkan progres
// + hasil ringkas per-pertemuan. MVP Tahap 6: fokus pada kepastian jalannya
// pipeline hierarki; preview kaya menyusul (bisa memakai komponen preview lama).

import { useMemo } from 'react';
import { Loader2, X, CheckCircle2, Download, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBabGenerator } from '@/hooks/useBabGenerator';
import type { BabResult, FormData, StrukturHierarki } from '@/types/modul';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formData: FormData;
  struktur: StrukturHierarki;
  /** Opsional: kalau diberikan, tampilkan tombol "Terapkan ke Editor". */
  onApply?: (result: BabResult) => void;
}

export const BabGenerateDialog = ({ open, onOpenChange, formData, struktur, onApply }: Props) => {
  const gen = useBabGenerator();

  const percent = useMemo(() => {
    if (!gen.progress) return 0;
    return Math.round((gen.progress.currentCall / Math.max(1, gen.progress.totalCalls)) * 100);
  }, [gen.progress]);

  const submateriList = struktur.bab.submateri;

  const start = () => {
    void gen.start(formData, struktur);
  };

  const downloadJson = () => {
    if (!gen.result) return;
    const blob = new Blob([JSON.stringify(gen.result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bab-${(struktur.bab.judul || 'hasil').replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const close = () => {
    if (gen.isRunning) gen.cancel();
    onOpenChange(false);
    setTimeout(() => gen.reset(), 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generate Bab — {struktur.bab.judul || 'Tanpa Judul'}
            <span className="text-[10px] font-black tracking-wider bg-amber-200 text-amber-900 border-2 border-amber-900 px-1.5 py-0.5 rounded">
              BETA
            </span>
          </DialogTitle>
          <DialogDescription>
            {submateriList.length} submateri ·{' '}
            {submateriList.reduce((n, s) => n + s.pertemuan.length, 0)} pertemuan. Proses
            berurutan supaya kesinambungan antar pertemuan terjaga.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan struktur */}
        <div className="max-h-40 overflow-y-auto border-2 border-foreground rounded-lg p-2 space-y-1 text-xs">
          {submateriList.map((s, i) => (
            <div key={s.id}>
              <div className="font-bold">
                {i + 1}. {s.judul || `Submateri ${i + 1}`}{' '}
                <span className="text-muted-foreground font-normal">
                  ({s.pertemuan.length} pertemuan · {s.alokasiJP} JP)
                </span>
              </div>
              <div className="pl-4 text-muted-foreground">
                {s.pertemuan.map((p) => `P${p.nomor} (${p.durasi})`).join(' · ')}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {gen.isRunning && gen.progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {gen.progress.message}
              </span>
              <span>
                {gen.progress.currentCall}/{gen.progress.totalCalls}
              </span>
            </div>
            <Progress value={percent} />
          </div>
        )}

        {/* Error */}
        {gen.error && !gen.isRunning && (
          <div className="flex items-start gap-2 p-3 border-2 border-destructive rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold">{gen.error}</span>
          </div>
        )}

        {/* Hasil ringkas */}
        {gen.result && !gen.isRunning && (
          <div className="max-h-60 overflow-y-auto border-2 border-foreground rounded-lg p-2 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Generate selesai — {Object.keys(gen.result.submateri).length} submateri, Bank Soal{' '}
              {gen.result.bankSoal ? '✅' : '—'}
            </div>
            {Object.entries(gen.result.submateri).map(([sid, sres]) => {
              const sub = submateriList.find((x) => x.id === sid);
              return (
                <div key={sid} className="border-t border-foreground/20 pt-1">
                  <div className="font-bold">{sub?.judul || sid}</div>
                  {Object.entries(sres.pertemuanDocs).map(([pid, docs]) => (
                    <div key={pid} className="pl-3 text-muted-foreground">
                      P{docs.modul?.nomorPertemuan ?? '?'} —{' '}
                      {[
                        docs.modul && 'Modul',
                        docs.lkpd && 'LKPD',
                        docs.refleksi && 'Refleksi',
                        docs.materi && 'Materi',
                        docs.asesmen && 'Asesmen',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  ))}
                  {sres.materiGlobal && (
                    <div className="pl-3 text-muted-foreground italic">
                      Materi global submateri ✅
                    </div>
                  )}
                  {sres.asesmenGlobal && (
                    <div className="pl-3 text-muted-foreground italic">
                      Asesmen global submateri ✅
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {gen.isRunning ? (
            <Button variant="outline" onClick={gen.cancel}>
              <X className="w-4 h-4 mr-1" /> Batalkan
            </Button>
          ) : gen.result ? (
            <>
              <Button variant="outline" onClick={downloadJson}>
                <Download className="w-4 h-4 mr-1" /> Unduh JSON
              </Button>
              <Button variant="outline" onClick={gen.reset}>
                Generate Ulang
              </Button>
              {onApply && (
                <Button
                  onClick={() => {
                    if (gen.result) onApply(gen.result);
                    close();
                  }}
                >
                  <ArrowRightCircle className="w-4 h-4 mr-1" /> Terapkan ke Editor
                </Button>
              )}
              <Button variant={onApply ? 'outline' : 'default'} onClick={close}>
                Tutup
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={close}>
                Batal
              </Button>
              <Button onClick={start}>Mulai Generate</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
