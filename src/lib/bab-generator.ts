// Orchestrator generate untuk mode hierarki Bab → Submateri → Pertemuan.
// Iterasi berurutan supaya context-passing (previousSummary) bisa mengalir.
// ADDITIVE: tidak dipanggil dari flow lama. Aman untuk diimpor tanpa efek samping.

import type {
  BabResult,
  FormData,
  PertemuanDocs,
  PertemuanSummary,
  StrukturHierarki,
  SubmateriResult,
  PertemuanDataDetail,
  LKPDData,
  AsesmenData,
  MateriData,
  TindakLanjutData,
  BankSoalData,
} from '@/types/modul';
import { invokeGenerateWithRetry } from '@/lib/invokeWithRetry';
import { buildPertemuanSummary, serializeSummaries } from '@/lib/pertemuan-summary';

export interface GenerateProgress {
  phase:
    | 'modul'
    | 'lkpd'
    | 'refleksi'
    | 'materi'
    | 'asesmen'
    | 'bankSoal'
    | 'done';
  submateriId?: string;
  pertemuanId?: string;
  currentCall: number;
  totalCalls: number;
  message: string;
}

export interface GenerateOptions {
  formData: FormData;
  struktur: StrukturHierarki;
  onProgress?: (p: GenerateProgress) => void;
  onPartial?: (result: BabResult) => void;
  /** Signal untuk membatalkan. */
  isCancelled?: () => boolean;
}

const emptyBabResult = (babId: string): BabResult => ({
  babId,
  submateri: {},
  contextSummary: {},
});

const emptySubmateri = (submateriId: string): SubmateriResult => ({
  submateriId,
  pertemuanDocs: {},
});

/**
 * Generate satu Bab lengkap sesuai StrukturHierarki + toggles.
 * Sekuensial demi konteks — throughput ditukar untuk kualitas kesinambungan.
 */
