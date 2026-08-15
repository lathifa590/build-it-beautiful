/**
 * FASE 4A.2 — Planning (Prota/Prosem/KKTP) keluar dari paket History V2.
 * Tidak ada koneksi database nyata dan tidak ada pemanggilan AI.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
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
  summarizeGenerationResultV2,
} from '@/lib/history-v2';
import { SaveHistoryModal } from '@/components/modul/SaveHistoryModal';

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
      return { eq: () => ({ eq: () => ({ select: selectAfterWrite }) }) };
    },
    select: () => ({
      eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
    }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  });
  return { supabase: { from: () => builder() } };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

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

/** Params dengan planning tahunan TERISI — tidak boleh bocor ke row V2. */
const paramsWithPlanning = (
  extra: Partial<ContentHistoryWriteParams> = {},
): ContentHistoryWriteParams => ({
  name: 'Riwayat',
  form_data: baseForm,
  modul_data: { pertemuan: [{ nomorPertemuan: 1 }] } as never,
  lkpd_data: null,
  asesmen_data: null,
  materi_data: null,
  bank_soal_data: null,
  tindak_lanjut_data: null,
  prota_data: { prota: [{ bab: 'Bab 1' }] } as never,
  kktp_data: { rows: [{ tp: 'TP 1' }] } as never,
  prosem_data: { sem1: { rows: [] } as never, sem2: null },
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

describe('Fase 4A.2 — planning keluar dari paket V2', () => {
  it('1-3. save V2 → prota/kktp/prosem null', () => {
    const p = buildContentHistoryWritePayload(
      'v2',
      paramsWithPlanning({ generation_result_v2: v2() }),
    );
    expect(p.prota_data).toBeNull();
    expect(p.kktp_data).toBeNull();
    expect(p.prosem_data).toBeNull();
    expect(p.content_schema_version).toBe(2);
    expect(p.generation_result_v2).toEqual(serializeGenerationResultV2(v2()));
    // Planning juga tidak boleh disalin ke payload V2.
    expect(JSON.stringify(p.generation_result_v2)).not.toContain('Bab 1');
  });

  it('legacy tetap menyimpan planning (kompatibilitas history lama)', () => {
    const p = buildContentHistoryWritePayload('legacy', paramsWithPlanning());
    expect(p.content_schema_version).toBe(1);
    expect(p.prota_data).not.toBeNull();
    expect(p.kktp_data).not.toBeNull();
    expect(p.prosem_data).not.toBeNull();
  });

  it('4. planning lama tidak bocor ke INSERT V2', async () => {
    const { useSaveContentHistory } = await import('@/hooks/useContentHistory');
    const { result } = renderHook(() => useSaveContentHistory(), { wrapper });
    await result.current.mutateAsync(paramsWithPlanning({ generation_result_v2: v2() }));
    await waitFor(() => expect(captured.insert.length).toBe(1));
    const row = captured.insert[0] as Record<string, unknown>;
    expect(row.prota_data).toBeNull();
    expect(row.kktp_data).toBeNull();
    expect(row.prosem_data).toBeNull();
  });

  it('5. planning lama tidak bocor ke UPDATE V2', async () => {
    const { useUpdateContentHistory } = await import('@/hooks/useContentHistory');
    const { result } = renderHook(() => useUpdateContentHistory(), { wrapper });
    await result.current.mutateAsync({
      id: 'row-1',
      ...paramsWithPlanning({ generation_result_v2: v2() }),
    });
    await waitFor(() => expect(captured.update.length).toBe(1));
    const row = captured.update[0] as Record<string, unknown>;
    expect(row.prota_data).toBeNull();
    expect(row.kktp_data).toBeNull();
    expect(row.prosem_data).toBeNull();
  });
});

describe('Fase 4A.2 — load lintas mode terhadap planning', () => {
  const v2Row = {
    content_schema_version: 2,
    generation_result_v2: serializeGenerationResultV2(v2()),
  };

  it('6. load V2 membersihkan seluruh state planning', () => {
    const plan = resolveHistoryLoadPlan(v2Row, { flagOn: true });
    expect(plan.mode).toBe('v2');
    if (plan.mode !== 'v2') return;
    expect(plan.clearPlanning).toBe(true);
  });

  it('7. load legacy tetap memuat Prota/Prosem/KKTP', () => {
    const plan = resolveHistoryLoadPlan(
      { content_schema_version: 1, modul_data: { pertemuan: [] } },
      { flagOn: true },
    );
    expect(plan.mode).toBe('legacy');
    if (plan.mode !== 'legacy') return;
    expect(plan.loadPlanning).toBe(true);
  });

  it('8. V2 invalid tidak membersihkan planning aktif', () => {
    const plan = resolveHistoryLoadPlan(
      { content_schema_version: 2, generation_result_v2: { version: 2, pertemuan: [{}] } },
      { flagOn: true },
    );
    expect(plan.mode).toBe('reject');
    expect(plan).not.toHaveProperty('clearPlanning');
  });

  it('9. V2 + flag OFF tidak membersihkan planning aktif', () => {
    const plan = resolveHistoryLoadPlan(v2Row, { flagOn: false });
    expect(plan.mode).toBe('reject');
    expect(plan).not.toHaveProperty('clearPlanning');
  });
});

describe('Fase 4A.2 — SaveHistoryModal mode V2', () => {
  const emptyStatus = {
    modul: null,
    lkpd: null,
    asesmen: null,
    materi: null,
    bankSoal: null,
    tindakLanjut: null,
    prota: { prota: [] } as never,
    kktp: { rows: [] } as never,
    prosem: { sem1: { rows: [] } as never, sem2: null },
  };

  it('10. ringkasan V2 tidak menampilkan Prota/Prosem/KKTP', () => {
    render(
      <SaveHistoryModal
        isOpen
        onClose={() => {}}
        historyName="Uji"
        setHistoryName={() => {}}
        onSave={() => {}}
        isSaving={false}
        contentStatus={emptyStatus}
        v2Summary={summarizeGenerationResultV2(v2())}
      />,
    );
    expect(screen.getByTestId('v2-summary')).toBeTruthy();
    expect(screen.queryByTestId('legacy-content-list')).toBeNull();
    expect(screen.queryByText(/Program Tahunan/i)).toBeNull();
    expect(screen.queryByText(/Program Semester/i)).toBeNull();
    expect(screen.queryByText(/KKTP/i)).toBeNull();
  });

  it('mode legacy tetap menampilkan planning', () => {
    render(
      <SaveHistoryModal
        isOpen
        onClose={() => {}}
        historyName="Uji"
        setHistoryName={() => {}}
        onSave={() => {}}
        isSaving={false}
        contentStatus={emptyStatus}
      />,
    );
    expect(screen.getByTestId('legacy-content-list')).toBeTruthy();
    expect(screen.getByText(/Program Tahunan/i)).toBeTruthy();
  });
});

describe('Fase 4A.2 — hardening validator', () => {
  const okPertemuan = v2().pertemuan[0];
  const withPertemuan = (p: unknown) => ({ version: 2, pertemuan: [p] });

  it('11. pilihanDokumen hilang / invalid ditolak', () => {
    const tanpa = { ...okPertemuan } as Record<string, unknown>;
    delete tanpa.pilihanDokumen;
    expect(parseGenerationResultV2(withPertemuan(tanpa)).ok).toBe(false);
    expect(
      parseGenerationResultV2(withPertemuan({ ...okPertemuan, pilihanDokumen: null })).ok,
    ).toBe(false);
    expect(
      parseGenerationResultV2(
        withPertemuan({ ...okPertemuan, pilihanDokumen: { modul: true } }),
      ).ok,
    ).toBe(false);
  });

  it('12. Modul legacy dengan pembukaan/inti/penutup invalid ditolak', () => {
    expect(
      parseGenerationResultV2(
        withPertemuan({
          ...okPertemuan,
          dokumen: { modul: { pembukaan: 1, inti: 2, penutup: 3 } },
        }),
      ).ok,
    ).toBe(false);
    // Bentuk legacy yang benar tetap diterima.
    expect(
      parseGenerationResultV2(
        withPertemuan({
          ...okPertemuan,
          dokumen: {
            modul: { pembukaan: { a: 1 }, inti: [{ b: 2 }], penutup: { c: 3 } },
          },
        }),
      ).ok,
    ).toBe(true);
  });
});
