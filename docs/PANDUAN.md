# MODULAJAR.ONLINE — PUBLIC PRODUCT KNOWLEDGE BASE

> Dokumen ini adalah **knowledge base publik** untuk ModulAjar.Online.
> Dipakai sebagai sumber kebenaran (source of truth) untuk membuat copy promosi, materi pemasaran, dan jawaban pertanyaan pelanggan.
> Semua fitur yang ditulis di sini adalah fitur yang benar-benar tersedia di aplikasi.

---

## 1. Tentang ModulAjar.Online

**ModulAjar.Online** adalah platform **generator perangkat ajar berbasis AI** untuk guru Indonesia.

Fungsi utamanya: membantu guru membuat dokumen pembelajaran secara otomatis — mulai dari **Modul Ajar, LKPD, Asesmen, Bank Soal, Materi Ajar, Refleksi**, hingga dokumen perencanaan tahunan seperti **Prota (Program Tahunan), Prosem (Program Semester), dan KKTP**.

Hal-hal penting tentang produk ini:

- Berbasis **web**, bisa dibuka dari browser HP maupun laptop, dan dapat **di-install sebagai aplikasi (PWA)** ke layar utama tanpa lewat App Store / Play Store.
- Mendukung **Kurikulum Merdeka (RPM)** dan **KBC (Kurikulum Berbasis Cinta) Kemenag** — sehingga cocok untuk guru sekolah umum maupun guru madrasah (MI/MTs/MA).
- Menggunakan pendekatan **Pembelajaran Mendalam (Deep Learning): Mindful, Meaningful, Joyful** pada struktur modul yang dihasilkan.
- Menggunakan **database Capaian Pembelajaran (CP) resmi** sebagai dasar pemilihan CP, termasuk sumber CP khusus madrasah untuk KBC.
- Semua dokumen bisa **diedit langsung, dibuat ulang per bagian (regenerate), dan diekspor ke PDF/Word**.

Konteks penggunaan: guru Indonesia yang harus menyusun administrasi pembelajaran (perangkat ajar) sesuai kurikulum berlaku, dalam waktu yang singkat dan berulang setiap tahun ajaran.

---

## 2. Masalah yang Dibantu Diselesaikan

Semua masalah di bawah ini dijawab langsung oleh fitur yang tersedia di aplikasi.

| Masalah Guru | Dijawab oleh Fitur |
|---|---|
| Menyusun Modul Ajar dari nol memakan waktu berjam-jam | Generator AI membuat draf modul lengkap dalam sekali proses |
| Bingung memilih CP yang sesuai materi | Direktori CP resmi yang tersaring otomatis per fase & mapel |
| Harus membuat banyak dokumen turunan (LKPD, asesmen, soal, materi) | Tab dokumen turunan dengan tombol generate terpisah per jenis dokumen |
| Menyusun soal HOTS dengan stimulus dan rubrik itu sulit | Bank Soal dengan pengaturan jenis soal, level kognitif, dan gambar stimulus |
| Menghitung Prota & Prosem manual dengan kalender pendidikan | Mode Workspace menghitung alokasi JP dan memetakan pekan efektif otomatis |
| Hasil AI kadang kurang pas, tapi tidak mau mengulang dari nol | Regenerate per bagian + edit langsung di dokumen |
| Dokumen harus berkop surat sekolah | Pengaturan kop surat (logo, instansi, NPSN) yang otomatis menempel di export |
| Mengulang administrasi yang sama setiap tahun ajaran | Duplikasi Workspace: Prota, Prosem, dan modul tersalin ke tahun ajaran baru |
| Ingin menjual modul karya sendiri | Toko Digital (khusus Pro) dengan checkout dan pelacakan pesanan |
| Kepala sekolah/waka sulit memantau puluhan guru | Mode Sekolah: dashboard monitoring, kalender terpusat, bank modul, rekap supervisi |

Prinsip penulisan manfaat: **FITUR → KEMAMPUAN → MANFAAT YANG MASUK AKAL**. Jangan melebih-lebihkan melebiati tabel di atas.

---

## 3. Target Pengguna

Berdasarkan implementasi aktual, produk ini ditujukan untuk:

1. **Guru sekolah umum** (SD–SMA/SMK) yang menggunakan Kurikulum Merdeka — pengguna utama Mode Cepat & Mode Workspace.
2. **Guru madrasah** (MI/MTs/MA) yang menggunakan Kurikulum Berbasis Cinta (KBC) Kemenag.
3. **Guru yang mengelola administrasi satu tahun ajaran penuh** — pengguna Mode Workspace (paket Pro).
4. **Guru kreator / penjual produk digital pendidikan** — pengguna fitur Toko Digital dan Blog SEO (paket Pro).
5. **Sekolah (Kepala Sekolah & Waka Kurikulum)** — pengguna Mode Sekolah untuk memantau seluruh dewan guru.
6. **Reseller / Agency** (termasuk komunitas guru, MGMP, pengurus bimtek) — menjual lisensi Paket Standar dan mengelola member lewat Dashboard Agency.

---

## 4. Dua Mode Utama: Mode Cepat & Mode Workspace

Aplikasi dirancang untuk dua tipe guru: yang butuh cepat, dan yang butuh administrasi rapi setahun penuh.

