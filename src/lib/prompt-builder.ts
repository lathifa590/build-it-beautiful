import type { FormData, SoalConfig } from '@/types/modul';
import { buildIntegrationBlock } from './program-integrations';


export type PromptType = 'modul' | 'lkpd' | 'asesmen' | 'materi' | 'soal' | 'refleksi';
export type AiMode = 'universal' | 'claude' | 'chatgpt' | 'gemini';

export const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  modul: 'Modul Ajar',
  lkpd: 'LKPD',
  asesmen: 'Asesmen',
  materi: 'Materi Ajar',
  soal: 'Bank Soal',
  refleksi: 'Refleksi & Tindak Lanjut',
};

export const AI_MODE_LABELS: Record<AiMode, string> = {
  universal: 'Universal',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
};

export const AI_MODE_INFO: Record<AiMode, string> = {
  universal: 'Format tabel Markdown — kompatibel di semua AI',
  claude: 'Langsung menghasilkan file Word (.docx) siap unduh',
  chatgpt: 'Langsung menghasilkan file Word (.docx) siap unduh',
  gemini: 'Langsung menghasilkan file Word (.docx) siap unduh',
};

export const AI_MODE_TIPS: Record<AiMode, string> = {
  universal: 'Paste prompt ini ke ChatGPT, Claude, atau Gemini untuk hasil serupa.',
  claude: 'Paste ke Claude → Claude akan otomatis menjalankan Python (python-docx) dan menampilkan link unduh file .docx.',
  chatgpt: 'Paste ke ChatGPT → ChatGPT akan langsung menghasilkan file .docx yang bisa diunduh.',
  gemini: 'Paste ke Gemini → Gemini akan langsung menghasilkan file .docx yang bisa diunduh.',
};

// Tips tambahan untuk UI modal — TIDAK ikut masuk body prompt.
export const AI_MODE_EXTRA_TIPS: Record<AiMode, string[]> = {
  universal: [
    'Jika hasilnya kurang detail, minta AI untuk mengelaborasi bagian tertentu.',
    'Anda bisa mengedit prompt di atas sebelum paste untuk menyesuaikan kebutuhan.',
  ],
  claude: [
    'Pastikan fitur Analysis Tool (Python) aktif di akun Claude Anda.',
    'Jika file tidak otomatis muncul, ketik: "lanjutkan dan buat file .docx".',
  ],
  chatgpt: [
    'Disarankan menggunakan ChatGPT Plus/Pro agar bisa generate file .docx.',
    'Jika tidak muncul link unduh, ketik: "berikan sebagai file .docx".',
  ],
  gemini: [
    'Gunakan Gemini Advanced agar bisa generate file .docx langsung.',
    'Jika tidak muncul link unduh, ketik: "export ke file .docx".',
  ],
};

function infoBlock(formData: FormData): string {
  const lines = [
    `Mata Pelajaran: ${formData.mataPelajaran || '(belum diisi)'}`,
    `Kelas: ${formData.kelas || '(belum diisi)'}`,
    `Fase: ${formData.fase || '(belum diisi)'}`,
    `Materi: ${formData.materi || '(belum diisi)'}`,
  ];
  if (formData.subMateri) lines.push(`Sub Materi: ${formData.subMateri}`);
  lines.push(`Tujuan Pembelajaran: ${formData.tujuanPembelajaran || '(belum diisi)'}`);
  if (formData.capaianPembelajaran) {
    lines.push(`\nCapaian Pembelajaran:\n${formData.capaianPembelajaran}`);
  }
  return lines.join('\n');
}

function pertemuanBlock(formData: FormData): string {
  if (!formData.pertemuan?.length) return '';
  const list = formData.pertemuan
    .map((p) => `  - Pertemuan ${p.nomorPertemuan}: ${p.durasi}`)
    .join('\n');
  return `\nJumlah Pertemuan: ${formData.pertemuan.length}\n${list}`;
}

function identifikasiMuridBlock(formData: FormData): string {
  const items = [
    formData.aspekPengetahuanAwal && `- Pengetahuan Awal: ${formData.aspekPengetahuanAwal}`,
    formData.aspekMinat && `- Minat: ${formData.aspekMinat}`,
    formData.aspekLatarBelakang && `- Latar Belakang: ${formData.aspekLatarBelakang}`,
    formData.aspekKebutuhanBelajar && `- Kebutuhan Belajar: ${formData.aspekKebutuhanBelajar}`,
  ].filter(Boolean);
  return items.length ? `\nIdentifikasi Murid:\n${items.join('\n')}` : '';
}

