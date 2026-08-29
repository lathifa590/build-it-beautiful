# 📄 Spesifikasi Format Output Dokumen — ModulAjar Online

> Dokumen ini berisi wireframe ASCII dan spesifikasi teknis untuk 6 pilihan format export dokumen Word pada aplikasi ModulAjar Online.  
> **Konten modul selalu sama persis** — yang berbeda hanya cara penyajian/layout dokumen.

---

## Ringkasan 6 Format

| # | Label UI | Karakteristik Layout |
|---|---|---|
| 1 | **Tabel Lengkap** | Default — semua pakai tabel 2 kolom (existing) |
| 2 | **Minimalis Bersih** | Heading besar + bullet/paragraf, tanpa tabel (kecuali rubrik asesmen) |
| 3 | **Per Pertemuan** | 1 file, page break + "cover mini" per pertemuan — konten identik default |
| 4 | **Ringkasan 1 Halaman** | Executive summary, semua info penting muat 1 hal A4 |
| 5 | **Panduan Mengajar** | Checklist aksi guru, ringkas, print-friendly, ada pengingat kunci jawaban |
| 6 | **Modular** | 1 file, LKPD / Asesmen / Soal punya page break + header halaman sendiri |

**Parameter GAS:**
```
outputFormat: "tabel" | "minimalis" | "per-pertemuan" | "ringkasan" | "panduan" | "modular"
```

**UI Suggestion:** Radio button 6 opsi SEBELUM tombol Generate/Download, lengkap dengan tooltip singkat per opsi.

---

## FORMAT 1 — Tabel Lengkap *(Default / Existing)*

> Format bawaan yang sudah berjalan. Semua section menggunakan tabel 2 kolom bersarang. Cocok untuk kelengkapan administrasi dan upload ke sistem dinas.

```
╔═════════════════════════════════════════════════════════════╗
║                    MODUL AJAR                              ║
║              BAHASA INDONESIA — KELAS V                    ║
║       Materi: Puisi Akrostik & Kata Sifat (Adjektiva)      ║
╚═════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  I. IDENTIFIKASI DASAR                                      │
├──────────────────────┬──────────────────────────────────────┤
│ Identitas Umum       │ Nama Penyusun: ...                  │
│                      │ Sekolah: ...                         │
│                      │ Mata Pelajaran: ...                  │
├──────────────────────┴──────────────────────────────────────┤
│  II. IDENTIFIKASI MURID                                     │
├──────────────────────┬──────────────────────────────────────┤
│ Aspek Pengetahuan    │ Murid sudah mengenal ...            │
├──────────────────────┼──────────────────────────────────────┤
│ Aspek Minat          │ Murid umumnya menyukai ...          │
└──────────────────────┴──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  XI. LANGKAH PEMBELAJARAN                                   │
├────────────┬────────────────────────────────────┬──────────┤
│  TAHAP     │  KEGIATAN & PRINSIP                │ DURASI  │
├────────────┼────────────────────────────────────┼──────────┤
│ Pendahuluan│ Orientasi, Apersepsi, Motivasi     │ 10 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ Inti       │ Memahami → Mengaplikasi → Refleksi │ 50 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ Penutup    │ Refleksi + 7KAIH                   │ 10 mnt  │
└────────────┴────────────────────────────────────┴──────────┘

[Tanda Tangan Kepala Sekolah & Guru]
```

---

## FORMAT 2 — Minimalis Bersih

> Konten **sama persis** dengan default. Tabel diganti dengan heading besar + bullet/paragraf. Tabel rubrik asesmen tetap dipertahankan karena lebih mudah dibaca dalam bentuk grid. Cocok untuk cetak harian dan guru yang lebih suka dokumen ringan.

