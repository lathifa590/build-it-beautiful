/**
 * Orchestrator helpers untuk arsitektur "Dokumen per Pertemuan V2" (Fase 3).
 *
 * Semua fungsi di file ini PURE dan immutable: tidak memutasi input, tidak
 * menyentuh state global, tidak memanggil network. Bagian yang melakukan I/O
 * ada di `src/hooks/usePertemuanGeneration.ts`.
 *
 * Aktif hanya lewat feature flag `ENABLE_PERTEMUAN_DOCS_V2` (default OFF).
 */

import type {
  DokumenPertemuan,
  FormData,
  GenerationResultV2,
  JenisDokumenPertemuan,
  PertemuanInput,
  PertemuanResult,
  PilihanDokumenPertemuan,
  StatusGenerateDokumen,
} from '@/types/modul';
import { buildPertemuanSummary, serializeSummaries } from '@/lib/pertemuan-summary';
import type { PertemuanDataDetail, PertemuanSummary } from '@/types/modul';
import {
  DEFAULT_DURASI_MENIT,
  defaultPilihanDokumen,
  getStablePertemuanId,
  normalizeDurasiMenit,
} from '@/lib/result-adapter';

// ---------------------------------------------------------------------------
// Konstanta
// ---------------------------------------------------------------------------

export const JENIS_DOKUMEN_ORDER: JenisDokumenPertemuan[] = [
  'modul',
  'lkpd',
  'asesmen',
  'soal',
  'materi',
  'refleksi',
];

/** Pemetaan eksplisit jenis dokumen V2 → `type` yang dipahami backend. */
export const BACKEND_TYPE_MAP: Record<JenisDokumenPertemuan, string> = {
  modul: 'modul-pertemuan',
  lkpd: 'lkpd',
  asesmen: 'asesmen',
  soal: 'bankSoal',
  materi: 'materi',
  refleksi: 'tindakLanjut',
};

export const LABEL_DOKUMEN: Record<JenisDokumenPertemuan, string> = {
  modul: 'Modul',
  lkpd: 'LKPD',
  asesmen: 'Asesmen',
  soal: 'Soal',
  materi: 'Materi',
  refleksi: 'Refleksi',
};

export const LABEL_STATUS: Record<StatusGenerateDokumen, string> = {
  idle: 'Belum dibuat',
  pending: 'Sedang dibuat',
  ok: 'Selesai',
  error: 'Gagal',
};

// ---------------------------------------------------------------------------
// Sinkronisasi daftar pertemuan (form ⇄ hasil V2)
// ---------------------------------------------------------------------------

const clonePilihan = (p: PilihanDokumenPertemuan): PilihanDokumenPertemuan => ({
  ...p,
  modul: true,
});

export const emptyResultV2 = (): GenerationResultV2 => ({
  version: 2,
  pertemuan: [],
});

/**
 * Selaraskan `GenerationResultV2.pertemuan` dengan input form.
 *
 * - Pencocokan utama berdasarkan ID; nomor hanya fallback.
 * - Perubahan durasi TIDAK membuat ID baru.
 * - Pertemuan baru memakai `defaultPilihanDokumen()`.
 * - Pertemuan yang dihapus di form ikut hilang dari hasil (pemanggil wajib
 *   mengonfirmasi ke user lebih dulu bila pertemuan itu sudah punya hasil).
 */
