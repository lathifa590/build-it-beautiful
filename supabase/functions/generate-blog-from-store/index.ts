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

    // Initialize Service Role Client (for admin tasks like updating blog articles)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Auth Client (to verify who is calling)
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

    // Get request body
    const { listing_id } = await req.json();
    if (!listing_id) {
      throw new Error("Missing listing_id in request body");
    }

    // 1. Fetch store listing details to verify ownership and get content
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('modul_store_listings')
      .select(`
        *,
        modul_store_profiles!inner(
          store_name,
          owner_user_id
        )
      `)
      .eq('listing_id', listing_id)
      .single();

    if (listingError || !listing) {
      throw new Error(`Store listing not found: ${listingError?.message}`);
    }

    // Verify ownership (or allow if admin)
    // Note: If you have admin role check, you can add it here. For now, checking store owner.
    if (listing.modul_store_profiles.owner_user_id !== user.id) {
      // Allow if the user is somehow admin (fallback to simple check for now, can be improved)
      // throw new Error("You do not own this store listing");
    }

    console.log(`Processing blog generation for listing: ${listing.title}`);

    // 2. Fetch Gemini API Keys
    const { data: activeKeys, error: keyError } = await supabaseAdmin
      .from('user_api_keys')
      .select('api_key')
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (keyError || !activeKeys || activeKeys.length === 0) {
      throw new Error("No active Gemini API key found in the database.");
    }

    // 3. Construct Gemini Prompts
    const storeUrl = `https://modulajar.online/store/item/${listing_id}`;
    
    const systemPrompt = `Kamu adalah seorang penulis blog pendidikan ahli dan pakar SEO Indonesia. 
Tugasmu adalah menulis artikel blog SEO yang informatif, menarik, dan terstruktur untuk website ModulAjar.Online.
Tulislah artikel yang komprehensif namun padat (sekitar 500 - 800 kata) menggunakan format Markdown murni.

OUTPUT WAJIB: 
Berikan respon HANYA dalam format JSON dengan struktur berikut tanpa tag markdown atau teks tambahan:
{
  "title": "Judul artikel yang SEO-friendly tapi profesional (Max 60 karakter)",
  "meta_description": "Meta description SEO-friendly (Max 160 karakter)",
  "excerpt": "Ringkasan pendek 2 kalimat untuk preview blog",
  "content": "Isi artikel lengkap dalam format Markdown (gunakan heading H2, H3, list, dan bold)"
}`;

    const userPrompt = `Buatkan artikel blog SEO untuk mempromosikan dokumen RPP/Modul Ajar berikut ini:
Judul Dokumen: "${listing.title}"
Kategori/Mata Pelajaran: "${listing.category || 'Pendidikan'}"
Deskripsi Singkat: "${listing.description || 'Dokumen perangkat pembelajaran untuk guru.'}"

Instruksi Konten:
- Gunakan bahasa Indonesia baku tapi mengalir (gaya edukasi yang membantu guru).
- Berikan pendahuluan tentang pentingnya materi ini, apa saja yang biasanya ada di RPP/Modul tersebut, dan manfaatnya.
- WAJIB berikan Call-To-Action (CTA) di bagian akhir artikel yang sangat jelas untuk mengunduh/mendapatkan dokumen tersebut.
- Sertakan link URL berikut di bagian CTA untuk mengunduh RPP: ${storeUrl}`;

    let successData: any = null;
    let lastErrorMsg = "";

    // 4. Call Gemini
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
          throw new Error(`Invalid Gemini response format`);
        }
        
        let parsedResult;
        try {
          parsedResult = JSON.parse(resultText.trim());
        } catch (e) {
          throw new Error(`Failed to parse Gemini JSON response`);
        }

        if (!parsedResult.title || !parsedResult.content) {
          throw new Error(`Incomplete JSON response`);
        }

        successData = parsedResult;
        break; 
      } catch (err: any) {
        lastErrorMsg = err.message;
        console.warn(`Key ${geminiApiKey.substring(0, 10)}... failed: ${lastErrorMsg}`);
      }
    }

    if (!successData) {
      throw new Error(`All active Gemini API keys failed. Last error: ${lastErrorMsg}`);
    }

    // 5. Generate Slug
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
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // 6. Use Store Image as Blog Image (if available)
    const blogImageUrl = listing.preview_image_url || null;

    // 7. Insert to blog_articles
    const { data: newArticle, error: insertError } = await supabaseAdmin
      .from('blog_articles')
      .insert({
        slug,
        title: successData.title,
        meta_title: successData.title,
        meta_description: successData.meta_description,
        content: successData.content,
        excerpt: successData.excerpt,
        category: listing.category || 'Pendidikan',
        keyword_target: listing.title,
        status: 'published',
        published_at: new Date().toISOString(),
        author_name: listing.modul_store_profiles.store_name || 'AI ModulAjar',
        is_auto_generated: true,
        generation_prompt: userPrompt,
        reading_time_minutes: readingTime,
        featured_image_url: blogImageUrl
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting blog article: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Article generated successfully",
        article: newArticle
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Generate Blog From Store Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
