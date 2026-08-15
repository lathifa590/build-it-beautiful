/**
 * FASE 4B — Dialog export V2 (dipakai desktop, tablet/mobile, dan FAB).
 */

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  describeV2ExportPlan,
  describeV2Skipped,
  type V2ExportFormat,
  type V2ExportPlan,
  type V2ExportScope,
} from '@/lib/pertemuan-export';
import type { JenisDokumenPertemuan } from '@/types/modul';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeJenis: JenisDokumenPertemuan;
  activePertemuanNomor?: number;
  isExporting: boolean;
  buildPlan: (args: { scope: V2ExportScope }) => V2ExportPlan;
  onExport: (args: { scope: V2ExportScope; format: V2ExportFormat }) => void;
}

const SCOPE_OPTIONS: { value: V2ExportScope; label: string }[] = [
  { value: 'active_document', label: 'Dokumen Aktif' },
  { value: 'active_meeting', label: 'Pertemuan Aktif' },
  { value: 'complete_package', label: 'Paket Semua Pertemuan' },
];

export const V2ExportDialog = ({
  open,
  onOpenChange,
  activeJenis,
  activePertemuanNomor,
  isExporting,
  buildPlan,
  onExport,
}: Props) => {
  const [scope, setScope] = useState<V2ExportScope>('active_document');
  const [format, setFormat] = useState<V2ExportFormat>('word');

  const plan = useMemo(() => buildPlan({ scope }), [buildPlan, scope]);
  const soalDocxAvailable = scope === 'active_document' && activeJenis === 'soal';
  const effectiveFormat: V2ExportFormat =
    format === 'soal_docx' && !soalDocxAvailable ? 'word' : format;
  const disabled = plan.items.length === 0 || isExporting;

  const included = describeV2ExportPlan(plan);
  const skipped = describeV2Skipped(plan);

  return (
    <Dialog open={open} onOpenChange={(o) => !isExporting && onOpenChange(o)}>
      <DialogContent className="max-w-md" data-testid="v2-export-dialog">
        <DialogHeader>
          <DialogTitle>Export Dokumen per Pertemuan</DialogTitle>
          <DialogDescription>
            Pilih cakupan dan format export. Prota/Prosem/KKTP tidak termasuk paket ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Cakupan</p>
            <div className="grid gap-2">
              {SCOPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={isExporting}
                  data-testid={`v2-scope-${o.value}`}
                  onClick={() => setScope(o.value)}
                  className={`text-left px-3 py-2 rounded-md border-2 text-sm font-bold ${
                    scope === o.value
                      ? 'bg-primary text-primary-foreground border-foreground'
                      : 'bg-card border-foreground/30'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Format</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="v2-format-word"
                disabled={isExporting}
                onClick={() => setFormat('word')}
                className={`px-3 py-1.5 rounded-md border-2 text-xs font-bold ${
                  effectiveFormat === 'word'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-foreground/30'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Word
              </button>
              <button
                type="button"
                data-testid="v2-format-pdf"
                disabled={isExporting}
                onClick={() => setFormat('pdf')}
                className={`px-3 py-1.5 rounded-md border-2 text-xs font-bold ${
                  effectiveFormat === 'pdf'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-foreground/30'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                PDF
              </button>
              {soalDocxAvailable && (
                <button
                  type="button"
                  data-testid="v2-format-soal-docx"
                  disabled={isExporting}
                  onClick={() => setFormat('soal_docx')}
                  className={`px-3 py-1.5 rounded-md border-2 text-xs font-bold ${
                    effectiveFormat === 'soal_docx'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-foreground/30'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  DOCX Soal (Equation)
                </button>
              )}
            </div>
            {scope !== 'active_document' && (
              <p className="text-[11px] text-muted-foreground">
                DOCX Soal (Equation) hanya tersedia untuk scope Dokumen Aktif jenis Soal.
                Untuk paket, gunakan Word atau PDF.
              </p>
            )}
          </div>

          <div className="rounded-md border-2 border-foreground/20 p-3 space-y-1 text-xs">
            <p>
              <strong>Pertemuan aktif:</strong> {activePertemuanNomor ?? '-'}
            </p>
            <p>
              <strong>Pertemuan tercakup:</strong> {plan.pertemuanCount}
            </p>
            <p data-testid="v2-plan-count">
              <strong>Jumlah dokumen:</strong> {plan.items.length}
            </p>
            {included.length > 0 && (
              <ul className="list-disc pl-4 max-h-32 overflow-y-auto">
                {included.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {skipped.length > 0 && (
              <div className="pt-1 text-muted-foreground">
                <strong>Dilewati:</strong>
                <ul className="list-disc pl-4">
                  {skipped.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            data-testid="v2-export-submit"
            disabled={disabled}
            onClick={() => onExport({ scope, format: effectiveFormat })}
          >
            {isExporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