### 4.1 Mode Cepat (Quick Mode)

**Apa fungsinya:** membuat modul ajar beserta dokumen turunannya secara instan, tanpa harus menyusun Program Tahunan/Semester dulu.

**Cara kerja:** guru mengisi satu halaman formulir, memilih CP, lalu menekan tombol generate. Hasilnya muncul di area pratinjau dan bisa langsung diedit/diekspor.

**Isi formulir Mode Cepat:**

- **Jenis kurikulum:** Kurikulum Merdeka (RPM) atau KBC (Kurikulum Berbasis Cinta — Kemenag).
- **Identitas guru & sekolah:** nama penyusun, NIP, sekolah, kepala sekolah, NIP kepala sekolah (bisa disimpan sebagai Profil Guru dan dipilih ulang kapan saja).
- **Informasi pembelajaran:** mata pelajaran, fase (A–F, opsi kelas menyesuaikan otomatis sesuai mapping resmi), kelas, semester (ganjil/genap), materi pokok, dan sub-materi.
- **Identifikasi murid:** aspek pengetahuan awal, minat, latar belakang, dan kebutuhan belajar — dipakai AI untuk membuat pembelajaran berdiferensiasi.
- **Dimensi Profil Lulusan (DPL 1–8):** Keimanan & Ketakwaan, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi.
- **Nilai & karakter** yang ingin ditanamkan (misal: Tanggung Jawab, Gotong Royong, Integritas, dll).
- **Multipertemuan:** bisa menambahkan lebih dari satu pertemuan dalam satu kali generate, dengan durasi Jam Pelajaran (JP) yang diatur per pertemuan. Hasil multipertemuan ditampilkan dalam tab navigator per pertemuan.

**Pemilihan Capaian Pembelajaran (CP):**

- Tersedia modal **Direktori CP** yang menyaring CP berdasarkan fase dan mata pelajaran secara otomatis.
- CP diambil dari **database CP resmi** (termasuk sumber khusus **KBC Madrasah** saat kurikulum KBC dipilih).
- Guru memilih elemen lalu mencentang CP yang relevan.
- Tersedia bantuan AI untuk **menghasilkan Tujuan Pembelajaran (TP)** dari CP terpilih dan **kontekstualisasi CP**.
- Untuk mapel yang tidak ada di database (misalnya Muatan Lokal), tersedia **input CP manual**.

### 4.2 Mode Workspace

**Apa fungsinya:** "ruang kerja" per kelas/mapel untuk merencanakan **satu tahun ajaran penuh** — dari CP, Prota, Prosem, sampai eksekusi modul per pertemuan — dengan riwayat tersimpan otomatis per jadwal kalender akademik.

**Cara membuat:** menekan tombol buat Workspace, lalu mengisi mata pelajaran, fase, kelas, dan tahun ajaran.

**Batas jumlah Workspace:** non-Pro maksimal **3 Workspace aktif**; pengguna Pro maksimal **10 Workspace aktif**.

**Fitur manajemen Workspace:**

- **Arsipkan/Unarsipkan** — menyembunyikan Workspace tanpa menghapus data.
- **Duplikasi Workspace** — menyalin seluruh Prota, Prosem, dan modul ke tahun ajaran baru; guru tinggal menyesuaikan kalender liburnya.

Detail alur perencanaan Workspace dibahas di bagian 9.

---

## 5. Jenis Dokumen yang Dihasilkan

Setelah modul utama dibuat, tersedia tab-tab dokumen turunan. Setiap tab punya tombol **Generate** sendiri sehingga guru bisa memilih dokumen apa saja yang perlu dibuat.

| Dokumen | Isi yang Dihasilkan |
|---|---|
| **Modul Ajar** | Dokumen utama: identifikasi, kompetensi, dimensi profil lulusan, langkah pembelajaran bertahap (pendahuluan yang *mindful*, inti yang *meaningful*, penutup yang *joyful*), materi, dan pengesahan |
| **LKPD** | Lembar Kerja Peserta Didik: alat bahan, langkah kerja aktivitas, dan rubrik skor; aktivitas dapat dilengkapi gambar ilustrasi |
| **Asesmen** | Instrumen penilaian lengkap: **Asesmen Awal (Diagnostik)**, **Asesmen Proses (Formatif)**, dan **Asesmen Akhir (Sumatif)** |
| **Bank Soal** | Kumpulan soal sesuai konfigurasi (lihat bagian 6) |
| **Materi** | Bahan bacaan materi ajar untuk siswa, dengan gambar header dan gambar per sub-bab |
| **Refleksi & Tindak Lanjut** | Lembar refleksi terstruktur untuk guru dan peserta didik |
| **Prota** | Program Tahunan: alokasi JP per TP dibagi ke semester 1 dan 2 |
| **Prosem** | Program Semester: pemetaan TP ke pekan efektif berdasarkan kalender pendidikan |
| **KKTP** | Kriteria Ketercapaian Tujuan Pembelajaran dengan 4 level: *Belum Berkembang, Mulai Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang* |

---

## 6. Bank Soal & Jenis Soal

Bank Soal dibuat lewat **Modal Konfigurasi Soal** sebelum generate.

### 6.1 Jenis soal yang didukung (6 jenis)

