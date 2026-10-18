import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalisasi tampilan kelas agar tidak terjadi duplikasi kata "Kelas" (e.g. "Kelas Kelas VI" -> "Kelas VI").
 */
export function formatGrade(grade?: string | number | null): string {
  if (grade === undefined || grade === null) return '';
  const str = String(grade).trim();
  if (!str) return '';
  if (/^kelas\b/i.test(str)) {
    return str.replace(/^(?:kelas\s*)+/i, 'Kelas ');
  }
  return `Kelas ${str}`;
}

/**
 * Membersihkan kata awalan "Kelas" agar nilai yang disimpan konsisten (e.g. "Kelas VI" -> "VI").
 */
export function cleanGrade(grade?: string | number | null): string {
  if (grade === undefined || grade === null) return '';
  return String(grade).trim().replace(/^(?:kelas\s*)+/i, '').trim();
}