export const syncPertemuanResults = (
  current: GenerationResultV2,
  formPertemuan: PertemuanInput[],
  options: { seed: string },
): GenerationResultV2 => {
  const { seed } = options;
  const byId = new Map(current.pertemuan.map((p) => [p.id, p]));
  const byNomor = new Map(current.pertemuan.map((p) => [p.nomor, p]));
  const used = new Set<string>();

  const next: PertemuanResult[] = (formPertemuan ?? []).map((fp, idx) => {
    const nomor = fp?.nomorPertemuan ?? idx + 1;
    let prev = fp?.id ? byId.get(fp.id) : undefined;
    if (!prev) {
      const candidate = byNomor.get(nomor);
      if (candidate && !used.has(candidate.id)) prev = candidate;
    }
    if (prev) used.add(prev.id);

    const id =
      prev?.id ??
      getStablePertemuanId({ existingId: fp?.id, seed, nomor });

    return {
      ...(prev ?? {
        pilihanDokumen: defaultPilihanDokumen(),
        dokumen: {} as DokumenPertemuan,
        status: { modul: 'idle' as StatusGenerateDokumen },
      }),
      id,
      nomor,
      durasiMenit: normalizeDurasiMenit(fp?.durasi) || DEFAULT_DURASI_MENIT,
      durasiLabel: typeof fp?.durasi === 'string' ? fp.durasi : prev?.durasiLabel,
      pilihanDokumen: clonePilihan(
        prev?.pilihanDokumen ?? defaultPilihanDokumen(),
      ),
      dokumen: { ...(prev?.dokumen ?? {}) },
      status: { ...(prev?.status ?? { modul: 'idle' }) },
      ...(prev?.errors ? { errors: { ...prev.errors } } : {}),
    };
  });

  return { ...current, pertemuan: next };
};

// ---------------------------------------------------------------------------
// Pilihan dokumen
// ---------------------------------------------------------------------------

export const setPilihanDokumen = (
  result: GenerationResultV2,
  pertemuanId: string,
  jenis: JenisDokumenPertemuan,
  value: boolean,
): GenerationResultV2 => {
  if (jenis === 'modul') return result; // Modul wajib — tidak bisa dimatikan.
  return {
    ...result,
    pertemuan: result.pertemuan.map((p) =>
      p.id === pertemuanId
        ? {
            ...p,
            pilihanDokumen: { ...p.pilihanDokumen, [jenis]: value, modul: true },
          }
        : p,
    ),
  };
};

// ---------------------------------------------------------------------------
// Antrean generate
// ---------------------------------------------------------------------------

export interface GenerateTask {
  pertemuanId: string;
  nomor: number;
  jenis: JenisDokumenPertemuan;
  backendType: string;
}

export type QueueMode = 'missing' | 'all';

/**
 * Bangun antrean generate berurutan (pertemuan naik, dokumen sesuai urutan
 * kanonik). Hanya dokumen yang dipilih yang masuk antrean; Modul selalu ikut.
 *
 * - `missing` (default): lewati dokumen berstatus `ok` dan yang sedang `pending`.
 * - `all`: regenerate eksplisit — semua dokumen terpilih masuk antrean.
 */
export const buildGenerateQueue = (
  result: GenerationResultV2,
  options: { mode?: QueueMode; pertemuanIds?: string[] } = {},
): GenerateTask[] => {
  const mode = options.mode ?? 'missing';
  const filter = options.pertemuanIds ? new Set(options.pertemuanIds) : null;
  const tasks: GenerateTask[] = [];

  for (const p of [...result.pertemuan].sort((a, b) => a.nomor - b.nomor)) {
    if (filter && !filter.has(p.id)) continue;
    for (const jenis of JENIS_DOKUMEN_ORDER) {
      const dipilih = jenis === 'modul' ? true : !!p.pilihanDokumen[jenis];
      if (!dipilih) continue;
      const status = p.status[jenis] ?? 'idle';
      if (mode === 'missing' && (status === 'ok' || status === 'pending')) continue;
      if (mode === 'all' && status === 'pending') continue;
      tasks.push({
        pertemuanId: p.id,
        nomor: p.nomor,
        jenis,
        backendType: BACKEND_TYPE_MAP[jenis],
      });
    }
  }
  return tasks;
};

/** Estimasi jumlah panggilan AI (≈ kredit) sebelum generate. */
export const estimateGenerateCalls = (
  result: GenerationResultV2,
  options: { mode?: QueueMode } = {},
): number => buildGenerateQueue(result, options).length;

// ---------------------------------------------------------------------------
// Payload backend
// ---------------------------------------------------------------------------

const omitUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === 'undefined') continue;
    out[k] = v;
  }
  return out as T;
};

export interface BuildPayloadArgs {
  formData: FormData;
  pertemuan: PertemuanResult;
  totalPertemuan: number;
  jenis: JenisDokumenPertemuan;
  previousSummary?: string;
  /** Field tambahan spesifik dokumen (misal konfigurasi Bank Soal). */
  extra?: Record<string, unknown>;
}

