# BYOK Gemini & Print-Ready DOCX Starter Kit

Starter kit dan modul fondasi untuk membuat aplikasi **Content/Document Generator** berbasis **BYOK (Bring Your Own Key)** dengan **rotasi multi-API key Google Gemini** dan hasil ekspor **Microsoft Word (.docx) siap cetak**.

---

## 📁 Struktur Berkas

```
templates/byok-gemini-docx-starter/
├── database/
│   └── schema.sql                          <-- DDL tabel user_api_keys + RLS Supabase
├── supabase/
│   └── functions/
│       └── generate-content-core/
│           └── index.ts                    <-- Edge Function Deno (Multi-key pool & Model fallback)
├── client/
│   ├── hooks/
│   │   └── useGeminiKeys.ts                <-- React hook untuk memuat key aktif user
│   ├── lib/
│   │   ├── invokeWithRetry.ts              <-- Wrapper transparent retry & schema validation
│   │   └── docx-engine/
│   │       ├── docx-styles.ts              <-- Standar margin A4/F4, typography, tabel, header/footer
│   │       ├── docx-builder.ts             <-- Generator tabel, callout, heading, dan packer blob
│   │       └── math-omml.ts                <-- (Opsional) Injeksi rumus matematika LaTeX -> OMML via JSZip
│   └── components/
│       └── ApiKeyManagerModal.tsx          <-- Modal UI manajemen key & uji coba koneksi
└── README.md
```

---

## 🚀 Cara Mengadopsi di Proyek Baru

### 1. Database (Supabase)
Jalankan isi `database/schema.sql` di **Supabase SQL Editor** pada proyek baru Anda. Ini akan membuat tabel `user_api_keys` dengan Row Level Security (RLS) terpasang.

### 2. Edge Function (Backend)
Salin folder `supabase/functions/generate-content-core/` ke proyek baru Anda, lalu deploy:
```bash
supabase functions deploy generate-content-core --no-verify-jwt
```

### 3. Client Frontend (React / Vite)
1. Salin berkas-berkas di `client/` ke dalam folder `src/` proyek baru.
2. Pastikan dependensi Word export terpasang di `package.json`:
```bash
npm install docx jszip lucide-react
# Opsional jika butuh rumus matematika (LaTeX):
npm install temml mathml2omml
```
3. Panggil `<ApiKeyManagerModal />` di Navbar atau halaman Pengaturan Anda.
4. Gunakan `invokeGenerateWithRetry` untuk memanggil pembuatan konten:
```typescript
import { invokeGenerateWithRetry } from '@/lib/invokeWithRetry';

const { data } = await invokeGenerateWithRetry({
  systemPrompt: "Anda adalah asisten pembuat dokumen...",
  userPrompt: "Buatkan dokumen...",
});
```
5. Gunakan `buildAndPackDocument` dari `docx-builder.ts` untuk menghasilkan dokumen Word siap cetak.

---

## 🤖 Mengarahkan AI Agent

Karena skill **`byok-gemini-docx`** sudah terpasang di `.agents/skills/byok-gemini-docx/SKILL.md`, di proyek baru Anda cukup memberikan instruksi kepada AI agent:

> *"Gunakan skill byok-gemini-docx dan template dari templates/byok-gemini-docx-starter untuk membuat modul generator [Nama Dokumen] dengan schema [Field 1, Field 2, ...]"*

AI agent akan otomatis:
- Menyambungkan key pool pengguna ke edge function.
- Memastikan retry exponential backoff berjalan jika ada limit rate 429.
- Merancang ekspor Word dengan margin resmi (A4/F4), tabel rapi tanpa split terpotong, dan header/footer otomatis.
