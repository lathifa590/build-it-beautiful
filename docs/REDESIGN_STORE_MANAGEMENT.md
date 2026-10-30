# REDESIGN SPEC — Toko Saya (Store Management)
**Untuk: Antigravity / AI Developer**
**Rujuk: DESIGN_SYSTEM.md sebelum menyentuh satu baris CSS pun**
**Status: Ready to implement**

---

## 0. KONTEKS & PRINSIP UTAMA

Halaman Store Management adalah dashboard seller untuk platform ModulAjar.Online.
Target user: Guru yang menjual modul ajar — bukan developer, bukan power user.
Tone: Profesional tapi hangat. Bold, mudah dibaca, zero clutter.

**Yang berubah di redesain ini:**
- Katalog: grid lebih lega, card lebih informatif, filter bar baru
- Dashboard: stat cards lebih dramatis, layout lebih padat
- Sidebar: responsive collapse di mobile
- Halaman publik toko: card katalog 3-col desktop, 2-col tablet, 1-col mobile

**Yang TIDAK berubah:**
- Semua color token dari DESIGN_SYSTEM.md
- Semua shadow token (flat offset only)
- Semua component class yang sudah ada (.card, .btn, .badge, dst)
- Background halaman `#f5f0e8`

---

## 1. LAYOUT SHELL — SIDEBAR + MAIN

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│ [Sidebar 200px fixed]  │  [Main content area]        │
│                        │  max-width: none            │
│  🏪 Toko Saya          │  padding: 32px 40px         │
│                        │                             │
│  ○ Beranda             │  <page content here>        │
│  ○ Profil & Identitas  │                             │
│  ○ Katalog Modul Ajar  │                             │
│  ○ Pesanan Masuk       │                             │
│  ○ Kupon Diskon        │                             │
│                        │                             │
│  ─────────────────     │                             │
│  [← Kembali ke         │                             │
│     Beranda]           │                             │
└─────────────────────────────────────────────────────┘
```

### Tablet (768px–1023px)

```
┌─────────────────────────────────────────────────────┐
│ [☰ Toko Saya]          topbar sticky 52px            │
├─────────────────────────────────────────────────────┤
│  [Main content area]                                 │
│  padding: 24px 20px                                  │
└─────────────────────────────────────────────────────┘
Sidebar muncul sebagai drawer overlay dari kiri saat ☰ diklik.
```

### Mobile (<768px)

```
┌──────────────────────────┐
│ [☰]  Toko Saya           │  ← topbar 48px
├──────────────────────────┤
│  [Main content]          │
│  padding: 16px           │
└──────────────────────────┘
Sidebar = drawer fullscreen dari kiri.
```

### CSS Sidebar

```css
/* Sidebar */
.store-sidebar {
  width: 200px;
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 2.5px solid var(--color-border-bold);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.store-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 20px;
  font-size: var(--fs-lg);
  font-weight: var(--fw-black);
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 12px;
}

/* Nav item */
.store-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: 0;
  transition: all 0.1s;
  margin: 0 8px;
  border-radius: 7px;
}

.store-nav-item:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

/* Active state */
.store-nav-item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: var(--fw-bold);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-accent);
}

/* Back button */
.store-back-btn {
  margin: auto 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  border: 2px solid var(--color-border-bold);
  border-radius: 7px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  background: var(--color-surface);
  text-decoration: none;
  color: var(--color-text);
}

.store-back-btn:hover {
  box-shadow: var(--shadow-md);
  transform: translate(-1px, -1px);
}

/* Topbar mobile */
.store-topbar {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 52px;
  background: var(--color-surface);
  border-bottom: 2.5px solid var(--color-border-bold);
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 1023px) {
  .store-sidebar { display: none; }
  .store-topbar  { display: flex; }
}

/* Drawer */
.store-drawer {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}
.store-drawer.open { pointer-events: all; }

.store-drawer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.2s;
}
.store-drawer.open .store-drawer__overlay { opacity: 1; }

