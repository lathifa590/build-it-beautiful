# ModulAjar.Online — Design System
**Style: Neobrutalism**
**Versi: 1.0**

> Dokumen ini adalah satu-satunya referensi visual untuk semua halaman ModulAjar.Online.
> Jangan improvisasi di luar token dan komponen yang sudah didefinisikan di sini.
> Setiap halaman baru WAJIB merujuk ke dokumen ini sebelum menulis satu baris CSS pun.

---

## 🎨 COLOR TOKENS

```css
:root {
  /* Brand */
  --color-primary:      #c04a1a;  /* Oranye utama — tombol, aksen, border aktif */
  --color-primary-bg:   #fff3ed;  /* Background oranye muda — hover, badge bg */

  /* Neobrutalism Base */
  --color-black:        #111111;  /* Hitam utama — border, shadow, teks heading */

  /* Surface */
  --color-surface:      #ffffff;  /* Putih — card, input, tombol secondary */
  --color-surface-alt:  #fafafa;  /* Abu sangat muda — card head, row alt */
  --color-page-bg:      #f5f0e8;  /* Krem hangat — background halaman */

  /* Semantic */
  --color-success:      #15803d;
  --color-success-bg:   #f0fdf4;
  --color-warning:      #b45309;
  --color-warning-bg:   #fffbeb;
  --color-danger:       #991b1b;
  --color-danger-bg:    #fef2f2;
  --color-pro:          #b45309;  /* Sama dengan warning — untuk badge PRO */
  --color-pro-bg:       #fffbeb;

  /* Text */
  --color-text:         #111111;  /* Teks utama */
  --color-text-muted:   #666666;  /* Teks pendukung */
  --color-text-faint:   #bbbbbb;  /* Teks nomor, placeholder */

  /* Border */
  --color-border:       #e5e7eb;  /* Border elemen dalam — row, divider */
  --color-border-bold:  #111111;  /* Border neobrutalism — card, tombol, input */
}
```

---

## 📐 SHADOW TOKENS

```css
:root {
  /* Flat offset shadow — BUKAN drop-shadow biasa */
  --shadow-sm:     2px 2px 0px var(--color-black);
  --shadow-md:     3px 3px 0px var(--color-black);
  --shadow-lg:     4px 4px 0px var(--color-black);
  --shadow-xl:     5px 5px 0px var(--color-black);
  --shadow-accent: 3px 3px 0px var(--color-primary);
}
```

---

## 🔤 TYPOGRAPHY TOKENS

```css
:root {
  --font-base: 'Inter', sans-serif;

  /* Font Weight — TIDAK ADA yang di bawah 500 */
  --fw-regular:  500;   /* Body text default */
  --fw-semibold: 600;   /* Label, meta text */
  --fw-bold:     700;   /* Judul section, tombol */
  --fw-black:    800;   /* Heading, badge, nomor besar */

  /* Font Size */
  --fs-xs:   10px;  /* Badge text, nomor urut */
  --fs-sm:   11px;  /* Meta, hint, durasi */
  --fs-base: 13px;  /* Body default, label input */
  --fs-md:   14px;  /* Input value, tombol */
  --fs-lg:   16px;  /* Sub-heading */
  --fs-xl:   18px;  /* Page title */
  --fs-2xl:  22px;  /* Angka besar stat card */
}

/* Reset global */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-base);
  font-weight: var(--fw-regular);
  color: var(--color-text);
  background: var(--color-page-bg);
}
```

---

## ⚠️ ATURAN GLOBAL — WAJIB DIIKUTI

