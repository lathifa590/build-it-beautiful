import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BlogArticle } from '@/types/blog';
import { SEOHead } from '@/components/seo/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Calendar, Clock, ChevronLeft, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';

export default function BlogDetail() {
  const { slug } = useParams();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['blog_article', slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data as BlogArticle;
    },
    enabled: !!slug
  });

  // Track view count (simple implementation, fire and forget)
  useEffect(() => {
    if (article && article.id) {
      const incrementView = async () => {
        // We use rpc or just an update. Since RLS might block direct update of view_count for anon,
        // we might need an edge function or a secure RPC. 
        // For now, we'll skip direct update to avoid RLS errors on public read, 
        // or we assume there's a trigger/rpc for it later.
      };
      incrementView();
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-32 pb-20 container mx-auto px-4 max-w-3xl">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-200 rounded-lg w-3/4 mb-6" />
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-12" />
            <div className="h-64 bg-slate-200 rounded-xl mb-12" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return <Navigate to="/blog" replace />;
  }

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://modulajar.online/blog/${article.slug}`
    },
    "headline": article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.featured_image_url || "https://modulajar.online/og-image.png",  
    "author": {
      "@type": "Person",
      "name": article.author_name
    },  
    "publisher": {
      "@type": "Organization",
      "name": "ModulAjar.Online",
      "logo": {
        "@type": "ImageObject",
        "url": "https://modulajar.online/logo.png"
      }
    },
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Fallback could be a toast notification
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title={article.meta_title || `${article.title} | Blog ModulAjar`}
        description={article.meta_description || article.excerpt || ""}
        canonical={`/blog/${article.slug}`}
        schema={JSON.stringify(schemaJson)}
      />
      
      <Navbar />

      <main className="pt-32 pb-20">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Back button */}
          <Link to="/blog" className="inline-flex items-center text-indigo-600 font-medium mb-8 hover:text-indigo-700 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Blog
          </Link>

          {/* Article Header */}
          <header className="mb-10 text-center md:text-left">
            {article.category && (
              <div className="mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-full text-sm">
                  {article.category}
                </span>
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
              <span className="font-medium text-slate-700">
                Oleh {article.author_name}
              </span>
              <span className="hidden sm:inline">•</span>
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(article.published_at), 'd MMMM yyyy', { locale: id })}
                </span>
              )}
              <span className="hidden sm:inline">•</span>
              {article.reading_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.reading_time_minutes} menit baca
                </span>
              )}
              
              <div className="w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0">
                <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full text-slate-600">
                  <Share2 className="w-4 h-4 mr-2" /> Bagikan
                </Button>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image_url && (
            <figure className="mb-12 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <img 
                src={article.featured_image_url} 
                alt={article.title} 
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </figure>
          )}

          {/* Article Content - rendered with tailwind typography plugin (prose) */}
          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-img:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
          
          <hr className="my-12 border-slate-200" />
          
          <div className="bg-indigo-50 rounded-2xl p-8 text-center max-w-2xl mx-auto border border-indigo-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Suka dengan artikel ini?</h3>
            <p className="text-slate-600 mb-6">
              Cobalah generator Modul Ajar dan RPP otomatis kami. Hemat waktu Anda dan buat perangkat ajar berkualitas hanya dalam hitungan menit.
            </p>
            <Link to="/app">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                Coba ModulAjar.Online Gratis
              </Button>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
