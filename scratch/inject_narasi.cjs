const fs = require('fs');
const path = require('path');

const docPreviewPath = "e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/components/modul/DocumentPreview.tsx";
const narasiPath = "C:/Users/IP/.gemini/antigravity-ide/brain/b01db0c0-3495-451f-a6db-81b3c49aaada/scratch/narasi.txt";

let code = fs.readFileSync(docPreviewPath, 'utf8');
let narasiCode = fs.readFileSync(narasiPath, 'utf8');

// strip out line 147 and beyond from narasiCode
const lines = narasiCode.split('\n');
const cleanNarasi = lines.slice(0, 146).join('\n');

const target = `export const DocumentPreview = ({`;

if (code.includes(target) && !code.includes('renderPertemuanAsNarasi')) {
    code = code.replace(target, cleanNarasi + '\n\n' + target);
    fs.writeFileSync(docPreviewPath, code);
    console.log("Successfully injected renderPertemuanAsNarasi into DocumentPreview.tsx");
} else {
    console.log("Failed to inject or already injected.");
}
