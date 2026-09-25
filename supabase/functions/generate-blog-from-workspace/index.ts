import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('CUSTOM_SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('CUSTOM_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables for Supabase");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // 2. Parse Body
    const { source_type, source_id, source_title, target_url } = await req.json();
    if (!source_type || !source_id || !target_url) {
      throw new Error("Missing required fields (source_type, source_id, target_url)");
    }

    console.log(`Generating blog for ${source_type}: ${source_title}`);

    // 3. Gather Context Data from DB based on source_type to make the article rich
    let extraContext = "";
    let category = "Pendidikan";
    
    try {
      if (source_type === 'meeting') {
        const { data: meetingData } = await supabaseAdmin
          .from('meeting_slots')
          .select(`
            title, planned_jp, week_number,
            prosem_items (
              materi_pokok,
              tp_snapshot,
              workspaces ( subject, grade, phase )
            )
          `)
          .eq('id', source_id)
          .maybeSingle();

        if (meetingData && meetingData.prosem_items) {
          const prosem = meetingData.prosem_items;
          const workspace = Array.isArray(prosem.workspaces) ? prosem.workspaces[0] : prosem.workspaces;
          category = workspace?.subject || "Pendidikan";
          
          extraContext = `
Ini adalah materi spesifik untuk SATU KALI PERTEMUAN (${meetingData.planned_jp} Jam Pelajaran).
Mata Pelajaran: ${workspace?.subject || '-'}
Kelas/Fase: ${workspace?.grade || '-'} / ${workspace?.phase || '-'}
Topik Utama (Bab): ${prosem.materi_pokok}
Tujuan Pembelajaran Topik: ${JSON.stringify(prosem.tp_snapshot || [])}
          `;
        }
      } else if (source_type === 'topic') {
        const { data: topicData } = await supabaseAdmin
          .from('prosem_items')
          .select(`
            materi_pokok, allocated_jp, tp_snapshot,
            workspaces ( subject, grade, phase )
          `)
          .eq('id', source_id)
          .maybeSingle();

        if (topicData) {
          const workspace = Array.isArray(topicData.workspaces) ? topicData.workspaces[0] : topicData.workspaces;
          category = workspace?.subject || "Pendidikan";
          
          extraContext = `
Ini adalah materi lengkap untuk SATU BAB / TOPIK (${topicData.allocated_jp} Jam Pelajaran).
Mata Pelajaran: ${workspace?.subject || '-'}
Kelas/Fase: ${workspace?.grade || '-'} / ${workspace?.phase || '-'}
Tujuan Pembelajaran: ${JSON.stringify(topicData.tp_snapshot || [])}
          `;
        }
      } else if (source_type === 'semester') {
        // source_id for semester is something like workspaceId-sem1
        const wsId = source_id.split('-sem')[0];
        const { data: wsData } = await supabaseAdmin
          .from('workspaces')
          .select('subject, grade, phase')
          .eq('id', wsId)
          .maybeSingle();
          
        if (wsData) {
          category = wsData.subject || "Pendidikan";
          extraContext = `
Ini adalah Perangkat Ajar FULL 1 SEMESTER.
Mata Pelajaran: ${wsData.subject || '-'}
Kelas/Fase: ${wsData.grade || '-'} / ${wsData.phase || '-'}
          `;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch extra context, proceeding with default title", e);
    }

    // 4. Fetch Gemini API Keys
    const { data: activeKeys, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('api_key')
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (keyError || !activeKeys || activeKeys.length === 0) {
      throw new Error("Tidak ada API Key Gemini yang aktif di pengaturan Anda.");
    }

    // 5. Construct Prompts
    const systemPrompt = `Kamu adalah pakar pendidikan dan SEO Copywriter spesialis Modul Ajar/RPP Indonesia.
Tugasmu adalah menulis artikel blog SEO (500 - 800 kata) yang edukatif, memikat guru-guru, dan akhirnya "menjual/mempromosikan" dokumen perangkat ajar.
Gunakan format Markdown murni.

OUTPUT WAJIB JSON:
{
  "title": "Judul clickbait SEO & profesional (Max 60 karakter)",
  "meta_description": "Meta description (Max 160 karakter)",
  "excerpt": "Ringkasan pendek 2 kalimat",
  "content": "Isi artikel lengkap dalam format Markdown (gunakan heading H2, H3, list, dan bold)"
}`;

    const userPrompt = `Buatkan artikel blog promosi untuk materi/dokumen pengajaran berikut:
Judul/Fokus: "${source_title}"
${extraContext ? `\nInformasi Tambahan dari Kurikulum/Modul Asli:\n${extraContext}\n` : ''}

Instruksi Konten:
1. Bahas PENTINGNYA materi ini untuk diajarkan, metode yang efektif, atau tantangan guru saat mengajarkannya.
2. Gaya bahasa: Menjawab keresahan guru, solutif, edukatif (bahasa Indonesia baku tapi mengalir).
3. CTA (Call-to-Action): Di bagian paling akhir artikel, WAJIB buat bagian ajakan yang KUAT (dengan heading H3 "Download Perangkat Ajar" atau sejenisnya) yang mengajak guru mengunduh/membeli modul lengkapnya agar mengajar jadi lebih mudah.
4. Sisipkan link URL ini di dalam teks CTA tersebut: ${target_url}`;

    let successData: any = null;
    let lastErrorMsg = "";

    // 6. Call Gemini
    for (const keyRow of activeKeys) {
      const geminiApiKey = keyRow.api_key;
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [ { role: "user", parts: [{ text: userPrompt }] } ],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
          })
        });

        if (!geminiResponse.ok) throw new Error(await geminiResponse.text());

        const geminiData = await geminiResponse.json();
        const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) throw new Error("Format respon tidak valid.");
        
        successData = JSON.parse(resultText.trim());
        if (!successData.title || !successData.content) throw new Error("JSON tidak lengkap.");
        break; 
      } catch (err: any) {
        lastErrorMsg = err.message;
      }
    }

    if (!successData) {
      throw new Error(`Semua API Key Gemini gagal. Error: ${lastErrorMsg}`);
    }

    // 7. Get Author/Store Name
    const { data: profile } = await supabaseAdmin
      .from('modul_store_profiles')
      .select('store_name')
      .eq('owner_user_id', user.id)
      .maybeSingle();
      
    const authorName = profile?.store_name || user.user_metadata?.full_name || 'Tim Pengajar';

    // 8. Generate Slug
    let slug = slugify(successData.title);
    let isUnique = false;
    let counter = 0;
    while (!isUnique) {
      const checkSlug = counter > 0 ? `${slug}-${counter}` : slug;
      const { data: existing } = await supabaseAdmin
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

    const wordCount = successData.content.split(/\s+/).length;

    // 9. Insert to DB
    const { data: newArticle, error: insertError } = await supabaseAdmin
      .from('blog_articles')
      .insert({
        slug,
        title: successData.title,
        meta_title: successData.title,
        meta_description: successData.meta_description,
        content: successData.content,
        excerpt: successData.excerpt,
        category: category,
        keyword_target: source_title,
        status: 'published',
        published_at: new Date().toISOString(),
        author_name: authorName,
        is_auto_generated: true,
        generation_prompt: userPrompt,
        reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, article: newArticle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Generate Blog Workspace Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