1. **Pilihan Ganda** — soal PG standar dengan opsi jawaban.
2. **PG Kategori Benar/Salah** — pernyataan dinilai benar atau salah.
3. **PG Multiple Choice Multiple Answer (PG Kompleks)** — pilihan ganda dengan lebih dari satu jawaban benar.
4. **Menjodohkan** — mencocokkan pasangan pernyataan.
5. **Isian Singkat** — mengisi jawaban pendek.
6. **Uraian** — soal esai/urain dengan pembahasan.

Untuk setiap jenis, guru mengatur **jumlah soal** yang diinginkan.

### 6.2 Level kognitif (taksonomi Bloom C1–C6)

Tersedia 3 preset tingkat kesulitan:

| Pilihan | Komposisi |
|---|---|
| **Mudah (Dominan LOTS)** | 70% soal C1–C3, 30% C4–C6 |
| **Sedang (Seimbang)** | 50% LOTS, 50% HOTS |
| **Sulit (Dominan HOTS)** | 30% soal C1–C3, 70% C4–C6 |

Keterangan di aplikasi: LOTS = Mengingat (C1), Memahami (C2), Menerapkan (C3); HOTS = Menganalisis (C4), Mengevaluasi (C5), Mencipta (C6).

### 6.3 Stimulus & gambar soal

- Soal dapat dibuat **dengan stimulus** (teks wacana) — jumlah stimulus bisa diatur per jenis soal.
- Tersedia **Generate Gambar Stimulus**: AI membuatkan ilustrasi gambar yang menempel pada soal.
- Batas wajar per dokumen: maksimal **5 gambar stimulus Bank Soal**, **3 gambar aktivitas LKPD**, dan **5 gambar Materi** — cukup untuk kebutuhan satu set dokumen.

### 6.4 Format soal

- Rumus matematika pada soal dirender dengan format yang rapi, dan **tetap terjaga saat diekspor ke Microsoft Word** (format Word modern, disarankan Word 2016 ke atas).

---

## 7. Fitur Setelah Dokumen Dibuat

### 7.1 Edit langsung di dokumen (Section Editor)

- Arahkan kursor ke paragraf/judul di pratinjau, klik, lalu bagian itu berubah menjadi kotak edit.
- Perubahan tersimpan langsung — tanpa perlu export ke Word dulu.

### 7.2 Regenerate per bagian

- Setiap tab dokumen (LKPD, Asesmen, Materi, Refleksi, Bank Soal) punya tombol **regenerate sendiri**.
- Jika satu dokumen dirasa kurang pas, guru cukup me-generate ulang dokumen itu saja — modul dan dokumen lain yang sudah bagus tidak terganggu.

### 7.3 Riwayat & penyimpanan

- **Riwayat Konten:** hasil generate bisa disimpan, diberi nama, dimuat ulang, diubah namanya, atau dihapus.
- **Profil Guru tersimpan di cloud:** identitas guru & sekolah cukup diisi sekali, lalu dipilih ulang pada pembuatan dokumen berikutnya.
- **Auto-fill cerdas:** isian AI sebelumnya otomatis dibersihkan saat materi diganti, agar hasil baru benar-benar mengikuti materi baru.

### 7.4 Fitur pendukung lain

- **Pratinjau layar penuh (fullscreen)** untuk fokus membaca dokumen.
- **Indikator kuota generate** untuk pengguna trial.
- **Export Prompt AI** — untuk kebutuhan lanjutan pengguna tingkat lanjut.

---

## 8. Export dan Publikasi

### 8.1 Format export

- **PDF** — siap cetak.
- **Word (.docx)** — format sudah rapi dan ter-styling; rumus matematika terekspor dengan format yang kompatibel Microsoft Word modern.

### 8.2 Gabung multipertemuan (Export V2)

- Saat export, tersedia opsi menggabungkan seluruh pertemuan menjadi **satu file Word tunggal**.
- Sistem otomatis memisah tiap pertemuan dengan page break dan membubuhkan kop surat.
- Guru tidak perlu me-merge file Word secara manual.

### 8.3 Kop surat (letterhead)

- Upload **logo kiri** dan **logo kanan** (misal logo sekolah/yayasan/dinas).
- Isi nama instansi, alamat, telepon, dan NPSN.
- Aktifkan toggle **"Gunakan Kop Surat"** — kop otomatis menempel di header dokumen Word dan PDF.

### 8.4 Export dokumen perencanaan

- **Prota, Prosem, dan KKTP** masing-masing dapat diekspor ke Word dari area perencanaan.

### 8.5 Bundle ZIP untuk penjualan

- Penjual di Toko Digital dapat mengemas **bundle** berisi modul + Prota + Prosem + KKTP dalam satu file ZIP siap kirim ke pembeli.

---

## 9. Mode Workspace: Alur Perencanaan Setahun Penuh

### 9.1 Dashboard Workspace

- **Status Perencanaan:** indikator ceklis apakah Prota, Prosem, dan KKTP sudah selesai.
- **Progress Ring:** melacak berapa JP modul yang sudah jadi dibandingkan rencana di Prosem.

### 9.2 Empat langkah perencanaan

