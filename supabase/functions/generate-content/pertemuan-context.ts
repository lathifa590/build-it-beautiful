// FASE 2 (koreksi) — Helper murni untuk parsing metadata pertemuan & pembentukan
// blok prompt "FOKUS PERTEMUAN".
//
// Aturan:
// - TIDAK boleh mengimpor Deno / Supabase / env var (harus bisa diuji di Node).
// - TIDAK memutasi input.
// - previousSummary TIDAK ditangani di sini (tetap memakai ctxBlock lama).

export interface PertemuanTargetInput {
  id?: string;
  nomorPertemuan?: number | string;
  durasiMenit?: number | string;
  durasi?: number | string;
}

export interface PertemuanContextInput {
  pertemuanTarget?: PertemuanTargetInput;
  pertemuanId?: string;
  pertemuanFokus?: number | string;
  pertemuanIndex?: number;
  nomorPertemuan?: number | string;
  totalPertemuan?: number | string;
  durasiMenit?: number | string;
  durasi?: number | string;
  submateriId?: string;
  subMateri?: string;
  tujuanPertemuan?: string | string[];
  fokusPertemuan?: string;
  [key: string]: unknown;
}

export interface PertemuanMeta {
  pertemuanId?: string;
  nomorPertemuan: number;
  totalPertemuan?: number;
  durasiMenit?: number;
  subMateri?: string;
}

export const MAX_FREE_TEXT_LEN = 300;
export const MAX_TUJUAN_ITEMS = 8;

/** Integer positif; menerima string angka. */
function parsePositiveInt(v: unknown): number | undefined {
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0 || !Number.isInteger(v)) return undefined;
    return v;
  }
  if (typeof v !== 'string') return undefined;
  const raw = v.trim();
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Durasi dalam menit: mendukung 90, "90", "2 JP", "2x45", "90 menit". */
export function parseDurasiMenit(v: unknown): number | undefined {
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return undefined;
    return Math.round(v);
  }
  if (typeof v !== 'string') return undefined;
  const raw = v.trim().toLowerCase();
  if (!raw) return undefined;

  const mult = raw.match(/^(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/);
  if (mult) {
    const a = Number.parseFloat(mult[1].replace(',', '.'));
    const b = Number.parseFloat(mult[2].replace(',', '.'));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) return Math.round(a * b);
  }

  const jp = raw.match(/^(\d+(?:[.,]\d+)?)\s*jp\b/);
  if (jp) {
    const n = Number.parseFloat(jp[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 45);
  }

  const min = raw.match(/^(\d+(?:[.,]\d+)?)/);
  if (min) {
    const n = Number.parseFloat(min[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

function cleanText(v: unknown, max = MAX_FREE_TEXT_LEN): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

function cleanTujuan(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
  const out: string[] = [];
  for (const item of arr) {
    const t = cleanText(item);
    if (t) out.push(t);
    if (out.length >= MAX_TUJUAN_ITEMS) break;
  }
  return out;
}

export function buildPertemuanContext(data: PertemuanContextInput | null | undefined): {
  meta: PertemuanMeta | null;
  promptBlock: string;
} {
  if (!data || typeof data !== 'object') return { meta: null, promptBlock: '' };

  const target: PertemuanTargetInput =
    data.pertemuanTarget && typeof data.pertemuanTarget === 'object' ? data.pertemuanTarget : {};

  // --- Nomor pertemuan ---
  const nomorPertemuan =
    parsePositiveInt(target.nomorPertemuan) ??
    parsePositiveInt(data.nomorPertemuan) ??
    parsePositiveInt(data.pertemuanFokus) ??
    (typeof data.pertemuanIndex === 'number' &&
    Number.isInteger(data.pertemuanIndex) &&
    data.pertemuanIndex >= 0
      ? data.pertemuanIndex + 1
      : undefined);

  if (!nomorPertemuan) return { meta: null, promptBlock: '' };

  // --- ID ---
  const pertemuanId = cleanText(target.id, 120) ?? cleanText(data.pertemuanId, 120);

  // --- Durasi ---
  const durasiMenit =
    parseDurasiMenit(target.durasiMenit) ??
    parseDurasiMenit(target.durasi) ??
    parseDurasiMenit(data.durasiMenit) ??
    parseDurasiMenit(data.durasi);

  const totalPertemuan = parsePositiveInt(data.totalPertemuan);
  const subMateri = cleanText(data.subMateri, 200);

  const meta: PertemuanMeta = {
    ...(pertemuanId ? { pertemuanId } : {}),
    nomorPertemuan,
    ...(totalPertemuan ? { totalPertemuan } : {}),
    ...(durasiMenit ? { durasiMenit } : {}),
    ...(subMateri ? { subMateri } : {}),
  };

  const tujuan = cleanTujuan(data.tujuanPertemuan);
  const fokus = cleanText(data.fokusPertemuan);

  const lines: string[] = [];
  lines.push(
    `- Pertemuan: ${nomorPertemuan}${totalPertemuan ? ` dari ${totalPertemuan}` : ''}`,
  );
  if (durasiMenit) lines.push(`- Durasi: ${durasiMenit} menit`);
  if (subMateri) lines.push(`- Submateri: ${subMateri}`);
  if (tujuan.length === 1) {
    lines.push(`- Tujuan pertemuan: ${tujuan[0]}`);
  } else if (tujuan.length > 1) {
    lines.push('- Tujuan pertemuan:');
    for (const t of tujuan) lines.push(`  - ${t}`);
  }
  if (fokus) lines.push(`- Fokus khusus: ${fokus}`);

  const promptBlock = `

FOKUS PERTEMUAN:
${lines.join('\n')}

Buat dokumen khusus untuk cakupan pertemuan ini.
Jangan membahas seluruh Bab.
Jangan mengulang aktivitas/konten pertemuan sebelumnya; lanjutkan progresinya.
Sesuaikan kedalaman dan jumlah aktivitas dengan durasi.`;

  return { meta, promptBlock };
}
