export interface PertemuanInput {
  /** Optional stable id. Additive — legacy code paths ignore it. */
  id?: string;
  nomorPertemuan: number;
  durasi: string;
}

// Jenis Pengetahuan Materi
export interface MateriPengetahuan {
  faktual: string;
  konseptual: string;
  prosedural: string;
  metakognitif: string;
}

// Lintas Disiplin Ilmu (structured per mapel)
export interface LintasDisiplinIlmu {
  ppkn: string;
  ips: string;
  matematika: string;
  bahasaIndonesia: string;
  seniBudaya: string;
  prakarya: string;
  penjaskes: string;
}

// Kemitraan Pembelajaran
export interface KemitraanPembelajaran {
  guruBidangStudiLain: string;
  orangTua: string;
  tokohMasyarakat: string;
  instansiTerkait: string;
  duniaUsaha: string;
  perguruanTinggiLSM: string;
  mgmpKomunitasBelajar: string;
}

// Lingkungan Pembelajaran (3 aspek)
export interface LingkunganPembelajaranDetail {
  ruangFisik: string;
  ruangVirtual: string;
  budayaBelajar: string;
}

// Pemanfaatan Digital (3 tahap)
export interface PemanfaatanDigitalDetail {
  perencanaan: string;
  pelaksanaan: string;
  asesmen: string;
}

export interface FormData {
  // === JENIS KURIKULUM ===
  kurikulum: 'merdeka' | 'kbc';
  
  // === IDENTIFIKASI DASAR ===
  namaPenyusun: string;
  nipPenyusun: string;
  sekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  mataPelajaran: string;
  materi: string;
  subMateri: string;
  fase: string;
  kelas: string;
  semester: string;
  pertemuan: PertemuanInput[];
  
  // === IDENTIFIKASI MURID ===
  aspekPengetahuanAwal: string;
  aspekMinat: string;
  aspekLatarBelakang: string;
  aspekKebutuhanBelajar: string;
  
  // === MATERI PELAJARAN ===
  materiPengetahuan: MateriPengetahuan;
  
  // === KAITAN KEHIDUPAN ===
  kaitanKehidupan: string;
  
  // === INTEGRASI NILAI KARAKTER ===
  nilaiKarakter: string[];
  
  // === DIMENSI PROFIL LULUSAN (dengan kode DPL) ===
  dimensiProfilLulusan: string[];
  
  // === DESAIN PEMBELAJARAN ===
  capaianPembelajaran: string;
  lintasDisiplinIlmu: LintasDisiplinIlmu;
  tujuanPembelajaran: string;
  modelPembelajaran: string;
  metodePembelajaran: string[];
  
  // === KEMITRAAN PEMBELAJARAN ===
  kemitraanPembelajaran: KemitraanPembelajaran;
  
  // === LINGKUNGAN PEMBELAJARAN ===
  lingkunganPembelajaranDetail: LingkunganPembelajaranDetail;
  
  // === PEMANFAATAN DIGITAL ===
  pemanfaatanDigitalDetail: PemanfaatanDigitalDetail;
  
  // === KBC-SPECIFIC FIELDS ===
  topikPancaCinta: string[];
  materiIntegrasiKBC: string;

  // === INTEGRASI PROGRAM NASIONAL ===
  integrasiProgram?: {
    kka?: boolean;
    sikap?: boolean;
    kaih?: boolean;
    adiwiyata?: boolean;
    ssk?: boolean;
    sra?: boolean;
  };

  
  
  // === LEGACY FIELDS (untuk backward compatibility) ===
  kesiapanSiswa: string;
  karakteristikMateri: string;
  profilLulusan: string[];
  lintasDisiplin: string;
  kemitraan: string;
  lingkunganBelajar: string[];
  pemanfaatanDigital: string;

  // === HIERARKI BAB → SUBMATERI → PERTEMUAN (opsional, mode baru) ===
  // Kalau field ini ADA → aplikasi pakai mode hierarki.
  // Kalau TIDAK ADA (undefined) → aplikasi tetap pakai mode flat lama.
  // Lihat StrukturHierarki di bawah file ini.
  struktur?: StrukturHierarki;
}

export interface SoalTypeConfig {
  quantity: number;
  useStimulus: boolean;
  stimulusCount: number;
  useImages: boolean;
  imageCount: number;
}