1. **Langkah 1 — CP & TP:** pilih Capaian Pembelajaran dan Tujuan Pembelajaran dari database resmi untuk satu tahun penuh (atau input manual untuk mapel khusus).
2. **Langkah 2 — Prota:** bagi alokasi JP untuk tiap TP ke Semester 1 atau 2, lalu generate Prota.
3. **Langkah 3 — Prosem:** isi **Kalender Pendidikan** (tanggal mulai semester, jumlah pekan efektif, daftar event seperti libur, UTS/PTS, UAS/PAS), lalu generate Prosem — sistem memetakan alokasi TP ke pekan efektif dan otomatis melewati pekan libur.
4. **Langkah 4 — Pertemuan:** alokasi JP dipotong menjadi blok jadwal pertemuan (misal 2 JP × menit per JP). **KKTP otomatis ikut terbentuk** dengan 4 level ketercapaian.

### 9.3 Workspace Explorer & Meeting Editor

- **Explorer:** Prosem tampil terbagi per semester → per topik → per pertemuan berikut kalendernya (misal "Pertemuan 1 — minggu ke-3 Juli"). Pertemuan yang belum punya modul tampil pudar.
- **Meeting Editor:** karena berangkat dari Prosem, **target belajar pertemuan sudah terisi otomatis** — guru tinggal menekan generate. Tersedia **regenerate** untuk memuat ulang dokumen, dan **regenerate per jenis dokumen** (misal hanya Bank Soal-nya saja).
- Progres Workspace otomatis naik setiap kali modul pertemuan selesai.

### 9.4 Keystore benefit Mode Workspace

- Administrasi setahun konsisten dengan kalender akademik.
- Duplikasi tahun ajaran berikutnya hanya butuh satu klik + penyesuaian libur.

---

## 10. Toko Digital (Khusus Paket Pro)

Fitur bagi guru yang ingin **menjual modul dan perangkat ajar buatannya**.

### 10.1 Untuk penjual

- **Buka toko:** cukup isi nama toko, rekening pencairan, dan nomor WhatsApp.
- **Kelola produk (listing):** judul, deskripsi, kategori, harga diskon + harga normal, gambar pratinjau, dan tautan file modul.
- **Bundle:** sertakan Prota/Prosem/KKTP dalam paket ZIP penjualan.
- **Kupon diskon:** buat kode promo untuk pembeli.
- **Kelola pesanan:** konfirmasi pembayaran manual, kirim link file.
- **Marketplace global:** produk bisa ikut tampil di etalase toko publik ModulAjar.Online (`/store`).

### 10.2 Untuk pembeli

- Menjelajahi katalog toko, membuka halaman produk, lalu **checkout** (isi nama, email, WhatsApp).
- Pembayaran via **transfer bank** ke rekening penjual, lalu konfirmasi via **WhatsApp** — tanpa perlu instal apa pun.
- Pembeli dapat **halaman lacak pesanan** (`/lacak-pesanan`) untuk memantau status dan mengunduh file setelah pesanan disetujui penjual.

---

## 11. Blog SEO (Khusus Paket Pro)

- **Artikel SEO otomatis:** modul ajar yang sudah jadi dapat diubah menjadi **artikel blog ramah mesin pencari (SEO)** langsung dari Workspace.
- **Editor artikel:** memoles dan memformat artikel sebelum terbit.
- **Blog marketing:** artikel dapat diberi ajakan bertindak (CTA) untuk mempromosikan toko/jasa guru.
- **Blog publik:** semua artikel tampil di halaman `/blog` yang bisa diakses siapa saja.
- ModulAjar.Online juga memiliki **halaman landing SEO publik** untuk topik-topik populer (contoh: generator modul ajar, generator RPP, generator LKPD, generator asesmen, generator Prota-Promes, modul ajar MI/MTs/MA, RPP madrasah).

---

## 12. Agency / Reseller

Program reseller resmi ModulAjar.Online. Agency menjual **lisensi Paket Standar (Rp 149.000/tahun per akun)** kepada guru lain dan mengelola seluruh pelanggannya dari satu dashboard.

### 12.1 Paket Agency (informasi publik di halaman `/paketagency`)

| Paket | Jumlah Slot | Harga Paket | Modal per Slot |
|---|---|---|---|
| **Starter** | 10 slot | Rp 349.000 | ± Rp 34.900/slot* |
| **Advance** | 30 slot | Rp 849.000 | ± Rp 28.300/slot* |
| **Master** | 60 slot | Rp 1.499.000 | **Rp 24.900/slot** |

\* Angka modal per slot Starter/Advance adalah hasil pembagian harga paket; angka resmi yang ditampilkan halaman publik adalah **Rp 24.900/slot** untuk paket Master. Keuntungan diperoleh dari selisih harga jual eceran resmi (Rp 149.000/akun) dengan modal per slot.

- Pendaftaran lisensi Agency dilakukan **via WhatsApp admin** (tautan tersedia di halaman paket).
- Kuota slot Agency **tidak memiliki masa kedaluwarsa** (sesuai FAQ publik halaman paket).

### 12.2 Dashboard Agency (`/agency`)

Yang bisa dilakukan Agency Owner:

- **Mengundang member (guru pembeli)** via email langsung dari dashboard.
- Melihat **daftar Member Aktif** beserta status dan masa aktifnya.
- **Mengirim ulang invite (re-invite)** untuk member yang nonaktif/kedaluwarsa.
- Melihat **Riwayat Invite**.
- Mengakses **Materi Promosi resmi**: brosur, materi desain, dan copywriting siap pakai untuk membantu penjualan.
- Melihat **banner promo aktif** yang sedang dijalankan tim ModulAjar.Online.

