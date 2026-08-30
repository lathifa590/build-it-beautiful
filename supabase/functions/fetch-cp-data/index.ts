import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GITHUB_BASE = "https://raw.githubusercontent.com/miztergood/CP-Kurmer-2025/main/Mata-Pelajaran-Umum-SD-SMA";

// CP 032 data URL (served from Supabase storage)
const CP032_URL = "https://tpwathrdbvaaipjstukf.supabase.co/storage/v1/object/public/stimulus-images/cp-data/cp_032.json";

const PAI_2026_URL = "https://raw.githubusercontent.com/miztergood/cp-pai-dan-budi-pekerti-2026/main/cp%20pendidikan%20agama%20dan%20budi%20pekerti%202026.json";

const KBC_MADRASAH_URL = "https://raw.githubusercontent.com/miztergood/CP-PAI-dan-Bahasa-Arab-Madrasah/main/cp_pai_bahasa_arab_madrasah_2025.json";

// Cache in-memory per edge function instance
const cpCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, fase, source, filterNama } = await req.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Parameter 'slug' diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to CP032 handler if source is cp032
    if (source === "cp032") {
      return await handleCP032(slug, fase);
    }

    if (source === "kbc_madrasah") {
      return await handleKbcMadrasah(slug, fase);
    }

    // Route PAI 2026 (khusus Agama Islam) ke sumber baru
    if (
      slug === "pendidikan-agama-dan-budi-pekerti" &&
      typeof filterNama === "string" &&
      filterNama.toLowerCase().includes("pendidikan agama islam")
    ) {
      return await handlePAI2026(fase);
    }

    // Default: GitHub flow (unchanged)
    const cacheKey = `github_${slug}`;
    const cached = cpCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for ${slug}`);
      const filtered = filterByFase(cached.data, fase);
      return new Response(JSON.stringify({ data: filtered, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `${GITHUB_BASE}/${slug}`;
    console.log(`Fetching CP from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: `Mata pelajaran '${slug}' tidak ditemukan di database CP`, notFound: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }

    const rawText = await response.text();
    
    let parsed;
    try {
      let cleanText = rawText.trim();
      if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
      else if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
      if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);
      cleanText = cleanText.trim();
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = JSON.parse(rawText);
    }

    cpCache.set(cacheKey, { data: parsed, timestamp: Date.now() });

    const filtered = filterByFase(parsed, fase);
    return new Response(JSON.stringify({ data: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-cp-data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Extract JSON array/object from a possibly-messy text (strips markdown fences and trailing prose)
function parseLooseJson(text: string): any {
  let t = text.trim();
  // Strip leading code fence
  t = t.replace(/^```(?:json)?\s*/i, "");
  // Find first [ or {
  const startArr = t.indexOf("[");
  const startObj = t.indexOf("{");
  let start = -1;
  let openCh = "";
  let closeCh = "";
  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    start = startArr; openCh = "["; closeCh = "]";
  } else if (startObj !== -1) {
    start = startObj; openCh = "{"; closeCh = "}";
  }
  if (start === -1) return JSON.parse(t);

  // Walk to find matching close, respecting strings
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === openCh) depth++;
      else if (c === closeCh) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
  }
  const slice = end === -1 ? t.slice(start) : t.slice(start, end + 1);
  return JSON.parse(slice);
}

// Handle PAI 2026 source (khusus Agama Islam)
async function handlePAI2026(fase?: string) {
  const cacheKey = "pai2026_all";
  let raw: any;

  const cached = cpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    raw = cached.data;
  } else {
    console.log("Fetching PAI 2026 data...");
    const response = await fetch(PAI_2026_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch PAI 2026: ${response.status}`);
    }
    const rawText = await response.text();
    raw = parseLooseJson(rawText);
    cpCache.set(cacheKey, { data: raw, timestamp: Date.now() });
  }

  const entries: any[] = Array.isArray(raw) ? raw : [];
  const filtered = entries.filter((e) => !fase || e.fase === fase);

  const capaian_per_fase = filtered.map((e) => {
    const elemenObj: Record<string, string> = {};
    if (Array.isArray(e.capaian_pembelajaran)) {
      for (const cp of e.capaian_pembelajaran) {
        if (cp?.elemen) elemenObj[cp.elemen] = cp.capaian ?? "";
      }
    }
    return {
      fase: e.fase,
      kelas: e.kelas_umum ?? "",
      elemen: elemenObj,
    };
  });

  const transformed = {
    mata_pelajaran: [
      {
        nama: "Pendidikan Agama Islam dan Budi Pekerti",
        capaian_per_fase,
      },
    ],
  };

  return new Response(JSON.stringify({ data: transformed, source: "pai2026" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Handle CP 032 source
async function handleCP032(slug: string, fase?: string) {
  const cacheKey = "cp032_all";
  let cp032Data: any;

  const cached = cpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    cp032Data = cached.data;
  } else {
    console.log("Fetching CP 032 data...");
    const response = await fetch(CP032_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CP 032: ${response.status}`);
    }
    cp032Data = await response.json();
    cpCache.set(cacheKey, { data: cp032Data, timestamp: Date.now() });
  }

  // Find matching mapel by fuzzy matching nama_pelajaran
  const mapelName = extractMapelName(slug);
  const matchedMapel = cp032Data.mata_pelajaran?.find((mp: any) => {
    const nama = mp.nama_pelajaran?.toLowerCase() || "";
    return nama.includes(mapelName) || mapelName.includes(nama.split(" ")[0]);
  });

  if (!matchedMapel) {
    return new Response(
      JSON.stringify({ error: `Mata pelajaran tidak ditemukan dalam CP SK 032/2024`, notFound: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Transform cp032 format to match GitHub format
  const transformed = transformCP032ToStandard(matchedMapel, fase);

  return new Response(JSON.stringify({ data: transformed, source: "cp032" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Handle KBC Madrasah source
async function handleKbcMadrasah(slug: string, fase?: string) {
  const cacheKey = "kbc_madrasah_all";
  let madrasahData: any;

  const cached = cpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    madrasahData = cached.data;
  } else {
    console.log("Fetching KBC Madrasah data...");
    const response = await fetch(KBC_MADRASAH_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch KBC Madrasah: ${response.status}`);
    }
    const rawText = await response.text();
    madrasahData = parseLooseJson(rawText);
    cpCache.set(cacheKey, { data: madrasahData, timestamp: Date.now() });
  }

  const mapelName = extractMapelName(slug);
  let matchedMapel: any = null;

  // madrasahData.kategori_detail is an array of objects which contain mata_pelajaran array
  if (Array.isArray(madrasahData.kategori_detail)) {
    for (const kategori of madrasahData.kategori_detail) {
      if (Array.isArray(kategori.mata_pelajaran)) {
        for (const mp of kategori.mata_pelajaran) {
          const nama = (mp.nama || "").toLowerCase();
          if (nama.includes(mapelName) || mapelName.includes(nama.split(" ")[0])) {
            matchedMapel = mp;
            break;
          }
        }
      }
      if (matchedMapel) break;
    }
  }

  if (!matchedMapel) {
    return new Response(
      JSON.stringify({ error: `Mata pelajaran tidak ditemukan dalam CP Madrasah 2025`, notFound: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Transform to standard format
  const transformed = transformMadrasahToStandard(matchedMapel, fase);

  return new Response(JSON.stringify({ data: transformed, source: "kbc_madrasah" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function transformMadrasahToStandard(mapel: any, fase?: string) {
  const faseData = mapel.capaian_per_fase || [];
  
  const capaianPerFase = faseData
    .filter((f: any) => !fase || f.fase === fase)
    .map((f: any) => {
      return {
        fase: f.fase,
        kelas: f.kelas,
        elemen: f.elemen || {},
      };
    });

  return {
    mata_pelajaran: [
      {
        nama: mapel.nama,
        capaian_per_fase: capaianPerFase,
      },
    ],
  };
}

// Extract a clean mapel name from the GitHub slug format
function extractMapelName(slug: string): string {
  // slug is like "bahasa-indonesia.json" or "matematika.json"
  const name = slug.replace(".json", "").replace(/-/g, " ").toLowerCase();
  // Map common aliases
  const aliases: Record<string, string> = {
    "ipas": "ilmu pengetahuan alam dan sosial",
    "ipa": "ilmu pengetahuan alam",
    "ips": "ilmu pengetahuan sosial",
    "pjok": "pendidikan jasmani",
    "pai": "pendidikan agama islam",
    "ppkn": "pendidikan pancasila",
    "bahasa indonesia": "bahasa indonesia",
    "bahasa inggris": "bahasa inggris",
    "matematika": "matematika",
  };
  return aliases[name] || name;
}

// Transform CP032 format → standard GitHub format
function transformCP032ToStandard(mapel: any, fase?: string) {
  const faseData = mapel.fase || [];
  
  const capaianPerFase = faseData
    .filter((f: any) => !fase || f.fase === fase)
    .map((f: any) => {
      // Transform elemen array → Record<string, string>
      const elemenObj: Record<string, string> = {};
      if (Array.isArray(f.elemen)) {
        for (const el of f.elemen) {
          elemenObj[el.nama] = el.deskripsi;
        }
      }
      return {
        fase: f.fase,
        kelas: f.kelas,
        elemen: elemenObj,
      };
    });

  return {
    mata_pelajaran: [
      {
        nama: mapel.nama_pelajaran,
        capaian_per_fase: capaianPerFase,
      },
    ],
  };
}

function filterByFase(data: any, fase?: string) {
  if (!data?.mata_pelajaran) return data;
  if (!fase) return data;

  const filtered = {
    ...data,
    mata_pelajaran: data.mata_pelajaran.map((mp: any) => ({
      ...mp,
      capaian_per_fase: mp.capaian_per_fase?.filter((cp: any) => cp.fase === fase) || [],
    })),
  };

  return filtered;
}