function karakterBlock(formData: FormData): string {
  const parts: string[] = [];
  if (formData.nilaiKarakter?.length) {
    parts.push(`Nilai Karakter: ${formData.nilaiKarakter.join(', ')}`);
  }
  if (formData.dimensiProfilLulusan?.length) {
    parts.push(`Dimensi Profil Lulusan: ${formData.dimensiProfilLulusan.join(', ')}`);
  }
  if (formData.kaitanKehidupan) {
    parts.push(`Kaitan Kehidupan: ${formData.kaitanKehidupan}`);
  }
  return parts.length ? '\n' + parts.join('\n') : '';
}

// ── Mode-specific format suffixes ──

function modulFormatUniversal(model: string): string {
  return `
INSTRUKSI:
Buatkan dokumen modul ajar lengkap berdasarkan data di atas dengan struktur:
1. Untuk setiap pertemuan, buat 3 tahap: TAHAP AWAL, TAHAP INTI, TAHAP PENUTUP
2. Tahap Inti wajib memiliki 3 fase: MEMAHAMI, MENGAPLIKASI, MEREFLEKSI
3. Setiap kegiatan mencakup sintaks model ${model}
4. Sertakan aktivitas guru dan murid secara detail
5. Sertakan pertanyaan pemantik di setiap tahap
6. Cantumkan durasi untuk setiap kegiatan
7. Sertakan "pemahaman bermakna" yang ingin dicapai

FORMAT OUTPUT — ikuti struktur ini PERSIS:

# MODUL AJAR
## [Mata Pelajaran] — [Materi]

| Komponen | Detail |
|----------|--------|
| Nama Guru | [isi] |
| Sekolah | [isi] |
| Mata Pelajaran | [isi] |
| Kelas/Fase | [isi] |
| Alokasi Waktu | [isi] |
| Model Pembelajaran | [isi] |

## I. INFORMASI UMUM
[isi dalam format tabel]

## II. TUJUAN PEMBELAJARAN
[isi dalam format tabel atau bullet bernomor]

## III. LANGKAH PEMBELAJARAN

### PERTEMUAN 1 ([durasi] menit)

### TAHAP AWAL ([x] menit)
| Kegiatan Guru | Kegiatan Murid | Durasi |
|---------------|----------------|--------|
| [isi] | [isi] | [x] menit |

**Pertanyaan Pemantik:** [isi]

### TAHAP INTI ([x] menit)

**Fase MEMAHAMI:**
| Kegiatan Guru | Kegiatan Murid | Durasi |
|---------------|----------------|--------|
| [isi] | [isi] | [x] menit |

**Fase MENGAPLIKASI:**
| Kegiatan Guru | Kegiatan Murid | Durasi |
|---------------|----------------|--------|
| [isi] | [isi] | [x] menit |

**Fase MEREFLEKSI:**
| Kegiatan Guru | Kegiatan Murid | Durasi |
|---------------|----------------|--------|
| [isi] | [isi] | [x] menit |

### TAHAP PENUTUP ([x] menit)
| Kegiatan Guru | Kegiatan Murid | Durasi |
|---------------|----------------|--------|
| [isi] | [isi] | [x] menit |

**Pemahaman Bermakna yang Dicapai:** [isi]

[Ulangi struktur di atas untuk setiap pertemuan]

## IV. PENILAIAN
[isi dalam format tabel]`;
}

