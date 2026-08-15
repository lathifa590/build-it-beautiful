/**
 * FASE 4B.1 — Test runtime isi dokumen export V2 + smoke fixture 7 dokumen.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useV2Export } from '@/hooks/useV2Export';
import { V2ExportDialog } from '@/components/modul/V2ExportDialog';
import { buildV2ExportPlan, getBankSoalForPertemuan } from '@/lib/pertemuan-export';
import { countV2Letterheads, countVisibleV2Sections } from '@/lib/export-sections';
import type { FormData, GenerationResultV2 } from '@/types/modul';

const saveMock = vi.fn().mockResolvedValue(undefined);
vi.mock('html2pdf.js', () => {
  const api = {
    set: () => api,
    from: () => api,
    save: (...a: unknown[]) => saveMock(...a),
  };
  return { default: () => api };
});

const docxMock = vi.fn();
vi.mock('@/lib/soal-docx-export', () => ({
  exportSoalToDocx: (...a: unknown[]) => {
    docxMock(...a);
    return Promise.resolve({
      blob: new Blob(['docx']),
      filename: 'x.docx',
      equationCount: 0,
      markerCount: 0,
    });
  },
}));

vi.mock('@/lib/export-dom', async (orig) => {
  const actual = await orig<typeof import('@/lib/export-dom')>();
  return {
    ...actual,
    convertImagesToDataUrl: () => Promise.resolve({ total: 1, failed: 0 }),
  };
});

const formData = {
  mataPelajaran: 'Bahasa Inggris',
  kelas: 'X',
  materi: 'Narrative',
  pertemuan: [],
} as unknown as FormData;

const pilihanAll = {
  modul: true as const,
  lkpd: true,
  asesmen: true,
  soal: true,
  materi: true,
  refleksi: true,
};

/** Fixture wajib poin 7: P1 = Modul/LKPD/Asesmen/Materi, P2 = Modul/Soal/Refleksi. */
const fixture = (): GenerationResultV2 => ({
  version: 2,
  modulPreface: { pemahaman_bermakna: 'preface bab' },
  pertemuan: [
    {
      id: 'p-1',
      nomor: 1,
      durasiMenit: 90,
      pilihanDokumen: pilihanAll,
      status: {},
      dokumen: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modul: { pembukaan: [], inti: [], penutup: [] } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lkpd: { judul: 'LKPDSATU', kegiatan: [] } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        asesmen: { judul: 'ASESMENSATU' } as any,
        materi: {
          judul_materi: 'MATERISATU',
          pendahuluan: 'Pendahuluan MATERISATU',
          isi_materi: [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    },
    {
      id: 'p-2',
      nomor: 2,
      durasiMenit: 90,
      pilihanDokumen: pilihanAll,
      status: {},
      dokumen: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modul: { tahap_awal: {} } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        soal: { daftar_soal: [{ pertanyaan: 'SOALP2' }] } as any,
        refleksi: {
          judul: 'REFLEKSIP2',
          remedial: 'Remedial REFLEKSIP2',
          pengayaan: 'Pengayaan REFLEKSIP2',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    },
  ],
});

let lastBlob: Blob | null = null;
const notify = vi.fn();
const result = fixture();

type HarnessProps = {
  scope: 'active_document' | 'active_meeting' | 'complete_package';
  format: 'word' | 'pdf' | 'soal_docx';
  activePertemuanId?: string;
  activeJenisDokumen?: 'modul' | 'lkpd' | 'asesmen' | 'soal' | 'materi' | 'refleksi';
  letterhead?: boolean;
};

const Harness = (p: HarnessProps) => {
  const api = useV2Export({
    result,
    formData,
    letterheadUrl: p.letterhead ? 'https://example.com/kop.png' : null,
    isLetterheadEnabled: !!p.letterhead,
    notify,
  });
  return (
    <button
      onClick={() =>
        api.runExport({
          scope: p.scope,
          format: p.format,
          activePertemuanId: p.activePertemuanId,
          activeJenisDokumen: p.activeJenisDokumen,
        })
      }
    >
      go
    </button>
  );
};

beforeEach(() => {
  lastBlob = null;
  notify.mockClear();
  saveMock.mockClear();
  docxMock.mockClear();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: (b: Blob) => {
      lastBlob = b;
      return 'blob:mock';
    },
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

const readBlob = (): Promise<string> =>
  new Promise((resolve) => {
    if (!lastBlob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.readAsText(lastBlob);
  });

const exportWord = async (p: Omit<HarnessProps, 'format'>) => {
  render(<Harness {...p} format="word" />);
  fireEvent.click(screen.getByText('go'));
  await waitFor(() => expect(lastBlob).not.toBeNull(), { timeout: 15000 });
  return readBlob();
};

/** Parse HTML Word hasil export menjadi DOM untuk assertion struktur nyata. */
const parse = (html: string): HTMLElement => {
  const el = document.createElement('div');
  el.innerHTML = html.replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '');
  return el;
};

describe('FASE 4B.1 — isi dokumen Word V2', () => {
  it('1. P1 Modul hanya memuat section Modul P1', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'modul',
    });
    const dom = parse(html);
    expect(countVisibleV2Sections(dom)).toBe(1);
    expect(
      dom.querySelector('[data-section]')?.getAttribute('data-section'),
    ).toBe('modul');
    expect(html).not.toContain('LKPDSATU');
    expect(html).not.toContain('SOALP2');
  }, 20000);

  it('2. P1 LKPD hanya memuat section LKPD P1 (tanpa Modul)', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'lkpd',
    });
    const dom = parse(html);
    expect(countVisibleV2Sections(dom)).toBe(1);
    expect(
      dom.querySelector('[data-section]')?.getAttribute('data-section'),
    ).toBe('lkpd');
    expect(html).not.toContain('MODUL AJAR');
    expect(html).not.toContain('SOALP2');
    expect(html).not.toContain('REFLEKSIP2');
  }, 20000);

  it('3. Asesmen tidak mengandung LKPD maupun Modul', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'asesmen',
    });
    expect(html).not.toContain('MODUL AJAR');
    expect(html).not.toContain('LEMBAR KERJA PESERTA DIDIK');
    expect(countVisibleV2Sections(parse(html))).toBe(1);
  }, 20000);

  it('4. P2 Soal hanya memuat Bank Soal P2', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-2',
      activeJenisDokumen: 'soal',
    });
    expect(html).toContain('SOALP2');
    expect(html).not.toContain('MODUL AJAR');
    expect(html).not.toContain('LKPDSATU');
  }, 20000);

  it('5/6. jumlah & urutan dokumen aktual sama dengan plan (smoke 7 dokumen)', async () => {
    const plan = buildV2ExportPlan({ result, scope: 'complete_package', formData });
    expect(plan.items.map((i) => `${i.nomorPertemuan}:${i.jenis}`)).toEqual([
      '1:modul',
      '1:lkpd',
      '1:asesmen',
      '1:materi',
      '2:modul',
      '2:soal',
      '2:refleksi',
    ]);
    const html = await exportWord({ scope: 'complete_package' });
    const dom = parse(html);
    const wrappers = Array.from(
      dom.querySelectorAll<HTMLElement>('[data-v2-export-item]'),
    );
    expect(wrappers).toHaveLength(7);
    expect(countVisibleV2Sections(dom)).toBe(7);
    expect(
      wrappers.map((w) => w.getAttribute('data-v2-export-item')),
    ).toEqual([
      'p-1:modul',
      'p-1:lkpd',
      'p-1:asesmen',
      'p-1:materi',
      'p-2:modul',
      'p-2:soal',
      'p-2:refleksi',
    ]);
    // Tidak ada Modul kosong tambahan: section modul persis 2 (P1 & P2).
    expect(dom.querySelectorAll('[data-section="modul"]')).toHaveLength(2);
  }, 30000);

  it('7/8. satu page break antaritem, tanpa nested/blank page', async () => {
    const html = await exportWord({ scope: 'complete_package' });
    const dom = parse(html);
    const wrappers = Array.from(
      dom.querySelectorAll<HTMLElement>('[data-v2-export-item]'),
    );
    expect(wrappers[0].style.pageBreakBefore).toBe('');
    expect(wrappers.slice(1).every((w) => w.style.pageBreakBefore === 'always')).toBe(
      true,
    );
    for (const w of wrappers) {
      const sec = w.querySelector<HTMLElement>('[data-section]')!;
      expect(sec.style.pageBreakBefore).toBe('');
      // Tidak ada page break kosong di awal section (blank page).
      const first = sec.firstElementChild as HTMLElement | null;
      const firstIsEmptyBreak =
        !!first &&
        first.tagName === 'DIV' &&
        first.children.length === 0 &&
        (first.textContent ?? '').trim() === '' &&
        first.style.pageBreakBefore === 'always';
      expect(firstIsEmptyBreak).toBe(false);
    }
    // Tidak ada page break setelah item terakhir.
    const last = wrappers[wrappers.length - 1];
    const lastSec = last.querySelector<HTMLElement>('[data-section]')!;
    const tail = lastSec.lastElementChild as HTMLElement | null;
    const tailIsEmptyBreak =
      !!tail &&
      tail.children.length === 0 &&
      (tail.textContent ?? '').trim() === '' &&
      (tail.style.pageBreakBefore === 'always' || tail.style.breakBefore === 'page');
    expect(tailIsEmptyBreak).toBe(false);
  }, 30000);
});

