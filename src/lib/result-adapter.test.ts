import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DURASI_MENIT,
  MENIT_PER_JP_DEFAULT,
  fromLegacy,
  getStablePertemuanId,
  normalizeDurasiMenit,
  toLegacy,
  type LegacyGenerationState,
} from './result-adapter';
import type {
  AsesmenData,
  BankSoalData,
  FormData,
  GeneratedSteps,
  GenerationResultV2,
  LKPDData,
  MateriData,
  PertemuanData,
  PertemuanDataDetail,
  TindakLanjutData,
} from '@/types/modul';

// ---------- Fixtures --------------------------------------------------------

const makeFormData = (
  overrides: Partial<FormData> = {},
): FormData =>
  ({
    kurikulum: 'merdeka',
    namaPenyusun: '',
    nipPenyusun: '',
    sekolah: '',
    kepalaSekolah: '',
    nipKepalaSekolah: '',
    mataPelajaran: '',
    materi: '',
    subMateri: '',
    fase: '',
    kelas: '',
    semester: '',
    pertemuan: [],
    aspekPengetahuanAwal: '',
    aspekMinat: '',
    aspekLatarBelakang: '',
    aspekKebutuhanBelajar: '',
    materiPengetahuan: {
      faktual: '',
      konseptual: '',
      prosedural: '',
      metakognitif: '',
    },
    kaitanKehidupan: '',
    nilaiKarakter: [],
    dimensiProfilLulusan: [],
    capaianPembelajaran: '',
    lintasDisiplinIlmu: {
      ppkn: '',
      ips: '',
      matematika: '',
      bahasaIndonesia: '',
      seniBudaya: '',
      prakarya: '',
      penjaskes: '',
    },
    tujuanPembelajaran: '',
    modelPembelajaran: '',
    metodePembelajaran: [],
    kemitraanPembelajaran: {
      guruBidangStudiLain: '',
      orangTua: '',
      tokohMasyarakat: '',
      instansiTerkait: '',
      duniaUsaha: '',
      perguruanTinggiLSM: '',
      mgmpKomunitasBelajar: '',
    },
    lingkunganPembelajaranDetail: {
      ruangFisik: '',
      ruangVirtual: '',
      budayaBelajar: '',
    },
    pemanfaatanDigitalDetail: { perencanaan: '', pelaksanaan: '', asesmen: '' },
    topikPancaCinta: [],
    materiIntegrasiKBC: '',
    kesiapanSiswa: '',
    karakteristikMateri: '',
    profilLulusan: [],
    lintasDisiplin: '',
    kemitraan: '',
    lingkunganBelajar: [],
    pemanfaatanDigital: '',
    ...overrides,
  }) as FormData;

const makeModulDetail = (nomor: number): PertemuanDataDetail =>
  ({
    nomorPertemuan: nomor,
    durasi: '2 x 45 menit',
    tahap_awal: {
      judul: `Awal P${nomor}`,
      prinsip_utama: '',
      durasi_total: '15 menit',
      kegiatan: [],
    },
    tahap_inti: {
      judul: `Inti P${nomor}`,
      prinsip_utama: '',
      durasi_total: '60 menit',
      kegiatan: [],
    },
    tahap_penutup: {
      judul: `Penutup P${nomor}`,
      prinsip_utama: '',
      durasi_total: '15 menit',
      kegiatan: [],
    },
  }) as PertemuanDataDetail;

const emptyLegacy = (fd: FormData): LegacyGenerationState => ({
  formData: fd,
  generatedSteps: null,
  lkpdData: null,
  asesmenData: null,
  materiData: null,
  tindakLanjutData: null,
  bankSoalData: null,
});