export const buildPertemuanPayload = ({
  formData,
  pertemuan,
  totalPertemuan,
  jenis,
  previousSummary,
  extra,
}: BuildPayloadArgs): { type: string; data: Record<string, unknown> } => {
  const data = omitUndefined({
    ...formData,
    ...(extra ?? {}),
    subMateri: pertemuan.submateriJudul || (formData as unknown as Record<string, unknown>).subMateri,
    pertemuanTarget: omitUndefined({
      id: pertemuan.id,
      nomorPertemuan: pertemuan.nomor,
      durasiMenit: pertemuan.durasiMenit,
      durasi: pertemuan.durasiLabel,
    }),
    pertemuanId: pertemuan.id,
    nomorPertemuan: pertemuan.nomor,
    pertemuanIndex: pertemuan.nomor - 1,
    totalPertemuan,
    durasiMenit: pertemuan.durasiMenit,
    tujuanPertemuan: (pertemuan as unknown as Record<string, unknown>).tujuanPertemuan,
    fokusPertemuan: (pertemuan as unknown as Record<string, unknown>).fokusPertemuan,
    previousSummary: previousSummary || undefined,
  });

  return { type: BACKEND_TYPE_MAP[jenis], data };
};

// ---------------------------------------------------------------------------
// Validasi meta response
// ---------------------------------------------------------------------------

export interface MetaValidationResult {
  ok: boolean;
  reason?: string;
}

/** Response `meta` (opsional) dipakai untuk memastikan hasil memang milik
 *  pertemuan yang diminta. Tanpa `meta`, hasil diterima (kompatibel legacy). */
export const validateResponseMeta = (
  meta: unknown,
  pertemuan: Pick<PertemuanResult, 'id' | 'nomor'>,
): MetaValidationResult => {
  if (!meta || typeof meta !== 'object') return { ok: true };
  const m = meta as Record<string, unknown>;
  const id = m.pertemuanId ?? (m.pertemuanTarget as Record<string, unknown> | undefined)?.id;
  const nomor = m.nomorPertemuan ?? (m.pertemuanTarget as Record<string, unknown> | undefined)?.nomorPertemuan;

  if (typeof id === 'string' && id && id !== pertemuan.id) {
    return {
      ok: false,
      reason: `Hasil tidak cocok: server mengembalikan pertemuan lain (${id}).`,
    };
  }
  if (typeof nomor === 'number' && nomor !== pertemuan.nomor) {
    return {
      ok: false,
      reason: `Hasil tidak cocok: server mengembalikan Pertemuan ${nomor}, diminta Pertemuan ${pertemuan.nomor}.`,
    };
  }
  return { ok: true };
};

// ---------------------------------------------------------------------------
// Penerapan hasil (immutable)
// ---------------------------------------------------------------------------

const mapPertemuan = (
  result: GenerationResultV2,
  pertemuanId: string,
  fn: (p: PertemuanResult) => PertemuanResult,
): GenerationResultV2 => ({
  ...result,
  pertemuan: result.pertemuan.map((p) => (p.id === pertemuanId ? fn(p) : p)),
});

export const setDokumenStatus = (
  result: GenerationResultV2,
  pertemuanId: string,
  jenis: JenisDokumenPertemuan,
  status: StatusGenerateDokumen,
  errorMessage?: string,
): GenerationResultV2 =>
  mapPertemuan(result, pertemuanId, (p) => {
    const errors = { ...(p.errors ?? {}) };
    if (status === 'error' && errorMessage) errors[jenis] = errorMessage;
    else delete errors[jenis];
    const next: PertemuanResult = {
      ...p,
      status: { ...p.status, [jenis]: status },
      dokumen: { ...p.dokumen },
    };
    if (Object.keys(errors).length > 0) next.errors = errors;
    else delete next.errors;
    return next;
  });

/** Simpan hasil dokumen ke pertemuan yang benar; hasil pertemuan lain utuh. */
export const applyDokumenResult = (
  result: GenerationResultV2,
  pertemuanId: string,
  jenis: JenisDokumenPertemuan,
  dokumen: unknown,
): GenerationResultV2 =>
  mapPertemuan(result, pertemuanId, (p) => {
    const errors = { ...(p.errors ?? {}) };
    delete errors[jenis];
    const next: PertemuanResult = {
      ...p,
      dokumen: { ...p.dokumen, [jenis]: dokumen as never },
      status: { ...p.status, [jenis]: 'ok' },
    };
    if (Object.keys(errors).length > 0) next.errors = errors;
    else delete next.errors;
    return next;
  });

