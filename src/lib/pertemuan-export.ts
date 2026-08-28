/**
 * FASE 4B — Model export murni untuk "Dokumen per Pertemuan V2".
 *
 * Modul ini PURE: tidak menyentuh DOM, tidak memutasi input, tidak melakukan
 * I/O. Semua keputusan "apa yang diekspor dan dengan urutan apa" hidup di
 * sini agar bisa diuji tanpa browser.
 *
 * Catatan domain (Fase 4A.2): Prota/Prosem/KKTP BUKAN bagian paket dokumen
 * per pertemuan, sehingga tidak pernah masuk ke plan export V2.
 */

import type {
  BankSoalData,
  GenerationResultV2,
  PermendikbudModulAjarStructure,
  JenisDokumenPertemuan,
  PertemuanResult,
} from '@/types/modul';
import { generateExportFilename } from '@/lib/export-filename';

export type V2ExportScope =
  | 'active_document'
  | 'active_meeting'
  | 'complete_package';

export type V2ExportFormat = 'word' | 'pdf' | 'soal_docx';

/** Urutan wajib dokumen dalam satu pertemuan. */
export const V2_EXPORT_JENIS_ORDER: JenisDokumenPertemuan[] = [
  'modul',
  'lkpd',
  'asesmen',
  'soal',
  'materi',
  'refleksi',
];

export const V2_JENIS_LABEL: Record<JenisDokumenPertemuan, string> = {
  modul: 'Modul',
  lkpd: 'LKPD',
  asesmen: 'Asesmen',
  soal: 'Soal',
  materi: 'Materi',
  refleksi: 'Refleksi',
};

export interface V2ExportItem {
  pertemuanId: string;
  nomorPertemuan: number;
  jenis: JenisDokumenPertemuan;
  /** Referensi (bukan salinan) dokumen terbaru pada GenerationResultV2. */
  dokumen: unknown;
  /** Preface Bab hanya ikut pada dokumen Modul. */
  includeModulPreface: boolean;
  filenamePart: string;
}

export type V2SkipReason =
  | 'not_selected'
  | 'not_generated'
  | 'error'
  | 'meeting_not_found';

export interface V2ExportSkipped {
  pertemuanId: string;
  nomorPertemuan: number;
  jenis: JenisDokumenPertemuan;
  reason: V2SkipReason;
}

export interface V2ExportPlan {
  scope: V2ExportScope;
  items: V2ExportItem[];
  skipped: V2ExportSkipped[];
  /** Nama file tanpa ekstensi, sudah disanitasi. */
  filenameBase: string;
  /** Jumlah pertemuan yang terwakili di items. */
  pertemuanCount: number;
}

export interface BuildV2ExportPlanInput {
  result: GenerationResultV2;
  activePertemuanId?: string;
  activeJenisDokumen?: JenisDokumenPertemuan;
  scope: V2ExportScope;
  formData?: { mataPelajaran?: string; kelas?: string };
}

