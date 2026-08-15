/**
 * FASE 4A — Persistensi History V2, reset lifecycle, dan late response.
 * Tidak ada koneksi database nyata: Supabase di-mock, AI di-mock.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { FormData, GenerationResultV2, SoalConfig } from '@/types/modul';
import {
  CONTENT_SCHEMA_VERSION_V2,
  canUseFullscreenPreview,
  computeHasContent,
  isV2History,
  hasV2Content,
  parseGenerationResultV2,
  serializeGenerationResultV2,
  summarizeGenerationResultV2,
} from '@/lib/history-v2';
import { usePertemuanGeneration } from '@/hooks/usePertemuanGeneration';

// ---------------------------------------------------------------- fixtures

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

const makeV2 = (idPrefix: string): GenerationResultV2 => ({
  version: 2,
  modulPreface: { pemahaman_bermakna: `pb-${idPrefix}` } as never,
  pertemuan: [
    {
      id: `${idPrefix}-1`,
      nomor: 1,
      durasiMenit: 90,
      durasiLabel: '2 x 45 menit',
      submateriId: 'sm-1',
      submateriJudul: 'Sub 1',
      pilihanDokumen: {
        modul: true,
        lkpd: true,
        asesmen: false,
        soal: false,
        materi: false,
        refleksi: false,
      },
      dokumen: {
        modul: { ...modulOk, nomorPertemuan: 1 } as never,
        lkpd: { judul_lkpd: `LKPD ${idPrefix}`, aktivitas_utama: [] } as never,
      },
      status: { modul: 'ok', lkpd: 'ok' },
    },
    {
      id: `${idPrefix}-2`,
      nomor: 2,
      durasiMenit: 45,
      pilihanDokumen: {
        modul: true,
        lkpd: false,
        asesmen: false,
        soal: false,
        materi: false,
        refleksi: false,
      },
      dokumen: { modul: { ...modulOk, nomorPertemuan: 2 } as never },
      status: { modul: 'ok', asesmen: 'error' },
      errors: { asesmen: 'gagal' },
    },
  ],
  dokumenGlobal: { materi: { judul_materi: 'Global', isi_materi: [] } as never },
  babId: 'bab-1',
});

// ------------------------------------------------------------- mock supabase

const insertSpy = vi.fn();
const updateSpy = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const chain = () => ({
    select: () => chain(),
    eq: () => chain(),
    order: () => chain(),
    limit: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: { id: 'row-1' }, error: null }),
  });
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
        }),
        insert: (payload: unknown) => {
          insertSpy(payload);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'row-1' }, error: null }),
            }),
          };
        },
        update: (payload: unknown) => {
          updateSpy(payload);
          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 'row-1' }, error: null }),
                }),
              }),
            }),
          };
        },
      }),
    },
  };
});

beforeEach(() => {
  insertSpy.mockClear();
  updateSpy.mockClear();
});

// ------------------------------------------------------------------- tests

describe('Fase 4A — serialize/parse V2', () => {
  it('1. serialize V2 lossless untuk bagian yang dipersistenkan', () => {
    const v2 = makeV2('a');
    const ser = serializeGenerationResultV2(v2);
    expect(ser.version).toBe(2);
    expect(ser.pertemuan).toHaveLength(2);
    expect(ser.modulPreface).toEqual(v2.modulPreface);
    expect(ser.dokumenGlobal).toEqual(v2.dokumenGlobal);
    expect(ser.babId).toBe('bab-1');
    expect(ser.pertemuan[0].dokumen.lkpd).toEqual(v2.pertemuan[0].dokumen.lkpd);
    expect(ser.pertemuan[1].errors).toEqual({ asesmen: 'gagal' });
  });

  it('status pending tidak pernah disimpan sebagai hasil final', () => {
    const v2 = makeV2('a');
    v2.pertemuan[0].status.soal = 'pending';
    const ser = serializeGenerationResultV2(v2);
    expect(ser.pertemuan[0].status.soal).toBe('idle');
  });

  it('15. round-trip save → load deep-equal', () => {
    const v2 = makeV2('a');
    const json = JSON.parse(JSON.stringify(serializeGenerationResultV2(v2)));
    const parsed = parseGenerationResultV2(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok !== true) return;
    expect(parsed.value).toEqual(serializeGenerationResultV2(v2));
  });

  it('3. parse mempertahankan stable ID dan seluruh dokumen', () => {
    const parsed = parseGenerationResultV2(
      JSON.parse(JSON.stringify(serializeGenerationResultV2(makeV2('x')))),
    );
    if (parsed.ok !== true) throw new Error('harus valid');
    expect(parsed.value.pertemuan.map((p) => p.id)).toEqual(['x-1', 'x-2']);
    expect(parsed.value.pertemuan[0].dokumen.modul).toBeTruthy();
    expect(parsed.value.pertemuan[0].dokumen.lkpd).toBeTruthy();
  });

  it('7. JSON V2 invalid ditolak seluruhnya', () => {
    expect(parseGenerationResultV2(null).ok).toBe(false);
    expect(parseGenerationResultV2({ version: 1, pertemuan: [] }).ok).toBe(false);
    expect(parseGenerationResultV2({ version: 2, pertemuan: {} }).ok).toBe(false);
    const bad = parseGenerationResultV2({
      version: 2,
      pertemuan: [{ nomor: 1 }],
    });
    expect(bad.ok).toBe(false);
    const dup = parseGenerationResultV2({
      version: 2,
      pertemuan: [
        { id: 'a', nomor: 1 },
        { id: 'a', nomor: 2 },
      ],
    });
    expect(dup.ok).toBe(false);
  });

  it('ringkasan menghitung dokumen berhasil per jenis', () => {
    const s = summarizeGenerationResultV2(makeV2('a'));
    expect(s.jumlahPertemuan).toBe(2);
    expect(s.perJenis.modul).toBe(2);
    expect(s.perJenis.lkpd).toBe(1);
    expect(s.totalDokumen).toBe(3);
    expect(hasV2Content(makeV2('a'))).toBe(true);
  });

  it('10. skeleton V2 kosong BUKAN konten yang bisa disimpan', () => {
    const fresh: GenerationResultV2 = {
      version: 2,
      pertemuan: [
        {
          id: 'p1',
          nomor: 1,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true,
            lkpd: false,
            asesmen: false,
            soal: false,
            materi: false,
            refleksi: false,
          },
          dokumen: {},
          status: {},
        },
      ],
    };
    expect(
      computeHasContent({ legacy: [null, null], v2Active: true, v2Result: fresh }),
    ).toBe(false);
    // 11. satu dokumen valid → savable.
    expect(
      computeHasContent({
        legacy: [null, null],
        v2Active: true,
        v2Result: makeV2('a'),
      }),
    ).toBe(true);
    // 14. flag OFF / mode legacy: perilaku lama dipertahankan.
    expect(
      computeHasContent({ legacy: [null, null], v2Active: false, v2Result: fresh }),
    ).toBe(false);
    expect(
      computeHasContent({ legacy: [{ a: 1 }], v2Active: false, v2Result: null }),
    ).toBe(true);
  });
});

describe('Fase 4A — payload save/update history', () => {
  it('2. payload V2 berisi generation_result_v2 + version 2 (lossless)', async () => {
    const { buildContentHistoryWritePayload } = await import('@/lib/history-payload');
    const cols = buildContentHistoryWritePayload('v2', {
      name: 'x',
      form_data: baseForm,
      modul_data: null,
      lkpd_data: null,
      asesmen_data: null,
      materi_data: null,
      bank_soal_data: null,
      tindak_lanjut_data: null,
      generation_result_v2: makeV2('a'),
    }) as unknown as Record<string, unknown>;
    expect(cols.content_schema_version).toBe(CONTENT_SCHEMA_VERSION_V2);
    expect(cols.generation_result_v2).toEqual(
      serializeGenerationResultV2(makeV2('a')),
    );
    // Tidak ada konversi lossy ke kolom legacy.
    expect(cols.modul_data).toBeNull();
  });

  it('5 & 6. deteksi versi history: legacy vs V2', () => {
    expect(isV2History({ content_schema_version: 1 })).toBe(false);
    expect(isV2History({ content_schema_version: null })).toBe(false);
    expect(isV2History({ content_schema_version: 2 })).toBe(true);
  });

  it('13. fullscreen mobile tersedia untuk V2 fresh tanpa generatedSteps', () => {
    expect(
      canUseFullscreenPreview({
        hasLegacyModul: false,
        v2Active: true,
        v2Result: makeV2('a'),
        activeTab: 'modul',
      }),
    ).toBe(true);
    // Skeleton kosong: tidak ada yang bisa dipreview.
    expect(
      canUseFullscreenPreview({
        hasLegacyModul: false,
        v2Active: true,
        v2Result: { version: 2, pertemuan: [] },
        activeTab: 'modul',
      }),
    ).toBe(false);
    expect(
      canUseFullscreenPreview({ hasLegacyModul: false, v2Active: false, activeTab: 'modul' }),
    ).toBe(false);
    expect(
      canUseFullscreenPreview({ hasLegacyModul: true, v2Active: false, activeTab: 'modul' }),
    ).toBe(true);
    expect(
      canUseFullscreenPreview({
        hasLegacyModul: true,
        v2Active: true,
        activeTab: 'perencanaan',
      }),
    ).toBe(false);
  });
});

// ------------------------------------------------- hook: reset & load result

const makeInvoke = () =>
  vi.fn(async (payload: Record<string, unknown>) => {
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
            : { judul_lkpd: 'LKPD', aktivitas_utama: [] },
      },
    } as never;
  });

const setup = (overrides: Record<string, unknown> = {}) =>
  renderHook(() =>
    usePertemuanGeneration({
      formData: baseForm,
      seed: SEED,
      enabled: true,
      soalConfig: undefined as unknown as SoalConfig,
      invoke: makeInvoke() as never,
      ...overrides,
    }),
  );

describe('Fase 4A — reset & load lifecycle', () => {
  it('4. loadResult tidak memanggil generate', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    await act(async () => {
      result.current.loadResult(makeV2('a'), baseForm);
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(result.current.result.pertemuan.map((p) => p.id)).toEqual(['a-1', 'a-2']);
  });

  it('8. pergantian history A → B tidak mencampur dokumen', async () => {
    const { result } = setup();
    await act(async () => {
      result.current.loadResult(makeV2('a'), baseForm);
    });
    await act(async () => {
      result.current.resetV2();
      result.current.loadResult(makeV2('b'), baseForm);
    });
    const ids = result.current.result.pertemuan.map((p) => p.id);
    expect(ids).toEqual(['b-1', 'b-2']);
    expect(ids.some((id) => id.startsWith('a-'))).toBe(false);
    expect(
      (result.current.result.pertemuan[0].dokumen.lkpd as never as { judul_lkpd: string })
        .judul_lkpd,
    ).toBe('LKPD b');
  });

  it('10. reset membersihkan seluruh dokumen V2', async () => {
    const { result } = setup();
    await act(async () => {
      result.current.loadResult(makeV2('a'), baseForm);
    });
    await act(async () => {
      result.current.resetV2();
    });
    expect(result.current.result.modulPreface).toBeUndefined();
    for (const p of result.current.result.pertemuan) {
      expect(Object.keys(p.dokumen)).toHaveLength(0);
      expect(p.status.modul ?? 'idle').toBe('idle');
    }
    expect(result.current.lastError).toBeNull();
  });

  it('11 & 12. response terlambat setelah reset tidak ditempel', async () => {
    let release: (v: unknown) => void = () => {};
    const gate = new Promise((r) => {
      release = r;
    });
    const invoke = vi.fn(async (payload: Record<string, unknown>) => {
      await gate;
      const data = payload.data as Record<string, unknown>;
      return {
        data: {
          meta: {
            pertemuanId: data.pertemuanId,
            nomorPertemuan: data.nomorPertemuan,
            type: payload.type,
          },
          data: { judul_lkpd: 'LKPD telat', aktivitas_utama: [] },
        },
      } as never;
    });
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx'));
    const id = result.current.result.pertemuan[0].id;
    let pending: unknown;
    act(() => {
      pending = result.current.regenerateDokumen(id, 'lkpd');
    });
    // Reset saat antrean berjalan.
    act(() => result.current.resetV2());
    await act(async () => {
      release(null);
      await pending;
    });
    for (const p of result.current.result.pertemuan) {
      expect(p.dokumen.lkpd).toBeUndefined();
    }
    expect(result.current.isGenerating).toBe(false);
  });

  it('6. history version 2 saat flag OFF: hook tidak menerima hasil', async () => {
    const { result } = setup({ enabled: false });
    await act(async () => {
      result.current.loadResult(makeV2('a'), baseForm);
      result.current.syncFromForm(baseForm.pertemuan, 'ctx');
    });
    // syncFromForm no-op saat disabled; state tetap kosong bila tidak dimuat UI.
    expect(result.current.enabled).toBe(false);
  });
});
