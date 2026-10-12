# Log: Mode Sekolah, Penyembunyian Format Selector, dan Deploy Terbatas Cloudflare
**Tanggal**: 20 September 2026  
**Konteks**: Pengembangan menyeluruh fitur Mode Sekolah (Fase S1-S3 + Security Hardening), penyembunyian pemilih format dokumen alternatif (default Tabel Lengkap), serta pelaksanaan isolasi Deploy Terbatas ke Cloudflare Workers.

---

## 1. Latar Belakang & Kebutuhan Pengguna

1. **Pengembangan & Pengamanan Mode Sekolah**:
   - Fitur Mode Sekolah dibangun untuk memfasilitasi kolaborasi tingkat institusi: Bank Modul Bersama, Standar Kurikulum Waka, Kalender Pendidikan, dan Monitoring Beban Ajar Guru.
   - Mengatasi potensi celah NPSN publik dengan merancang sistem verifikasi bertingkat: *Dynamic Invite Code* + *Approval Workflow* Waka/Kepsek.
2. **Penyembunyian Pemilih Tampilan Dokumen**:
   - Template alternatif (*Minimalis Bersih*, *Per Pertemuan*, *Ringkasan 1 Halaman*, *Panduan Mengajar*, *Modular*) belum disempurnakan seutuhnya.
   - Diminta untuk disembunyikan sementara dari UI preview dokumen dan dialog ekspor agar pengguna umum tidak bingung, dengan mempertahankan format standar resmi (*Tabel Lengkap*) di balik layar.
3. **Aturan Deploy Terbatas**:
   - Sesuai panduan di `AGENTS.md`, seluruh fitur Mode Sekolah harus dikecualikan dari akses publik saat deploy dan hanya dapat diakses oleh Admin serta akun `jagofeed@gmail.com`.

---

## 2. Arsitektur & Rangkuman Teknis Mode Sekolah (Fase S1 – S3)

### A. Fase S1: Registrasi, Sekolah & Keanggotaan
- **Database Migration**: `supabase/migrations/20260920110000_school_phase_s1.sql` & `20260920112500_school_invite_system.sql`.
- **Tabel**: `schools`, `school_members`, `school_calendars`.
- **Keamanan Kode Undangan**:
  - Kolom `invite_code` 8 karakter acak (alphanumeric uppercase).
  - Fungsi RPC `regenerate_school_invite_code(school_id)` untuk reset kode jika bocor.
  - Status keanggotaan: `pending` (menunggu persetujuan), `active`, `rejected`.
- **Antarmuka & Komponen**:
  - `src/pages/sekolah/Join.tsx`: Bergabung via kode undangan atau pencarian NPSN.
  - `src/pages/sekolah/Dashboard.tsx`: Overview profil sekolah, statistik anggota, dan kalender aktif.
  - `src/pages/sekolah/Anggota.tsx`: Manajemen guru dan persetujuan anggota pending.

### B. Fase S2: Bank Modul & Integrasi Workspace
- **Database Migration**: `supabase/migrations/20260920113000_school_phase_s2.sql`.
- **Tabel**: `school_shared_modules` (relasi ke dokumen modul/pertemuan workspace).
- **Alur Kerja**:
  - Guru dapat membagikan dokumen pertemuan (`modul`, `lkpd`, `asesmen`, `soal`, `materi`, `refleksi`) ke Bank Sekolah melalui modal `ShareToSchoolModal.tsx`.
  - Guru lain dalam sekolah yang sama dapat menjelajahi Bank Modul (`src/pages/sekolah/Bank.tsx`) dan menyalin (*clone*) materi langsung ke workspace pribadi mereka.

