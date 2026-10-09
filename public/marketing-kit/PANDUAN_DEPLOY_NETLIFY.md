# 🚀 Panduan Deploy Landing Page Agency ke Netlify Drop (Gratis & 1 Menit)

Template `index.html` ini dirancang khusus untuk seluruh **Mitra Agency / Reseller Resmi ModulAjar.Online** agar dapat memiliki website landing page promosi sendiri tanpa perlu mengerti koding atau setup server yang rumit.

---

## 🛠️ Langkah 1: Kustomisasi Nomor WhatsApp & Nama Agency Anda

1. Buka file `index.html` menggunakan aplikasi teks editor favorit Anda (misal: **Notepad**, **VS Code**, atau **TextEdit**).
2. Scroll ke bagian paling bawah file, cari bagian:
   ```javascript
   // =========================================================================
   // ⚙️ KONFIGURASI MITRA AGENCY (CUKUP UBAH BAGIAN INI SAJA!)
   // =========================================================================
   const AGENCY_CONFIG = {
     // 1. Ganti dengan Nama Agency atau Nama Pribadi Anda:
     agencyName: "EduPartner Media",

     // 2. Ganti dengan Nomor WhatsApp Anda (Awali dengan 62 tanpa tanda +):
     whatsappNumber: "6281234567890",

     // 3. Harga Jual Paket Standar yang Anda Tawarkan:
     productPrice: "Rp 149.000",

     // 4. Harga Coret Normal:
     regularPrice: "Rp 250.000",

     // 5. Pesan WhatsApp otomatis saat calon pembeli klik order:
     orderMessage: "Halo Admin 👋\n\nSaya tertarik untuk memesan *Paket Standar ModulAjar.Online (1 Tahun)*.\nMohon informasi nomor rekening dan cara aktivasinya ya. Terima kasih!"
   };
   ```
3. Simpan perubahan file (`Ctrl + S` atau `Cmd + S`).
4. *Selesai! Seluruh tombol WhatsApp di halaman akan otomatis terhubung ke kontak Anda.*

---

## 🌐 Langkah 2: Deploy Gratis ke Netlify Drop

1. Masukkan file `index.html` ke dalam sebuah folder baru (misal beri nama folder: `website-modulajar`).
2. Buka browser dan kunjungi: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
3. Tarik (*Drag and drop*) folder `website-modulajar` tersebut ke area upload Netlify.
4. Tunggu proses upload sekitar 5-10 detik.
5. Website Anda langsung **LIVE** dan memiliki alamat tautan resmi (contoh: `https://guru-modulajar.netlify.app`).

---

## 💡 Tips Optimasi Penjualan:

1. **Ubah Nama Subdomain Netlify**:
   - Di dashboard Netlify Anda, klik **Site configuration** > **Change site name**.
   - Ubah nama situs menjadi yang mudah diingat, misalnya: `modulajar-jatim.netlify.app` atau `agen-modulajar-resmi.netlify.app`.
2. **Pakai Domain Sendiri (Opsional)**:
   - Jika Anda memiliki domain sendiri (misal: `gurumodern.com`), Anda bisa menghubungkannya dengan mudah di menu *Domain Management* Netlify secara gratis.
3. **Bagikan ke Calon Pembeli**:
   - Taruh link landing page Anda di Bio Instagram, status WhatsApp, profil TikTok, atau bagikan langsung saat promosi ke rekan guru dan grup komunitas pendidikan.

---
*Salam Sukses Kemitraan ModulAjar.Online!*
