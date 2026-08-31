# PERINGATAN KERAS: JANGAN UBAH GEMINI_MODEL_CHAIN

Sistem aplikasi ini memiliki dependensi krusial pada model Gemini yang tersedia di akun Google AI Studio yang digunakan.

**DILARANG KERAS MENGUBAH `GEMINI_MODEL_CHAIN` PADA EDGE FUNCTION `generate-content`.**

Akun Google AI Studio yang digunakan oleh aplikasi ini beroperasi pada tier eksperimental dan HANYA memiliki akses ke model-model berikut:
- `gemini-2.5-flash`
- `gemini-3.0-flash`
- `gemini-3.5-flash`
- `gemini-2.5-flash-lite`

Model standar GA seperti `gemini-1.5-flash` atau `gemini-1.5-pro` **TIDAK TERSEDIA** di akun ini dan akan mengembalikan error `404 Not Found`.

Jika Anda diminta untuk memperbaiki masalah terkait pembuatan konten atau API Key, pastikan Anda TIDAK mengembalikan rantai model ke `gemini-1.5`. Ini adalah nyawa dari aplikasi, dan mengubahnya akan merusak fungsi `generate konten` untuk seluruh pengguna.