### C. Fase S3: Kalender Pendidikan & Standar Kurikulum
- **Database Migration**: `supabase/migrations/20260920113500_school_phase_s3.sql`.
- **Tabel**: `school_curriculum_standards`.
- **Fitur**:
  - Waka Kurikulum menetapkan standar JP, minggu efektif, dan kalender kegiatan sekolah (`src/pages/sekolah/Kalender.tsx`).
  - Guru dapat menyinkronkan durasi JP workspace mereka dengan kalender resmi sekolah (`WorkspaceSettingsModal.tsx` & `CreateWorkspaceModal.tsx`).
  - Monitoring kelengkapan perangkat ajar guru se-sekolah (`src/pages/sekolah/Standar.tsx` & `Export.tsx`).
  - Panel manajemen sekolah untuk superadmin (`src/pages/admin/Schools.tsx`).

### D. Security Hardening & Konsistensi UI
- **Database Security Hardening**: `supabase/migrations/20260920140000_school_security_hardening.sql`.
  - Fungsi RPC dibuat idempoten dengan penanganan tipe data eksplisit: `is_school_active`, `regenerate_school_invite_code`, `approve_school_member`, `reject_school_member`, `remove_school_member`.
  - RLS policies ketat membatasi hak baca/tulis berdasarkan keanggotaan aktif dan wewenang peran (Guru, Waka, Kepsek, Admin).
- **Design System Polish (Neobrutalism)**:
  - Mengikuti pedoman `DESIGN_SYSTEM.md`: palet warna warm cream (`#f5f0e8`), terracotta orange (`#c04a1a`), border hitam solid 2px, dan flat brutal shadow.
  - Menghilangkan seluruh warna asing non-brand (`indigo-600`, `purple`, gradien modern).

---

## 3. Penyembunyian Format Selector Dokumen

1. **Feature Flag Baru**:
   - Di `src/lib/feature-flags.ts`:
     ```ts
     export const ENABLE_OUTPUT_FORMAT_SELECTOR: boolean = false;
     ```
2. **UI Index Preview (`src/pages/Index.tsx`)**:
   - Komponen dropdown `Tampilan: [Tabel Lengkap]` (baik pada mode Dokumen per Pertemuan V2 maupun mode legacy) dibungkus dengan `{ENABLE_OUTPUT_FORMAT_SELECTOR && (...)}`.
3. **UI Export Dialog (`src/components/modul/V2ExportDialog.tsx`)**:
   - Blok tombol `TAMPILAN DOKUMEN` disembunyikan dengan `{ENABLE_OUTPUT_FORMAT_SELECTOR && (...)}`.
4. **Stabilitas Format Dokumen**:
   - State format diinisialisasi dan terkunci ke `'tabel'`, memastikan dokumen pratinjau maupun hasil ekspor Word/PDF tetap memakai layout tabel resmi yang rapi dan konsisten.

---

## 4. Implementasi Proteksi Deploy Terbatas

Sesuai aturan `AGENTS.md`:
1. **Route Guard `SchoolPilotRoute.tsx` (`src/components/auth/SchoolPilotRoute.tsx`)**:
   - Memverifikasi login dan memeriksa fungsi `isSchoolFeatureAccessible(user?.email, isAdmin)`.
   - Mengamankan seluruh rute `/sekolah/*` di `src/App.tsx`:
     - `/sekolah`
     - `/sekolah/join`
     - `/sekolah/bank`
     - `/sekolah/kalender`
     - `/sekolah/anggota`
     - `/sekolah/standar`
     - `/sekolah/export`
   - Pengguna tanpa izin yang mencoba mengakses URL di atas akan dialihkan secara senyap (*silent redirect*) kembali ke `/app`.
2. **Komponen Gate & Halaman Join**:
   - `SchoolGate.tsx`: Jika `!isFeatureAllowed`, merender `<Navigate to="/app" replace />`.
   - `Join.tsx`: Jika user login tapi bukan pilot user, merender `<Navigate to="/app" replace />`.
3. **Pembersihan Navigasi & Integrasi Workspace**:
   - Tombol "Sekolah" di header desktop & menu titik tiga mobile diproteksi oleh `isFeatureAllowed`.
   - Tombol "Dashboard Sekolah" di `WorkspaceExplorerShell.tsx` diproteksi oleh `isFeatureAllowed`.
   - Tombol "Bagikan ke Bank Sekolah" di `WorkspaceMeetingEditor.tsx` diproteksi oleh `isFeatureAllowed`.
   - Notifikasi sinkronisasi standar sekolah di `CreateWorkspaceModal.tsx` & `WorkspaceSettingsModal.tsx` diproteksi oleh `isFeatureAllowed`.

