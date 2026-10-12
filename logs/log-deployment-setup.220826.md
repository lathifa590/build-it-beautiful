# Log Deployment Setup — ModulAjar.Online

**Tanggal dicatat:** 22 Agustus 2026  
**Diperbarui:** 23 Agustus 2026  
**Dibuat oleh:** Antigravity IDE

---

## ⚠️ Pelajaran Penting

Di Cloudflare, ada **DUA project berbeda** dengan nama mirip yang sering membingungkan:

| Project | Jenis | Status | Keterangan |
|---|---|---|---|
| **`modul-ajar`** | **Pages** ✅ | Aktif & auto-deploy | **INI yang dipakai produksi** |
| `modulajar` | Workers ❌ | Latest build failed | Project lama, tidak dipakai |

> **SELALU pastikan deploy ke project `modul-ajar` (Pages), bukan `modulajar` (Workers).**

---

## 🚀 Cara Deploy yang Benar

### Metode Utama: Auto-deploy via GitHub (RECOMMENDED)

Cukup **push ke branch `main`** — Cloudflare Pages akan otomatis build dan deploy.

```powershell
# PENTING: Di PowerShell, gunakan ; bukan && untuk berantai command

# 1. Stage hanya file yang relevan (JANGAN git add -A sembarangan!)
git add src/components/... src/pages/... src/hooks/...

# 2. Commit
git commit -m "feat/fix: deskripsi perubahan"

# 3. Push → trigger auto-deploy
git push
```

Cloudflare Pages akan:
1. Mendeteksi push ke `main`
2. Clone repo dari `lathifa590/build-it-beautiful`
3. Jalankan `bun run build` (atau `npm run build` jika `bun.lockb` tidak ada)
4. Deploy ke `modul-ajar.pages.dev` + domain custom `modulajar.online`

### Verifikasi Deploy Berhasil

Buka Cloudflare Dashboard → **Workers & Pages** → klik project **`modul-ajar`**  
→ Lihat tab **Deployments** → commit terbaru harus muncul dengan status ✅

**URL Dashboard:**  
`https://dash.cloudflare.com/fbc0dfbd18538badd642a9e479a1dfeb/workers-and-pages`

---

## 📋 Konfigurasi Project

| Parameter | Nilai |
|---|---|
| **Cloudflare Account** | `Jazialathif@gmail.com` |
| **Account ID** | `fbc0dfbd18538badd642a9e479a1dfeb` |
| **Pages Project Name** | `modul-ajar` |
| **GitHub Repo** | `lathifa590/build-it-beautiful` |
| **Branch** | `main` |
| **Build Command** | `npm run build` (via `vite build`) |
| **Output Directory** | `dist` |
| **Domain Produksi** | `modulajar.online` |
| **Domain Pages** | `modul-ajar-97e.pages.dev` |

---

## ❌ Jangan Lakukan Ini

- ❌ Jangan jalankan `npx wrangler pages deploy` manual dari lokal — project name-nya berbeda (`modulajar` vs `modul-ajar`)
- ❌ Jangan deploy ke project `modulajar` (Workers) — itu project lama yang tidak aktif
- ❌ Jangan perlu `npm run build` lokal untuk deploy — Cloudflare yang build di CI-nya
- ❌ Jangan gunakan `git add -A` atau `git add .` sembarangan — bisa ikut file besar (`.bin/`, `supabase/.temp/`)
- ❌ Jangan commit file binary besar (`.exe`, `.zip`) — GitHub menolak file > 100MB
- ❌ Jangan commit `bun.lockb` hasil generate lokal yang tidak sinkron — bisa gagal `bun install --frozen-lockfile` di Cloudflare

---

## 🐛 Masalah Build yang Pernah Terjadi & Solusinya

### 1. `ENOENT: no such file or directory` saat build
**Penyebab:** Ada file baru di `src/` yang diimport oleh `Index.tsx` tapi belum di-commit ke GitHub.  
**Solusi:** Pastikan semua file baru di `src/` ikut di-stage sebelum commit.
```powershell
git add src/
```

### 2. `lockfile had changes, but lockfile is frozen`
**Penyebab:** `bun.lockb` tidak sinkron dengan `package.json`. Cloudflare pakai bun otomatis jika `bun.lockb` ada.  
**Solusi:** Hapus `bun.lockb` dari repo. Cloudflare akan fallback ke `npm` + `package-lock.json`.
```powershell
Remove-Item bun.lockb
git add -A
git commit -m "fix: remove bun.lockb"
git push
```

### 3. `@import must precede all other statements` (CSS error)
**Penyebab:** Baris `@import` Google Font berada di bawah baris `@tailwind` di `index.css`.  
**Solusi:** Pindahkan `@import` ke paling atas file `index.css`, sebelum semua baris `@tailwind`.

### 4. File besar ditolak GitHub (`GH001: Large files detected`)
**Penyebab:** File binary (misalnya `.bin/supabase.exe` 121MB) ikut ter-commit.  
**Solusi:**
```powershell
# Reset commit terakhir
git reset HEAD~1

# Tambahkan ke .gitignore
# .bin/
# supabase/.temp/

# Commit ulang tanpa file besar
git add .gitignore [file-yang-perlu-saja]
git commit -m "fix: exclude large binaries"
git push
```

---

## ⚙️ Deploy Supabase Edge Functions

Edge Functions di-deploy **terpisah** dari frontend (tidak lewat Cloudflare):

```powershell
# Deploy satu function
supabase functions deploy generate-content --project-ref eoznczpsfntwrmmzhvjq

# Deploy semua functions
supabase functions deploy --project-ref eoznczpsfntwrmmzhvjq
```

**Project Ref Supabase:** `eoznczpsfntwrmmzhvjq`

---

## 📝 Riwayat Deployment

| Tanggal | Commit | Fitur | Status |
|---|---|---|---|
| 23 Aug 2026 | `f9cd55f` | Fix: Kelas dropdown di profil sesuai fase | ✅ |
| 23 Aug 2026 | `93eea9b` | Fix: Remove bun.lockb, update .gitignore, naik limit trial ke 100 | ✅ |
| 23 Aug 2026 | `871d1a9` | Fix: Include missing workspace components | ✅ (build ok, lock error) |
| 23 Aug 2026 | `8f130c3` | Fix: Move CSS @import ke atas untuk fix build | ✅ (lock error) |
| 23 Aug 2026 | `7fee353` | feat/fix: Auto-fill fase di profil & tombol Bersihkan Form | ✅ |
| 22 Aug 2026 | `d4b0111` | TrialCTADialog WA purchase link prefill | ✅ |
| ~21 Aug 2026 | `9129a79` | Workspace lock and prota prosem bugfixes | ✅ |
| ~21 Aug 2026 | `d83da2d` | Fix Cloudflare build: Tambahkan wrangler.toml | ✅ |
| ~21 Aug 2026 | `ddadb33` | Update UI V2: Loading tab & perbaikan eksport Word | ✅ |
