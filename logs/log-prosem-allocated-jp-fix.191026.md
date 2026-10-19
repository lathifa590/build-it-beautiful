# Log: Perbaikan Error Simpan Prosem (Check Constraint `prosem_items_allocated_jp_check`)

**Tanggal**: 19 Oktober 2026  
**File**: `logs/log-prosem-allocated-jp-fix.191026.md`  
**Konteks**: Penyelesaian kendala gagal menyimpan Program Semester (Prosem) pada Langkah 4 Workspace Perencanaan Pembelajaran.

---

## 1. Gejala & Bukti Masalah
Saat pengguna menekan tombol **"Simpan & Lanjut"** pada Langkah 4: Program Semester (Prosem) di URL `/app/workspace/[workspace_id]/planning?step=3`, sistem memunculkan popup dialog error:
```text
modulajar.online menyatakan:
Error saving Prosem: new row for relation "prosem_items" violates check constraint "prosem_items_allocated_jp_check"
```
Dan pada konsol DevTools browser muncul:
```text
POST https://jjgfpcedibgkkodydrci.supabase.co/rest/v1/rpc/save_prosem_plan 400 (Bad Request)
```

## 2. Akar Masalah (Root Cause Analysis)
1. **Penyebab Database**:
   - Skema tabel `public.prosem_items` memiliki konstrain:
     `CONSTRAINT prosem_items_allocated_jp_check CHECK (allocated_jp > 0)`
   - Konstrain ini mengharuskan nilai `allocated_jp` bernilai strictly positif ($> 0$).
2. **Penyebab AI Generation (Prota)**:
   - Pada AI generator Program Tahunan (`generate-prota`), ketika seluruh alokasi jam pelajaran (JP) semester sudah habis terdistribusi pada bab-bab utama, topik pengayaan / materi ekstra di akhir semester (misalnya materi pengayaan kebersihan atau lingkungan) diberikan alokasi `alokasi_jp: 0`.
   - Di sisi lain, guru juga dapat menambahkan TP secara manual yang secara *default* berinisialisasi 0 JP.
3. **Penyebab RPC `save_prosem_plan`**:
   - Fungsi RPC `save_prosem_plan` melakukan *insert* nilai `(v_item->>'allocated_jp')::INTEGER` secara mentah tanpa pengaman nilai minimum / default 0 yang valid, sehingga ketika baris bernilai 0 JP dimasukkan ke `prosem_items`, PostgreSQL menolak dan membatalkan seluruh transaksi penyimpanan (*rollback*). Akibatnya Semester 2 gagal tersimpan.

---

## 3. Solusi & Implementasi Komprehensif

### A. Migrasi Database Supabase
Dibuat dan dieksekusi file migrasi `supabase/migrations/20261019220000_allow_zero_jp_in_prosem_items.sql`:
1. Melonggarkan konstrain tabel `public.prosem_items` dari `CHECK (allocated_jp > 0)` menjadi:
   ```sql
   ALTER TABLE public.prosem_items DROP CONSTRAINT IF EXISTS prosem_items_allocated_jp_check;
   ALTER TABLE public.prosem_items ADD CONSTRAINT prosem_items_allocated_jp_check CHECK (allocated_jp >= 0);
   ```
2. Memperbarui RPC `public.save_prosem_plan` agar menggunakan `GREATEST(0, COALESCE((v_item->>'allocated_jp')::INTEGER, 0))` dan `COALESCE(v_item->>'materi_pokok', '')` sehingga payload yang null/0 aman dari runtime error.

### B. Penyempurnaan Frontend (`StepProsem.tsx` & `useProsemGenerator.ts`)
1. **Sanitasi Payload**:
   - `allocated_jp` dipastikan selalu bernilai integer valid $\ge 0$ (`Math.max(0, parseInt(String(item.alokasi_jp ?? 0), 10) || 0)`).
2. **Pencegahan Konsumsi Minggu Kosong**:
   - Pada `useProsemGenerator.ts`, jika sebuah topik bernilai 0 JP (pengayaan non-tatap muka), `weeksNeeded` dihitung `0` sehingga tidak menyita alokasi minggu efektif tatap muka.
3. **Penggantian Dialog Alert Menjadi Toast Modern**:
   - Mengganti blocking `alert(...)` bawaan peramban dengan `toast.error(...)` dan `toast.success(...)` dari `sonner` agar UI lebih elegan dan ramah pengguna.

### C. Penyempurnaan AI Edge Function (`generate-prota`)
1. Memperketat prompt AI: mewajibkan seluruh TP dialokasikan minimal 2 JP dan melarang keras menghasilkan 0 JP.
2. Menambahkan layer sanitasi pasca-generasi agar jika model LLM menghasilkan $\le 0$ JP, sistem otomatis menormalisasikannya ke minimal 2 JP dan menghitung ulang total JP semester.
3. Memperbaiki sintaks kurung kurawal pada Edge Function dan mendeploy ulang versi mutakhir ke Supabase linked via Supabase CLI.

### D. Penyempurnaan Input Prota (`ProtaPreview.tsx`)
- Ketika guru menekan tombol **"+ Tambah TP"**, *default* nilai `alokasi_jp` diisi `2` (bukan 0).
- Input angka disanitasi dengan `Math.max(0, parseInt(...) || 0)`.

---

## 4. Hasil Verifikasi
- Migrasi database langsung diaplikasikan dan diuji coba dengan query linked database (berhasil exit code 0).
- `npx esbuild`: Function `generate-prota` ter-bundle dan ter-deploy sukses.
- `npm run build`: Selesai tanpa error (`built in 19.82s`).
- `npm run test`: 17 file tes / 98 unit test lulus 100%.
