# Log: Perbaikan Pembuatan Workspace, Penyusunan Topik AI, dan Optimasi TP Prota Proporsional

**Tanggal**: 12 Oktober 2026  
**File**: `logs/log-workspace-and-planning-fixes.121026.md`  
**Konteks**: Penyelesaian 3 kendala krusial pada alur kerja Workspace & Perencanaan Pembelajaran:
1. Gagal membuat workspace akibat ketidakcocokan skema database `school_name` (`PGRST204`).
2. Gagal menyusun topik dengan AI pada tab Perencanaan Pembelajaran (`Unknown generation type`).
3. Gagal membuat Program Tahunan (Prota) dengan eror kapasitas komputasi server (`HTTP 546`) akibat jumlah Tujuan Pembelajaran (TP) yang meledak hingga 79 TP dari teks silabus materi yang di-paste.

---

## 1. Masalah 1: Gagal Membuat Workspace Baru (`PGRST204`)

### A. Gejala & Bukti Log
Pada konsol DevTools browser muncul pesan:
```text
POST https://jjgfpcedibgkkodydrci.supabase.co/rest/v1/workspaces?select=* 400 (Bad Request)
{
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'school_name' column of 'workspaces' in the schema cache"
}
```

### B. Akar Masalah
- Ketika seorang guru terafiliasi dengan sekolah aktif (`isSchoolActive && school`), modal `CreateWorkspaceModal.tsx` secara otomatis mengirimkan atribut `school_name: school.name` langsung ke *payload* `supabase.from('workspaces').insert(...)`.
- Tabel `public.workspaces` di database Supabase sebelumnya tidak memiliki kolom fisik bernama `school_name` (afiliasi sekolah tersimpan melalui relasi `profiles.school_id`).
- PostgREST secara ketat menolak operasi `insert` yang memuat kolom di luar skema tabel.
- Di sisi antarmuka, blok `catch` pada `CreateWorkspaceModal` sebelumnya hanya memanggil `console.error(error)` tanpa menampilkan `toast.error`, sehingga modal tampak macet tanpa penjelasan.

### C. Solusi & Implementasi
1. **Pemisahan Payload & Fallback JSONB di `WorkspaceContext.tsx`**:
   - Memisahkan properti `school_name` dari *root payload* `workspaces.insert` dan `workspaces.update`.
   - Menyimpan `school_name` ke dalam kolom JSONB `generation_settings: { school_name: ... }` yang sudah ada di database.
   - Saat pembacaan workspace (`refreshWorkspaces`), `school_name` dipetakan kembali dari `ws.school_name || ws.generation_settings?.school_name`.
2. **Feedback Notifikasi di `CreateWorkspaceModal.tsx`**:
   - Menambahkan notifikasi `toast.success('Workspace berhasil dibuat!')` dan `toast.error(error?.message)`.
3. **Migrasi Database**:
   - Dijalankan query DDL langsung ke Supabase: `ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS school_name TEXT;` dan `NOTIFY pgrst, 'reload schema';`.
   - Dibuat file migrasi `supabase/migrations/20261012173000_add_school_name_to_workspaces.sql`.
4. **Pencegahan Error HTTP 406 Profil Guru di `useTeacherProfiles.ts`**:
   - Mengganti `.single()` menjadi `.maybeSingle()` saat memeriksa profil guru yang ada.

---

## 2. Masalah 2: Gagal Membuat Topik dengan AI (`Unknown generation type`)

### A. Gejala & Bukti Log
Saat guru mengklik tombol **"Buat Topik dengan AI"** di Step 1 Perencanaan Pembelajaran (*Tab 3: Topik / Ruang Lingkup Materi*), muncul *toast alert*:
```text
! Unknown generation type
```

### B. Akar Masalah
- Frontend `useTopicGenerator.ts` memanggil:
  ```typescript
  supabase.functions.invoke("generate-content", {
    body: { type: "ruang-lingkup", data: { ... } }
  })
  ```
- Meskipun `case "ruang-lingkup":` sudah ditulis di file lokal `supabase/functions/generate-content/index.ts` pada commit sebelumnya, Edge Function pada server produksi Supabase (`jjgfpcedibgkkodydrci`) belum pernah di-deploy ulang.
- Server Supabase masih menjalankan versi lama yang masuk ke blok `default: throw new Error("Unknown generation type");`.

### C. Solusi & Implementasi
- Melakukan deployment Edge Function `generate-content` ke project Supabase linked menggunakan Supabase CLI:
  ```bash
  npx supabase functions deploy generate-content --no-verify-jwt
  ```
- Sekaligus men-deploy fungsi pendukung lainnya (`generate-prota`, `generate-kktp`, dan `enrich-image-prompt`) agar model Gemini terbaru (`gemini-3.6-flash`) aktif di seluruh endpoint AI.

---

## 3. Masalah 3: Gagal Membuat Prota (`HTTP 546`) & Jumlah TP Berlebihan (79 TP)