export interface SoalConfig {
  typeConfigs: Record<string, SoalTypeConfig>;
  level: string;
}

export type PrinsipPembelajaran = 'Berkesadaran' | 'Bermakna' | 'Menggembirakan';

// Legacy simple structure (for backwards compatibility)
export interface LangkahPembelajaran {
  kegiatan: string;
  durasi: string;
  prinsip: PrinsipPembelajaran;
}

// New detailed sub-activity structure
export interface SubKegiatan {
  judul: string;
  durasi: string;
  aktivitas?: string[]; // New: combined narrative flow
  aktivitas_guru?: string[]; // Legacy: for backward compatibility
  aktivitas_siswa?: string[]; // Legacy: for backward compatibility
  pertanyaan_pemantik?: string[];
}

// New syntax-based activity structure
export interface KegiatanSintaks {
  sintaks: string;
  durasi: string;
  prinsip: PrinsipPembelajaran;
  sub_kegiatan: SubKegiatan[];
}

// New learning phase structure
export interface TahapPembelajaran {
  judul: string;
  prinsip_utama: string;
  durasi_total: string;
  kegiatan: KegiatanSintaks[];
}

// Fase Inti (MEMAHAMI, MENGAPLIKASI, MEREFLEKSI)
export interface FaseInti {
  nama: 'MEMAHAMI' | 'MENGAPLIKASI' | 'MEREFLEKSI';
  prinsip: string;
  durasi: string;
  sintaks: KegiatanSintaks[];
}

// New tahap inti with 3 phases
export interface TahapIntiDetail {
  judul: string;
  prinsip_utama: string;
  durasi_total: string;
  fase_pembelajaran?: FaseInti[];
  kegiatan: KegiatanSintaks[];
}

// New detailed meeting structure
export interface PertemuanDataDetail {
  nomorPertemuan: number;
  durasi: string;
  tahap_awal: TahapPembelajaran;
  tahap_inti: TahapPembelajaran | TahapIntiDetail;
  tahap_penutup: TahapPembelajaran;
}

// Legacy meeting structure (for backwards compatibility)
export interface PertemuanData {
  nomorPertemuan: number;
  durasi: string;
  pembukaan: LangkahPembelajaran[];
  inti: LangkahPembelajaran[];
  penutup: LangkahPembelajaran[];
}

export interface GeneratedSteps {
  pemahaman_bermakna: string;
  pertemuan: PertemuanData[] | PertemuanDataDetail[];
}

export interface AktivitasLKPD {
  judul: string;
  jenis: string;
  teks_pendukung?: string;  // Teks/bacaan yang direferensikan dalam aktivitas
  instruksi: string;
  pertanyaan_kunci: string[];
  format_jawaban: string;
  // Image support for LKPD activities
  image?: string;           // URL gambar ilustrasi
  image_prompt?: string;    // Prompt untuk generate
}

export interface LKPDData {
  judul_lkpd: string;
  petunjuk_belajar: string[];
  informasi_pendukung: string;
  pertanyaan_pemantik: string;
  masalah_kontekstual: string;
  aktivitas_utama: AktivitasLKPD[];
  refleksi: {
    diri: string[];
    sejawat: string[];
  };
}

// Asesmen Awal (Diagnostik) - Assessment for Learning
export interface AsesmenAwalItem {
  pertanyaan: string;
  tujuan: string;
}

// Asesmen Proses (Formatif) - Assessment as Learning
export interface AsesmenProsesAktivitas {
  nama: string;
  instruksi: string;
  pertanyaan_diskusi: string[];
  kunci_jawaban: string[];
}

export interface RubrikPenilaian {
  aspek: string;
  sangat_baik: string;
  baik: string;
  cukup: string;
  kurang: string;
}

// Asesmen Akhir (Sumatif) - Assessment of Learning
export interface AsesmenAkhirSoal {
  no: number;
  pertanyaan: string;
  kunci_jawaban: string;
  skor: number;
}