const dummyLKPD: LKPDData = {
  judul_lkpd: 'LKPD',
  petunjuk_belajar: [],
  informasi_pendukung: '',
  pertanyaan_pemantik: '',
  masalah_kontekstual: '',
  aktivitas_utama: [],
  refleksi: { diri: [], sejawat: [] },
};
const dummyAsesmen = {} as AsesmenData;
const dummyMateri = { judul_materi: 'M' } as MateriData;
const dummyRefleksi = {
  refleksi_guru: [],
  refleksi_siswa: [],
  remedial: '',
  pengayaan: '',
} as TindakLanjutData;
const dummySoal = { judul_latihan: 'S', daftar_soal: [] } as unknown as BankSoalData;

// ---------- normalizeDurasiMenit -------------------------------------------

describe('normalizeDurasiMenit', () => {
  it('menerima angka murni', () => {
    expect(normalizeDurasiMenit(90)).toBe(90);
  });
  it('menerima string "90"', () => {
    expect(normalizeDurasiMenit('90')).toBe(90);
  });
  it('menerima "90 menit"', () => {
    expect(normalizeDurasiMenit('90 menit')).toBe(90);
  });
  it('menerima "2 x 45 menit"', () => {
    expect(normalizeDurasiMenit('2 x 45 menit')).toBe(90);
  });
  it('menerima "2 × 45 menit" (unicode ×)', () => {
    expect(normalizeDurasiMenit('2 × 45 menit')).toBe(90);
  });
  it('menerima "3 JP" dengan fallback JP', () => {
    expect(normalizeDurasiMenit('3 JP')).toBe(3 * MENIT_PER_JP_DEFAULT);
  });
  it('fallback aman untuk input invalid', () => {
    expect(normalizeDurasiMenit('lorem ipsum')).toBe(DEFAULT_DURASI_MENIT);
    expect(normalizeDurasiMenit('')).toBe(DEFAULT_DURASI_MENIT);
    expect(normalizeDurasiMenit(undefined)).toBe(DEFAULT_DURASI_MENIT);
    expect(normalizeDurasiMenit(NaN as unknown as number)).toBe(DEFAULT_DURASI_MENIT);
    expect(normalizeDurasiMenit(-5)).toBe(DEFAULT_DURASI_MENIT);
  });
});

// ---------- getStablePertemuanId -------------------------------------------

describe('getStablePertemuanId', () => {
  it('deterministik untuk input yang sama', () => {
    const a = getStablePertemuanId({ seed: 'bab-1', nomor: 1 });
    const b = getStablePertemuanId({ seed: 'bab-1', nomor: 1 });
    expect(a).toBe(b);
  });
  it('nomor berbeda menghasilkan ID berbeda', () => {
    const a = getStablePertemuanId({ seed: 'bab-1', nomor: 1 });
    const b = getStablePertemuanId({ seed: 'bab-1', nomor: 2 });
    expect(a).not.toBe(b);
  });
  it('existingId dipertahankan', () => {
    const id = getStablePertemuanId({
      existingId: 'kept-123',
      seed: 'bab-1',
      nomor: 1,
    });
    expect(id).toBe('kept-123');
  });
  it('tidak berbentuk meeting-${index}', () => {
    const id = getStablePertemuanId({ seed: 'bab-1', nomor: 1 });
    expect(id).not.toMatch(/^meeting-\d+$/);
  });
});

// ---------- fromLegacy ------------------------------------------------------

