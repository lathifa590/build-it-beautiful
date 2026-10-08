# Log: Transformasi Bank Modul Sekolah Menjadi Google Shared Drive (Hierarki 3 Level), Sinkronisasi Workspace, & Mitigasi Kuota Supabase

**Tanggal**: 08 Oktober 2026  
**Konteks**: Audit komprehensif fitur Mode Sekolah, perbaikan bug Cartesian product pada kalkulasi JP monitoring, penyelesaian kebocoran kuota Supabase Free Tier (Log Ingestion & Egress), dan perombakan menyeluruh arsitektur Bank Modul Sekolah dari dokumen lepasan menjadi sistem **Google Shared Drive Sekolah Berjenjang 3 Level**.

---

## 1. Latar Belakang & Akar Permasalahan

### A. Inkonsistensi Data Monitoring vs. Bank Modul Sekolah
- **Temuan**: Pada akun Waka Kurikulum (`jagofeed@gmail.com`), Dashboard Monitoring mencatat 113 dokumen selesai dan ketuntasan JP, tetapi halaman **Bank Modul Sekolah** kosong melompong (0 dokumen).
- **Akar Masalah**:
  1. Dashboard Monitoring membaca langsung tabel `public.documents` (dokumen privat draf guru di tiap pertemuan workspace).
  2. Bank Modul Sekolah membaca tabel `public.school_documents`, yang hanya terisi jika guru secara manual masuk ke editor tiap pertemuan dan mengklik tombol *"Bagikan ke Bank Sekolah"*.
  3. Meminta guru mengklik share satu per satu hingga 113 kali sangat tidak realistis dan menyebabkan Bank Modul selalu kosong.

### B. Masalah Tampilan Kartu Dokumen Tercecer & Preview Mentah
- Saat dilakukan otomatisasi penarikan dokumen draf workspace, muncul **101 kartu dokumen lepasan** (Modul Ajar, LKPD, Asesmen, Soal, Materi, Refleksi dipisah per kartu).
- **Evaluasi Pengguna**:
  1. *Tidak Rasional*: Untuk 1 guru dan 1 mapel saja ada 101 kartu; jika 1 sekolah memiliki 25 mapel, Waka harus memeriksa ribuan kartu berserakan.
  2. *Format Preview Buruk*: Modal pratinjau dokumen menampilkan string JSON mentah (`{"jenis": "Analisis Visual..."}`), bukan format lembar kerja cetak rapi seperti di workspace guru.
  3. *Kesatuan Dokumen*: Dalam 1 pertemuan pembelajaran Kurikulum Merdeka, Modul Ajar, LKPD, Asesmen, Bank Soal, Materi, dan Refleksi adalah **1 dokumen utuh yang tidak boleh dipisah-pisah**.

### C. Masalah Lonjakan Kuota Supabase Free Tier (Log Ingestion 412% & Egress 163%)
- Terjadi kebocoran kuota akibat cron job polling `process-generation-queue-poll` yang berjalan setiap 1 menit (43.200x eksekusi/bulan) dan cron blog generator yang berjalan setiap 1 jam.
- Interval frontend polling setiap 5 detik di `WorkspaceExplorerShell.tsx` memicu konsumsi log dan transfer data yang tidak perlu.

---

## 2. Kesepakatan & Visi Baru: "Google Shared Drive Sekolah"

Berdasarkan diskusi dengan pengguna, disepakati arsitektur baru:
1. **Akses Shared Drive Otomatis**: Seluruh folder workspace perangkat ajar yang disusun oleh dewan guru aktif di sekolah tersebut otomatis langsung muncul di Bank Modul Sekolah tanpa perlu guru mengklik tombol bagikan satu per satu.
2. **Hak Akses Rekan Guru & Tim Kurikulum (Read-Only)**: Waka Kurikulum dan Kepala Sekolah memiliki wewenang memantau dan mengurasi semua folder guru, serta sesama rekan guru dapat saling melihat dan mempelajari perangkat ajar satu sekolah (akses read-only).
3. **Hierarki 3 Tingkat (Folder Berjenjang)**:
   - **Level 1**: Etalase Folder Workspace per Guru & Mapel.
   - **Level 2**: Daftar Pertemuan dalam Workspace terpilih (menampilkan indikator kelengkapan 6-in-1).
   - **Level 3**: Viewer Pertemuan Utuh (`SchoolMeetingViewer`) yang identik 100% dengan tampilan asli workspace guru, dilengkapi 6 tab sub-dokumen dan fitur Export Word/PDF.

