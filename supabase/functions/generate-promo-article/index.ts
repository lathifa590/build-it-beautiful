import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    
    if (!topic) {
      throw new Error("Topic is required");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // 1. Inisialisasi Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // 2. Dapatkan API Key Gemini yang aktif milik user ini
    const { data: activeKeys, error: keyError } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (keyError || !activeKeys || activeKeys.length === 0) {
      throw new Error("Tidak ada API Key Gemini aktif yang ditemukan. Silakan tambahkan di Pengaturan (Settings) terlebih dahulu.");
    }

    const systemPrompt = `Kamu adalah seorang Copywriter Edukasi ahli dan pakar SEO Indonesia. 
Tugasmu adalah merancang draf artikel blog SEO yang sangat natural, empatik, dan persuasif untuk mempromosikan fitur: "${topic}" di platform ModulAjar.Online.

ANTI-SLOP COPYWRITING RULES (PENTING KARENA DIBACA OLEH GURU):
1. **DILARANG MENGGUNAKAN KATA KLISE/BUZZWORDS**: unlock, elevate, empower, delve, showcase, testament, landscape, journey, robust, game-changer, next-level, seamless, cutting-edge, revolutionary. Gunakan bahasa yang membumi, spesifik dan langsung ke tujuan.
2. **TANPA KLAIM PALSU**: Jangan membuat data, angka, atau testimoni palsu tanpa sumber. Jangan gunakan kalimat pasif tanpa subjek (contoh buruk: "keputusan telah dibuat", baiknya: "kami memutuskan").
3. **JANGAN GUNAKAN EM-DASH (—)**: Gunakan koma, titik, atau tanda kurung biasa untuk jeda/tambahan info.
4. **HINDARI CHATBOT TONE & SIGNPOSTING**: Jangan gunakan penutup seperti "I hope this helps!", "You're welcome", atau pembuka meta-komentar seperti "Let's dive in", "Here's what you need to know", "Honestly?". Langsung to the point.
5. **JANGAN MEMBERI SIFAT MANUSIA PADA BENDA**: Contoh buruk: "dashboard mengerti kebutuhanmu". Contoh baik: "dashboard menampilkan data kebutuhanmu".
6. **GUNAKAN POV KITA (ORANG PERTAMA JAMAK)**: Posisikan dirimu sebagai sesama guru. Jangan gunakan kata "Anda" atau "Kalian" untuk memanggil pembaca. Gunakan "Kita" (contoh: "Kita sebagai guru seringkali...", BUKAN "Anda sebagai guru...").

STRUKTUR ARTIKEL WAJIB (Jangan gunakan format baku/template robot):
1. **Hook & Masalah Nyata:** Mulai dengan cerita, empati, atau fakta tentang kerepotan dan masalah nyata yang dialami guru (seperti kehabisan waktu, administrasi berbelit, dll). Jangan langsung sebut fitur di awal.
2. **Solusi:** Kenalkan fitur "${topic}" di ModulAjar.Online sebagai penyelamat/problem solver secara natural.
3. **Cara Kerja/Manfaat:** Jelaskan kemudahan dan dampak positif dari fitur ini (gunakan bullet points jika perlu).
4. **Soft CTA:** Tutup dengan paragraf persuasif yang halus untuk mengajak guru mencoba atau berlangganan.

ATURAN KETAT:
- Format dalam bentuk HTML murni (bukan Markdown). Gunakan tag <h2>, <h3>, <p>, <ul>, <li>, <strong>.
- Jangan gunakan \`\`\`html atau tag markdown apapun.
- Gaya bahasa informatif, empatik, dan profesional-santai.
- Panjang sekitar 400-600 kata.

OUTPUT:
Kembalikan respon HANYA dalam format JSON dengan struktur:
{
  "title": "Judul Artikel (Menarik, Clickbait Edukasi, SEO Friendly)",
  "slug": "judul-artikel-format-url-huruf-kecil-semua-tanpa-spasi-dan-karakter-khusus",
  "excerpt": "Ringkasan pendek 2 kalimat",
  "content": "Isi artikel dalam format HTML"
}`;

    let successData: any = null;
    let lastErrorMsg = "";

    // Panggil Gemini (gemini-2.5-flash) dengan key user
    for (const keyRow of activeKeys) {
      const geminiApiKey = keyRow.api_key;
      
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `Tulis artikel blog untuk mempromosikan fitur: ${topic}` }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json"
            }
          })
        });

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text();
          throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errText}`);
        }

        const geminiData = await geminiResponse.json();
        const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
          throw new Error(`Invalid Gemini response format`);
        }
        
        let parsedResult;
        try {
          parsedResult = JSON.parse(resultText.trim());
        } catch (e) {
          throw new Error(`Failed to parse Gemini JSON response`);
        }

        successData = parsedResult;
        break; 

      } catch (err: any) {
        lastErrorMsg = err.message;
        console.warn(`Key failed: ${lastErrorMsg}`);
      }
    }

    if (!successData) {
      throw new Error(`Gagal menghasilkan artikel. Pastikan API Key valid atau kuota mencukupi. Detail: ${lastErrorMsg}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: successData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Generate Promo Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
