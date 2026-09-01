const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: {
      type: "tujuan-pembelajaran",
      data: {
        capaianPembelajaran: "Peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar, sesuai dengan tujuan, kepada teman sebaya dan orang dewasa di sekitar tentang diri dan lingkungannya.",
        mataPelajaran: "Bahasa Indonesia",
        fase: "B",
        kelas: "IV",
        kalender: {
          mingguEfektifSem1: "18",
          mingguEfektifSem2: "18",
          jpPerMinggu: "4"
        }
      }
    }
  });

  if (error) console.error("Function Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