describe('FASE 4B.1 — kop per dokumen', () => {
  it('9a. active LKPD + Kop ON memiliki tepat satu kop', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'lkpd',
      letterhead: true,
    });
    expect(countV2Letterheads(parse(html))).toBe(1);
  }, 20000);

  it('9b. active Soal + Kop ON memiliki tepat satu kop', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-2',
      activeJenisDokumen: 'soal',
      letterhead: true,
    });
    expect(countV2Letterheads(parse(html))).toBe(1);
  }, 20000);

  it('9c. Modul + Kop ON tidak memiliki dua kop', async () => {
    const html = await exportWord({
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'modul',
      letterhead: true,
    });
    expect(countV2Letterheads(parse(html))).toBe(1);
  }, 20000);

  it('9d. paket 7 dokumen + Kop ON = satu kop per dokumen', async () => {
    const html = await exportWord({ scope: 'complete_package', letterhead: true });
    expect(countV2Letterheads(parse(html))).toBe(7);
  }, 30000);

  it('9e. Kop OFF tidak memuat gambar kop', async () => {
    const html = await exportWord({ scope: 'complete_package' });
    expect(countV2Letterheads(parse(html))).toBe(0);
    expect(html).not.toContain('kop.png');
  }, 30000);
});

describe('FASE 4B.1 — meeting ID invalid & guard runtime', () => {
  it('10a. ID hilang tidak fallback ke P1 (plan kosong)', () => {
    const plan = buildV2ExportPlan({
      result,
      scope: 'active_meeting',
      activePertemuanId: 'hilang',
    });
    expect(plan.items).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('meeting_not_found');
  });

  it('10b. getBankSoalForPertemuan ID hilang → null, bukan Soal P1', () => {
    expect(getBankSoalForPertemuan(result, 'hilang')).toBeNull();
  });

  it('10c. export dengan stale ID ditolak, tidak mengekspor P1', async () => {
    render(
      <Harness
        scope="active_document"
        format="word"
        activePertemuanId="hilang"
        activeJenisDokumen="lkpd"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'Tidak ada dokumen yang bisa diekspor',
        'error',
      ),
    );
    expect(lastBlob).toBeNull();
  });

  it('11a. DOCX Soal ditolak bila ID pertemuan tidak ditemukan', async () => {
    render(
      <Harness
        scope="active_document"
        format="soal_docx"
        activePertemuanId="hilang"
        activeJenisDokumen="soal"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(notify).toHaveBeenCalled());
    expect(docxMock).not.toHaveBeenCalled();
  });

  it('11b. DOCX Soal ditolak bila scope bukan active_document', async () => {
    render(
      <Harness
        scope="active_meeting"
        format="soal_docx"
        activePertemuanId="p-2"
        activeJenisDokumen="soal"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'DOCX Soal hanya untuk Dokumen Aktif jenis Soal yang tersedia',
        'error',
      ),
    );
    expect(docxMock).not.toHaveBeenCalled();
  });

  it('11c. DOCX Soal ditolak bila jenis aktif bukan soal', async () => {
    render(
      <Harness
        scope="active_document"
        format="soal_docx"
        activePertemuanId="p-1"
        activeJenisDokumen="lkpd"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'DOCX Soal hanya untuk Dokumen Aktif jenis Soal yang tersedia',
        'error',
      ),
    );
    expect(docxMock).not.toHaveBeenCalled();
  });
});

describe('FASE 4B.1 — kontrol dialog saat export', () => {
  it('12. scope/format/tutup dinonaktifkan selama export berjalan', () => {
    const onOpenChange = vi.fn();
    render(
      <V2ExportDialog
        open
        onOpenChange={onOpenChange}
        activeJenis="soal"
        activePertemuanNomor={2}
        isExporting
        buildPlan={({ scope }) =>
          buildV2ExportPlan({ result, scope, activePertemuanId: 'p-2', formData })
        }
        onExport={() => {}}
      />,
    );
    expect(screen.getByTestId('v2-format-word')).toBeDisabled();
    expect(screen.getByTestId('v2-format-pdf')).toBeDisabled();
    expect(screen.getByTestId('v2-scope-active_meeting')).toBeDisabled();
    expect(screen.getByTestId('v2-export-submit')).toBeDisabled();
    expect(screen.getByText('Batal').closest('button')).toBeDisabled();
  });
});
