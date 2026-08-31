/**
 * Adapter Legacy ↔ V2 untuk arsitektur "Dokumen per Pertemuan".
 *
 * Semua fungsi di file ini adalah PURE. Tidak menyentuh state global, tidak
 * memanggil `crypto.randomUUID()` (agar deterministik), dan tidak memutasi
 * input.
 *
 * File ini bagian dari Fase 1 dan belum dipakai oleh flow produksi selama
 * feature flag `ENABLE_PERTEMUAN_DOCS_V2` masih false.
 */

import type {
  AsesmenData,
  BankSoalData,
  DokumenNonModul,
  FormData,
  GeneratedSteps,
  GenerationResultV2,
  LKPDData,
  MateriData,
  ModulPertemuanV2,
  PertemuanData,
  PertemuanDataDetail,
  PertemuanResult,
  PilihanDokumenPertemuan,
  TindakLanjutData,
} from '@/types/modul';

// ---------------------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------------------

export const DEFAULT_DURASI_MENIT = 90;
export const MENIT_PER_JP_DEFAULT = 45;

// ---------------------------------------------------------------------------
// Normalisasi durasi
// ---------------------------------------------------------------------------

export const normalizeDurasiMenit = (
  value: string | number | undefined | null,
): number => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value !== 'string') return DEFAULT_DURASI_MENIT;

  const raw = value.trim().toLowerCase();
  if (!raw) return DEFAULT_DURASI_MENIT;

  const multMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/);
  if (multMatch) {
    const a = parseFloat(multMatch[1].replace(',', '.'));
    const b = parseFloat(multMatch[2].replace(',', '.'));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
      return Math.round(a * b);
    }
  }

  const jpMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*jp\b/);
  if (jpMatch) {
    const n = parseFloat(jpMatch[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) {
      return Math.round(n * MENIT_PER_JP_DEFAULT);
    }
  }

  const minMatch = raw.match(/^(\d+(?:[.,]\d+)?)(?:\s*(?:menit|min|m))?$/);
  if (minMatch) {
    const n = parseFloat(minMatch[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }

  return DEFAULT_DURASI_MENIT;
};

// ---------------------------------------------------------------------------
// ID stabil
// ---------------------------------------------------------------------------

const hash32 = (s: string): string => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};

export const getStablePertemuanId = (input: {
  existingId?: string;
  seed: string;
  nomor: number;
}): string => {
  const { existingId, seed, nomor } = input;
  if (existingId && existingId.trim()) return existingId;
  const h = hash32(`${seed}::${nomor}`);
  return `pertemuan-${nomor}-${h}`;
};

// ---------------------------------------------------------------------------
// Type guards Modul
// ---------------------------------------------------------------------------

/** Bentuk baru — punya tahap_awal. */
export const isPertemuanDetail = (p: unknown): p is PertemuanDataDetail =>
  !!p &&
  typeof p === 'object' &&
  'tahap_awal' in (p as Record<string, unknown>);

/** Bentuk legacy — punya pembukaan/inti/penutup array tanpa tahap_awal. */
export const isPertemuanLegacy = (p: unknown): p is PertemuanData =>
  !!p &&
  typeof p === 'object' &&
  !('tahap_awal' in (p as Record<string, unknown>)) &&
  'pembukaan' in (p as Record<string, unknown>);

// ---------------------------------------------------------------------------
// Pilihan dokumen
// ---------------------------------------------------------------------------

/** Default untuk pertemuan BARU di flow V2 (Soal FALSE — butuh konfigurasi manual). */
export const defaultPilihanDokumen = (): PilihanDokumenPertemuan => ({
  modul: true,
  lkpd: true,
  asesmen: true,
  soal: true,    // Generate soal secara default karena sudah memiliki fallback soalConfig
  materi: true,
  refleksi: true,
});


/**
 * Pilihan untuk hasil konversi dari legacy: dokumen non-Modul di skema lama
 * disimpan sebagai dokumen global — bukan per-pertemuan — jadi checkbox non-
 * Modul WAJIB false agar UI V2 nanti tidak salah menampilkan bahwa tiap
 * pertemuan sudah punya LKPD/Asesmen/dll. sendiri.
 */
export const legacyPilihanDokumen = (): PilihanDokumenPertemuan => ({
  modul: true,
  lkpd: false,
  asesmen: false,
  soal: false,
  materi: false,
  refleksi: false,
});

// ---------------------------------------------------------------------------
// Legacy → V2
// ---------------------------------------------------------------------------

export interface LegacyGenerationState {
  formData: FormData;
  generatedSteps: GeneratedSteps | null;
  lkpdData: LKPDData | null;
  asesmenData: AsesmenData | null;
  materiData: MateriData | null;
  tindakLanjutData: TindakLanjutData | null;
  bankSoalData: BankSoalData | null;
}

const buildDokumenGlobalFromLegacy = (
  legacy: LegacyGenerationState,
): DokumenNonModul | undefined => {
  const out: DokumenNonModul = {};
  if (legacy.lkpdData) out.lkpd = legacy.lkpdData;
  if (legacy.asesmenData) out.asesmen = legacy.asesmenData;
  if (legacy.bankSoalData) out.soal = legacy.bankSoalData;
  if (legacy.materiData) out.materi = legacy.materiData;
  if (legacy.tindakLanjutData) out.refleksi = legacy.tindakLanjutData;
  return Object.keys(out).length > 0 ? out : undefined;
};

/** Cari pertemuan di formData yang cocok dengan Modul yang sudah dihasilkan.
 *  Prioritas: nomorPertemuan. Fallback: posisi/index. */
const findFormPertemuan = (
  formPertemuan: FormData['pertemuan'] | undefined,
  nomor: number,
  idx: number,
) => {
  if (!formPertemuan || formPertemuan.length === 0) return undefined;
  const byNomor = formPertemuan.find((fp) => fp?.nomorPertemuan === nomor);
  if (byNomor) return byNomor;
  return formPertemuan[idx];
};

export const fromLegacy = (
  legacy: LegacyGenerationState,
  options: { seed: string },
): GenerationResultV2 => {
  const { seed } = options;
  const pertemuanList: PertemuanResult[] = [];

  const modulPertemuan = legacy.generatedSteps?.pertemuan ?? [];

  if (modulPertemuan.length > 0) {
    modulPertemuan.forEach((p, idx) => {
      const nomor = p?.nomorPertemuan ?? idx + 1;
      const durasiRaw = p?.durasi;
      const matched = findFormPertemuan(
        legacy.formData?.pertemuan,
        nomor,
        idx,
      );
      const id = getStablePertemuanId({
        existingId: matched?.id,
        seed,
        nomor,
      });

      // Simpan Modul apa adanya — detail atau legacy — tanpa transformasi.
      let modul: ModulPertemuanV2 | undefined;
      if (isPertemuanDetail(p)) modul = p;
      else if (isPertemuanLegacy(p)) modul = p as PertemuanData;

      pertemuanList.push({
        id,
        nomor,
        durasiMenit: normalizeDurasiMenit(durasiRaw),
        durasiLabel: typeof durasiRaw === 'string' ? durasiRaw : undefined,
        pilihanDokumen: legacyPilihanDokumen(),
        dokumen: modul ? { modul } : {},
        status: modul ? { modul: 'ok' } : { modul: 'idle' },
      });
    });
  } else if (legacy.formData?.pertemuan?.length) {
    legacy.formData.pertemuan.forEach((p, idx) => {
      const nomor = p?.nomorPertemuan ?? idx + 1;
      pertemuanList.push({
        id: getStablePertemuanId({
          existingId: p?.id,
          seed,
          nomor,
        }),
        nomor,
        durasiMenit: normalizeDurasiMenit(p?.durasi),
        durasiLabel: p?.durasi,
        pilihanDokumen: legacyPilihanDokumen(),
        dokumen: {},
        status: { modul: 'idle' },
      });
    });
  } else {
    pertemuanList.push({
      id: getStablePertemuanId({ seed, nomor: 1 }),
      nomor: 1,
      durasiMenit: DEFAULT_DURASI_MENIT,
      pilihanDokumen: legacyPilihanDokumen(),
      dokumen: {},
      status: { modul: 'idle' },
    });
  }

  const dokumenGlobal = buildDokumenGlobalFromLegacy(legacy);

  const result: GenerationResultV2 = {
    version: 2,
    pertemuan: pertemuanList,
  };
  if (dokumenGlobal) result.dokumenGlobal = dokumenGlobal;

  // Preserve pemahaman_bermakna ke modulPreface (hanya jika generatedSteps ada).
  const pb = legacy.generatedSteps?.pemahaman_bermakna;
  if (legacy.generatedSteps && typeof pb === 'string' && pb.length > 0) {
    result.modulPreface = { pemahaman_bermakna: pb };
  }

  return result;
};

// ---------------------------------------------------------------------------
// V2 → Legacy (lossless-aware)
// ---------------------------------------------------------------------------

export type LegacyConversionResult =
  | {
      ok: true;
      lossless: true;
      state: LegacyGenerationState;
      warnings: [];
    }
  | {
      ok: false;
      lossless: false;
      state: null;
      warnings: string[];
    };

const NON_MODUL_KEYS = [
  'lkpd',
  'asesmen',
  'soal',
  'materi',
  'refleksi',
] as const;

export const toLegacy = (
  result: GenerationResultV2,
  baseFormData: FormData,
): LegacyConversionResult => {
  const warnings: string[] = [];

  // Deteksi dokumen non-Modul per-pertemuan (tidak dapat direpresentasikan).
  const perPertemuanNonModul = new Set<string>();
  for (const p of result.pertemuan) {
    for (const key of NON_MODUL_KEYS) {
      if (p.dokumen[key] !== undefined) perPertemuanNonModul.add(key);
    }
  }
  if (perPertemuanNonModul.size > 0) {
    warnings.push(
      `Dokumen per-pertemuan tidak dapat dikonversi ke legacy: ${Array.from(
        perPertemuanNonModul,
      )
        .sort()
        .join(', ')}. Legacy state hanya mendukung dokumen non-Modul global.`,
    );
  }

  if (result.dokumenSubmateri && Object.keys(result.dokumenSubmateri).length > 0) {
    warnings.push(
      'dokumenSubmateri tidak dapat direpresentasikan dalam legacy state (tidak ada konsep submateri di skema lama).',
    );
  }

  // Kumpulkan Modul apa adanya (baik detail maupun legacy).
  const moduls: ModulPertemuanV2[] = [];
  for (const p of result.pertemuan) {
    if (p.dokumen.modul) moduls.push(p.dokumen.modul);
  }

  const allDetail = moduls.length > 0 && moduls.every((m) => isPertemuanDetail(m));
  const allLegacy = moduls.length > 0 && moduls.every((m) => isPertemuanLegacy(m));
  const isMixed = moduls.length > 0 && !allDetail && !allLegacy;

  if (isMixed) {
    warnings.push(
      'Modul berisi campuran bentuk legacy (pembukaan/inti/penutup) dan detail (tahap_awal/inti/penutup). Legacy state hanya mendukung satu bentuk seragam.',
    );
  }

  if (warnings.length > 0) {
    return { ok: false, lossless: false, state: null, warnings };
  }

  // Type-safe berdasarkan bentuk seragam.
  let generatedSteps: GeneratedSteps | null = null;
  if (moduls.length > 0) {
    const pertemuanArr = allDetail
      ? (moduls as PertemuanDataDetail[])
      : (moduls as PertemuanData[]);
    generatedSteps = {
      pemahaman_bermakna: result.modulPreface?.pemahaman_bermakna ?? '',
      // Union type di GeneratedSteps: `PertemuanData[] | PertemuanDataDetail[]`
      pertemuan: pertemuanArr as GeneratedSteps['pertemuan'],
    };
  }

  const global = result.dokumenGlobal ?? {};

  const state: LegacyGenerationState = {
    formData: baseFormData,
    generatedSteps,
    lkpdData: global.lkpd ?? null,
    asesmenData: global.asesmen ?? null,
    materiData: global.materi ?? null,
    tindakLanjutData: global.refleksi ?? null,
    bankSoalData: global.soal ?? null,
  };

  return { ok: true, lossless: true, state, warnings: [] };
};