// Struktur seksi LENGKAP Modul Ajar — dipakai oleh Claude, ChatGPT, dan Gemini
// agar kedalaman konten sama persis.
function modulFullSections(model: string): string {
  return `
STRUKTUR DOKUMEN — ikuti urutan seksi ini PERSIS dan LENGKAP (semua seksi WAJIB terisi penuh, tidak boleh di-skip):

SEKSI HEADER:
Judul besar: "MODUL AJAR"
Subjudul: "Kurikulum Merdeka — Pembelajaran Mendalam (Deep Learning)"
Mata pelajaran dan materi di bawahnya.

SEKSI I: IDENTITAS DOKUMEN
Tabel 2 kolom (Komponen | Detail):
- Nama Penyusun: [nama guru] (NIP: [NIP guru])
- Sekolah: [nama sekolah]
- Mata Pelajaran: [mapel]
- Materi Pokok: [materi]
- Kelas / Fase: [kelas] / Fase [fase]
- Semester: [semester]
- Alokasi Waktu: [jumlah pertemuan] Pertemuan ([total menit] Menit)
- Model Pembelajaran: [model]
- Metode Pembelajaran: [metode-metode yang dipilih]

SEKSI II: IDENTIFIKASI MURID
Tabel 2 kolom (Aspek | Deskripsi):
- Pengetahuan Awal, Minat, Latar Belakang, Kebutuhan Belajar (gunakan data identifikasi murid).

SEKSI III: JENIS PENGETAHUAN MATERI
Tabel 2 kolom (Jenis | Deskripsi): Faktual, Konseptual, Prosedural, Metakognitif, Kaitan dengan Kehidupan.

SEKSI IV: INTEGRASI NILAI KARAKTER
Tabel 2 kolom: Nilai Karakter yang Dikembangkan | Deskripsi Implementasi dalam pembelajaran.

SEKSI V: DIMENSI PROFIL LULUSAN (DPL)
Tabel 3 kolom (DPL | Nama Lengkap | Implementasi dalam Pembelajaran). Nama lengkap DPL:
1. Keimanan dan Ketakwaan terhadap Tuhan YME, 2. Kewargaan Global, 3. Penalaran Kritis,
4. Kreativitas, 5. Kebhinekaan Global, 6. Kolaborasi, 7. Kepedulian, 8. Kemandirian.
(Tampilkan hanya DPL yang relevan dari data.)

SEKSI VI: DESAIN PEMBELAJARAN
Tabel 2 kolom: Capaian Pembelajaran, Tujuan Pembelajaran (TP1, TP2, dst), Pemahaman Bermakna,
Model Pembelajaran, Metode Pembelajaran.

SEKSI VII: LINTAS DISIPLIN ILMU
Tabel 2 kolom (Mata Pelajaran | Keterkaitan): minimal 4 mata pelajaran lain yang relevan.

SEKSI VIII: KEMITRAAN PEMBELAJARAN
Tabel 2 kolom (Mitra | Bentuk Kemitraan): Guru Bidang Studi Lain, Orang Tua / Wali, Instansi Terkait.

SEKSI IX: LINGKUNGAN PEMBELAJARAN
Tabel 2 kolom (Aspek | Deskripsi): Ruang Fisik, Ruang Virtual, Budaya Belajar.

SEKSI X: PEMANFAATAN TEKNOLOGI DIGITAL
Tabel 2 kolom (Fase | Pemanfaatan): Perencanaan, Pelaksanaan, Asesmen.

SEKSI XI: LANGKAH-LANGKAH PEMBELAJARAN
Untuk SETIAP pertemuan buat sub-judul "Pertemuan [N] — Durasi: [X] Menit" lalu tabel 3 kolom:
TAHAP | KEGIATAN & PRINSIP | DURASI.

- TAHAP AWAL: Salam/Doa/Absensi; Apersepsi + pertanyaan pemantik; Penyampaian Tujuan; Motivasi/Ice Breaking.
- TAHAP INTI dipecah 3 sub-tahap mengacu sintaks ${model}:
  MEMAHAMI, MENGAPLIKASI, MEREFLEKSI. Setiap aktivitas tulis: nama aktivitas (bold),
  deskripsi kegiatan guru & murid, pertanyaan pemantik (jika ada), label prinsip
  (Mindful / Meaningful / Joyful).
- TAHAP PENUTUP: Refleksi Individu (3-2-1), Kesimpulan Bersama, Apresiasi & Doa Penutup.

SEKSI XII: PENILAIAN
A. Penilaian Proses (Formatif) — tabel: Aspek | Instrumen | Waktu | Keterangan.
B. Penilaian Hasil (Sumatif) — tabel: Tujuan Pembelajaran | Instrumen | Teknik | Bobot.
C. Rubrik Penilaian — tabel: Kriteria | Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Bimbingan (1).
D. Diferensiasi & Akomodasi — tabel: Kebutuhan Murid | Strategi.

PENUTUP: LEMBAR PENGESAHAN
Layout 2 kolom di bagian paling bawah:
- Kiri: "Mengetahui," / "Kepala Sekolah" / [3 baris kosong] / "[Nama Kepala Sekolah]" / "NIP. [NIP]"
- Kanan: "[Kota], [Tanggal]" / "Guru Mata Pelajaran" / [3 baris kosong] / "[Nama Guru]" / "NIP. [NIP]"
Jika data kota/tanggal tidak tersedia, gunakan "_, _ 20___".

Konten yang tidak ada datanya (Lintas Disiplin, Kemitraan, dll) WAJIB di-GENERATE berdasarkan konteks materi.`;
}

