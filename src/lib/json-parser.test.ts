import { describe, it, expect } from 'vitest';
import {
  sanitizeJsonResponse,
  extractJsonFromResponse,
  parseGeneratedJson,
} from '../../supabase/functions/_shared/json-parser';

describe('Prioritas 3: Sanitasi & Parser JSON Hasil AI (json-parser.ts)', () => {
  describe('1. Preservasi Rumus Matematika / Fisika (LaTeX)', () => {
    it('mempertahankan perintah LaTeX standar (\\frac, \\theta, \\times, \\sqrt, \\pi)', () => {
      const raw = '```json\n{"rumus": "\\frac{1}{2} \\times \\theta + \\sqrt{x} = \\pi"}\n```';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        rumus: '\\frac{1}{2} \\times \\theta + \\sqrt{x} = \\pi',
      });
    });

    it('menangani perintah LaTeX lanjutan berawalan b, f, r, t (\\tfrac, \\tanh, \\boldsymbol, \\bullet, \\rho)', () => {
      const raw = '{"rumus": "\\tfrac{1}{2} + \\tanh(x) + \\boldsymbol{F} = m \\cdot \\boldsymbol{a} + \\rho" }';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        rumus: '\\tfrac{1}{2} + \\tanh(x) + \\boldsymbol{F} = m \\cdot \\boldsymbol{a} + \\rho',
      });
    });

    it('menangani perintah LaTeX berawalan u (\\underline, \\upsilon, \\uparrow) tanpa memicu Bad Unicode Escape', () => {
      const raw = '{"rumus": "\\underline{x} + \\upsilon + \\uparrow" }';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        rumus: '\\underline{x} + \\upsilon + \\uparrow',
      });
    });

    it('menangani perintah LaTeX berawalan n (\\nabla, \\neq, \\notin, \\newline, \\norm)', () => {
      const raw = '{"rumus": "\\nabla \\cdot E = 0, a \\neq b, x \\notin A, \\norm{v}" }';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        rumus: '\\nabla \\cdot E = 0, a \\neq b, x \\notin A, \\norm{v}',
      });
    });

    it('mempertahankan escape unicode JSON valid (\\u0041 untuk huruf A)', () => {
      const raw = '{"karakter": "\\u0041" }';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        karakter: 'A',
      });
    });
  });

  describe('2. Sanitasi Karakter Kontrol & Format String', () => {
    it('mempertahankan newline valid (\\n) yang diikuti teks biasa', () => {
      const raw = '{"deskripsi": "Baris 1\\nNama Siswa: Budi\\nKelas: 7" }';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed.deskripsi).toContain('Baris 1\nNama Siswa: Budi\nKelas: 7');
    });

    it('membersihkan literal newline & tab mentah di dalam respons AI', () => {
      const raw = '{\n  "judul": "Modul Ajar\tBahasa Indonesia\nKelas 7"\n}';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed.judul).toBe('Modul Ajar Bahasa Indonesia Kelas 7');
    });
  });

  describe('3. Ekstraksi JSON dari Respon Percakapan LLM', () => {
    it('mengekstrak JSON objek murni dari teks pengantar dan penutup prose', () => {
      const raw = `Tentu! Berikut adalah modul ajar yang Anda minta:
\`\`\`json
{
  "mataPelajaran": "Matematika",
  "kelas": "VII",
  "alokasiWaktu": "2 JP"
}
\`\`\`
Semoga rancangan modul ini membantu proses pembelajaran!`;

      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        mataPelajaran: 'Matematika',
        kelas: 'VII',
        alokasiWaktu: '2 JP',
      });
    });

    it('mengekstrak JSON array ketika output dibungkus markdown code fence', () => {
      const raw = '```json\n[{"id": 1, "tujuan": "Memahami teks naratif"}, {"id": 2, "tujuan": "Menganalisis tokoh"}]\n```';
      const res = parseGeneratedJson(raw);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toHaveLength(2);
      expect(res.parsed[0].id).toBe(1);
    });
  });

  describe('4. Perbaikan Respons AI Terpotong (Truncated JSON Repair)', () => {
    it('memperbaiki JSON yang terpotong dengan tanda elipsis (...) dari AI', () => {
      const truncated = '{"kegiatan": [{"no": 1, "nama": "Apersepsi"}, ...';
      const res = parseGeneratedJson(truncated);
      expect(res.error).toBeUndefined();
      expect(res.parsed).toEqual({
        kegiatan: [{ no: 1, nama: 'Apersepsi' }],
      });
    });

    it('menutup objek dan array yang belum tertutup akibat batas token (unclosed braces)', () => {
      const truncated = '{"modul": {"tahap_inti": {"kegiatan": [{"nama": "Diskusi kelompok"';
      const res = parseGeneratedJson(truncated);
      expect(res.error).toBeUndefined();
      expect(res.parsed.modul.tahap_inti.kegiatan[0].nama).toBe('Diskusi kelompok');
    });

    it('menghapus trailing comma di akhir respons terpotong', () => {
      const truncated = '{"daftar": ["item1", "item2",';
      const res = parseGeneratedJson(truncated);
      expect(res.error).toBeUndefined();
      expect(res.parsed.daftar).toEqual(['item1', 'item2']);
    });

    it('membersihkan nilai terpotong di tengah penulisan string (trailing incomplete string)', () => {
      const truncated = '{"judul": "Modul Ajar", "deskripsi": "Pembelajaran ini bertuj';
      const res = parseGeneratedJson(truncated);
      expect(res.error).toBeUndefined();
      expect(res.parsed.judul).toBe('Modul Ajar');
      expect(res.parsed.deskripsi).toBe('');
    });
  });

  describe('5. Fallback Regex Penyelamat (Emergency CP Extractor)', () => {
    it('dapat menyelamatkan cp_kontekstual jika JSON rusak total dan tidak bisa diperbaiki', () => {
      const broken = 'Maaf server terputus... cp_kontekstual: "Peserta didik mampu memahami teks eksposisi secara kritis" dan selesai.';
      const res = parseGeneratedJson(broken);
      expect(res.parsed).toEqual({
        cp_kontekstual: 'Peserta didik mampu memahami teks eksposisi secara kritis',
      });
    });
  });
});