```
╔═════════════════════════════════════════════════════════════╗
║                    MODUL AJAR                              ║
║              BAHASA INDONESIA — KELAS V                    ║
║       Materi: Puisi Akrostik & Kata Sifat (Adjektiva)      ║
╚═════════════════════════════════════════════════════════════╝

  Nama Penyusun  : Husnul
  Sekolah        : SDN Sukamaju
  Mata Pelajaran : Bahasa Indonesia
  Kelas / Fase   : Kelas V / C
  Semester       : 1 (Ganjil)
  Jml Pertemuan  : 3 Pertemuan (175 Menit)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I. IDENTIFIKASI MURID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Pengetahuan Awal
    Murid sudah mengenal huruf dan kata, namun perlu
    pendampingan dalam membedakan kata sifat dengan
    kata benda dalam konteks puitis.

  Aspek Minat
    Murid umumnya menyukai aktivitas kreatif, bercerita,
    dan permainan kata yang menyenangkan.

  Latar Belakang
    Murid Fase C yang sedang dalam masa transisi menuju
    remaja, cenderung ingin mengekspresikan jati diri.

  Kebutuhan Belajar
    Membutuhkan visualisasi konkret (media gambar/kartu
    kata) untuk memahami konsep abstrak seperti adjektiva.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

II. JENIS PENGETAHUAN MATERI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Faktual
    Nama tokoh/kata kunci sebagai akronim, contoh kata
    sifat (baik, cerdas, ramah).

  Konseptual
    Definisi puisi akrostik, peran kata sifat sebagai
    penjelas deskripsi.

  Prosedural
    Langkah menyusun huruf vertikal, mencari kata sifat
    yang sesuai, menyusun menjadi kalimat puitis.

  Metakognitif
    Strategi memilih kata yang paling tepat untuk
    menggambarkan perasaan atau karakter seseorang.

  Kaitan dengan Kehidupan
    Menggunakan kata sifat untuk memberikan apresiasi
    positif kepada orang di sekitar (teman, orang tua,
    guru).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

III. INTEGRASI NILAI & KARAKTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Nilai Karakter
    • Kritis dan Kreatif
    • Kolaborasi
    • Komunikatif
    • Tanggung Jawab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IV. DIMENSI PROFIL LULUSAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  • DPL 3 — Penalaran Kritis
  • DPL 4 — Kreativitas
  • DPL 5 — Kolaborasi
  • DPL 8 — Komunikasi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

V. DESAIN PEMBELAJARAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Capaian Pembelajaran
    Murid mampu menganalisis informasi dan nilai-nilai
    dalam teks sastra, menulis puisi akrostik berdasarkan
    imajinasi dengan rangkaian kalimat kreatif, serta
    menggunakan kosakata baru berupa kata sifat (adjektiva)
    yang tepat sesuai kaidah kebahasaan.

  Tujuan Pembelajaran
    • TP1: Peserta didik mampu menjelaskan pengertian dan
           ciri-ciri teks puisi akrostik serta fungsi kata
           sifat (adjektiva) dalam kalimat.
    • TP2: Peserta didik mampu menganalisis informasi dan
           nilai-nilai moral dalam contoh teks puisi
           akrostik secara kritis.
    • TP3: Peserta didik mampu menggunakan kosakata baru
           berupa kata sifat (adjektiva) yang tepat sesuai
           kaidah kebahasaan dalam menyusun kalimat.
    • TP4: Peserta didik mampu merancang dan menulis puisi
           akrostik berdasarkan imajinasi dengan rangkaian
           kalimat kreatif yang memuat kata sifat.

  Pemahaman Bermakna
    Puisi akrostik adalah media kreatif untuk
    mengekspresikan diri dengan memanfaatkan kata sifat
    (adjektiva) guna memperjelas deskripsi, yang
    mencerminkan kedalaman karakter dan empati terhadap
    diri sendiri serta orang lain.

  Model Pembelajaran   : Project Based Learning (PjBL)
  Metode Pembelajaran  : Diskusi Kelompok, Studi Kasus,
                         Mind Mapping, Presentasi Proyek

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VI. LANGKAH PEMBELAJARAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PERTEMUAN 1 (70 Menit)
  ─────────────────────────────────────────────────────────

  PENDAHULUAN (10 menit)

    Orientasi (4 menit)
      Guru menyapa murid dengan hangat dan mengajak
      melakukan 'Beribadah' (7KAIH) dengan berdoa bersama.
      ★ Membangun kesadaran (Mindful)

    Apersepsi (3 menit)
      Guru bertanya: 'Jika kalian mendeskripsikan sahabat
      kalian, kata apa yang muncul?'
      ❓ "Bagaimana kata sifat bisa membuat sebuah cerita
         menjadi lebih hidup?"
      ★ Bermakna (Meaningful)

    Motivasi (3 menit)
      Permainan tebak kata sifat lewat gerakan tubuh
      (charades).
      ★ Menggembirakan (Joyful)

  INTI — PjBL (50 menit)

    🔍 MEMAHAMI (15 menit)
      Guru menyajikan contoh puisi akrostik 'SAHABAT'.
      Murid menganalisis penggunaan kata sifat di tiap baris.
      ❓ "Apa jadinya jika puisi tidak menggunakan kata sifat?"
      ❓ "Bagaimana cara menyusun kata sifat agar membentuk
         nama seseorang?"
      ★ Bermakna (Meaningful)

    🛠 MENGAPLIKASI (25 menit)
      Kelompok kecil merancang puisi akrostik dari nama tokoh
      pilihan. Guru berkeliling bimbing pemilihan kata sifat.
      ★ Menggembirakan (Joyful)

    💭 MEREFLEKSI (10 menit)
      Perwakilan kelompok membacakan puisi di depan kelas.
      Murid lain memberikan apresiasi dan masukan positif.
      ★ Membangun kesadaran (Mindful)

  PENUTUP (10 menit)

    Refleksi (5 menit)
      ❓ "Bagaimana ilmu tentang kata sifat bisa saya
         gunakan untuk memuji teman?"
      Murid menulis 1 kalimat refleksi di jurnal.

    Apresiasi (5 menit)
      Ingatkan 7KAIH: Tidur Cukup + Gemar Belajar.
      Doa & salam penutup.

  [Pertemuan 2 & 3 lanjut dengan pola yang sama]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Mengetahui,                   [Kota, Tanggal]
  Kepala Sekolah                Guru Mata Pelajaran


  Ahmad Shobirin, M.Pd          Husnul
  NIP. -                        NIP. -

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LKPD — heading + kotak jawaban bergaris bawah (tanpa tabel)
  ASESMEN — heading + bullet; rubrik tetap tabel
  SOAL — soal bernomor tanpa tabel wrapper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **Catatan untuk AntiGravity:** Untuk rubrik asesmen, **tabel tetap dipertahankan** karena lebih mudah dibaca dalam bentuk grid. Semua tabel lain dikonversi ke heading + bullet/paragraf.

---

## FORMAT 3 — Per Pertemuan (1 File, Section Break)

> Konten **sama persis** dengan default. 1 file tunggal, tapi setiap pertemuan diawali page break + "cover mini" pertemuan sehingga guru bisa cetak hanya bagian pertemuan yang dibutuhkan hari itu.

```
╔═════════════════════════════════════════════════════════════╗
║                    MODUL AJAR                              ║
║              BAHASA INDONESIA — KELAS V                    ║
║       Materi: Puisi Akrostik & Kata Sifat (Adjektiva)      ║
╚═════════════════════════════════════════════════════════════╝

  [Halaman 1-N: IDENTITAS, PROFIL MURID, DESAIN PEMBELAJARAN]
  [Sama dengan Format Default — Tabel Lengkap]

  Mengetahui,                   [Kota, Tanggal]
  Kepala Sekolah                Guru Mata Pelajaran

  Ahmad Shobirin, M.Pd          Husnul
  NIP. -                        NIP. -


