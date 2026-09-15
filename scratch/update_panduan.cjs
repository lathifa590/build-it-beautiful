const fs = require('fs');
const path = require('path');

const docPreviewPath = "e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/components/modul/DocumentPreview.tsx";

let code = fs.readFileSync(docPreviewPath, 'utf8');

const targetStr = `{/* Identifikasi Display Logic */}`;

if (!code.includes(targetStr)) {
    console.log("Could not find the target string!");
    process.exit(1);
}

const injection = `
        {isPanduan && (
          <div style={{ marginBottom: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', border: '1.5px solid black', padding: '12px', borderRadius: '4px', backgroundColor: '#fef9c3', breakInside: 'avoid' }}>
                <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '6px', color: '#854d0e' }}>📋 PANDUAN MENGAJAR (QUICK GUIDE)</div>
                   <div style={{ fontSize: '10.5pt' }}>
                     <div style={{ marginBottom: '4px' }}><strong>Guru:</strong> {formData.namaPenyusun}</div>
                     <div style={{ marginBottom: '4px' }}><strong>Materi:</strong> {formData.materi}</div>
                     <div><strong>Waktu:</strong> {formData.pertemuan.length} Pertemuan ({getTotalDurasi(formData)} Menit)</div>
                   </div>
                </div>
                <div style={{ flex: 1, borderLeft: '1.5px solid black', paddingLeft: '16px', fontSize: '10pt' }}>
                   <strong style={{ color: '#854d0e' }}>Ceklist Persiapan:</strong>
                   <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', listStyleType: 'none', marginLeft: '-16px' }}>
                      <li style={{ marginBottom: '4px' }}>[ &nbsp; ] Pahami sintaks dan langkah kegiatan</li>
                      <li style={{ marginBottom: '4px' }}>[ &nbsp; ] Siapkan & gandakan LKPD</li>
                      <li style={{ marginBottom: '4px' }}>[ &nbsp; ] Cek kesiapan alat/media/proyektor</li>
                      <li>[ &nbsp; ] Siapkan rubrik asesmen</li>
                   </ul>
                </div>
             </div>
          </div>
        )}

`;

code = code.replace(targetStr, injection + targetStr);

fs.writeFileSync(docPreviewPath, code);
console.log('Successfully injected Panduan Mengajar specialized header!');