.store-drawer__panel {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 240px;
  background: var(--color-surface);
  border-right: 2.5px solid var(--color-border-bold);
  transform: translateX(-100%);
  transition: transform 0.2s ease;
}
.store-drawer.open .store-drawer__panel { transform: translateX(0); }
```

---

## 2. HALAMAN: BERANDA / DASHBOARD

### Layout Desktop

```
┌────────────────────────────────────────────────────────┐
│  Dashboard Toko                    [+ Buat Modul Baru] │
│  Pantau performa toko dan penjualan Anda.              │
├───────────┬───────────┬───────────┬────────────────────┤
│ KUNJUNGAN │  DILIHAT  │ PENJUALAN │ TOTAL PENDAPATAN   │
│     0     │    0      │    0      │      Rp0           │
│ +0% minggu│ +0% minggu│ Belum ada │  Belum ada         │
├──────────────────────────────────┬─────────────────────┤
│  GRAFIK KUNJUNGAN (7 Hari)       │  MODUL TERPOPULER   │
│                                  │                     │
│  [recharts line chart]           │  [list modul]       │
│                                  │                     │
└──────────────────────────────────┴─────────────────────┘
```

### Stat Cards — Redesain

Perubahan kunci: angka lebih besar, border lebih tebal, icon lebih prominent.

```css
.stat-grid-store {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .stat-grid-store { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stat-grid-store { grid-template-columns: 1fr; }
}

.stat-card-store {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.12s ease;
}

.stat-card-store:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-lg);
}

/* Icon di kanan — kotak bukan lingkaran blur */
.stat-card-store__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-card-store__icon {
  width: 36px;
  height: 36px;
  border: 2px solid var(--color-border-bold);
  border-radius: 7px;
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-store__label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.stat-card-store__value {
  font-size: var(--fs-2xl);   /* 22px */
  font-weight: var(--fw-black);
  color: var(--color-text);
  line-height: 1.1;
}

/* Khusus pendapatan — warna oranye */
.stat-card-store--income .stat-card-store__value {
  color: var(--color-primary);
}

.stat-card-store__delta {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-success);      /* hijau jika positif */
}

.stat-card-store__delta.negative {
  color: var(--color-danger);
}

.stat-card-store__sub {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
}
```

### Chart & Modul Terpopuler

```css
.dashboard-bottom {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
}

@media (max-width: 900px) {
  .dashboard-bottom { grid-template-columns: 1fr; }
}

/* Chart wrapper — harus punya border neobrutalism */
.chart-card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.chart-card__head {
  padding: 14px 18px;
  background: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border-bold);
  font-size: var(--fs-base);
  font-weight: var(--fw-black);
}

.chart-card__body {
  padding: 16px 18px;
}

/* Modul terpopuler item */
.popular-modul-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1.5px solid var(--color-border);
}

.popular-modul-item:last-child {
  border-bottom: none;
}

.popular-modul-item__rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--color-primary-bg);
  border: 2px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  color: var(--color-primary);
  flex-shrink: 0;
}

.popular-modul-item__title {
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: var(--color-text);
  flex: 1;
  line-height: 1.3;
}

.popular-modul-item__views {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  color: var(--color-text-muted);
  white-space: nowrap;
}
```

---

## 3. HALAMAN: KATALOG MODUL AJAR ⭐ PRIORITAS UTAMA

### Perubahan dari versi lama:
- Grid: **4-col sempit** → **3-col desktop / 2-col tablet / 1-col mobile**
- Card: lebih tinggi, thumbnail besar (aspect ratio 3:2), info lebih kaya
- Action buttons: icon saja → **icon + label**, row penuh di bawah card
- Tambahan: **filter bar** (status, sort) + search input
- Badge status: lebih prominent, di pojok kiri atas (bukan kanan)

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  KATALOG MODUL AJAR                   [+ Tambah Modul Baru]  │
│  Kelola Modul Ajar yang Anda jual di marketplace.            │
├──────────────────────────────────────────────────────────────┤
│  [🔍 Cari modul...]  [Semua ▼]  [Terbaru ▼]                 │  ← filter bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ [AKTIF]       │  │ [AKTIF]       │  │ [DRAF]        │   │
│  │               │  │               │  │               │   │
│  │  [thumbnail]  │  │  [thumbnail]  │  │  [thumbnail]  │   │
│  │  3:2 ratio    │  │  3:2 ratio    │  │  3:2 ratio    │   │
│  │               │  │               │  │               │   │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤   │
│  │ Paket Lengkap │  │ Paket Lengkap │  │ Paket Lengkap │   │
│  │ Kelas Sem 1   │  │ Kelas Sem 12  │  │ Kelas Sem 1   │   │
│  │ SD            │  │ SD            │  │ SD            │   │
│  │ Rp60.000      │  │ Rp30.000      │  │ Rp50.000      │   │
│  │ 👁 0 views    │  │ 👁 0 views    │  │ 👁 0 views    │   │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤   │
│  │ [✏ Edit] [⧉]  │  │ [✏ Edit] [⧉]  │  │ [✏ Edit] [⧉]  │   │
│  │ [🗑 Hapus]    │  │ [🗑 Hapus]    │  │ [🗑 Hapus]    │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### CSS — Filter Bar

```css
.catalog-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.catalog-search {
  flex: 1;
  min-width: 200px;
  height: 40px;
  padding: 0 12px;
  font-size: var(--fs-base);
  font-weight: var(--fw-regular);
  border: 2px solid var(--color-border-bold);
  border-radius: 7px;
  box-shadow: var(--shadow-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.catalog-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-accent);
}

