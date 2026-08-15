/**
 * Shared helpers for Bank Soal rendering (Preview + Word HTML + DOCX + PDF).
 *
 * Keeps a single source of truth for:
 * - answer-line count for essay/short-answer questions
 * - grouping of soal types (objective vs complex vs matching vs short vs essay)
 *
 * These helpers work purely from existing SoalItem fields — no schema changes.
 */
import type { SoalItem } from '@/types/modul';

export type SoalGroup = 'pg' | 'complex' | 'menjodohkan' | 'isian' | 'uraian' | 'other';

/** Group a soal by its printed layout & answer-key style. */
export const classifySoal = (s: Pick<SoalItem, 'tipe'>): SoalGroup => {
  const t = (s.tipe || '').toLowerCase();
  if (t === 'pilihan ganda') return 'pg';
  if (t.startsWith('pg ')) return 'complex'; // PG Kategori BS, PG MCMA
  if (t.includes('menjodohkan')) return 'menjodohkan';
  if (t.includes('isian')) return 'isian';
  if (t.includes('uraian') || t.includes('essay')) return 'uraian';
  return 'other';
};

const LONG_ANSWER_VERBS =
  /\b(analisis(?:lah|kan)?|jelaskan\s+secara\s+lengkap|jelaskan\s+dengan\s+lengkap|jelaskan\s+dan\s+berikan\s+alasan|jelaskan\s+mengapa|bandingkan|evaluasi(?:lah|kan)?|buktikan(?:lah)?|uraikan(?:lah)?|kembangkan|susunlah|deskripsikan\s+secara\s+lengkap|rancang(?:lah|kan)?|simpulkan(?:lah)?)\b/i;

const MEDIUM_ANSWER_VERBS =
  /\b(jelaskan|deskripsikan|hitunglah|hitung|tentukan|tunjukkan|sebutkan\s+dan\s+jelaskan|bagaimana)\b/i;

/**
 * Fallback: determine number of writing lines for the printed answer area.
 * Bounded to 1..8. Uses tipe, skor, question verbs, and kunci length.
 */
export const computeAnswerLines = (s: SoalItem): number => {
  const group = classifySoal(s);
  if (group === 'isian') return 1;
  if (group !== 'uraian') return 0;

  const skor = Number(s.skor || 0);
  const q = String(s.pertanyaan || '');
  const kunciStr = Array.isArray(s.kunci) ? s.kunci.join(' ') : String(s.kunci || '');
  const kunciLen = kunciStr.trim().length;

  // Base from skor
  let lines = 3;
  if (skor >= 5) lines = 7;
  else if (skor >= 3) lines = 5;
  else lines = 3;

  // Verb-based bumps
  if (LONG_ANSWER_VERBS.test(q)) lines = Math.max(lines, 6);
  else if (MEDIUM_ANSWER_VERBS.test(q) && skor >= 3) lines = Math.max(lines, 5);

  // Long ideal-answer bumps
  if (kunciLen > 400) lines = Math.max(lines, 7);
  else if (kunciLen > 200) lines = Math.max(lines, 6);

  // Clamp
  if (lines < 2) lines = 2;
  if (lines > 8) lines = 8;
  return lines;
};

/** Alternative jawaban parser for Isian Singkat (splits on "/", "|", or " atau "). */
export const parseAlternatifJawaban = (kunci: SoalItem['kunci']): string[] => {
  if (Array.isArray(kunci)) return kunci.map((k) => String(k).trim()).filter(Boolean);
  const raw = String(kunci ?? '').trim();
  if (!raw) return [];
  const parts = raw.split(/\s*(?:\/|\||;|\s+atau\s+)\s*/i).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [raw];
};
