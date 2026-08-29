export type OutputFormat =
  | 'tabel'
  | 'minimalis'
  | 'per-pertemuan'
  | 'ringkasan'
  | 'panduan'
  | 'modular';

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  tabel: 'Tabel Lengkap',
  minimalis: 'Minimalis Bersih',
  'per-pertemuan': 'Per Pertemuan',
  ringkasan: 'Ringkasan 1 Halaman',
  panduan: 'Panduan Mengajar',
  modular: 'Modular',
};

export const OUTPUT_FORMAT_DESCRIPTIONS: Record<OutputFormat, string> = {
  tabel: 'Format resmi, semua konten berada di dalam tabel',
  minimalis: 'Heading & bullet, lebih bersih dan mudah dibaca (tanpa tabel)',
  'per-pertemuan': 'Terpisah jelas tiap pertemuan (dengan page break)',
  ringkasan: 'Executive summary untuk administrasi/kepala sekolah',
  panduan: 'Checklist ringkas untuk dibawa ke kelas (Print-friendly)',
  modular: 'LKPD, Asesmen & Soal terpisah halaman',
};
