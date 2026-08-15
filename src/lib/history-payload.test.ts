/**
 * FASE 4A.1 — Payload database, validator ketat, dan perpindahan lintas mode.
 * Supabase di-mock penuh (tidak ada koneksi database nyata) dan tidak ada AI.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { FormData, GenerationResultV2 } from '@/types/modul';
import {
  buildContentHistoryWritePayload,
  type ContentHistoryWriteParams,
} from '@/lib/history-payload';
import {
  parseGenerationResultV2,
  resolveHistoryLoadPlan,
  serializeGenerationResultV2,
} from '@/lib/history-v2';

// ------------------------------------------------------------ supabase mock

const captured: { insert: unknown[]; update: unknown[] } = { insert: [], update: [] };

vi.mock('@/integrations/supabase/client', () => {
  const single = () => Promise.resolve({ data: { id: 'row-1' }, error: null });
  const selectAfterWrite = () => ({ single });
  const builder = () => ({
    insert: (payload: unknown) => {
      captured.insert.push(payload);
      return { select: selectAfterWrite };
    },
    update: (payload: unknown) => {
      captured.update.push(payload);
      return {
        eq: () => ({ eq: () => ({ select: selectAfterWrite }) }),
      };
    },
    select: () => ({
      eq: () => ({
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        then: undefined,
      }),
    }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  });
  return { supabase: { from: () => builder() } };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// ---------------------------------------------------------------- fixtures

const baseForm = { mataPelajaran: 'IPA', kelas: '8' } as unknown as FormData;

const modulOk = {
  tahap_awal: { judul: 'Awal', kegiatan: [] },
  tahap_inti: { judul: 'Inti', kegiatan: [] },
  tahap_penutup: { judul: 'Penutup', kegiatan: [] },
};

const v2 = (): GenerationResultV2 => ({
  version: 2,
  pertemuan: [
    {
      id: 'p-1',
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
      dokumen: { modul: modulOk as never },
      status: { modul: 'ok' },
    },
  ],
});

/** Params dengan state legacy TERISI — harus tidak bocor ke row V2. */
const paramsWithLegacy = (
  extra: Partial<ContentHistoryWriteParams> = {},
): ContentHistoryWriteParams => ({
  name: 'Riwayat',
  form_data: baseForm,
  modul_data: { pertemuan: [{ nomorPertemuan: 1 }] } as never,
  lkpd_data: { judul_lkpd: 'L' } as never,
  asesmen_data: { asesmen_awal: {} } as never,
  materi_data: { isi_materi: [] } as never,
  bank_soal_data: { daftar_soal: [] } as never,
  tindak_lanjut_data: { remedial: 'x' } as never,
  prota_data: { rows: [] } as never,
  kktp_data: { rows: [] } as never,
  prosem_data: null,
  ...extra,
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

beforeEach(() => {
  captured.insert = [];
  captured.update = [];
});

// ------------------------------------------------------------------- tests

describe('Fase 4A.1 — payload legacy vs V2 mutually exclusive', () => {
  it('1. save V2 setelah state legacy terisi → semua kolom dokumen legacy null', () => {
    const p = buildContentHistoryWritePayload(
      'v2',
      paramsWithLegacy({ generation_result_v2: v2() }),
    );
    expect(p.content_schema_version).toBe(2);
    expect(p.generation_result_v2).toEqual(serializeGenerationResultV2(v2()));
    expect(p.modul_data).toBeNull();
    expect(p.lkpd_data).toBeNull();
    expect(p.asesmen_data).toBeNull();
    expect(p.materi_data).toBeNull();
    expect(p.bank_soal_data).toBeNull();
    expect(p.tindak_lanjut_data).toBeNull();
    // FASE 4A.2: planning tahunan BUKAN bagian paket V2.
    expect(p.prota_data).toBeNull();
    expect(p.kktp_data).toBeNull();
    expect(p.prosem_data).toBeNull();
  });


  it('2. save legacy → generation_result_v2 null dan version 1', () => {
    const p = buildContentHistoryWritePayload('legacy', paramsWithLegacy());
    expect(p.content_schema_version).toBe(1);
    expect(p.generation_result_v2).toBeNull();
    expect(p.modul_data).not.toBeNull();
  });

  it('3 & 4. update lintas versi membersihkan kolom mode lawan', () => {
    const toV2 = buildContentHistoryWritePayload(
      'v2',
      paramsWithLegacy({ generation_result_v2: v2() }),
    );
    expect(toV2.modul_data).toBeNull();
    expect(toV2.content_schema_version).toBe(2);

    const toLegacy = buildContentHistoryWritePayload(
      'legacy',
      paramsWithLegacy({ generation_result_v2: v2() }),
    );
    expect(toLegacy.generation_result_v2).toBeNull();
    expect(toLegacy.content_schema_version).toBe(1);
  });
});

describe('Fase 4A.1 — object final yang dikirim ke Supabase', () => {
  it('16. INSERT V2 mengirim kolom legacy null + version 2 (tanpa as any)', async () => {
    const { useSaveContentHistory } = await import('@/hooks/useContentHistory');
    const { result } = renderHook(() => useSaveContentHistory(), { wrapper });
    await result.current.mutateAsync(
      paramsWithLegacy({ generation_result_v2: v2() }),
    );
    await waitFor(() => expect(captured.insert.length).toBe(1));
    const row = captured.insert[0] as Record<string, unknown>;
    expect(row.user_id).toBe('user-1');
    expect(row.content_schema_version).toBe(2);
    expect(row.modul_data).toBeNull();
    expect(row.lkpd_data).toBeNull();
    expect(row.generation_result_v2).toEqual(serializeGenerationResultV2(v2()));
  });

  it('16b. INSERT legacy mengirim version 1 + generation_result_v2 null', async () => {
    const { useSaveContentHistory } = await import('@/hooks/useContentHistory');
    const { result } = renderHook(() => useSaveContentHistory(), { wrapper });
    await result.current.mutateAsync(paramsWithLegacy());
    await waitFor(() => expect(captured.insert.length).toBe(1));
    const row = captured.insert[0] as Record<string, unknown>;
    expect(row.content_schema_version).toBe(1);
    expect(row.generation_result_v2).toBeNull();
    expect(row.modul_data).not.toBeNull();
  });

  it('16c. UPDATE legacy → V2 dan V2 → legacy membersihkan mode lawan', async () => {
    const { useUpdateContentHistory } = await import('@/hooks/useContentHistory');
    const { result } = renderHook(() => useUpdateContentHistory(), { wrapper });

    await result.current.mutateAsync({
      id: 'row-1',
      ...paramsWithLegacy({ generation_result_v2: v2() }),
    });
    await result.current.mutateAsync({ id: 'row-1', ...paramsWithLegacy() });
    await waitFor(() => expect(captured.update.length).toBe(2));

    const up1 = captured.update[0] as Record<string, unknown>;
    expect(up1.content_schema_version).toBe(2);
    expect(up1.modul_data).toBeNull();
    expect(up1.updated_at).toBeTruthy();

    const up2 = captured.update[1] as Record<string, unknown>;
    expect(up2.content_schema_version).toBe(1);
    expect(up2.generation_result_v2).toBeNull();
  });
});

describe('Fase 4A.1 — validator ketat', () => {
  const withPertemuan = (p: unknown) => ({ version: 2, pertemuan: [p] });
  const okPertemuan = v2().pertemuan[0];

  it('12. menolak nomor pecahan / duplikat', () => {
    expect(
      parseGenerationResultV2(withPertemuan({ ...okPertemuan, nomor: 1.5 })).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2({
        version: 2,
        pertemuan: [okPertemuan, { ...okPertemuan, id: 'p-2' }],
      }).ok,
    ).toBe(false);
    // ID duplikat juga ditolak.
    expect(
      parseGenerationResultV2({
        version: 2,
        pertemuan: [okPertemuan, { ...okPertemuan, nomor: 2 }],
      }).ok,
    ).toBe(false);
  });

  it('13. menolak durasi 0 / negatif / NaN (tanpa dinormalisasi ke 0)', () => {
    for (const d of [0, -30, Number.NaN, '90', undefined]) {
      const r = parseGenerationResultV2(
        withPertemuan({ ...okPertemuan, durasiMenit: d }),
      );
      expect(r.ok).toBe(false);
    }
  });

  it('14. menolak bentuk dokumen salah, status salah, pilihan salah', () => {
    expect(
      parseGenerationResultV2(
        withPertemuan({ ...okPertemuan, dokumen: { modul: 'string' } }),
      ).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2(
        withPertemuan({ ...okPertemuan, dokumen: { lkpd: { judul_lkpd: 'x' } } }),
      ).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2(
        withPertemuan({ ...okPertemuan, status: { modul: 'selesai' } }),
      ).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2(
        withPertemuan({
          ...okPertemuan,
          pilihanDokumen: { ...okPertemuan.pilihanDokumen, lkpd: 'ya' },
        }),
      ).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2({
        version: 2,
        pertemuan: [okPertemuan],
        dokumenGlobal: { lkpd: [] },
      }).ok,
    ).toBe(false);
    // Round-trip valid tetap lolos.
    expect(parseGenerationResultV2(serializeGenerationResultV2(v2())).ok).toBe(true);
  });
});

describe('Fase 4A.1 — rencana load lintas mode', () => {
  const v2Row = {
    content_schema_version: 2,
    generation_result_v2: serializeGenerationResultV2(v2()),
  };
  const legacyRow = { content_schema_version: 1, modul_data: { pertemuan: [] } };

  it('5 & 8. load V2 membersihkan seluruh state legacy (legacy A → V2 B)', () => {
    const plan = resolveHistoryLoadPlan(v2Row, { flagOn: true });
    expect(plan.mode).toBe('v2');
    if (plan.mode !== 'v2') return;
    expect(plan.clearLegacy).toBe(true);
    expect(plan.resetV2).toBe(true);
    expect(plan.value.pertemuan[0].id).toBe('p-1');
  });

  it('6, 7 & 9. load legacy saat flag ON membersihkan V2 dan hidrasi eksplisit', () => {
    const plan = resolveHistoryLoadPlan(legacyRow, { flagOn: true });
    expect(plan).toEqual({ mode: 'legacy', resetV2: true, hydrateLegacy: true, loadPlanning: true });
    const off = resolveHistoryLoadPlan(legacyRow, { flagOn: false });
    expect(off).toEqual({ mode: 'legacy', resetV2: false, hydrateLegacy: false, loadPlanning: true });
    // Tanpa modul_data: tidak ada hidrasi palsu.
    expect(
      resolveHistoryLoadPlan({ content_schema_version: 1 }, { flagOn: true }),
    ).toEqual({ mode: 'legacy', resetV2: true, hydrateLegacy: false, loadPlanning: true });
  });

  it('15. history invalid / flag OFF ditolak tanpa mengubah state aktif', () => {
    expect(resolveHistoryLoadPlan(v2Row, { flagOn: false }).mode).toBe('reject');
    const bad = resolveHistoryLoadPlan(
      { content_schema_version: 2, generation_result_v2: { version: 2, pertemuan: [{}] } },
      { flagOn: true },
    );
    expect(bad.mode).toBe('reject');
    // Tidak ada instruksi pembersihan state pada plan reject.
    expect(bad).not.toHaveProperty('clearLegacy');
  });
});