export interface AsesmenData {
  asesmen_awal: {
    deskripsi: string;
    metode: string;
    items: AsesmenAwalItem[];
  };
  asesmen_proses: {
    deskripsi: string;
    metode: string;
    aktivitas: AsesmenProsesAktivitas[];
    rubrik: RubrikPenilaian[];
    penilaian_diri: string[];
    penilaian_sejawat: string[];
  };
  asesmen_akhir: {
    deskripsi: string;
    metode: string;
    soal: AsesmenAkhirSoal[];
    rubrik: RubrikPenilaian[];
    pedoman_penskoran: {
      skor_total: number;
      rumus_nilai: string;
    };
  };
}

// Legacy RubrikItem for backwards compatibility
export interface RubrikItem {
  kriteria: string;
  mahir: string;
  cakap: string;
  layak: string;
  berkembang: string;
}

export interface IsiMateri {
  sub_judul: string;
  poin_utama: string;         // Ringkasan inti (untuk highlight box)
  penjelasan_detail: string;  // Uraian utama (paragraf)
  contoh_konkret: string;     // Contoh aplikatif (untuk example box)
  istilah_penting?: string;   // Kata kunci opsional
  // Legacy + image support
  uraian?: string;            // Backward compat
  image?: string;             // URL gambar ilustrasi
  image_prompt?: string;      // Prompt untuk generate
}

export interface MateriData {
  judul_materi: string;
  pendahuluan: string;
  header_image?: string;     // Header illustration
  header_image_prompt?: string;
  isi_materi: IsiMateri[];
  fakta_unik: string;
  glosarium: { istilah: string; definisi: string }[];
  referensi: string[];
}

export interface TindakLanjutData {
  refleksi_guru: string[];
  refleksi_siswa: string[];
  remedial: string;
  pengayaan: string;
}

// TKA: Pernyataan Benar/Salah
export interface PernyataanBenarSalah {
  pernyataan: string;
  jawaban: 'Benar' | 'Salah';
}

// TKA: Pernyataan Kategori (A-D/E)
export interface PernyataanKategori {
  pernyataan: string;
  jawaban: string;
}

export interface SoalItem {
  no: number;
  tipe: string;
  level_kognitif?: string;
  indikator_soal?: string;
  pertanyaan: string;
  stimulus_id?: number;                           // ID stimulus jika menggunakan multiple stimulus
  stimulus_image?: string;                        // URL gambar stimulus per soal (Pollinations AI)
  stimulus_image_prompt?: string;                 // Prompt untuk generate gambar per soal
  requires_image?: boolean;                       // Ditandai AI/user: soal ini butuh gambar (menampilkan generator)
  opsi?: string[];                                // PG Biasa & MCMA
  pernyataan_benar_salah?: PernyataanBenarSalah[]; // TKA Kategori Benar/Salah
  pernyataan_kategori?: PernyataanKategori[];      // TKA Kategori A-D/E
  kategori_opsi?: string[];                       // Deskripsi kategori A-D/E
  premis?: string[];                              // Menjodohkan
  respon?: string[];                              // Menjodohkan
  kunci: string | string[];                       // Support array for MCMA
  pembahasan: string;
  skor: number;
}

export interface KisiKisi {
  kompetensi_dasar: string;
  indikator: string[];
}

export interface StimulusItem {
  id: number;
  teks: string;
  image?: string;                    // URL gambar stimulus (Pollinations AI)
  image_prompt?: string;             // Prompt untuk generate
}

export interface BankSoalData {
  judul_latihan: string;
  stimulus: string;
  stimulus_image?: string;           // URL gambar stimulus utama (Pollinations AI)
  stimulus_image_prompt?: string;    // Prompt untuk generate gambar
  stimulus_list?: StimulusItem[];    // Multiple stimulus untuk soal > 5
  kisi_kisi?: KisiKisi;
  daftar_soal: SoalItem[];
  pedoman_penilaian: {
    skor_maksimal: number;
    rumus: string;
  };
}

export interface Profile {
  name: string;
  data: Partial<FormData>;
}

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

// === PROTA (Program Tahunan) ===
export interface ProtaItem {
  no: number;
  tujuan_pembelajaran: string;
  materi_pokok: string;
  alokasi_jp: number;
  semester: 1 | 2;
  dimensi_profil_lulusan: string[];
  panca_cinta?: string;
  keterangan: string;
  generated?: boolean; // tracking apakah sudah di-generate modul ajar
  // Legacy field support
  profil_pelajar_pancasila?: string[];
}

