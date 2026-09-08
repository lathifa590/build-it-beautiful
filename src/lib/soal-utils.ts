import type { SoalItem } from '@/types/modul';

export function isEnglishSubject(mapel?: string | null): boolean {
  return /bahasa\s*inggris|english/i.test(mapel || '');
}

/**
 * Mendapatkan rentang indeks soal (1-based) untuk stimulus tertentu.
 * Jika stimulusId undefined, asumsikan stimulus global yang mencakup semua soal.
 */
export function getQuestionRange(soalList: SoalItem[], currentIndex: number | null): { start: number; end: number } | null {
  if (!soalList || soalList.length === 0) return null;

  if (currentIndex === null) {
    // Global stimulus: find all questions that don't have a specific stimulus_id
    const indices = soalList
      .map((s, idx) => (s.stimulus_id == null ? idx + 1 : -1))
      .filter((idx) => idx !== -1);
    
    if (indices.length === 0) return null;
    return { start: Math.min(...indices), end: Math.max(...indices) };
  }

  const targetId = soalList[currentIndex]?.stimulus_id;
  if (targetId == null) return null;

  let startIdx = currentIndex;
  let endIdx = currentIndex;

  // Scan backwards for contiguous block
  while (startIdx > 0 && soalList[startIdx - 1].stimulus_id === targetId) {
    startIdx--;
  }

  // Scan forwards for contiguous block
  while (endIdx < soalList.length - 1 && soalList[endIdx + 1].stimulus_id === targetId) {
    endIdx++;
  }

  return {
    start: startIdx + 1, // 1-based numbering
    end: endIdx + 1,
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
