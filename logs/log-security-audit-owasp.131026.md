# Log: Self-Security Audit & Remediation (OWASP Top 10)
**Tanggal**: 13 Oktober 2026  
**Konteks**: Audit keamanan mandiri, perbaikan celah keamanan, dan QA hardening menyeluruh berdasarkan standar OWASP Top 10.

---

## 1. Latar Belakang & Tujuan
Sebagai bagian dari *Quality Assurance* dan *Security Engineering*, dilakukan peninjauan mandiri terhadap seluruh basis kode aplikasi ModulAjar.Online (Frontend Vite React SPA, Supabase Edge Functions, dan Database Row Level Security) untuk memastikan sistem tahan terhadap 10 kategori kerentanan OWASP Top 10.

---

## 2. Matriks Temuan & Status Remediasi OWASP Top 10

| Kode OWASP | Kategori Kerentanan | Kondisi Awal Teridentifikasi | Tindakan Perbaikan / Solusi Teknis | Status Akhir |
| :--- | :--- | :--- | :--- | :---: |
| **A01** | **Broken Access Control** | - Edge function `generate-content`, `generate-kktp`, dan `generate-prota` tidak menolak pemanggilan tanpa `Authorization` header, membuka celah penyedotan kuota AI/`LOVABLE_API_KEY` secara gratis.<br>- `sync-lynk-customers` mengizinkan bypass admin jika menggunakan anon key publik (`token !== anonKey`).<br>- `generate-blog-from-workspace` tidak memvalidasi kepemilikan workspace pemanggil (potensi IDOR / kebocoran data antar-pengguna).<br>- `public.modul_store_orders` memiliki RLS `FOR UPDATE USING (true)` dan `FOR SELECT USING (true)` yang mengizinkan pembeli anonim mengubah status ke `COMPLETED` atau membaca seluruh pesanan orang lain. | - Enforce validasi token ketat di semua Edge Functions (kembalikan `401 Unauthorized` / `403 Forbidden`).<br>- Hapus bypass anon key di `sync-lynk-customers` dan ganti dengan verifikasi admin / `CRON_SECRET`.<br>- Validasi `workspace.user_id === user.id` atau peran admin sebelum mengambil konteks materi blog.<br>- Migrasi SQL `20261013140000_fix_store_orders_security_rls.sql`: batasi update pembeli hanya transisi `PENDING_PAYMENT` ➔ `PENDING_REVIEW`, batasi SELECT hanya untuk pemilik toko / email pembeli login, serta sediakan RPC `track_store_order` & `get_store_order_by_id`. | 🟢 **RESOLVED** |
| **A02** | **Security Misconfiguration** | - File `.env` dan variasinya tidak terlindungi di `.gitignore`.<br>- Konfigurasi Vite production belum menonaktifkan *sourcemap* dan masih membiarkan *console logs*. | - Tambahkan `.env`, `.env.*`, dan `!.env.example` ke [.gitignore](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/.gitignore).<br>- Tambahkan `build.sourcemap: false` dan `esbuild.drop: ['console', 'debugger']` di [vite.config.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/vite.config.ts). | 🟢 **RESOLVED** |
| **A03** | **Software Supply Chain Failures** | - Paket `xlsx` terpasang dengan 2 kerentanan *High* (Prototype Pollution GHSA-4r6h-8v6p-xvw6 & ReDoS GHSA-5pgg-2g8v-p4x9) meski kode sudah beralih menggunakan `ExcelJS`.<br>- Total 49 kerentanan dependensi pada audit npm awal. | - Hapus pustaka `xlsx` dari [package.json](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/package.json).<br>- Jalankan `npm audit fix` dan perbarui `vite` ke `v5.4.21` aman. | 🟢 **RESOLVED** |
| **A04** | **Cryptographic Failures** | - Fungsi `claim-customer` menggunakan `getClaims(token)` yang tidak memverifikasi tanda tangan kriptografis token JWT terhadap Supabase Auth. | - Ganti dengan `supabase.auth.getUser(token)` untuk memastikan token tervalidasi secara kriptografis dan aktif di server Supabase. | 🟢 **RESOLVED** |
| **A05** | **Injection (SQLi & XSS)** | - `article.content` di [BlogDetail.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/pages/blog/BlogDetail.tsx) langsung diumpankan ke `dangerouslySetInnerHTML` tanpa pembersihan (Stored XSS).<br>- `MathRenderer.tsx` dan `formatters.tsx` merender tag non-matematika tanpa sanitasi HTML. | - Pasang pustaka `dompurify` dan `@types/dompurify`.<br>- Buat modul sanitasi terpusat [src/lib/sanitize.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/sanitize.ts) dengan daftar putih tag/atribut aman (termasuk tag MathML/SVG).<br>- Terapkan `sanitizeHtml()` pada semua titik `dangerouslySetInnerHTML`. | 🟢 **RESOLVED** |
| **A06** | **Insecure Design** | - Manipulasi status pesanan: pembeli berpotensi mem-bypass pembayaran jika status diubah di sisi client.<br>- Typo nama tabel di `StoreTrackOrder.tsx` (`store_orders` alih-alih `modul_store_orders`). | - State transition dikunci di database level (hanya transisi ke review yang sah untuk pembeli).<br>- Perbaiki pemanggilan tabel dan integrasikan RPC aman `track_store_order`. | 🟢 **RESOLVED** |
| **A07** | **Authentication Failures** | - Formulir login di [Auth.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/pages/Auth.tsx) belum memiliki penahan laju percobaan kata sandi (rentan *credential brute force*). | - Tambahkan mekanisme *client lockout*: kunci tombol submit selama 30 detik setelah 5 kali berturut-turut gagal login. | 🟢 **RESOLVED** |
| **A08** | **Software or Data Integrity Failures** | - Fungsi unggah file toko di `store-api.ts` tidak memeriksa MIME type dan ukuran file, serta tidak membersihkan path dari karakter traversal (`../`). | - Validasi ketat MIME type (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), batas ukuran 5MB (gambar) & 50MB (dokumen), serta sanitasi karakter path traversal. | 🟢 **RESOLVED** |
| **A09** | **Security Logging and Alerting Failures** | - Percobaan brute force, penolakan unggah berkas, dan akses tanpa otorisasi tidak tercatat secara terstruktur. | - Buat modul [src/lib/security-logger.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/security-logger.ts) untuk merekam jejak audit keamanan dengan masking data privasi (tanpa password/token). | 🟢 **RESOLVED** |
| **A10** | **Mishandling of Exceptional Conditions** | - Edge functions mengembalikan `error.message` mentah langsung dari database PostgREST (membocorkan skema kolom/tabel). | - Tangkap error dan kembalikan pesan generik ramah pengguna dengan status HTTP yang tepat (`401`, `403`, `500`), sementara detail error tetap dicatat aman di log konsol internal. | 🟢 **RESOLVED** |

