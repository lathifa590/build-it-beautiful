/**
 * FASE 4A — Persistensi History V2 (versioned & lossless).
 *
 * Berisi:
 * - serializer `GenerationResultV2` → JSON DB (tanpa status `pending`),
 * - validator/parser runtime JSON DB → `GenerationResultV2` (tanpa type
 *   assertion buta),
 * - ringkasan konten untuk UI (jumlah pertemuan & dokumen berhasil per jenis).
 *
 * Tidak memakai `toLegacy` sama sekali: kolom legacy tidak diisi hasil konversi.
 */

import type {
  GenerationResultV2,
  JenisDokumenPertemuan,
  PertemuanResult,
  PilihanDokumenPertemuan,
  StatusGenerateDokumen,
} from '@/types/modul';
import {
  JENIS_DOKUMEN_ORDER,
  validateDokumenShape,
} from '@/lib/pertemuan-generation';

export const CONTENT_SCHEMA_VERSION_LEGACY = 1;
export const CONTENT_SCHEMA_VERSION_V2 = 2;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const STATUS_VALUES: StatusGenerateDokumen[] = ['idle', 'pending', 'ok', 'error'];

/** Status yang layak dipersistenkan: `pending` bukan hasil final. */
const persistableStatus = (s: StatusGenerateDokumen): StatusGenerateDokumen =>
  s === 'pending' ? 'idle' : s;

// ---------------------------------------------------------------- serialize

const serializePertemuan = (p: PertemuanResult): PertemuanResult => {
  const status: Partial<Record<JenisDokumenPertemuan, StatusGenerateDokumen>> = {};
  for (const jenis of JENIS_DOKUMEN_ORDER) {
    const s = p.status?.[jenis];
    if (s) status[jenis] = persistableStatus(s);
  }
  const out: PertemuanResult = {
    id: p.id,
    nomor: p.nomor,
    durasiMenit: p.durasiMenit,
    ...(p.durasiLabel !== undefined ? { durasiLabel: p.durasiLabel } : {}),
    ...(p.submateriId !== undefined ? { submateriId: p.submateriId } : {}),
    ...(p.submateriJudul !== undefined ? { submateriJudul: p.submateriJudul } : {}),
    pilihanDokumen: { ...p.pilihanDokumen },
    dokumen: { ...p.dokumen },
    status,
  };
  if (p.errors && Object.keys(p.errors).length > 0) out.errors = { ...p.errors };
  return out;
};

/** Bentuk JSON yang disimpan ke kolom `generation_result_v2`. */
export const serializeGenerationResultV2 = (
  result: GenerationResultV2,
): GenerationResultV2 => ({
  version: 2,
  pertemuan: (result.pertemuan ?? []).map(serializePertemuan),
  ...(result.modulPreface ? { modulPreface: result.modulPreface } : {}),
  ...(result.dokumenGlobal ? { dokumenGlobal: result.dokumenGlobal } : {}),
  ...(result.dokumenSubmateri ? { dokumenSubmateri: result.dokumenSubmateri } : {}),
  ...(result.babId ? { babId: result.babId } : {}),
});

// ------------------------------------------------------------------- parse

/**
 * Bentuk dokumen di history divalidasi dengan aturan yang SAMA seperti response
 * AI (`validateDokumenShape`). Pengecualian tunggal: Modul bentuk legacy
 * (`pembukaan/inti/penutup`) tetap diterima karena history hasil hidrasi legacy
 * memang menyimpan bentuk tersebut — namun ketiganya WAJIB berbentuk objek atau
 * array. Nilai primitif seperti `{ pembukaan: 1, inti: 2, penutup: 3 }` ditolak.
 */
const isLegacyModulPart = (v: unknown): boolean =>
  Array.isArray(v) || (typeof v === 'object' && v !== null);

const validateHistoryDokumen = (
  jenis: JenisDokumenPertemuan,
  dokumen: unknown,
): ParseResult<true> => {
  if (!isObj(dokumen)) return { ok: false, reason: `dokumen ${jenis} bukan objek` };
  if (jenis === 'modul') {
    const hasLegacyKeys =
      dokumen.pembukaan !== undefined ||
      dokumen.inti !== undefined ||
      dokumen.penutup !== undefined;
    if (hasLegacyKeys) {
      const lengkap =
        isLegacyModulPart(dokumen.pembukaan) &&
        isLegacyModulPart(dokumen.inti) &&
        isLegacyModulPart(dokumen.penutup);
      if (lengkap) return { ok: true, value: true };
      return {
        ok: false,
        reason:
          'dokumen modul legacy tidak valid: pembukaan/inti/penutup harus objek atau array',
      };
    }
  }
  const shape = validateDokumenShape(jenis, dokumen);
  return shape.ok
    ? { ok: true, value: true }
    : { ok: false, reason: `dokumen ${jenis} tidak valid: ${shape.reason ?? ''}` };
};