export const getPertemuanById = (
  result: GenerationResultV2,
  pertemuanId: string,
): PertemuanResult | undefined =>
  result.pertemuan.find((p) => p.id === pertemuanId);

export const hasAnyDokumen = (p: PertemuanResult): boolean =>
  JENIS_DOKUMEN_ORDER.some((j) => p.dokumen[j] !== undefined);

// ---------------------------------------------------------------------------
// Koreksi Fase 3 — helper murni tambahan
// ---------------------------------------------------------------------------

/**
 * Bangun `previousSummary` untuk sebuah pertemuan target.
 *
 * HANYA memakai Modul pertemuan dengan `nomor < targetNomor` yang sudah
 * tersimpan di state V2 — jadi:
 * - Pertemuan 1 selalu mendapat string kosong.
 * - Dokumen non-Modul pada pertemuan yang sama TIDAK pernah menerima ringkasan
 *   dirinya sendiri.
 * - Retry/partial run tetap menemukan ringkasan pertemuan sebelumnya karena
 *   sumbernya adalah state tersimpan, bukan variabel lokal runQueue.
 */
/**
 * Normalisasi Modul pertemuan (bentuk detail ATAU legacy) menjadi bentuk
 * detail yang bisa dipakai `buildPertemuanSummary`.
 *
 * - Detail: `tahap_awal` / `tahap_inti` / `tahap_penutup` dipakai apa adanya.
 * - Legacy: `pembukaan` / `inti` / `penutup` (array LangkahPembelajaran)
 *   dipetakan menjadi tahap dengan `kegiatan[].sub_kegiatan[]`.
 */
export const toDetailModulForSummary = (
  modul: unknown,
): PertemuanDataDetail | null => {
  if (!isObj(modul)) return null;
  if (modul.tahap_awal) return modul as unknown as PertemuanDataDetail;

  const legacyKeys: Array<['pembukaan' | 'inti' | 'penutup', string]> = [
    ['pembukaan', 'Kegiatan Pendahuluan'],
    ['inti', 'Kegiatan Inti'],
    ['penutup', 'Kegiatan Penutup'],
  ];
  const hasLegacy = legacyKeys.some(([k]) => Array.isArray(modul[k]));
  if (!hasLegacy) return null;

  const toTahap = (key: 'pembukaan' | 'inti' | 'penutup', judul: string) => {
    const langkah = Array.isArray(modul[key])
      ? (modul[key] as Array<Record<string, unknown>>)
      : [];
    return {
      judul,
      prinsip_utama: String(langkah[0]?.prinsip ?? ''),
      durasi_total: '',
      kegiatan: [
        {
          sub_kegiatan: langkah.map((l) => ({
            judul: String(l?.kegiatan ?? ''),
            durasi: String(l?.durasi ?? ''),
            aktivitas: l?.kegiatan ? [String(l.kegiatan)] : [],
          })),
        },
      ],
    };
  };

  return {
    nomorPertemuan: Number(modul.nomorPertemuan ?? 0),
    durasi: String(modul.durasi ?? ''),
    tahap_awal: toTahap('pembukaan', 'Kegiatan Pendahuluan'),
    tahap_inti: toTahap('inti', 'Kegiatan Inti'),
    tahap_penutup: toTahap('penutup', 'Kegiatan Penutup'),
  } as unknown as PertemuanDataDetail;
};

export const buildPreviousSummaryForTarget = (
  result: GenerationResultV2,
  targetNomor: number,
  opts: { tujuanPembelajaran?: string } = {},
): string => {
  const summaries: PertemuanSummary[] = [];
  for (const p of [...result.pertemuan].sort((a, b) => a.nomor - b.nomor)) {
    if (p.nomor >= targetNomor) continue;
    const modul = toDetailModulForSummary(p.dokumen.modul);
    if (!modul) continue;
    summaries.push(
      buildPertemuanSummary(
        { ...modul, nomorPertemuan: modul.nomorPertemuan || p.nomor },
        {
          pertemuanId: p.id,
          submateriJudul: p.submateriJudul ?? '',
          tujuanPembelajaran: opts.tujuanPembelajaran,
          refleksi: p.dokumen.refleksi,
        },
      ),
    );
  }
  return serializeSummaries(summaries);
};