/** Bersihkan karakter ilegal nama file lintas OS. */
export const sanitizeFilename = (raw: string): string => {
  const cleaned = (raw || '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._]+|[._]+$/g, '');
  return cleaned || 'Dokumen';
};

const findPertemuan = (
  result: GenerationResultV2,
  id?: string,
): PertemuanResult | undefined => {
  if (!id) return undefined;
  return result.pertemuan.find((p) => p.id === id);
};

const isSelected = (p: PertemuanResult, jenis: JenisDokumenPertemuan): boolean =>
  jenis === 'modul' ? true : !!p.pilihanDokumen?.[jenis];

const hasDokumen = (p: PertemuanResult, jenis: JenisDokumenPertemuan): boolean => {
  const d = p.dokumen?.[jenis];
  return d !== undefined && d !== null;
};

const makeItem = (
  p: PertemuanResult,
  jenis: JenisDokumenPertemuan,
): V2ExportItem => ({
  pertemuanId: p.id,
  nomorPertemuan: p.nomor,
  jenis,
  dokumen: p.dokumen[jenis],
  includeModulPreface: jenis === 'modul',
  filenamePart: sanitizeFilename(
    `Pertemuan_${p.nomor}_${V2_JENIS_LABEL[jenis]}`,
  ),
});

const evaluate = (
  p: PertemuanResult,
  jenis: JenisDokumenPertemuan,
  items: V2ExportItem[],
  skipped: V2ExportSkipped[],
): void => {
  if (!isSelected(p, jenis)) {
    skipped.push({
      pertemuanId: p.id,
      nomorPertemuan: p.nomor,
      jenis,
      reason: 'not_selected',
    });
    return;
  }
  if (!hasDokumen(p, jenis)) {
    const status = p.status?.[jenis];
    skipped.push({
      pertemuanId: p.id,
      nomorPertemuan: p.nomor,
      jenis,
      reason: status === 'error' ? 'error' : 'not_generated',
    });
    return;
  }
  items.push(makeItem(p, jenis));
};

const buildFilenameBase = (
  scope: V2ExportScope,
  input: BuildV2ExportPlanInput,
  aktif?: PertemuanResult,
): string => {
  const mapel = input.formData?.mataPelajaran || 'Mapel';
  const kelas = input.formData?.kelas || '';
  const isMulti = scope === 'complete_package';
  const jenis = isMulti ? 'modul' : (input.activeJenisDokumen ?? 'modul');
  const materi = isMulti && input.formData?.materi ? input.formData.materi : (aktif?.materi || input.formData?.materi || '');

  return generateExportFilename({
    documentType: isMulti ? 'Modul' : (scope === 'active_meeting' ? 'Lengkap' : V2_JENIS_LABEL[jenis]),
    isWorkspace: !!input.formData?.title, // if it has title, it's likely a workspace, or we can just omit it
    isMultiPertemuan: isMulti,
    pertemuanKe: isMulti ? undefined : (aktif?.nomor ?? 1),
    mapel: mapel,
    kelas: kelas,
    materi: materi
  });
};

/**
 * Bangun rencana export V2. Tidak memutasi `result` maupun `formData`.
 * Dokumen dirujuk langsung dari `result` sehingga hasil edit manual terbaru
 * otomatis ikut terekspor.
 */
export const buildV2ExportPlan = (
  input: BuildV2ExportPlanInput,
): V2ExportPlan => {
  const { result, scope } = input;
  const items: V2ExportItem[] = [];
  const skipped: V2ExportSkipped[] = [];

  /**
   * FASE 4B.1 — Tidak ada fallback diam-diam ke Pertemuan 1.
   * ID diberikan tapi tidak ditemukan (mis. stale ID setelah pertemuan
   * dihapus) HARUS menghasilkan plan kosong, bukan mengekspor meeting lain.
   */
  const aktif = input.activePertemuanId
    ? findPertemuan(result, input.activePertemuanId)
    : result.pertemuan[0];

  if (scope === 'complete_package') {
    const ordered = [...result.pertemuan].sort((a, b) => a.nomor - b.nomor);
    for (const p of ordered) {
      for (const jenis of V2_EXPORT_JENIS_ORDER) evaluate(p, jenis, items, skipped);
    }
  } else if (!aktif) {
    skipped.push({
      pertemuanId: input.activePertemuanId ?? '',
      nomorPertemuan: 0,
      jenis: input.activeJenisDokumen ?? 'modul',
      reason: 'meeting_not_found',
    });
  } else if (scope === 'active_meeting') {
    for (const jenis of V2_EXPORT_JENIS_ORDER) evaluate(aktif, jenis, items, skipped);
  } else {
    evaluate(aktif, input.activeJenisDokumen ?? 'modul', items, skipped);
  }

  return {
    scope,
    items,
    skipped,
    filenameBase: buildFilenameBase(scope, input, aktif),
    pertemuanCount: new Set(items.map((i) => i.pertemuanId)).size,
  };
};

/**
 * BankSoalData milik pertemuan aktif (bukan bankSoalData legacy global).
 * FASE 4B.1: ID invalid → `null`, bukan fallback ke pertemuan pertama.
 */
export const getBankSoalForPertemuan = (
  result: GenerationResultV2,
  pertemuanId?: string,
): BankSoalData | null => {
  const p = pertemuanId
    ? findPertemuan(result, pertemuanId)
    : result.pertemuan[0];
  const soal = p?.dokumen?.soal;
  return (soal as BankSoalData | undefined) ?? null;
};

/** Ringkasan human-readable untuk dialog konfirmasi. */
export const describeV2ExportPlan = (plan: V2ExportPlan): string[] =>
  plan.items.map(
    (i) => `Pertemuan ${i.nomorPertemuan} — ${V2_JENIS_LABEL[i.jenis]}`,
  );

export const describeV2Skipped = (plan: V2ExportPlan): string[] =>
  plan.skipped
    .filter((s) => s.reason !== 'not_selected')
    .map(
      (s) =>
        `Pertemuan ${s.nomorPertemuan} — ${V2_JENIS_LABEL[s.jenis]} (${
          s.reason === 'error' ? 'gagal' : 'belum tersedia'
        })`,
    );
