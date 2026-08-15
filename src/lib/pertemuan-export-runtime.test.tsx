/**
 * FASE 4B — Test runtime export V2 (poin 13–27).
 * Download, html2pdf, Object URL, dan konversi gambar dimock.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useV2Export } from '@/hooks/useV2Export';
import { Toolbar } from '@/components/modul/Toolbar';
import type { FormData, GenerationResultV2 } from '@/types/modul';

const saveMock = vi.fn().mockResolvedValue(undefined);
vi.mock('html2pdf.js', () => {
  const api = {
    set: () => api,
    from: () => api,
    save: (...args: unknown[]) => saveMock(...args),
  };
  return { default: () => api };
});

const docxMock = vi.fn();
vi.mock('@/lib/soal-docx-export', () => ({
  exportSoalToDocx: (...args: unknown[]) => {
    docxMock(...args);
    return Promise.resolve({
      blob: new Blob(['docx']),
      filename: 'x.docx',
      equationCount: 0,
      markerCount: 0,
    });
  },
}));

const convertMock = vi.fn();
vi.mock('@/lib/export-dom', async (orig) => {
  const actual = await orig<typeof import('@/lib/export-dom')>();
  return {
    ...actual,
    convertImagesToDataUrl: (root: HTMLElement) => {
      convertMock(root);
      return Promise.resolve({ total: 1, failed: 0 });
    },
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

const result: GenerationResultV2 = {
  version: 2,
  modulPreface: { pemahaman_bermakna: 'preface' },
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
        lkpd: { judul: 'LKPD Satu' } as any,
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
        soal: { daftar_soal: [{ pertanyaan: 'soal p2' }] } as any,
      },
    },
  ],
};

let lastBlob: Blob | null = null;
const notify = vi.fn();

type HarnessProps = {
  scope: 'active_document' | 'active_meeting' | 'complete_package';
  format: 'word' | 'pdf' | 'soal_docx';
  activePertemuanId?: string;
  activeJenisDokumen?: 'modul' | 'lkpd' | 'soal';
  letterhead?: boolean;
};

const Harness = (props: HarnessProps) => {
  const api = useV2Export({
    result,
    formData,
    letterheadUrl: props.letterhead ? 'https://example.com/kop.png' : null,
    isLetterheadEnabled: !!props.letterhead,
    notify,
  });
  return (
    <button
      onClick={() =>
        api.runExport({
          scope: props.scope,
          format: props.format,
          activePertemuanId: props.activePertemuanId,
          activeJenisDokumen: props.activeJenisDokumen,
        })
      }
    >
      go{api.isExporting ? '-busy' : ''}
    </button>
  );
};

beforeEach(() => {
  lastBlob = null;
  notify.mockClear();
  saveMock.mockClear();
  docxMock.mockClear();
  convertMock.mockClear();
  // jsdom tidak menyediakan Object URL — stub penuh.
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

describe('FASE 4B — export runtime V2', () => {
  it('13. Word V2 memakai seluruh item plan + 15. page break antar dokumen saja', async () => {
    render(<Harness scope="complete_package" format="word" />);
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Export berhasil di-download!'));
    const html = await readBlob();
    expect(html).toContain('Pertemuan 1 — Modul');
    expect(html).toContain('Pertemuan 1 — LKPD');
    expect(html).toContain('Pertemuan 2 — Modul');
    expect(html).toContain('Pertemuan 2 — Soal');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const wrappers = Array.from(doc.querySelectorAll('[data-v2-export-item]'));
    expect(wrappers).toHaveLength(4);
    // page break ada di antara dokumen, tidak sebelum yang pertama
    expect(wrappers[0].classList.contains('page-break-before')).toBe(false);
    expect(
      wrappers.slice(1).every((w) => w.classList.contains('page-break-before')),
    ).toBe(true);
  });

  it('14. PDF V2 memakai staging plan yang sama', async () => {
    render(<Harness scope="complete_package" format="pdf" />);
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(convertMock).toHaveBeenCalled();
  });

  it('16. tombol/editor/data-no-export tidak masuk output', async () => {
    render(<Harness scope="active_meeting" format="word" activePertemuanId="p-1" />);
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(lastBlob).not.toBeNull());
    const html = await readBlob();
    expect(html).not.toContain('<button');
    expect(html).not.toContain('data-no-export');
  });

  it('17. kop OFF tidak menyertakan gambar kop', async () => {
    render(<Harness scope="active_meeting" format="word" activePertemuanId="p-1" />);
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(lastBlob).not.toBeNull());
    expect(await readBlob()).not.toContain('kop.png');
  });

  it('17b/18. kop ON diproses lewat konversi gambar', async () => {
    render(
      <Harness scope="active_meeting" format="word" activePertemuanId="p-1" letterhead />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(lastBlob).not.toBeNull(), { timeout: 14000 });
    expect(convertMock).toHaveBeenCalled();
    expect(await readBlob()).toContain('kop.png');
  }, 20000);

  it('19/20. Soal DOCX memakai BankSoalData pertemuan aktif (P2), bukan global', async () => {
    render(
      <Harness
        scope="active_document"
        format="soal_docx"
        activePertemuanId="p-2"
        activeJenisDokumen="soal"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(docxMock).toHaveBeenCalledTimes(1));
    const bank = docxMock.mock.calls[0][0] as { daftar_soal: { pertanyaan: string }[] };
    expect(bank.daftar_soal[0].pertanyaan).toBe('soal p2');
  });

  it('21. plan kosong menolak export', async () => {
    render(
      <Harness
        scope="active_document"
        format="word"
        activePertemuanId="p-1"
        activeJenisDokumen="soal"
      />,
    );
    fireEvent.click(screen.getByText('go'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Tidak ada dokumen yang bisa diekspor', 'error'),
    );
    expect(lastBlob).toBeNull();
  });

  it('22. double-click hanya menjalankan satu proses', async () => {
    render(<Harness scope="complete_package" format="pdf" />);
    const btn = screen.getByText('go');
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
  });

  it('23. error membersihkan staging, loading, dan menampilkan notifikasi', async () => {
    saveMock.mockRejectedValueOnce(new Error('pdf gagal'));
    render(<Harness scope="complete_package" format="pdf" />);
    fireEvent.click(screen.getByText('go'));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Export gagal. Silakan coba lagi.', 'error'),
    );
    expect(document.querySelectorAll('[data-v2-export-stage]').length).toBe(0);
    expect(screen.getByText('go')).toBeInTheDocument();
  });
});

const toolbarProps = {
  activeTab: 'modul',
  setActiveTab: () => {},
  loaders: { lkpd: false, asesmen: false, materi: false, tindakLanjut: false, bankSoal: false },
  lkpdData: null,
  asesmenData: null,
  materiData: null,
  tindakLanjutData: null,
  bankSoalData: null,
  onGenerateLKPD: () => {},
  onGenerateAsesmen: () => {},
  onGenerateMateri: () => {},
  onGenerateTindakLanjut: () => {},
  onOpenSoalModal: () => {},
};

const openExportMenus = () => {
  screen
    .getAllByText('Export')
    .map((n) => n.closest('button')!)
    .forEach((t) => fireEvent.keyDown(t, { key: 'Enter' }));
};

describe('FASE 4B — integrasi UI', () => {
  it('24. Toolbar V2 membuka dialog export V2', () => {
    const onOpenV2Export = vi.fn();
    const onExportAll = vi.fn();
    render(
      <Toolbar
        {...toolbarProps}
        v2Mode
        onOpenV2Export={onOpenV2Export}
        onExportCurrentTab={() => {}}
        onExportAll={onExportAll}
      />,
    );
    openExportMenus();
    fireEvent.click(screen.getAllByText('Export Dokumen per Pertemuan…')[0]);
    expect(onOpenV2Export).toHaveBeenCalled();
    expect(onExportAll).not.toHaveBeenCalled();
  });

  it('25/27. Toolbar legacy (flag OFF) tetap memanggil export legacy', () => {
    const onExportAll = vi.fn();
    const onOpenV2Export = vi.fn();
    render(
      <Toolbar
        {...toolbarProps}
        onExportCurrentTab={() => {}}
        onExportAll={onExportAll}
        onOpenV2Export={onOpenV2Export}
      />,
    );
    openExportMenus();
    fireEvent.click(screen.getAllByText('Export Semua ke Word')[0]);
    expect(onExportAll).toHaveBeenCalled();
    expect(onOpenV2Export).not.toHaveBeenCalled();
    expect(screen.queryByText('Export Dokumen per Pertemuan…')).toBeNull();
  });
});