// --- Validasi bentuk dokumen ------------------------------------------------

export interface ShapeValidationResult {
  ok: boolean;
  reason?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Validasi bentuk minimum per jenis dokumen. Response bisnis seperti
 * `{ needApiKey: true }` otomatis gagal di sini sehingga tidak pernah
 * tersimpan sebagai dokumen.
 */
export const validateDokumenShape = (
  jenis: JenisDokumenPertemuan,
  dokumen: unknown,
): ShapeValidationResult => {
  if (!isObj(dokumen)) return { ok: false, reason: 'Response bukan objek dokumen' };
  if (dokumen.needApiKey === true) return { ok: false, reason: 'API Key diperlukan' };
  if (typeof dokumen.error === 'string' && dokumen.error)
    return { ok: false, reason: dokumen.error };

  const missing = (fields: string[]) =>
    fields.filter((f) => dokumen[f] === undefined || dokumen[f] === null);

  switch (jenis) {
    case 'modul': {
      const m = missing(['tahap_awal', 'tahap_inti', 'tahap_penutup']);
      return m.length
        ? { ok: false, reason: `Struktur Modul tidak lengkap (${m.join(', ')})` }
        : { ok: true };
    }
    case 'lkpd': {
      const okShape =
        typeof dokumen.judul_lkpd === 'string' &&
        Array.isArray(dokumen.aktivitas_utama);
      return okShape
        ? { ok: true }
        : { ok: false, reason: 'Struktur LKPD tidak valid (judul_lkpd/aktivitas_utama)' };
    }
    case 'asesmen': {
      const okShape =
        isObj(dokumen.asesmen_awal) ||
        isObj(dokumen.asesmen_proses) ||
        isObj(dokumen.asesmen_akhir);
      return okShape
        ? { ok: true }
        : { ok: false, reason: 'Struktur Asesmen tidak valid' };
    }
    case 'soal': {
      return Array.isArray(dokumen.daftar_soal)
        ? { ok: true }
        : { ok: false, reason: 'Struktur Bank Soal tidak valid (daftar_soal)' };
    }
    case 'materi': {
      const okShape =
        typeof dokumen.judul_materi === 'string' || Array.isArray(dokumen.isi_materi);
      return okShape
        ? { ok: true }
        : { ok: false, reason: 'Struktur Materi tidak valid (judul_materi)' };
    }
    case 'refleksi': {
      const okShape =
        Array.isArray(dokumen.refleksi_guru) ||
        Array.isArray(dokumen.refleksi_siswa) ||
        typeof dokumen.remedial === 'string';
      return okShape
        ? { ok: true }
        : { ok: false, reason: 'Struktur Refleksi tidak valid' };
    }
    default:
      return { ok: true };
  }
};

// --- Validasi meta ketat (khusus eksekusi V2) -------------------------------

const toPositiveInt = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isInteger(v) && v > 0 ? v : undefined;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
    const n = Number.parseInt(v.trim(), 10);
    return n > 0 ? n : undefined;
  }
  return undefined;
};

/**
 * Jalur V2 SELALU mengirim metadata pertemuan, sehingga response tanpa `meta`
 * dianggap error (berbeda dari `validateResponseMeta` yang toleran untuk
 * jalur legacy).
 */
