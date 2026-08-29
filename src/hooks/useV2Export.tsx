/**
 * FASE 4B — Orkestrator export V2 (Word / PDF / DOCX Soal).
 *
 * Sumber data selalu `GenerationResultV2` terbaru (termasuk hasil edit
 * manual). Tidak memakai `toLegacy` dan tidak memutasi state hasil.
 */

import { useCallback, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  buildWordHtml,
  convertImagesToDataUrl,
  createStagingContainer,
  destroyStagingContainer,
  downloadBlob,
  sanitizeWordFormElements,
  stripInteractiveElements,
  stripWordExportInlineStyles,
  waitForAssets,
} from '@/lib/export-dom';
import { pruneV2ExportSections } from '@/lib/export-sections';
import { preprocessElementForOmml } from '@/lib/math-omml';
import {
  buildV2ExportPlan,
  getBankSoalForPertemuan,
  type V2ExportFormat,
  type V2ExportPlan,
  type V2ExportScope,
} from '@/lib/pertemuan-export';
import { V2ExportStage } from '@/components/modul/V2ExportStage';
import type { OutputFormat } from '@/types/export-format';
import type {
  FormData,
  GenerationResultV2,
  JenisDokumenPertemuan,
} from '@/types/modul';

interface UseV2ExportArgs {
  result: GenerationResultV2;
  formData: FormData;
  letterheadUrl?: string | null;
  isLetterheadEnabled?: boolean;
  notify: (message: string, type?: 'success' | 'error') => void;
}

export interface RunV2ExportArgs {
  scope: V2ExportScope;
  format: V2ExportFormat;
  activePertemuanId?: string;
  activeJenisDokumen?: JenisDokumenPertemuan;
  outputFormat?: OutputFormat;
}

