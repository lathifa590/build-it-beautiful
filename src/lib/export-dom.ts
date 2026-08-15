/**
 * FASE 4B — Helper DOM export bersama (legacy & V2).
 *
 * Diekstrak agar handler V2 tidak menyalin ulang ratusan baris pipeline
 * export legacy. Perilaku dipertahankan identik dengan implementasi legacy
 * di `src/pages/Index.tsx` (yang tetap tidak diubah pada fase ini).
 */

import { WORD_HTML_NAMESPACES } from '@/lib/math-omml';

export const INTERACTIVE_SELECTOR = 'button, [data-no-export], .print\\:hidden';

/** Buang tombol/editor/elemen bertanda `data-no-export`. */
export const stripInteractiveElements = (root: HTMLElement): void => {
  root.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => el.remove());
};

/**
 * Ubah gambar eksternal menjadi data URL agar tertanam di file Word.
 * Mengembalikan jumlah gambar yang gagal (export tetap dilanjutkan).
 */
export const convertImagesToDataUrl = async (
  root: HTMLElement,
): Promise<{ total: number; failed: number }> => {
  const images = Array.from(root.querySelectorAll('img'));
  let failed = 0;
  await Promise.all(
    images.map(async (img) => {
      if (!img.src.startsWith('http')) return;
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.onerror = () => {
            failed += 1;
            img.style.display = 'none';
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        failed += 1;
        img.style.display = 'none';
      }
    }),
  );
  return { total: images.length, failed };
};

/**
 * Tunggu seluruh gambar & font selesai dimuat pada subtree tertentu.
 * Sinkronisasi utama adalah event `load`/`error` dan `document.fonts.ready`;
 * `capMs` hanya jaring pengaman agar aset yang tidak pernah selesai (mis. CORS
 * menggantung) tidak membekukan export.
 */
export const waitForAssets = async (
  root: HTMLElement,
  capMs = 8000,
): Promise<void> => {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  const tasks: Promise<unknown>[] = [];
  if (fonts?.ready) tasks.push(fonts.ready.catch(() => undefined));
  root.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    tasks.push(
      new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      }),
    );
  });
  await Promise.race([
    Promise.all(tasks),
    new Promise<void>((resolve) => setTimeout(resolve, capMs)),
  ]);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

/**
 * Hapus inline CSS berbahaya yang menyebabkan setiap elemen mengambil
 * satu halaman penuh di Word:
 *
 * - `min-height` besar (dari Tailwind min-h-screen, flex-1, dll.)
 * - `height` berisi `%`, `vh`, `auto` yang tidak relevan
 * - `flex`, `flex-grow`, `flex-shrink`, `flex-basis` (bisa menyebabkan overflow)
 * - `overflow` (Word tidak mendukung scroll box)
 * - `position: fixed / absolute` (mengambang di luar flow halaman)
 * - `page-break-*` di dalam section (hanya wrapper boleh punya ini)
 *
 * Catatan: properti seperti `padding`, `margin`, `font-size`, `color`
 * DIBIARKAN karena berguna untuk formatting di Word.
 */
export const stripWordExportInlineStyles = (root: HTMLElement): void => {
  const DANGER_PROPS = [
    'minHeight', 'maxHeight',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'flexDirection',
    'flexWrap', 'alignItems', 'justifyContent', 'alignSelf', 'justifySelf',
    'position',
    'overflow', 'overflowX', 'overflowY',
    'pointerEvents', 'userSelect',
    'resize',
    'zIndex',
  ] as const;

  // Props yang direset kecuali pada wrapper export item (page-break dikelola oleh pruneV2ExportSections)
  const PAGE_BREAK_PROPS = [
    'pageBreakBefore', 'pageBreakAfter', 'pageBreakInside',
    'breakBefore', 'breakAfter', 'breakInside',
  ] as const;

  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const s = el.style;
    if (!s) return;

    // Bersihkan properti berbahaya
    for (const prop of DANGER_PROPS) {
      s.removeProperty(
        prop.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`),
      );
    }

    // Bersihkan height mencurigakan (bukan px kecil): vh, %, calc, auto besar
    const h = s.height;
    if (h && (h.includes('vh') || h.includes('%') || h === 'auto' || h === '100%')) {
      s.removeProperty('height');
    }

    // Page break hanya diizinkan pada wrapper export item (memiliki data-v2-export-item)
    if (!el.hasAttribute('data-v2-export-item')) {
      for (const prop of PAGE_BREAK_PROPS) {
        s.removeProperty(
          prop.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`),
        );
      }
    }
  });
};