| Aturan | ✅ Benar | ❌ Salah |
|---|---|---|
| Font weight | Minimum `500` di semua teks UI | `font-weight: 300` atau `400` |
| Border interaktif | `2–2.5px solid #111111` | `1px solid #e5e7eb` |
| Shadow | Flat offset `3px 3px 0 #111` | `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` |
| Background halaman | `#f5f0e8` (krem hangat) | `#f3f4f6` atau `#e5e7eb` |
| Efek dekoratif | Tidak ada gradient, blur, glow | `background: linear-gradient(...)` |
| Badge | Selalu punya border warna sesuai state | Badge flat tanpa border |
| Tombol | Selalu punya border + shadow offset | Tombol polos tanpa border |
| Nomor urut (1,2,3) | Kotak `border-radius: 6px` dengan border | Circle gradient |
| Progress bar | Solid satu warna | Gradient merah ke hijau |
| Header semester | Solid hitam atau oranye | Gradient ungu/biru |
| Warna | Hanya dari token di atas | Hex random yang tidak terdaftar |

---

## 🧱 COMPONENT LIBRARY

---

### A. CARD (Container Utama)

Digunakan untuk: card topik, card workspace, container section.

```css
.card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.card:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-xl);
}

/* Header dalam card — background sedikit berbeda */
.card-head {
  padding: 13px 16px;
  background: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border-bold);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

/* Body dalam card */
.card-body {
  padding: 12px 16px;
}
```

---

### B. BADGE

Selalu punya border. Gunakan class variant sesuai makna.

```css
/* Base */
.badge {
  display: inline-block;
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-radius: 4px;
  padding: 2px 7px;
  border: 2px solid;
}

/* Variant */
.badge-brand   { color: var(--color-primary);  background: var(--color-primary-bg); border-color: var(--color-primary); }
.badge-success { color: var(--color-success);  background: var(--color-success-bg); border-color: var(--color-success); }
.badge-warning { color: var(--color-warning);  background: var(--color-warning-bg); border-color: var(--color-warning); }
.badge-danger  { color: var(--color-danger);   background: var(--color-danger-bg);  border-color: var(--color-danger);  }
.badge-neutral { color: var(--color-black);    background: var(--color-surface);    border-color: var(--color-black);   }
.badge-pro     { color: var(--color-pro);      background: var(--color-pro-bg);     border-color: var(--color-pro);     }

/* Badge status terjadwal — gunakan prefix teks: ✓ ok | ⚠ warn | ✕ err */
.badge-status-ok   { font-size: var(--fs-sm); font-weight: var(--fw-black); color: var(--color-success); background: var(--color-success-bg); border: 2px solid var(--color-success); border-radius: 6px; padding: 3px 9px; white-space: nowrap; }
.badge-status-warn { font-size: var(--fs-sm); font-weight: var(--fw-black); color: var(--color-warning); background: var(--color-warning-bg); border: 2px solid var(--color-warning); border-radius: 6px; padding: 3px 9px; white-space: nowrap; }
.badge-status-err  { font-size: var(--fs-sm); font-weight: var(--fw-black); color: var(--color-danger);  background: var(--color-danger-bg);  border: 2px solid var(--color-danger);  border-radius: 6px; padding: 3px 9px; white-space: nowrap; }
```

---

### C. BUTTON

Semua tombol wajib punya `border` dan `box-shadow` offset.

```css
/* Base — semua tombol extend ini */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-base);
  font-weight: var(--fw-bold);
  font-size: var(--fs-base);
  border-radius: 7px;
  padding: 8px 18px;
  cursor: pointer;
  border: 2.5px solid var(--color-border-bold);
  transition: all 0.1s ease;
  text-decoration: none;
}

.btn:hover  { transform: translate(-1px, -1px); }
.btn:active { transform: translate(1px, 1px); }

/* Primary — aksi utama halaman (Simpan, Selesai) */
.btn-primary {
  color: #ffffff;
  background: var(--color-black);
  box-shadow: var(--shadow-accent);  /* shadow oranye */
}
.btn-primary:hover { background: var(--color-primary); box-shadow: var(--shadow-md); }

/* Secondary — aksi biasa (Kembali, Batal, Auto Suggest) */
.btn-secondary {
  color: var(--color-black);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}
.btn-secondary:hover { box-shadow: var(--shadow-lg); }

/* Ghost — aksi tambah inline (+ Tambah Pertemuan) */
.btn-ghost {
  color: #ffffff;
  background: var(--color-primary);
  border-color: var(--color-black);
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  padding: 7px 14px;
  box-shadow: var(--shadow-md);
}
.btn-ghost:hover { box-shadow: var(--shadow-lg); }

/* Danger — hapus, aksi destruktif */
.btn-danger-outline {
  color: var(--color-danger);
  background: var(--color-surface);
  border-color: var(--color-danger);
  box-shadow: 2px 2px 0px var(--color-danger);
}
```

