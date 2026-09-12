# Catatan Bug & Solusi: Generate-Content Edge Function

## BUG #1: Generasi TP (Tujuan Pembelajaran) Menghasilkan Sangat Sedikit Item
**Status:** RESOLVED (2026-09-01)

### Gejala
- "Buat TP dengan AI" hanya menghasilkan 1-6 TP meskipun guru mengisi 20+ topik materi
- Error: Bad control character in string literal in JSON

### Penyebab & Solusi

**A. maxOutputTokens terlalu rendah** -> JSON terpotong -> parser repair hanya bisa selamatkan 1 TP  
FIX: Naikkan ke 'tujuan-pembelajaran': 10000

**B. Literal newline dari AI merusak JSON**  
FIX: Di sanitizeJsonResponse() tambahkan: cleaned = cleaned.replace(/[\n\r\t]+/g, ' ')
JANGAN: Tambahkan regex pengganti tanda kutip (" -> ') -- itu merusak struktur JSON

**C. Formula maxTp di-cap terlalu rendah (dulu Math.min(25, ...))**  
FIX: Gunakan jumlah topik sebagai acuan: maxTp = topicCount * 2

**D. Instruksi AI tidak eksplisit soal jumlah**  
FIX: Instruksi wajib menyebutkan: "SETIAP topik WAJIB dapat MINIMAL 1 TP, JANGAN gabungkan"

### Jangan Pernah Lakukan
- Mengubah system prompt dengan "Gabungkan dalam satu kalimat" -> AI akan buat 1 TP saja
- Membatasi maxTp lebih kecil dari jumlah topik guru
- Menggunakan regex pengganti tanda kutip di sanitizeJsonResponse

## BUG #2: Error 500 'Edge Function returned a non-2xx status code' pada Generate KKTP / Prota
**Status:** RESOLVED (2026-09-12)

### Gejala
- Mengklik tombol 'Generate KKTP' atau 'Generate Prota' menghasilkan pesan error merah 'Edge Function returned a non-2xx status code'.

### Penyebab & Solusi

**A. Anggapan Keliru tentang Model 'Halusinasi' (SANGAT PENTING)**
AI Assistant (Agent) sebelumnya MENGIRA model gemini-3.5-flash dkk adalah halusinasi karena model resmi GA Google baru 1.5/2.0. Ini SALAH BESAR untuk proyek ini.
FIX: **BACA pi-key.md**. Akun AI Studio proyek ini berada pada *experimental tier* dan HANYA bisa mengakses gemini-3.5-flash, gemini-3.0-flash, gemini-2.5-flash, dll. **JANGAN PERNAH** mengubah model chain ini menjadi gemini-1.5-flash, karena justru akan menyebabkan 404 Not Found.

**B. JSON Parse Error me-lempar Status 500**
Penyebab sebenarnya dari Error 500 tersebut adalah saat AI memberikan output JSON yang cacat (misal kurang tanda kutip/kurung). JSON.parse akan gagal dan men-trigger exception Deno, sehingga fungsi berhenti dan mereturn error 500.
FIX: Bungkus blok JSON.parse dengan 	ry { ... } catch(e) { ... } pada Edge Function (generate-kktp, generate-prota, dll) yang kemudian mengembalikan Response berstatus 200 berisi { error: 'Format AI cacat. Coba lagi.' }. Dengan begini UI akan memunculkan tombol 'Generate Ulang' dengan baik tanpa error 500.

### Jangan Pernah Lakukan
- MENGUBAH DAFTAR MODEL di dalam array GEMINI_MODEL_CHAIN menjadi versi 1.5/2.0!
