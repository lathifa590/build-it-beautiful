# DOKUMEN WIREFRAMES & ARSITEKTUR TAMPILAN RESMI
## APLIKASI MODULAJAR.ONLINE (FASE 4B.1)
**Spesifikasi Desain Antarmuka: Desktop & Mobile View untuk Semua Menu**

---

## DAFTAR ISI
1. [Arsitektur Informasi & Peta Situs (Sitemap)](#1-arsitektur-informasi--peta-situs-sitemap)
2. [Sistem Desain & Panduan Grid (Design System Foundation)](#2-sistem-desain--panduan-grid-design-system-foundation)
3. [Halaman Publik & Pemasaran](#3-halaman-publik--pemasaran)
   - 3.1 [Landing Page Utama (`/`)](#31-landing-page-utama-)
   - 3.2 [Halaman Paket Sekolah (`/paketsekolah`)](#32-halaman-paket-sekolah-paketsekolah)
   - 3.3 [Halaman Paket Agency / Reseller (`/paketagency`)](#33-halaman-paket-agency--reseller-paketagency)
   - 3.4 [Halaman Blog & Detail Artikel (`/blog` & `/blog/:slug`)](#34-halaman-blog--detail-artikel-blog--blogslug)
   - 3.5 [Halaman Autentikasi Login & Register (`/auth`)](#35-halaman-autentikasi-login--register-auth)
4. [Toko Digital Guru / Marketplace Pembelajaran](#4-toko-digital-guru--marketplace-pembelajaran)
   - 4.1 [Katalog Toko Publik (`/store`)](#41-katalog-toko-publik-store)
   - 4.2 [Profil Toko Guru (`/store/:storeSlug`)](#42-profil-toko-guru-storestoreslug)
   - 4.3 [Detail Produk Perangkat Ajar (`/store/item/:listingId`)](#43-detail-produk-perangkat-ajar-storeitemlistingid)
   - 4.4 [Halaman Checkout & Pembayaran (`/checkout/:orderId`)](#44-halaman-checkout--pembayaran-checkoutorderid)
   - 4.5 [Lacak Status Pesanan (`/lacak-pesanan`)](#45-lacak-status-pesanan-lacak-pesanan)
5. [Workspace Utama Generator Perangkat Ajar (`/app` & `/app/workspace/*`)](#5-workspace-utama-generator-perangkat-ajar-app--appworkspace)
   - 5.1 [Struktur Layout Aplikasi (AppLayout & Sidebar)](#51-struktur-layout-aplikasi-applayout--sidebar)
   - 5.2 [Header Workspace & Status Bar](#52-header-workspace--status-bar)
   - 5.3 [Panel Input Generator (FormSection)](#53-panel-input-generator-formsection)
   - 5.4 [Toolbar & Navigasi Tab Dokumen Preview](#54-toolbar--navigasi-tab-dokumen-preview)
   - 5.5 [Anatomi Tab Preview Dokumen (RPM, LKPD, Asesmen, Bank Soal, Bahan Ajar, Refleksi)](#55-anatomi-tab-preview-dokumen)
   - 5.6 [Tab Perencanaan Terpadu (Prota, Prosem, KKTP)](#56-tab-perencanaan-terpadu-prota-prosem-kktp)
   - 5.7 [Modal & Dialog Interaktif Kunci Workspace](#57-modal--dialog-interaktif-kunci-workspace)
6. [Manajemen Toko Saya Guru (`/app/store-management`)](#6-manajemen-toko-saya-guru-appstore-management)
7. [Manajemen Blog & Konten SEO (`/app/blog-management`)](#7-manajemen-blog--konten-seo-appblog-management)
8. [Mode Sekolah & Supervisi Terpusat (`/sekolah/*`)](#8-mode-sekolah--supervisi-terpusat-sekolah)
9. [Dasbor Reseller / Agency Mitra (`/agency`)](#9-dasbor-reseller--agency-mitra-agency)
10. [Panel Kendali Admin Sistem (`/admin/*`)](#10-panel-kendali-admin-sistem-admin)
11. [Pengaturan Akun & BYOK Gemini API (`/settings`)](#11-pengaturan-akun--byok-gemini-api-settings)
12. [Matriks Responsivitas & Perilaku Komponen](#12-matriks-responsivitas--perilaku-komponen)

---

## 1. ARSITEKTUR INFORMASI & PETA SITUS (SITEMAP)

Aplikasi **ModulAjar.Online** dibangun dengan arsitektur peran berlapis (*Role-Based Access*) yang memisahkan area publik, pengguna guru (workspace), toko guru, supervisi sekolah, kemitraan agency, dan administrator.

```
                              [ MODULAJAR.ONLINE ]
                                       │
      ┌────────────────────────┬───────┴───────────────┬────────────────────────┐
      ▼                        ▼                       ▼                        ▼
[ AREA PUBLIK ]         [ WORKSPACE GURU ]      [ MARKETPLACE GURU ]     [ SUPERVISI SEKOLAH ]
├─ / (Landing Page)     ├─ /app (Generator)     ├─ /store (Katalog)      ├─ /sekolah (Dashboard)
├─ /paketsekolah        ├─ /app/workspace/*     ├─ /store/:storeSlug     ├─ /sekolah/kalender
├─ /paketagency         ├─ /app/store-manage    ├─ /store/item/:id       ├─ /sekolah/bank
├─ /blog & /blog/:slug  ├─ /app/blog-manage     ├─ /checkout/:orderId    ├─ /sekolah/anggota
├─ /auth (Login/Reg)    └─ /settings            └─ /lacak-pesanan        ├─ /sekolah/standar
└─ /seo-pages/*                                                          ├─ /sekolah/export
                                                                         └─ /sekolah/join
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             [ DASHBOARD RESELLER ]            [ PANEL ADMIN SISTEM ]
             └─ /agency (Portal Mitra)         ├─ /admin (Dashboard)
                                               ├─ /admin/users & /admin/customers
                                               ├─ /admin/schools & /admin/settings
                                               └─ /admin/agency/* (Paket/Promo)
```

---

## 2. SISTEM DESAIN & PANDUAN GRID (DESIGN SYSTEM FOUNDATION)

Aplikasi menggunakan gaya visual **Neo-Brutalism Modern**:
- **Border**: `2px solid #111111` (hitam pekat tajam).
- **Shadow**: `shadow-brutal` (`4px 4px 0px #111111`) dan `shadow-brutal-sm` (`2px 2px 0px #111111`).
- **State Hover / Active**: Translate `+2px, +2px` dengan reduksi bayangan.
- **Tipografi**: Font sans-serif modern (Plus Jakarta Sans / Inter), heading `font-extrabold` / `font-black`.
- **Warna Identitas**:
  - `Primary`: Oranye Hangat `#EA580C` / `#C2410C`
  - `Background`: Bersih `#FFFFFF` / Slate-50 `#F8FAFC`
  - `Accent Emerald`: `#059669` (Resmi BSKAP 046/2025, Validasi, Sukses)
  - `Accent Amber`: `#D97706` (Agency, Catatan, KBC)
  - `Accent Destructive`: `#DC2626` (Error, Reset, Hapus)
  - `Card Background`: `#FFFFFF` dengan sudut membulat `rounded-xl` (12px) atau `rounded-2xl` (16px).

### Spesifikasi Viewport
- **Desktop View**: Breakpoint `md: 768px`, `lg: 1024px`, `xl: 1280px+`
- **Mobile View**: Breakpoint `< 768px` (Target optimal: 375px s.d. 430px)

---

## 3. HALAMAN PUBLIK & PEMASARAN

### 3.1 Landing Page Utama (`/`)
Halaman gerbang utama untuk konversi pengunjung menjadi pengguna aktif. Memperkenalkan kepatuhan regulasi resmi BSKAP No. 046/H/KR/2025, tabel perbandingan 3 arah, dan visual mockup UI nyata.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar.Online        [Perbandingan]  [Fitur]  [Keunggulan]  [Testimoni]  [Blog] [Lisensi Agency]| [Masuk] [Beli Sekarang] |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  [⚡ Cepat & Mudah]                                                                                     |
|  Generator Modul Ajar & Perangkat Ajar AI                                   +-------------------------+ |
|  Aplikasi cerdas pembuat Modul Ajar, LKPD, Asesmen, hingga Prota & Promes.   | PREVIEW INTERAKTIF APP  | |
|  Mendukung Kurikulum Merdeka (BSKAP 046/2025), Deep Learning, & KBC Kemenag. | [Modul][LKPD][Asesmen]  | |
|                                                                              | RENCANA PEMBELAJARAN... | |
|  [ Tombol: Berlangganan Sekarang -> ]   [ Tombol: Coba Fitur Gratis ]        | (Word/PDF Siap Cetak)   | |
|                                                                              +-------------------------+ |
+---------------------------------------------------------------------------------------------------------+
| [2 Kurikulum Resmi: Kurikulum Merdeka (Kemdikbudristek) | Kurikulum Berbasis Cinta / KBC (Kemenag RI)] |
+---------------------------------------------------------------------------------------------------------+
| [ANGKA STATISTIK]:  1.250+ Guru Bergabung   |   45.000+ Dokumen Dibuat   |   99.4% Rating Kepuasan       |
+---------------------------------------------------------------------------------------------------------+
|                                    TABEL PERBANDINGAN LAYANAN (3 PILAR)                                 |
| Aspek Perencanaan         | Cara Konvensional        | Generator AI Serupa     | ⭐ ModulAjar.Online     |
|---------------------------+--------------------------+-------------------------+-------------------------|
| Biaya & Kuota Generate    | ✕ Beli modul berulang    | ⚠️ Sistem kredit kuota  | ✓ Unlimited BYOK        |
| Capaian Pembelajaran (CP) | ✕ Cari manual PDF 500 hal| ⚠️ Copy-paste teks CP   | ✓ Otomatis BSKAP 046    |
| Export Prompt AI Lain     | ✕ Ketik prompt manual    | ✕ Terkunci di platform  | ✓ 1-Klik Salin Bebas    |
| Format Cetak Word / PDF   | ✕ Layout tabel berantakan| ✕ Hanya teks markdown   | ✓ Word F4/A4 + Kop Resmi|
+---------------------------------------------------------------------------------------------------------+
|                                 FITUR UTAMA: MOCKUP UI APLIKASI NYATA                                   |
| +-------------------------+ +-------------------------+ +-------------------------+                     |
| | [🔴🟡🟢] /app/rpm        | | | [🔴🟡🟢] /app/cp-resmi    | | | [🔴🟡🟢] /app/export      |                     |
| | Informatika Fase D      | | | [✓] Berpikir Komputasi| | | [Word .docx] [PDF]      |                     |
| | BSKAP 046/2025 Valid    | | | [✓] Literasi Digital  | | | Kop Sekolah: AKTIF      |                     |
| | Modul RPM Deep Learning | | | Tanpa Buka PDF Manual | | | Format Standar F4/A4    |                     |
| +-------------------------+ +-------------------------+ +-------------------------+                     |
|   (Lihat Contoh Modul)        (Coba Pencarian CP)         (Download Contoh Word)                        |
|                                                                                                         |
| +-------------------------+ +-------------------------+ +-------------------------+                     |
| | [🔴🟡🟢] /app/bank-soal  | | | [🔴🟡🟢] /app/prota-prosem| | | [🔴🟡🟢] /app/byok-prompt |                     |
| | C1 C2 C3 [C4 HOTS] C5 C6| | | Target: 72 JP (100%)  | | | [ChatGPT][Claude][Gem]|                     |
| | PG & Uraian + Kunci     | | | Prosem Mingguan Auto  | | | 1-Klik Salin Prompt     |                     |
| +-------------------------+ +-------------------------+ +-------------------------+                     |
+---------------------------------------------------------------------------------------------------------+
| [Mengapa Memilih ModulAjar?] [Testimoni Guru se-Indonesia] [FAQ Tanya Jawab] [Footer Navigasi & Kontak]|
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [=] [LOGO] ModulAjar.Online     [Beli]|
+---------------------------------------+
| [⚡ Cepat & Mudah]                     |
| Generator Modul Ajar                  |
| & Perangkat Ajar AI                   |
| Rencana Pembelajaran Mendalam (RPM),  |
| LKPD, Asesmen, Prota & Promes instan. |
|                                       |
| [ Berlangganan Sekarang -> ]          |
| [ Coba Gratis Tanpa Akun ]            |
+---------------------------------------+
| MINI PREVIEW CARD:                    |
| +-----------------------------------+ |
| | [🔴🟡🟢] modulajar.online/app     | |
| | Modul: Matematika Fase A (Kls 1)  | |
| | Format Tabel Siap Print F4/A4     | |
| +-----------------------------------+ |
+---------------------------------------+
| PERBANDINGAN LAYANAN                  |
| Filter: [Semua] [vs Manual] [vs AI]   |
| +-----------------------------------+ |
| | Aspek: Biaya & Kuota Generate     | |
| | ✕ Manual: Beli berulang / lembur  | |
| | ⚠️ Lain: Kuota kredit terbatas    | |
| | ✓ ModulAjar: Unlimited BYOK Bebas | |
| +-----------------------------------+ |
| | Aspek: Database CP Resmi          | |
| | ✕ Manual: Bongkar PDF 500 halaman | |
| | ✓ ModulAjar: Otomatis BSKAP 046   | |
| +-----------------------------------+ |
+---------------------------------------+
| MOCKUP FITUR APLIKASI:                |
| [ Card 1: Modul Ajar (RPM) ]          |
| [ Card 2: Database CP Otomatis ]      |
| [ Card 3: Ekspor Word F4/A4 ]         |
| (Scroll vertikal dengan kartu rapi)   |
+---------------------------------------+
| [Accordion FAQ]                       |
| [CTA Chat WhatsApp Admin]             |
| [Footer Copyright 2026]               |
+---------------------------------------+
```

---

### 3.2 Halaman Paket Sekolah (`/paketsekolah`)
Ditujukan untuk Kepala Sekolah, Yayasan, dan Koordinator Kurikulum yang ingin melisensikan aplikasi untuk seluruh guru di sekolahnya.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar.Online                 [Beranda]  [Paket Guru]  [Paket Sekolah]            [Konsultasi]|
+---------------------------------------------------------------------------------------------------------+
|  [🏫 SOLUSI SATUAN PENDIDIKAN]                                                                          |
|  Standardisasi Perangkat Ajar Satu Sekolah dalam Satu Platform                                         |
|  Pantau kepatuhan administrasi seluruh guru, seragamkan format kop & template, ekspor massal supervisi.|
|                                                                                                         |
|  +---------------------------+  +---------------------------+  +---------------------------+            |
|  | PAKET SEKOLAH KECIL       |  | PAKET SEKOLAH STANDAR     |  | PAKET YAYASAN / BESAR     |            |
|  | s.d. 15 Guru              |  | s.d. 35 Guru (Favorit)    |  | s.d. 100+ Guru            |            |
|  | Rp 499.000 / semester     |  | Rp 899.000 / semester     |  | Hubungi Sales             |            |
|  |---------------------------|  |---------------------------|  |---------------------------|            |
|  | ✓ Akun Guru Aktif         |  | ✓ Seluruh Fitur Paket S   |  | ✓ Multi-Sekolah / Cabang  |            |
|  | ✓ Standard Kop Sekolah    |  | ✓ Dashboard Supervisi KS  |  | ✓ Pelatihan In-House Zoom |            |
|  | ✓ Format BSKAP 046/2025   |  | ✓ Ekspor Akreditasi 1-Klik|  | ✓ Dedicated Account Mgr   |            |
|  | [ Pilih Paket Ini ]       |  | [ Pilih Paket Ini ]       |  | [ Hubungi Tim Kami ]      |            |
|  +---------------------------+  +---------------------------+  +---------------------------+            |
+---------------------------------------------------------------------------------------------------------+
| ALUR IMPLEMENTASI: 1. Pendaftaran Sekolah -> 2. Input Master Kop/Kalender -> 3. Guru Buat Modul Sendiri |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [=] [LOGO] Paket Sekolah         [WA] |
+---------------------------------------+
| Standardisasi Dokumen Ajar            |
| Seluruh Guru Sekolah Anda             |
|                                       |
| [ Tab Pilihan: 15 Guru | 35 Guru ]    |
| +-----------------------------------+ |
| | PAKET SEKOLAH STANDAR (35 GURU)   | |
| | Rp 899.000 / semester             | |
| | • Dashboard Supervisi Kepala Sek. | |
| | • Seragamkan Kop Sekolah Otomatis | |
| | • Ekspor Bundel Akreditasi Cepat  | |
| | [ Pesan Paket via WhatsApp -> ]   | |
| +-----------------------------------+ |
| Manfaat untuk Kepala Sekolah:         |
| [✓] Supervisi Bebas Stres             |
| [✓] Kepatuhan Regulasi Terjamin       |
+---------------------------------------+
```

---

### 3.3 Halaman Paket Agency / Reseller (`/paketagency`)
Halaman penawaran program kemitraan lisensi bagi guru, konten kreator edukasi, atau agen software pendidikan yang ingin menjual kembali (*resell*) akun ModulAjar.Online dengan margin keuntungan tinggi.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar.Online                    [Fitur]  [Paket Agency]  [Simulasi Profit]     [Daftar Agen]|
+---------------------------------------------------------------------------------------------------------+
|  [💼 PELUANG BISNIS DIGITAL EDUKASI]                                                                   |
|  Dapatkan Hak Jual Lisensi ModulAjar.Online dengan Keuntungan s.d. 70%                                 |
|                                                                                                         |
|  +---------------------------+  +---------------------------+  +---------------------------+            |
|  | LISENSI STARTER (50 AKUN) |  | LISENSI PRO (150 AKUN)    |  | LISENSI MASTER (500 AKUN) |            |
|  | Modal Rp 35.000 / akun    |  | Modal Rp 25.000 / akun    |  | Modal Rp 18.000 / akun    |            |
|  | Jual: Rp 99.000 / akun    |  | Jual: Rp 99.000 / akun    |  | Jual: Rp 99.000 / akun    |            |
|  | Potensi Profit: Rp 3.2 Jt |  | Potensi Profit: Rp 11.1 Jt|  | Potensi Profit: Rp 40.5 Jt|            |
|  | [ Ambil Lisensi Starter ] |  | [ Ambil Lisensi Pro ⭐ ]  |  | [ Ambil Lisensi Master ]  |            |
|  +---------------------------+  +---------------------------+  +---------------------------+            |
|                                                                                                         |
|  FASILITAS MITRA RESELLER:                                                                              |
|  [📁 Bahan Promosi Siap Posting]  [💬 Script WhatsApp Closing]  [📊 Dashboard Aktivasi Kode Instan]    |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [=] [LOGO] Lisensi Agency        [WA] |
+---------------------------------------+
| Raih Penghasilan Tambahan             |
| dari Produk Digital Guru              |
|                                       |
| +-----------------------------------+ |
| | TIER REKOMENDASI: PRO 150 AKUN    | |
| | Modal: Rp 25.000 / lisensi        | |
| | Harga Jual Rekomendasi: Rp 99.000 | |
| | Estimasi Untung Bersih: Rp 11 Juta| |
| |                                   | |
| | Fasilitas:                        | |
| | • Web Aktivasi Mandiri            | |
| | • Gambar & Video Promosi          | |
| | • Script Chat Copywriting         | |
| | [ Ambil Lisensi Sekarang -> ]     | |
| +-----------------------------------+ |
+---------------------------------------+
```

---

### 3.4 Halaman Blog & Detail Artikel (`/blog` & `/blog/:slug`)
Pusat edukasi kurikulum, berita pendidikan terbaru, panduan mengajar, dan strategi optimasi SEO untuk menjaring traffic organik guru.

#### A. Desktop View (`/blog`)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar.Online               [Perbandingan] [Fitur] [Blog Edukasi]                  [Cari Artikel] |
+---------------------------------------------------------------------------------------------------------+
|  Kabar, Panduan Kurikulum & Tips Administrasi Guru                                                      |
|  Kategori: [Semua Kategori] [Kurikulum Merdeka] [KBC Kemenag] [Deep Learning] [Bank Soal] [Tips Mengajar]  |
|                                                                                                         |
|  [ARTIKEL UTAMA (FEATURED)]                                                                             |
|  +-------------------------------------------------+--------------------------------------------------+ |
|  | [ Gambar Cover Artikel Resolusi Tinggi ]        | Panduan Resmi BSKAP No. 046/2025: Apa Saja Yang  | |
|  |                                                 | Berubah pada Elemen CP Tahun Ajaran Baru?        | |
|  |                                                 | Ringkasan perubahan Informatika, PJOK, Pancasila.| |
|  |                                                 | 📅 12 Nov 2026 • ⏱️ 5 Menit Baca • 👤 Tim Kurikulum| |
|  +-------------------------------------------------+--------------------------------------------------+ |
|                                                                                                         |
|  ARTIKEL TERBARU:                                                                                       |
|  +------------------------+  +------------------------+  +------------------------+                     |
|  | [ Gambar Thumbnail ]  |  | [ Gambar Thumbnail ]  |  | [ Gambar Thumbnail ]  |                     |
|  | Cara Menyusun Modul    |  | Perbedaan Utama Asesmen|  | Template RPP KBC       |                     |
|  | RPM Pembelajaran Mendlm|  | Diagnostik vs Formatif |  | Madrasah Ibtidaiyah    |                     |
|  | 📅 10 Nov • 4 mnt      |  | 📅 08 Nov • 6 mnt      |  | 📅 05 Nov • 5 mnt      |                     |
|  +------------------------+  +------------------------+  +------------------------+                     |
|                                                                                                         |
|  [ Paginasi: < 1 2 3 4 > ]                                                                              |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (`/blog/:slug`)
```
+---------------------------------------+
| [<- Kembali] Blog Edukasi        [🔗] |
+---------------------------------------+
| Panduan Resmi BSKAP No. 046/2025:     |
| Perubahan Elemen CP Tahun Ajaran Baru |
| 📅 12 Nov 2026 • ⏱️ 5 menit baca       |
|                                       |
| [ Gambar Cover Artikel Penuh ]        |
|                                       |
| Kementerian Pendidikan Dasar dan      |
| Menengah baru saja menerbitkan aturan |
| BSKAP No. 046/H/KR/2025...            |
|                                       |
| DAFTAR ISI CEPAT:                     |
| 1. Perubahan Mapel Informatika        |
| 2. Restrukturisasi PJOK               |
| 3. Cara Praktis Susun Modul di Web    |
|                                       |
| [ BANNER CTA DI DALAM ARTIKEL ]:      |
| +-----------------------------------+ |
| | Mau Bikin Modul Sesuai BSKAP 046? | |
| | Coba Generator Otomatis di Sini   | |
| | [ Buat Modul Ajar Sekarang -> ]   | |
| +-----------------------------------+ |
+---------------------------------------+
```

---

### 3.5 Halaman Autentikasi Login & Register (`/auth`)
Gerbang masuk pengguna dengan autentikasi ganda: Password Konvensional dan Magic Link email tanpa password.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|                           +-----------------------------------------------+                             |
|                           | [LOGO] ModulAjar.Online                       |                             |
|                           | Solusi Cerdas Administrasi Guru Indonesia     |                             |
|                           |-----------------------------------------------|                             |
|                           |  TAB: [  MASUK (LOGIN)  ]  [  DAFTAR BARU  ]  |                             |
|                           |                                               |                             |
|                           |  Pilihan Masuk:                               |                             |
|                           |  (•) Password Akun     ( ) Magic Link Email   |                             |
|                           |                                               |                             |
|                           |  Email Pendidik / Madrasah:                   |                             |
|                           |  [ guru.teladan@sekolah.sch.id              ] |                             |
|                           |                                               |                             |
|                           |  Kata Sandi:                                  |                             |
|                           |  [ •••••••••••••••••                    ] [👁️] |                             |
|                           |                                               |                             |
|                           |  [ ] Ingat Saya di Perangkat Ini              |                             |
|                           |  [ Lupa Password? Klik di Sini ]              |                             |
|                           |                                               |                             |
|                           |  [ TOMBOL: MASUK KE WORKSPACE -> ]            |                             |
|                           |-----------------------------------------------|                             |
|                           | Belum punya lisensi? [Lihat Paket Berlangganan]|                            |
|                           +-----------------------------------------------+                             |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [LOGO] ModulAjar.Online               |
| Masuk ke Workspace Anda               |
|                                       |
| [  TAB: MASUK  ] [  TAB: DAFTAR  ]    |
|                                       |
| Email:                                |
| [ guru@sekolah.id                   ] |
|                                       |
| Password:                             |
| [ ••••••••••••••                ] [👁️]|
|                                       |
| [✓] Ingat Saya    [Lupa Sandi?]       |
|                                       |
| [ MASUK SEKARANG -> ]                 |
|                                       |
| Atau Masuk Cepat:                     |
| [ Kirim Magic Link ke Email ]         |
|                                       |
| Butuh Bantuan? [Hubungi Admin WA]     |
+---------------------------------------+
```

---

## 4. TOKO DIGITAL GURU / MARKETPLACE PEMBELAJARAN

ModulAjar.Online dilengkapi ekosistem toko digital guru terintegrasi (*Lynk.id / Gumroad style*) tempat guru dapat menjual dan membeli bundel perangkat ajar siap pakai antar-sesama pendidik.

### 4.1 Katalog Toko Publik (`/store`)
Pusat etalase pencarian materi, modul ajar, bank soal, dan paket tahunan siap unduh.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar Store      [🔍 Cari Modul, Mapel, atau Guru...]  [Lacak Pesanan]  [🛒 Keranjang (2)]    |
+---------------------------------------------------------------------------------------------------------+
| BANNER PROMO: "Etalase Karya Guru Indonesia - Dapatkan Perangkat Lengkap Terverifikasi"                |
+---------------------------------------------------------------------------------------------------------+
| FILTER: Jenjang: [Semua][SD][SMP][SMA][SMK][Madrasah]  |  Mapel: [Informatika][Matematika][IPA][Bahasa]|
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
| HASIL PRODUK DIGITAL (124 Ditemukan):                                                                   |
| +-------------------------+ +-------------------------+ +-------------------------+ +-----------------+ |
| | [Gambar Cover Modul]    | | [Gambar Cover Modul]    | | [Gambar Cover Modul]    | | [Cover Modul]   | |
| | Paket Lengkap 1 Tahun   | | Bank Soal HOTS C1-C6    | | Modul RPM Deep Learning | | Prota Prosem    | |
| | Informatika Fase D Kls 7| | Matematika SMP Kls 8    | | PAI & Budi Pekerti Kls 4| | IPAS SD Fase B  | |
| | 👤 Guru Budi, M.Pd      | | 👤 Siti Aminah, S.Pd    | | 👤 Ustadz Rahman, S.Ag  | | 👤 Bu Nurul     | |
| | ⭐ 4.9 (42 ulasan)      | | ⭐ 5.0 (18 ulasan)      | | ⭐ 4.8 (31 ulasan)      | | ⭐ 4.9 (15 rev) | |
| | Rp 49.000  (Disc 50%)   | | Rp 29.000               | | Rp 39.000               | | Rp 25.000       | |
| | [ Beli Langsung -> ]    | | [ Beli Langsung -> ]    | | [ Beli Langsung -> ]    | | [ Beli -> ]     | |
| +-------------------------+ +-------------------------+ +-------------------------+ +-----------------+ |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [LOGO] Toko Guru            [🛒 (1)]  |
+---------------------------------------+
| [🔍 Cari mapel, kelas, topik...]      |
|                                       |
| Filter Cepat:                         |
| [Semua] [SD] [SMP] [SMA] [KBC Madrasah|
|                                       |
| +-----------------------------------+ |
| | [Gambar Cover Produk]             | |
| | Paket Lengkap 1 Tahun Informatika | |
| | Fase D (Kelas 7) - 10 Pertemuan   | |
| | 👤 Budi Santoso, M.Pd • ⭐ 4.9     | |
| | Rp 49.000 <s class="text-xs">Rp 99rb</s>     | |
| | [ Beli Sekarang -> ]              | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | [Gambar Cover Produk]             | |
| | Bank Soal HOTS Matematika Kls 8   | |
| | Rp 29.000 • ⭐ 5.0 (18 Terjual)    | |
| | [ Beli Sekarang -> ]              | |
| +-----------------------------------+ |
|                                       |
| [ Buka Toko Sendiri? Klik di Sini ]   |
+---------------------------------------+
```

---

### 4.2 Profil Toko Guru (`/store/:storeSlug`) & Detail Produk (`/store/item/:listingId`)

#### A. Wireframe Profil Toko Guru (Desktop & Mobile Concept)
```
+---------------------------------------------------------------------------------------------------------+
| [BANNER TOKO GURU - 1200x300 px]                                                                        |
| +---------------+                                                                                       |
| | [FOTO PROFIL] |  Budi Santoso, M.Pd (Guru Penggerak Informatika - SMPN 1 Maju)                       |
| +---------------+  ⭐ 4.9/5.0 (86 Transaksi Berhasil) • 📍 Kota Bandung • 🏫 Akun Terverifikasi            |
| Bio: "Menyediakan perangkat pembelajaran Informatika & Koding sesuai regulasi BSKAP 046/2025 siap print"|
+---------------------------------------------------------------------------------------------------------+
| Tab: [ Semua Produk (8) ]  [ Modul Ajar (4) ]  [ Bank Soal (2) ]  [ Bundel 1 Semester (2) ]             |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Wireframe Detail Produk (`/store/item/:listingId`)
```
+---------------------------------------------------------------------------------------------------------+
| [<- Kembali ke Toko]                                                                                    |
|                                                                                                         |
| +-------------------------------------+  +------------------------------------------------------------+ |
| | [SLIDER GAMBAR / PREVIEW DOKUMEN]   |  | Paket Lengkap Modul Ajar Informatika Fase D (1 Tahun Penuh) | |
| | [ Halaman 1: Cover & Identitas ]    |  | Terverifikasi BSKAP No. 046/H/KR/2025                       | |
| | [ Halaman 2: Langkah Pembelajaran ] |  |                                                            | |
| | [ Halaman 3: LKPD & Rubrik HOTS ]   |  | Harga Spesial:                                              | |
| |                                     |  | Rp 49.000  <span class="line-through text-gray-400">Rp 99.000</span> (Diskon 51%)         | |
| | Thumbnail: [1] [2] [3] [4]          |  |                                                            | |
| +-------------------------------------+  | Fasilitas yang Didapatkan:                                 | |
|                                          | • File Word (.docx) Format F4/A4 Standar Siap Edit         | |
| Deskripsi Lengkap Produk:                | • File PDF Siap Cetak Langsung                             | |
| Modul ajar ini mencakup 16 pertemuan...  | • Lembar Kerja Peserta Didik (LKPD) Deep Learning          | |
| Lengkap dengan asesmen diagnostik awal,  | • Bank Soal Sumatif + Kunci Jawaban Lengkap                | |
| formatif harian, dan instrumen sumatif.  | • Program Tahunan (Prota) & Program Semester (Prosem)      | |
|                                          |                                                            | |
|                                          | [ TOMBOL BESAR: BELI SEKARANG (INSTANT DOWNLOAD) -> ]      | |
|                                          | 🛡️ Garansi File Valid & Bimbingan Penggunaan               | |
|                                          +------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

---

### 4.3 Halaman Checkout (`/checkout/:orderId`) & Lacak Pesanan (`/lacak-pesanan`)
Proses transaksi instan tanpa pendaftaran rumit. Pengguna memasukkan Email + WhatsApp, membayar via QRIS/VA otomatis, dan langsung menerima link download file.

```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] Checkout Aman ModulAjar Store                                           Bantuan: [WhatsApp Admin]|
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
| +--------------------------------------------------+  +-----------------------------------------------+ |
| | 1. DATA PENERIMA FILE                            |  | RINGKASAN PESANAN                             | |
| | Nama Lengkap:                                    |  | Produk: Paket Modul Informatika Fase D (1 Thn)| |
| | [ Ibu Ratna Sari, S.Pd                         ] |  | Harga Normal:       Rp 99.000                 | |
| | Email Pembelian (Untuk pengiriman link download):|  | Potongan Diskon:   -Rp 50.000                 | |
| | [ ratnasari@gmail.com                          ] |  | Biaya Layanan:      Rp      0 (Gratis)        | |
| | Nomor WhatsApp (Notifikasi instan):              |  |-----------------------------------------------| |
| | [ 081234567890                                 ] |  | TOTAL BAYAR:        Rp 49.000                 | |
| |                                                  |  +-----------------------------------------------+ |
| | 2. PILIH METODE PEMBAYARAN OTOMATIS              |                                                    |
| | (•) QRIS (BCA, Mandiri, BRI, GoPay, OVO, Dana)   |  +-----------------------------------------------+ |
| | ( ) Virtual Account (BCA, BRI, BNI, Mandiri)     |  | [ KODE QRIS OTOMATIS ]                        | |
| |                                                  |  | [ [  QR CODE SCAN  ] ]                        | |
| | [ TOMBOL: BAYAR SEKARANG (Rp 49.000) -> ]        |  | Sisa Waktu Bayar: ⏱️ 14:52 Menit               | |
| +--------------------------------------------------+  +-----------------------------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

---

## 5. WORKSPACE UTAMA GENERATOR PERANGKAT AJAR (`/app`)

Merupakan jantung sistem ModulAjar.Online. Terdiri dari navigasi sidebar adaptif, panel konfigurasi generator di sisi kiri, dan panel preview multi-tab dokumen pembelajaran di sisi kanan.

### 5.1 Struktur Layout Aplikasi (AppLayout & Sidebar)

#### A. Sidebar Desktop Normal (Lebar 256px) & Collapsed (Lebar 72px)
```
+----------------------------------+   +--------+
| [LOGO] ModulAjar.Online     [<<] |   | [LOGO] | [>>]
|----------------------------------|   |--------|
| MENU UTAMA:                      |   |        |
| [📁] Workspace Pembelajaran      |   | [📁]   |
| [🛍️] Toko Saya (Jual Modul)      |   | [🛍️]   |
| [🌐] Blog & Edukasi SEO          |   | [🌐]   |
|                                  |   |        |
| FITUR KHUSUS:                    |   |        |
| [🏫] Mode Sekolah (Pilot)        |   | [🏫]   |
| [🛡️] Panel Admin (Owner)         |   | [🛡️]   |
| [🏪] Reseller Agency             |   | [🏪]   |
|----------------------------------|   |--------|
| STATUS KUOTA AKUN:               |   |        |
| [💎] Unlimited BYOK Aktif        |   | [💎]   |
|----------------------------------|   |--------|
| [⚙️] Pengaturan Profil & API Key  |   | [⚙️]   |
| [🚪] Keluar Akun                 |   | [🚪]   |
+----------------------------------+   +--------+
```

#### B. Header Mobile & Drawer Navigation (Tampilan HP)
```
+---------------------------------------+
| [ ☰ Menu ] [LOGO] ModulAjar.Online    |
+---------------------------------------+
| (Drawer terbuka dari kiri jika ☰ diklik):
| +-----------------------------------+ |
| | [X] Tutup                         | |
| | [📁] Workspace Pembelajaran       | |
| | [🛍️] Toko Saya                    | |
| | [🌐] Blog & SEO                   | |
| | [🏫] Mode Sekolah                 | |
| | [⚙️] Pengaturan Akun              | |
| | [🚪] Logout                       | |
| +-----------------------------------+ |
+---------------------------------------+
```

---

### 5.2 Header Workspace & Status Bar
Terletak di bagian paling atas konten halaman `/app`.

#### Desktop View (Header Horizontal)
```
+---------------------------------------------------------------------------------------------------------+
| [📁 Folder: Semester Ganjil 2026/2027 v]  [Identitas Guru: Budi Santoso, M.Pd v]  [Kurikulum Merdeka v] |
| Mode: (•) Workspace Terstruktur  ( ) Mode Cepat | Kuota: [⚡ Unlimited BYOK]  [Riwayat ▾]  [Ekspor Paket v]|
+---------------------------------------------------------------------------------------------------------+
```

#### Mobile View (Header Compact)
```
+---------------------------------------+
| [Folder: Ganjil 26/27 v] [Riwayat ▾]  |
| Kuota: [⚡ Unlimited]   [Ekspor Paket]|
+---------------------------------------+
```

---

### 5.3 Panel Input Generator (FormSection) & Panel Preview (Split Screen)

#### A. Tampilan Desktop Split Pane (Grid 450px : Flex-1)
```
+----------------------------------------------+----------------------------------------------------------+
| PANEL INPUT (FORM GENERATOR)                 | PANEL PREVIEW DOKUMEN & TAB PEMBELAJARAN                 |
|----------------------------------------------|----------------------------------------------------------|
| [TAB FORM: 1.IDENTITAS | 2.LANGKAH | 3.SOAL] | [Modul RPM] [LKPD] [Asesmen] [Bank Soal] [Materi] [Prota]|
|                                              |----------------------------------------------------------|
| Jenjang & Fase:                              | Toolbar: [Kop Sekolah: ON/OFF] [Edit AI] [Edit Manual]   |
| [ SMP / MTs                       v ]        | Download: [ Word (.docx) v ]  [ Unduh PDF ]  [Fullscreen]|
| [ Fase D (Kelas 7, 8, 9)          v ]        |----------------------------------------------------------|
|                                              |                                                          |
| Mata Pelajaran:                              |   +--------------------------------------------------+   |
| [ Informatika                     ] [Cari CP]|   | DINAS PENDIDIKAN KABUPATEN • SMP NEGERI 1        |   |
| (Lencana: ✓ BSKAP No. 046/H/KR/2025)         |   | KOP SURAT SEKOLAH TERVERIFIKASI                  |   |
|                                              |   |--------------------------------------------------|   |
| Capaian Pembelajaran (CP):                   |   |         MODUL AJAR PEMBELAJARAN MENDALAM         |   |
| [✓] Berpikir Komputasional                   |   | 1. IDENTITAS UMUM                                |   |
| [✓] Literasi Digital                         |   | Mata Pelajaran : Informatika                     |   |
|                                              |   | Fase / Kelas   : Fase D / Kelas VII              |   |
| Materi Pokok:                                |   | Alokasi Waktu  : 2 JP x 40 Menit                 |   |
| [ Analisis Data dan Algoritma Sederhana    ] |   |                                                  |   |
|                                              |   | 2. TUJUAN PEMBELAJARAN BERMAKNA                  |   |
| Model Pembelajaran:                          |   | Peserta didik mampu mendesain solusi persoalan.. |   |
| [ Problem Based Learning (PBL)    v ]        |   |                                                  |   |
|                                              |   | 3. LANGKAH PEMBELAJARAN BERDIFERENSIASI          |   |
| Multi-Pertemuan:                             |   | A. Kegiatan Awal (10 Menit): Apersepsi...        |   |
| Pertemuan ke: [ 1 ] dari [ 4 ] pertemuan     |   | B. Kegiatan Inti (60 Menit): Eksplorasi...       |   |
|                                              |   | C. Kegiatan Penutup (10 Menit): Refleksi...      |   |
| [ TOMBOL: GENERATE DOKUMEN (AI) ⚡ ]         |   +--------------------------------------------------+   |
| [ 1-Klik Salin Prompt ke AI Lain ]           |                                                          |
+----------------------------------------------+----------------------------------------------------------+
```

#### B. Tampilan Mobile View (Stacked Pane dengan Tab Switcher)
Pada smartphone, pengguna beralih antara Form Input dan Hasil Preview menggunakan switcher atas:
```
+---------------------------------------+
|  SWITCHER: [ FORM INPUT ]  [ PREVIEW ]|
+---------------------------------------+
| (JIKA MEMILIH "FORM INPUT"):          |
| Jenjang: [ SMP / MTs                v]|
| Fase:    [ Fase D                   v]|
| Mapel:   [ Informatika              ] |
|          [ 🔍 Cari CP BSKAP 046/2025 ]|
|                                       |
| [✓] Berpikir Komputasional            |
| [✓] Literasi Digital                  |
|                                       |
| Materi:  [ Berpikir Komputasi       ] |
| Model:   [ Problem Based Learning   v]|
|                                       |
| [ ⚡ GENERATE DOKUMEN MODUL ]          |
| [ 📋 Export Prompt ke AI Lain ]       |
+---------------------------------------+
| (JIKA MEMILIH "PREVIEW"):             |
| Tab Dokumen:                          |
| [Modul][LKPD][Asesmen][Soal][Prota]   |
|                                       |
| [ Kop: ON ] [ Edit AI ] [ Unduh Word ]|
| +-----------------------------------+ |
| | KOP SEKOLAH RESMI                 | |
| | MODUL AJAR (RPM) INFORMATIKA      | |
| | Pertemuan 1 - Alokasi 2 JP        | |
| | ...isi dokumen terformat rapi...  | |
| +-----------------------------------+ |
| [ 🖨️ Download Word ] [ 📄 Unduh PDF ] |
+---------------------------------------+
```

---

### 5.4 Anatomi Tab Preview Dokumen Perangkat Ajar

#### 1. Tab Modul Ajar (RPM - Rencana Pembelajaran Mendalam)
- **Komponen Utama**: Identitas Sekolah, Identitas Mata Pelajaran, Alokasi Waktu/JP, Dimensi Profil Pelajar Pancasila / Panca Cinta KBC, Sarana Prasarana, Target Siswa, Tujuan Pembelajaran, Pertanyaan Pemantik, Langkah Pembelajaran Berdiferensiasi (Awal, Inti berpedoman sintaks model, Penutup), Rencana Asesmen, Lembar Pengesahan Guru & Kepala Sekolah.

#### 2. Tab LKPD (Lembar Kerja Peserta Didik Deep Learning)
- **Komponen Utama**: Judul Aktivitas, Petunjuk Pengerjaan, Stimulus/Kasus Kontekstual, Aktivitas HOTS Berkelompok/Mandiri, Kolom Jawaban/Eksplorasi Siswa, Rubrik Penilaian Observasi Kinerja.

#### 3. Tab Asesmen Komprehensif
- **Komponen Utama**:
  - *Asesmen Diagnostik Awal*: Kesiapan belajar & minat siswa.
  - *Asesmen Formatif*: Observasi proses diskusi, lembar ceklis sikap.
  - *Asesmen Sumatif*: Rubrik penilaian ketercapaian akhir tujuan pembelajaran.

#### 4. Tab Bank Soal HOTS (C1–C6)
- **Komponen Utama**: Pilihan Ganda (opsi A–D atau A–E), Soal Isian Singkat, Soal Uraian Berbobot, Tag Level Kognitif (C1/C2/C3/C4/C5/C6), Kunci Jawaban Lengkap, dan Pembahasan Rasional.

#### 5. Tab Bahan Ajar & Glosarium
- **Komponen Utama**: Uraian Teori Singkat, Fakta/Contoh Kasus Nyata, Glosarium Istilah Penting, Daftar Pustaka / Referensi Buku Guru dan Siswa.

#### 6. Tab Refleksi & Tindak Lanjut
- **Komponen Utama**: Lembar Refleksi Diri Guru (evaluasi ketercapaian waktu, respon siswa), Lembar Refleksi Peserta Didik (emotikon/pertanyaan pemandu), Program Remedial (pembelajaran ulang), dan Program Pengayaan (materi perluasan).

---

### 5.5 Tab Perencanaan Terpadu (Prota, Prosem & KKTP)
Terletak pada tab "Perencanaan", menyediakan matriks pembagian beban ajar satu tahun pelajaran.

```
+---------------------------------------------------------------------------------------------------------+
| SUB-TAB:  [  1. PROGRAM TAHUNAN (PROTA)  ]   [  2. PROGRAM SEMESTER (PROSEM)  ]   [  3. RUBRIK KKTP  ]  |
+---------------------------------------------------------------------------------------------------------+
| (TAMPILAN SUB-TAB 2: PROSEM MINGGUAN)                                                                   |
| Semester: [ Semester Ganjil (Gasal) v ]   Target Beban: 72 JP   |   Alokasi Terpetakan: 72 JP (100% ✓)     |
|                                                                                                         |
| MATRIKS DISTRIBUSI BULANAN & MINGGUAN:                                                                  |
| +----+----------------------------------+----+-----+---------+---------+---------+---------+---------+ |
| | NO | TUJUAN PEMBELAJARAN (TP)         | JP | SMT | JULI    | AGUSTUS | SEPT    | OKT     | NOV/DES | |
| |    |                                  |    |     | 1 2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2 3 4 | 1 2 3 4 | |
| +----+----------------------------------+----+-----+---------+---------+---------+---------+---------+ |
| | 1. | Menerapkan berpikir komputasional| 12 |  1  |   [4][4]| [4]     |         |         |         | |
| | 2. | Memahami struktur data logika    | 16 |  1  |         |   [4][4]| [4][4]  |         |         | |
| | -- | PENILAIAN TENGAH SEMESTER (PTS)  |  4 |  1  |         |         |     [X] |         |         | |
| | 3. | Analisis data dan privasi digital| 16 |  1  |         |         |         | [4][4]  | [4][4]  | |
| | 4. | Praktik algoritma pemrograman    | 20 |  1  |         |         |         |   [4][4]| [4][4]  | |
| | -- | ASESMEN AKHIR SEMESTER & RAPOR   |  4 |  1  |         |         |         |         |     [X] | |
| +----+----------------------------------+----+-----+---------+---------+---------+---------+---------+ |
| [ + Tambah Baris TP ]  [ 📅 Sinkron Kalender Pendidikan ]  [ 💾 Simpan Prosem ]  [ 🖨️ Ekspor Excel/Word ] |
+---------------------------------------------------------------------------------------------------------+
```

---

### 5.6 Modal & Dialog Interaktif Kunci Workspace

#### A. Modal Pencarian CP Resmi Kemdikbud (`CPSelectorModal.tsx`)
```
+-------------------------------------------------------------------+
| 🔍 Cari CP Resmi Kemdikbud (BSKAP No. 046/H/KR/2025)          [X] |
+-------------------------------------------------------------------+
| Mata Pelajaran: Informatika — Fase D (Kelas VII, VIII, IX)        |
| Sumber Regulasi: [ Lencana: BSKAP No. 046/2025 - Kemdikbudristek ]|
|                                                                   |
| Pilih Elemen Capaian Pembelajaran yang ingin dimasukkan:          |
| [Pilih Semua]                                 (2 Elemen Terpilih) |
|                                                                   |
| [✓] Berpikir Komputasional                                        |
|     Peserta didik mampu memahami dan menerapkan konsep komputasi, |
|     dekomposisi masalah, pengenalan pola, abstraksi, dan algoritma|
|                                                                   |
| [✓] Literasi Digital                                              |
|     Peserta didik mampu memanfaatkan perangkat keras dan lunak,   |
|     menjaga keamanan data pribadi, dan beretika di ruang digital. |
|                                                                   |
|-------------------------------------------------------------------|
| [ Batal ]                   [ ✓ Gunakan CP Terpilih ke Modul (2) ]|
+-------------------------------------------------------------------+
```

#### B. Dialog Ekspor Format Word / PDF (`V2ExportDialog.tsx`)
```
+-------------------------------------------------------------------+
| 🖨️ Ekspor Perangkat Pembelajaran Siap Cetak                    [X] |
+-------------------------------------------------------------------+
| Pilih Format File:                                                |
| (•) Microsoft Word (.docx) - Direkomendasikan (Tabel Rapi & Edit) |
| ( ) Dokumen PDF (.pdf) - Langsung Cetak / Arsip Digital           |
|                                                                   |
| Ukuran Kertas:                                                    |
| [ F4 / Folio (215 x 330 mm) - Standar Sekolah v ]                 |
|                                                                   |
| Kop Sekolah & Lembar Pengesahan:                                  |
| [✓] Sertakan Kop Resmi & Logo Sekolah di Halaman Pertama          |
| [✓] Sertakan Kolom Tanda Tangan Guru & Kepala Sekolah di Akhir    |
|                                                                   |
| Cakupan Dokumen:                                                  |
| [✓] Modul Ajar (RPM)    [✓] LKPD Deep Learning                    |
| [✓] Instrumen Asesmen   [✓] Bank Soal HOTS & Kunci                |
| [✓] Bahan Ajar Lengkap  [✓] Lembar Refleksi Siswa                 |
|                                                                   |
|-------------------------------------------------------------------|
| [ Batal ]                             [ ⬇️ Unduh Dokumen Sekarang ]|
+-------------------------------------------------------------------+
```

#### C. Dialog Ekspor Prompt AI Bebas Kuota (`PromptExportDialog.tsx`)
```
+-------------------------------------------------------------------+
| 📋 Export Prompt AI Siap Pakai (Bebas Kuota / BYOK)           [X] |
+-------------------------------------------------------------------+
| Salin prompt otomatis ini dan jalankan di platform AI favorit Anda|
| tanpa memotong kuota aplikasi:                                    |
|                                                                   |
| Pilih Target AI:  [• Gemini]  [  ChatGPT]  [  Claude]  [ DeepSeek]|
|                                                                   |
| +---------------------------------------------------------------+ |
| | Buatkan Modul Ajar Rencana Pembelajaran Mendalam (RPM)        | |
| | Mata Pelajaran : Informatika                                  | |
| | Fase / Kelas   : Fase D / Kelas 7                             | |
| | Regulasi       : BSKAP No. 046/H/KR/2025                      | |
| | Elemen CP      : Berpikir Komputasional, Literasi Digital     | |
| | Model          : Problem Based Learning (PBL)                 | |
| | Sintaks        : 1. Orientasi Masalah, 2. Organisasi Belajar..| |
| +---------------------------------------------------------------+ |
|                                                                   |
|-------------------------------------------------------------------|
| [ Tutup ]                     [ 📋 Salin Prompt ke Clipboard (✓) ]|
+-------------------------------------------------------------------+
```

---

## 6. MANAJEMEN TOKO SAYA GURU (`/app/store-management`)
Area khusus pendidik untuk mempublikasikan produk digital perangkat ajar dan memonitor penghasilan.

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] ModulAjar.Online   |   Toko Saya: "Etalase Guru Budi"           [Lihat Toko Publik] [Tarik Saldo]|
+---------------------------------------------------------------------------------------------------------+
| RINGKASAN TOKO:                                                                                         |
| Total Penjualan: Rp 2.450.000  |  Produk Aktif: 8 Listing  |  Pesanan Selesai: 48  |  Saldo: Rp 850.000 |
+---------------------------------------------------------------------------------------------------------+
| TAB MENU:  [  1. KATALOG PRODUK  ]   [  2. TRANSAKSI  ]   [  3. PENGATURAN TOKO  ]   [  4. AUTO-BUNDEL ]|
+---------------------------------------------------------------------------------------------------------+
| (TAB 1: KATALOG PRODUK)                                                      [ + Tambah Produk Baru ]   |
| +----+-----------------------------------+----------+-----------+------------+------------------------+ |
| | NO | NAMA PERANGKAT AJAR               | KELAS    | HARGA     | TERJUAL    | STATUS & AKSI          | |
| +----+-----------------------------------+----------+-----------+------------+------------------------+ |
| | 1  | Paket 1 Tahun Informatika Fase D  | Kelas 7  | Rp 49.000 | 28 Paket   | [ Aktif ] [Edit] [Hapus| |
| | 2  | Bank Soal HOTS Matematika Kls 8   | Kelas 8  | Rp 29.000 | 14 Paket   | [ Aktif ] [Edit] [Hapus| |
| | 3  | Modul RPM Deep Learning IPAS SD   | Kelas 4  | Rp 35.000 |  6 Paket   | [ Draft ] [Edit] [Hapus| |
| +----+-----------------------------------+----------+-----------+------------+------------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [☰] Toko Saya: Guru Budi     [Saldo]  |
+---------------------------------------+
| Saldo Dapat Ditarik: Rp 850.000       |
| [ Tombol: Tarik Saldo ke Rekening ]   |
|                                       |
| [Tab: Produk] [Tab: Order] [Tab: Info]|
|                                       |
| [ + Buat Produk Digital Baru ]        |
|                                       |
| LISTING PRODUK SAYA:                  |
| +-----------------------------------+ |
| | Paket 1 Tahun Informatika Fase D  | |
| | Harga: Rp 49.000 • Terjual: 28x   | |
| | Status: [ Aktif Publik ]          | |
| | [ Edit Listing ] [ Lihat Review ] | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | Bank Soal HOTS Matematika Kls 8   | |
| | Harga: Rp 29.000 • Terjual: 14x   | |
| | Status: [ Aktif Publik ]          | |
| | [ Edit Listing ] [ Lihat Review ] | |
| +-----------------------------------+ |
+---------------------------------------+
```

---

## 7. MANAJEMEN BLOG & KONTEN SEO (`/app/blog-management`)
Panel pembuatan artikel blog dan panduan kurikulum untuk author/admin.

#### Desktop View
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] Blog & Content Management                                             [ + Tulis Artikel Baru ]   |
+---------------------------------------------------------------------------------------------------------+
| DAFTAR ARTIKEL PUBLIKASI:                                                                               |
| +---------------------------------------------+-------------------+-------------+---------------------+ |
| | JUDUL ARTIKEL & SLUG                        | KATEGORI          | STATUS      | STATISTIK & AKSI    | |
| +---------------------------------------------+-------------------+-------------+---------------------+ |
| | Panduan Lengkap Regulasi BSKAP No. 046/2025 | Kurikulum Merdeka | [Published] | 1.420 Views  [Edit] | |
| | 7 Perbedaan RPP Deep Learning dengan K-13   | Deep Learning     | [Published] |   890 Views  [Edit] | |
| | Cara Menghitung Jam Pelajaran di Prosem     | Tutorial Guru     | [Draft]     |     - Views  [Edit] | |
| +---------------------------------------------+-------------------+-------------+---------------------+ |
+---------------------------------------------------------------------------------------------------------+
```

---

## 8. MODE SEKOLAH & SUPERVISI TERPUSAT (`/sekolah/*`)
Modul khusus bagi Kepala Sekolah dan Pengawas Pembina untuk memonitor kelengkapan administrasi guru di sekolahnya secara langsung.

#### A. Dashboard Utama Sekolah (`/sekolah`)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] Portal Supervisi: SMP NEGERI 1 MAJU BERSAMA                 Semester: [ Ganjil 2026/2027 v ]     |
+---------------------------------------------------------------------------------------------------------+
| STATISTIK ADMINISTRASI GURU:                                                                            |
| [👨‍🏫 32 Guru Terdaftar]   [📚 28/32 Modul Lengkap (87%)]   [📅 Prosem Disetujui: 90%]  [📥 Ekspor Akred] |
+---------------------------------------------------------------------------------------------------------+
| MENU: [Dashboard]  [Kalender Akademik]  [Bank Modul Sekolah]  [Kelola Guru]  [Kop Standar]  [Supervisi] |
+---------------------------------------------------------------------------------------------------------+
| TABEL SUPERVISI GURU:                                                                                   |
| +-----------------------+-------------------+---------------+------------------+----------------------+ |
| | NAMA GURU             | MAPEL / KELAS     | PROTA/PROSEM  | MODUL AJAR (RPM) | STATUS SUPERVISI     | |
| +-----------------------+-------------------+---------------+------------------+----------------------+ |
| | Budi Santoso, M.Pd    | Informatika VII   | [✓ Lengkap]   | [✓ Lengkap 4 P]  | [ Disetujui KS ✓ ]   | |
| | Siti Nurhaliza, S.Pd  | Bahasa Inggris 8  | [✓ Lengkap]   | [⚠️ Belum Ada LK]| [ Perlu Revisi   ]   | |
| | Ahmad Fauzi, S.Pd.I   | PAI & BP VII      | [✓ Lengkap]   | [✓ Lengkap 4 P]  | [ Disetujui KS ✓ ]   | |
| +-----------------------+-------------------+---------------+------------------+----------------------+ |
| [ 📥 Download Semua Modul 1 Sekolah (.ZIP untuk Akreditasi / Pengawas Pembina) ]                        |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Pengaturan Kop & Template Seragam Sekolah (`/sekolah/standar`)
```
+---------------------------------------------------------------------------------------------------------+
| STANDAR KOP SURAT & LEMBAR PENGESAHAN SEKOLAH                                                           |
| Pengaturan ini otomatis diterapkan pada seluruh file Word & PDF yang dibuat oleh guru di sekolah ini.    |
|                                                                                                         |
| Nama Instansi Induk : [ DINAS PENDIDIKAN KABUPATEN BOGOR                                              ] |
| Nama Sekolah Resmi  : [ SMP NEGERI 1 SUKAMAJU                                                        ] |
| Alamat & Kontak     : [ Jl. Raya Pendidikan No. 45, Telp: (0251) 832145, Email: smpn1@sekolah.sch.id   ] |
| Logo Sekolah        : [ [ LOGO SEKOLAH ] ] [ Tombol: Unggah Logo PNG Transparan ]                       |
|                                                                                                         |
| Lembar Pengesahan:                                                                                      |
| Nama Kepala Sekolah : [ Drs. H. Bambang Irawan, M.M.                                                  ] |
| NIP Kepala Sekolah  : [ 196805121994031004                                                            ] |
| [ 💾 Simpan Standar Sekolah ]                                                                           |
+---------------------------------------------------------------------------------------------------------+
```

---

## 9. DASBOR RESELLER / AGENCY MITRA (`/agency`)
Portal khusus mitra agen untuk mengelola lisensi pengguna, menghasilkan tautan afiliasi, dan memonitor pendapatan komisi.

```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] Portal Mitra Reseller ModulAjar                          Status: [ Agen Resmi Tier PRO ]         |
+---------------------------------------------------------------------------------------------------------+
| RINGKASAN BISNIS RESELLER:                                                                              |
| Saldo Komisi: Rp 4.850.000  |  Lisensi Terjual: 85 Akun  |  Sisa Kuota Lisensi: 65 Akun  | [Tarik Dana] |
+---------------------------------------------------------------------------------------------------------+
| LINK REFERRAL ANDA:                                                                                     |
| [ https://modulajar.online/join?ref=AGENBUDI2026                                ] [ 📋 Salin Link ]     |
| Kupon Diskon Pembeli (10%): [ GURUMAAT26 ]                                                              |
+---------------------------------------------------------------------------------------------------------+
| ALAT BANTU PROMOSI:                                                                                     |
| [ 🖼️ Unduh 20+ Gambar Banner Promosi ]  [ 📱 Salin Script WhatsApp Broadcast ]  [ 🎥 Download Video ]   |
|                                                                                                         |
| DAFTAR AKUN TERAKTIVASI:                                                                                |
| 1. Ibu Nurul Hidayati (SMPN 2) - Paket 1 Tahun - Tgl 14 Nov 2026 - Komisi: Rp 50.000                     |
| 2. Bpk. Hendra Gunawan (SMAN 1) - Paket 1 Tahun - Tgl 13 Nov 2026 - Komisi: Rp 50.000                  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 10. PANEL KENDALI ADMIN SISTEM (`/admin/*`)
Panel pengawasan pusat untuk pemilik platform (super-admin).

#### A. Dashboard Admin (`/admin`)
```
+---------------------------------------------------------------------------------------------------------+
| [ADMIN PANEL] ModulAjar.Online                                           Akun: jagofeed@gmail.com (Super)|
+---------------------------------------------------------------------------------------------------------+
| METRIK UTAMA:                                                                                           |
| Total Pengguna: 3.420 Guru  |  Generate Hari Ini: 840 Dokumen  |  Revenue Bulan Ini: Rp 42.500.000      |
+---------------------------------------------------------------------------------------------------------+
| NAVIGASI ADMIN:                                                                                         |
| [👥 Kelola User]  [💳 Pelanggan/Lisensi]  [🏫 Pilot Sekolah]  [🏪 Program Agency]  [⚙️ Sistem & AI Key]  |
+---------------------------------------------------------------------------------------------------------+
| LOG SISTEM & KESEHATAN ENGINE:                                                                          |
| • Edge Function `generate-content`: Sehat (Latency: 1.2s • Model Aktif: Gemini 3.6 Flash / 2.5)         |
| • Database Master CP BSKAP 046/2025: Tersinkron 100%                                                    |
| • Supabase Storage & Buckets: 14.2 GB / 100 GB                                                          |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Pengaturan Model & Kunci Gemini (`/admin/settings`)
```
+---------------------------------------------------------------------------------------------------------+
| KONFIGURASI ENGINE AI GOOGLE AI STUDIO (TIER EXPERIMENTAL)                                              |
| Perhatian: Sesuai .agents/rules/api-key.md, jangan gunakan gemini-1.5 karena akan menghasilkan 404!     |
|                                                                                                         |
| Rantai Model Fallback Aktif (GEMINI_MODEL_CHAIN):                                                        |
| 1. gemini-3.6-flash (Utama / Kecepatan Tinggi)                                                          |
| 2. gemini-3.5-flash                                                                                     |
| 3. gemini-3.0-flash                                                                                     |
| 4. gemini-3.5-flash-lite                                                                                |
| 5. gemini-2.5-flash                                                                                     |
| 6. gemini-2.5-flash-lite                                                                                |
|                                                                                                         |
| Pool Kunci Demo (Untuk Akun Trial):                                                                     |
| • Key 1: AIzaSyD...91aZ  [Aktif ✓]                                                                      |
| • Key 2: AIzaSyB...44kP  [Aktif ✓]                                                                      |
| • Key 3: AIzaSyC...12xM  [Aktif ✓]                                                                      |
| [ + Tambah Demo API Key ]                                                                               |
|                                                                                                         |
| Batas Kuota Trial: [ 50 ] kali generate selamanya per akun.                                             |
| [ 💾 Simpan Konfigurasi Admin ]                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

---

## 11. PENGATURAN AKUN & BYOK GEMINI API (`/settings`)
Halaman personal bagi guru untuk mengatur profil dinas, identitas kepala sekolah, dan konfigurasi API Key Google AI Studio mandiri (*Bring Your Own Key*).

#### A. Desktop View (1280px)
```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] Pengaturan Akun Pendidik                                                 [ <- Kembali ke App ]   |
+---------------------------------------------------------------------------------------------------------+
| TAB:  [  1. PROFIL GURU & SEKOLAH  ]   [  2. API KEY (BYOK UNLIMITED)  ]   [  3. PAKET & KEAMANAN  ]    |
+---------------------------------------------------------------------------------------------------------+
| (TAB 2: API KEY GOOGLE AI STUDIO - BYOK)                                                                |
| Gunakan kunci API Google AI Studio Anda sendiri untuk menikmati kuota generate UNLIMITED sepuasnya!     |
|                                                                                                         |
| Kunci API Gemini Anda:                                                                                  |
| [ AIzaSyD8k2039109401920391209312093012903                  ] [ 👁️ Tampilkan ]                         |
| Status Kunci: [ Lencana Hijau: Valid & Terhubung ke Gemini 3.6 Flash ✓ ]                                |
|                                                                                                         |
| Pilihan Provider Utama:                                                                                 |
| (•) Google Gemini (Gratis & Direkomendasikan)    ( ) OpenAI GPT-4o    ( ) Grok xAI                      |
|                                                                                                         |
| [ TOMBOL: TES KONEKSI KUNCI API ]                [ TOMBOL: SIMPAN PENGATURAN API KEY ]                  |
|                                                                                                         |
| PANDUAN CEPAT (1 MENIT):                                                                                |
| 1. Buka situs resmi Google AI Studio (aistudio.google.com).                                             |
| 2. Login dengan akun Google / Gmail Anda, lalu klik "Get API Key".                                      |
| 3. Buat kunci baru, salin kodenya, dan tempelkan pada kolom di atas.                                    |
| Selesai! Anda dapat membuat ratusan perangkat ajar tanpa khawatir batasan kuota.                       |
+---------------------------------------------------------------------------------------------------------+
```

#### B. Mobile View (375px)
```
+---------------------------------------+
| [<-] Pengaturan Akun                  |
+---------------------------------------+
| [Tab: Profil] [Tab: API Key] [Tab: Pkt|
|                                       |
| KONFIGURASI API KEY (BYOK):           |
| Masukkan Gemini API Key:              |
| [ AIzaSyD8k203910940...           ][👁️]|
| Status: [ Terhubung Aktif ✓ ]         |
|                                       |
| [ ⚡ Tes Koneksi API Key ]             |
| [ 💾 Simpan API Key ]                 |
|                                       |
| Cara Dapatkan Kunci Gratis:           |
| 1. Buka aistudio.google.com           |
| 2. Klik "Get API Key"                 |
| 3. Copy & paste ke form di atas       |
+---------------------------------------+
```

---

## 12. MATRIKS RESPONSIVITAS & PERILAKU KOMPONEN

| Menu / Halaman | Desktop (> 1024px) | Tablet (768px - 1024px) | Mobile Smartphone (< 768px) |
| :--- | :--- | :--- | :--- |
| **Landing Page** | Grid 3-4 kolom, tabel perbandingan 4 kolom penuh, preview mockup besar | Grid 2 kolom, tabel scroll horizontal | Single column stack, tab filter perbandingan (vs Manual / vs Lain), carousel mockup |
| **Workspace (`/app`)** | Split-pane horizontal (Form 450px : Preview Flex-1) | Split-pane dengan sidebar otomatis mengecil (*collapsed*) | Tab switcher atas `[Form Input]` vs `[Preview]`, drawer menu dari kiri |
| **Tabel Dokumen Preview** | Lebar penuh dengan margin kertas A4/F4 presisi, toolbar atas lengkap | Toolbar atas fleksibel dengan ikon, preview scale down otomatis | Toolbar scroll horizontal, pinch-to-zoom preview, download button floating di bawah |
| **Modal CP BSKAP 046** | Dialog lebar 700px, checklist 2 kolom, badge resmi | Dialog 90vw, checklist 1 kolom luas | Fullscreen / Sheet bottom drawer dengan tombol apply sticky di bawah |
| **Toko Saya & Katalog** | Grid kartu 4 kolom dengan filter samping | Grid kartu 3 kolom, filter collapsible | Grid kartu 1-2 kolom dengan filter pill geser horizontal |
| **Supervisi Sekolah** | Matriks tabel lengkap dengan indikator centang per guru | Tabel dengan horizontal scrollbar | Card list per guru dengan badge status accordion yang dapat di-tap |

---

*Dokumen ini merupakan panduan resmi spesifikasi antarmuka visual (Wireframes) untuk ModulAjar.Online Fase 4B.1, mencakup seluruh alur layar, komponen navigasi, serta skenario interaksi pengguna.*