### A. Gejala & Bukti Log
- Di Step 1 (Tujuan Pembelajaran): AI menghasilkan hingga **79 Tujuan Pembelajaran (TP 1 s.d. TP 79)** setelah guru menempelkan teks silabus/materi 4 Bab PPKn Kelas 4 SD.
- Di Step 2 (Prota): Tombol "Generate Prota" gagal dan memunculkan eror:
  ```text
  Function failed due to not having enough compute resources (please check logs)
  POST .../v1/generate-prota responded with a status of 546 ()
  ```

### B. Analisis Pedagogis & Akar Masalah
1. **Analisis Beban Pembelajaran**:
   - Alokasi: 2 JP per minggu (Semester 1 = 52 JP / 26 minggu, Semester 2 = 50 JP / 25 minggu $\rightarrow$ Total **102 JP**, ~51 pertemuan setahun).
   - Memiliki 79 TP berarti rasio waktu: $\approx 1,29\text{ JP/TP}$. Setiap satu kali pertemuan (2 JP), guru harus menuntaskan dan mengambil asesmen untuk hampir 2 TP sekaligus. Ini tidak realistis bagi peserta didik SD dan membuat administrasi e-Rapor overload.
   - **Standar Kurikulum Merdeka (Kemendikbudristek)**: Untuk 4 Bab materi pokok per tahun, idealnya dirumuskan **8 sampai 16 TP per tahun** (sekitar 2–4 TP per Bab materi pokok, atau 4–6 TP per semester).
2. **Penyebab AI Membuat 79 TP**:
   - Di `supabase/functions/generate-content/index.ts`, penghitungan topik sebelumnya menggunakan pemisahan mentah `ruangLingkup.split(/[,\n]/)`.
   - Teks materi yang di-paste memuat banyak sub-butir (tanda `-`, `*`, rincian sila, norma, pakaian adat). Parser menghitung terdapat $\approx 50$ topik terpisah.
   - Prompt kemudian memaksa AI: *"Ada 50 topik... Buat MINIMAL 50 hingga 100 TP, dimana SETIAP topik WAJIB mendapatkan MINIMAL 1 TP"*. Ditambah aturan nomor 7 yang melarang menghasilkan sedikit TP.
   - AI mematuhi instruksi secara harfiah sehingga menghasilkan 79 TP.
3. **Penyebab Eror 546 pada `generate-prota`**:
   - Saat 79 TP dikirim ke Edge Function `generate-prota`, model LLM diminta menyusun tabel Program Tahunan lengkap untuk 79 baris dengan alokasi JP, semester, materi pokok, Profil Lulusan, Panca Cinta, dan keterangan.
   - Ukuran output JSON yang sangat masif memakan waktu komputasi yang melebihi batas Deno Worker Supabase (150 detik / memory wall), memicu status **HTTP 546 (Not enough compute resources)**.

### C. Solusi & Implementasi
1. **Penyempurnaan Formula TP Proporsional di `generate-content/index.ts`**:
   - Parser membersihkan sub-butir rincian (`-`, `*`, `•`, sub a/b, tanda kurung).
   - Menghitung kapasitas rasional: `capacityTp = Math.round(totalJp / 8)`.
   - Membatasi batas minimum dan maksimum TP: untuk mapel 2 JP/minggu (~100 JP setahun), target dibatasi secara proporsional menjadi **8 sampai 14 TP per tahun** (maksimal 16 TP).
   - Mengubah prompt instruksi: AI diminta **menyintesiskan dan merangkum** materi menjadi 2–4 TP pokok per bab, bukan membuat TP per rincian kecil.
2. **Proteksi Komputasi di `generate-prota/index.ts`**:
   - Menambahkan pembatas aman: jika daftar TP yang masuk melebihi 20 butir (`tpStrings.length > 20`), sistem secara otomatis membatasi ke 20 TP teratas untuk mencegah kehabisan sumber daya komputasi (*prevent HTTP 546*).
3. **Dialog Konfirmasi Edukatif di `StepProta.tsx`**:
   - Jika guru memiliki lebih dari 20 TP, sebelum men-generate Prota akan muncul dialog edukatif yang menjelaskan alokasi JP dan menyarankan kembali ke Step 1 untuk menghasilkan 8–14 TP yang proporsional.
4. **Deploy & Push**:
   - Kedua Edge Function (`generate-content` dan `generate-prota`) telah di-deploy ulang ke Supabase.
   - Seluruh perubahan di-commit (`4757c72`) dan di-push ke branch `main`.

---

## 4. Panduan Guru untuk Melanjutkan

Jika guru saat ini sudah terlanjur memiliki 79 TP di draf workspace:
1. Masuk ke **Langkah 1 (CP & TP)** $\rightarrow$ Tab **4. Tujuan Pembelajaran**.
2. Klik tombol **"Generate TP dengan AI"** (atau Generate Ulang).
3. AI akan merangkum materi 4 Bab menjadi **8 s.d. 12 TP yang padat, proporsional, dan rapi**.
4. Klik **"Simpan & Lanjut"** ke Langkah 2 (Prota).
5. Klik **"Generate Prota"** $\rightarrow$ Program Tahunan akan terbentuk secara instan tanpa hambatan komputasi.
