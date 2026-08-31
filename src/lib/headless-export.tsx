import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import {
  buildWordHtml,
  convertImagesToDataUrl,
  createStagingContainer,
  destroyStagingContainer,
  sanitizeWordFormElements,
  stripInteractiveElements,
  stripWordExportInlineStyles,
  waitForAssets,
} from '@/lib/export-dom';
import { pruneV2ExportSections } from '@/lib/export-sections';
import { preprocessElementForOmml } from '@/lib/math-omml';
import { V2ExportStage } from '@/components/modul/V2ExportStage';
import { buildV2ExportPlan } from '@/lib/pertemuan-export';
import type { FormData, GenerationResultV2 } from '@/types/modul';

/**
 * Merender dokumen V2 ke dalam container tersembunyi secara sekuensial,
 * kemudian mengembalikan Blob file Word (.doc) tanpa trigger download.
 * Digunakan untuk menggabungkan banyak dokumen ke dalam ZIP (Bundle to Store).
 */
export const generateV2WordBlob = async (
  result: GenerationResultV2,
  formData: FormData,
  pertemuanId: string
): Promise<{ blob: Blob, filename: string }> => {
  
  const plan = buildV2ExportPlan({
    result,
    scope: 'single', // We only want to export this specific meeting
    activePertemuanId: pertemuanId,
    activeJenisDokumen: 'modul', // Default, the plan will export all if scope is 'single'
    formData,
  });

  if (plan.items.length === 0) {
    throw new Error('Tidak ada dokumen yang bisa diekspor untuk pertemuan ini');
  }

  let container: HTMLElement | null = null;
  let root: Root | null = null;
  
  try {
    container = createStagingContainer();
    document.body.appendChild(container);
    root = createRoot(container);

    await new Promise<void>((resolve) => {
      root!.render(
        <V2ExportStage
          items={plan.items}
          formData={formData}
          modulPreface={result.modulPreface}
          letterheadUrl={null}
          isLetterheadEnabled={false}
          onRendered={resolve}
        />
      );
    });

    // Beri waktu sejenak untuk memastikan DOM ter-update penuh
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await waitForAssets(container);

    const node = container.querySelector<HTMLElement>('[data-v2-export-root]');
    if (!node) throw new Error('Staging render gagal, root tidak ditemukan');

    const clone = node.cloneNode(true) as HTMLElement;
    
    // 1. Bersihkan inline CSS berbahaya
    stripWordExportInlineStyles(clone);
    // 2. Ganti elemen form
    sanitizeWordFormElements(clone);
    // 3. Sisakan tepat satu section per item export
    pruneV2ExportSections(clone);
    // 4. Hapus elemen interaktif
    stripInteractiveElements(clone);
    
    // 5. Konversi gambar
    await convertImagesToDataUrl(clone);
    
    // 6. Preprocess rumus matematika
    preprocessElementForOmml(clone);

    const html = buildWordHtml(clone.innerHTML, plan.filenameBase);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });

    return {
      blob,
      filename: `${plan.filenameBase}.doc`
    };

  } finally {
    if (root) {
      // Tunggu tick berikutnya sebelum unmount
      await new Promise<void>(r => setTimeout(r, 0));
      root.unmount();
    }
    destroyStagingContainer(container);
  }
};
