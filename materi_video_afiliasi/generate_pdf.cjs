const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const screenshotsDir = path.resolve(__dirname, 'screenshots');
const outputPdfPath = path.resolve(__dirname, 'Panduan_Lengkap_Program_Afiliasi_ModulAjar_Online.pdf');
const tempHtmlPath = path.resolve(__dirname, 'temp_panduan.html');

// Helper to read image as base64 data URI
function getBase64Image(filename) {
  const filePath = path.join(screenshotsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filename}`);
    return '';
  }
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

console.log('Loading screenshots as base64...');
const imgDashboard = getBase64Image('01_dashboard_utama_dan_ringkasan_komisi.png');
const imgLanding = getBase64Image('02_landing_page_afiliasi_persis_asli.png');
const imgMarketing = getBase64Image('02b_tab_marketing_kit_siap_pakai.png');
const imgEstimasi = getBase64Image('02c_link_cepat_dan_estimasi_komisi_paket.png');
const imgLeads = getBase64Image('03_tab_prospek_trial_binaan.png');
const imgOrders = getBase64Image('04_pesanan_masuk_pending_dan_potensi_komisi.png');
const imgModal = getBase64Image('05_modal_bantu_sapa_wa_calon_pembeli.png');
const imgPayout = getBase64Image('06_ajukan_pencairan_dan_riwayat.png');
const imgSettings = getBase64Image('06b_pengaturan_rekening_bank.png');
const imgLeaderboard = getBase64Image('07_leaderboard_top_afiliator.png');

console.log('Generating HTML template...');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Lengkap Program Afiliasi - ModulAjar.Online</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Page Break Utilities */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .chapter-page {
      page-break-before: always;
      break-before: page;
      height: 270mm;
      max-height: 270mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
      box-sizing: border-box;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Page Styling */
    .cover-page {
      height: 268mm;
      max-height: 268mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 18mm 12mm;
      border: 3px solid #0f172a;
      border-radius: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #eff6ff 100%);
      position: relative;
      box-shadow: 6px 6px 0px #0f172a;
      box-sizing: border-box;
      overflow: hidden;
    }

    .cover-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 13pt;
      border-radius: 12px;
      letter-spacing: -0.5px;
    }

    .edition-tag {
      font-size: 9pt;
      font-weight: 700;
      color: #047857;
      background: #d1fae5;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1.5px solid #059669;
    }

    .cover-center {
      margin: 15mm 0;
    }

    .cover-category {
      display: inline-block;
      text-transform: uppercase;
      font-size: 10pt;
      font-weight: 900;
      letter-spacing: 2px;
      color: #2563eb;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 900;
      line-height: 1.15;
      color: #0f172a;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    .cover-title span {
      color: #ea580c;
    }

    .cover-subtitle {
      font-size: 12pt;
      color: #475569;
      font-weight: 500;
      line-height: 1.5;
      max-width: 560px;
      margin-bottom: 24px;
    }

    .cover-highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .cover-card {
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 3px 3px 0px #0f172a;
    }

    .cover-card .num {
      font-size: 20pt;
      font-weight: 900;
      color: #059669;
      font-family: 'JetBrains Mono', monospace;
    }

    .cover-card .lbl {
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
      line-height: 1.3;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 15px;
      border-top: 2px dashed #cbd5e1;
    }

    .author-info {
      font-size: 9pt;
      color: #64748b;
    }

    .author-info strong {
      color: #0f172a;
      display: block;
      font-size: 10pt;
    }

    /* Content Layout */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 10px;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      shrink: 0;
    }

    .chapter-tag {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      padding: 2px 7px;
      border-radius: 5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    h1.chapter-title {
      font-size: 16pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    h2.section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1e293b;
      margin-top: 10px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    p {
      margin-bottom: 8px;
      text-align: justify;
    }

    /* Callout & Alert Boxes */
    .callout {
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 9px 12px;
      margin: 8px 0;
      box-shadow: 2.5px 2.5px 0px #0f172a;
      background: #ffffff;
    }

    .callout-emerald {
      background: #ecfdf5;
      border-color: #059669;
      box-shadow: 2.5px 2.5px 0px #059669;
    }

    .callout-amber {
      background: #fffbeb;
      border-color: #d97706;
      box-shadow: 2.5px 2.5px 0px #d97706;
    }

    .callout-blue {
      background: #eff6ff;
      border-color: #2563eb;
      box-shadow: 2.5px 2.5px 0px #2563eb;
    }

    .callout-title {
      font-weight: 800;
      font-size: 9pt;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .callout-emerald .callout-title { color: #065f46; }
    .callout-amber .callout-title { color: #92400e; }
    .callout-blue .callout-title { color: #1e40af; }

    /* Screenshot Box */
    .screenshot-box {
      border: 2px solid #0f172a;
      border-radius: 10px;
      overflow: hidden;
      margin: 8px 0 6px 0;
      background: #f8fafc;
      box-shadow: 3px 3px 0px #0f172a;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .screenshot-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      shrink: 0;
    }

    .screenshot-header .dots {
      display: flex;
      gap: 4px;
    }

    .screenshot-header .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .screenshot-box img {
      width: 100%;
      height: auto;
      max-height: 82mm;
      object-fit: contain;
      display: block;
      background-color: #ffffff;
    }

    .screenshot-box.tall img {
      max-height: 86mm;
    }

    .screenshot-box.compact img {
      max-height: 70mm;
    }

    .caption {
      font-size: 7.5pt;
      color: #64748b;
      font-style: italic;
      text-align: center;
      margin-bottom: 8px;
      shrink: 0;
    }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 6px 0;
    }

    .card-feature {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
    }

    .card-feature h4 {
      font-size: 8.8pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }

    .card-feature p {
      font-size: 8pt;
      color: #475569;
      margin-bottom: 0;
      line-height: 1.4;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 8px 0;
      font-size: 8pt;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }

    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 8px;
      text-align: left;
      font-weight: 700;
      font-size: 8pt;
    }

    table.data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      line-height: 1.35;
    }

    table.data-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .badge-pill {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 7pt;
    }

    .badge-emerald { background: #d1fae5; color: #047857; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-amber { background: #fef3c7; color: #92400e; }

    /* Numbered Steps */
    .steps-list {
      margin: 6px 0 8px 0;
    }

    .step-item {
      display: flex;
      gap: 8px;
      margin-bottom: 7px;
      align-items: flex-start;
    }

    .step-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 8pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-content {
      flex: 1;
    }

    .step-content strong {
      color: #0f172a;
      font-size: 8.8pt;
    }

    .step-content p {
      font-size: 8.2pt;
      color: #475569;
      margin-top: 1px;
      margin-bottom: 0;
      line-height: 1.35;
    }

    /* Table of contents page */
    .toc-container {
      margin: 12px 0 16px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px dotted #cbd5e1;
      font-size: 9pt;
    }

    .toc-item .title {
      font-weight: 700;
      color: #1e293b;
    }

    .toc-item .page-num {
      font-weight: 800;
      color: #2563eb;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1: SAMPUL / COVER ==================== -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="brand-pill">📖 ModulAjar.Online</div>
      <div class="edition-tag">Panduan Resmi • Edisi 2026</div>
    </div>

    <div class="cover-center">
      <div class="cover-category">Program Afiliasi Pendidik Indonesia</div>
      <h1 class="cover-title">
        Panduan Lengkap<br>
        <span>Program Afiliasi</span><br>
        ModulAjar.Online
      </h1>
      <p class="cover-subtitle">
        Pedoman praktis dan strategi sukses menghasilkan komisi berulang 40% dengan berbagi manfaat platform pembuat modul ajar cerdas berbasis Artificial Intelligence kepada rekan guru se-Indonesia.
      </p>

      <div class="cover-highlights">
        <div class="cover-card">
          <div class="num">40%</div>
          <div class="lbl">Komisi Berulang (Termasuk Renewal)</div>
        </div>
        <div class="cover-card">
          <div class="num">Instant</div>
          <div class="lbl">Landing Page & Marketing Kit Siap Pakai</div>
        </div>
        <div class="cover-card">
          <div class="num">Anti-Dobel</div>
          <div class="lbl">Follow-Up WhatsApp Terkoordinasi Admin</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="author-info">
        <strong>Disusun oleh Tim ModulAjar.Online</strong>
        Panduan Implementasi dan Operasional Afiliator Resmi
      </div>
      <div class="author-info" style="text-align: right;">
        <strong>Akses Sistem</strong>
        https://modulajar.online/app/affiliate
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2: DAFTAR ISI & VISI ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Panduan Program Afiliasi</span>
      <span>Daftar Isi & Visi</span>
    </div>

    <span class="chapter-tag">Navigasi Dokumen</span>
    <h1 class="chapter-title">Daftar Isi Panduan</h1>
    <p>Buku panduan ini disusun secara berurutan dan terstruktur agar Anda dapat memahami seluruh mekanisme, fitur canggih terbaru, serta strategi praktis menghasilkan komisi dari Program Afiliasi ModulAjar.Online.</p>

    <div class="toc-container">
      <div class="toc-item">
        <span class="title">Bab 1: Mengenal Program Afiliasi ModulAjar.Online</span>
        <span class="page-num">Hal. 3</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 2: Memahami Tampilan & Indikator Dashboard Afiliasi</span>
        <span class="page-num">Hal. 4</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 3: Landing Page Otomatis & Link Cepat Checkout Paket</span>
        <span class="page-num">Hal. 5</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 4: Memanfaatkan Marketing Kit Siap Pakai</span>
        <span class="page-num">Hal. 6</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 5: Strategi Jitu "Lead Magnet" — Bagikan Akun Trial Gratis</span>
        <span class="page-num">Hal. 7</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 6: Fitur Terbaru — Monitoring Pesanan Masuk (Pending Transfer)</span>
        <span class="page-num">Hal. 8</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 7: Fitur Terbaru — Tombol "Bantu Sapa" WhatsApp Anti-Dobel</span>
        <span class="page-num">Hal. 9</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 8: Alur Pencairan Saldo Komisi & Pengaturan Rekening</span>
        <span class="page-num">Hal. 10</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 9: Papan Peringkat (Leaderboard) & Tips Sukses Top Afiliator</span>
        <span class="page-num">Hal. 11</span>
      </div>
      <div class="toc-item">
        <span class="title">Bab 10: Tanya Jawab (FAQ) & Pusat Bantuan Afiliator</span>
        <span class="page-num">Hal. 12</span>
      </div>
    </div>

    <div class="callout callout-emerald" style="margin-top: 15px;">
      <div class="callout-title">💡 Visi Program Afiliasi ModulAjar.Online</div>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        Kami percaya bahwa teknologi AI harus meringankan beban guru Indonesia, bukan membebani. Melalui program kemitraan ini, Anda tidak hanya membagikan solusi administrasi kurikulum mengajar yang cepat dan berkualitas, namun juga mendapatkan apresiasi penghasilan pasif yang adil, transparan, dan berkelanjutan.
      </p>
    </div>

    <div class="callout callout-blue" style="margin-top: 10px;">
      <div class="callout-title">📌 Kode Etik Afiliator Pendidik</div>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        Sebagai pendidik, mari senantiasa mengedepankan etika saling tolong-menolong. Hindari spamming di grup publik. Utamakan berbagi solusi nyata, mendampingi rekan guru dalam mengatasi kendala perangkat ajar, dan membangun interaksi yang ramah serta terpercaya.
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 3: BAB 1 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 1: Pengenalan</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 1</span>
    <h1 class="chapter-title">Mengenal Program Afiliasi ModulAjar.Online</h1>

    <p>
      <strong>Program Afiliasi ModulAjar.Online</strong> adalah program kemitraan resmi yang memungkinkan pengguna platform mengajak rekan sejawat (sesama guru, kepala sekolah, dosen, maupun komunitas pendidikan) untuk menggunakan aplikasi generator Modul Ajar AI, dan memperoleh <strong>komisi sebesar 40%</strong> dari setiap transaksi yang berhasil disetujui.
    </p>

    <h2 class="section-title">✨ Mengapa Program Afiliasi Ini Sangat Menarik?</h2>
    <div class="grid-2">
      <div class="card-feature">
        <h4>💰 Komisi 40% Berulang (Lifetime Renewal)</h4>
        <p>Tidak hanya dari pembelian pertama! Setiap kali rekan guru yang Anda ajak melakukan perpanjangan langganan tahunan (renewal), komisi 40% tetap otomatis masuk ke saldo Anda selamanya.</p>
      </div>
      <div class="card-feature">
        <h4>🌐 Gak Perlu Bikin Website Sendiri</h4>
        <p>Anda langsung mendapatkan link landing page pribadi yang persis sama mewahnya dengan website resmi ModulAjar.Online, lengkap dengan nama dan kode unik Anda di banner atas.</p>
      </div>
      <div class="card-feature">
        <h4>🎁 Strategi Lead Magnet Trial Gratis</h4>
        <p>Bisa mendaftarkan rekan guru untuk mencoba akun trial (25x generate modul ajar) secara cuma-cuma. Guru mencoba gratis dulu, suka, lalu upgrade ke berbayar!</p>
      </div>
      <div class="card-feature">
        <h4>🤝 Bantuan Sapa WA Terkoordinasi</h4>
        <p>Bisa memantau calon pembeli yang belum selesai transfer secara real-time dan menyapa mereka dengan template WhatsApp santai tanpa khawatir dobel dengan follow up admin pusat.</p>
      </div>
    </div>

    <h2 class="section-title">📋 Syarat & Kualifikasi Menjadi Afiliator</h2>
    <p>
      Untuk menjaga kualitas ekosistem komunitas dan memastikan afiliator benar-benar memahami manfaat aplikasi, program afiliasi ini terbuka untuk:
    </p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Tipe Akun Pengguna</th>
          <th>Status Kelayakan Afiliasi</th>
          <th>Keterangan Hak Akses</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Paket Pro (1 Tahun)</strong></td>
          <td><span class="badge-pill badge-emerald">Memenuhi Syarat (Eligible)</span></td>
          <td>Akses penuh dashboard afiliasi, komisi 40%, marketing kit, dan kuota trial binaan 30 akun/bulan.</td>
        </tr>
        <tr>
          <td><strong>Paket Standar (1 Tahun)</strong></td>
          <td><span class="badge-pill badge-emerald">Memenuhi Syarat (Eligible)</span></td>
          <td>Akses penuh dashboard afiliasi, komisi 40%, marketing kit, dan kuota trial binaan 30 akun/bulan.</td>
        </tr>
        <tr>
          <td><strong>Paket Lite (6 Bulan)</strong></td>
          <td><span class="badge-pill badge-amber">Perlu Upgrade</span></td>
          <td>Perlu melakukan upgrade ke Paket Standar atau Pro untuk membuka menu Program Afiliasi.</td>
        </tr>
        <tr>
          <td><strong>Akun Trial / Gratis</strong></td>
          <td><span class="badge-pill badge-amber">Perlu Berlangganan</span></td>
          <td>Belum memenuhi syarat; silakan berlangganan salah satu paket tahunan.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-emerald" style="margin-top: 10px;">
      <div class="callout-title">🎯 Tanpa Biaya Pendaftaran Tambahan</div>
      <p style="font-size: 8.5pt; margin-bottom: 0;">
        Program Afiliasi ini adalah fitur gratis bawaan bagi seluruh pelanggan aktif Paket Tahunan ModulAjar.Online. Anda tidak dipungut biaya registrasi agen kemitraan apapun.
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 4: BAB 2 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 2: Dashboard Afiliasi</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 2</span>
    <h1 class="chapter-title">Memahami Tampilan & Indikator Dashboard Afiliasi</h1>

    <p>
      Dashboard Afiliasi dirancang dengan antarmuka yang bersih, modern, dan informatif. Seluruh metrik penting disajikan secara transparan di bagian atas halaman ringkasan (*Overview*).
    </p>

    <div class="screenshot-box compact">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Dashboard Utama Afiliator — ModulAjar.Online</span>
        <span>modulajar.online/app/affiliate</span>
      </div>
      <img src="${imgDashboard}" alt="Dashboard Afiliator">
    </div>
    <div class="caption">Gambar 2.1: Tampilan Dashboard Afiliator dengan 5 Indikator KPI Utama dan Link Landing Page Unik.</div>

    <h2 class="section-title">📊 Penjelasan 5 Indikator KPI Utama</h2>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content">
          <strong>Klik Link LP:</strong>
          <p>Menghitung total kunjungan unik yang membuka link landing page atau link checkout referral Anda. Sistem mencatat cookie selama 30 hari.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content">
          <strong>Lead Trial:</strong>
          <p>Jumlah rekan guru yang telah Anda daftarkan sebagai pengguna akun trial gratis binaan Anda (kuota standar: 30 akun per bulan).</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content">
          <strong>Total Closing:</strong>
          <p>Jumlah pesanan yang sudah diverifikasi dan disetujui (lunas). Jika ada pesanan yang baru checkout namun belum transfer, akan muncul badge peringatan <em>"X Menunggu Bayar"</em>.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content">
          <strong>Saldo Siap Cair:</strong>
          <p>Total nominal komisi approved yang belum ditarik dan siap dicairkan kapan saja ke rekening bank atau dompet digital Anda.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">5</div>
        <div class="step-content">
          <strong>Sudah Dicairkan:</strong>
          <p>Akumulasi total komisi yang sudah berhasil ditransfer oleh tim admin pusat ke rekening Anda sejak pertama kali bergabung.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 5: BAB 3 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 3: Landing Page & Link Cepat</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 3</span>
    <h1 class="chapter-title">Landing Page Otomatis & Link Cepat Checkout Paket</h1>

    <p>
      Salah satu kendala terbesar guru dalam bisnis afiliasi adalah kesulitan teknis membuat website penjualan. Di ModulAjar.Online, <strong>seluruh infrastruktur penjualan sudah disediakan gratis</strong>.
    </p>

    <div class="screenshot-box compact">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Landing Page Otomatis dengan Banner Rekomendasi Afiliator</span>
        <span>modulajar.online/a/KODEANDA</span>
      </div>
      <img src="${imgLanding}" alt="Landing Page Afiliasi">
    </div>
    <div class="caption">Gambar 3.1: Landing Page resmi dengan banner hijau nama & kode unik Anda di bagian atas.</div>

    <h2 class="section-title">💳 Link Cepat ke Halaman Checkout & Estimasi Komisi</h2>
    <p>
      Jika calon pembeli sudah siap berlangganan, salin <strong>Link Cepat Checkout</strong> untuk langsung membawa mereka ke invoice paket pilihan:
    </p>

    <div class="grid-2" style="align-items: center; margin-top: 4px;">
      <div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Pilihan Paket</th>
              <th>Harga</th>
              <th>Komisi Afiliasi (40%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Paket Pro (1 Th)</strong></td>
              <td>Rp 197.000</td>
              <td><strong style="color: #059669;">+Rp 78.800</strong></td>
            </tr>
            <tr>
              <td><strong>Paket Standar (1 Th)</strong></td>
              <td>Rp 149.000</td>
              <td><strong style="color: #059669;">+Rp 59.600</strong></td>
            </tr>
            <tr>
              <td><strong>Paket Lite (6 Bln)</strong></td>
              <td>Rp 99.000</td>
              <td><strong style="color: #059669;">+Rp 39.600</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="callout callout-blue" style="margin-top: 4px;">
          <div class="callout-title">⏱️ Cookie Aktif 30 Hari</div>
          <p style="font-size: 8pt; margin-bottom: 0;">
            Jika prospek mengklik hari ini dan baru transfer 2 minggu kemudian, komisi 40% tetap tercatat milik Anda!
          </p>
        </div>
      </div>
      <div>
        <div class="screenshot-box" style="margin: 0;">
          <img src="${imgEstimasi}" alt="Estimasi Komisi Paket" style="max-height: 52mm;">
        </div>
        <div class="caption" style="margin-bottom: 0;">Gambar 3.2: Kartu Link Cepat & Rincian Komisi tiap paket.</div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 6: BAB 4 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 4: Marketing Kit</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 4</span>
    <h1 class="chapter-title">Memanfaatkan Marketing Kit Siap Pakai</h1>

    <p>
      Anda tidak perlu repot mendesain banner atau memikirkan kata-kata promosi. Tab <strong>Marketing Kit</strong> menyediakan materi publikasi siap sebar yang dirancang khusus untuk komunitas pendidik.
    </p>

    <div class="screenshot-box tall">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Tab Marketing Kit — Copywriting, Banner, Video, dan Slide</span>
        <span>modulajar.online/app/affiliate?tab=marketing</span>
      </div>
      <img src="${imgMarketing}" alt="Tab Marketing Kit">
    </div>
    <div class="caption">Gambar 4.1: Koleksi materi promosi siap pakai dengan tombol Salin Teks & Share WhatsApp instan.</div>

    <h2 class="section-title">📂 Kategori Materi yang Disediakan</h2>
    <div class="grid-2">
      <div class="card-feature">
        <h4>📝 Copywriting WhatsApp & Medsos</h4>
        <p>Teks persuasif dan edukatif siap kirim ke grup WA, KKG, MGMP, atau Facebook. Link referral Anda sudah tersemat otomatis di dalamnya!</p>
      </div>
      <div class="card-feature">
        <h4>🖼️ Banner Promosi & Story</h4>
        <p>Desain visual elegan ukuran Square (Feeds medsos) dan Portrait (Story WA/IG) untuk menarik perhatian rekan guru yang sedang repot administrasi.</p>
      </div>
      <div class="card-feature">
        <h4>🎬 Video Demo & Tutorial</h4>
        <p>Cuplikan video singkat memperlihatkan proses pembuatan modul ajar otomatis 5 menit untuk dishare ke TikTok, Reels, atau grup belajar.</p>
      </div>
      <div class="card-feature">
        <h4>📊 Slide Presentasi Modul</h4>
        <p>File presentasi PowerPoint/PDF siap tampil untuk Anda yang sering menjadi pembicara webinar, seminar guru, atau in-house training sekolah.</p>
      </div>
    </div>

    <div class="callout callout-emerald" style="margin-top: 8px;">
      <div class="callout-title">✨ Tombol "Share WA" Praktis Sekali Klik</div>
      <p style="font-size: 8.2pt; margin-bottom: 0;">
        Klik tombol <strong>"Share WA"</strong> pada materi pilihan, WhatsApp Anda otomatis terbuka dengan teks dan link referral yang sudah terformat rapi. Cukup pilih kontak atau grup rekan guru tujuan!
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 7: BAB 5 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 5: Lead Magnet Trial</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 5</span>
    <h1 class="chapter-title">Strategi Jitu "Lead Magnet" — Bagikan Akun Trial Gratis</h1>

    <p>
      Bagi seorang pendidik, jualan langsung (*hard-selling*) seringkali terasa kurang nyaman. Kunci sukses top afiliator ModulAjar.Online adalah strategi <strong>Lead Magnet</strong>: <em>"Bantu mereka mencoba kemudahan aplikasinya dulu secara gratis!"</em>
    </p>

    <div class="screenshot-box tall">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Tab Prospek Trial — Form Pendaftaran & Pemantauan Kuota Binaan</span>
        <span>modulajar.online/app/affiliate?tab=leads</span>
      </div>
      <img src="${imgLeads}" alt="Tab Prospek Trial">
    </div>
    <div class="caption">Gambar 5.1: Form pendaftaran akun trial dan pemantauan sisa kuota generate AI guru binaan.</div>

    <h2 class="section-title">🚀 Cara Mendaftarkan Rekan Guru ke Akun Trial</h2>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content">
          <strong>Pilih Mode Pendaftaran:</strong>
          <p>Gunakan tab <strong>"Tambah 1 Email"</strong> untuk pendaftaran personal, atau <strong>"Tempel Banyak Email"</strong> untuk mendaftarkan puluhan peserta workshop sekaligus.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content">
          <strong>Masukkan Data Calon Pengguna:</strong>
          <p>Ketikkan Nama Lengkap, Alamat Email aktif, dan Nomor WhatsApp calon pengguna (opsional namun disarankan).</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content">
          <strong>Klik "Aktifkan Sebagai Akun Trial":</strong>
          <p>Akun langsung aktif seketika. Rekan guru Anda mendapatkan hak akses <strong>kuota 25x generate modul ajar gratis</strong>!</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content">
          <strong>Pantau Pemakaian Kuota AI:</strong>
          <p>Perhatikan tabel binaan di bawah form. Saat kuota mendekati batas (misal: <em>24 / 25x generate</em>), hubungi mereka untuk menawarkan upgrade ke versi berbayar tanpa batas.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 8: BAB 6 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 6: Monitoring Pesanan</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 6</span>
    <h1 class="chapter-title">Fitur Terbaru — Monitoring Pesanan Masuk Real-Time</h1>

    <p>
      Kini afiliator tidak perlu lagi menebak-nebak apakah promosi mereka membuahkan hasil. Fitur <strong>Pesanan Masuk dari Link Anda (Real-Time)</strong> menampilkan setiap invoice checkout secara langsung begitu calon pembeli menekan tombol beli.
    </p>

    <div class="screenshot-box tall">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Tabel Pesanan Masuk — Status Menunggu Transfer & Potensi Komisi</span>
        <span>modulajar.online/app/affiliate?tab=commissions</span>
      </div>
      <img src="${imgOrders}" alt="Pesanan Masuk Real-Time">
    </div>
    <div class="caption">Gambar 6.1: Daftar pesanan masuk dengan indikator status transfer, estimasi komisi, dan riwayat follow-up.</div>

    <h2 class="section-title">🔍 Membaca Informasi Kolom Pesanan</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Kolom</th>
          <th>Informasi yang Ditampilkan</th>
          <th>Arti bagi Afiliator</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Invoice & Pembeli</strong></td>
          <td>Nama rekan guru, email, nomor WhatsApp, nomor invoice (#INV-...), dan jam transaksi.</td>
          <td>Mengenali siapa rekan yang baru saja melakukan pemesanan paket.</td>
        </tr>
        <tr>
          <td><strong>Paket & Tagihan</strong></td>
          <td>Pilihan paket, nominal tagihan, dan 3 digit kode unik bank (contoh: +988).</td>
          <td>Mengingatkan pembeli agar mentransfer tepat hingga 3 digit kode unik.</td>
        </tr>
        <tr>
          <td><strong>Estimasi Komisi</strong></td>
          <td>Nominal komisi 40% yang akan Anda terima begitu invoice diverifikasi admin.</td>
          <td>Memberikan gambaran riil penghasilan yang akan masuk ke saldo Anda.</td>
        </tr>
        <tr>
          <td><strong>Status & Follow Up</strong></td>
          <td>Badge status: <em>Menunggu Transfer</em>, <em>Lunas & Aktif</em>, serta label riwayat sapaan.</td>
          <td>Mengetahui status bayar dan apakah rekan guru sudah disapa sebelumnya.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-amber" style="margin-top: 6px;">
      <div class="callout-title">💰 Kotak "Potensi Komisi Tertunda"</div>
      <p style="font-size: 8.2pt; margin-bottom: 0;">
        Di atas tabel pesanan, terdapat kotak <strong>Potensi Komisi Tertunda</strong> (misal: <em>+Rp 198.000</em>). Begitu para calon pembeli menyelesaikan transfernya dan admin menyetujuinya, nominal ini langsung berubah menjadi <strong>Saldo Siap Cair</strong>.
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 9: BAB 7 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 7: Bantu Sapa WhatsApp</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 7</span>
    <h1 class="chapter-title">Fitur Terbaru — Tombol "Bantu Sapa" WhatsApp Anti-Dobel</h1>

    <p>
      Calon pembeli yang belum transfer biasanya bukan karena ragu, melainkan belum sempat ke m-banking atau lupa 3 digit kode unik. Tombol <strong>"Bantu Sapa (WA)"</strong> hadir untuk membantu Anda mengingatkan mereka secara ramah dan profesional.
    </p>

    <div class="screenshot-box tall">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Pop-up Modal Bantu Sapa Calon Pembeli via WhatsApp</span>
        <span>Klik tombol [Bantu Sapa (WA)] pada tabel pesanan pending</span>
      </div>
      <img src="${imgModal}" alt="Modal Bantu Sapa WhatsApp">
    </div>
    <div class="caption">Gambar 7.1: Modal Bantu Sapa WA dengan 3 template pesan santai dan pencatatan riwayat otomatis.</div>

    <h2 class="section-title">💬 3 Pilihan Gaya Sapaan WhatsApp Cerdas</h2>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">A</div>
        <div class="step-content">
          <strong>Sapaan Ramah & Cek Kendala (Rekomendasi Utama):</strong>
          <p>Menyapa secara santai, mengapresiasi minat beliau, dan menanyakan apakah ada kesulitan saat proses checkout tanpa terkesan menagih.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">B</div>
        <div class="step-content">
          <strong>Bantuan Transfer & Kode Unik (Kendala Teknis):</strong>
          <p>Mengingatkan pentingnya mentransfer tepat dengan 3 digit kode unik agar verifikasi otomatis rekening berlangsung mulus dan cepat.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">C</div>
        <div class="step-content">
          <strong>Sapaan Akrab Rekan Guru (Sesama Teman/MGMP):</strong>
          <p>Gaya bahasa bersahabat layaknya teman satu sekolah, sangat cocok digunakan untuk calon pembeli yang memang sudah akrab dengan Anda.</p>
        </div>
      </div>
    </div>

    <div class="callout callout-emerald" style="margin-top: 6px;">
      <div class="callout-title">🛡️ Sistem Koordinasi Anti-Dobel dengan Admin Pusat</div>
      <p style="font-size: 8.2pt; margin-bottom: 0;">
        Ketika Anda menekan tombol <strong>"Buka WhatsApp & Tandai Sudah Disapa"</strong>, sistem otomatis mencatat tanggal dan jam sapaan Anda. Panel admin pusat langsung menampilkan tanda bahwa pembeli sudah disapa oleh Anda, sehingga <strong>admin pusat TIDAK AKAN mengirim chat dobel</strong>. Pembeli merasa nyaman dan tidak terganggu!
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 10: BAB 8 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 8: Pencairan Komisi</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 8</span>
    <h1 class="chapter-title">Alur Pencairan Saldo Komisi & Pengaturan Rekening</h1>

    <p>
      Komisi dari transaksi yang berhasil disetujui langsung masuk ke <strong>Saldo Siap Cair</strong>. Anda dapat mengajukan pencairan dana kapan saja ke seluruh rekening bank nasional maupun e-wallet populer di Indonesia.
    </p>

    <div class="grid-2" style="margin: 8px 0;">
      <div>
        <div class="screenshot-box" style="margin: 0;">
          <img src="${imgPayout}" alt="Form Ajukan Pencairan Komisi" style="max-height: 60mm;">
        </div>
        <div class="caption">Gambar 8.1: Form Pengajuan Pencairan Saldo Komisi.</div>
      </div>
      <div>
        <div class="screenshot-box" style="margin: 0;">
          <img src="${imgSettings}" alt="Tab Profil & Rekening" style="max-height: 60mm;">
        </div>
        <div class="caption">Gambar 8.2: Tab Pengaturan Nomor Rekening Bank/E-Wallet.</div>
      </div>
    </div>

    <h2 class="section-title">💵 Ketentuan Pencairan Saldo</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Ketentuan</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Minimum Pencairan</strong></td>
          <td>Rp 50.000</td>
          <td>Bisa dicairkan bahkan hanya dengan 1 transaksi closing paket apapun.</td>
        </tr>
        <tr>
          <td><strong>Biaya Admin Transfer</strong></td>
          <td><strong>Rp 0 (Gratis)</strong></td>
          <td>Bebas biaya transfer antar bank/e-wallet untuk penarikan di atas Rp 50.000.</td>
        </tr>
        <tr>
          <td><strong>Tujuan Rekening Bank</strong></td>
          <td>BCA, BRI, Mandiri, BNI, BSI, Bank Daerah, dll.</td>
          <td>Mendukung seluruh bank berizin resmi OJK/Bank Indonesia.</td>
        </tr>
        <tr>
          <td><strong>Tujuan Dompet Digital</strong></td>
          <td>DANA, GoPay, OVO, ShopeePay</td>
          <td>Bisa dicairkan langsung ke nomor e-wallet yang terdaftar.</td>
        </tr>
        <tr>
          <td><strong>Waktu Proses Transfer</strong></td>
          <td>Maksimal 1 x 24 Jam Kerja</td>
          <td>Umumnya diproses dalam hitungan beberapa jam setelah diajukan.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue" style="margin-top: 6px;">
      <div class="callout-title">⚙️ Langkah Pengaturan Rekening:</div>
      <p style="font-size: 8.2pt; margin-bottom: 0;">
        Buka tab <strong>Profil & Rekening</strong>, pilih Nama Bank / E-Wallet, ketik Nomor Rekening, dan pastikan Nama Pemilik Rekening sesuai dengan buku tabungan Anda, lalu klik <strong>"Simpan Profil & Rekening"</strong>.
      </p>
    </div>
  </div>

  <!-- ==================== HALAMAN 11: BAB 9 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 9: Leaderboard & Strategi</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 9</span>
    <h1 class="chapter-title">Papan Peringkat & Tips Sukses Menjadi Top Afiliator</h1>

    <p>
      Di tab <strong>Overview</strong>, Anda dapat memantau <strong>Top 5 Afiliator Bulan Ini</strong> yang diperbarui secara langsung. Fitur ini dirancang untuk memacu semangat kompetisi positif dan mengapresiasi kerja cerdas afiliator teraktif.
    </p>

    <div class="screenshot-box tall">
      <div class="screenshot-header">
        <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
        <span>Top 5 Afiliator Bulan Ini — Papan Klasemen & Posisi Anda</span>
        <span>modulajar.online/app/affiliate</span>
      </div>
      <img src="${imgLeaderboard}" alt="Leaderboard Top Afiliator">
    </div>
    <div class="caption">Gambar 9.1: Papan klasemen Top 5 Afiliator dengan highlight posisi "Anda".</div>

    <h2 class="section-title">🏆 5 Langkah Sukses Meraih Closing Perdana</h2>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content">
          <strong>Gunakan Aplikasi untuk Kebutuhan Mengajar Sendiri:</strong>
          <p>Cerita pengalaman nyata jauh lebih menjual. Tunjukkan hasil modul ajar rapi yang Anda generate kepada rekan di ruang guru.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content">
          <strong>Beri Solusi Akun Trial Gratis Terlebih Dahulu:</strong>
          <p>Daftarkan rekan guru yang sedang disibukkan administrasi dengan kuota 25x generate. Tuntun mereka membuat modul ajar pertamanya.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content">
          <strong>Bagikan Cuplikan Hasil di Status WhatsApp / Medsos:</strong>
          <p>Posting screenshot lembar modul ajar dengan caption santai: <em>"Alhamdulillah perangkat ajar semester ini beres dalam hitungan menit pakai AI. Yang mau coba gratis japri ya!"</em></p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content">
          <strong>Cek Tab Pesanan Masuk Tiap Sore:</strong>
          <p>Luangkan waktu beberapa menit sore hari untuk melihat pesanan pending. Segera gunakan fitur "Bantu Sapa" untuk membantu rekan yang terkendala transfer.</p>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">5</div>
        <div class="step-content">
          <strong>Bentuk Komunitas Belajar Bersama:</strong>
          <p>Buat grup WhatsApp sharing kurikulum dan pemanfaatan AI mengajar. Sematkan link referral Anda sebagai sarana rekomendasi resmi.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 12: BAB 10 ==================== -->
  <div class="chapter-page">
    <div class="header-bar">
      <span>Bab 10: FAQ & Bantuan</span>
      <span>ModulAjar.Online</span>
    </div>

    <span class="chapter-tag">Bab 10</span>
    <h1 class="chapter-title">Tanya Jawab (FAQ) & Pusat Bantuan Afiliator</h1>

    <h2 class="section-title">❓ Pertanyaan yang Sering Diajukan</h2>

    <div class="avoid-break" style="margin-bottom: 8px;">
      <strong style="color: #2563eb; font-size: 8.8pt;">Q1: Kapan komisi saya disetujui (approved)?</strong>
      <p style="font-size: 8.2pt; margin-top: 1px; margin-bottom: 0;">
        Komisi berstatus <em>pending</em> saat pesanan dibuat, dan otomatis menjadi <strong>Approved</strong> segera setelah pembayaran transfer diverifikasi oleh tim admin pusat.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 8px;">
      <strong style="color: #2563eb; font-size: 8.8pt;">Q2: Apakah saya tetap dapat komisi saat pembeli memperpanjang langganan?</strong>
      <p style="font-size: 8.2pt; margin-top: 1px; margin-bottom: 0;">
        <strong>YA, PASTI!</strong> Sistem komisi bersifat berulang (*recurring lifetime*). Setiap kali akun rujukan Anda memperpanjang paket di tahun berikutnya, komisi 40% tetap otomatis masuk ke saldo Anda.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 8px;">
      <strong style="color: #2563eb; font-size: 8.8pt;">Q3: Berapa kuota akun trial yang bisa saya daftarkan per bulan?</strong>
      <p style="font-size: 8.2pt; margin-top: 1px; margin-bottom: 0;">
        Kuota standar adalah <strong>30 akun guru binaan per bulan</strong> (direset setiap awal bulan). Jika Anda mengadakan pelatihan atau workshop besar, hubungi admin untuk kuota khusus tambahan.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 8px;">
      <strong style="color: #2563eb; font-size: 8.8pt;">Q4: Bagaimana jika pembeli tidak sengaja membuka web tanpa kode referral?</strong>
      <p style="font-size: 8.2pt; margin-top: 1px; margin-bottom: 0;">
        Selama mereka pernah mengklik link Anda dalam 30 hari terakhir, cookie peramban tetap merekam kode Anda. Bila email mereka sudah pernah didaftarkan di menu trial binaan, sistem database otomatis mengenali rujukan Anda.
      </p>
    </div>

    <div class="avoid-break" style="margin-bottom: 8px;">
      <strong style="color: #2563eb; font-size: 8.8pt;">Q5: Apakah ada potongan biaya admin saat mencairkan saldo?</strong>
      <p style="font-size: 8.2pt; margin-top: 1px; margin-bottom: 0;">
        Pencairan saldo di atas Rp 50.000 <strong>100% Bebas Biaya Admin</strong>. Biaya transfer antar bank ditanggung sepenuhnya oleh platform.
      </p>
    </div>

    <div class="callout callout-blue avoid-break" style="margin-top: 12px;">
      <div class="callout-title">📞 Pusat Layanan & Komunitas Afiliator</div>
      <p style="font-size: 8.2pt; margin-bottom: 4px;">
        Butuh bantuan teknis, konsultasi kemitraan, atau penambahan kuota workshop? Tim kami siap melayani:
      </p>
      <ul style="padding-left: 16px; font-size: 8pt; color: #334155; line-height: 1.5;">
        <li><strong>Portal Resmi:</strong> https://modulajar.online</li>
        <li><strong>Dashboard Afiliasi:</strong> https://modulajar.online/app/affiliate</li>
        <li><strong>Helpdesk WhatsApp Admin:</strong> 0882-2851-1309</li>
        <li><strong>Komunitas Guru AI:</strong> Grup WhatsApp Mitra Pendidik Indonesia</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 18px; font-size: 8.5pt; color: #64748b;">
      <p>— Selamat Berbagi Kebaikan & Meraih Sukses Finansial Bersama ModulAjar.Online —</p>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
console.log('HTML written to:', tempHtmlPath);

console.log('Rendering PDF via Chrome Headless...');
try {
  execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + outputPdfPath,
    tempHtmlPath,
  ]);

  if (fs.existsSync(outputPdfPath)) {
    const stat = fs.statSync(outputPdfPath);
    console.log(`✓ SUCCESS! PDF Generated: ${outputPdfPath} (${stat.size} bytes)`);
  } else {
    console.error('✗ PDF file not found after Chrome render.');
  }
} catch (err) {
  console.error('Error rendering PDF:', err.message);
} finally {
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
    console.log('Cleaned up temporary HTML file.');
  }
}
