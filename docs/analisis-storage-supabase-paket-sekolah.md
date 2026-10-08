# Analisis Storage Supabase Free Tier — Skenario Aktivasi Paket Sekolah

> Dibuat 2026-10-08. Basis analisis: batas Supabase free tier per Oktober 2026, struktur data di kode
> (`workspaces`, `documents`, `content_history`, `generation_logs`, `school_*`), dan batas
> 10 workspace/akun Pro (`WorkspaceDashboard.tsx:102`).

## Batas Supabase Free Tier (per okt 2026)

| Resource | Batas Free | Efek jika terlampaui |
|---|---|---|
| Database (Postgres) | **500 MB** | Project jadi **read-only** — semua user tidak bisa simpan data (write gagal) |
| File Storage | **1 GB** | Upload gagal |
| Egress/bandwidth | ± **5 GB/bulan** | Akses asset diblokir sampai siklus baru |
| MAU Auth | 50.000 user | Tidak relevan (jauh dari batas) |
| Inactivity pause | ± **7 hari tanpa aktivitas** | Project di-pause, harus restore manual dari dashboard |
| Backup | Tidak ada PITR/backup terjadwal | Risiko kehilangan data jika terjadi insiden region |

Sumber: https://supabase/pricing (periksa angka egress terbaru sebelum keputusan final).

## Jejak data per guru (estimasi dari struktur kode)

| Komponen | Ukuran | Catatan |
|---|---|---|
| Baris `workspaces` (max 10/guru) | ± 2 KB × 10 | Metadata saja, kecil |
| `documents.content_json` (JSONB) | **20–80 KB/dokumen** | Komponen terbesar. 1 workspace semesteran bisa berisi 20–40 dokumen (modul per pertemuan + LKPD + asesmen) |
| `content_history` (revisi AI) | Menumpuk per edit | Tiap regenerate menyimpan riwayat |
| `generation_logs` | Kecil tapi per-generasi | Tumbuh seiring pemakaian AI |
| Storage: letterhead/kop, stimulus-images, logo sekolah | 50–500 KB/file | Hanya dokumen tertentu yang pakai gambar |

**Estimasi per guru per tahun:**
- Pemakaian wajar: **3–6 MB** (3–4 workspace, tidak semua pertemuan dibuat)
- Pemakaian berat: **15–35 MB** (10 workspace penuh, semua pertemuan + revisi banyak)

## Skenario

Asumsi: 1 sekolah = 25 guru aktif. Angka database **belum termasuk** user personal yang sudah ada.

| Skenario | Database | File Storage | Egress/bulan | Verdict free tier |
|---|---|---|---|---|
| **1 sekolah (pilot)** | +75–150 MB (wajar) s.d. +400–875 MB (berat) | +25–50 MB | +1–3 GB | ⚠️ Wajar: AMAN. Berat: BAHAYA |
| **3 sekolah** | +225–450 MB (wajar) | +75–150 MB | +3–8 GB | ⚠️ Mulai tidak aman (DB mendekati 500 MB, egress bisa tembus 5 GB) |
| **10 sekolah perintis** | +750 MB – 3 GB | +250–500 MB | +10 GB+ | ❌ **PASTI jebol** — database read-only dalam 1 tahun ajaran |

**Kesimpulan:**
1. **1–2 sekolah pilot dengan pemakaian wajar → free tier masih aman**, dengan syarat pemakaian DB personal yang sekarang masih jauh dari 500 MB.
2. **10 sekolah perintis (target program) → free tier TIDAK cukup.** Harus upgrade ke Pro **sebelum** menjual ke sekolah ke-4/ke-5, atau saat DB menyentuh ±60% (300 MB).
3. Risiko terbesar bukan storage file, melainkan **database JSONB** (`documents`, `content_history`) — dan efek kegagalannya parah: read-only untuk SEMUA user (termasuk pelanggan personal yang bayar).

## Risiko non-kapasitas yang harus diperhatikan

1. **Inactivity pause (7 hari)** — libur sekolah panjang (Juni–Juli) jika nol aktivitas. Mitigasi: cron blog generator yang sudah ada sudah menjadi "heartbeat"; pastikan cron tetap jalan. Personal user base juga menjaga project tetap aktif.
2. **Tanpa backup** — data sekolah adalah data paying customer. Di Pro sekalipun, aktifkan scheduled backup/PITR.
3. **Isolasi antar sekolah** — dari sisi keamanan akses SUDAH ditangani: RLS + `school_id` + migrasi `school_security_hardening.sql`. Sekolah lain tidak bisa membaca data sekolah Anda. Ini bukan area risiko; kapasitaslah masalahnya.

## Cara cek pemakaian sekarang (jalankan di Supabase SQL Editor)

```sql
-- Ukuran database
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Ukuran per tabel (top 10)
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Total dokumen & rata-rata ukurannya
SELECT count(*) AS jumlah_dokumen,
       pg_size_pretty(avg(pg_column_size(content_json))::bigint) AS rata2_per_dokumen
FROM documents;
```

## Rekomendasi bertahap

| Fase | Kondisi | Tindakan |
|---|---|---|
| Pilot 1–2 sekolah | DB < 300 MB | Tetap free tier. Pantau ukuran DB mingguan (SQL di atas) |
| Sekolah ke-3–4 atau DB ≥ 300 MB (60%) | Mendekati batas | **Upgrade Supabase Pro** ($25/bulan ≈ Rp 400rb) + aktifkan backup |
| 10 sekolah terjual | Revenue Rp 15 jt/tahun | Pro wajib (Rp ~4,9 jt/tahun ≈ 33% revenue paket sekolah — masih sehat) + pertimbangkan cleanup otomatis |

**Mitigasi murah sebelum upgrade (memperpanjang umur free tier):**
1. Hapus `content_history` dan `generation_logs` lebih tua dari 3–6 bulan (job terjadwal / cron Supabase).
2. Kompres `content_json` — buang field redundan yang duplikat antar pertemuan.
3. Batasi ukuran/jumlah stimulus-images per guru (kompresi di sisi klien sebelum upload).
4. Edukasi guru: export Word/PDF sebagai arsip lokal (sudah jadi anjuran di FAQ landing page).

## Anggaran singkat

- 1 sekolah perintis = Rp 1.500.000/tahun.
- Supabase Pro = ± Rp 4.900.000/tahun → ditanggung oleh **±3,3 sekolah**.
- Artinya: program 10 sekolah (Rp 15 jt) menutup infrastruktur database (Rp 4,9 jt) + sisa untuk biaya AI.
- Selama masih ≤2 sekolah, free tier cukup — gunakan masa ini untuk mengukur pemakaian DB riil per guru, lalu putuskan timing upgrade dengan data nyata, bukan asumsi.