describe('fromLegacy', () => {
  it('satu pertemuan: Modul masuk P1, dokumen lain masuk dokumenGlobal', () => {
    const fd = makeFormData();
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(fd),
      generatedSteps: {
        pemahaman_bermakna: 'PB',
        pertemuan: [makeModulDetail(1)],
      } as GeneratedSteps,
      lkpdData: dummyLKPD,
      asesmenData: dummyAsesmen,
      materiData: dummyMateri,
      tindakLanjutData: dummyRefleksi,
      bankSoalData: dummySoal,
    };
    const v2 = fromLegacy(legacy, { seed: 'hist-1' });
    expect(v2.version).toBe(2);
    expect(v2.pertemuan).toHaveLength(1);
    expect(v2.pertemuan[0].dokumen.modul).toBeDefined();
    expect(v2.pertemuan[0].dokumen.lkpd).toBeUndefined();
    expect(v2.pertemuan[0].durasiMenit).toBe(90);
    expect(v2.dokumenGlobal?.lkpd).toBe(dummyLKPD);
    expect(v2.dokumenGlobal?.asesmen).toBe(dummyAsesmen);
    expect(v2.dokumenGlobal?.materi).toBe(dummyMateri);
    expect(v2.dokumenGlobal?.refleksi).toBe(dummyRefleksi);
    expect(v2.dokumenGlobal?.soal).toBe(dummySoal);
  });

  it('dua pertemuan: dua PertemuanResult, Modul P1 & P2 tetap terpisah, global tidak nempel ke P1', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(makeFormData()),
      generatedSteps: {
        pemahaman_bermakna: '',
        pertemuan: [makeModulDetail(1), makeModulDetail(2)],
      } as GeneratedSteps,
      lkpdData: dummyLKPD,
    };
    const v2 = fromLegacy(legacy, { seed: 'hist-2' });
    expect(v2.pertemuan).toHaveLength(2);
    expect(v2.pertemuan[0].dokumen.modul?.nomorPertemuan).toBe(1);
    expect(v2.pertemuan[1].dokumen.modul?.nomorPertemuan).toBe(2);
    expect(v2.pertemuan[0].dokumen.lkpd).toBeUndefined();
    expect(v2.pertemuan[1].dokumen.lkpd).toBeUndefined();
    expect(v2.dokumenGlobal?.lkpd).toBe(dummyLKPD);
    expect(v2.pertemuan[0].id).not.toBe(v2.pertemuan[1].id);
  });

  it('tanpa Modul, tapi formData.pertemuan ada → skeleton pertemuan', () => {
    const fd = makeFormData({
      pertemuan: [
        { nomorPertemuan: 1, durasi: '2 x 45 menit' },
        { nomorPertemuan: 2, durasi: '90 menit' },
      ],
    });
    const v2 = fromLegacy(emptyLegacy(fd), { seed: 's' });
    expect(v2.pertemuan).toHaveLength(2);
    expect(v2.pertemuan[0].dokumen.modul).toBeUndefined();
    expect(v2.pertemuan[0].durasiMenit).toBe(90);
    expect(v2.pertemuan[1].durasiMenit).toBe(90);
    expect(v2.pertemuan[0].status.modul).toBe('idle');
  });

  it('keduanya kosong → fallback 1 pertemuan', () => {
    const v2 = fromLegacy(emptyLegacy(makeFormData()), { seed: 's' });
    expect(v2.pertemuan).toHaveLength(1);
    expect(v2.pertemuan[0].nomor).toBe(1);
    expect(v2.pertemuan[0].durasiMenit).toBe(DEFAULT_DURASI_MENIT);
    expect(v2.dokumenGlobal).toBeUndefined();
  });

  it('tidak memutasi input', () => {
    const fd = makeFormData({
      pertemuan: [{ nomorPertemuan: 1, durasi: '2 x 45 menit' }],
    });
    const legacy = emptyLegacy(fd);
    const snapshot = JSON.stringify(legacy);
    fromLegacy(legacy, { seed: 's' });
    expect(JSON.stringify(legacy)).toBe(snapshot);
  });
});

// ---------- toLegacy --------------------------------------------------------