export const useV2Export = ({
  result,
  formData,
  letterheadUrl,
  isLetterheadEnabled,
  notify,
}: UseV2ExportArgs) => {
  const [isExporting, setIsExporting] = useState(false);
  const runningRef = useRef(false);

  const buildPlan = useCallback(
    (args: {
      scope: V2ExportScope;
      activePertemuanId?: string;
      activeJenisDokumen?: JenisDokumenPertemuan;
    }): V2ExportPlan =>
      buildV2ExportPlan({
        result,
        scope: args.scope,
        activePertemuanId: args.activePertemuanId,
        activeJenisDokumen: args.activeJenisDokumen,
        formData,
      }),
    [result, formData],
  );

  /** Render seluruh item plan pada container offscreen, lalu jalankan `fn`. */
  const withStagedDom = useCallback(
    async (
      plan: V2ExportPlan,
      outputFormat: OutputFormat,
      fn: (node: HTMLElement) => Promise<void>,
    ): Promise<void> => {
      let container: HTMLElement | null = null;
      let root: Root | null = null;
      try {
        container = createStagingContainer();
        root = createRoot(container);
        await new Promise<void>((resolve) => {
          root!.render(
            <V2ExportStage
              items={plan.items}
              formData={formData}
              modulPreface={result.modulPreface}
              letterheadUrl={letterheadUrl}
              isLetterheadEnabled={isLetterheadEnabled}
              outputFormat={outputFormat}
              onMounted={() => resolve()}
            />,
          );
        });
        // Tunggu commit DOM, font, dan gambar — bukan timeout acak.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        await waitForAssets(container);
        const node = container.querySelector<HTMLElement>(
          '[data-v2-export-root]',
        );
        if (!node) throw new Error('staging render gagal');
        await fn(node);
      } finally {
        try {
          root?.unmount();
        } catch {
          /* noop */
        }
        destroyStagingContainer(container);
      }
    },
    [formData, result.modulPreface, letterheadUrl, isLetterheadEnabled],
  );

  const exportWord = useCallback(
    async (plan: V2ExportPlan, outputFormat: OutputFormat) => {
      await withStagedDom(plan, outputFormat, async (node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        // 1. Bersihkan inline CSS berbahaya (flex, min-height, position, overflow)
        //    SEBELUM prune agar hasSubstantialContent membaca DOM yang sudah bersih.
        stripWordExportInlineStyles(clone);
        // 2. Ganti textarea/input/select dengan plain text.
        sanitizeWordFormElements(clone);
        // 3. Sisakan tepat satu section per item export dan normalisasi page break.
        pruneV2ExportSections(clone);
        // 4. Hapus tombol & elemen UI non-konten.
        stripInteractiveElements(clone);
        const img = await convertImagesToDataUrl(clone);
        if (img.failed > 0) {
          notify(`${img.failed} gambar gagal dimuat dan dilewati`, 'error');
        }
        preprocessElementForOmml(clone);
        const html = buildWordHtml(clone.innerHTML, plan.filenameBase);
        downloadBlob(
          new Blob(['\ufeff', html], { type: 'application/msword' }),
          `${plan.filenameBase}.doc`,
        );
      });
    },
    [withStagedDom, notify],
  );


  const exportPdf = useCallback(
    async (plan: V2ExportPlan, outputFormat: OutputFormat) => {
      await withStagedDom(plan, outputFormat, async (node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        stripWordExportInlineStyles(clone);
        sanitizeWordFormElements(clone);
        pruneV2ExportSections(clone);
        stripInteractiveElements(clone);
        const img = await convertImagesToDataUrl(clone);
        if (img.failed > 0) {
          notify(`${img.failed} gambar gagal dimuat dan dilewati`, 'error');
        }
        const style = document.createElement('style');
        style.textContent = `
          table { page-break-inside: auto !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          td { page-break-inside: avoid !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          .page-break-before { page-break-before: always !important; }
          h1, h2, h3, h4 { page-break-after: avoid !important; }
        `;
        clone.prepend(style);
        clone.style.background = 'white';

        const holder = createStagingContainer();
        holder.appendChild(clone);
        try {
          const { default: html2pdf } = await import('html2pdf.js');
          const pdfOptions = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            filename: `${plan.filenameBase}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.95 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              letterRendering: true,
              scrollY: 0,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: {
              mode: ['css', 'legacy'] as ('css' | 'legacy')[],
              before: '.page-break-before',
              avoid: ['tr', 'h1', 'h2', 'h3', 'h4'],
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;

          const itemsToExport = Array.from(clone.querySelectorAll<HTMLElement>('[data-v2-export-item]'));
          
          // Flatten rowSpans to prevent html2pdf table splitting bugs (column crushing)
          clone.querySelectorAll('td[rowspan], th[rowspan]').forEach((cell) => {
            const el = cell as HTMLTableCellElement;
            const rowSpan = parseInt(el.getAttribute('rowspan') || '1', 10);
            if (rowSpan > 1) {
              el.removeAttribute('rowspan');
              el.style.borderBottom = 'none';
              let currentRow = el.parentElement?.nextElementSibling;
              for (let i = 1; i < rowSpan; i++) {
                if (currentRow) {
                  const cloneCell = el.cloneNode(true) as HTMLTableCellElement;
                  cloneCell.style.color = 'transparent';
                  cloneCell.style.borderTop = 'none';
                  cloneCell.style.borderBottom = 'none';
                  if (i === rowSpan - 1) cloneCell.style.borderBottom = '1px solid black';
                  
                  Array.from(cloneCell.children).forEach((child) => {
                    if (child instanceof HTMLElement) {
                      child.style.opacity = '0';
                    }
                  });
                  currentRow.insertBefore(cloneCell, currentRow.firstChild);
                  currentRow = currentRow.nextElementSibling;
                }
              }
            }
          });

          // Hapus inline pageBreakInside: avoid untuk mencegah bug duplikasi teks di html2pdf css mode
          clone.querySelectorAll('[style*="page-break-inside"], [style*="break-inside"]').forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.pageBreakInside = '';
              el.style.breakInside = '';
            }
          });

          if (itemsToExport.length === 0) {
            await html2pdf().set(pdfOptions).from(clone).save();
          } else {
            let worker = html2pdf().set(pdfOptions);
            for (let i = 0; i < itemsToExport.length; i++) {
              const el = itemsToExport[i];
              // Bersihkan margin top dan class page break dari root elemen karena kita akan ganti halaman secara manual
              el.style.marginTop = '0';
              el.classList.remove('page-break-before');
              el.style.pageBreakBefore = 'auto';

              if (i === 0) {
                worker = worker.from(el).toPdf();
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                worker = worker.get('pdf').then((pdf: any) => {
                  pdf.addPage();
                }).from(el).toContainer().toCanvas().toPdf();
              }
            }
            await worker.save();
          }
        } finally {
          destroyStagingContainer(holder);
        }
      });
    },
    [withStagedDom, notify],
  );

  const exportSoalDocx = useCallback(
    async (plan: V2ExportPlan, activePertemuanId?: string) => {
      const bank = getBankSoalForPertemuan(result, activePertemuanId);
      if (!bank) throw new Error('Bank Soal pertemuan aktif belum tersedia');
      const { exportSoalToDocx } = await import('@/lib/soal-docx-export');
      const out = await exportSoalToDocx(bank, formData, {
        letterheadUrl: letterheadUrl ?? null,
        letterheadEnabled: !!isLetterheadEnabled,
      });
      downloadBlob(out.blob, `${plan.filenameBase}.docx`);
    },
    [result, formData, letterheadUrl, isLetterheadEnabled],
  );

  const runExport = useCallback(
    async (args: RunV2ExportArgs): Promise<boolean> => {
      if (runningRef.current) return false;
      const plan = buildPlan(args);
      if (plan.items.length === 0) {
        notify('Tidak ada dokumen yang bisa diekspor', 'error');
        return false;
      }
      
      const outputFormat = args.outputFormat || 'tabel';

      // FASE 4B.1 — invariant runtime DOCX Soal (tidak bergantung dialog).
      if (args.format === 'soal_docx') {
        const bank =
          args.scope === 'active_document' && args.activeJenisDokumen === 'soal'
            ? getBankSoalForPertemuan(result, args.activePertemuanId)
            : null;
        if (!bank) {
          notify(
            'DOCX Soal hanya untuk Dokumen Aktif jenis Soal yang tersedia',
            'error',
          );
          return false;
        }
      }
      runningRef.current = true;
      setIsExporting(true);
      try {
        if (args.format === 'word') await exportWord(plan, outputFormat);
        else if (args.format === 'pdf') await exportPdf(plan, outputFormat);
        else await exportSoalDocx(plan, args.activePertemuanId);
        notify('Export berhasil di-download!');
        return true;
      } catch (err) {
        console.error('[v2-export] gagal:', err);
        notify('Export gagal. Silakan coba lagi.', 'error');
        return false;
      } finally {
        runningRef.current = false;
        setIsExporting(false);
        document
          .querySelectorAll('[data-v2-export-stage]')
          .forEach((el) => el.remove());
      }
    },
    [buildPlan, exportWord, exportPdf, exportSoalDocx, notify, result],
  );

  return { isExporting, buildPlan, runExport };
};
