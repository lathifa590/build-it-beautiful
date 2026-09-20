# ModulAjar.Online

ModulAjar.Online adalah platform **Generator Dokumen Pembelajaran Profesional** berbasis AI (Artificial Intelligence) untuk membantu guru membuat Modul Ajar, RPP, LKPD, Asesmen, Bank Soal, hingga Prota & Prosem yang disesuaikan dengan **Kurikulum Merdeka** dan **Kurikulum Berbasis Cinta (KBC) Kemenag**.

## 🚀 Fitur Utama
- **Generator AI Otomatis**: Buat Modul Ajar, LKPD, RPP, Asesmen, dan dokumen lainnya secara instan.
- **Dukungan Kurikulum Lengkap**: Mencakup Kurikulum Merdeka (Kemdikbud) dan Kurikulum Berbasis Cinta (Kemenag).
- **Edit & Regenerate AI**: Edit spesifik per bagian atau buat ulang (*regenerate*) poin-poin yang dirasa kurang pas dengan mudah dan fleksibel.
- **Export to PDF & Word**: Mudah diunduh, dicetak, dan diajukan.

## 🛠️ Tech Stack
Proyek ini dibangun menggunakan teknologi web modern:
- **Frontend**: [React 18](https://react.dev/) dipadukan dengan *build tool* [Vite](https://vitejs.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) untuk *type safety*
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan komponen desain dari [shadcn/ui](https://ui.shadcn.com/) (menggunakan tema Neo-Brutalism)
- **Backend & Database**: [Supabase](https://supabase.com/) (Autentikasi, PostgreSQL, dan Storage)

## 💻 Cara Menjalankan Project (Local Development)

Pastikan Anda sudah menginstal **Node.js** (rekomendasi: versi 18 atau terbaru) sebelum menjalankan aplikasi secara lokal.

1. **Clone repository ini**
   ```bash
   git clone <URL_REPO_ANDA>
   cd modul-ajar-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables (Environment lokal)**
   - Buat file bernama `.env` di *root directory*.
   - Tambahkan *keys* dan *URL* Supabase Anda (sesuaikan dengan proyek Supabase yang sedang aktif).
   ```env
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara lokal dan Anda bisa mengaksesnya di *browser* (umumnya di `http://localhost:8080` atau `http://localhost:5173`).

## 📦 Build untuk Production
Jika Anda ingin melakukan *build* untuk dipublikasikan ke layanan hosting (seperti Vercel, Netlify, VPS, dll), jalankan perintah:
```bash
npm run build
```
Setelah proses selesai, hasil *build* *production-ready* akan tersedia di dalam folder `dist/`.

## 📁 Struktur Folder Utama
- `/src/components`: Kumpulan komponen React (UI modular, *layout*, dsb).
- `/src/pages`: Komponen inti dari masing-masing halaman rute (Landing, Admin, User Dashboard, dll).
- `/src/contexts`: React Context untuk *state management* (Auth, Workspace, dll).
- `/src/hooks`: *Custom React hooks* untuk menyimpan logika *fetching* data.
- `/src/utils`: Kumpulan fungsi pembantu (*helper functions*).
- `/supabase/migrations`: Skema tabel, *policies* (RLS), dan *functions* database SQL.

---
*Dibuat dengan ❤️ untuk kemudahan Guru-Guru Hebat se-Indonesia.* 🇮🇩
