import { describe, expect, it } from 'vitest';
import {
  BACKEND_TYPE_MAP,
  applyDokumenResult,
  buildGenerateQueue,
  buildPreviousSummaryForTarget,
  canDeletePertemuan,
  removePertemuanById,
  setNestedImmutable,
  updateDokumenSection,
  buildPertemuanPayload,
  emptyResultV2,
  estimateGenerateCalls,
  setDokumenStatus,
  setPilihanDokumen,
  syncPertemuanResults,
  validateResponseMeta,
} from '@/lib/pertemuan-generation';
import { fromLegacy } from '@/lib/result-adapter';
import { ENABLE_PERTEMUAN_DOCS_V2 } from '@/lib/feature-flags';
import type {
  FormData,
  GeneratedSteps,
  GenerationResultV2,
  LKPDData,
} from '@/types/modul';

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

const buildTwoMeetings = (): GenerationResultV2 => {
  let r = syncPertemuanResults(emptyResultV2(), baseForm.pertemuan, { seed: SEED });
  const [p1, p2] = r.pertemuan;
  // Pertemuan 1: Modul, LKPD, Asesmen, Materi, Refleksi (tanpa Soal)
  r = setPilihanDokumen(r, p1.id, 'soal', false);
  // Pertemuan 2: Modul, Asesmen, Soal, Materi, Refleksi (tanpa LKPD)
  r = setPilihanDokumen(r, p2.id, 'lkpd', false);
  return r;
};

describe('pertemuan-generation — pilihan dokumen', () => {
  it('dua pertemuan dapat memiliki pilihan berbeda', () => {
    const r = buildTwoMeetings();
    expect(r.pertemuan[0].pilihanDokumen.lkpd).toBe(true);
    expect(r.pertemuan[0].pilihanDokumen.soal).toBe(false);
    expect(r.pertemuan[1].pilihanDokumen.lkpd).toBe(false);
    expect(r.pertemuan[1].pilihanDokumen.soal).toBe(true);
  });

  it('Modul selalu wajib dan tidak bisa dimatikan', () => {
    const r = buildTwoMeetings();
    const off = setPilihanDokumen(r, r.pertemuan[0].id, 'modul', false);
    expect(off.pertemuan[0].pilihanDokumen.modul).toBe(true);
  });

  it('tidak memutasi input', () => {
    const r = buildTwoMeetings();
    const snapshot = JSON.stringify(r);
    setPilihanDokumen(r, r.pertemuan[0].id, 'materi', false);
    applyDokumenResult(r, r.pertemuan[0].id, 'lkpd', { x: 1 });
    setDokumenStatus(r, r.pertemuan[1].id, 'soal', 'pending');
    expect(JSON.stringify(r)).toBe(snapshot);
  });
});

describe('pertemuan-generation — antrean', () => {
  it('hanya dokumen terpilih yang masuk antrean', () => {
    const q = buildGenerateQueue(buildTwoMeetings());
    const p1 = q.filter((t) => t.nomor === 1).map((t) => t.jenis);
    const p2 = q.filter((t) => t.nomor === 2).map((t) => t.jenis);
    expect(p1).toEqual(['modul', 'lkpd', 'asesmen', 'materi', 'refleksi']);
    expect(p2).toEqual(['modul', 'asesmen', 'soal', 'materi', 'refleksi']);
    expect(estimateGenerateCalls(buildTwoMeetings())).toBe(10);
  });

  it('memetakan soal→bankSoal dan refleksi→tindakLanjut', () => {
    expect(BACKEND_TYPE_MAP.soal).toBe('bankSoal');
    expect(BACKEND_TYPE_MAP.refleksi).toBe('tindakLanjut');
    const q = buildGenerateQueue(buildTwoMeetings());
    expect(q.find((t) => t.jenis === 'soal')?.backendType).toBe('bankSoal');
    expect(q.find((t) => t.jenis === 'refleksi')?.backendType).toBe('tindakLanjut');
  });

  it('retry tidak mengulang dokumen yang sudah berhasil', () => {
    let r = buildTwoMeetings();
    r = applyDokumenResult(r, r.pertemuan[0].id, 'modul', { tahap_awal: {} });
    r = setDokumenStatus(r, r.pertemuan[0].id, 'lkpd', 'error', 'boom');
    const q = buildGenerateQueue(r, { mode: 'missing' });
    const p1 = q.filter((t) => t.nomor === 1).map((t) => t.jenis);
    expect(p1).not.toContain('modul');
    expect(p1).toContain('lkpd');
  });

  it('tidak menghasilkan request duplikat saat status pending', () => {
    let r = buildTwoMeetings();
    r = setDokumenStatus(r, r.pertemuan[0].id, 'modul', 'pending');
    const q = buildGenerateQueue(r, { mode: 'missing' });
    expect(q.filter((t) => t.nomor === 1 && t.jenis === 'modul')).toHaveLength(0);
    const qAll = buildGenerateQueue(r, { mode: 'all' });
    expect(qAll.filter((t) => t.nomor === 1 && t.jenis === 'modul')).toHaveLength(0);
  });
});