════════════════ [ PAGE BREAK ] ════════════════════════════


╔═════════════════════════════════════════════════════════════╗
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
║                  ░  PERTEMUAN 1 dari 3  ░                  ║
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
║                                                            ║
║           BAHASA INDONESIA — KELAS V                       ║
║           Materi: Puisi Akrostik & Kata Sifat              ║
║           Durasi: 70 Menit                                 ║
║           Model: Project Based Learning (PjBL)             ║
║           Tujuan: TP1 & TP2                               ║
╚═════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  LANGKAH PEMBELAJARAN — PERTEMUAN 1                        │
├────────────┬────────────────────────────────────┬──────────┤
│   TAHAP    │   KEGIATAN & PRINSIP               │ DURASI  │
├────────────┼────────────────────────────────────┼──────────┤
│ Pendahuluan│ Orientasi, Apersepsi, Motivasi     │ 10 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ 🔍 Memahami│ Eksplorasi puisi SAHABAT           │ 15 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ 🛠 Aplikasi │ Menyusun puisi kelompok            │ 25 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ 💭 Refleksi│ Presentasi & umpan balik           │ 10 mnt  │
├────────────┼────────────────────────────────────┼──────────┤
│ Penutup    │ Refleksi jurnal + 7KAIH            │ 10 mnt  │
└────────────┴────────────────────────────────────┴──────────┘

  [Isi langkah lengkap persis seperti default]

────────────────── [ SECTION DIVIDER ] ─────────────────────

  ╔══════════════════════════════════════════════════════╗
  ║  LKPD — PERTEMUAN 1                                 ║
  ╚══════════════════════════════════════════════════════╝

  [Isi LKPD lengkap persis seperti default]