describe('toLegacy', () => {
  const fd = makeFormData();

  it('satu pertemuan dengan dokumen global → lossless, round-trip', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(fd),
      generatedSteps: {
        pemahaman_bermakna: '',
        pertemuan: [makeModulDetail(1)],
      } as GeneratedSteps,
      lkpdData: dummyLKPD,
      bankSoalData: dummySoal,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(true);
    expect(back.lossless).toBe(true);
    if (!back.ok) throw new Error('unreachable');
    expect(back.state.lkpdData).toBe(dummyLKPD);
    expect(back.state.bankSoalData).toBe(dummySoal);
    expect(back.state.generatedSteps?.pertemuan).toHaveLength(1);
  });

  it('multi-pertemuan Modul-only → lossless, semua Modul tersedia', () => {
    const v2: GenerationResultV2 = {
      version: 2,
      pertemuan: [
        {
          id: 'a',
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
          dokumen: { modul: makeModulDetail(1) },
          status: { modul: 'ok' },
        },
        {
          id: 'b',
          nomor: 2,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true,
            lkpd: false,
            asesmen: false,
            soal: false,
            materi: false,
            refleksi: false,
          },
          dokumen: { modul: makeModulDetail(2) },
          status: { modul: 'ok' },
        },
      ],
    };
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(true);
    if (!back.ok) throw new Error('unreachable');
    expect(back.state.generatedSteps?.pertemuan).toHaveLength(2);
  });

  it('multi-pertemuan dengan LKPD berbeda → lossy, warning menyebut lkpd, state null', () => {
    const v2: GenerationResultV2 = {
      version: 2,
      pertemuan: [
        {
          id: 'a',
          nomor: 1,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true,
            lkpd: true,
            asesmen: false,
            soal: false,
            materi: false,
            refleksi: false,
          },
          dokumen: { modul: makeModulDetail(1), lkpd: dummyLKPD },
          status: {},
        },
        {
          id: 'b',
          nomor: 2,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true,
            lkpd: true,
            asesmen: false,
            soal: false,
            materi: false,
            refleksi: false,
          },
          dokumen: { modul: makeModulDetail(2), lkpd: dummyLKPD },
          status: {},
        },
      ],
    };
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(false);
    expect(back.lossless).toBe(false);
    expect(back.state).toBeNull();
    expect(back.warnings.join(' ')).toMatch(/lkpd/);
  });

  it('dokumenSubmateri → lossy dengan warning yang menyebutkan', () => {
    const v2: GenerationResultV2 = {
      version: 2,
      pertemuan: [
        {
          id: 'a',
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
          dokumen: { modul: makeModulDetail(1) },
          status: {},
        },
      ],
      dokumenSubmateri: {
        sub1: { materi: dummyMateri },
      },
    };
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(false);
    expect(back.warnings.join(' ')).toMatch(/dokumenSubmateri/);
  });
});

// ---------- Fase 1 fix tests -----------------------------------------------

const makeModulLegacy = (nomor: number): PertemuanData =>
  ({
    nomorPertemuan: nomor,
    durasi: '2 x 45 menit',
    pembukaan: [{ kegiatan: `pemb-${nomor}`, durasi: '15', prinsip: 'Berkesadaran' }],
    inti: [{ kegiatan: `inti-${nomor}`, durasi: '60', prinsip: 'Bermakna' }],
    penutup: [{ kegiatan: `pen-${nomor}`, durasi: '15', prinsip: 'Menggembirakan' }],
  }) as PertemuanData;

