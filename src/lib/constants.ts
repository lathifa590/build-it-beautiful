import type { 
  MateriPengetahuan, 
  LintasDisiplinIlmu, 
  KemitraanPembelajaran, 
  LingkunganPembelajaranDetail, 
  PemanfaatanDigitalDetail 
} from '@/types/modul';

export const IDENTIFIKASI_FIELDS = [
  'namaPenyusun', 'nipPenyusun', 'sekolah', 'kepalaSekolah', 'nipKepalaSekolah',
  'mataPelajaran', 'fase', 'kelas', 'semester', 'durasi', 
  'kesiapanSiswa', 'karakteristikMateri', 'profilLulusan', 'lingkunganBelajar'
] as const;

export const faseOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

// Mapping Fase → Kelas sesuai dokumen CP Kemdikbud
export const FASE_KELAS_MAP: Record<string, string[]> = {
  A: ['Kelas I', 'Kelas II'],
  B: ['Kelas III', 'Kelas IV'],
  C: ['Kelas V', 'Kelas VI'],
  D: ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  E: ['Kelas X'],
  F: ['Kelas XI', 'Kelas XII'],
};

export const semesterOptions = ['1 (Ganjil)', '2 (Genap)'];

// Dimensi Profil Lulusan dengan kode DPL (sesuai dokumen resmi)
export const DPL_OPTIONS = [
  { kode: 'DPL 1', nama: 'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa' },
  { kode: 'DPL 2', nama: 'Kewargaan Global' },
  { kode: 'DPL 3', nama: 'Penalaran Kritis' },
  { kode: 'DPL 4', nama: 'Kreativitas' },
  { kode: 'DPL 5', nama: 'Kolaborasi' },
  { kode: 'DPL 6', nama: 'Kemandirian' },
  { kode: 'DPL 7', nama: 'Kesehatan' },
  { kode: 'DPL 8', nama: 'Komunikasi' },
];

// Legacy profil options for backward compatibility
export const profilOptions = [
  'Keimanan & Ketakwaan', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas',
  'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi'
];

// Integrasi Nilai dan Karakter
export const NILAI_KARAKTER_OPTIONS = [
  'Tanggung Jawab',
  'Peduli Diri dan Sesama',
  'Kritis dan Kreatif',
  'Kolaborasi',
  'Komunikatif',
  'Religius',
  'Nasionalis',
  'Mandiri',
  'Gotong Royong',
  'Integritas',
];

export const modelOptions = [
  'Problem Based Learning (PBL)', 'Project Based Learning (PjBL)', 'Discovery Learning',
  'Inquiry Learning', 'Cooperative Learning', 'Flipped Classroom', 'Teaching at the Right Level (TaRL)',
  'Kontekstual (CTL)'
];

export const metodeOptions = [
  'Ceramah Interaktif', 'Diskusi Kelompok', 'Demonstrasi', 'Tanya Jawab',
  'Simulasi', 'Studi Kasus', 'Observasi', 'Mind Mapping', 'Gamifikasi',
  'Observasi Diri dan Lingkungan', 'Pengumpulan Data', 'Presentasi Proyek'
];

export const lingkunganOptions = ['Ruang Fisik', 'Ruang Virtual'];

export const soalTypesOptions = [
  'Pilihan Ganda',                    // PG biasa (A-D untuk SD/SMP, A-E untuk SMA)
  'PG Kategori Benar/Salah',          // TKA: pernyataan dinilai Benar atau Salah
  'PG Multiple Choice Multiple Answer', // TKA: checkbox, lebih dari 1 jawaban benar
  'Menjodohkan',                      // Premis-Respon
  'Isian Singkat',                    // Fill in the blank
  'Uraian',                           // Essay
];

export const soalLevelOptions = ['Dominan LOTS (C1-C3)', 'Seimbang (LOTS & HOTS)', 'Dominan HOTS (C4-C6)'];

// Default Materi Pengetahuan
export const DEFAULT_MATERI_PENGETAHUAN: MateriPengetahuan = {
  faktual: '',
  konseptual: '',
  prosedural: '',
  metakognitif: '',
};

