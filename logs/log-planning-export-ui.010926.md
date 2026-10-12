# Development Log - Bug Fixes & Feature Enhancements

**Date:** September 1, 2026
**Context:** Workspace Planning, Export (Word), Profile Data Integration, UI/UX Fixes

## 1. Perbaikan Jumlah Generate TP (Tujuan Pembelajaran)
- **Masalah:** AI (Edge Function `generate-content`) hanya mengembalikan 1 atau 2 TP padahal materi dan topik sangat banyak.
- **Root Cause:** Limit `maxOutputTokens` terlalu rendah (3000) dan instruksi promt kurang eksplisit memaksa AI memetakan 1 topik = 1 TP. Selain itu, ada bug sanitasi JSON yang me-replace petik ganda (`"`) menjadi petik tunggal (`'`) sehingga merusak struktur JSON balasan AI.
- **Fix:** 
  - Meningkatkan `maxOutputTokens` menjadi 10.000.
  - Memperbarui instruksi prompt untuk secara spesifik memetakan TP per topik.
  - Memperbaiki logika `sanitizeJsonResponse` dengan hanya membersihkan literal newlines (`\n`, `\r`, `\t`), dan membiarkan struktur tanda petik.

## 2. Perbaikan Error 400 saat Generate KKTP
- **Masalah:** Fungsi Generate AI KKTP selalu gagal (Error 400).
- **Root Cause:** Mismatch schema data antara frontend dan backend. `useKktpGenerator` mengirimkan data dengan key `tpList`, sedangkan edge function `generate-kktp` mengharapkan key `tujuan_pembelajaran`.
- **Fix:** Mengubah key dari `tpList` menjadi `tujuan_pembelajaran` pada request payload di `useKktpGenerator.ts`.

## 3. Integrasi Nama Guru & Kepala Sekolah pada Export Word (Prota, Prosem, KKTP)
- **Masalah:** Kolom penandatangan (Penyusun & Kepala Sekolah) di file hasil download Prota dan KKTP (.doc) kosong atau berisi garis bawah.
- **Root Cause:** Meskipun fungsi `exportProtaToWord` sudah menyediakan slot untuk `namaPenyusun` dan `kepalaSekolah`, data tersebut tidak pernah diambil (di-fetch) oleh komponen frontend dan tidak di-pass ke dalam fungsi export.
- **Fix:** 
  - Mengambil data profil dari tabel `profiles` (`nama_guru`, `nip`, `nama_kepala_sekolah`, `nip_kepala_sekolah`) pada `StepProta.tsx` dan `StepKktp.tsx`.
  - Melewatkan objek profil tersebut ke fungsi pemanggil export (via argumen `formData`).

## 4. Penambahan Fitur Export KKTP ke Word dan Viewer di Workspace Explorer
- **Masalah:**
  - KKTP belum memiliki fungsi unduh Word yang sesungguhnya (hanya alert placeholder).
  - Pengguna ingin bisa melihat (preview) KKTP kembali dari menu utama Workspace (layaknya Prota dan Prosem).
- **Fix:**
  - Membuat fungsi `exportKktpToWord` di `export-word.ts` yang merender tabel rubrik KKTP beserta nama profil guru.
  - Memperbarui `ProtaProsemViewerModal.tsx` di `WorkspaceExplorer` dengan menambahkan tab **KKTP**.
  - Mengubah tombol di `WorkspaceExplorerShell.tsx` menjadi "Lihat Prota, Prosem & KKTP".
  - Memperbaiki bug syntax (nested ternary operator) di modal viewer tersebut.

## 5. UI/UX: Responsivitas Mobile & Navigasi
- **Masalah:** 
  - Pada mode desktop, tab navigasi perencanaan terpotong atau tumpang tindih.
  - Pada mode mobile (layar kecil), tombol "Simpan & Lanjut" di halaman TP bersembunyi di balik scroll sehingga sulit ditekan.
- **Fix:**
  - Merefaktor styling pada `WorkspacePlanningView.tsx` dan `StepCpTp.tsx`.
  - Memindahkan tombol "Simpan & Lanjut" ke dalam elemen sticky footer agar selalu terlihat di layar mobile terlepas dari panjang konten di atasnya.
