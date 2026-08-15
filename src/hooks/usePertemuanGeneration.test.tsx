import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePertemuanGeneration } from '@/hooks/usePertemuanGeneration';
import type { FormData } from '@/types/modul';

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
            : DOC_BY_TYPE[payload.type as string],
      },
    } as never;
  });

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

describe('usePertemuanGeneration — sinkronisasi & konteks', () => {
  it('membangun pertemuan dari form', () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    expect(result.current.result.pertemuan).toHaveLength(2);
  });

  it('perubahan konteks tanpa hasil langsung reset tanpa dialog', () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-2'));
    expect(result.current.pendingContextKey).toBeNull();
    expect(result.current.result.pertemuan).toHaveLength(2);
  });

  it('perubahan konteks dengan hasil memunculkan konfirmasi dan hasil tetap sampai dikonfirmasi', async () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeDefined();

    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-2'));
    expect(result.current.pendingContextKey).toBe('ctx-2');
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeDefined();

    act(() => {
      result.current.cancelContextReset();
    });
    expect(result.current.pendingContextKey).toBeNull();
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeDefined();

    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-3'));
    act(() => result.current.confirmContextReset());
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });

  it('membatalkan reset memanggil onRestoreContext dengan snapshot form', () => {
    const onRestoreContext = vi.fn();
    const { result } = setup({ callbacks: { onRestoreContext } });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    act(() => {
      result.current.setResult((prev) => ({
        ...prev,
        pertemuan: prev.pertemuan.map((p, i) =>
          i === 0 ? { ...p, dokumen: { ...p.dokumen, lkpd: { judul: 'x' } as never } } : p,
        ),
      }));
    });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-2'));
    act(() => {
      result.current.cancelContextReset();
    });
    expect(onRestoreContext).toHaveBeenCalledWith(baseForm);
  });
});

describe('usePertemuanGeneration — generate', () => {
  it('mengirim satu request per dokumen terpilih dan menyimpan hasil per pertemuan', async () => {
    const invoke = makeInvoke();
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    const [p1, p2] = result.current.result.pertemuan;
    act(() => {
      result.current.togglePilihan(p1.id, 'soal', false);
      result.current.togglePilihan(p1.id, 'materi', false);
      result.current.togglePilihan(p1.id, 'asesmen', false);
      result.current.togglePilihan(p1.id, 'refleksi', false);
      result.current.togglePilihan(p2.id, 'lkpd', false);
      result.current.togglePilihan(p2.id, 'soal', false);
      result.current.togglePilihan(p2.id, 'materi', false);
      result.current.togglePilihan(p2.id, 'asesmen', false);
      result.current.togglePilihan(p2.id, 'refleksi', false);
    });
    await act(async () => {
      await result.current.generateMissing();
    });
    expect(result.current.isGenerating).toBe(false);
    // P1: modul + lkpd, P2: modul
    expect(invoke).toHaveBeenCalledTimes(3);
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeDefined();
    expect(result.current.result.pertemuan[1].dokumen.lkpd).toBeUndefined();
    expect(result.current.result.pertemuan[0].status.modul).toBe('ok');
  });

  it('kegagalan satu dokumen tidak menghentikan sisanya', async () => {
    let calls = 0;
    const base = makeInvoke();
    const invoke = vi.fn(async (payload: Record<string, unknown>) => {
      calls += 1;
      if (calls === 1) return { data: { error: 'server error' } } as never;
      return base(payload);
    });
    const { result } = setup({ invoke: invoke as never });
    act(() => result.current.syncFromForm([{ nomorPertemuan: 1, durasi: '90' }], 'ctx-1'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
    await act(async () => {
      await result.current.regenerateDokumen(id, 'materi');
    });
    expect(result.current.result.pertemuan[0].status.materi).toBe('ok');
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
  });

  it('needApiKey memicu callback dan menandai error', async () => {
    const onNeedApiKey = vi.fn();
    const invoke = vi.fn(async () => ({ data: { needApiKey: true } }) as never);
    const { result } = setup({ invoke: invoke as never, callbacks: { onNeedApiKey } });
    act(() => result.current.syncFromForm([{ nomorPertemuan: 1, durasi: '90' }], 'ctx-1'));
    const id = result.current.result.pertemuan[0].id;
    await act(async () => {
      await result.current.regenerateDokumen(id, 'lkpd');
    });
    expect(onNeedApiKey).toHaveBeenCalled();
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('error');
  });
});

describe('usePertemuanGeneration — edit & hapus pertemuan', () => {
  it('editor menulis ke dokumen pertemuan aktif saja', async () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    const [p1, p2] = result.current.result.pertemuan;
    await act(async () => {
      await result.current.regenerateDokumen(p1.id, 'lkpd');
      await result.current.regenerateDokumen(p2.id, 'lkpd');
    });
    act(() => result.current.updateSection(p1.id, 'lkpd', 'judul_lkpd', 'Judul Baru'));
    expect((result.current.result.pertemuan[0].dokumen.lkpd as unknown as { judul_lkpd: string }).judul_lkpd).toBe(
      'Judul Baru',
    );
    expect((result.current.result.pertemuan[1].dokumen.lkpd as unknown as { judul_lkpd: string }).judul_lkpd).toBe(
      'Dok lkpd',
    );
    expect(result.current.result.pertemuan[0].status.lkpd).toBe('ok');
  });

  it('hapus pertemuan berhasil butuh konfirmasi dan tidak menggeser hasil lain', async () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    const [p1, p2] = result.current.result.pertemuan;
    await act(async () => {
      await result.current.regenerateDokumen(p1.id, 'lkpd');
      await result.current.regenerateDokumen(p2.id, 'asesmen');
    });
    expect(result.current.checkDeletePertemuan(p1.id)).toMatchObject({
      allowed: true,
      requiresConfirm: true,
    });
    act(() => result.current.removePertemuan(p1.id));
    expect(result.current.result.pertemuan).toHaveLength(1);
    expect(result.current.result.pertemuan[0].id).toBe(p2.id);
    expect(result.current.result.pertemuan[0].nomor).toBe(1);
    expect(result.current.result.pertemuan[0].dokumen.asesmen).toBeDefined();
    expect(result.current.result.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });

  it('pertemuan tanpa hasil dapat dihapus tanpa konfirmasi', () => {
    const { result } = setup();
    act(() => result.current.syncFromForm(baseForm.pertemuan, 'ctx-1'));
    const id = result.current.result.pertemuan[0].id;
    expect(result.current.checkDeletePertemuan(id)).toMatchObject({
      allowed: true,
      requiresConfirm: false,
    });
  });
});