function modulFormatClaude(model: string): string {
  return `
JANGAN buat Artifact HTML. Langsung jalankan Python (python-docx) untuk membuat file .docx dan tampilkan sebagai link unduhan.
${modulFullSections(model)}

KETENTUAN TEKNIS FILE .docx (python-docx):
- Margin: 2 cm pada semua sisi (top, bottom, left, right).
- Font isi: Arial 11pt. Judul utama (H1): 14pt bold, center. Sub-judul (H2): 12pt bold. Sub-bab (H3): 11pt bold.
- Semua tabel: header baris pertama di-shading RGBColor(240, 240, 240) dengan font bold; isi tabel font regular.
- Lebar kolom default untuk tabel 2 kolom: kolom 1 = 4 cm, kolom 2 = 13 cm.
- Setiap kegiatan pada SEKSI XI mencakup sintaks model ${model}.
- Nama file: Modul_Ajar_[Mapel]_[Materi].docx (ganti [Mapel] dan [Materi] sesuai data).
- Setelah doc.save(...), WAJIB panggil present_files() agar file langsung muncul sebagai link unduh untuk user.

Contoh kerangka minimal (sesuaikan & lengkapi seluruh 12 seksi):

\`\`\`python
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()
for s in doc.sections:
    s.top_margin = s.bottom_margin = s.left_margin = s.right_margin = Cm(2)

normal = doc.styles['Normal']
normal.font.name = 'Arial'
normal.font.size = Pt(11)

def shade_cell(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)

# ... bangun seluruh 12 seksi (Identitas, Identifikasi Murid, ... Penilaian, Pengesahan)
# Header tabel: shade_cell(cell, 'F0F0F0') + run.bold = True
# Tabel 2 kolom set width: row.cells[0].width = Cm(4); row.cells[1].width = Cm(13)

doc.save('Modul_Ajar_[Mapel]_[Materi].docx')
present_files()
\`\`\``;
}

function modulFormatChatgpt(model: string): string {
  return `
Buat langsung sebagai file .docx yang bisa diunduh. JANGAN gunakan Canvas. JANGAN gunakan emoji dekoratif di dalam isi dokumen.

Gunakan format dokumen Word yang rapi dengan:
- Font: Times New Roman 12pt untuk isi, 14pt bold untuk judul utama (H1), 12pt bold untuk sub-judul (H2/H3).
- Margin: 2.5 cm pada semua sisi.
- Semua tabel dengan header bold dan border lengkap di seluruh sel.
- Heading menggunakan Word Heading styles (Heading 1, Heading 2, Heading 3) — bukan teks bold biasa.
- Setiap kegiatan pada SEKSI XI mencakup sintaks model ${model}.
- Nama file: Modul_Ajar_[Mapel]_[Materi].docx.
${modulFullSections(model)}`;
}

function modulFormatGemini(model: string): string {
  return `
Buat langsung sebagai file .docx yang bisa diunduh. JANGAN keluarkan dalam format plain text. JANGAN minta user "Export to Docs" — file .docx harus langsung tersedia.

Gunakan format dokumen Word yang rapi dengan:
- Font: Times New Roman 12pt untuk isi, 14pt bold untuk judul utama (H1), 12pt bold untuk sub-judul (H2/H3).
- Margin: 2.5 cm pada semua sisi.
- Semua tabel dengan header bold dan border lengkap di seluruh sel.
- Heading menggunakan Word Heading styles (Heading 1, Heading 2, Heading 3).
- Setiap kegiatan pada SEKSI XI mencakup sintaks model ${model}.
- Nama file: Modul_Ajar_[Mapel]_[Materi].docx.
${modulFullSections(model)}`;
}

