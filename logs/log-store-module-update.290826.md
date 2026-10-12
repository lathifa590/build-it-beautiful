# Log Pengembangan: Modul Toko (Fase 4B.1)
**Tanggal:** 29 Agustus 2026
**Konteks:** Penyelesaian arsitektur Modul Toko untuk pengguna PRO, implementasi strategi *Auto-ZIP*, serta penyempurnaan fitur pendukung seperti Kupon Diskon dan penyesuaian istilah aplikasi.

## 🎯 Tujuan Utama
1. **Penyederhanaan Ekspor Modul ke Toko:** Menggantikan rencana awal "Cloning Database" (yang rumit untuk pembeli) dengan strategi "Auto-ZIP" yang lebih praktis, langsung dari Workspace.
2. **Penyempurnaan Manajemen Toko (React Query):** Migrasi *state management* tab profil, katalog produk, dan kupon diskon menggunakan `@tanstack/react-query` + fungsi API tersentralisasi di `storeApi`.
3. **Peningkatan Keamanan Storage:** Menyiapkan bucket Supabase yang sesuai standar keamanan (publik untuk aset preview dan privat untuk dokumen berbayar).
4. **Penyesuaian Copywriting/Terminologi:** Mengadaptasi istilah "Karya" menjadi "Modul Ajar" dan "Produk" agar selaras dengan identitas aplikasi ModulAjar Generator.

## 🛠️ Implementasi dan Perubahan

### 1. Migrasi Database & Supabase Storage
- **File Migrasi:** `20260829105000_store_auto_zip.sql` (disatukan dalam snapshot SQL).
- **Storage Buckets:** 
  - `modul_store_assets` (Publik): Untuk Avatar, Banner, URL Preview.
  - `modul_store_files` (Privat): Untuk produk asli (`.zip` / `.pdf`), di mana pembeli harus memiliki status pembayaran "SELESAI" untuk mengunduh.
- **RPC:** Menambahkan fungsi `increment_store_metric` di Supabase untuk tracking metrik view, klik, dan revenue toko dengan aman.

### 2. Integrasi React Query & API
- **File Referensi:** `src/lib/store-api.ts`
- Menyediakan metode abstrak `uploadStoreAsset`, `uploadStoreFile`, dan `upsertCoupon`.
- Me-refactor `StoreProfileTab.tsx`, `StoreListingsTab.tsx`, dan `StoreCouponsTab.tsx` agar 100% menggunakan arsitektur mutasi standar berbasis `@tanstack/react-query`, memastikan sinkronisasi data seketika tanpa perlu *page reload*.

### 3. Fitur Utama Terkirim
- **Auto-ZIP dari Workspace:** 
  - Menambahkan pustaka `jszip`.
  - Mengubah fungsi ekspor pada `src/lib/export-word.ts` (Program Tahunan & Program Semester) untuk mendukung pengembalian tipe objek `Blob`.
  - Membangun komponen `StorePublishModal` dan tombol pemicu "Publish ke Toko" pada menu `WorkspaceDashboard`. Modul dikompilasi secara on-the-fly menjadi `Paket_Modul.zip` dan di-push ke Storage.
- **Kupon Diskon (Promo):**
  - Mengaktifkan UI dan API untuk `StoreCouponsTab`. Pengguna dapat mengatur kode promo, tipe diskon (nominal atau persentase), nilai diskon, limit penggunaan, dan minimal pembelian.
- **Penyesuaian Istilah/Kosakata:**
  - Menghapus semua penyebutan "Karya" (Sisa terminologi dari kode dasar/PosterEdu). Semuanya telah disesuaikan menjadi "Modul Ajar" (contoh: "Katalog Modul Ajar", "Pesanan Modul Ajar").

## 📌 Status Terkini
Seluruh *checklist* fitur Fase 4B.1 Toko telah **SELESAI** dan diuji. Modul siap untuk rilis internal (dan telah dikomunikasikan di draf WhatsApp untuk para pengguna PRO).
