const fs = require('fs');

const path = "e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/pages/Index.tsx";
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
if (!code.includes('OUTPUT_FORMAT_LABELS')) {
  code = code.replace(
    `import type { OutputFormat } from '@/types/export-format';`,
    `import { OutputFormat, OUTPUT_FORMAT_LABELS } from '@/types/export-format';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';`
  );
}

// 2. We can create a small render function for the dropdown, or just inline it.
const dropdownCode = `
                  {/* Format Selector UI */}
                  <div className="flex justify-end mb-4 print:hidden" data-no-export="true">
                    <div className="flex items-center space-x-2 bg-background p-2 rounded-lg border shadow-sm">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tampilan:</span>
                      <Select value={outputFormat} onValueChange={(val: OutputFormat) => setOutputFormat(val)}>
                        <SelectTrigger className="w-[200px] h-8 text-sm">
                          <SelectValue placeholder="Pilih Tampilan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(OUTPUT_FORMAT_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
`;

// 3. Inject in V2 Mode
const v2Target = `<DocumentPreview
                      contentRef={contentRef}
                      activeTab={V2_TAB_MAP[jenis]}`;

const v2Replacement = `<div className="flex flex-col h-full relative">
${dropdownCode}
                    <DocumentPreview
                      contentRef={contentRef}
                      activeTab={V2_TAB_MAP[jenis]}`;

// 4. Inject in V1 Mode
const v1Target = `<DocumentPreview
                  contentRef={contentRef}
                  activeTab={activeTab}`;

const v1Replacement = `${dropdownCode}
                <DocumentPreview
                  contentRef={contentRef}
                  activeTab={activeTab}`;

let modified = false;

if (code.includes(v2Target) && !code.includes('Tampilan:')) {
  code = code.replace(v2Target, v2Replacement);
  
  // also need to close the div for V2 mode
  // wait, in V2 Mode, renderDokumen returns the JSX. 
  // It was returning just <DocumentPreview ... />
  // We need to close the <div className="flex flex-col h-full relative"> we opened!
  
  // Actually replacing with regex is better for V2 closing tag
  const v2EndTarget = `generatingPertemuanIndex={null}
                      v2Mode={true}
                    />
                  )}`;
  const v2EndReplacement = `generatingPertemuanIndex={null}
                      v2Mode={true}
                    />
                    </div>
                  )}`;
  
  if (code.includes(v2EndTarget)) {
    code = code.replace(v2EndTarget, v2EndReplacement);
    modified = true;
  }
}

if (code.includes(v1Target) && !code.includes(v1Replacement)) {
  code = code.replace(v1Target, v1Replacement);
  modified = true;
}

if (modified) {
  fs.writeFileSync(path, code);
  console.log("Successfully injected dropdown!");
} else {
  console.log("Could not find targets or already modified.");
}
