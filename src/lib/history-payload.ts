/**
 * FASE 4A.1 — Pembangun payload database `content_history`.
 *
 * Satu helper murni dipakai oleh INSERT dan UPDATE sehingga row legacy dan row
 * V2 selalu **mutually exclusive**:
 *
 * - Row V2  : `content_schema_version = 2`, `generation_result_v2` terisi, dan
 *             SELURUH kolom dokumen legacy dipaksa `null`.
 * - Row V1  : `content_schema_version = 1`, `generation_result_v2 = null`, dan
 *             kolom dokumen legacy diisi seperti perilaku lama.
 *
 * KEPUTUSAN PRODUK (Fase 4A.2) — `prota_data`, `kktp_data`, dan `prosem_data`
 * BUKAN bagian paket History Dokumen per Pertemuan V2. Prota/Prosem/KKTP adalah
 * perencanaan tahunan yang akan punya fitur/workspace sendiri. Karena itu:
 *
 * - Row V2  : ketiga kolom planning DIPAKSA `null`.
 * - Row V1  : perilaku lama dipertahankan penuh (planning tetap tersimpan)
 *             supaya history pengguna lama tidak rusak.
 *
 * Jangan menyalin planning ke `generation_result_v2` dan jangan menambahkan
 * relasi planning baru pada fase ini.
 */


import type {
  AsesmenData,
  BankSoalData,
  FormData,
  GeneratedSteps,
  GenerationResultV2,
  KKTPData,
  LKPDData,
  MateriData,
  ProsemData,
  ProtaData,
  TindakLanjutData,
} from '@/types/modul';
import type { Json } from '@/integrations/supabase/types';
import {
  CONTENT_SCHEMA_VERSION_LEGACY,
  CONTENT_SCHEMA_VERSION_V2,
  serializeGenerationResultV2,
} from '@/lib/history-v2';

export type ContentHistoryWriteMode = 'legacy' | 'v2';

export interface ContentHistoryWriteParams {
  name: string;
  form_data: FormData;
  modul_data: GeneratedSteps | null;
  lkpd_data: LKPDData | null;
  asesmen_data: AsesmenData | null;
  materi_data: MateriData | null;
  bank_soal_data: BankSoalData | null;
  tindak_lanjut_data: TindakLanjutData | null;
  /** Perencanaan tahunan — HANYA disimpan pada row legacy (version 1). */
  prota_data?: ProtaData | null;
  kktp_data?: KKTPData | null;
  prosem_data?: { sem1: ProsemData | null; sem2: ProsemData | null } | null;

  /** Wajib ada (non-null) saat mode `v2`. */
  generation_result_v2?: GenerationResultV2 | null;
}

export interface ContentHistoryWritePayload {
  name: string;
  form_data: Json;
  modul_data: Json | null;
  lkpd_data: Json | null;
  asesmen_data: Json | null;
  materi_data: Json | null;
  bank_soal_data: Json | null;
  tindak_lanjut_data: Json | null;
  prota_data: Json | null;
  kktp_data: Json | null;
  prosem_data: Json | null;
  generation_result_v2: Json | null;
  content_schema_version: number;
}

const asJson = <T,>(v: T | null | undefined): Json | null =>
  (v ?? null) as unknown as Json | null;

/**
 * Bangun payload final yang dikirim ke Supabase. Berlaku identik untuk INSERT
 * dan UPDATE sehingga perpindahan lintas versi (legacy → V2 dan V2 → legacy)
 * selalu membersihkan kolom mode lawan.
 */
export const buildContentHistoryWritePayload = (
  mode: ContentHistoryWriteMode,
  params: ContentHistoryWriteParams,
): ContentHistoryWritePayload => {
  if (mode === 'v2') {
    if (!params.generation_result_v2) {
      throw new Error('Mode V2 membutuhkan generation_result_v2');
    }
    return {
      name: params.name,
      form_data: params.form_data as unknown as Json,
      // Kolom dokumen legacy WAJIB null: state legacy lama di memori tidak
      // boleh bocor ke row V2.
      modul_data: null,
      lkpd_data: null,
      asesmen_data: null,
      materi_data: null,
      bank_soal_data: null,
      tindak_lanjut_data: null,
      // Perencanaan tahunan bukan bagian paket Dokumen per Pertemuan.
      prota_data: null,
      kktp_data: null,
      prosem_data: null,
      generation_result_v2: serializeGenerationResultV2(
        params.generation_result_v2,
      ) as unknown as Json,
      content_schema_version: CONTENT_SCHEMA_VERSION_V2,
    };
  }



  return {
    name: params.name,
    form_data: params.form_data as unknown as Json,
    modul_data: asJson(params.modul_data),
    lkpd_data: asJson(params.lkpd_data),
    asesmen_data: asJson(params.asesmen_data),
    materi_data: asJson(params.materi_data),
    bank_soal_data: asJson(params.bank_soal_data),
    tindak_lanjut_data: asJson(params.tindak_lanjut_data),
    // Row legacy: perilaku lama dipertahankan, planning tetap tersimpan.
    prota_data: asJson(params.prota_data),
    kktp_data: asJson(params.kktp_data),
    prosem_data: asJson(params.prosem_data),
    // Row legacy tidak boleh menyisakan payload V2 dari versi sebelumnya.
    generation_result_v2: null,
    content_schema_version: CONTENT_SCHEMA_VERSION_LEGACY,
  };
};
