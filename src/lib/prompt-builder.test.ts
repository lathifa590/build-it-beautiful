import { describe, it, expect } from 'vitest';
import { buildHumanPrompt, type AiMode, type PromptType } from './prompt-builder';
import type { FormData } from '@/types/modul';

const mockFormData: FormData = {
  namaPenyusun: 'Budi Santoso, S.Pd',
  nipPenyusun: '198501012010011001',
  sekolah: 'SD Negeri 1 Maju',
  mataPelajaran: 'Pendidikan Pancasila',
  materi: 'Aturan di Lingkungan Sekolah',
  subMateri: 'Kesepakatan Kelas',
  kelas: '1 SD',
  fase: 'A',
  semester: '1 (Ganjil)',
  alokasiWaktu: '2 JP (70 Menit)',
  modelPembelajaran: 'Project Based Learning (PjBL)',
  tujuanPembelajaran: 'Peserta didik dapat mengidentifikasi aturan di sekolah.',
  capaianPembelajaran: 'Memahami aturan dan norma dalam kehidupan sehari-hari.',
  aspekPengetahuanAwal: 'Mengenal kebiasaan tertib',
  aspekMinat: 'Suka menggambar dan bercerita',
  aspekLatarBelakang: 'Beragam suku bangsa',
  aspekKebutuhanBelajar: 'Visual dan kinestetik',
  nilaiKarakter: ['Bernalar Kritis', 'Kreatif', 'Gotong Royong'],
  dimensiProfilLulusan: ['DPL 2', 'DPL 3'],
  kaitanKehidupan: 'Menjaga kenyamanan belajar di kelas',
  pertemuan: [
    { nomorPertemuan: 1, durasi: '70' },
  ],
  kurikulum: 'merdeka',
};

describe('prompt-builder — penghapusan teks SEKSI dan optimasi heading docx', () => {
  const aiModes: AiMode[] = ['claude', 'chatgpt', 'gemini', 'universal'];

  it.each(aiModes)(
    'tidak boleh memunculkan judul heading berawalan "SEKSI" pada mode %s untuk modul ajar',
    (mode) => {
      const prompt = buildHumanPrompt('modul', mockFormData, undefined, mode);

      // Pastikan tidak ada judul bagian seperti "SEKSI I", "SEKSI II", "SEKSI HEADER", dll
      expect(prompt).not.toMatch(/SEKSI\s+[IVXLCDM]+/i);
      expect(prompt).not.toMatch(/SEKSI\s+HEADER/i);
      expect(prompt).not.toMatch(/urutan\s+seksi/i);
      expect(prompt).not.toMatch(/(?:^|\n)\s*SEKSI\s+/i);

      // Pastikan heading angka Romawi bersih ada di dalam prompt
      expect(prompt).toContain('I. IDENTITAS DOKUMEN');
      expect(prompt).toContain('II. IDENTIFIKASI MURID');
      expect(prompt).toContain('III. JENIS PENGETAHUAN MATERI');
      expect(prompt).toContain('IV. INTEGRASI NILAI & KARAKTER');
      expect(prompt).toContain('V. DIMENSI PROFIL LULUSAN');
      expect(prompt).toContain('VI. DESAIN PEMBELAJARAN');
      expect(prompt).toContain('VII. LINTAS DISIPLIN ILMU');
      expect(prompt).toContain('VIII. KEMITRAAN PEMBELAJARAN');
      expect(prompt).toContain('IX. LINGKUNGAN PEMBELAJARAN');
      expect(prompt).toContain('X. PEMANFAATAN TEKNOLOGI DIGITAL');
      expect(prompt).toContain('XI. LANGKAH-LANGKAH PEMBELAJARAN');
      expect(prompt).toContain('XII. PENILAIAN');
      expect(prompt).toContain('LEMBAR PENGESAHAN');

      // Pastikan ada aturan larangan eksplisit penulisan kata "SEKSI"
      expect(prompt).toMatch(/DILARANG.*SEKSI/i);
    }
  );

  it('menyertakan V-B. TOPIK PANCA CINTA (KBC) jika kurikulum adalah kbc', () => {
    const kbcFormData: FormData = {
      ...mockFormData,
      kurikulum: 'kbc',
    };
    const prompt = buildHumanPrompt('modul', kbcFormData, undefined, 'gemini');

    expect(prompt).toContain('V-B. TOPIK PANCA CINTA (KBC)');
    expect(prompt).toContain('Kurikulum Berbasis Cinta (KBC)');
    expect(prompt).not.toMatch(/SEKSI\s+[IVXLCDM]+/i);
    expect(prompt).not.toMatch(/(?:^|\n)\s*SEKSI\s+/i);
  });

  it('memuat larangan kata SEKSI pada tipe konten non-modul (LKPD, Asesmen, Bank Soal, dll)', () => {
    const nonModulTypes: PromptType[] = ['lkpd', 'asesmen', 'materi', 'soal', 'refleksi'];
    for (const type of nonModulTypes) {
      const promptGemini = buildHumanPrompt(type, mockFormData, undefined, 'gemini');
      expect(promptGemini).toMatch(/DILARANG.*SEKSI/i);
      expect(promptGemini).not.toMatch(/SEKSI\s+[IVXLCDM]+/i);
      expect(promptGemini).not.toMatch(/(?:^|\n)\s*SEKSI\s+/i);

      const promptClaude = buildHumanPrompt(type, mockFormData, undefined, 'claude');
      expect(promptClaude).toMatch(/DILARANG.*SEKSI/i);

      const promptChatGPT = buildHumanPrompt(type, mockFormData, undefined, 'chatgpt');
      expect(promptChatGPT).toMatch(/DILARANG.*SEKSI/i);
    }
  });
});