### 12.3 Alur menjadi Agency

1. Pastikan sudah memiliki akun ModulAjar.Online aktif.
2. Pilih paket Agency (Starter/Advance/Master) dan hubungi admin via WhatsApp.
3. Setelah aktivasi, dashboard Agency langsung bisa dipakai untuk mengundang dan mengaktivasi akun guru pembeli.

---

## 13. Mode Sekolah (Paket Sekolah)

Fitur pengelolaan level sekolah untuk **Kepala Sekolah dan Waka Kurikulum**. Saat ini berjalan dalam **Program Sekolah Perintis** (rilis terbatas untuk sekolah-sekolah awal).

### 13.1 Masalah yang diselesaikan

- Memeriksa modul puluhan guru satu per satu lewat tumpukan file Word di grup WhatsApp.
- Kalender pendidikan tiap guru berbeda versi.
- Rekap administrasi dadakan saat supervisi/pengawas datang.
- Kop surat dan format dokumen tidak seragam antar guru.

### 13.2 Fitur Mode Sekolah

- **Dashboard Monitoring:** progres penyusunan modul seluruh dewan guru dalam satu layar — jumlah Workspace, JP terencana, dan modul yang sudah siap.
- **Kalender Pendidikan terpusat (Waka):** atur pekan efektif, JP per minggu, libur, dan PTS/PAS sekali saja — otomatis tersalin ke Workspace tiap guru. Satu sumber kebenaran untuk semua.
- **Bank Modul Sekolah:** pusat penyimpanan & kurasi perangkat ajar dewan guru, tersusun folder per mata pelajaran layaknya Google Shared Drive sekolah.
- **Kop & Standar Sekolah:** atur kop surat, logo, nama & NIP Kepala Sekolah/Waka satu kali — seluruh dokumen guru otomatis mengikuti standar resmi sekolah.
- **Rekap Supervisi:** rekap kepatuhan administrasi perangkat ajar per guru, siap cetak/simpan PDF dengan kop sekolah — siap diserahkan ke Pengawas atau untuk akreditasi.
- **Undang Guru:** sebar satu tautan undangan ke grup dewan guru; guru klik dan langsung aktif tanpa proses pendaftaran yang rumit.

### 13.3 Paket Sekolah (informasi publik di halaman `/paketsekolah`)

| Item | Harga Publik |
|---|---|
| Program Perintis | **Rp 1.500.000/tahun untuk 25 guru** (harga terkunci selama berlangganan) |
| Tambahan guru | Rp 90.000 per guru per tahun |
| Harga normal (setelah program perintis) | mulai Rp 1.200.000/tahun (15 guru) s.d. Rp 3.500.000/tahun (50 guru) |
| Yayasan/gugus > 50 guru | hubungi tim (skema khusus) |

Ketentuan penting (sesuai FAQ publik):

- Satu paket mencakup **25 akun guru aktif 1 tahun penuh** dengan fitur pembuatan modul lengkap (Mode Cepat + Multi-Pertemuan + Kurikulum Merdeka & KBC).
- Tiap guru mendapat **maksimal 10 Workspace** (setara akun Pro).
- Pembayaran dapat melalui **dana BOS**.
- Guru tidak perlu pelatihan khusus; Waka Kurikulum mendapat onboarding singkat.

---

## 14. Paket Langganan Personal (Harga Publik)

Ditampilkan resmi di halaman utama website:

| Paket | Harga | Isi |
|---|---|---|
| **Lite** | **Rp 99.000 / 6 bulan** (± Rp 16.500/bln) | Akses 6 bulan penuh • Modul Multi-Pertemuan • Kurikulum Merdeka & KBC • Update fitur reguler |
| **Standar** | **Rp 149.000 / tahun** (± Rp 12.400/bln) | Akses 1 tahun penuh • Modul Multi-Pertemuan • Kurikulum Merdeka & KBC • Update fitur reguler |
| **Pro** | **Rp 197.000 / tahun** (± Rp 16.400/bln) | Semua fitur Standar **+** Mode Workspace • Toko Digital (jual modul) • Blog SEO & Marketing • Tracking progress Prosem & JP • Penyimpanan dokumen reusable • Dukungan prioritas |

Catatan penting:

- Tersedia **akun trial gratis dengan kuota generate terbatas** untuk mencoba sebelum membeli.
- Pembelian dilakukan **via WhatsApp admin** (tombol langganan di website mengarah ke WhatsApp).
- Harga di atas adalah harga yang ditampilkan publik di website; cek halaman resmi untuk harga terkini sebelum membuat materi promosi.

---

## 15. Use Cases

### Guru ingin membuat modul ajar lengkap dengan cepat
Gunakan Mode Cepat → isi form → pilih CP dari direktori → generate. Lengkap dengan pendekatan Deep Learning. Edit bagian yang kurang pas, lalu export Word/PDF.

### Guru ingin membuatkan LKPD, asesmen, dan soal dari modul yang sama
Setelah modul jadi, buka tab **LKPD / Asesmen / Bank Soal** dan generate masing-masing. Soal diatur sendiri: jenis, jumlah, level kognitif, stimulus, dan gambar.