/**
 * `pilihanDokumen` WAJIB ada dan berupa object valid pada schema version 2.
 * Tidak ada default diam-diam: field hilang = payload ditolak.
 */
const parsePilihan = (raw: unknown): ParseResult<PilihanDokumenPertemuan> => {
  if (!isObj(raw)) return { ok: false, reason: 'pilihanDokumen bukan objek' };
  const src = raw;
  for (const key of Object.keys(src)) {
    if (!(JENIS_DOKUMEN_ORDER as string[]).includes(key))
      return { ok: false, reason: `pilihanDokumen punya key tidak dikenal: ${key}` };
  }
  for (const jenis of JENIS_DOKUMEN_ORDER) {
    if (typeof src[jenis] !== 'boolean')
      return { ok: false, reason: `pilihanDokumen.${jenis} bukan boolean` };
  }
  return {
    ok: true,
    value: {
      modul: true,
      lkpd: src.lkpd === true,
      asesmen: src.asesmen === true,
      soal: src.soal === true,
      materi: src.materi === true,
      refleksi: src.refleksi === true,
    },
  };
};


const parseDokumenContainer = (
  raw: unknown,
  label: string,
  jenisAllowed: readonly JenisDokumenPertemuan[],
): ParseResult<Record<string, unknown>> => {
  if (!isObj(raw)) return { ok: false, reason: `${label} tidak valid` };
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;
    if (!(jenisAllowed as readonly string[]).includes(key))
      return { ok: false, reason: `${label} punya jenis tidak dikenal: ${key}` };
    const check = validateHistoryDokumen(key as JenisDokumenPertemuan, value);
    if (check.ok !== true) return { ok: false, reason: `${label}: ${check.reason}` };
    out[key] = value;
  }
  return { ok: true, value: out };
};

const parsePertemuan = (raw: unknown, index: number): ParseResult<PertemuanResult> => {
  if (!isObj(raw)) return { ok: false, reason: `pertemuan[${index}] bukan objek` };
  const id = raw.id;
  if (typeof id !== 'string' || id.trim() === '')
    return { ok: false, reason: `pertemuan[${index}] tidak punya id valid` };
  const nomor = raw.nomor;
  if (typeof nomor !== 'number' || !Number.isInteger(nomor) || nomor < 1)
    return { ok: false, reason: `pertemuan[${index}] nomor harus bilangan bulat positif` };
  const durasiMenit = raw.durasiMenit;
  if (
    typeof durasiMenit !== 'number' ||
    !Number.isFinite(durasiMenit) ||
    durasiMenit <= 0
  )
    return { ok: false, reason: `pertemuan[${index}] durasiMenit harus angka positif` };

  const status: Partial<Record<JenisDokumenPertemuan, StatusGenerateDokumen>> = {};
  if (raw.status !== undefined && !isObj(raw.status))
    return { ok: false, reason: `pertemuan[${index}] status bukan objek` };
  const rawStatus = isObj(raw.status) ? raw.status : {};
  for (const [key, value] of Object.entries(rawStatus)) {
    if (!(JENIS_DOKUMEN_ORDER as string[]).includes(key))
      return { ok: false, reason: `pertemuan[${index}] status.${key} tidak dikenal` };
    if (typeof value !== 'string' || !(STATUS_VALUES as string[]).includes(value))
      return { ok: false, reason: `pertemuan[${index}] status.${key} tidak valid` };
    status[key as JenisDokumenPertemuan] = persistableStatus(
      value as StatusGenerateDokumen,
    );
  }

  const errors: Partial<Record<JenisDokumenPertemuan, string>> = {};
  if (raw.errors !== undefined && !isObj(raw.errors))
    return { ok: false, reason: `pertemuan[${index}] errors bukan objek` };
  const rawErrors = isObj(raw.errors) ? raw.errors : {};
  for (const jenis of JENIS_DOKUMEN_ORDER) {
    const e = rawErrors[jenis];
    if (typeof e === 'string' && e) errors[jenis] = e;
  }

  const dokumenParsed = parseDokumenContainer(
    raw.dokumen === undefined ? {} : raw.dokumen,
    `pertemuan[${index}].dokumen`,
    JENIS_DOKUMEN_ORDER,
  );
  if (dokumenParsed.ok !== true) return { ok: false, reason: dokumenParsed.reason };

  const pilihan = parsePilihan(raw.pilihanDokumen);
  if (pilihan.ok !== true)
    return { ok: false, reason: `pertemuan[${index}] ${pilihan.reason}` };

  const value: PertemuanResult = {
    id,
    nomor,
    durasiMenit,
    ...(typeof raw.durasiLabel === 'string' ? { durasiLabel: raw.durasiLabel } : {}),
    ...(typeof raw.submateriId === 'string' ? { submateriId: raw.submateriId } : {}),
    ...(typeof raw.submateriJudul === 'string'
      ? { submateriJudul: raw.submateriJudul }
      : {}),
    pilihanDokumen: pilihan.value,
    dokumen: dokumenParsed.value as PertemuanResult['dokumen'],
    status,
    ...(Object.keys(errors).length > 0 ? { errors } : {}),
  };
  return { ok: true, value };
};