---

### D. INPUT FIELD

Semua elemen form harus konsisten.

```css
/* Label */
label {
  display: block;
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  color: var(--color-text);
  margin-bottom: 5px;
}

/* Input, select, textarea */
input[type="text"],
input[type="number"],
input[type="date"],
input[type="email"],
select,
textarea {
  height: 44px;
  padding: 0 12px;
  font-size: var(--fs-md);
  font-weight: var(--fw-regular);
  color: var(--color-text);
  background: var(--color-surface);
  border: 2px solid var(--color-border-bold);
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
  width: 100%;
  transition: box-shadow 0.1s ease, border-color 0.1s ease;
  font-family: var(--font-base);
}

textarea { height: auto; padding: 10px 12px; }

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 2px 2px 0px var(--color-primary);
}

/* Field group */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}
```

---

### E. TABLE ROW (Row pertemuan, row data)

```css
.table-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 2px solid var(--color-border);
  border-radius: 7px;
  margin-bottom: 7px;
  background: var(--color-surface-alt);
  cursor: pointer;
  transition: all 0.12s ease;
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  color: var(--color-text);
}

.table-row:hover {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

/* Nomor urut (#1, #2, dst) */
.row-number {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  color: var(--color-text-faint);
  min-width: 24px;
}

/* Badge durasi (90 menit) */
.row-duration {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-surface);
  border: 2px solid var(--color-black);
  border-radius: 5px;
  padding: 3px 9px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
```

---

### F. TAB

```css
.tabs {
  display: flex;
  border-bottom: 2.5px solid var(--color-border-bold);
  margin-bottom: 22px;
}

.tab {
  padding: 9px 22px;
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: #999;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2.5px;
  transition: all 0.12s ease;
}

.tab.active {
  font-weight: var(--fw-black);
  color: var(--color-text);
  border-bottom-color: var(--color-primary);
}

.tab:hover:not(.active) {
  color: #555;
  border-bottom-color: var(--color-border);
}
```

---

### G. STEP BAR (Wizard Navigation)

```css
.step-bar {
  background: var(--color-surface);
  border-bottom: 2.5px solid var(--color-border-bold);
  display: flex;
  align-items: stretch;
  padding: 0 20px;
}

.step-item {
  padding: 10px 18px;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 3px solid transparent;
}

/* State: selesai */
.step-item.done { color: var(--color-success); }
.step-item.done .step-num {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #ffffff;
  /* Tampilkan ikon centang, bukan angka */
}

/* State: aktif sekarang */
.step-item.active {
  color: var(--color-text);
  border-bottom-color: var(--color-primary);
}
.step-item.active .step-num {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
}

/* State: belum dikerjakan */
.step-item.pending { color: #bbb; }

/* Lingkaran/kotak nomor step */
.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--fw-black);
  flex-shrink: 0;
}
```

---

### H. SIDEBAR

Digunakan di halaman dengan navigasi sub-menu kiri.