export const validateResponseMetaStrict = (
  meta: unknown,
  expected: { id: string; nomor: number; backendType: string },
): MetaValidationResult => {
  if (!isObj(meta)) {
    return { ok: false, reason: 'Response tanpa meta pertemuan (ditolak pada jalur V2).' };
  }
  if (typeof meta.type !== 'string' || meta.type !== expected.backendType) {
    return {
      ok: false,
      reason: `Meta type tidak cocok: ${String(meta.type)} ≠ ${expected.backendType}.`,
    };
  }
  const id = meta.pertemuanId;
  if (typeof id !== 'string' || !id) {
    return { ok: false, reason: 'Meta tidak membawa pertemuanId.' };
  }
  if (id !== expected.id) {
    return { ok: false, reason: `Meta pertemuanId tidak cocok (${id}).` };
  }
  const nomor = toPositiveInt(meta.nomorPertemuan);
  if (nomor === undefined) {
    return { ok: false, reason: 'Meta nomorPertemuan tidak valid.' };
  }
  if (nomor !== expected.nomor) {
    return {
      ok: false,
      reason: `Meta nomorPertemuan ${nomor} ≠ Pertemuan ${expected.nomor}.`,
    };
  }
  return { ok: true };
};

// --- Modul preface ----------------------------------------------------------

/**
 * Task Modul pertama (pertemuan bernomor terkecil) memakai endpoint `modul`
 * yang menghasilkan preface (pemahaman bermakna dll.) + Pertemuan 1.
 * Sisanya memakai `modul-pertemuan` sehingga retry P2 tidak membuat ulang
 * preface/P1.
 */
export const shouldUsePrefaceFlow = (
  result: GenerationResultV2,
  task: Pick<GenerateTask, 'jenis' | 'nomor'>,
): boolean => {
  if (task.jenis !== 'modul') return false;
  if (result.modulPreface) return false;
  const firstNomor = Math.min(...result.pertemuan.map((p) => p.nomor));
  return task.nomor === firstNomor;
};

export const setModulPreface = (
  result: GenerationResultV2,
  preface: Record<string, unknown>,
): GenerationResultV2 => ({
  ...result,
  modulPreface: { ...(result.modulPreface ?? {}), ...preface } as GenerationResultV2['modulPreface'],
});

// --- Context key ------------------------------------------------------------

/**
 * Daftar canonical field pembentuk kunci konteks. Satu sumber kebenaran agar
 * `buildContextKey`, snapshot, dan restore tidak pernah berbeda lagi.
 */
export const CONTEXT_KEY_FIELDS = [
  'mataPelajaran',
  'kelas',
  'fase',
  'materi',
  'subMateri',
  'tujuanPembelajaran',
  'kurikulum',
] as const;

/**
 * Field yang di-snapshot & direstore saat user membatalkan reset konteks.
 * `capaianPembelajaran` ikut karena nilainya turunan langsung dari konteks
 * (dipilih/di-generate mengikuti mapel+kelas+materi), meski tidak masuk kunci.
 */
export const CONTEXT_SNAPSHOT_FIELDS = [
  ...CONTEXT_KEY_FIELDS,
  'capaianPembelajaran',
] as const;

/** Ambil hanya field konteks dari sebuah FormData (untuk snapshot/restore). */
export const pickContextFields = (
  formData: Partial<FormData>,
): Partial<FormData> => {
  const src = formData as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of CONTEXT_SNAPSHOT_FIELDS) {
    if (k in src) out[k] = src[k];
  }
  return out as Partial<FormData>;
};

/**
 * Kunci konteks pembelajaran. Perubahan durasi TIDAK termasuk sehingga ID
 * pertemuan tetap stabil, tetapi ganti mapel/kelas/materi/TP/kurikulum membuat
 * hasil lama tidak boleh dipertahankan.
 */
export const buildContextKey = (formData: Partial<FormData>): string => {
  const f = formData as unknown as Record<string, unknown>;
  const val = (k: string) => String(f[k] ?? '').trim().toLowerCase();
  return CONTEXT_KEY_FIELDS.map(val).join('|');
};


/** Apakah ada dokumen/hasil V2 yang akan hilang bila konteks direset. */
export const hasGeneratedContent = (result: GenerationResultV2): boolean =>
  !!result.modulPreface ||
  result.pertemuan.some(
    (p) => hasAnyDokumen(p) || JENIS_DOKUMEN_ORDER.some((j) => p.status[j] === 'ok'),
  );

// ---------------------------------------------------------------------------
// Koreksi Fase 3B — edit dokumen & penghapusan pertemuan
// ---------------------------------------------------------------------------

/**
 * Perbarui satu dokumen milik pertemuan tertentu secara immutable.
 * Status dokumen tetap (edit lokal tidak mengubah `ok` → `idle`).
 */
