# Log - Kalender Pendidikan Template Features
**Date:** 13 September 2026

## Context
Pengguna meminta fitur (Opsi 2) agar pengaturan Kalender Pendidikan (JP, Minggu Efektif, Jadwal Libur, dll) yang sudah diatur di suatu *workspace* dapat disimpan ke *cloud* (Supabase `profiles`) dan digunakan kembali pada *workspace* lain (Template System). Fitur ini kemudian diperbarui menjadi **sistem multi-template** (agar guru yang mengajar di lebih dari satu sekolah dapat menyimpan kalender berbeda) dan dapat diakses langsung dari **Viewer Modal** tanpa harus membuat workspace baru.

## Changes Made

### 1. Database Schema & Types
- **Migration:** Dibuat skrip migrasi `supabase/migrations/20260913092400_add_default_kalender_to_profiles.sql` untuk menambahkan kolom `default_kalender` bertipe `JSONB` pada tabel `profiles`. *(Kueri wajib dijalankan manual di Supabase SQL Editor oleh user karena limitasi Docker lokal).*
- **Types:** Diperbarui file `src/integrations/supabase/types.ts` (kolom `default_kalender?: Json | null` pada antarmuka `profiles`) dan `src/types/modul.ts` (menambahkan interface `SavedKalenderTemplate`).

### 2. Multi-Template Logic di `KalenderPendidikanForm.tsx`
- Mengganti format `default_kalender` dari single object JSON menjadi *array of objects* `SavedKalenderTemplate[]`.
- **Backward Compatibility:** Menambahkan logic saat memuat template untuk mengecek jika format lama (object tunggal) terdeteksi, sistem otomatis mengonversinya menjadi *array* (dengan nama "Template Lama") dan menyimpannya kembali ke database.
- **UI:** Menambahkan komponen `Dialog` dari `shadcn/ui` untuk dua aksi:
  - **Simpan Template:** Meminta pengguna memasukkan nama template sebelum menyimpannya ke Supabase.
  - **Gunakan Template:** Menampilkan daftar *list* template tersimpan, opsi pilih, serta opsi hapus (🗑️) untuk setiap item.

### 3. Aksesibilitas via Modal
- **File Diperbarui:** `src/components/workspace/explorer/ProtaProsemViewerModal.tsx`
- **Fitur Baru:** Menambahkan *tab* baru "Kalender Pendidikan" di urutan paling kiri (menjadi default tab).
- **Logika Data:** Jika pengguna mengubah kalender melalui tab ini, mereka dapat menekan tombol "Simpan Perubahan ke Workspace" yang secara lokal akan mengeksekusi RPC `upsert_curriculum_plan` ke *curriculum_plans* milik *workspace* saat ini, dengan *state* yang menyatu bersama `protaData`. Ini memungkinkan pengguna melihat dan mengedit kalender pendidikan (beserta templatenya) pada modul yang sudah selesai diproses, tanpa perlu membuat *workspace* baru.

## Next Steps / Notes
- Selalu pastikan kolom `default_kalender` JSONB telah eksis di database (via Supabase CLI / SQL Editor) agar tidak terjadi error 500 saat mencoba meng-update *profiles*.
- Sistem notifikasi (`useToast`) sukses diimplementasikan untuk memberikan *feedback* sukses/gagal pada setiap klik tombol ke Supabase.