```css
/* Layout parent wajib pakai ini */
.layout-with-sidebar {
  display: flex;
  align-items: flex-start;
  min-height: calc(100vh - 60px);
}

/* Sidebar sticky — scroll mandiri */
.sidebar {
  width: 220px;
  background: var(--color-surface);
  border-right: 2.5px solid var(--color-border-bold);
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);  /* sesuaikan angka dengan tinggi topbar */
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-item {
  padding: 10px 18px;
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  color: #2d2d2d;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.12s ease;
}

.sidebar-item:hover {
  background: var(--color-primary-bg);
  border-left-color: var(--color-primary);
  color: var(--color-text);
}

.sidebar-item.active {
  background: var(--color-primary-bg);
  border-left-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--fw-black);
}

.sidebar-divider {
  height: 1px;
  background: var(--color-border);
  margin: 8px 16px;
}

/* Area konten kanan */
.layout-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}
```

---

### I. FOOTER AKSI (bawah halaman)

```css
.page-footer {
  background: var(--color-surface);
  border-top: 2.5px solid var(--color-border-bold);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Teks instruksi */
.footer-hint {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
  font-style: italic;
}
```

---

### J. SECTION HEADING

```css
.section-heading {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text);
  padding-bottom: 8px;
  border-bottom: 2.5px solid var(--color-border-bold);
  margin-bottom: 20px;
}
```

---

## 🗂️ HALAMAN KHUSUS

---

### HALAMAN: WORKSPACE / DASHBOARD TOPIK

#### ❌ DILARANG di halaman ini:
- `background: linear-gradient(...)` pada header semester
- Circle gradient untuk nomor topik
- Progress bar multi-warna

#### K. SEMESTER HEADER

```css
/* Solid — BUKAN gradient */
.semester-header {
  background: var(--color-black);       /* Semester 1 = hitam */
  border: 2.5px solid var(--color-black);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  margin-bottom: 16px;
}

.semester-header.sem-2 {
  background: var(--color-primary);     /* Semester 2 = oranye */
}

.semester-header h2 {
  font-size: var(--fs-xl);
  font-weight: var(--fw-black);
  color: #ffffff;
}

.semester-header .meta {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: rgba(255,255,255,0.75);
  margin-top: 4px;
}

/* Badge progress di kanan header */
.semester-progress-badge {
  font-size: var(--fs-md);
  font-weight: var(--fw-black);
  color: var(--color-black);
  background: #ffffff;
  border: 2.5px solid var(--color-black);
  border-radius: 7px;
  padding: 6px 14px;
  box-shadow: var(--shadow-sm);
}
```

#### L. STAT CARDS (Total Topik, Total JP, Progress)

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-black);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: var(--fs-2xl);
  font-weight: var(--fw-black);
  color: var(--color-text);
  line-height: 1.2;
}
```

#### M. TOPIK ROW CARD

```css
.topik-row {
  background: var(--color-surface);
  border: 2.5px solid var(--color-black);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.topik-row:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

/* Nomor topik — KOTAK, bukan circle gradient */
.topik-number {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--color-primary-bg);
  border: 2px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-base);
  font-weight: var(--fw-black);
  color: var(--color-primary);
  flex-shrink: 0;
}

.topik-title {
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: var(--color-text);
  line-height: 1.5;
  margin-bottom: 6px;
}

.topik-meta {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
}
```

#### N. PROGRESS BAR — FLAT, SOLID

```css
/* DILARANG gradient */
.progress-wrap {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
  border: 1.5px solid var(--color-black);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);   /* Solid oranye — satu warna */
  border-radius: 0;
  transition: width 0.3s ease;
}

.progress-fill.done {
  background: var(--color-success);   /* Solid hijau jika selesai */
}
```

#### O. WORKSPACE INFO CARD (header nama mapel)

```css
.workspace-card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-black);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  padding: 20px 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.workspace-title {
  font-size: var(--fs-2xl);
  font-weight: var(--fw-black);
  color: var(--color-text);
}

