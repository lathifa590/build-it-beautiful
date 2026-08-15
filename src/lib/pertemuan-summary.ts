// Builder ringkasan pertemuan untuk context-passing antar pertemuan
// (mode hierarki). Pure functions, aman dipakai client-side.

import type {
  PertemuanDataDetail,
  PertemuanSummary,
  TindakLanjutData,
} from '@/types/modul';

/** Potong string ke n karakter, akhiri kata utuh. */
const truncate = (s: string, n = 140): string => {
  if (!s) return '';
  const clean = s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= n) return clean;
  const cut = clean.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…';
};

/** Ambil judul-judul sub_kegiatan dari sebuah tahap. */
const extractTopikDari = (tahap: any): string[] => {
  if (!tahap?.kegiatan) return [];
  const out: string[] = [];
  for (const keg of tahap.kegiatan) {
    if (keg?.sub_kegiatan) {
      for (const sk of keg.sub_kegiatan) {
        if (sk?.judul) out.push(sk.judul);
      }
    }
  }
  // Cek fase_pembelajaran untuk tahap inti (MEMAHAMI/MENGAPLIKASI/MEREFLEKSI)
  if (tahap?.fase_pembelajaran) {
    for (const fase of tahap.fase_pembelajaran) {
      if (fase?.sintaks) {
        for (const sin of fase.sintaks) {
          if (sin?.sub_kegiatan) {
            for (const sk of sin.sub_kegiatan) {
              if (sk?.judul) out.push(sk.judul);
            }
          }
        }
      }
    }
  }
  return out;
};

/** Ambil kalimat penutup dari tahap penutup. */
const extractPenutup = (modul: PertemuanDataDetail): string => {
  const penutup = modul.tahap_penutup;
  if (!penutup?.kegiatan?.length) return '';
  const lastKeg = penutup.kegiatan[penutup.kegiatan.length - 1];
  const subs = lastKeg?.sub_kegiatan;
  if (!subs?.length) return '';
  const lastSub = subs[subs.length - 1];
  const akt = lastSub?.aktivitas || lastSub?.aktivitas_siswa || lastSub?.aktivitas_guru || [];
  return akt.length ? truncate(akt[akt.length - 1], 120) : truncate(lastSub?.judul || '', 120);
};

/**
 * Bangun ringkasan satu pertemuan dari hasil modul + (opsional) refleksi.
 * Output dirancang ringkas (~150 token) supaya bisa dikirim sebagai konteks
 * untuk pertemuan berikutnya tanpa membengkakkan prompt.
 */
export const buildPertemuanSummary = (
  modul: PertemuanDataDetail,
  opts: {
    pertemuanId: string;
    submateriJudul: string;
    tujuanPembelajaran?: string;
    refleksi?: TindakLanjutData;
  }
): PertemuanSummary => {
  const topikSet = new Set<string>([
    ...extractTopikDari(modul.tahap_awal),
    ...extractTopikDari(modul.tahap_inti),
  ]);
  const topikDibahas = Array.from(topikSet).slice(0, 3).map((t) => truncate(t, 80));

  // TP: ambil dari prop atau fallback ke prinsip_utama
  const tpDicapai = opts.tujuanPembelajaran
    ? opts.tujuanPembelajaran
        .split(/[\.\n;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8)
        .slice(0, 3)
        .map((t) => truncate(t, 120))
    : [];

  const poinPenutup =
    extractPenutup(modul) ||
    (opts.refleksi?.refleksi_siswa?.[0]
      ? truncate(opts.refleksi.refleksi_siswa[0], 120)
      : '');

  return {
    pertemuanId: opts.pertemuanId,
    nomor: modul.nomorPertemuan,
    submateriJudul: opts.submateriJudul,
    tpDicapai,
    topikDibahas,
    poinPenutup,
  };
};

/**
 * Serialisasi daftar PertemuanSummary jadi string konteks untuk dikirim
 * ke edge function sebagai `previousSummary`.
 * Token-guard: kalau >5 pertemuan, hanya kirim 3 terakhir + ringkas yang lebih lama.
 */
export const serializeSummaries = (summaries: PertemuanSummary[]): string => {
  if (!summaries.length) return '';

  const sorted = [...summaries].sort((a, b) => a.nomor - b.nomor);
  const recent = sorted.length > 5 ? sorted.slice(-3) : sorted;
  const older = sorted.length > 5 ? sorted.slice(0, -3) : [];

  const fmt = (s: PertemuanSummary): string =>
    `- Pertemuan ${s.nomor} (${s.submateriJudul})` +
    (s.tpDicapai.length ? `\n  TP: ${s.tpDicapai.join('; ')}` : '') +
    (s.topikDibahas.length ? `\n  Topik: ${s.topikDibahas.join('; ')}` : '') +
    (s.poinPenutup ? `\n  Ditutup dengan: ${s.poinPenutup}` : '');

  let out = recent.map(fmt).join('\n');
  if (older.length) {
    const olderTopik = older.flatMap((s) => s.topikDibahas).slice(0, 8);
    out =
      `Pertemuan 1–${older[older.length - 1].nomor} sudah membahas: ${olderTopik.join('; ')}.\n\n` +
      out;
  }
  return out;
};
