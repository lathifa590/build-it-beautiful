/**
 * FASE 4B.1 — Test murni helper pruning section export V2.
 */
import { describe, expect, it } from 'vitest';
import {
  V2_JENIS_SECTION_MAP,
  countVisibleV2Sections,
  normalizeSectionPageBreaks,
  pruneV2ExportSections,
} from '@/lib/export-sections';

const mkRoot = (): HTMLElement => {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-v2-export-item="p-1:lkpd" data-v2-export-jenis="lkpd">
      <div data-section="modul" style="display:none">MODUL AJAR P1</div>
      <div data-section="lkpd" style="display:none;page-break-before:always;margin-top:40px">
        <div style="page-break-before:always"></div>
        LKPD P1
      </div>
    </div>
    <div data-v2-export-item="p-2:refleksi" data-v2-export-jenis="refleksi">
      <div data-section="modul" style="display:none">MODUL AJAR P2</div>
      <div data-section="tindakLanjut" style="display:none;page-break-before:always">
        <div style="page-break-before:always"></div>
        REFLEKSI P2
        <div style="page-break-before:always"></div>
      </div>
    </div>`;
  return root;
};

describe('FASE 4B.1 — pruneV2ExportSections', () => {
  it('mapping refleksi menuju data-section tindakLanjut', () => {
    expect(V2_JENIS_SECTION_MAP.refleksi).toBe('tindakLanjut');
  });

  it('menyisakan tepat satu section per item dan membuang sisanya', () => {
    const root = mkRoot();
    const res = pruneV2ExportSections(root);
    expect(res.items).toBe(2);
    expect(res.keptSections).toBe(2);
    expect(res.removedSections).toBe(2);
    expect(countVisibleV2Sections(root)).toBe(2);
    expect(root.textContent).not.toContain('MODUL AJAR');
    expect(root.textContent).toContain('LKPD P1');
    expect(root.textContent).toContain('REFLEKSI P2');
  });

  it('tidak membuka semua data-section secara paksa', () => {
    const root = mkRoot();
    pruneV2ExportSections(root);
    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-section]'));
    expect(sections.map((s) => s.getAttribute('data-section'))).toEqual([
      'lkpd',
      'tindakLanjut',
    ]);
    expect(sections.every((s) => s.style.display === 'block')).toBe(true);
  });

  it('page break hanya dari wrapper: item pertama tanpa break, sisanya satu', () => {
    const root = mkRoot();
    pruneV2ExportSections(root);
    const wrappers = Array.from(
      root.querySelectorAll<HTMLElement>('[data-v2-export-item]'),
    );
    expect(wrappers[0].style.pageBreakBefore).toBe('');
    expect(wrappers[0].classList.contains('page-break-before')).toBe(false);
    expect(wrappers[1].style.pageBreakBefore).toBe('always');
    // Section aktif tidak boleh menambah page break awal lagi.
    for (const w of wrappers) {
      const sec = w.querySelector<HTMLElement>('[data-section]')!;
      expect(sec.style.pageBreakBefore).toBe('');
      expect(sec.style.marginTop).toBe('0px');
    }
  });

  it('menghapus leading & trailing page-break kosong (tanpa blank page)', () => {
    const root = mkRoot();
    pruneV2ExportSections(root);
    const html = root.innerHTML;
    expect(html).not.toMatch(
      /page-break-before:\s*always[^>]*><\/div>\s*<div[^>]*page-break-before:\s*always/,
    );
    const last = root.querySelector<HTMLElement>(
      '[data-v2-export-jenis="refleksi"] [data-section]',
    )!;
    expect(last.lastElementChild).toBeNull();
  });

  it('normalizeSectionPageBreaks mempertahankan page break internal non-kosong', () => {
    const sec = document.createElement('div');
    sec.innerHTML = `<p>A</p><div style="page-break-before:always">Kunci Jawaban</div><p>B</p>`;
    normalizeSectionPageBreaks(sec);
    expect(sec.textContent).toContain('Kunci Jawaban');
    expect(sec.children.length).toBe(3);
  });
});