export interface ProtaData {
  prota: ProtaItem[];
  total_jp_sem1: number;
  total_jp_sem2: number;
}

export interface KalenderPendidikan {
  jpPerMinggu: number;
  mingguEfektifSem1: number;
  mingguEfektifSem2: number;
  tanggalMulaiSem1: string;
  tanggalMulaiSem2: string;
}

// === KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) ===
export interface KKTPIndikator {
  no_indikator: string;
  indikator: string;
  belum_berkembang: string;
  mulai_berkembang: string;
  berkembang_sesuai_harapan: string;
  sangat_berkembang: string;
}

export interface KKTPItem {
  no: number;
  tujuan_pembelajaran: string;
  indikator: KKTPIndikator[];
}

export interface KKTPData {
  kktp: KKTPItem[];
}

// === PROSEM (Program Semester) ===
export interface ProsemEvent {
  nama: string;
  semester: 1 | 2;
  bulan: number; // 1-12
  mingguKe: number; // 1-5
  tipe: 'PTS' | 'PAS' | 'Libur Nasional' | 'Libur Sekolah';
}

export interface ProsemWeekCell {
  hasActivity: boolean;
  jp?: number;
}

export interface ProsemRow {
  no: number;
  tujuan_pembelajaran: string;
  materi_pokok: string;
  alokasi_jp: number;
  weeks: Record<string, ProsemWeekCell>; // key: "2025-07-W1" format
}

export interface ProsemMonth {
  bulan: number;
  tahun: number;
  mingguCount: number;
}

export interface ProsemData {
  semester: 1 | 2;
  rows: ProsemRow[];
  events: ProsemEvent[];
  months: ProsemMonth[];
}

// =====================================================================
// ============ HIERARKI BAB → SUBMATERI → PERTEMUAN (Tahap 1) =========
// =====================================================================
// Tipe-tipe di bawah ini ADDITIVE. Tidak dipakai oleh kode lama.
// Komponen yang belum diupdate tetap memakai `FormData.pertemuan` flat.
// Mode hierarki aktif HANYA jika `FormData.struktur` ada (lihat Index.tsx
// fase berikutnya). Tanpa itu, perilaku aplikasi tidak berubah sama sekali.

/** Satu pertemuan di dalam submateri (durasi default 90 menit / 2 JP). */
export interface PertemuanHierarki {
  id: string;            // uuid lokal
  nomor: number;         // urutan dalam submateri (1..n)
  durasi: string;        // e.g. "2 x 45 menit"
}

/** Submateri di dalam Bab (default 4 JP = 2 pertemuan). */
export interface SubmateriInput {
  id: string;
  judul: string;
  alokasiJP: number;     // default 4
  pertemuan: PertemuanHierarki[];
}

/** Bab — root unit perencanaan baru. */
export interface BabInput {
  id: string;
  judul: string;
  totalJP: number;       // = sum(submateri.alokasiJP)
  submateri: SubmateriInput[];
}

/** Konfigurasi struktur hierarki di FormData (opsional). */
export interface StrukturHierarki {
  bab: BabInput;
  /** Materi Ajar: true = per pertemuan, false = 1 per submateri. Default true. */
  toggleMateriPerPertemuan: boolean;
  /** Asesmen: true = per pertemuan, false = 1 per submateri. Default true. */
  toggleAsesmenPerPertemuan: boolean;
}

// ---------- Ringkasan untuk context-passing antar pertemuan ----------

/** Ringkasan pertemuan untuk menjaga kesinambungan antar pertemuan. */
export interface PertemuanSummary {
  pertemuanId: string;
  nomor: number;
  submateriJudul: string;
  tpDicapai: string[];      // 1-3 bullet
  topikDibahas: string[];   // 1-3 bullet
  poinPenutup: string;      // 1 kalimat dari penutup/refleksi
}

// ---------------- Container hasil generate (per Bab) ----------------

/** Dokumen-dokumen untuk 1 pertemuan. */
export interface PertemuanDocs {
  pertemuanId: string;
  modul?: PertemuanDataDetail;     // 1 pertemuan saja
  lkpd?: LKPDData;
  refleksi?: TindakLanjutData;
  materi?: MateriData;             // null jika toggle global
  asesmen?: AsesmenData;           // null jika toggle global
}