### Guru madrasah (MI/MTs/MA) menggunakan KBC
Pilih kurikulum **KBC (Kemenag)** — direktori CP otomatis memakai sumber CP KBC Madrasah, dan struktur modul mengikuti pendekatan KBC.

### Guru ingin menyiapkan administrasi satu semester/setahun
Gunakan Mode Workspace (Pro): pilih CP setahun → susun Prota → isi kalender pendidikan → generate Prosem → eksekusi modul per pertemuan dari Explorer dengan target yang sudah terisi otomatis.

### Guru pindah tahun ajaran dengan materi yang sama
**Duplikasi Workspace** ke tahun ajaran baru — Prota, Prosem, dan modul tersalin; cukup sesuaikan kalender libur.

### Guru ingin dokumen berkop sekolah rapi
Atur **Kop Surat** sekali saja (logo ganda, instansi, NPSN) — semua export Word/PDF otomatis berkop.

### Guru kreator ingin menjual modulnya
Aktifkan paket Pro → buka **Toko Digital** → buat listing (bisa bundle Prota/Prosem/KKTP ZIP) → bagikan link toko → pembeli checkout transfer dan konfirmasi WhatsApp → kirim link file.

### Guru ingin mempromosikan jasa/modul lewat tulisan
Gunakan **Blog SEO**: ubah modul menjadi artikel ramah Google lengkap dengan CTA ke toko.

### Kepala sekolah ingin memantau & menyeragamkan administrasi sekolah
Ambil **Paket Sekolah**: dashboard monitoring dewan guru, kalender Waka terpusat, bank modul terkurasi, kop & standar sekolah, dan rekap supervisi siap cetak.

### Reseller/MGMP ingin menjual ke rekan guru
Ambil **Lisensi Agency** (Starter/Advance/Master) → aktivasi akun pembeli lewat Dashboard Agency → gunakan materi promosi resmi yang disediakan.

---

## 16. FAQ

**Q: Apakah saya harus punya akun untuk memakai ModulAjar.Online?**
Ya. Pendaftaran dan login menggunakan email dan password (tersedia fitur lupa password).

**Q: Apakah bisa dicoba dulu gratis?**
Ya, tersedia akun trial dengan kuota generate terbatas. Indikator sisa kuota tampil di aplikasi.

**Q: Apakah mendukung Kurikulum Merdeka dan KBC Kemenag?**
Ya. Keduanya dapat dipilih langsung di formulir, termasuk direktori CP khusus madrasah untuk KBC.

**Q: Apakah hasil AI bisa diedit?**
Ya — dua cara: edit langsung di dokumen (klik bagian yang ingin diubah), atau regenerate per dokumen turunan tanpa mengganggu dokumen lain.

**Q: Format export apa saja yang tersedia?**
PDF dan Word (.docx), termasuk opsi gabung semua pertemuan menjadi satu file Word dengan kop surat.

**Q: Apakah rumus matematika ikut rapi saat diekspor ke Word?**
Ya, rumus diekspor dalam format yang kompatibel Microsoft Word modern (disarankan Word 2016 ke atas).

**Q: Apakah bisa membuat soal HOTS?**
Ya. Bank Soal menyediakan pengaturan level kognitif C1–C6 dengan 3 preset (Dominan LOTS / Seimbang / Dominan HOTS), lengkap dengan stimulus dan gambar.

**Q: Apakah harus punya paket Pro?**
Tergantung kebutuhan. Pembuatan modul + dokumen turunan tersedia di semua paket berbayar. Mode Workspace, Toko Digital, dan Blog SEO adalah fitur Paket Pro.

**Q: Berapa batas Workspace?**
Non-Pro maksimal 3 Workspace aktif; Pro maksimal 10 Workspace aktif.

**Q: Apa bedanya Paket Pro dengan Paket Standar?**
Pro = semua fitur Standar + Mode Workspace (Prota/Prosem/KKTP & tracking), Toko Digital, Blog SEO, penyimpanan dokumen reusable, dan dukungan prioritas.

**Q: Bagaimana cara membeli paket?**
Melalui tombol langganan di website yang mengarah ke WhatsApp admin. Pembayaran dan aktivasi dikonfirmasi lewat sana.

**Q: Bagaimana cara pembeli toko menerima file yang dibeli?**
Pembeli checkout → transfer ke rekening penjual → konfirmasi via WhatsApp → penjual menyetujui → link file muncul di halaman pesanan pembeli (bisa dilacak di `/lacak-pesanan`).

**Q: Apakah kuota Agency punya masa kedaluwarsa?**
Tidak, sesuai FAQ publik di halaman paket Agency.

**Q: Bagaimana jika guru di Paket Sekolah lebih dari 25 orang?**
Tambah akun kapan saja tanpa ganti paket: Rp 90.000 per guru per tahun.

**Q: Apakah ModulAjar.Online bisa di-install di HP?**
Ya, sebagai PWA: Android via Chrome ("Tambahkan ke Layar Utama"), iPhone via Safari (Share → "Tambahkan ke Layar Utama").

---

## 17. Terminologi Produk

