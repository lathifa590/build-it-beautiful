import type { BankSoalData, SoalConfig } from '@/types/modul';

/**
 * Normalisasi hasil Bank Soal dari AI:
 * Untuk tiap tipe soal yang dikonfigurasi useImages=true dengan imageCount=N,
 * pastikan TEPAT N soal dari tipe tersebut memiliki requires_image=true.
 * Prioritas seleksi: soal yang sudah ditandai AI (requires_image / stimulus_image_prompt),
 * lalu diisi/dipangkas mengikuti urutan asli.
 */
export function normalizeBankSoalImages(
  bank: BankSoalData,
  config: SoalConfig,
): BankSoalData {
  if (!bank?.daftar_soal || !config?.typeConfigs) return bank;

  // Group index soal per tipe
  const byType: Record<string, number[]> = {};
  bank.daftar_soal.forEach((s, i) => {
    const t = s.tipe || '';
    if (!byType[t]) byType[t] = [];
    byType[t].push(i);
  });

  const nextSoal = bank.daftar_soal.map((s) => ({ ...s, requires_image: false as boolean }));

  Object.entries(config.typeConfigs).forEach(([tipe, cfg]) => {
    if (!cfg?.useImages || !cfg.imageCount || cfg.quantity <= 0) return;
    const indices = byType[tipe] || [];
    if (indices.length === 0) return;

    const target = Math.min(cfg.imageCount, indices.length);
    // Prioritaskan yang sudah ditandai AI
    const aiFlagged = indices.filter(
      (i) => bank.daftar_soal[i].requires_image === true || !!bank.daftar_soal[i].stimulus_image_prompt,
    );
    const rest = indices.filter((i) => !aiFlagged.includes(i));
    const chosen = [...aiFlagged, ...rest].slice(0, target);

    chosen.forEach((i) => {
      nextSoal[i].requires_image = true;
    });
  });

  return { ...bank, daftar_soal: nextSoal };
}