// Default Lintas Disiplin Ilmu
export const DEFAULT_LINTAS_DISIPLIN: LintasDisiplinIlmu = {
  ppkn: '',
  ips: '',
  matematika: '',
  bahasaIndonesia: '',
  seniBudaya: '',
  prakarya: '',
  penjaskes: '',
};

// Default Kemitraan Pembelajaran
export const DEFAULT_KEMITRAAN: KemitraanPembelajaran = {
  guruBidangStudiLain: '',
  orangTua: '',
  tokohMasyarakat: '',
  instansiTerkait: '',
  duniaUsaha: '',
  perguruanTinggiLSM: '',
  mgmpKomunitasBelajar: '',
};

// Default Lingkungan Pembelajaran Detail
export const DEFAULT_LINGKUNGAN_DETAIL: LingkunganPembelajaranDetail = {
  ruangFisik: '',
  ruangVirtual: '',
  budayaBelajar: '',
};

// Default Pemanfaatan Digital Detail
export const DEFAULT_PEMANFAATAN_DIGITAL: PemanfaatanDigitalDetail = {
  perencanaan: '',
  pelaksanaan: '',
  asesmen: '',
};

// Topik Panca Cinta untuk KBC (Kurikulum Berbasis Cinta - Kemenag)
export const KBC_TOPIK_PANCA_CINTA = [
  'Cinta kepada Allah dan Rasul-Nya',
  'Cinta kepada Ilmu',
  'Cinta kepada Diri dan Sesama Manusia',
  'Cinta kepada Alam dan Lingkungan',
  'Cinta kepada Tanah Air',
];

// Legacy alias for backward compatibility
export const KBC_ELEMEN_CINTA = KBC_TOPIK_PANCA_CINTA;

export const DEFAULT_FORM_DATA = {
  // Jenis Kurikulum
  kurikulum: 'merdeka' as const,
  
  // Identifikasi Dasar
  namaPenyusun: '',
  nipPenyusun: '',
  sekolah: '',
  kepalaSekolah: '',
  nipKepalaSekolah: '',
  mataPelajaran: '',
  materi: '',
  subMateri: '',
  fase: 'A',
  kelas: '',
  semester: '1 (Ganjil)',
  pertemuan: [{ nomorPertemuan: 1, durasi: '40' }],
  
  // Identifikasi Murid
  aspekPengetahuanAwal: '',
  aspekMinat: '',
  aspekLatarBelakang: '',
  aspekKebutuhanBelajar: '',
  
  // Materi Pengetahuan
  materiPengetahuan: DEFAULT_MATERI_PENGETAHUAN,
  
  // Kaitan Kehidupan
  kaitanKehidupan: '',
  
  // Nilai Karakter
  nilaiKarakter: [] as string[],
  
  // Dimensi Profil Lulusan
  dimensiProfilLulusan: [] as string[],
  
  // Desain Pembelajaran
  capaianPembelajaran: '',
  lintasDisiplinIlmu: DEFAULT_LINTAS_DISIPLIN,
  tujuanPembelajaran: '',
  modelPembelajaran: 'Project Based Learning (PjBL)',
  metodePembelajaran: [] as string[],
  
  // Kemitraan
  kemitraanPembelajaran: DEFAULT_KEMITRAAN,
  
  // Lingkungan Detail
  lingkunganPembelajaranDetail: DEFAULT_LINGKUNGAN_DETAIL,
  
  // Pemanfaatan Digital Detail
  pemanfaatanDigitalDetail: DEFAULT_PEMANFAATAN_DIGITAL,
  
  // KBC-specific fields
  topikPancaCinta: [] as string[],
  materiIntegrasiKBC: '',

  // Integrasi Program Nasional
  integrasiProgram: { kka: false, sikap: false, kaih: false },

  
  // Legacy fields for backward compatibility
  kesiapanSiswa: '',
  karakteristikMateri: '',
  profilLulusan: [] as string[],
  lintasDisiplin: '',
  kemitraan: '',
  lingkunganBelajar: [] as string[],
  pemanfaatanDigital: '',
};

export const DEFAULT_SOAL_TYPE_CONFIG = {
  quantity: 0,
  useStimulus: false,
  stimulusCount: 0,
  useImages: false,
  imageCount: 0,
};