| Istilah | Arti |
|---|---|
| **ModulAjar.Online** | Platform generator perangkat ajar berbasis AI untuk guru Indonesia |
| **Mode Cepat (Quick Mode)** | Membuat modul instan tanpa perencanaan tahunan |
| **Mode Workspace** | Ruang kerja perencanaan satu tahun ajaran (CP → Prota → Prosem → Pertemuan) |
| **Modul Ajar** | Dokumen utama rencana pembelajaran (sesuai RPM/KBC) |
| **RPM** | Rincian Pembelajaran Merdeka (Kurikulum Merdeka) |
| **KBC** | Kurikulum Berbasis Cinta (Kemenag), untuk madrasah |
| **Deep Learning / Pembelajaran Mendalam** | Pendekatan Mindful–Meaningful–Joyful pada struktur modul |
| **LKPD** | Lembar Kerja Peserta Didik |
| **Asesmen Diagnostik/Formatif/Sumatif** | Penilaian awal / proses / akhir |
| **Bank Soal** | Kumpulan soal hasil generate sesuai konfigurasi jenis & level kognitif |
| **LOTS / HOTS** | Soal berpikir tingkat rendah (C1–C3) / tingkat tinggi (C4–C6) |
| **Stimulus** | Teks wacana/ilustrasi pendamping soal |
| **CP** | Capaian Pembelajaran |
| **TP** | Tujuan Pembelajaran |
| **DPL** | Dimensi Profil Lulusan (8 dimensi profil lulusan terbaru) |
| **Prota** | Program Tahunan |
| **Prosem** | Program Semester |
| **KKTP** | Kriteria Ketercapaian Tujuan Pembelajaran (4 level ketercapaian) |
| **JP** | Jam Pelajaran |
| **Pekan efektif** | Jumlah minggu efektif mengajar per semester |
| **Workspace** | Ruang kerja per kelas/mapel/tahun ajaran |
| **Meeting Editor** | Editor pertemuan di Workspace (target terisi otomatis dari Prosem) |
| **Regenerate** | Membuat ulang satu dokumen/bagian tanpa mengganggu lainnya |
| **Kop Surat (Letterhead)** | Header resmi instansi pada dokumen export |
| **Toko Digital** | Fitur jual-beli modul & perangkat ajar (Paket Pro) |
| **Listing** | Produk yang dipajang di toko |
| **Bundle** | Paket ZIP berisi modul + Prota + Prosem + KKTP untuk dijual |
| **Blog SEO** | Artikel ramah mesin pencari yang dibuat dari modul |
| **Agency** | Reseller resmi penjual lisensi Paket Standar |
| **Slot** | Satu lisensi akun Paket Standar yang dapat dijual Agency |
| **Mode Sekolah** | Fitur pengelolaan sekolah untuk Kepala Sekolah & Waka Kurikulum |
| **PWA** | Progressive Web App — aplikasi web yang bisa di-install ke layar utama HP |
| **Trial** | Akun uji coba gratis dengan kuota generate terbatas |

---

## 18. Copywriting Knowledge

Bagian ini khusus membantu AI copywriter memahami cara membicarakan produk.

### Core Value

> ModulAjar.Online membuat guru Indonesia selesai menyusun perangkat ajar berkualitas — Modul Ajar, LKPD, Asesmen, Bank Soal, hingga Prota & Prosem — dalam hitungan menit, sesuai Kurikulum Merdeka maupun KBC Kemenag, dan tetap sepenuhnya bisa diedit dan diekspor jadi dokumen resmi berkop sekolah.

### Key Benefits

**Efisiensi**
- Draf dokumen lengkap dalam sekali generate, bukan dari nol.
- Duplikasi Workspace untuk tahun ajaran berikutnya.
- Gabung multipertemuan jadi satu file Word otomatis.

**Pembuatan dokumen**
- 9 jenis dokumen: Modul, LKPD, Asesmen (3 jenis), Bank Soal, Materi, Refleksi, Prota, Prosem, KKTP.
- Direktori CP resmi + sumber KBC Madrasah; TP bisa dibuat otomatis.
- Berdiferensiasi lewat identifikasi murid, DPL, dan nilai karakter.

**Soal & penilaian**
- 6 jenis soal, level kognitif C1–C6, stimulus + gambar stimulus AI.
- KKTP 4 level ketercapaian otomatis.

**Kontrol & kualitas**
- Edit langsung per bagian; regenerate per dokumen tanpa merusak yang lain.
- Riwayat tersimpan; profil guru reusable.

**Administrasi setahun (Pro)**
- Prota/Prosem otomatis mengikuti kalender pendidikan & pekan efektif.
- Tracking progres JP dan status perencanaan.
- Kop surat resmi sekolah.

**Peluang penghasilan (Pro & Agency & Sekolah)**
- Toko Digital + bundle + kupon.
- Blog SEO untuk menarik pembeli.
- Lisensi Agency dengan materi promosi resmi.
- Paket Sekolah untuk institusi.

### Key Selling Points (faktual)