---

## 3. Rincian Implementasi Arsitektur 3 Level

```
[ LEVEL 1: Bank Modul Sekolah ]
└── Grid Folder Mapel Dewan Guru (Contoh: Matematika Kelas V - Joko)
    │
    └── [ LEVEL 2: Daftar Pertemuan ]
        ├── Pertemuan 1 (Status: 6/6 Komponen Lengkap)
        ├── Pertemuan 2 (Status: 6/6 Komponen Lengkap)
        └── Pertemuan 3 ...
            │
            └── [ LEVEL 3: Viewer Utuh Pertemuan ]
                ├── Header: Identitas Guru, Mapel, Alokasi JP & Tombol Export (.docx/PDF)
                ├── Tabs: [ Modul Ajar • ] [ LKPD • ] [ Asesmen • ] [ Soal • ] [ Materi • ] [ Refleksi • ]
                └── Viewer: Render Dokumen Resmi A4 menggunakan DocumentPreview
```

### A. Level 1: Etalase Folder Workspace Guru (`src/pages/sekolah/Bank.tsx`)
- Menampilkan kartu folder bergaya Google Drive:
  - Ikon Folder bernuansa neo-brutalisme (`FolderOpen`).
  - Identitas Mapel, Kelas, Fase, dan Tahun Ajaran.
  - Profil Guru Penyusun (Avatar, Nama, Email, Badge Peran).
  - Indikator Ketuntasan JP (contoh: `54 / 72 JP - 75% Tuntas`) dan jumlah pertemuan terdaftar.
  - Filter pencarian: Input teks, Filter Guru, dan Filter Mata Pelajaran.
  - Aksi: Tombol `Buka Folder →` langsung membuka Level 2.

### B. Level 2: Daftar Pertemuan dalam Workspace
- Menampilkan seluruh alokasi pertemuan pada workspace yang dipilih:
  - Header rekapitulasi data guru dan alokasi mapel.
  - Tombol `← Kembali ke Semua Folder Guru`.
  - Filter pencarian materi/topik pertemuan.
  - Baris kartu pertemuan:
    - Judul pertemuan, materi pokok, alokasi JP / menit.
    - **Pill Indikator Kelengkapan 6-in-1**: Menampilkan badge berwarna untuk komponen yang sudah dibuat (`Modul`, `LKPD`, `Asesmen`, `Soal`, `Materi`, `Refleksi`) dan coret/redup untuk yang belum dibuat.
    - Status ringkasan: `6/6 Komponen Lengkap`.
  - Aksi: Tombol `Buka Perangkat Ajar →` membuka Level 3.

### C. Level 3: Viewer Pertemuan Utuh (`src/components/school/SchoolMeetingViewer.tsx`)
- Mengadaptasi layout editor workspace guru dalam mode baca/review:
  - **Bilah Atas & Aksi**:
    - Tombol `← Kembali ke Daftar Pertemuan`.
    - Tombol **Cetak / PDF** (`window.print()`).
    - Tombol **Export Dokumen (.docx)** memanfaatkan dialog dan engine `useV2Export`.
    - Tombol **Jadikan Template Sekolah** (khusus akun Waka/Kepsek/Admin).
  - **6 Tab Sub-Dokumen**:
    - `[ Modul Ajar • ]`, `[ LKPD • ]`, `[ Asesmen • ]`, `[ Bank Soal • ]`, `[ Materi • ]`, `[ Refleksi • ]`.
    - Dilengkapi indikator titik hijau untuk menandakan ketersediaan dokumen.
  - **Engine Preview Resmi**:
    - Menggunakan `DocumentPreview` (`src/components/modul/DocumentPreview.tsx`) dengan `v2Mode={true}` dan `isModulComplete={true}`.
    - Memformat otomatis tabel identifikasi kurikulum, langkah pembelajaran sintaks, lembar kerja siswa berkotak, kisi-kisi asesmen, serta soal pilihan ganda/esai.

---

## 4. Keamanan & Database RLS Policies

Diterapkan migrasi database melalui Supabase Management API:

### A. Migrasi `20261008173000_fix_school_progress_cartesian.sql`
- Memperbaiki bug perkalian silang (Cartesian product) pada `get_school_progress` dan `get_school_supervision_report`.
- Mengisolasi agregasi pertemuan, dokumen, dan sekolah menggunakan CTE terpisah.
- Menambahkan kolom `completed_jp` dan kalkulasi persentase rasio riil.