.catalog-filter-select {
  height: 40px;
  padding: 0 10px;
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
  border: 2px solid var(--color-border-bold);
  border-radius: 7px;
  box-shadow: var(--shadow-sm);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

/* Filter tabs — alternatif jika mau tab pill */
.catalog-tabs {
  display: flex;
  gap: 6px;
  align-items: center;
}

.catalog-tab {
  padding: 6px 14px;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  border: 2px solid var(--color-border-bold);
  border-radius: 20px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.1s;
}

.catalog-tab.active {
  background: var(--color-black);
  color: #ffffff;
  box-shadow: var(--shadow-accent);
}

.catalog-tab:hover:not(.active) {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 600px) {
  .catalog-filter-bar { flex-direction: column; align-items: stretch; }
  .catalog-search { min-width: unset; }
}
```

### CSS — Product Grid

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 540px) {
  .product-grid { grid-template-columns: 1fr; }
}
```

### CSS — Product Card (UTAMA)

```css
.product-card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.12s ease;
}

.product-card:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-xl);
}

/* Thumbnail */
.product-card__thumb {
  position: relative;
  aspect-ratio: 3 / 2;
  background: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border-bold);
  overflow: hidden;
}

.product-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Placeholder jika tidak ada gambar */
.product-card__thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-faint);
}

/* Badge status — pojok KIRI ATAS */
.product-card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 3px 8px;
  border-radius: 4px;
  border: 2px solid;
}

/* Badge Aktif */
.product-card__badge--aktif {
  background: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success);
}

/* Badge Draf */
.product-card__badge--draf {
  background: var(--color-surface);
  color: var(--color-black);
  border-color: var(--color-black);
}

/* Badge Nonaktif */
.product-card__badge--nonaktif {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

/* Info section */
.product-card__info {
  padding: 12px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-card__jenjang {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.product-card__title {
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: var(--color-text);
  line-height: 1.4;
  /* max 2 baris */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  font-size: var(--fs-md);
  font-weight: var(--fw-black);
  color: var(--color-primary);
  margin-top: 4px;
}

/* Views / meta */
.product-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* Action row — selalu di bawah */
.product-card__actions {
  display: flex;
  gap: 0;
  border-top: 2px solid var(--color-border-bold);
}

.product-card__action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 8px;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: none;
  cursor: pointer;
  transition: all 0.1s;
  text-decoration: none;
}

/* Divider antara tombol */
.product-card__action-btn + .product-card__action-btn {
  border-left: 2px solid var(--color-border-bold);
}

.product-card__action-btn:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

/* Tombol hapus — danger state */
.product-card__action-btn--danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
```

### Struktur HTML Card

```html
<div class="product-card">
  <!-- Thumbnail -->
  <div class="product-card__thumb">
    <!-- Jika ada gambar: -->
    <img src="..." alt="Judul Modul">
    <!-- Jika tidak ada: -->
    <!-- <div class="product-card__thumb-placeholder">
      <svg ...icon dokumen...></svg>
    </div> -->
    
    <span class="product-card__badge product-card__badge--aktif">Aktif</span>
  </div>

  <!-- Info -->
  <div class="product-card__info">
    <span class="product-card__jenjang">SD</span>
    <h3 class="product-card__title">Paket Lengkap Kelas Semester 1sfef</h3>
    <span class="product-card__price">Rp60.000</span>
    <div class="product-card__meta">
      <svg ...icon mata...></svg>
      <span>0 dilihat</span>
      <span>·</span>
      <span>0 terjual</span>
    </div>
  </div>

  <!-- Actions -->
  <div class="product-card__actions">
    <a href="/edit/..." class="product-card__action-btn">
      <svg ...icon edit...></svg> Edit
    </a>
    <button class="product-card__action-btn">
      <svg ...icon duplikat...></svg> Duplikat
    </button>
    <button class="product-card__action-btn product-card__action-btn--danger">
      <svg ...icon hapus...></svg> Hapus
    </button>
  </div>
</div>
```

### Empty State

```css
.catalog-empty {
  grid-column: 1 / -1;   /* span all columns */
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.catalog-empty__icon {
  width: 56px;
  height: 56px;
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-faint);
  margin-bottom: 8px;
}

.catalog-empty__title {
  font-size: var(--fs-lg);
  font-weight: var(--fw-black);
  color: var(--color-text);
}

.catalog-empty__desc {
  font-size: var(--fs-base);
  font-weight: var(--fw-regular);
  color: var(--color-text-muted);
  max-width: 320px;
}
```

---

## 4. HALAMAN: PESANAN MASUK

### Perubahan:
- Tambah filter status (Semua / Selesai / Pending) di atas tabel
- Tambah search invoice
- Mobile: tabel berubah menjadi **card list** (tabel tidak responsive di layar kecil)
- Kolom lebih proporsional

### Desktop Table — unchanged structure, styling tweaks

```css
.orders-table-wrap {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table thead tr {
  background: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border-bold);
}

.orders-table th {
  padding: 12px 16px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  text-align: left;
}

.orders-table td {
  padding: 14px 16px;
  font-size: var(--fs-base);
  font-weight: var(--fw-regular);
  color: var(--color-text);
  border-bottom: 1.5px solid var(--color-border);
  vertical-align: top;
}

.orders-table tbody tr:last-child td {
  border-bottom: none;
}

.orders-table tbody tr:hover td {
  background: var(--color-primary-bg);
}

/* Invoice text */
.order-invoice {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
  font-family: monospace;
}

/* Harga */
.order-total {
  font-weight: var(--fw-black);
  color: var(--color-primary);
}
```

### Mobile: Order Card List

```css
@media (max-width: 768px) {
  .orders-table-wrap { display: none; }
  
  .orders-card-list { display: flex; flex-direction: column; gap: 12px; }
}

@media (min-width: 769px) {
  .orders-card-list { display: none; }
}

.order-card-mobile {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-card-mobile__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.order-card-mobile__invoice {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
  font-family: monospace;
}

.order-card-mobile__product {
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: var(--color-text);
  line-height: 1.3;
}

.order-card-mobile__buyer {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-muted);
}

.order-card-mobile__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1.5px solid var(--color-border);
  padding-top: 8px;
}

.order-card-mobile__total {
  font-size: var(--fs-md);
  font-weight: var(--fw-black);
  color: var(--color-primary);
}
```

---

## 5. HALAMAN PUBLIK TOKO — `/store/:slug`

### Perubahan:
- Grid produk: **3-col desktop / 2-col tablet / 1-col mobile**
- Card produk publik: lebih besar, badge jenjang di pojok kiri atas
- Header toko: layout lebih terstruktur

### CSS — Halaman Publik

```css
/* Card produk publik */
.store-product-card {
  background: var(--color-surface);
  border: 2.5px solid var(--color-border-bold);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: all 0.12s ease;
}

.store-product-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-xl);
}

/* Thumbnail */
.store-product-card__thumb {
  aspect-ratio: 3 / 2;
  background: var(--color-surface-alt);
  border-bottom: 2px solid var(--color-border-bold);
  position: relative;
  overflow: hidden;
}

.store-product-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Badge jenjang — pojok kiri atas */
.store-product-card__jenjang-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--color-black);
  color: #ffffff;
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  padding: 2px 8px;
  border-radius: 4px;
  border: 2px solid var(--color-black);
}

/* Info */
.store-product-card__info {
  padding: 12px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-product-card__title {
  font-size: var(--fs-base);
  font-weight: var(--fw-bold);
  color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.store-product-card__price {
  font-size: var(--fs-md);
  font-weight: var(--fw-black);
  color: var(--color-primary);
  margin-top: 4px;
}

/* Grid publik */
.store-catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .store-catalog-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 400px) {
  .store-catalog-grid { grid-template-columns: 1fr; }
}
```

---

## 6. PROFIL & IDENTITAS — Minor Tweaks

Tidak ada perubahan besar. Beberapa penyempurnaan:

```css
/* Field group lebih lega */
.profile-field-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
}

/* Row 2 kolom */
.profile-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .profile-row-2 { grid-template-columns: 1fr; }
}

/* Preview banner lebih kecil, ada border */
.banner-preview {
  border: 2.5px solid var(--color-border-bold);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
```

---

## 7. BREAKPOINT SUMMARY

| Breakpoint | Sidebar | Katalog Grid | Order Display | Stat Cards |
|---|---|---|---|---|
| ≥ 1024px | 200px fixed | 3-col | Table | 4-col |
| 768–1023px | Drawer | 2-col | Table | 2-col |
| 480–767px | Drawer | 2-col | Card list | 2-col |
| < 480px | Drawer | 1-col | Card list | 1-col |

---

## 8. CHECKLIST IMPLEMENTASI

Sebelum halaman dianggap selesai:

- [ ] Semua warna dari token `--color-*` — tidak ada hex raw baru
- [ ] Product card: badge status di pojok KIRI ATAS
- [ ] Product card: action row berisi icon + label (bukan icon saja)
- [ ] Katalog grid: 3-col desktop, 2-col tablet, 1-col mobile
- [ ] Stat cards: angka `--fs-2xl` (22px) dengan `--fw-black` (800)
- [ ] Sidebar: `position: sticky`, `overflow-y: auto`, drawer mobile
- [ ] Tabel order: hilang di mobile, diganti card list
- [ ] Filter bar katalog: search + status tabs + sort dropdown
- [ ] Tidak ada `linear-gradient` dimanapun
- [ ] Tidak ada `box-shadow: 0 Xpx Ypx rgba(...)` — hanya flat offset
- [ ] Semua tombol punya `border: 2–2.5px solid #111` + shadow offset
- [ ] Hover efek: `transform: translate(-1px, -1px)` + shadow naik level
- [ ] Font weight minimum 500 di semua teks
- [ ] Background halaman `#f5f0e8`
- [ ] Import font Inter dari Google Fonts atau bundled

---

## 9. FILE YANG PERLU DIBUAT / DIUBAH

```
src/
├── pages/
│   ├── store-management/
│   │   ├── dashboard.vue (atau .jsx/.tsx)    ← update stat cards + chart wrapper
│   │   ├── catalog.vue                        ← UTAMA — full redesign
│   │   ├── orders.vue                         ← tambah mobile card list
│   │   ├── profile.vue                        ← minor tweaks
│   │   └── coupons.vue                        ← no change
│   └── store/
│       └── [slug].vue                         ← update product grid + card
├── components/
│   ├── ProductCard.vue                        ← komponen baru (seller view)
│   ├── StoreProductCard.vue                   ← komponen baru (public view)
│   ├── StoreSidebar.vue                       ← update + drawer mobile
│   ├── StoreTopbar.vue                        ← komponen baru (mobile)
│   ├── CatalogFilterBar.vue                   ← komponen baru
│   └── OrderCardMobile.vue                    ← komponen baru
└── assets/
    └── styles/
        └── store-management.css               ← CSS baru (extend DESIGN_SYSTEM)
```

---

*Dokumen ini adalah panduan implementasi. Semua class dan token merujuk ke DESIGN_SYSTEM.md.*
*Jangan hardcode warna atau shadow di luar yang sudah terdaftar di design system.*