function getFormatSuffix(aiMode: AiMode, contentType: string, model: string): string {
  if (contentType === 'modul') {
    switch (aiMode) {
      case 'claude': return modulFormatClaude(model);
      case 'chatgpt': return modulFormatChatgpt(model);
      case 'gemini': return modulFormatGemini(model);
      default: return modulFormatUniversal(model);
    }
  }

  // Generic format suffixes for non-modul types — semuanya minta output .docx langsung
  const docxBlock = `

Buat langsung sebagai file .docx yang bisa diunduh. Gunakan format dokumen Word yang rapi dengan:
- Font: Times New Roman 12pt untuk isi, 14pt bold untuk judul.
- Margin: 2.5 cm semua sisi.
- Semua tabel dengan header bold dan border.
- Heading menggunakan Word Heading styles (Heading 1, Heading 2, Heading 3).`;

  switch (aiMode) {
    case 'claude':
      return `

JANGAN buat Artifact HTML. Langsung jalankan Python (python-docx) untuk membuat file .docx dan tampilkan sebagai link unduh (akhiri dengan present_files()).
Ketentuan file .docx: font Arial 11pt untuk isi, 14pt bold untuk judul; margin 2 cm semua sisi; header tabel shading RGBColor(240, 240, 240) + bold.`;

    case 'chatgpt':
    case 'gemini':
      return docxBlock;

    default: // universal
      return `

FORMAT OUTPUT: Buatkan dalam format tabel Markdown yang terstruktur dan mudah dibaca. Gunakan heading ##, sub-heading ###, dan tabel | untuk data terstruktur.`;
  }
}

// ── Base prompt builders (without format suffix) ──

function buildModulBase(formData: FormData): string {
  const isKBC = formData.kurikulum === 'kbc';
  const kurikulumLabel = isKBC ? 'Kurikulum Berbasis Cinta (KBC) Kemenag' : 'Kurikulum Merdeka';

  return `Kamu adalah ahli pendidikan Indonesia yang membuat Modul Ajar / Perencanaan Pembelajaran Mendalam sesuai ${kurikulumLabel}.
${isKBC ? 'Gunakan istilah "peserta didik" dan integrasikan nilai-nilai Elemen Cinta.\n' : ''}
PRINSIP PEMBELAJARAN MENDALAM:
1. "Membangun kesadaran (Mindful)" — Murid sadar penuh terhadap tujuan dan proses belajar
2. "Bermakna (Meaningful)" — Menghubungkan materi dengan pengalaman hidup nyata
3. "Menggembirakan (Joyful)" — Suasana belajar positif dan menyenangkan

Model Pembelajaran: ${formData.modelPembelajaran || 'Project Based Learning (PjBL)'}

${infoBlock(formData)}${pertemuanBlock(formData)}${identifikasiMuridBlock(formData)}${karakterBlock(formData)}`;
}

function buildLKPDBase(formData: FormData): string {
  return `Kamu adalah ahli pendidikan yang membuat LKPD (Lembar Kerja Peserta Didik) yang interaktif dan bermakna${formData.kurikulum === 'kbc' ? ' sesuai Kurikulum Berbasis Cinta (KBC) Kemenag' : ''}.

${infoBlock(formData)}

PENTING - FORMAT MATEMATIKA (untuk mapel Matematika/Fisika/Kimia):
- SEMUA ekspresi matematika WAJIB dibungkus $...$. Contoh: $\\sin x$, $\\cos x$, $\\frac{a}{b}$, $\\sqrt{2}$, $x^{2}$, $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.
- DILARANG menulis \\sin, \\cos, \\lim, \\frac, \\sqrt, \\to di luar $...$.
- Di dalam JSON, backslash WAJIB ditulis ganda ("\\\\sin x", "\\\\lim_{x \\\\to 0}") agar tidak hilang saat parsing.

ATURAN TABEL:
Jika memerlukan tabel (mis. tabel nilai limit), gunakan HTML <table> lengkap dengan border. DILARANG memakai format Markdown pipe (| ... |).

INSTRUKSI:
Buatkan LKPD lengkap yang mencakup:
1. Judul LKPD yang menarik
2. Petunjuk belajar untuk siswa
3. Informasi pendukung / konteks materi
4. Pertanyaan pemantik
5. Masalah kontekstual yang relevan dengan kehidupan sehari-hari
6. 3-5 Aktivitas utama (dengan instruksi jelas, pertanyaan kunci, dan format jawaban)
   - Jika aktivitas membutuhkan siswa membaca teks, sertakan teks tersebut secara lengkap
7. Refleksi diri dan refleksi sejawat`;
}