/**
 * Validasi runtime penuh terhadap JSON dari database. Data invalid ditolak
 * seluruhnya (tidak pernah ditempel sebagian) sehingga state aktif tetap aman.
 */
export const parseGenerationResultV2 = (
  raw: unknown,
): ParseResult<GenerationResultV2> => {
  if (!isObj(raw)) return { ok: false, reason: 'Data V2 kosong atau bukan objek' };
  if (raw.version !== 2) return { ok: false, reason: 'Versi data V2 tidak dikenali' };
  if (!Array.isArray(raw.pertemuan))
    return { ok: false, reason: 'Daftar pertemuan tidak valid' };

  const pertemuan: PertemuanResult[] = [];
  const seen = new Set<string>();
  const seenNomor = new Set<number>();
  for (let i = 0; i < raw.pertemuan.length; i += 1) {
    const parsed: ParseResult<PertemuanResult> = parsePertemuan(raw.pertemuan[i], i);
    if (parsed.ok !== true) return { ok: false, reason: parsed.reason };
    if (seen.has(parsed.value.id))
      return { ok: false, reason: `ID pertemuan duplikat: ${parsed.value.id}` };
    if (seenNomor.has(parsed.value.nomor))
      return { ok: false, reason: `Nomor pertemuan duplikat: ${parsed.value.nomor}` };
    seen.add(parsed.value.id);
    seenNomor.add(parsed.value.nomor);
    pertemuan.push(parsed.value);
  }

  const NON_MODUL = JENIS_DOKUMEN_ORDER.filter((j) => j !== 'modul');
  if (raw.dokumenGlobal !== undefined) {
    const g = parseDokumenContainer(raw.dokumenGlobal, 'dokumenGlobal', NON_MODUL);
    if (g.ok !== true) return { ok: false, reason: g.reason };
  }
  if (raw.dokumenSubmateri !== undefined) {
    if (!isObj(raw.dokumenSubmateri))
      return { ok: false, reason: 'dokumenSubmateri tidak valid' };
    for (const [key, value] of Object.entries(raw.dokumenSubmateri)) {
      const sub = parseDokumenContainer(
        value,
        `dokumenSubmateri[${key}]`,
        NON_MODUL,
      );
      if (sub.ok !== true) return { ok: false, reason: sub.reason };
    }
  }
  if (raw.modulPreface !== undefined && !isObj(raw.modulPreface))
    return { ok: false, reason: 'modulPreface tidak valid' };

  return {
    ok: true,
    value: {
      version: 2,
      pertemuan,
      ...(isObj(raw.modulPreface)
        ? { modulPreface: raw.modulPreface as GenerationResultV2['modulPreface'] }
        : {}),
      ...(isObj(raw.dokumenGlobal)
        ? { dokumenGlobal: raw.dokumenGlobal as GenerationResultV2['dokumenGlobal'] }
        : {}),
      ...(isObj(raw.dokumenSubmateri)
        ? {
            dokumenSubmateri:
              raw.dokumenSubmateri as GenerationResultV2['dokumenSubmateri'],
          }
        : {}),
      ...(typeof raw.babId === 'string' ? { babId: raw.babId } : {}),
    },
  };
};

// ------------------------------------------------------------------ helpers

export interface V2HistorySummary {
  jumlahPertemuan: number;
  /** Jumlah dokumen berhasil (status ok / dokumen ada) per jenis. */
  perJenis: Record<JenisDokumenPertemuan, number>;
  totalDokumen: number;
}

export const summarizeGenerationResultV2 = (
  result: GenerationResultV2 | null | undefined,
): V2HistorySummary => {
  const perJenis = {
    modul: 0,
    lkpd: 0,
    asesmen: 0,
    soal: 0,
    materi: 0,
    refleksi: 0,
  } as Record<JenisDokumenPertemuan, number>;
  let total = 0;
  for (const p of result?.pertemuan ?? []) {
    for (const jenis of JENIS_DOKUMEN_ORDER) {
      if (p.dokumen?.[jenis]) {
        perJenis[jenis] += 1;
        total += 1;
      }
    }
  }
  return {
    jumlahPertemuan: result?.pertemuan?.length ?? 0,
    perJenis,
    totalDokumen: total,
  };
};