---

## 3. Rincian File yang Dimodifikasi & Dibuat

### Berkas Baru:
1. [src/lib/sanitize.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/sanitize.ts) - Sanitasi HTML berbasis DOMPurify dengan dukungan tipografi edukasi & MathML/SVG.
2. [src/lib/security-logger.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/security-logger.ts) - Logger terstruktur untuk peristiwa keamanan tanpa kebocoran kredensial.
3. [supabase/migrations/20261013140000_fix_store_orders_security_rls.sql](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/migrations/20261013140000_fix_store_orders_security_rls.sql) - Pengetatan RLS dan penyediaan RPC aman `track_store_order` serta `get_store_order_by_id`.
4. [supabase/migrations/20261013120000_school_billing_seats.sql](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/migrations/20261013120000_school_billing_seats.sql) - Penegakan kuota kursi guru dan masa aktif langganan sekolah.

### Berkas yang Diperbarui:
1. [.gitignore](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/.gitignore) - Isolasi file lingkungan (.env).
2. [vite.config.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/vite.config.ts) - Nonaktifkan sourcemap & bersihkan console/debugger pada build produksi.
3. [package.json](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/package.json) & [package-lock.json](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/package-lock.json) - Eliminasi `xlsx`, penambahan `dompurify`.
4. [src/pages/blog/BlogDetail.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/pages/blog/BlogDetail.tsx) - Sanitasi Stored XSS pada konten artikel blog.
5. [src/components/ui/MathRenderer.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/components/ui/MathRenderer.tsx) & [src/lib/formatters.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/formatters.tsx) - Sanitasi render rumus matematika dan HTML AI.
6. [src/lib/store-api.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/lib/store-api.ts) - Validasi upload berkas & fallback getOrder via RPC aman.
7. [src/pages/Auth.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/pages/Auth.tsx) - Pembatasan brute force 30s lockout + logging audit.
8. [src/pages/store/StoreTrackOrder.tsx](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/src/pages/store/StoreTrackOrder.tsx) - Perbaikan nama tabel & pelacakan pesanan via RPC.
9. **Edge Functions**:
   - [generate-content/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-content/index.ts)
   - [generate-kktp/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-kktp/index.ts)
   - [generate-prota/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-prota/index.ts)
   - [sync-lynk-customers/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/sync-lynk-customers/index.ts)
   - [generate-blog-article/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-blog-article/index.ts)
   - [generate-blog-from-workspace/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-blog-from-workspace/index.ts)
   - [generate-blog-from-store/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-blog-from-store/index.ts)
   - [generate-promo-article/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/generate-promo-article/index.ts)
   - [record-store-metric/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/record-store-metric/index.ts)
   - [claim-customer/index.ts](file:///e:/3.%20PRODUK%20DIGITAL/05%20-%20Aplikasi%20dan%20Pengembangan/App/5.%20modul%20ajar%20generator/LOVABLE/Fase%204B.1/supabase/functions/claim-customer/index.ts)

---

## 4. Hasil Verifikasi & QA
1. **Pengujian Build Produksi (`npm run build`)**:
   - Status: **SUCCESS** (Exit code: 0)
   - Waktu kompilasi: 25.38s
   - Bundle `sanitize` terkompilasi bersih tanpa *circular dependency* atau error tipe TypeScript.
2. **Git Version Control**:
   - Commit: `5658be5` (`feat(security): OWASP Top 10 hardening, access control fixes, and XSS sanitization`)
   - Push: Sukses ke `origin/main` (`https://github.com/lathifa590/build-it-beautiful.git`).
