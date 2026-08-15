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
