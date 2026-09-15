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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error("Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ANTHROPIC_API_KEY");
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

    // 3. Panggil Claude 3.5 Sonnet
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

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      throw new Error(`Claude API Error: ${claudeResponse.status} - ${errText}`);
    }

    const claudeData = await claudeResponse.json();
    const resultText = claudeData.content[0].text;
    
    // Parse JSON
    let parsedResult;
    try {
      // Hilangkan awalan ```json dan akhiran ``` jika ada
      let cleanText = resultText.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
      if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
      
      parsedResult = JSON.parse(cleanText.trim());
    } catch (e) {
      throw new Error(`Failed to parse Claude JSON response: ${resultText}`);
    }

    if (!parsedResult.title || !parsedResult.content) {
      throw new Error(`Incomplete JSON response from Claude: ${JSON.stringify(parsedResult)}`);
    }

    // 4. Generate Slug dan Kalkulasi Reading Time
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

    // 5. Insert ke blog_articles
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

    // 6. Update queue status
    await supabase
      .from('seo_keyword_queue')
      .update({ status: 'done', article_id: newArticle.id })
      .eq('id', queueItem.id);

    // 7. Log success
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