### B. Migrasi `20261008190000_school_shared_drive_rls_and_hierarchy.sql`
1. **Fungsi Keamanan `is_same_school_member(_owner_id UUID)`**:
   - Memvalidasi apakah user yang sedang login (`auth.uid()`) dan pemilik workspace (`_owner_id`) berada dalam sekolah yang sama dengan status aktif (`school_status = 'active'`).
2. **Kebijakan RLS SELECT (Read-Only) Lintas Rekan Guru**:
   - `public.workspaces`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.curriculum_plans`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.prosem_items`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.meeting_slots`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.meeting_document_links`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.documents`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - `public.document_versions`: Boleh dibaca oleh admin atau anggota sekolah yang sama.
   - *Catatan*: Hak INSERT, UPDATE, dan DELETE tetap **terkunci 100% hanya untuk pemilik data**.
3. **Fungsi RPC Teroptimasi**:
   - `get_school_shared_workspaces`: Mengagregasi data folder workspace, jumlah pertemuan, total JP, dan dokumen siap pakai per guru.
   - `get_school_workspace_meetings`: Mengambil slot pertemuan beserta flag ketersediaan 6 sub-dokumennya.
   - `get_school_meeting_full_detail`: Mengambil seluruh konten JSON 6 komponen dalam 1 kali pemanggilan RPC hemat bandwidth.

---

## 5. Mitigasi Kuota Supabase (Egress & Log Ingestion)

1. **Unschedule Cron Polling Berlebihan**:
   - Mematikan cron `process-generation-queue-poll` (berjalan setiap 1 menit) via SQL `cron.unschedule()`.
   - Mengubah cron auto-generate artikel blog dari setiap 1 jam menjadi **setiap 2 hari sekali** (`0 23 */2 * *` / pukul 06:00 WIB).
2. **Database Table Purge**:
   - Menghapus log request/response kadaluarsa di tabel `net._http_response`.
   - Membersihkan draf antrean gagal lama di `generation_queue` dan versi usang di `document_versions`.
3. **Frontend Polling Disablement**:
   - Di `src/components/workspace/explorer/WorkspaceExplorerShell.tsx`, parameter `canAccessAutoGenerate` diset `false` untuk menghentikan interval polling 5 detik.

---

## 6. Berkas yang Dimodifikasi dan Dibuat

| Berkas | Perubahan |
|---|---|
| `supabase/migrations/20261008173000_fix_school_progress_cartesian.sql` | Memperbaiki Cartesian product join & sinkronisasi JP. |
| `supabase/migrations/20261008183000_school_bank_workspace_sync.sql` | Migrasi awal RPC sync dokumen workspace. |
| `supabase/migrations/20261008190000_school_shared_drive_rls_and_hierarchy.sql` | RLS Read-Only sekolah & RPC hierarki 3 level. |
| `src/types/school.ts` | Tipe data `SchoolSharedWorkspace`, `SchoolWorkspaceMeetingItem`, `SchoolMeetingFullDetail`. |
| `src/lib/school-api.ts` | Method API `getSchoolSharedWorkspaces`, `getSchoolWorkspaceMeetings`, `getSchoolMeetingFullDetail`. |
| `src/components/school/SchoolMeetingViewer.tsx` | Komponen viewer pertemuan utuh (Level 3) dengan 6 tab dan export V2. |
| `src/pages/sekolah/Bank.tsx` | Implementasi navigasi 3 level: Folder Guru → Daftar Pertemuan → Viewer Dokumen. |
| `src/pages/sekolah/Dashboard.tsx` & `Export.tsx` | Penyesuaian tampilan rasio JP selesai. |
| `src/components/workspace/explorer/WorkspaceExplorerShell.tsx` | Mematikan autogenerate polling background. |

---

## 7. Status Pengujian & Deploy

- **TypeScript & Build**: `npm run build` sukses 100% tanpa error (waktu kompilasi ~22 detik).
- **Git Commit**: 
  - `bdec8bb`: Fix Cartesian product and progress ratio.
  - `a5972e7`: Disable autogenerate banner & polling.
  - `357564d`: Initial workspace sync implementation.
  - `7ba50cb`: Implement 3-level Google Shared Drive hierarchy for Bank Modul.
- **Git Push**: Berhasil di-push ke remote `origin/main` (`https://github.com/lathifa590/build-it-beautiful.git`).