/** Apakah ada konten yang layak disimpan (dipakai `hasContent` di header). */
export const hasV2Content = (result: GenerationResultV2 | null | undefined): boolean =>
  summarizeGenerationResultV2(result).totalDokumen > 0;

export interface HasContentInput {
  legacy: unknown[];
  v2Active: boolean;
  v2Result?: GenerationResultV2 | null;
}

/**
 * Konten yang LAYAK DISIMPAN. Skeleton pertemuan kosong (mode V2 aktif tanpa
 * satu pun dokumen) BUKAN konten.
 */
export const computeHasContent = ({
  legacy,
  v2Active,
  v2Result,
}: HasContentInput): boolean => {
  if (legacy.some(Boolean)) return true;
  if (v2Active && hasV2Content(v2Result)) return true;
  return false;
};

/**
 * Apakah ada sesuatu yang perlu dibersihkan tombol Reset: dokumen, status
 * non-idle, atau error.
 */
export const hasV2ResettableState = (
  result: GenerationResultV2 | null | undefined,
): boolean => {
  if (!result) return false;
  if (hasV2Content(result)) return true;
  return (result.pertemuan ?? []).some(
    (p) =>
      Object.values(p.status ?? {}).some((s) => s && s !== 'idle') ||
      Object.keys(p.errors ?? {}).length > 0,
  );
};

/** Apakah row history harus dimuat lewat jalur V2 (bukan loader legacy). */
export const isV2History = (item: {
  content_schema_version?: number | null;
}): boolean => item?.content_schema_version === CONTENT_SCHEMA_VERSION_V2;

/**
 * Tombol fullscreen mobile: hasil V2 boleh masuk fullscreen tanpa
 * `generatedSteps` legacy. Perilaku legacy tidak berubah.
 */
export const canUseFullscreenPreview = ({
  hasLegacyModul,
  v2Active,
  v2Result,
  activeTab,
}: {
  hasLegacyModul: boolean;
  v2Active: boolean;
  v2Result?: GenerationResultV2 | null;
  activeTab: string;
}): boolean =>
  (hasLegacyModul || (v2Active && hasV2Content(v2Result))) &&
  activeTab !== 'perencanaan';

// ------------------------------------------------- rencana load lintas mode
//
// BATAS DOMAIN (Fase 4A.2): history schema version 2 adalah paket "Dokumen per
// Pertemuan" (Modul/RPP satuan). Prota, Prosem, dan KKTP TIDAK termasuk paket
// tersebut. Relasi ke perencanaan tahunan akan dirancang pada fitur/workspace
// terpisah — jangan mengimplementasikan relasi tersebut di sini.

export type HistoryLoadPlan =
  | {
      mode: 'reject';
      /** Alasan yang ditampilkan ke user; state aktif TIDAK berubah. */
      reason: string;
    }
  | {
      mode: 'v2';
      value: GenerationResultV2;
      /** Buang seluruh state dokumen legacy sebelum memasang hasil V2. */
      clearLegacy: true;
      /** Batalkan queue + naikkan epoch sebelum memasang hasil baru. */
      resetV2: true;
      /** Buang Prota/Prosem/KKTP: bukan bagian paket V2. */
      clearPlanning: true;
    }
  | {
      mode: 'legacy';
      /** Buang residu hasil V2 (hanya relevan saat flag ON). */
      resetV2: boolean;
      /** Hidrasi eksplisit history legacy ke state V2 (flag ON + ada Modul). */
      hydrateLegacy: boolean;
      /** Planning legacy tetap dimuat seperti perilaku lama. */
      loadPlanning: true;
    };

/**
 * Satu keputusan canonical untuk semua perpindahan history:
 * legacy A → V2 B, V2 A → legacy B, V2 A → V2 B, legacy A → legacy B.
 * Validasi payload V2 dilakukan LEBIH DULU: bila invalid, tidak ada state
 * apa pun yang boleh dibersihkan (termasuk planning).
 */
export const resolveHistoryLoadPlan = (
  item: { content_schema_version?: number | null; generation_result_v2?: unknown; modul_data?: unknown },
  { flagOn }: { flagOn: boolean },
): HistoryLoadPlan => {
  if (isV2History(item)) {
    if (!flagOn)
      return {
        mode: 'reject',
        reason:
          'Riwayat ini membutuhkan fitur Dokumen per Pertemuan yang belum aktif. State Anda saat ini tidak diubah.',
      };
    const parsed = parseGenerationResultV2(item.generation_result_v2);
    if (parsed.ok !== true) return { mode: 'reject', reason: parsed.reason };
    return {
      mode: 'v2',
      value: parsed.value,
      clearLegacy: true,
      resetV2: true,
      clearPlanning: true,
    };
  }
  return {
    mode: 'legacy',
    resetV2: flagOn,
    hydrateLegacy: flagOn && !!item.modul_data,
    loadPlanning: true,
  };
};

