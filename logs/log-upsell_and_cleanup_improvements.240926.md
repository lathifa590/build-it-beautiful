# Log Pembaruan Konteks & Implementasi Fitur
**Tanggal:** 24 September 2026
**Konteks:** Perbaikan Stabilitas Antrean (Queue), Pembersihan Otomatis (Auto-Cleanup) Database, Upsell Workspace, dan Fitur Mulok (Muatan Lokal).

---

## 1. Perbaikan *Generation Queue* (Antrean Background)
- **Masalah:** Proses *generate* di latar belakang sering "stuck" (macet) tanpa error, dan *loader* berjalan terus tanpa henti.
- **Penyebab:** 
  - Kegagalan *webhook* untuk memberikan konfirmasi selesai kepada *frontend*.
  - Fungsi `process-generation-queue` mengambil *job* orang lain secara acak karena *batch limit* dan tidak memprioritaskan sesi yang sedang aktif.
- **Solusi:**
  - Menambahkan *active polling* menggunakan `setInterval` (berjalan setiap 5 detik) di dalam `WorkspaceExplorerShell.tsx` untuk secara proaktif mengambil status terbaru meskipun *webhook* gagal.
  - Memodifikasi `supabase/functions/process-generation-queue/index.ts` untuk memprioritaskan eksekusi berdasarkan `workspace_id` milik pengguna yang sedang meminta antrean.
  - Menambahkan tombol **"Batalkan Semua"** di UI agar pengguna dapat mereset tumpukan antrean mereka yang "nyangkut".

## 2. Pembersihan Otomatis Database (Cron Jobs)
- **Masalah:** Database Supabase membengkak dan mendekati batas *Free Tier* (500 MB), di mana log bawaan (`cron.job_run_details`) memakan >50MB.
- **Solusi:** 
  - Membuat dan mengaktifkan 2 fungsi Cron di Supabase menggunakan ekstensi `pg_cron`.
  - **`cleanup-system-logs`** (berjalan tiap tengah malam): Menghapus antrean `generation_queue` yang sudah selesai/gagal lebih dari 7 hari, dan menghapus log `cron.job_run_details` yang berumur lebih dari 3 hari.
  - **`cleanup-expired-workspaces`** (berjalan tiap Minggu malam): Menghapus otomatis *workspace* yang dibuat > 365 hari lalu (tahun ajaran usai), atau tidak diubah/diakses selama > 60 hari.

## 3. Implementasi Batasan Workspace & Skema Upsell
- **Konteks:** Fitur Workspace sering disalahgunakan oleh sekolah (1 akun gratis dipakai ramai-ramai untuk banyak *workspace*), yang awalnya membebani sistem namun diputar strateginya menjadi *opportunity* untuk **Upsell (PRO)**.
- **Solusi:**
  - Melakukan limitasi di komponen `WorkspaceDashboard.tsx` dan `WorkspaceSelector.tsx`.
  - **Free Tier:** Maksimal 3 *workspace*.
  - **PRO Tier:** Maksimal 10 *workspace*.
  - Diberlakukan *Grandfather Clause*: Jika pengguna telanjur memiliki belasan *workspace* sebelum aturan ini rilis, *workspace* lama tidak dihapus/dikunci dan tetap bisa digunakan. Namun, mereka akan terblokir jika ingin membuat *workspace* baru, dan harus menghapus beberapa *workspace* lama atau **Upgrade ke PRO**.

## 4. Input CP Manual untuk Muatan Lokal (Mulok)
- **Konteks:** Banyak sekolah memiliki mata pelajaran khusus (seperti BPI / Bina Pribadi Islam) atau Mulok yang tidak memiliki referensi resmi Capaian Pembelajaran (CP) dari kementerian.
- **Solusi:**
  - Menambahkan opsi/tombol **"Tulis CP Manual"** di dalam komponen `StepCpTp.tsx` bersandingan dengan tombol "Pilih CP Resmi".
  - Saat diklik, sebuah *textarea* akan muncul untuk menerima input teks mentah secara bebas tanpa batasan karakter.
  - Menambahkan validasi kosong sebelum bisa beralih ke kalender pendidikan.