describe('pertemuan-generation — payload', () => {
  it('membawa id, nomor, total, durasi, dan submateri yang benar', () => {
    const r = buildTwoMeetings();
    const p2 = r.pertemuan[1];
    const { type, data } = buildPertemuanPayload({
      formData: baseForm,
      pertemuan: p2,
      totalPertemuan: 2,
      jenis: 'soal',
    });
    expect(type).toBe('bankSoal');
    expect(data.pertemuanTarget).toMatchObject({
      id: p2.id,
      nomorPertemuan: 2,
      durasiMenit: 45,
    });
    expect(data.pertemuanId).toBe(p2.id);
    expect(data.nomorPertemuan).toBe(2);
    expect(data.totalPertemuan).toBe(2);
    expect(data.durasiMenit).toBe(45);
    expect(data.subMateri).toBe('Bentuk Aljabar');
    expect(JSON.stringify(data)).not.toContain('"undefined"');
  });
});

describe('pertemuan-generation — isolasi hasil', () => {
  it('hasil pertemuan 2 tidak menimpa pertemuan 1', () => {
    let r = buildTwoMeetings();
    const [p1, p2] = r.pertemuan;
    r = applyDokumenResult(r, p1.id, 'lkpd', { judul: 'LKPD P1' });
    r = applyDokumenResult(r, p2.id, 'asesmen', { judul: 'Asesmen P2' });
    expect((r.pertemuan[0].dokumen.lkpd as unknown as { judul: string }).judul).toBe('LKPD P1');
    expect(r.pertemuan[0].dokumen.asesmen).toBeUndefined();
    expect((r.pertemuan[1].dokumen.asesmen as unknown as { judul: string }).judul).toBe('Asesmen P2');
    expect(r.pertemuan[1].dokumen.lkpd).toBeUndefined();
  });

  it('partial failure mempertahankan hasil yang sudah berhasil', () => {
    let r = buildTwoMeetings();
    const p1 = r.pertemuan[0];
    r = applyDokumenResult(r, p1.id, 'lkpd', { judul: 'ok' });
    r = setDokumenStatus(r, p1.id, 'asesmen', 'error', 'server error');
    expect(r.pertemuan[0].dokumen.lkpd).toBeDefined();
    expect(r.pertemuan[0].status.lkpd).toBe('ok');
    expect(r.pertemuan[0].status.asesmen).toBe('error');
    expect(r.pertemuan[0].errors?.asesmen).toBe('server error');
  });

  it('menolak response meta yang tidak cocok', () => {
    const r = buildTwoMeetings();
    const p1 = r.pertemuan[0];
    expect(validateResponseMeta({ pertemuanId: p1.id, nomorPertemuan: 1 }, p1).ok).toBe(true);
    expect(validateResponseMeta(undefined, p1).ok).toBe(true);
    expect(validateResponseMeta({ nomorPertemuan: 2 }, p1).ok).toBe(false);
    expect(validateResponseMeta({ pertemuanId: 'lain' }, p1).ok).toBe(false);
  });
});

