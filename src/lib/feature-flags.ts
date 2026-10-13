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
 * Aturan Akses Mode Sekolah:
 * Dibuka untuk:
 * 1. Admin platform.
 * 2. Akun pilot Deploy Terbatas (jagofeed@gmail.com).
 * 3. Akun guru/waka/kepsek yang berafiliasi dengan sekolah berlangganan aktif (subscription_expires_at > now()).
 */
export const isSchoolFeatureAccessible = (
  userEmail?: string | null,
  isAdmin: boolean = false,
  hasActiveSchoolSubscription: boolean = false
): boolean => {
  if (isAdmin) return true;
  if (hasActiveSchoolSubscription) return true;
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === 'jagofeed@gmail.com';
};