---

## 5. Deployment ke Cloudflare Workers Assets

1. **Build Verifikasi**:
   - `npx tsc --noEmit` lulus dengan 0 kesalahan tipe data.
   - `npm run build` berhasil mengompilasi seluruh aset ke folder `dist/` (189 file).
2. **Penyelesaian Masalah Infinite Loop Cloudflare**:
   - **Kendala**: Cloudflare API menolak upload dengan Error 100324 (*Invalid _redirects configuration: Infinite loop detected in this rule* pada baris `/* /index.html 200`).
   - **Solusi**: 
     - Menambahkan konfigurasi bawaan SPA pada `wrangler.toml`:
       ```toml
       [assets]
       directory = "./dist"
       not_found_handling = "single-page-application"
       ```
     - Menghapus aturan `/* /index.html 200` dari `public/_redirects` dan `dist/_redirects`.
3. **Hasil Deployment**:
   - Perintah `npx wrangler deploy` sukses mengeksekusi upload dan deployment.
   - **URL Aktif**: `https://modul-ajar.pakhusnulid.workers.dev`
   - **Version ID**: `0280da1d-8f05-4234-bc43-2c7c3b458c49`
   - Status HTTP 200 OK terverifikasi via automated request.
4. **Sinkronisasi Git Repository**:
   - Seluruh perubahan file kode, aset, migrasi SQL, dan konfigurasi didepositkan ke Git (`main` branch) pada repositori `https://github.com/lathifa590/build-it-beautiful.git`.
   - Cloudflare Pages yang terhubung dengan GitHub secara otomatis memproses deployment terbaru ini.

---

## 6. Daftar File yang Terlibat

| File / Modul | Perubahan Utama |
| :--- | :--- |
| `src/lib/feature-flags.ts` | Penambahan flag `ENABLE_OUTPUT_FORMAT_SELECTOR = false`. |
| `src/pages/Index.tsx` | Penyembunyian selektor dropdown format tampilan di pratinjau dokumen. |
| `src/components/modul/V2ExportDialog.tsx` | Penyembunyian tombol pilihan format dokumen pada modal ekspor. |
| `src/components/auth/SchoolPilotRoute.tsx` | Guard rute baru pembatas akses pilot Mode Sekolah. |
| `src/App.tsx` | Penerapan `SchoolPilotRoute` pada seluruh sub-rute `/sekolah/*`. |
| `src/components/school/SchoolGate.tsx` | Silent redirect ke `/app` untuk akun non-pilot. |
| `src/pages/sekolah/Join.tsx` | Silent redirect ke `/app` untuk akun non-pilot. |
| `src/components/workspace/explorer/WorkspaceExplorerShell.tsx` | Proteksi tampilan badge dan tautan sekolah dengan `isFeatureAllowed`. |
| `src/components/workspace/explorer/WorkspaceMeetingEditor.tsx` | Proteksi tombol dan modal berbagi ke Bank Sekolah dengan `isFeatureAllowed`. |
| `src/components/workspace/WorkspaceSettingsModal.tsx` | Proteksi info standar kalender sekolah dengan `isFeatureAllowed`. |
| `src/components/workspace/CreateWorkspaceModal.tsx` | Proteksi pre-fill JP kalender sekolah dengan `isFeatureAllowed`. |
| `wrangler.toml` | Penambahan konfigurasi `not_found_handling = "single-page-application"`. |
| `public/_redirects` | Penghapusan aturan `/* /index.html 200` untuk menghindari loop error Cloudflare. |
| `.gitignore` | Penambahan pengabaian file kunci Microsoft Word (`~$*`) dan folder `scratch/`. |
| `supabase/migrations/` | Kumpulan skrip migrasi sekolah (S1, S2, S3, dan Security Hardening). |
