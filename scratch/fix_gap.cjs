const fs = require('fs');
const path = 'e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/components/modul/DocumentPreview.tsx';

let code = fs.readFileSync(path, 'utf8');
code = code.replace(/gap: 'x-4 y-2'/g, "gap: '8px 12px'");
fs.writeFileSync(path, code);
console.log('Fixed flex gap!');
