

const SUPABASE_URL = "https://jjgfpcedibgkkodydrci.supabase.co/functions/v1/generate-content";

async function test() {
  const payload = {
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
      },
      ruangLingkupMateri: ""
    }
  };

  try {
    const res = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    if (data.rawPreview) {
      console.log("\n\nRAW PREVIEW (up to 500 chars):\n" + data.rawPreview);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
