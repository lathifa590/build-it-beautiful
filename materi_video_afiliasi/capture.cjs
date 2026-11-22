const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  {
    name: '01_dashboard_utama_dan_ringkasan_komisi.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=overview',
    windowSize: '1440,900',
    budget: 3500,
  },
  {
    name: '02_link_cepat_dan_estimasi_komisi_paket.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=overview',
    windowSize: '1440,900',
    budget: 3500,
  },
  {
    name: '03_tab_prospek_trial_binaan.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=leads',
    windowSize: '1440,1050',
    budget: 3500,
  },
  {
    name: '04_pesanan_masuk_pending_dan_potensi_komisi.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=commissions',
    windowSize: '1440,1050',
    budget: 3500,
  },
  {
    name: '05_modal_bantu_sapa_wa_calon_pembeli.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=commissions&modal=followup',
    windowSize: '1440,950',
    budget: 4000,
  },
  {
    name: '06_pencairan_komisi_dan_rekening.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=settings',
    windowSize: '1440,1000',
    budget: 3500,
  },
  {
    name: '07_leaderboard_top_afiliator.png',
    url: 'http://localhost:4173/app/affiliate?demo=1&tab=overview',
    windowSize: '1440,900',
    budget: 3500,
  },
];

for (const t of targets) {
  const filePath = path.join(outDir, t.name);
  console.log(`Capturing: ${t.name}...`);
  try {
    execFileSync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--window-size=${t.windowSize}`,
      `--virtual-time-budget=${t.budget}`,
      '--hide-scrollbars',
      `--screenshot=${filePath}`,
      t.url,
    ]);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      console.log(`✓ Saved: ${t.name} (${stat.size} bytes)`);
    } else {
      console.error(`✗ Not found: ${t.name}`);
    }
  } catch (err) {
    console.error(`Error capturing ${t.name}:`, err.message);
  }
}