- Generator perangkat ajar berbasis AI: satu form, dokumen lengkap.
- Mendukung dua kurikulum: Kurikulum Merdeka (RPM) dan KBC Kemenag (termasuk CP madrasah).
- Pendekatan Pembelajaran Mendalam (Mindful, Meaningful, Joyful) tertanam di struktur modul.
- Multipertemuan dalam satu kali generate, dengan JP per pertemuan.
- Bank Soal HOTS: 6 jenis soal, preset C1–C6, stimulus & gambar.
- Edit langsung + regenerate per bagian — hasil AI bukan "hasil akhir kaku".
- Export PDF & Word berkop surat, rumus matematika rapi di Word.
- Prota & Prosem otomatis dari kalender pendidikan (Mode Workspace).
- Duplikasi Workspace antar tahun ajaran.
- Toko Digital & Blog SEO untuk monetisasi karya (Pro).
- Program resmi Agency dengan materi promosi tersedia.
- Paket Sekolah untuk monitoring dewan guru & rekap supervisi.
- Bisa dipakai dari HP (PWA) tanpa instal dari app store.
- Harga personal mulai Rp 99.000 (6 bulan).

### Pain Points (yang benar-benar dijawab produk)

- "Saya menghabiskan akhir pekan hanya untuk mengetik modul dan LKPD."
- "Tiap tahun harus mengatur ulang Prota/Prosem dan menghitung pekan efektif manual."
- "Sulit membuat soal HOTS dengan stimulus yang relevan."
- "Hasil AI dari tool lain tidak bisa diedit detail / tidak sesuai format resmi."
- "Dokumen saya tidak berkop sekolah dan harus dirapikan ulang di Word."
- "Saya guru madrasah, kebanyakan tool tidak paham KBC."
- "Sebagai waka kurikulum, saya tidak bisa memantau 30 guru sekaligus."
- "Saya ingin punya penghasilan tambahan dari modul yang saya buat."

### Audience Angles

**Guru sekolah umum:**
- Hemat waktu menyusun modul & dokumen turunan.
- Dokumen sesuai RPM, berkop, siap print/submit.
- Soal HOTS mudah dikonfigurasi.

**Guru madrasah (MI/MTs/MA):**
- Satu-satunya kebutuhan spesifik: dukungan KBC Kemenag + CP madrasah bawaan.
- Tidak perlu menyesuaikan manual output tool umum ke format KBC.

**Guru berorientasi administrasi rapi (Pro):**
- Perencanaan setahun konsisten: CP → Prota → Prosem → modul per pertemuan.
- Tracking progres JP; duplikasi tahun ajaran.

**Guru kreator/preneur (Pro):**
- Jual modul lewat toko sendiri + marketplace publik.
- Blog SEO menarik pembeli organik.

**Kepala Sekolah / Waka Kurikulum:**
- Visibilitas progres seluruh dewan guru dalam satu dashboard.
- Kalender terpusat, kop & standar seragam, rekap supervisi siap cetak.
- Pembayaran bisa via dana BOS.

**Reseller / Agency / MGMP:**
- Modal per slot Rp 24.900, jual eceran Rp 149.000.
- Dashboard kelola member + materi promosi resmi disiapkan.
- Kuota slot tanpa masa kedaluwarsa.

### Tone & Bahasa

- Bahasa Indonesia santai-profesional, empatik terhadap beban administrasi guru.
- Sebut fitur secara spesifik (Mode Workspace, KKTP, stimulus soal) — audiens guru paham istilah kurikulum.
- Boleh menyebut angka harga publik di bagian 12–14 dengan menambahkan ajakan cek harga terkini.

---

## 19. Product Claim Rules

Aturan wajib bagi AI/human copywriter saat membuat copy promosi dari dokumen ini:

1. **Jangan mengklaim fitur yang tidak tersedia** — hanya gunakan fitur yang terdokumentasi di file ini.
2. **Jangan mengklaim angka performa tanpa sumber** (misal: "10x lebih cepat", "dipakai 100.000 guru") kecuali ada data resmi yang dirilis tim.
3. **Jangan membuat testimonial palsu.**
4. **Jangan membuat klaim "terbaik", "nomor 1", "paling cepat", "satu-satunya di Indonesia"** tanpa bukti.
5. **Jangan membuat harga atau diskon di luar harga publik di bagian 12–14.** Harga bisa berubah — selalu tulis ajakan cek harga terkini di website/WhatsApp admin.
6. **Jangan membuat deadline promo atau scarcity palsu** ("hari ini terakhir!", "sisa 3 seat!") kecuali benar-benar diumumkan resmi oleh tim.
7. **Jangan mengklaim integrasi yang tidak tersedia** (misal: integrasi Dapodik, Google Classroom, pembayaran otomatis gateway). Pembelian personal/agency dilakukan manual via WhatsApp admin; pembayaran toko via transfer manual + konfirmasi WhatsApp.
8. **Jangan mengklaim keamanan absolut** atau menyebut detail teknis infrastruktur.
9. **Jangan mengubah fitur menjadi klaim manfaat berlebihan** — contoh yang benar: "AI membantu menyusun draf modul dalam hitungan menit" (fitur: generator). Contoh yang salah: "AI menggantikan guru sepenuhnya".
10. **Klaim kurikulum harus akurat:** dukungan resmi adalah Kurikulum Merdeka (RPM) dan KBC Kemenag. Jangan mengklaim dukungan kurikulum lain.

---

*Dokumen ini disusun berdasarkan implementasi aktual aplikasi per tanggal pembaruan terakhir. Untuk harga dan ketersediaan fitur terkini, selalu rujuk website resmi ModulAjar.Online.*