function buildAsesmenBase(formData: FormData): string {
  return `Kamu adalah ahli asesmen pendidikan Indonesia yang membuat instrumen penilaian sesuai ${formData.kurikulum === 'kbc' ? 'KBC Kemenag' : 'Kurikulum Merdeka'} dengan Pembelajaran Mendalam.

${infoBlock(formData)}

INSTRUKSI:
Buatkan instrumen asesmen lengkap yang mencakup 3 jenis:

1. ASESMEN AWAL (Diagnostik / Assessment for Learning):
   - 2-3 pertanyaan pemantik untuk menggali pengetahuan awal siswa
   - Sertakan tujuan setiap pertanyaan

2. ASESMEN PROSES (Formatif / Assessment as Learning):
   - 2-3 aktivitas penilaian (observasi, diskusi, lembar kerja)
   - Rubrik penilaian dengan 4 level: Sangat Baik, Baik, Cukup, Kurang
   - Pertanyaan penilaian diri dan penilaian sejawat

3. ASESMEN AKHIR (Sumatif / Assessment of Learning):
   - 3-5 soal uraian dengan kunci jawaban lengkap
   - Rubrik penilaian
   - Pedoman penskoran`;
}

function buildMateriBase(formData: FormData): string {
  const kelasNum = parseInt(formData.kelas?.replace(/\D/g, '') || '7');
  const jenjang = kelasNum <= 6 ? 'SD' : kelasNum <= 9 ? 'SMP' : 'SMA';

  return `Kamu adalah penulis materi pembelajaran ahli sesuai ${formData.kurikulum === 'kbc' ? 'Kurikulum Berbasis Cinta (KBC) Kemenag' : 'Kurikulum Merdeka Indonesia'}.

${infoBlock(formData)}

INSTRUKSI:
Buatkan materi pembelajaran yang KOMPREHENSIF untuk jenjang ${jenjang} dengan struktur:

1. PENDAHULUAN: Gambaran umum, mengapa penting, hubungan dengan kehidupan nyata (minimal 100 kata)

2. ISI MATERI (minimal 4-6 sub-bab):
   Untuk setiap sub-bab, sertakan:
   - Poin utama / ringkasan inti (1-2 kalimat)
   - Penjelasan detail (minimal 100 kata per sub-bab)
   - Contoh konkret yang relevan dengan kehidupan siswa Indonesia

3. FAKTA UNIK: 2-3 fakta menarik terkait materi

4. GLOSARIUM: Istilah-istilah kunci dengan definisi

5. REFERENSI: Sumber belajar tambahan

GAYA BAHASA: Sesuaikan dengan jenjang ${jenjang}
${jenjang === 'SD' ? '- Gunakan bahasa sederhana, cerita petualangan, banyak emoji' : jenjang === 'SMP' ? '- Gunakan bahasa engaging, contoh dari dunia remaja (teknologi, hobi)' : '- Gunakan bahasa analitis, studi kasus profesional'}`;
}

