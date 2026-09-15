import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fungsi helper untuk slugify
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '')       // Hapus semua karakter non-word
    .replace(/\-\-+/g, '-')         // Ganti multiple - dengan single -
    .replace(/^-+/, '')             // Hapus awalan -
    .replace(/-+$/, '');            // Hapus akhiran -
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Inisialisasi Supabase Client (Service Role agar bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('CUSTOM_SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or CUSTOM_SUPABASE_URL, and SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Ambil 1 keyword dari antrean
    const { data: queueItem, error: queueError } = await supabase
      .from('seo_keyword_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (queueError) {
      throw new Error(`Error fetching queue: ${queueError.message}`);
    }

    if (!queueItem) {
      return new Response(
        JSON.stringify({ message: "No keywords in queue. Job skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as processing
    await supabase
      .from('seo_keyword_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    console.log(`Processing keyword: ${queueItem.keyword}`);

    // 3. Dapatkan Gemini API Key dari akun admin
    const { data: adminUsers, error: adminError } = await supabase.auth.admin.listUsers();
    if (adminError) throw new Error(`Error fetching users: ${adminError.message}`);
    
    const adminUser = adminUsers.users.find(u => u.email === 'pakhusnulid@gmail.com');
    if (!adminUser) throw new Error("Admin user pakhusnulid@gmail.com not found");

    const { data: apiKeyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', adminUser.id)
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keyError || !apiKeyData || !apiKeyData.api_key) {
      throw new Error("Active Gemini API key not found for admin user");
    }

    const geminiApiKey = apiKeyData.api_key;

    // 4. Panggil Gemini API (gemini-2.5-flash)
    const systemPrompt = `Kamu adalah seorang penulis blog pendidikan ahli dan pakar SEO Indonesia. 
Tugasmu adalah menulis artikel blog SEO yang informatif, menarik, dan terstruktur untuk website ModulAjar.Online.
Website ini menyediakan generator AI untuk Kurikulum Merdeka dan Kurikulum Berbasis Cinta (KBC) Kemenag.
Tulislah artikel yang mendalam (sekitar 1000 - 1500 kata) menggunakan format Markdown murni.

OUTPUT WAJIB: 
Berikan respon HANYA dalam format JSON dengan struktur berikut tanpa tag markdown atau teks tambahan:
{
  "title": "Judul artikel yang clickbait tapi profesional (Max 60 karakter)",
  "meta_description": "Meta description SEO-friendly (Max 160 karakter)",
  "excerpt": "Ringkasan pendek 2 kalimat untuk preview blog",
  "content": "Isi artikel lengkap dalam format Markdown (gunakan heading H2, H3, list, dan bold)"
}`;

    const userPrompt = `Buatkan artikel blog SEO untuk target keyword utama: "${queueItem.keyword}".
Kategori artikel: "${queueItem.category || 'Pendidikan'}"
Keyword sekunder yang disarankan: ${queueItem.keyword_secondary?.join(', ') || 'Modul ajar, RPP, AI, Guru, Kurikulum Merdeka, KBC'}.

Instruksi Konten:
- Gunakan bahasa Indonesia baku tapi mengalir (gaya jurnalistik/edutech).
- Berikan intro yang memikat, isi yang daging (bermanfaat bagi guru), dan kesimpulan yang kuat.
- Selipkan call-to-action (CTA) halus di akhir artikel untuk mengajak guru mencoba generator otomatis di ModulAjar.Online.`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
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
      throw new Error(`Invalid Gemini response format: ${JSON.stringify(geminiData)}`);
    }
    
    // Parse JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText.trim());
    } catch (e) {
      throw new Error(`Failed to parse Gemini JSON response: ${resultText}`);
    }

    if (!parsedResult.title || !parsedResult.content) {
      throw new Error(`Incomplete JSON response from Gemini: ${JSON.stringify(parsedResult)}`);
    }

    // 5. Generate Slug dan Kalkulasi Reading Time
    let slug = slugify(parsedResult.title);
    
    // Ensure slug is unique
    let isUnique = false;
    let counter = 0;
    while (!isUnique) {
      const checkSlug = counter > 0 ? `${slug}-${counter}` : slug;
      const { data: existing } = await supabase
        .from('blog_articles')
        .select('id')
        .eq('slug', checkSlug)
        .maybeSingle();
      
      if (!existing) {
        slug = checkSlug;
        isUnique = true;
      } else {
        counter++;
      }
    }

    // Hitung reading time kasar (asumsi 200 kata per menit)
    const wordCount = parsedResult.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // 6. Insert ke blog_articles
    const { data: newArticle, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        slug,
        title: parsedResult.title,
        meta_title: parsedResult.title, // Bisa diperpendek jika mau
        meta_description: parsedResult.meta_description,
        content: parsedResult.content,
        excerpt: parsedResult.excerpt,
        category: queueItem.category || 'Pendidikan',
        keyword_target: queueItem.keyword,
        status: 'published',
        published_at: new Date().toISOString(),
        author_name: 'AI ModulAjar',
        is_auto_generated: true,
        generation_prompt: userPrompt,
        reading_time_minutes: readingTime
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting blog article: ${insertError.message}`);
    }

    // 7. Update queue status
    await supabase
      .from('seo_keyword_queue')
      .update({ status: 'done', article_id: newArticle.id })
      .eq('id', queueItem.id);

    // 8. Log success
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'generate_blog_article',
        status: 'success',
        message: `Successfully generated article: ${parsedResult.title} (ID: ${newArticle.id}) from keyword: ${queueItem.keyword}`
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Article generated successfully",
        article: newArticle
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Cron Error:", error.message);
    
    // Attempt to log the error to the database if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('cron_job_logs').insert({
          job_name: 'generate_blog_article',
          status: 'error',
          message: error.message
        });
      }
    } catch (e) {
      console.error("Failed to log error to DB:", e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
