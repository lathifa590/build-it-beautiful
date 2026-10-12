# Log Update: Workspace Mode vs Mode Cepat Bug Fixes
**Date**: 24 Agustus 2026

## 1. Isu Data Hilang pada Workspace Mode (Identifikasi Murid Kosong)
**Masalah:** Saat meng-generate dokumen di Workspace Mode, bagian 'Identifikasi Murid' (seperti Pengetahuan Awal, Minat, dll) kosong ketika file disimpan dan dibuka lagi. Padahal fitur ini berfungsi baik di Mode Cepat.
**Akar Masalah:** Mode Workspace (V2) mengandalkan _callback_ `onAutoFill` yang memiliki *bug* karena hanya mencari data yang terbungkus di dalam JSON key `auto_generated`. Karena backend (Supabase Function) untuk modul tidak membungkus metadata tersebut dalam `auto_generated`, melainkan di _root_ *prefacePatch*, `onAutoFill` tidak pernah dijalankan dan `formData` gagal terupdate secara otomatis. Akibatnya form tersimpan dalam keadaan kosong ke database.
**Penyelesaian:**
- Mengubah logika di `src/hooks/usePertemuanGeneration.ts` agar memeriksa keberadaan `prefacePatch` secara langsung. Jika struktur JSON tidak memiliki `auto_generated`, ia akan langsung melempar seluruh *prefacePatch* ke dalam _callback_ `onAutoFill`.
- Hasilnya, fitur _auto-fill_ kini berjalan normal di Workspace Mode.

## 2. Penambahan Fitur Reset di Workspace Mode
**Masalah:** Tombol Reset tidak tersedia di Workspace Mode.
**Alasan Awal:** Ditiadakan secara sengaja sebagai bentuk proteksi. Mengingat Mode Workspace terhubung ke penyimpanan persisten, ada risiko pengguna kehilangan seluruh _progress_ Prosem dan konfigurasi semester jika tombol global Reset ditekan.
**Penyelesaian & Modifikasi:**
- Menambahkan kembali tombol **Reset**, tetapi cakupannya diperkecil hanya untuk sesi pertemuan yang sedang aktif.
- Lokasi diletakkan di `src/components/workspace/explorer/WorkspaceMeetingEditor.tsx` (di samping "Export" dan "Simpan Perubahan").
- **Fungsionalitas**: Mengadopsi _behavior_ Mode Cepat, fungsi Reset dimodifikasi agar **hanya menghapus panel kanan** (Hasil Generate Dokumen) melalui `pertemuanV2.resetV2()`, sedangkan panel kiri (Formulir Konfigurasi) dibiarkan utuh.
- Pengguna harus secara eksplisit mengklik "Simpan Perubahan" agar hasil reset (dokumen kosong) ini tersimpan ke database.
