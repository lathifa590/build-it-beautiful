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
