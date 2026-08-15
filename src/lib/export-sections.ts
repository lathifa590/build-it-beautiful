/**
 * FASE 4B.1 — Helper DOM murni untuk membersihkan staging export V2.
 *
 * Akar masalah yang diperbaiki: `V2ExportStage` merender satu `DocumentPreview`
 * penuh untuk setiap item plan. `DocumentPreview` SELALU memiliki section
 * `data-section="modul"` (dan section lain bila datanya ada), sedangkan hanya
 * section yang sesuai `activeTab` yang `display:block`. Pipeline Word lama
 * memaksa SEMUA `[data-section]` menjadi `display:block`, sehingga dokumen
 * non-Modul ikut memuat section Modul kosong dan konten di luar export plan.
 *
 * Modul ini PURE terhadap state aplikasi: hanya menerima root DOM (biasanya
 * hasil `cloneNode`) dan memanipulasi clone tersebut.
 */

import type { JenisDokumenPertemuan } from '@/types/modul';

/** Pemetaan jenis dokumen V2 → atribut `data-section` di DocumentPreview. */
export const V2_JENIS_SECTION_MAP: Record<JenisDokumenPertemuan, string> = {
  modul: 'modul',
  lkpd: 'lkpd',
  asesmen: 'asesmen',
  soal: 'soal',
  materi: 'materi',
  refleksi: 'tindakLanjut',
};

const isEmptyPageBreakDiv = (el: Element | null): el is HTMLElement => {
  if (!el || el.tagName !== 'DIV') return false;
  const html = el as HTMLElement;
  if (html.children.length > 0) return false;
  if ((html.textContent ?? '').trim() !== '') return false;
  return (
    html.style.pageBreakBefore === 'always' ||
    html.style.breakBefore === 'page' ||
    html.style.pageBreakAfter === 'always' ||
    html.classList.contains('page-break-before')
  );
};

/**
 * Normalisasi page break internal section aktif.
 *
 * Aturan canonical: page break antardokumen HANYA berasal dari wrapper
 * `V2ExportStage`. Section di dalam item tidak boleh menambah page break awal
 * lagi (menyebabkan halaman kosong), dan tidak boleh menyisakan page break
 * menggantung di akhir dokumen (halaman kosong di akhir file).
 */
export const normalizeSectionPageBreaks = (section: HTMLElement): void => {
  section.style.pageBreakBefore = '';
  section.style.breakBefore = '';
  section.style.marginTop = '0';
  section.classList.remove('page-break-before');

  while (isEmptyPageBreakDiv(section.firstElementChild)) {
    section.firstElementChild!.remove();
  }
  while (isEmptyPageBreakDiv(section.lastElementChild)) {
    section.lastElementChild!.remove();
  }
};

export interface PruneV2Result {
  /** Jumlah wrapper item yang diproses. */
  items: number;
  /** Jumlah section aktif yang tersisa (harus sama dengan `items`). */
  keptSections: number;
  /** Jumlah section yang dibuang dari clone. */
  removedSections: number;
}

/**
 * Periksa apakah sebuah section wrapper punya konten yang cukup substansial
 * untuk layak mendapat halaman sendiri. Threshold:
 * - Ada elemen <table> (tabel identitas / langkah pembelajaran), ATAU
 * - Panjang teks bersih lebih dari 150 karakter.
 *
 * Tanpa syarat ini, section pendek / placeholder "Belum Digenerate" mendapat
 * `pageBreakBefore: always` → halaman kosong berlipat-lipat di Word.
 */
const hasSubstantialContent = (wrapper: HTMLElement): boolean => {
  if (wrapper.querySelector('table')) return true;
  const text = (wrapper.textContent ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 150;
};

/**
 * Pertahankan tepat satu `[data-section]` per `[data-v2-export-item]`,
 * yaitu section yang sesuai `data-v2-export-jenis`. Section lain dihapus
 * dari clone sehingga setiap item menghasilkan tepat satu dokumen.
 *
 * Page break antardokumen HANYA disisipkan jika section punya konten
 * substansial — section kosong / pendek tidak mendapat page break agar
 * tidak menghasilkan halaman kosong di Word.
 */
export const pruneV2ExportSections = (root: HTMLElement): PruneV2Result => {
  const wrappers = Array.from(
    root.querySelectorAll<HTMLElement>('[data-v2-export-item]'),
  );
  let keptSections = 0;
  let removedSections = 0;

  for (const wrapper of wrappers) {
    const jenis = wrapper.getAttribute(
      'data-v2-export-jenis',
    ) as JenisDokumenPertemuan | null;
    const target = jenis ? V2_JENIS_SECTION_MAP[jenis] : undefined;

    wrapper.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
      if (target && el.getAttribute('data-section') === target) {
        el.style.display = 'block';
        normalizeSectionPageBreaks(el);
        keptSections += 1;
      } else {
        el.remove();
        removedSections += 1;
      }
    });

    // Page break antardokumen — hanya untuk wrapper ber-konten substansial.
    // Item pertama tidak pernah dapat page break (jelas).
    const isFirst = wrapper === wrappers[0];
    const hasContent = hasSubstantialContent(wrapper);

    if (isFirst || !hasContent) {
      wrapper.classList.remove('page-break-before');
      wrapper.style.pageBreakBefore = '';
    } else {
      wrapper.classList.add('page-break-before');
      wrapper.style.pageBreakBefore = 'always';
    }
  }

  return { items: wrappers.length, keptSections, removedSections };
};


/** Jumlah section dokumen yang benar-benar tampil setelah pruning. */
export const countVisibleV2Sections = (root: HTMLElement): number =>
  root.querySelectorAll('[data-v2-export-item] [data-section]').length;

/**
 * Jumlah kop (letterhead) yang tertanam di hasil staging.
 * Mencakup kop bawaan DocumentPreview (Modul) maupun kop yang ditambahkan
 * staging untuk dokumen non-Modul — keduanya memakai alt "Kop Sekolah".
 */
export const countV2Letterheads = (root: HTMLElement): number =>
  root.querySelectorAll('img[alt="Kop Sekolah"]').length;
