/**
 * Koreksi Fase 3C — test orchestrator risiko tinggi (mock API, tanpa AI nyata).
 */
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePertemuanGeneration } from '@/hooks/usePertemuanGeneration';
import type { FormData, SoalConfig } from '@/types/modul';

const SEED = 'mtk-7-aljabar';

const baseForm = {
  mataPelajaran: 'Matematika',
  kelas: '7',
  materi: 'Aljabar',
  subMateri: 'Bentuk Aljabar',
  tujuanPembelajaran: 'Siswa memahami bentuk aljabar',
  pertemuan: [
    { nomorPertemuan: 1, durasi: '90' },
    { nomorPertemuan: 2, durasi: '45' },
  ],
} as unknown as FormData;

const modulOk = {
  tahap_awal: { judul: 'Awal', prinsip_utama: '', durasi_total: '', kegiatan: [] },
  tahap_inti: { judul: 'Inti', prinsip_utama: '', durasi_total: '', kegiatan: [] },
  tahap_penutup: { judul: 'Penutup', prinsip_utama: '', durasi_total: '', kegiatan: [] },
};

const DOC_BY_TYPE: Record<string, Record<string, unknown>> = {
  lkpd: { judul_lkpd: 'Dok lkpd', aktivitas_utama: [] },
  asesmen: { asesmen_awal: { judul: 'Dok asesmen' } },
  bankSoal: { daftar_soal: [] },
  materi: { judul_materi: 'Dok materi', isi_materi: [] },
  tindakLanjut: { refleksi_guru: [], refleksi_siswa: [] },
};

type Payload = Record<string, unknown>;

const okBody = (payload: Payload) => {
  const data = payload.data as Record<string, unknown>;
  return {
    data: {
      meta: {
        pertemuanId: data.pertemuanId,
        nomorPertemuan: data.nomorPertemuan,
        type: payload.type,
      },
      data:
        payload.type === 'modul'
          ? { pemahaman_bermakna: 'pb', pertemuan: [modulOk] }
          : DOC_BY_TYPE[payload.type as string],
    },
  } as never;
};

const makeInvoke = () => vi.fn(async (payload: Payload) => okBody(payload));

const setup = (overrides: Record<string, unknown> = {}) =>
  renderHook(() =>
    usePertemuanGeneration({
      formData: baseForm,
      seed: SEED,
      enabled: true,
      invoke: makeInvoke() as never,
      ...overrides,
    }),
  );

const onlyModul = (result: ReturnType<typeof setup>['result']) => {
  for (const p of result.current.result.pertemuan) {
    for (const j of ['lkpd', 'asesmen', 'soal', 'materi', 'refleksi'] as const) {
      result.current.togglePilihan(p.id, j, false);
    }
  }
};

describe('Fase 3C — validasi response', () => {
  it('response tanpa meta ditolak dan dokumen tidak ditempel', async () => {
    const invoke = vi.fn(async () => ({ data: { data: DOC_BY_TYPE.lkpd } }) as never);
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });

  it('meta pertemuanId berbeda ditolak', async () => {
    const invoke = vi.fn(async (payload: Payload) => {
      const d = payload.data as Record<string, unknown>;
      return {
        data: {
          meta: { pertemuanId: 'lain', nomorPertemuan: d.nomorPertemuan, type: payload.type },
          data: DOC_BY_TYPE.lkpd,
        },
      } as never;
    });
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });

  it('meta nomorPertemuan berbeda ditolak', async () => {
    const invoke = vi.fn(async (payload: Payload) => {
      const d = payload.data as Record<string, unknown>;
      return {
        data: {
          meta: { pertemuanId: d.pertemuanId, nomorPertemuan: 99, type: payload.type },
          data: DOC_BY_TYPE.lkpd,
        },
      } as never;
    });
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
  });

  it('bentuk dokumen tidak sesuai jenis ditolak', async () => {
    const invoke = vi.fn(async (payload: Payload) => {
      const d = payload.data as Record<string, unknown>;
      return {
        data: {
          meta: { pertemuanId: d.pertemuanId, nomorPertemuan: d.nomorPertemuan, type: payload.type },
          data: { sesuatu: 'bukan lkpd' },
        },
      } as never;
    });
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });
});

describe('Fase 3C — payload', () => {
  it('Bank Soal membawa konfigurasi soal', async () => {
    const invoke = makeInvoke();
    const soalConfig = { jumlahPG: 5, jumlahUraian: 2 } as unknown as SoalConfig;
    const { result } = setup({ invoke: invoke as never, soalConfig });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'soal');
    });
    const payload = invoke.mock.calls[0][0] as Payload;
    expect(payload.type).toBe('bankSoal');
    expect((payload.data as Record<string, unknown>).config).toEqual(soalConfig);
    expect((payload.data as Record<string, unknown>).pertemuanId).toBe(id);
  });

  it('previousSummary kosong di P1 dan hanya berasal dari P1 untuk P2', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    act(() => onlyModul(result));
    await act(async () => {
      await result.current.generateMissing();
    });
    const p1 = invoke.mock.calls[0][0] as Payload;
    const p2 = invoke.mock.calls[1][0] as Payload;
    expect((p1.data as Record<string, unknown>).previousSummary).toBeUndefined();
    const summary = String((p2.data as Record<string, unknown>).previousSummary ?? '');
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).not.toMatch(/Pertemuan 2/);
  });

  it('retry P2 memakai hasil P1 yang sudah tersimpan', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    act(() => onlyModul(result));
    const [p1, p2] = result.current.result.pertemuan;
    await act(async () => {
      await result.current.regenerateDokumen(p1.id, 'modul');
    });
    invoke.mockClear();
    await act(async () => {
      await result.current.regenerateDokumen(p2.id, 'modul');
    });
    const payload = invoke.mock.calls[0][0] as Payload;
    expect(
      String((payload.data as Record<string, unknown>).previousSummary ?? '').length,
    ).toBeGreaterThan(0);
  });
});

describe('Fase 3C — antrean & preface', () => {
  it('double-click generate tidak membuat dua antrean', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    act(() => onlyModul(result));
    await act(async () => {
      await Promise.all([result.current.generateMissing(), result.current.generateMissing()]);
    });
    expect(invoke).toHaveBeenCalledTimes(2); // 2 pertemuan × modul saja
  });

  it('modulPreface hanya disimpan sekali dari pertemuan pertama', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    act(() => onlyModul(result));
    await act(async () => {
      await result.current.generateMissing();
    });
    expect(result.current.result.modulPreface).toBeDefined();
    // Flow preface hanya dipakai pertemuan pertama: payload P1 membawa tepat
    // satu pertemuan, P2 tidak lagi diminta membuat bagian preface.
    const p1Payload = invoke.mock.calls[0][0] as Payload;
    const p2Payload = invoke.mock.calls[1][0] as Payload;
    expect((p1Payload.data as Record<string, unknown>).pertemuan).toHaveLength(1);
    expect((p2Payload.data as Record<string, unknown>).pertemuan).not.toHaveLength(1);
  });
});