/** Hasil per submateri. */
export interface SubmateriResult {
  submateriId: string;
  pertemuanDocs: Record<string, PertemuanDocs>; // key = pertemuanId
  materiGlobal?: MateriData;       // dipakai jika toggleMateriPerPertemuan = false
  asesmenGlobal?: AsesmenData;     // dipakai jika toggleAsesmenPerPertemuan = false
}

/** Preface Bab: field-field top-level modul (identifikasi murid, jenis pengetahuan, dll.)
 *  Dihasilkan sekali per Bab via type 'modul', pertemuan-nya dibuang. */
export interface BabModulPreface {
  pemahaman_bermakna?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auto_generated?: any;
}

/** Hasil per Bab — root state baru (akan dipakai di tahap selanjutnya). */
export interface BabResult {
  babId: string;
  submateri: Record<string, SubmateriResult>;
  bankSoal?: BankSoalData;                          // tetap level Bab
  contextSummary: Record<string, PertemuanSummary>; // key = pertemuanId
  modulPreface?: BabModulPreface;                   // preface top-level modul
}

// ---------------- Helper detection ----------------

/**
 * Apakah FormData memakai mode hierarki baru?
 * Selama `formData.struktur` tidak ada → mode legacy (perilaku lama).
 */
export const isModeHierarki = (
  formData: Pick<FormData, 'pertemuan'> & { struktur?: StrukturHierarki }
): boolean => !!formData.struktur;

// =====================================================================
// ================ V2 SCHEMA — Dokumen per Pertemuan ==================
// =====================================================================
// Additive types. Tidak dipakai oleh flow produksi selama feature flag
// ENABLE_PERTEMUAN_DOCS_V2 masih false. Aman untuk dibiarkan.

export type JenisDokumenPertemuan =
  | 'modul'
  | 'lkpd'
  | 'asesmen'
  | 'soal'
  | 'materi'
  | 'refleksi';

export type StatusGenerateDokumen = 'idle' | 'pending' | 'ok' | 'error';

export interface PilihanDokumenPertemuan {
  modul: true;
  lkpd: boolean;
  asesmen: boolean;
  soal: boolean;
  materi: boolean;
  refleksi: boolean;
}

/** Modul per pertemuan mendukung dua bentuk demi kompatibilitas: bentuk baru
 *  (`PertemuanDataDetail` dengan tahap_awal/inti/penutup) dan bentuk legacy
 *  (`PertemuanData` dengan pembukaan/inti/penutup). */
export type ModulPertemuanV2 = PertemuanData | PertemuanDataDetail;

/** Dokumen milik satu pertemuan (Modul wajib per pertemuan). */
export interface DokumenPertemuan {
  modul?: ModulPertemuanV2;
  lkpd?: LKPDData;
  asesmen?: AsesmenData;
  soal?: BankSoalData;
  materi?: MateriData;
  refleksi?: TindakLanjutData;
}

/** Dokumen non-Modul: dipakai di container global/submateri. */
export interface DokumenNonModul {
  lkpd?: LKPDData;
  asesmen?: AsesmenData;
  soal?: BankSoalData;
  materi?: MateriData;
  refleksi?: TindakLanjutData;
}

export interface PertemuanResult {
  id: string;
  nomor: number;
  /** Canonical durasi dalam menit (untuk kalkulasi & prompt). */
  durasiMenit: number;
  /** Label asli dari input (misal "2 x 45 menit"), opsional. */
  durasiLabel?: string;
  submateriId?: string;
  submateriJudul?: string;
  pilihanDokumen: PilihanDokumenPertemuan;
  dokumen: DokumenPertemuan;
  status: Partial<Record<JenisDokumenPertemuan, StatusGenerateDokumen>>;
  errors?: Partial<Record<JenisDokumenPertemuan, string>>;
}

export interface GenerationResultV2 {
  version: 2;
  pertemuan: PertemuanResult[];
  /** Dokumen non-Modul yang berlaku 1× per Bab/generate (legacy juga masuk sini). */
  dokumenGlobal?: DokumenNonModul;
  /** Dokumen non-Modul yang berlaku per submateri (key = submateriId). */
  dokumenSubmateri?: Record<string, DokumenNonModul>;
  babId?: string;
  modulPreface?: BabModulPreface;
}

