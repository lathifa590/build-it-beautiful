import type { SoalItem } from '@/types/modul';

export function isEnglishSubject(mapel?: string | null): boolean {
  return /bahasa\s*inggris|english/i.test(mapel || '');
}

/**
 * Mendapatkan rentang indeks soal (1-based) untuk stimulus tertentu.
 * Jika stimulusId undefined, asumsikan stimulus global yang mencakup semua soal.
 */
export function getQuestionRange(soalList: SoalItem[], stimulusId?: number | string | null): { start: number; end: number } | null {
  if (!soalList || soalList.length === 0) return null;

  const indices = soalList
    .map((s, idx) => {
      // Cocokkan jika sama-sama null (Teks Global) ATAU jika stimulus_id cocok
      const isMatch = (stimulusId == null && s.stimulus_id == null) || (s.stimulus_id == stimulusId);
      return isMatch ? idx + 1 : -1;
    })
    .filter((idx) => idx !== -1);

  if (indices.length === 0) return null;

  return {
    start: Math.min(...indices),
    end: Math.max(...indices),
  };
}

/**
 * Menghasilkan instruksi bacaan secara dinamik (B. Inggris atau B. Indonesia).
 */
export function getStimulusInstruction(isEnglish: boolean, range: { start: number; end: number } | null): string {
  if (!range) {
    return isEnglish
      ? 'Read the following text for the next questions!'
      : 'Bacalah teks berikut untuk menjawab soal-soal berikutnya!';
  }

  if (range.start === range.end) {
    return isEnglish
      ? `Text for question number ${range.start}`
      : `Teks untuk Soal no. ${range.start}`;
  }

  return isEnglish
    ? `Text for questions number ${range.start} - ${range.end}`
    : `Teks untuk Soal no. ${range.start} s.d no. ${range.end}`;
}