────────────────── [ SECTION DIVIDER ] ─────────────────────

  ╔══════════════════════════════════════════════════════╗
  ║  ASESMEN — PERTEMUAN 1                              ║
  ╚══════════════════════════════════════════════════════╝

  [Isi asesmen lengkap: Diagnostik, Formatif, Sumatif,
  rubrik, penilaian diri/sejawat — persis default]

────────────────── [ SECTION DIVIDER ] ─────────────────────

  ╔══════════════════════════════════════════════════════╗
  ║  SOAL — PERTEMUAN 1                                 ║
  ╚══════════════════════════════════════════════════════╝

  [Soal 1-7 persis default]


════════════════ [ PAGE BREAK ] ════════════════════════════


╔═════════════════════════════════════════════════════════════╗
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
║                  ░  PERTEMUAN 2 dari 3  ░                  ║
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
║                                                            ║
║           BAHASA INDONESIA — KELAS V                       ║
║           Materi: Puisi Akrostik & Kata Sifat              ║
║           Durasi: 60 Menit                                 ║
║           Model: Project Based Learning (PjBL)             ║
║           Tujuan: TP3 & TP4                               ║
╚═════════════════════════════════════════════════════════════╝

  [Langkah P2 + LKPD P2 + Asesmen P2 + Soal P2]


════════════════ [ PAGE BREAK ] ════════════════════════════


╔═════════════════════════════════════════════════════════════╗
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
║                  ░  PERTEMUAN 3 dari 3  ░                  ║
║                  ░░░░░░░░░░░░░░░░░░░░░░░                   ║
╚═════════════════════════════════════════════════════════════╝

  [Langkah P3 + LKPD P3 + Asesmen P3 + Soal P3]
