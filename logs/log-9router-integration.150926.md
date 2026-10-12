# Log: Integrasi 9Router Image Generation
**Tanggal**: 15 September 2026
**Konteks**: Integrasi pembuatan thumbnail/cover artikel blog secara otomatis menggunakan fitur `9router-image`.

## 1. Latar Belakang & Kebutuhan
- **Masalah**: Artikel blog yang digenerate AI (melalui Edge Function) tidak memiliki gambar sampul, sehingga UI blog menampilkan *placeholder* kosong (kotak biru muda dengan tulisan ModulAjar.Online).
- **Kebutuhan**: Menggunakan `9router` (AI Gateway) untuk men-generate gambar secara otomatis berdasarkan judul/cuplikan artikel, baik untuk artikel yang akan dibuat maupun artikel lama yang sudah terbit.

## 2. Implementasi Teknis

### A. Update Supabase Edge Function (`generate-blog-article/index.ts`)
- **Prompting Gemini**: Menambahkan perintah pada instruksi JSON schema agar Gemini me-return `image_prompt` berbahasa Inggris (Max 150 karakter) khusus untuk *prompt* gambar (seperti DALL-E/Midjourney).
- **Proses Fail-Soft & Asinkron**: 
  - Artikel di-*insert* terlebih dahulu ke tabel `blog_articles` untuk menjamin terbit.
  - Pembuatan gambar dan upload berjalan secara asinkron menggunakan `Promise.race` dengan *ceiling/timeout* maksimal 5 detik. Jika 9Router lambat atau *error*, Edge Function tetap me-return *success* dan artikel tayang tanpa memblokir sistem.
- **Single Source of Truth**: Deno menggunakan `fetch` native untuk men-download *blob* gambar dari 9Router, lalu mengunggahnya ke **Supabase Storage** (bucket `blog-images`).
- **Dependencies**: Menggunakan standard Deno libraries, tanpa menambahkan SDK eksternal tambahan.

### B. Pembuatan Skrip Backfill (`scripts/generate_existing_blog_images.cjs`)
- **Fungsi**: Sebuah skrip *one-off* (Node.js) untuk menarik seluruh artikel di `blog_articles` yang `featured_image_url`-nya masih kosong (`null`), membuatkan gambar melalui 9Router, dan mengunggahnya ke Supabase Storage.
- **Keamanan**: `NINEROUTER_URL` dan `NINEROUTER_KEY` dibaca melalui *environment variables* lokal (menggunakan Node `--env-file=.env` flag) sehingga *credentials* tidak *hardcoded* di dalam repo.

## 3. Hasil & Debugging (Penemuan Eksekusi)
- **Status Integrasi**: API 9Router berhasil terhubung dengan sukses (menggunakan *local access key* user `sk-c6d7d202f83d4fbb-y5k8b2-f3e018a7`).
- **Issue Upstream (Provider)**: Saat *script backfill* dijalankan untuk model `gemini/gemini-2.5-flash-image`, request ditolak dengan status **HTTP 429 Quota Exceeded**. 
- **Klarifikasi Konsep 9Router**: 
  - 9Router berfungsi sebagai **Proxy/Gateway** (router), bukan penyedia gambar gratis. 
  - 9Router meneruskan *request* pembuatan gambar ke Google (Gemini API) menggunakan API Key Google yang dipasang oleh *user* di dalam dashboard 9Router.
  - *Error* 429 berasal langsung dari Google yang memberlakukan *limit* 0 (kuota habis/di-disable untuk tier gratis) pada pembuatan gambar Gemini.

## 4. Next Steps & Rekomendasi untuk Pengguna
1. **Atasi Kuota Provider**: Tambahkan *billing* (metode pembayaran) pada akun Google API yang dikonfigurasi di 9Router, ATAU gunakan API Key dari *provider* lain (seperti OpenAI untuk DALL-E 3) yang memiliki kuota aktif di menu *Providers* 9Router.
2. **Setup Secrets Cloud**: Konfigurasikan rahasia (`secrets`) pada Supabase agar Edge Function dapat berjalan otomatis ke depannya:
   ```bash
   npx supabase secrets set NINEROUTER_URL="http://ip-atau-domain:20128" NINEROUTER_KEY="sk-rahasia"
   ```
3. **Ubah Model (Opsional)**: Jika beralih menggunakan provider OpenAI, cukup ganti string `model: "gemini/gemini-2.5-flash-image"` menjadi `model: "openai/dall-e-3"` di dalam file *script* dan `index.ts`.
4. **Jalankan Ulang Script**: Ketika API Key di 9Router sudah memiliki kuota, cukup jalankan ulang skrip untuk mengisi gambar kosong:
   ```bash
   node --env-file=.env scripts/generate_existing_blog_images.cjs
   ```
