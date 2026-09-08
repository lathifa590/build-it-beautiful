import type { BankSoalData, SoalConfig } from '@/types/modul';

/**
 * Normalisasi hasil Bank Soal dari AI:
 * Untuk tiap tipe soal yang dikonfigurasi useImages=true dengan imageCount=N,
 * pastikan TEPAT N soal dari tipe tersebut memiliki requires_image=true.
 * Prioritas seleksi: soal yang sudah ditandai AI (requires_image / stimulus_image_prompt),
 * lalu diisi/dipangkas mengikuti urutan asli.
 */
const TYPE_ORDER = [
  'Pilihan Ganda',
  'PG Kategori Benar/Salah',
  'PG Multiple Choice Multiple Answer',
  'Menjodohkan',
  'Isian Singkat',
  'Uraian'
];

/**
 * Normalisasi hasil Bank Soal dari AI:
 * - Mengurutkan soal sesuai TYPE_ORDER agar urutan selalu konsisten (PG pertama, dll).
 * - Menyesuaikan kembali penomoran soal (1 sampai N) agar berurutan.
 * - Untuk tiap tipe soal yang dikonfigurasi useImages=true dengan imageCount=N,
 *   pastikan TEPAT N soal dari tipe tersebut memiliki requires_image=true.
 *   Prioritas seleksi: soal yang sudah ditandai AI (requires_image / stimulus_image_prompt),
 *   lalu diisi/dipangkas mengikuti urutan asli.
 */
export function normalizeBankSoalImages(
  bank: BankSoalData,
  config: SoalConfig,
): BankSoalData {
  if (!bank?.daftar_soal || !config?.typeConfigs) return bank;

  // 1. Sort questions based on TYPE_ORDER
  let sortedSoal = [...bank.daftar_soal];
  sortedSoal.sort((a, b) => {
    const aType = a.tipe || '';
    const bType = b.tipe || '';
    let aIdx = TYPE_ORDER.indexOf(aType);
    let bIdx = TYPE_ORDER.indexOf(bType);
    
    // Fallback to substring matching if exact match fails
    if (aIdx === -1) {
      const aLower = aType.toLowerCase();
      aIdx = TYPE_ORDER.findIndex(t => aLower.includes(t.toLowerCase()));
      if (aIdx === -1) aIdx = 999;
    }
    if (bIdx === -1) {
      const bLower = bType.toLowerCase();
      bIdx = TYPE_ORDER.findIndex(t => bLower.includes(t.toLowerCase()));
      if (bIdx === -1) bIdx = 999;
    }
    
    return aIdx - bIdx;
  });

  // 2. Re-assign numbering (1 to N)
  sortedSoal = sortedSoal.map((s, i) => ({
    ...s,
    no: i + 1
  }));

  // 3. Process requires_image logic on the sorted array
  // Group index soal per tipe
  const byType: Record<string, number[]> = {};
  sortedSoal.forEach((s, i) => {
    const t = s.tipe || '';
    if (!byType[t]) byType[t] = [];
    byType[t].push(i);
  });

  const nextSoal = sortedSoal.map((s) => ({ ...s, requires_image: false as boolean }));

  Object.entries(config.typeConfigs).forEach(([tipe, cfg]) => {
    if (!cfg?.useImages || !cfg.imageCount || cfg.quantity <= 0) return;
    
    let indices = byType[tipe] || [];
    
    // Fallback matching if exact type key is not found in the grouped keys
    if (indices.length === 0) {
      indices = sortedSoal.map((s, idx) => {
          const sType = s.tipe || '';
          if (sType === tipe || sType.toLowerCase().includes(tipe.toLowerCase())) return idx;
          return -1;
      }).filter(idx => idx !== -1);
    }
    
    if (indices.length === 0) return;

    const target = Math.min(cfg.imageCount, indices.length);
    // Prioritaskan yang sudah ditandai AI
    const aiFlagged = indices.filter(
      (i) => sortedSoal[i].requires_image === true || !!sortedSoal[i].stimulus_image_prompt,
    );
    const rest = indices.filter((i) => !aiFlagged.includes(i));
    const chosen = [...aiFlagged, ...rest].slice(0, target);

    chosen.forEach((i) => {
      nextSoal[i].requires_image = true;
    });
  });

  return { ...bank, daftar_soal: nextSoal };
}