/**
 * Ganti elemen form (textarea, input, select) dengan teks biasa
 * agar Word tidak merender kotak form yang tidak berguna.
 * Textarea dengan teks "Jawaban:" atau kosong diganti div kosong.
 */
export const sanitizeWordFormElements = (root: HTMLElement): void => {
  // Ganti textarea dengan div (preserves text content)
  root.querySelectorAll('textarea').forEach((ta) => {
    const div = document.createElement('div');
    div.style.border = '1px solid #999';
    div.style.minHeight = '60px';
    div.style.padding = '4px';
    div.textContent = ta.value || ta.textContent || '';
    ta.parentNode?.replaceChild(div, ta);
  });

  // Hapus input tersembunyi, biarkan input[type=text] jika ada teks
  root.querySelectorAll('input').forEach((inp) => {
    const type = inp.getAttribute('type') || 'text';
    if (['hidden', 'checkbox', 'radio', 'submit', 'button'].includes(type)) {
      inp.remove();
    } else {
      const span = document.createElement('span');
      span.textContent = inp.value || '';
      inp.parentNode?.replaceChild(span, inp);
    }
  });

  // Hapus select
  root.querySelectorAll('select').forEach((sel) => {
    const span = document.createElement('span');
    span.textContent = sel.options[sel.selectedIndex]?.text ?? '';
    sel.parentNode?.replaceChild(span, sel);
  });
};

export const WORD_EXPORT_CSS = `
/* Reset dasar */
*{box-sizing:border-box;margin:0;padding:0;min-height:0!important;max-height:none!important;
  height:auto!important;flex:none!important;overflow:visible!important;
  position:static!important;float:none!important}
/* Typography */
body{font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;background:#fff}
/* Tables */
table{width:100%!important;border-collapse:collapse!important;margin-bottom:12px;
  display:table!important;table-layout:fixed!important}
tr{display:table-row!important}
td,th{border:1px solid #000;padding:6px 8px;vertical-align:top;
  display:table-cell!important;word-wrap:break-word;overflow-wrap:break-word}
/* Headings */
h1{font-size:16pt;font-weight:bold;margin:12px 0 6px}
h2{font-size:14pt;font-weight:bold;margin:10px 0 5px}
h3{font-size:12pt;font-weight:bold;margin:8px 0 4px}
h4,h5,h6{font-size:11pt;font-weight:bold;margin:6px 0 3px}
/* Paragraphs & lists */
p{margin:4px 0;line-height:1.5}
ul,ol{margin:6px 0;padding-left:20px}
li{margin:2px 0}
/* Inline */
sup{vertical-align:super;font-size:0.75em}
sub{vertical-align:sub;font-size:0.75em}
b,strong{font-weight:bold}
i,em{font-style:italic}
u{text-decoration:underline}
/* Images */
img{max-width:100%;display:block}
/* Page breaks (dikendalikan pruneV2ExportSections) */
.page-break-before{page-break-before:always!important;break-before:page!important}
/* Section wrappers */
[data-v2-export-item]{display:block!important}
/* Div/span umum */
div,span,section,article,main,header,footer,nav,aside{display:block}
`;



/** Bungkus konten menjadi HTML yang dikenali Word (termasuk namespace OMML). */
export const buildWordHtml = (contentHTML: string, title: string): string =>
  `<html ${WORD_HTML_NAMESPACES}><head><meta charset='utf-8'><title>${title}</title><style>${WORD_EXPORT_CSS}</style></head><body>${contentHTML}</body></html>`;

/** Trigger download dan selalu revoke Object URL. */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

/** Container offscreen untuk staging render (tidak terlihat pengguna). */
export const createStagingContainer = (): HTMLDivElement => {
  const el = document.createElement('div');
  el.setAttribute('data-v2-export-stage', 'true');
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'fixed';
  el.style.left = '-10000px';
  el.style.top = '0';
  el.style.width = '210mm';
  el.style.background = 'white';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  return el;
};

export const destroyStagingContainer = (el: HTMLElement | null): void => {
  if (el && el.parentNode) el.parentNode.removeChild(el);
};