.workspace-meta {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
  margin-top: 4px;
}
```

---

### HALAMAN: PLANNING — CP & TP, KALENDER, TOPIK, TUJUAN

Halaman dengan sidebar kiri + konten kanan.
Gunakan komponen: `.layout-with-sidebar`, `.sidebar`, `.card`, `.badge`, `.btn`, `.field-group`, `.tabs`, `.step-bar`, `.page-footer`.

---

### HALAMAN: SUSUN JADWAL PERTEMUAN (`/planning?step=3`)

Layout full width — tanpa sidebar.
Gunakan komponen: `.card`, `.card-head`, `.card-body`, `.badge-brand` (untuk badge Topik), `.badge-status-*` (untuk Terjadwal), `.table-row`, `.row-duration`, `.btn-ghost` (untuk + Tambah), `.btn-secondary` (untuk Auto Suggest), `.tabs`, `.step-bar`, `.page-footer`.

---

### HALAMAN: ADMIN PANEL

Sidebar kiri hitam solid. Konten area putih. Stat cards sudah menggunakan neobrutalism — pertahankan.
Gunakan komponen: `.stat-card`, `.card`, `.badge`, `.btn`.

---

## 📋 CHECKLIST SEBELUM DEPLOY HALAMAN BARU

Sebelum halaman dianggap selesai, pastikan semua item ini terpenuhi:

- [ ] Semua warna berasal dari CSS token (`--color-*`) — tidak ada hex raw baru
- [ ] Tidak ada `font-weight` di bawah `500`
- [ ] Semua elemen interaktif (tombol, input, card) punya `border: 2–2.5px solid #111`
- [ ] Semua tombol punya `box-shadow` flat offset dan efek hover `translate(-1px,-1px)`
- [ ] Tidak ada `linear-gradient` atau `radial-gradient` pada background elemen UI
- [ ] Tidak ada `box-shadow: 0 Xpx Ypx rgba(...)` — hanya flat offset shadow
- [ ] Badge selalu punya `border` berwarna sesuai state
- [ ] Nomor urut (1,2,3) menggunakan kotak `border-radius: 6px`, bukan circle gradient
- [ ] Progress bar satu warna solid (oranye atau hijau)
- [ ] Header semester solid hitam/oranye, bukan gradient ungu/biru
- [ ] Sidebar menggunakan `position: sticky` dan `overflow-y: auto` (scroll mandiri)
- [ ] Background halaman `#f5f0e8` (krem hangat)

---

## 🤖 SYSTEM PROMPT UNTUK AI DEVELOPER (Antigravity, Copilot, dsb)

Salin teks di bawah ini sebagai custom instruction / system prompt:

```
Kamu adalah AI developer untuk project ModulAjar.Online.

WAJIB sebelum membuat atau mengedit halaman UI apapun:
Rujuk file DESIGN_SYSTEM.md di root project sebagai satu-satunya referensi visual.

ATURAN CODING:
1. Gunakan CSS custom property dari token yang sudah ada (--color-primary, --shadow-md, dst)
   JANGAN hardcode hex baru atau nilai yang tidak ada di token
2. Gunakan class komponen yang sudah ada (.card, .btn, .badge, .table-row, dst)
   JANGAN buat class baru untuk hal yang sudah ada di library
3. Font-weight minimum 500 — tidak ada pengecualian
4. Semua elemen interaktif wajib punya border 2–2.5px solid #111111
5. Shadow hanya flat offset (3px 3px 0 #111) — tidak ada drop-shadow blur
6. Tidak ada gradient apapun pada background elemen UI

DILARANG KERAS:
- font-weight: 300 atau 400
- background: linear-gradient(...) pada card/header/badge
- box-shadow: 0 4px 12px rgba(...) — pakai flat offset saja
- Badge atau tombol tanpa border
- Nomor topik/urut dengan circle gradient
- Progress bar multi-warna
- Header semester dengan gradient ungu/biru
- Warna hex yang tidak terdaftar di DESIGN_SYSTEM.md

STYLE: Neobrutalism — bold border, flat shadow offset, high contrast, zero gradients.
Referensi visual utama: Admin Panel yang sudah ada (bukan halaman planning lama).
```