```

---

## FORMAT 4 — Ringkasan 1 Halaman *(Executive Summary)*

> Semua informasi penting disajikan dalam 1 halaman A4. Cocok untuk laporan ke kepala sekolah, upload ke sistem dinas, atau portofolio cepat.

```
╔═════════════════════════════════════════════════════════════╗
║            RINGKASAN MODUL AJAR                            ║
╠══════════════════╦══════════════════════════════════════════╣
║ Mata Pelajaran   ║ Bahasa Indonesia                        ║
║ Materi           ║ Puisi Akrostik & Kata Sifat (Adjektiva) ║
║ Kelas / Fase     ║ V / C                                   ║
║ Semester         ║ 1 (Ganjil)                              ║
║ Jumlah Pertemuan ║ 3 Pertemuan (175 Menit Total)           ║
║ Model            ║ Project Based Learning (PjBL)           ║
╠══════════════════╩══════════════════════════════════════════╣
║ TUJUAN PEMBELAJARAN                                        ║
║ TP1 Menjelaskan konsep puisi akrostik & kata sifat         ║
║ TP2 Menganalisis nilai moral dalam teks puisi              ║
║ TP3 Menggunakan kata sifat sesuai kaidah kebahasaan        ║
║ TP4 Merancang & menulis puisi akrostik kreatif             ║
╠════════════════════════════════════════════════════════════╣
║ STRUKTUR PERTEMUAN                                         ║
║  P1 (70') Eksplorasi konsep & menyusun puisi kelompok      ║
║  P2 (60') Pengembangan puisi individual & kata sifat       ║
║  P3 (45') Presentasi galeri, asesmen sumatif               ║
╠════════════════════════════════════════════════════════════╣
║ ASESMEN                                                    ║
║  Diagnostik  : Pertanyaan lisan awal                       ║
║  Formatif    : Observasi diskusi, penilaian diri/sejawat   ║
║  Sumatif     : Tes uraian + rubrik (skor 100)             ║
╠════════════════════════════════════════════════════════════╣
║ NILAI KARAKTER        ║ DIMENSI PROFIL LULUSAN             ║
║ Kritis & Kreatif      ║ DPL 3: Penalaran Kritis            ║
║ Kolaborasi            ║ DPL 4: Kreativitas                 ║
║ Komunikatif           ║ DPL 5: Kolaborasi                  ║
║ Tanggung Jawab        ║ DPL 8: Komunikasi                  ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Kepala Sekolah           Guru Mata Pelajaran              ║
║                                                            ║
║  Ahmad Shobirin, M.Pd     Husnul                          ║
║  NIP. -                   NIP. -                          ║
╚════════════════════════════════════════════════════════════╝
```

---

## FORMAT 5 — Panduan Mengajar *(Pegangan Guru di Kelas)*

> Isi ringkas berupa checklist aksi guru. Cocok dicetak 1–2 halaman dan dibawa saat mengajar. Ada "kotak pengingat" berisi kata kunci dan kunci jawaban soal di bagian bawah setiap pertemuan.

```
╔═════════════════════════════════════════════════════════════╗
║              PANDUAN MENGAJAR — PERTEMUAN 1                ║
║         Bahasa Indonesia │ Kelas V │ 70 Menit              ║
╠══════════════╦══════════════════╦══════════════════════════╣
║ Model: PjBL  ║ Tujuan: TP1, TP2 ║ Media: Proyektor, Kartu ║
╚══════════════╩══════════════════╩══════════════════════════╝

  ┌─────────────────────────────────────────────────────────┐
  │  PENDAHULUAN                                   10 mnt  │
  └─────────────────────────────────────────────────────────┘
    □ Salam + doa bersama (7KAIH: Beribadah)
    □ Jelaskan tujuan: "hari ini kita jadi penyair kreatif"
    □ Tanya: "Kata apa untuk mendeskripsikan sahabatmu?"
    □ Permainan charades kata sifat — bangun semangat kelas

  ┌─────────────────────────────────────────────────────────┐
  │  🔍 MEMAHAMI                                   15 mnt  │
  └─────────────────────────────────────────────────────────┘
    □ Tampilkan puisi 'SAHABAT' di proyektor
    □ Minta murid: garis bawahi kata sifat di setiap baris
    □ Diskusi: "Apa fungsi kata sifat dalam puisi ini?"
    □ Lempar pertanyaan pemantik:
       ❓ "Apa jadinya puisi tanpa kata sifat?"
       ❓ "Bagaimana kata sifat bisa membentuk nama?"

  ┌─────────────────────────────────────────────────────────┐
  │  🛠 MENGAPLIKASI                               25 mnt  │
  └─────────────────────────────────────────────────────────┘
    □ Bagi murid menjadi kelompok kecil
    □ Instruksi: pilih nama tokoh → susun puisi akrostik
    □ Keliling kelas — pantau & bimbing pilihan kata sifat
    □ Dorong kolaborasi, hargai semua ide

  ┌─────────────────────────────────────────────────────────┐
  │  💭 MEREFLEKSI                                 10 mnt  │
  └─────────────────────────────────────────────────────────┘
    □ Minta 1–2 kelompok baca puisi di depan kelas
    □ Fasilitasi apresiasi antar teman
    □ Tegaskan: keberanian & kreativitas itu penting

  ┌─────────────────────────────────────────────────────────┐
  │  PENUTUP                                       10 mnt  │
  └─────────────────────────────────────────────────────────┘
    □ Murid tulis 1 kalimat refleksi di jurnal
       ❓ "Bagaimana ilmu kata sifat bisa memuji teman?"
    □ Beri apresiasi verbal kepada seluruh kelas
    □ Ingatkan: Tidur Cukup + Gemar Belajar (7KAIH)
    □ Doa & salam penutup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ╔═════════════════════════════════════════════════════════╗
  ║  📌 PENGINGAT CEPAT                                    ║
  ║  Kata Sifat Kunci : baik, ceria, pintar, cerdas,       ║
  ║                     ramah, jujur, rajin, sopan          ║
  ║  Kunci Jawaban    : SAHABAT / kata sifat: ramah, dll   ║
  ║  Skor Sumatif     : Soal 1–7 / rubrik 4-3-2-1          ║
  ╚═════════════════════════════════════════════════════════╝
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


════════════════ [ PAGE BREAK ] ════════════════════════════

  [PANDUAN MENGAJAR — PERTEMUAN 2 — pola checklist sama]

════════════════ [ PAGE BREAK ] ════════════════════════════

  [PANDUAN MENGAJAR — PERTEMUAN 3 — pola checklist sama]
```

---

## FORMAT 6 — Modular

> 1 file tunggal, tapi **LKPD, Asesmen, dan Soal masing-masing punya page break + header halaman sendiri**. Guru bisa mencetak hanya bagian yang dibutuhkan (misalnya cetak LKPD saja, atau Soal saja) tanpa harus cari-cari halaman. Konten persis sama dengan default.

```
╔═════════════════════════════════════════════════════════════╗
║                    MODUL AJAR                              ║
║              BAHASA INDONESIA — KELAS V                    ║
╚═════════════════════════════════════════════════════════════╝

  [Halaman 1-N: Identitas + Desain Pembelajaran + Langkah]
  [Sama dengan Format Default — Tabel Lengkap]

  Tanda tangan Kepala Sekolah & Guru


════════════════ [ PAGE BREAK ] ════════════════════════════
  Header setiap halaman: "LKPD │ Bahasa Indonesia │ Kelas V"
════════════════════════════════════════════════════════════

  ╔═════════════════════════════════════════════════════════╗
  ║         LEMBAR KERJA PESERTA DIDIK (LKPD)              ║
  ║              Model: Deep Learning 2026                 ║
  ╚═════════════════════════════════════════════════════════╝

  Nama   : ______________________________  Kelas : ________
  Tanggal: ______________________________

  ─────────────── PERTEMUAN 1 ─────────────────────────────

  [Isi LKPD P1 persis default]

  ─────────────── PERTEMUAN 2 ─────────────────────────────

  [Isi LKPD P2 persis default]

  ─────────────── PERTEMUAN 3 ─────────────────────────────

  [Isi LKPD P3 persis default]


════════════════ [ PAGE BREAK ] ════════════════════════════
  Header setiap halaman: "ASESMEN │ Bahasa Indonesia │ Kelas V"
════════════════════════════════════════════════════════════

  ╔═════════════════════════════════════════════════════════╗
  ║         INSTRUMEN ASESMEN PEMBELAJARAN                 ║
  ╚═════════════════════════════════════════════════════════╝

  ─────────────── PERTEMUAN 1 ─────────────────────────────

  A. DIAGNOSTIK
  [Isi diagnostik P1 persis default]

  B. FORMATIF
  [Isi formatif P1 + rubrik persis default]

  C. SUMATIF
  [Isi sumatif P1 + rubrik persis default]

  ─────────────── PERTEMUAN 2 ─────────────────────────────

  [dst. untuk P2 dan P3...]


════════════════ [ PAGE BREAK ] ════════════════════════════
  Header setiap halaman: "LEMBAR SOAL │ Bahasa Indonesia │ Kelas V"
════════════════════════════════════════════════════════════

  ╔═════════════════════════════════════════════════════════╗
  ║              LEMBAR SOAL                               ║
  ╚═════════════════════════════════════════════════════════╝

  Nama   : ______________________________  Kelas : ________
  Tanggal: ______________________________  Nilai : ________

  ─────────────── PERTEMUAN 1 ─────────────────────────────

  [Soal 1-7 P1 persis default]

  ─────────────── PERTEMUAN 2 ─────────────────────────────

  [Soal P2 persis default]

  ─────────────── PERTEMUAN 3 ─────────────────────────────

  [Soal P3 persis default]
```

---

## Catatan Implementasi untuk AntiGravity

### Parameter GAS
```javascript
// Parameter yang dikirim ke server saat user klik Generate/Download
const outputFormat = "tabel" | "minimalis" | "per-pertemuan" | "ringkasan" | "panduan" | "modular"
```

### Aturan Khusus per Format

| Format | Tabel Dipertahankan? | Page Break? | Header Halaman? |
|---|---|---|---|
| 1 — Tabel Lengkap | ✅ Semua tabel | — | — |
| 2 — Minimalis Bersih | ⚠️ Hanya rubrik asesmen | — | — |
| 3 — Per Pertemuan | ✅ Semua tabel | ✅ Per pertemuan | — |
| 4 — Ringkasan | ✅ Tabel ringkasan | — | — |
| 5 — Panduan Mengajar | ⚠️ Hanya tabel info singkat | ✅ Per pertemuan | — |
| 6 — Modular | ✅ Semua tabel | ✅ Per komponen | ✅ LKPD / Asesmen / Soal |

### UI Suggestion

```
[ Pilih Format Dokumen ]

  ○ Tabel Lengkap        — Format resmi, semua dalam tabel
  ○ Minimalis Bersih     — Heading & bullet, mudah dibaca
  ○ Per Pertemuan        — Terpisah jelas tiap pertemuan
  ○ Ringkasan 1 Halaman  — Summary untuk kepala sekolah
  ○ Panduan Mengajar     — Checklist ringkas bawa ke kelas
  ○ Modular              — LKPD, Asesmen & Soal terpisah

[ Generate / Download ]
```

---

*Dokumen ini dibuat untuk keperluan pengembangan ModulAjar Online.*  
*Versi: 1.0 — Agustus 2026*