export async function generateBab(opts: GenerateOptions): Promise<BabResult> {
  const { formData, struktur, onProgress, onPartial, isCancelled } = opts;
  const { bab, toggleMateriPerPertemuan, toggleAsesmenPerPertemuan } = struktur;

  const totalPertemuan = bab.submateri.reduce((n, s) => n + s.pertemuan.length, 0);
  const totalSubmateri = bab.submateri.length;
  const totalCalls =
    1 + // preface Bab
    totalPertemuan * 3 +
    (toggleMateriPerPertemuan ? totalPertemuan : totalSubmateri) +
    (toggleAsesmenPerPertemuan ? totalPertemuan : totalSubmateri) +
    1;

  const result = emptyBabResult(bab.id);
  const summariesInOrder: PertemuanSummary[] = [];
  let currentCall = 0;

  const step = (phase: GenerateProgress['phase'], message: string, extra: Partial<GenerateProgress> = {}) => {
    currentCall += 1;
    onProgress?.({ phase, currentCall, totalCalls, message, ...extra });
  };

  const checkCancel = () => {
    if (isCancelled?.()) throw new Error('CANCELLED');
  };

  // ============ 0) PREFACE BAB — sekali panggil type "modul" ============
  // Ambil field top-level (identifikasi_murid, jenis_pengetahuan, pemahaman_bermakna,
  // dll.) lalu buang pertemuan[]-nya. Bagian pertemuan diisi oleh loop di bawah.
  step('modul', `Preface Bab ${bab.judul || ''}`);
  const firstPert = bab.submateri[0]?.pertemuan[0];
  const prefaceResp = await invokeGenerateWithRetry({
    type: 'modul',
    data: {
      ...formData,
      materi: formData.materi || bab.judul,
      subMateri: bab.submateri[0]?.judul || formData.subMateri,
      pertemuan: [
        {
          nomorPertemuan: 1,
          durasi: firstPert?.durasi || '90',
        },
      ],
    },
  });
  if (prefaceResp.data?.error) throw new Error(prefaceResp.data.error);
  const prefacePayload = prefaceResp.data?.data ?? prefaceResp.data;
  result.modulPreface = {
    pemahaman_bermakna: prefacePayload?.pemahaman_bermakna,
    auto_generated: prefacePayload?.auto_generated,
  };
  onPartial?.(structuredClone(result));

  // Nomor pertemuan global (1..N) — melintasi submateri
  let globalNomor = 0;

  for (const sub of bab.submateri) {
    checkCancel();
    result.submateri[sub.id] = emptySubmateri(sub.id);
    const subResult = result.submateri[sub.id];

    for (const pert of sub.pertemuan) {
      checkCancel();
      globalNomor += 1;
      const pertemuanTarget = { nomorPertemuan: globalNomor, durasi: pert.durasi };
      const previousSummary = serializeSummaries(summariesInOrder);
      const docs: PertemuanDocs = { pertemuanId: pert.id };

      // 1) MODUL (per-pertemuan)
      step('modul', `Modul pertemuan ${globalNomor} (${sub.judul})`, {
        submateriId: sub.id,
        pertemuanId: pert.id,
      });
      const modulResp = await invokeGenerateWithRetry({
        type: 'modul-pertemuan',
        data: {
          ...formData,
          materi: formData.materi || bab.judul,
          subMateri: sub.judul,
          pertemuanIndex: globalNomor - 1,
          pertemuanTarget,
          totalPertemuan,
          previousSummary,
        },
      });
      if (modulResp.data?.error) throw new Error(modulResp.data.error);
      const modulPayload = modulResp.data?.data ?? modulResp.data;
      const modul: PertemuanDataDetail | undefined =
        modulPayload?.pertemuan?.[0] ?? modulPayload;
      if (!modul || !(modul as any).tahap_awal) {
        throw new Error(`Gagal generate modul pertemuan ${globalNomor}`);
      }
      docs.modul = { ...modul, nomorPertemuan: globalNomor, durasi: pert.durasi };

      // 2) LKPD
      step('lkpd', `LKPD pertemuan ${globalNomor}`, {
        submateriId: sub.id,
        pertemuanId: pert.id,
      });
      const lkpdResp = await invokeGenerateWithRetry({
        type: 'lkpd',
        data: {
          ...formData,
          materi: formData.materi || bab.judul,
          subMateri: sub.judul,
          pertemuanFokus: globalNomor,
          previousSummary,
        },
      });
      if (lkpdResp.data?.error) throw new Error(lkpdResp.data.error);
      docs.lkpd = (lkpdResp.data?.data ?? lkpdResp.data) as LKPDData;

      // 3) REFLEKSI
      step('refleksi', `Refleksi pertemuan ${globalNomor}`, {
        submateriId: sub.id,
        pertemuanId: pert.id,
      });
      const reflResp = await invokeGenerateWithRetry({
        type: 'tindakLanjut',
        data: {
          ...formData,
          materi: formData.materi || bab.judul,
          subMateri: sub.judul,
          pertemuanFokus: globalNomor,
          previousSummary,
        },
      });
      if (reflResp.data?.error) throw new Error(reflResp.data.error);
      docs.refleksi = (reflResp.data?.data ?? reflResp.data) as TindakLanjutData;

      // 4) MATERI per pertemuan (opsional)
      if (toggleMateriPerPertemuan) {
        step('materi', `Materi pertemuan ${globalNomor}`, {
          submateriId: sub.id,
          pertemuanId: pert.id,
        });
        const matResp = await invokeGenerateWithRetry({
          type: 'materi',
          data: {
            ...formData,
            materi: formData.materi || bab.judul,
            subMateri: sub.judul,
            pertemuanFokus: globalNomor,
            previousSummary,
          },
        });
        if (matResp.data?.error) throw new Error(matResp.data.error);
        docs.materi = (matResp.data?.data ?? matResp.data) as MateriData;
      }

      // 5) ASESMEN per pertemuan (opsional)
      if (toggleAsesmenPerPertemuan) {
        step('asesmen', `Asesmen pertemuan ${globalNomor}`, {
          submateriId: sub.id,
          pertemuanId: pert.id,
        });
        const asesResp = await invokeGenerateWithRetry({
          type: 'asesmen',
          data: {
            ...formData,
            materi: formData.materi || bab.judul,
            subMateri: sub.judul,
            pertemuanFokus: globalNomor,
            previousSummary,
          },
        });
        if (asesResp.data?.error) throw new Error(asesResp.data.error);
        docs.asesmen = (asesResp.data?.data ?? asesResp.data) as AsesmenData;
      }

      subResult.pertemuanDocs[pert.id] = docs;

      // Build & simpan ringkasan untuk pertemuan berikutnya
      const summary = buildPertemuanSummary(docs.modul, {
        pertemuanId: pert.id,
        submateriJudul: sub.judul,
        tujuanPembelajaran: formData.tujuanPembelajaran,
        refleksi: docs.refleksi,
      });
      summariesInOrder.push(summary);
      result.contextSummary[pert.id] = summary;

      onPartial?.(structuredClone(result));
    }

    // MATERI global per submateri (jika toggle off)
    if (!toggleMateriPerPertemuan) {
      checkCancel();
      step('materi', `Materi submateri ${sub.judul}`, { submateriId: sub.id });
      const matResp = await invokeGenerateWithRetry({
        type: 'materi',
        data: {
          ...formData,
          materi: formData.materi || bab.judul,
          subMateri: sub.judul,
          previousSummary: serializeSummaries(summariesInOrder),
        },
      });
      if (matResp.data?.error) throw new Error(matResp.data.error);
      subResult.materiGlobal = (matResp.data?.data ?? matResp.data) as MateriData;
      onPartial?.(structuredClone(result));
    }

    // ASESMEN global per submateri (jika toggle off)
    if (!toggleAsesmenPerPertemuan) {
      checkCancel();
      step('asesmen', `Asesmen submateri ${sub.judul}`, { submateriId: sub.id });
      const asesResp = await invokeGenerateWithRetry({
        type: 'asesmen',
        data: {
          ...formData,
          materi: formData.materi || bab.judul,
          subMateri: sub.judul,
          previousSummary: serializeSummaries(summariesInOrder),
        },
      });
      if (asesResp.data?.error) throw new Error(asesResp.data.error);
      subResult.asesmenGlobal = (asesResp.data?.data ?? asesResp.data) as AsesmenData;
      onPartial?.(structuredClone(result));
    }
  }

  // BANK SOAL — 1 per Bab
  checkCancel();
  step('bankSoal', `Bank Soal Bab ${bab.judul}`);
  const bankResp = await invokeGenerateWithRetry({
    type: 'bankSoal',
    data: {
      ...formData,
      materi: formData.materi || bab.judul,
      previousSummary: serializeSummaries(summariesInOrder),
    },
  });
  if (bankResp.data?.error) throw new Error(bankResp.data.error);
  result.bankSoal = (bankResp.data?.data ?? bankResp.data) as BankSoalData;

  onProgress?.({
    phase: 'done',
    currentCall: totalCalls,
    totalCalls,
    message: 'Selesai',
  });
  onPartial?.(structuredClone(result));
  return result;
}