describe('pertemuan-generation — stable id & legacy', () => {
  it('mengubah durasi tidak mengubah ID', () => {
    const r = buildTwoMeetings();
    const ids = r.pertemuan.map((p) => p.id);
    const next = syncPertemuanResults(
      r,
      [
        { nomorPertemuan: 1, durasi: '120' },
        { nomorPertemuan: 2, durasi: '45' },
      ],
      { seed: SEED },
    );
    expect(next.pertemuan.map((p) => p.id)).toEqual(ids);
    expect(next.pertemuan[0].durasiMenit).toBe(120);
  });

  it('menghapus pertemuan tidak memindahkan hasil pertemuan lain', () => {
    let r = buildTwoMeetings();
    const [p1, p2] = r.pertemuan;
    r = applyDokumenResult(r, p1.id, 'lkpd', { judul: 'LKPD P1' });
    r = applyDokumenResult(r, p2.id, 'asesmen', { judul: 'Asesmen P2' });
    const next = syncPertemuanResults(
      r,
      [{ id: p2.id, nomorPertemuan: 1, durasi: '45' }],
      { seed: SEED },
    );
    expect(next.pertemuan).toHaveLength(1);
    expect(next.pertemuan[0].id).toBe(p2.id);
    expect((next.pertemuan[0].dokumen.asesmen as unknown as { judul: string }).judul).toBe('Asesmen P2');
    expect(next.pertemuan[0].dokumen.lkpd).toBeUndefined();
  });

  it('legacy result tetap masuk dokumenGlobal, tidak menempel ke P1', () => {
    const v2 = fromLegacy(
      {
        formData: baseForm,
        generatedSteps: {
          pemahaman_bermakna: 'pb',
          pertemuan: [{ tahap_awal: {}, nomorPertemuan: 1, durasi: '90' }],
        } as unknown as GeneratedSteps,
        lkpdData: { judul: 'LKPD lama' } as unknown as LKPDData,
        asesmenData: null,
        materiData: null,
        tindakLanjutData: null,
        bankSoalData: null,
      },
      { seed: SEED },
    );
    expect(v2.dokumenGlobal?.lkpd).toBeDefined();
    expect(v2.pertemuan[0].dokumen.lkpd).toBeUndefined();
    expect(v2.pertemuan[0].pilihanDokumen.lkpd).toBe(false);
    // Hanya Modul yang diantrekan ulang — tidak mengenakan biaya 5 dokumen lain.
    const q = buildGenerateQueue(v2, { mode: 'missing' });
    expect(q).toHaveLength(0);
  });
});

describe('feature flag', () => {
  it('default OFF sehingga orchestrator/UI V2 tidak aktif', () => {
    expect(ENABLE_PERTEMUAN_DOCS_V2).toBe(false);
  });
});

describe('pertemuan-generation — summary legacy & helper edit', () => {
  it('mendukung Modul legacy (pembukaan/inti/penutup) untuk previousSummary', () => {
    let r = buildTwoMeetings();
    r = applyDokumenResult(r, r.pertemuan[0].id, 'modul', {
      nomorPertemuan: 1,
      durasi: '90',
      pembukaan: [{ kegiatan: 'Apersepsi aljabar', durasi: '10', prinsip: 'berkesadaran' }],
      inti: [{ kegiatan: 'Diskusi bentuk aljabar', durasi: '60', prinsip: 'bermakna' }],
      penutup: [{ kegiatan: 'Refleksi singkat', durasi: '20', prinsip: 'menggembirakan' }],
    });
    const summary = buildPreviousSummaryForTarget(r, 2, {
      tujuanPembelajaran: baseForm.tujuanPembelajaran,
    });
    expect(summary).toContain('Apersepsi aljabar');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('setNestedImmutable menulis path bertitik tanpa memutasi sumber', () => {
    const src = { a: { b: [{ c: 1 }] } };
    const next = setNestedImmutable(src, 'a.b.0.c', 9) as typeof src;
    expect(next.a.b[0].c).toBe(9);
    expect(src.a.b[0].c).toBe(1);
  });

  it('updateDokumenSection hanya mengubah dokumen pertemuan target', () => {
    let r = buildTwoMeetings();
    const [p1, p2] = r.pertemuan;
    r = applyDokumenResult(r, p1.id, 'lkpd', { judul_lkpd: 'A', aktivitas_utama: [] });
    r = applyDokumenResult(r, p2.id, 'lkpd', { judul_lkpd: 'B', aktivitas_utama: [] });
    const next = updateDokumenSection(r, p1.id, 'lkpd', 'judul_lkpd', 'A2');
    expect((next.pertemuan[0].dokumen.lkpd as unknown as { judul_lkpd: string }).judul_lkpd).toBe('A2');
    expect((next.pertemuan[1].dokumen.lkpd as unknown as { judul_lkpd: string }).judul_lkpd).toBe('B');
    expect(next.pertemuan[0].status.lkpd).toBe('ok');
  });

  it('canDeletePertemuan memblokir saat ada dokumen pending', () => {
    let r = buildTwoMeetings();
    r = setDokumenStatus(r, r.pertemuan[0].id, 'modul', 'pending');
    const check = canDeletePertemuan(r, r.pertemuan[0].id);
    expect(check.allowed).toBe(false);
  });

  it('removePertemuanById menormalisasi nomor tanpa memindahkan hasil', () => {
    let r = buildTwoMeetings();
    const [p1, p2] = r.pertemuan;
    r = applyDokumenResult(r, p2.id, 'materi', { judul_materi: 'M2', isi_materi: [] });
    const next = removePertemuanById(r, p1.id);
    expect(next.pertemuan).toHaveLength(1);
    expect(next.pertemuan[0].id).toBe(p2.id);
    expect(next.pertemuan[0].nomor).toBe(1);
    expect(next.pertemuan[0].dokumen.materi).toBeDefined();
  });
});
