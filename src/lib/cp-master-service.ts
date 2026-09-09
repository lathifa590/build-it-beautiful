import masterDatabase from '@/data/cp_database_master_2025.json';
import { resolveMapelCP, FallbackInfo } from './cp-mapel-mapping';

export interface MasterCPFase {
  fase: string;
  kelas: string;
  elemen: Record<string, string>;
}

export interface MasterCPMapel {
  nama: string;
  capaian_per_fase: MasterCPFase[];
}

export interface MasterCPCategory {
  kategori: string;
  mata_pelajaran: MasterCPMapel[];
}

export interface MasterCPQueryResult {
  kategori: string;
  mataPelajaran: string;
  faseCode: string;
  kelas: string;
  elemen: Array<{ nama: string; teks: string }>;
  isFallback: boolean;
  fallbackInfo?: FallbackInfo;
  source: 'master_bskap_046_2025';
}

/**
 * Searches cp_database_master_2025.json (Keputusan Kepala BSKAP No. 046/H/KR/2025)
 * as the Single Source of Truth (SSOT).
 * 
 * Follows the 4-step reading guidelines:
 * 1. Filter Kategori (if category hint provided)
 * 2. Search Mata Pelajaran (with alias and smart fallback mapping support)
 * 3. Filter Fase & Kelas
 * 4. Extract Elemen (preserving scientific context exactly)
 */
export function queryMasterCPDatabase(
  mataPelajaran: string,
  fase: string,
  kategoriHint?: string
): MasterCPQueryResult | null {
  if (!mataPelajaran || !fase) return null;

  // Check smart fallback first (e.g. Fisika/Kimia/Biologi on Fase E -> IPA Fase E)
  const resolved = resolveMapelCP(mataPelajaran, fase);
  const targetMapelNama = (resolved?.fallbackInfo?.parentMapelName || mataPelajaran).trim().toLowerCase();
  const isFallback = Boolean(resolved?.isFallback);
  const fallbackInfo = resolved?.fallbackInfo;

  const rawInput = mataPelajaran.trim().toLowerCase();
  const normalizedFase = fase.trim().toUpperCase().replace(/^FASE\s*/i, '');

  const categories = masterDatabase as MasterCPCategory[];

  // 1. Filter Kategori if hint provided, otherwise search all categories
  let targetCategories = categories;
  if (kategoriHint) {
    const hint = kategoriHint.trim().toLowerCase();
    const filtered = categories.filter((c) => c.kategori.toLowerCase().includes(hint));
    if (filtered.length > 0) {
      targetCategories = filtered;
    }
  }

function matchesMapelName(dbName: string, queryName: string): boolean {
  const normDb = dbName.toLowerCase().trim();
  const normQuery = queryName.toLowerCase().trim();

  if (normDb === normQuery) return true;
  if (normDb.includes(normQuery) || normQuery.includes(normDb)) return true;

  const allQueryTokens = normQuery.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  const allDbTokens = normDb.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  if (allQueryTokens.some((t) => allDbTokens.includes(t) && (t === 'ipa' || t === 'ips' || t === 'pjok' || t === 'ppkn'))) {
    return true;
  }

  const dbWords = normDb.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const queryWords = normQuery.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const matchCount = queryWords.filter((w) => dbWords.includes(w)).length;
  if (matchCount >= 2) return true;
  if (queryWords.length === 1 && matchCount === 1) return true;

  return false;
}

  // 2. Search Mata Pelajaran
  for (const cat of targetCategories) {
    for (const mp of cat.mata_pelajaran) {
      const isMatch = matchesMapelName(mp.nama, rawInput) || matchesMapelName(mp.nama, targetMapelNama);

      if (!isMatch) continue;

      // 3. Filter Fase & Kelas
      const foundFase = mp.capaian_per_fase.find((f) => {
        const fName = f.fase.toUpperCase();
        const fLetters = fName.split(/[^A-Z]/).filter(Boolean);

        // Direct code match (e.g. "E" in ["E", "IPA"] or "Fondasi")
        if (fLetters.includes(normalizedFase)) return true;
        if (normalizedFase === 'FONDASI' && fName.includes('FONDASI')) return true;

        // Range matches like "A s.d. C" or "A s.d. F"
        if (fName.includes('S.D.')) {
          const rangeParts = fName.split('S.D.').map((s) => s.trim());
          if (rangeParts.length === 2) {
            const startChar = rangeParts[0].slice(-1);
            const endChar = rangeParts[1].slice(0, 1);
            if (
              normalizedFase.length === 1 &&
              normalizedFase >= startChar &&
              normalizedFase <= endChar
            ) {
              return true;
            }
          }
        }

        return false;
      });

      if (!foundFase) continue;

      // 4. Extract Elemen (preserving full text and structure)
      const elements: Array<{ nama: string; teks: string }> = [];
      if (foundFase.elemen && typeof foundFase.elemen === 'object') {
        for (const [nama, teks] of Object.entries(foundFase.elemen)) {
          elements.push({ nama, teks: String(teks) });
        }
      }

      if (elements.length > 0) {
        return {
          kategori: cat.kategori,
          mataPelajaran: mp.nama,
          faseCode: foundFase.fase,
          kelas: foundFase.kelas,
          elemen: elements,
          isFallback,
          fallbackInfo,
          source: 'master_bskap_046_2025',
        };
      }
    }
  }

  return null;
}

/**
 * Returns formatted text showing:
 * Kategori -> Mata Pelajaran -> Fase/Kelas -> Elemen & Deskripsi CP
 */
export function formatMasterCPDetailed(result: MasterCPQueryResult): string {
  let output = `Kategori: ${result.kategori}\n`;
  output += `Mata Pelajaran: ${result.mataPelajaran}\n`;
  output += `Fase/Kelas: Fase ${result.faseCode} (${result.kelas})\n\n`;
  output += `[Elemen Capaian Pembelajaran]\n`;

  for (const el of result.elemen) {
    output += `\n* ${el.nama}:\n${el.teks}\n`;
  }

  return output;
}
