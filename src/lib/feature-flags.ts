/**
 * Feature flags aplikasi.
 * Semua flag default OFF di produksi.
 */

/**
 * Mengaktifkan arsitektur "Dokumen per Pertemuan V2".
 * Default TRUE di seluruh lingkungan (produksi, preview, staging, dev)
 * agar UI/UX konsisten dengan sistem pertemuan modern.
 * Hanya bernilai false jika secara eksplisit disetel 'false' di env.
 */
export const ENABLE_PERTEMUAN_DOCS_V2: boolean =
  import.meta.env.VITE_ENABLE_PERTEMUAN_DOCS_V2 !== 'false';

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