export const updateDokumenPertemuan = (
  result: GenerationResultV2,
  pertemuanId: string,
  jenis: JenisDokumenPertemuan,
  updater: (dokumen: unknown) => unknown,
): GenerationResultV2 =>
  mapPertemuan(result, pertemuanId, (p) => {
    const current = p.dokumen[jenis];
    if (current === undefined) return p;
    return {
      ...p,
      dokumen: { ...p.dokumen, [jenis]: updater(current) as never },
    };
  });

/** Set nilai pada path bertitik secara immutable (`a.b.0.c`). */
export const setNestedImmutable = (
  obj: unknown,
  path: string,
  value: unknown,
): unknown => {
  const keys = path.split('.');
  const walk = (node: unknown, idx: number): unknown => {
    const key = keys[idx];
    const isLast = idx === keys.length - 1;
    if (Array.isArray(node)) {
      const i = Number(key);
      const copy = [...node];
      copy[i] = isLast ? value : walk(node[i], idx + 1);
      return copy;
    }
    const base = isObj(node) ? node : {};
    return { ...base, [key]: isLast ? value : walk(base[key], idx + 1) };
  };
  return walk(obj, 0);
};

/** Edit section (path bertitik) pada dokumen pertemuan aktif. */
export const updateDokumenSection = (
  result: GenerationResultV2,
  pertemuanId: string,
  jenis: JenisDokumenPertemuan,
  path: string,
  value: unknown,
): GenerationResultV2 =>
  updateDokumenPertemuan(result, pertemuanId, jenis, (doc) =>
    setNestedImmutable(doc, path, value),
  );

export interface DeleteCheckResult {
  /** Boleh dihapus sama sekali. */
  allowed: boolean;
  /** Perlu konfirmasi user karena ada hasil yang akan hilang. */
  requiresConfirm: boolean;
  reason?: string;
}

/** Apakah pertemuan boleh dihapus, dan apakah butuh konfirmasi. */
export const canDeletePertemuan = (
  result: GenerationResultV2,
  pertemuanId: string,
): DeleteCheckResult => {
  const p = getPertemuanById(result, pertemuanId);
  if (!p) return { allowed: true, requiresConfirm: false };
  const anyPending = JENIS_DOKUMEN_ORDER.some((j) => p.status[j] === 'pending');
  if (anyPending) {
    return {
      allowed: false,
      requiresConfirm: false,
      reason: 'Pertemuan sedang dibuat. Tunggu sampai proses selesai.',
    };
  }
  const punyaHasil =
    hasAnyDokumen(p) || JENIS_DOKUMEN_ORDER.some((j) => p.status[j] === 'ok');
  return { allowed: true, requiresConfirm: punyaHasil };
};

/**
 * Sinkronkan metadata nomor pertemuan pada dokumen Modul (bila ada) dengan
 * nomor baru. Mendukung `PertemuanData` (legacy) maupun `PertemuanDataDetail`.
 * Tidak menyentuh isi teks bebas dan tidak mengubah dokumen jenis lain.
 */
export const syncModulNomor = (
  p: PertemuanResult,
  nomor: number,
): PertemuanResult => {
  const modul = p.dokumen.modul as unknown as Record<string, unknown> | undefined;
  if (!isObj(modul)) return p;
  if (!('nomorPertemuan' in modul)) return p;
  if (modul.nomorPertemuan === nomor) return p;
  return {
    ...p,
    dokumen: { ...p.dokumen, modul: { ...modul, nomorPertemuan: nomor } as never },
  };
};

/**
 * Hapus pertemuan berdasarkan stable ID. Nomor dinormalisasi ulang (termasuk
 * metadata `nomorPertemuan` di dokumen Modul), tetapi ID pertemuan lain (dan
 * dokumennya) tidak berpindah.
 */
export const removePertemuanById = (
  result: GenerationResultV2,
  pertemuanId: string,
): GenerationResultV2 => ({
  ...result,
  pertemuan: result.pertemuan
    .filter((p) => p.id !== pertemuanId)
    .sort((a, b) => a.nomor - b.nomor)
    .map((p, i) => syncModulNomor({ ...p, nomor: i + 1 }, i + 1)),
});