function buildSoalBase(formData: FormData, soalConfig?: SoalConfig): string {
  const kelasNum = parseInt(formData.kelas?.replace(/\D/g, '') || '7');
  const jenjang = kelasNum <= 6 ? 'SD' : kelasNum <= 9 ? 'SMP' : 'SMA';
  const jumlahOpsi = kelasNum <= 9 ? 4 : 5;

  let configInfo = '';
  if (soalConfig?.typeConfigs) {
    const activeTypes = Object.entries(soalConfig.typeConfigs)
      .filter(([, c]) => c.quantity > 0)
      .map(([t, c]) => `${t}: ${c.quantity} soal`)
      .join(', ');
    const total = Object.values(soalConfig.typeConfigs).reduce((s, c) => s + c.quantity, 0);
    configInfo = `\nKonfigurasi Soal:
- Total: ${total} soal
- Tipe: ${activeTypes}
- Level Kognitif: ${soalConfig.level || 'Seimbang (LOTS & HOTS)'}
- Jumlah opsi PG: ${jumlahOpsi} (jenjang ${jenjang})`;
  }

  return `Kamu adalah ahli penilaian pendidikan Indonesia yang membuat bank soal berkualitas sesuai ${formData.kurikulum === 'kbc' ? 'KBC Kemenag' : 'Kurikulum Merdeka'}.

${infoBlock(formData)}${configInfo}

INSTRUKSI:
Buatkan bank soal dengan memperhatikan:

1. KAIDAH SOAL YANG BAIK:
   - Sesuai indikator/tujuan pembelajaran
   - Tidak multi tafsir
   - Pengecoh masuk akal (miskonsepsi umum siswa)
   - Panjang opsi relatif sama

2. TIPE SOAL yang bisa dibuat:
   - Pilihan Ganda (${jumlahOpsi} opsi)
   - PG Kategori Benar/Salah (3-5 pernyataan)
   - PG Multiple Choice Multiple Answer
   - Menjodohkan
   - Isian Singkat
   - Uraian

3. DISTRIBUSI LEVEL KOGNITIF (Taksonomi Bloom):
   C1 Mengingat → C2 Memahami → C3 Menerapkan → C4 Menganalisis → C5 Mengevaluasi → C6 Mencipta

4. KONTEKS INDONESIA: Gunakan nama, lokasi, dan budaya Indonesia

5. Untuk setiap soal sertakan: pertanyaan, kunci jawaban, dan pembahasan`;
}

function buildRefleksiBase(formData: FormData): string {
  return `Kamu adalah ahli evaluasi pembelajaran yang membuat rencana tindak lanjut dan refleksi.

${infoBlock(formData)}

INSTRUKSI:
Buatkan rencana refleksi dan tindak lanjut yang mencakup:

1. REFLEKSI GURU (5-7 pertanyaan):
   - Pertanyaan reflektif untuk guru mengevaluasi proses pembelajaran
   - Contoh: "Apakah tujuan pembelajaran tercapai?", "Strategi apa yang paling efektif?"

2. REFLEKSI SISWA (5-7 pertanyaan):
   - Pertanyaan untuk siswa merefleksikan pembelajaran mereka
   - Contoh: "Apa yang sudah saya pahami?", "Bagian mana yang masih sulit?"

3. PROGRAM REMEDIAL:
   - Deskripsi kegiatan remedial untuk siswa yang belum mencapai tujuan
   - Sertakan metode, langkah-langkah, dan contoh aktivitas

4. PROGRAM PENGAYAAN:
   - Deskripsi kegiatan pengayaan untuk siswa yang sudah mencapai tujuan
   - Sertakan aktivitas lanjutan yang menantang`;
}

export function buildHumanPrompt(
  type: PromptType,
  formData: FormData,
  soalConfig?: SoalConfig,
  aiMode: AiMode = 'universal'
): string {
  const model = formData.modelPembelajaran || 'Project Based Learning (PjBL)';
  let base = '';

  switch (type) {
    case 'modul':
      base = buildModulBase(formData);
      break;
    case 'lkpd':
      base = buildLKPDBase(formData);
      break;
    case 'asesmen':
      base = buildAsesmenBase(formData);
      break;
    case 'materi':
      base = buildMateriBase(formData);
      break;
    case 'soal':
      base = buildSoalBase(formData, soalConfig);
      break;
    case 'refleksi':
      base = buildRefleksiBase(formData);
      break;
  }

  // For modul, format suffix replaces the INSTRUKSI section entirely
  // For others, append the format suffix after the base INSTRUKSI
  const formatSuffix = getFormatSuffix(aiMode, type, model);

  // Blok integrasi program nasional (KKA / SIKAP / 7KAIH) — disisipkan sebelum format suffix
  const integrasiBlock = buildIntegrationBlock(formData.integrasiProgram, formData.kelas, type);

  // Tips user TIDAK lagi disertakan dalam body prompt — ditampilkan sebagai teks statis
  // di UI modal (PromptExportDialog) agar tidak boros token.
  return base + integrasiBlock + formatSuffix;

}