export const DEFAULT_SOAL_CONFIG = {
  typeConfigs: {
    'Pilihan Ganda': { quantity: 5, useStimulus: true, stimulusCount: 1, useImages: false, imageCount: 0 },
    'PG Kategori Benar/Salah': { ...DEFAULT_SOAL_TYPE_CONFIG },
    'PG Multiple Choice Multiple Answer': { ...DEFAULT_SOAL_TYPE_CONFIG },
    'Menjodohkan': { ...DEFAULT_SOAL_TYPE_CONFIG },
    'Isian Singkat': { ...DEFAULT_SOAL_TYPE_CONFIG },
    'Uraian': { quantity: 5, useStimulus: false, stimulusCount: 0, useImages: false, imageCount: 0 },
  } as Record<string, import('@/types/modul').SoalTypeConfig>,
  level: 'Seimbang (LOTS & HOTS)',
};

// Prinsip Pembelajaran Mendalam (Deep Learning Approach)
export const PRINSIP_PEMBELAJARAN_MENDALAM = {
  berkesadaran: {
    nama: "Berkesadaran",
    namaInggris: "Mindful",
    fokus: "Siswa sadar penuh terhadap tujuan dan proses belajar, mampu meregulasi diri, dan fokus secara intrinsik.",
    praktik: [
      "Memberi pilihan belajar kepada siswa",
      "Siswa terlibat dalam strategi belajar",
      "Menumbuhkan rasa ingin tahu tinggi",
      "Menjaga konsentrasi siswa"
    ]
  },
  bermakna: {
    nama: "Bermakna",
    namaInggris: "Meaningful",
    fokus: "Menghubungkan materi dengan pengalaman hidup nyata agar bisa diaplikasikan.",
    praktik: [
      "Belajar kontekstual dengan kehidupan nyata",
      "Bukan hanya hafalan",
      "Memahami 'mengapa' dan 'bagaimana' menggunakan materi"
    ]
  },
  menggembirakan: {
    nama: "Menggembirakan",
    namaInggris: "Joyful",
    fokus: "Menciptakan suasana belajar yang positif, menantang, menyenangkan, dan memotivasi.",
    praktik: [
      "Metode interaktif (game, teknologi)",
      "Humor dan eksplorasi",
      "Membangun hubungan akrab",
      "Membuat belajar terasa seperti petualangan"
    ]
  }
};

export const PRINSIP_OPTIONS = ['Berkesadaran', 'Bermakna', 'Menggembirakan'] as const;

// Fase Inti Pembelajaran sesuai dokumen resmi
// Default Kalender Pendidikan
export const DEFAULT_KALENDER_PENDIDIKAN: import('@/types/modul').KalenderPendidikan = {
  jpPerMinggu: 4,
  mingguEfektifSem1: 18,
  mingguEfektifSem2: 16,
  tanggalMulaiSem1: '2025-07-14',
  tanggalMulaiSem2: '2026-01-05',
};

// Default Prosem Events
export const DEFAULT_PROSEM_EVENTS: import('@/types/modul').ProsemEvent[] = [
  { nama: 'PTS Semester 1', semester: 1, bulan: 10, mingguKe: 4, tipe: 'PTS' },
  { nama: 'PAS Semester 1', semester: 1, bulan: 12, mingguKe: 2, tipe: 'PAS' },
  { nama: 'PTS Semester 2', semester: 2, bulan: 3, mingguKe: 4, tipe: 'PTS' },
  { nama: 'PAS Semester 2', semester: 2, bulan: 6, mingguKe: 1, tipe: 'PAS' },
];

export const PROSEM_EVENT_TYPES = ['PTS', 'PAS', 'Libur Nasional', 'Libur Sekolah'] as const;

export const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const FASE_INTI_OPTIONS = [
  { nama: 'MEMAHAMI', prinsip: 'Bermakna, Berkesadaran', deskripsi: 'Tahap memahami konsep dan materi' },
  { nama: 'MENGAPLIKASI', prinsip: 'Menggembirakan', deskripsi: 'Tahap menerapkan pengetahuan dalam proyek/aksi' },
  { nama: 'MEREFLEKSI', prinsip: 'Berkesadaran', deskripsi: 'Tahap refleksi dan evaluasi pembelajaran' },
] as const;
