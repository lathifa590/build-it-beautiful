import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BlogArticle } from '@/types/blog';
import { SEOHead } from '@/components/seo/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function BlogIndex() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['blog_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as BlogArticle[];
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SEOHead 
        title="Blog & Inspirasi Mengajar | ModulAjar.Online"
        description="Kumpulan artikel, tips, dan informasi terbaru seputar Kurikulum Merdeka, Kurikulum Berbasis Cinta (KBC), dan pemanfaatan AI dalam pendidikan."
        canonical="/blog"
      />
      
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              Blog & Inspirasi Mengajar
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Berita terbaru, panduan mengajar, dan tips memanfaatkan teknologi untuk pendidikan yang lebih baik.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-xl mb-4" />
                  <div className="w-24 h-6 bg-slate-200 rounded-full mb-4" />
                  <div className="w-full h-6 bg-slate-200 rounded mb-2" />
                  <div className="w-3/4 h-6 bg-slate-200 rounded mb-4" />
                  <div className="w-full h-16 bg-slate-200 rounded mb-4" />
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link to={`/blog/${article.slug}`} key={article.id} className="group">
                  <article className="bg-white rounded-2xl h-full flex flex-col overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    {article.featured_image_url ? (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={article.featured_image_url} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center">
                        <span className="text-indigo-300 font-medium text-lg">ModulAjar.Online</span>
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        {article.category && (
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-full">
                            {article.category}
                          </span>
                        )}
                        {article.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(article.published_at), 'd MMM yyyy', { locale: id })}
                          </span>
                        )}
                        {article.reading_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {article.reading_time_minutes} mnt
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      
                      <p className="text-slate-600 mb-6 line-clamp-3 text-sm flex-grow">
                        {article.excerpt}
                      </p>
                      
                      <div className="mt-auto flex items-center text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                        Baca selengkapnya <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Belum ada artikel</h3>
              <p className="text-slate-500">Artikel sedang dipersiapkan. Silakan kembali lagi nanti.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