describe('fromLegacy — perbaikan Fase 1', () => {
  it('Modul legacy (pembukaan/inti/penutup) tidak hilang', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(makeFormData()),
      generatedSteps: {
        pemahaman_bermakna: '',
        pertemuan: [makeModulLegacy(1)],
      } as GeneratedSteps,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    expect(v2.pertemuan).toHaveLength(1);
    const modul = v2.pertemuan[0].dokumen.modul as PertemuanData | undefined;
    expect(modul).toBeDefined();
    expect(modul?.pembukaan?.[0]?.kegiatan).toBe('pemb-1');
    expect(modul?.inti?.[0]?.kegiatan).toBe('inti-1');
    expect(modul?.penutup?.[0]?.kegiatan).toBe('pen-1');
  });

  it('pemahaman_bermakna non-kosong dipertahankan di modulPreface', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(makeFormData()),
      generatedSteps: {
        pemahaman_bermakna: 'Peserta didik memahami konsep pecahan.',
        pertemuan: [makeModulDetail(1)],
      } as GeneratedSteps,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    expect(v2.modulPreface?.pemahaman_bermakna).toBe(
      'Peserta didik memahami konsep pecahan.',
    );
  });

  it('pilihanDokumen hasil konversi legacy hanya modul=true', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(makeFormData()),
      generatedSteps: {
        pemahaman_bermakna: '',
        pertemuan: [makeModulDetail(1)],
      } as GeneratedSteps,
      lkpdData: dummyLKPD,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    const pil = v2.pertemuan[0].pilihanDokumen;
    expect(pil.modul).toBe(true);
    expect(pil.lkpd).toBe(false);
    expect(pil.asesmen).toBe(false);
    expect(pil.soal).toBe(false);
    expect(pil.materi).toBe(false);
    expect(pil.refleksi).toBe(false);
  });

  it('existingId pada formData.pertemuan dipertahankan saat Modul sudah ada', () => {
    const fd = makeFormData({
      pertemuan: [
        { id: 'existing-p1', nomorPertemuan: 1, durasi: '2 x 45 menit' },
        { id: 'existing-p2', nomorPertemuan: 2, durasi: '2 x 45 menit' },
      ],
    });
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(fd),
      generatedSteps: {
        pemahaman_bermakna: '',
        pertemuan: [makeModulDetail(1), makeModulDetail(2)],
      } as GeneratedSteps,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    expect(v2.pertemuan[0].id).toBe('existing-p1');
    expect(v2.pertemuan[1].id).toBe('existing-p2');
  });
});

describe('toLegacy — perbaikan Fase 1', () => {
  const fd = makeFormData();

  it('round-trip Modul legacy (PertemuanData[]) tetap utuh', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(fd),
      generatedSteps: {
        pemahaman_bermakna: 'PB legacy',
        pertemuan: [makeModulLegacy(1), makeModulLegacy(2)],
      } as GeneratedSteps,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(true);
    if (!back.ok) throw new Error('unreachable');
    expect(back.state.generatedSteps?.pertemuan).toHaveLength(2);
    const p0 = back.state.generatedSteps?.pertemuan?.[0] as PertemuanData;
    expect(p0.pembukaan?.[0]?.kegiatan).toBe('pemb-1');
    expect(back.state.generatedSteps?.pemahaman_bermakna).toBe('PB legacy');
  });

  it('round-trip Modul detail (PertemuanDataDetail[]) tetap utuh', () => {
    const legacy: LegacyGenerationState = {
      ...emptyLegacy(fd),
      generatedSteps: {
        pemahaman_bermakna: 'PB detail',
        pertemuan: [makeModulDetail(1), makeModulDetail(2)],
      } as GeneratedSteps,
    };
    const v2 = fromLegacy(legacy, { seed: 's' });
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(true);
    if (!back.ok) throw new Error('unreachable');
    const p0 = back.state.generatedSteps?.pertemuan?.[0] as PertemuanDataDetail;
    expect(p0.tahap_awal?.judul).toBe('Awal P1');
    expect(back.state.generatedSteps?.pemahaman_bermakna).toBe('PB detail');
  });

  it('format Modul campuran → lossy warning', () => {
    const v2: GenerationResultV2 = {
      version: 2,
      pertemuan: [
        {
          id: 'a',
          nomor: 1,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true, lkpd: false, asesmen: false,
            soal: false, materi: false, refleksi: false,
          },
          dokumen: { modul: makeModulDetail(1) },
          status: {},
        },
        {
          id: 'b',
          nomor: 2,
          durasiMenit: 90,
          pilihanDokumen: {
            modul: true, lkpd: false, asesmen: false,
            soal: false, materi: false, refleksi: false,
          },
          dokumen: { modul: makeModulLegacy(2) },
          status: {},
        },
      ],
    };
    const back = toLegacy(v2, fd);
    expect(back.ok).toBe(false);
    expect(back.warnings.join(' ')).toMatch(/campuran/i);
  });
});

