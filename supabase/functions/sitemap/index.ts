import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = 'https://modulajar.online';

const STATIC_ROUTES = [
  '/',
  '/generator-modul-ajar',
  '/generator-rpp',
  '/generator-lkpd',
  '/generator-asesmen',
  '/kurikulum-merdeka',
  '/kurikulum-kbc',
  '/rpp-madrasah',
  '/modul-ajar-mi',
  '/modul-ajar-mts',
  '/modul-ajar-ma',
  '/blog',
  '/auth'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    let dynamicUrls: string[] = [];
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch published blog articles
      const { data: articles, error } = await supabase
        .from('blog_articles')
        .select('slug, updated_at')
        .eq('status', 'published');
        
      if (!error && articles) {
        dynamicUrls = articles.map(article => 
          `<url>
            <loc>${BASE_URL}/blog/${article.slug}</loc>
            <lastmod>${new Date(article.updated_at || new Date()).toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>`
        );
      }
    }

    const staticUrls = STATIC_ROUTES.map(route => 
      `<url>
        <loc>${BASE_URL}${route}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>${route === '/' ? '1.0' : '0.9'}</priority>
      </url>`
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.join('\n  ')}
  ${dynamicUrls.join('\n  ')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      },
    });
  } catch (error: any) {
    console.error("Error generating sitemap:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
