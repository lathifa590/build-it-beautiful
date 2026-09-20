/**
 * Feature flags aplikasi.
 * Semua flag default OFF di produksi.
 */

/**
 * Mengaktifkan arsitektur "Dokumen per Pertemuan V2".
 * Selama false, seluruh flow produksi (state, preview, export, history, backend)
 * TIDAK berubah. Flag ini hanya dibaca oleh kode V2 yang akan datang di fase
 * berikutnya.
 *
 * Aktifkan lewat env var `VITE_ENABLE_PERTEMUAN_DOCS_V2=true` saat build dev.
 * Jangan mengaktifkan lewat localStorage di produksi.
 */
export const ENABLE_PERTEMUAN_DOCS_V2: boolean =
  import.meta.env.VITE_ENABLE_PERTEMUAN_DOCS_V2 === 'true';

/**
 * Kontrol tampilan format dokumen alternatif (Minimalis Bersih, Modular, dll).
 * Disembunyikan sementara (default false) sampai template benar-benar sempurna.
 */
export const ENABLE_OUTPUT_FORMAT_SELECTOR: boolean = false;

/**
 * Aturan Deploy Terbatas Mode Sekolah:
 * Sesuai panduan di AGENTS.md, akses fitur Sekolah dalam tahap rilis terbatas
 * hanya dibuka untuk Admin dan akun jagofeed@gmail.com.
 */
export const isSchoolFeatureAccessible = (
  userEmail?: string | null,
  isAdmin: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === 'jagofeed@gmail.com';
};
