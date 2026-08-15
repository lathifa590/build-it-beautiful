/**
 * Koreksi Fase 3C — helper murni:
 * - canonical field konteks (key ⇄ snapshot ⇄ restore)
 * - renumber setelah hapus pertemuan (termasuk metadata Modul)
 */
import { describe, expect, it } from 'vitest';
import type { FormData, GenerationResultV2, PertemuanResult } from '@/types/modul';
import {
  CONTEXT_KEY_FIELDS,
  CONTEXT_SNAPSHOT_FIELDS,
  buildContextKey,
  canDeletePertemuan,
  pickContextFields,
  removePertemuanById,
} from '@/lib/pertemuan-generation';

const form = {
  kurikulum: 'merdeka',
  mataPelajaran: 'Matematika',
  kelas: '7',
  fase: 'D',
  materi: 'Aljabar',
  subMateri: 'Bentuk Aljabar',
  tujuanPembelajaran: 'TP lama',
  capaianPembelajaran: 'CP lama',
  namaPenyusun: 'Budi',
  namaSekolah: 'SMP 1',
} as unknown as FormData;

const emptyStatus = () => ({
  modul: 'idle' as const,
  lkpd: 'idle' as const,
  asesmen: 'idle' as const,
  soal: 'idle' as const,
  materi: 'idle' as const,
  refleksi: 'idle' as const,
});

const emptyPilihan = () => ({
  lkpd: true,
  asesmen: true,
  soal: true,
  materi: true,
  refleksi: true,
});

const mkPertemuan = (
  id: string,
  nomor: number,
  dokumen: Record<string, unknown> = {},
): PertemuanResult =>
  ({
    id,
    nomor,
    durasiMenit: 90,
    status: emptyStatus(),
    pilihanDokumen: emptyPilihan(),
    dokumen,
  }) as unknown as PertemuanResult;

const mkResult = (pertemuan: PertemuanResult[]): GenerationResultV2 => ({
  version: 2,
  pertemuan,
});

describe('Fase 3C — canonical context fields', () => {
  it('kurikulum termasuk dalam key dan snapshot', () => {
    expect(CONTEXT_KEY_FIELDS).toContain('kurikulum');
    expect(CONTEXT_SNAPSHOT_FIELDS).toEqual(
      expect.arrayContaining([...CONTEXT_KEY_FIELDS, 'capaianPembelajaran']),
    );
  });

  it('pickContextFields hanya mengambil field konteks', () => {
    const snap = pickContextFields(form) as unknown as Record<string, unknown>;
    for (const k of CONTEXT_SNAPSHOT_FIELDS) expect(snap[k]).toBe(
      (form as unknown as Record<string, unknown>)[k],
    );
    expect(snap.namaPenyusun).toBeUndefined();
    expect(snap.namaSekolah).toBeUndefined();
  });

  it('restore snapshot mengembalikan kurikulum dan field konteks lain', () => {
    const snapshot = pickContextFields(form);
    const diubah = {
      ...form,
      kurikulum: 'kbc',
      tujuanPembelajaran: 'TP baru',
    } as FormData;
    const restored = { ...diubah, ...pickContextFields(snapshot as FormData) };
    expect(restored.kurikulum).toBe('merdeka');
    expect(restored.tujuanPembelajaran).toBe('TP lama');
    expect(buildContextKey(restored)).toBe(buildContextKey(form));
  });

  it('perubahan field non-konteks tidak mengubah context key', () => {
    const lain = { ...form, namaPenyusun: 'Ani', namaSekolah: 'SMP 9' } as FormData;
    expect(buildContextKey(lain)).toBe(buildContextKey(form));
  });

  it('perubahan kurikulum mengubah context key', () => {
    expect(buildContextKey({ ...form, kurikulum: 'kbc' } as FormData)).not.toBe(
      buildContextKey(form),
    );
  });
});

describe('Fase 3C — renumber setelah hapus pertemuan', () => {
  it('ID pertemuan tersisa tetap dan nomor result jadi 1', () => {
    const res = mkResult([mkPertemuan('p1', 1), mkPertemuan('p2', 2)]);
    const next = removePertemuanById(res, 'p1');
    expect(next.pertemuan).toHaveLength(1);
    expect(next.pertemuan[0].id).toBe('p2');
    expect(next.pertemuan[0].nomor).toBe(1);
  });

  it('nomorPertemuan Modul legacy ikut jadi 1', () => {
    const res = mkResult([
      mkPertemuan('p1', 1),
      mkPertemuan('p2', 2, {
        modul: { nomorPertemuan: 2, durasi: '90', pembukaan: ['a'], inti: ['b'], penutup: ['c'] },
      }),
    ]);
    const next = removePertemuanById(res, 'p1');
    expect(
      (next.pertemuan[0].dokumen.modul as unknown as { nomorPertemuan: number }).nomorPertemuan,
    ).toBe(1);
  });

  it('nomorPertemuan Modul detail ikut jadi 1', () => {
    const res = mkResult([
      mkPertemuan('p1', 1),
      mkPertemuan('p2', 2, {
        modul: {
          nomorPertemuan: 2,
          durasi: '90',
          tahap_awal: { judul: 'Awal' },
          tahap_inti: { judul: 'Inti' },
          tahap_penutup: { judul: 'Penutup' },
        },
      }),
    ]);
    const next = removePertemuanById(res, 'p1');
    const modul = next.pertemuan[0].dokumen.modul as unknown as Record<string, unknown>;
    expect(modul.nomorPertemuan).toBe(1);
    expect((modul.tahap_inti as { judul: string }).judul).toBe('Inti');
  });

  it('dokumen non-modul tetap utuh dan tidak diubah', () => {
    const dok = {
      modul: { nomorPertemuan: 2 },
      lkpd: { judul_lkpd: 'LKPD Pertemuan 2', aktivitas_utama: [] },
      asesmen: { asesmen_awal: { judul: 'Ases 2' } },
      materi: { judul_materi: 'Materi 2', isi_materi: [] },
      refleksi: { refleksi_guru: [], refleksi_siswa: [] },
      soal: { daftar_soal: [{ pertanyaan: 'Soal pertemuan 2' }] },
    };
    const res = mkResult([mkPertemuan('p1', 1), mkPertemuan('p2', 2, dok)]);
    const next = removePertemuanById(res, 'p1');
    const out = next.pertemuan[0].dokumen as unknown as Record<string, unknown>;
    expect(out.lkpd).toEqual(dok.lkpd);
    expect(out.asesmen).toEqual(dok.asesmen);
    expect(out.materi).toEqual(dok.materi);
    expect(out.refleksi).toEqual(dok.refleksi);
    expect(out.soal).toEqual(dok.soal);
  });

  it('penghapusan ditolak saat dokumen masih pending', () => {
    const p = mkPertemuan('p1', 1);
    const res = mkResult([{ ...p, status: { ...p.status, modul: 'pending' } }]);
    expect(canDeletePertemuan(res, 'p1')).toMatchObject({ allowed: false });
  });
});
