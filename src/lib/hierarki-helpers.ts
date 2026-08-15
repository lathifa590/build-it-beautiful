// Helpers untuk mode hierarki Bab → Submateri → Pertemuan.
// Pure functions, tidak menyentuh state global. Aman untuk diimpor di mana saja.

import type {
  BabInput,
  SubmateriInput,
  PertemuanHierarki,
  StrukturHierarki,
} from '@/types/modul';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

/** Buat 1 pertemuan kosong dengan durasi default 2×45 menit. */
export const createPertemuan = (nomor: number): PertemuanHierarki => ({
  id: uid(),
  nomor,
  durasi: '2 x 45 menit',
});

/** Buat submateri kosong dengan default 4 JP = 2 pertemuan. */
export const createSubmateri = (judul = ''): SubmateriInput => ({
  id: uid(),
  judul,
  alokasiJP: 4,
  pertemuan: [createPertemuan(1), createPertemuan(2)],
});

/** Buat Bab default dengan 1 submateri. */
export const createBab = (judul = ''): BabInput => {
  const sub = createSubmateri();
  return {
    id: uid(),
    judul,
    totalJP: sub.alokasiJP,
    submateri: [sub],
  };
};

/** Buat StrukturHierarki default. */
export const createDefaultStruktur = (): StrukturHierarki => ({
  bab: createBab(),
  toggleMateriPerPertemuan: true,
  toggleAsesmenPerPertemuan: true,
});

/** Hitung ulang totalJP dari sum submateri. */
export const recomputeTotalJP = (bab: BabInput): BabInput => ({
  ...bab,
  totalJP: bab.submateri.reduce((sum, s) => sum + (s.alokasiJP || 0), 0),
});

/** Total pertemuan dalam Bab. */
export const countPertemuan = (bab: BabInput): number =>
  bab.submateri.reduce((sum, s) => sum + s.pertemuan.length, 0);

export interface CreditEstimate {
  totalPertemuan: number;
  totalSubmateri: number;
  callsPreface: number;    // 1 panggilan preface Bab (identifikasi murid dll.)
  callsWajib: number;      // Modul + LKPD + Refleksi per pertemuan
  callsMateri: number;
  callsAsesmen: number;
  callsBankSoal: number;   // selalu 1 per Bab
  total: number;
  breakdown: string;
}

/**
 * Estimasi jumlah panggilan AI berdasarkan struktur + toggle.
 * Bank Soal selalu di level Bab (1 panggilan).
 * Preface Bab selalu 1 panggilan (isi identifikasi murid, jenis pengetahuan, dll.).
 */
export const estimateCredits = (s: StrukturHierarki): CreditEstimate => {
  const totalPertemuan = countPertemuan(s.bab);
  const totalSubmateri = s.bab.submateri.length;
  const callsPreface = 1;
  const callsWajib = totalPertemuan * 3; // Modul, LKPD, Refleksi
  const callsMateri = s.toggleMateriPerPertemuan ? totalPertemuan : totalSubmateri;
  const callsAsesmen = s.toggleAsesmenPerPertemuan ? totalPertemuan : totalSubmateri;
  const callsBankSoal = 1;
  const total = callsPreface + callsWajib + callsMateri + callsAsesmen + callsBankSoal;

  const breakdown =
    `Preface Bab = 1` +
    ` · ${totalPertemuan} pertemuan × 3 (Modul+LKPD+Refleksi) = ${callsWajib}` +
    ` · Materi ${s.toggleMateriPerPertemuan ? `per-pertemuan = ${callsMateri}` : `per-submateri = ${callsMateri}`}` +
    ` · Asesmen ${s.toggleAsesmenPerPertemuan ? `per-pertemuan = ${callsAsesmen}` : `per-submateri = ${callsAsesmen}`}` +
    ` · Bank Soal Bab = 1` +
    ` → total ${total} panggilan`;

  return {
    totalPertemuan,
    totalSubmateri,
    callsPreface,
    callsWajib,
    callsMateri,
    callsAsesmen,
    callsBankSoal,
    total,
    breakdown,
  };
};

/** Re-number pertemuan dalam submateri (1..n). */
export const renumberPertemuan = (sub: SubmateriInput): SubmateriInput => ({
  ...sub,
  pertemuan: sub.pertemuan.map((p, i) => ({ ...p, nomor: i + 1 })),
});
