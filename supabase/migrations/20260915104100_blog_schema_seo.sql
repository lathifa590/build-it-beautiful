-- Migration: Blog System & SEO Queues Schema

-- 1. Create ENUMs
CREATE TYPE article_status AS ENUM ('draft', 'published', 'scheduled');
CREATE TYPE queue_status AS ENUM ('queued', 'processing', 'done', 'failed');

-- 2. Create blog_articles table
CREATE TABLE public.blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT,
    keyword_target TEXT,
    keyword_secondary TEXT[],
    status article_status DEFAULT 'draft',
    featured_image_url TEXT,
    author_name TEXT DEFAULT 'Tim ModulAjar',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_auto_generated BOOLEAN DEFAULT false,
    generation_prompt TEXT,
    reading_time_minutes INT,
    view_count INT DEFAULT 0,
    internal_links_injected BOOLEAN DEFAULT false
);

-- 3. Create seo_keyword_queue table
CREATE TABLE public.seo_keyword_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    keyword_secondary TEXT[],
    category TEXT,
    priority INT DEFAULT 2, -- 1 = tinggi, 2 = normal
    status queue_status DEFAULT 'queued',
    article_id UUID REFERENCES public.blog_articles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create cron_job_logs table
CREATE TABLE public.cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Indexes for performance
CREATE INDEX idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category);
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX idx_seo_keyword_queue_status_priority ON public.seo_keyword_queue(status, priority);

-- 6. Row Level Security (RLS)
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keyword_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- blog_articles policies
CREATE POLICY "Public can read published articles" 
    ON public.blog_articles FOR SELECT 
    USING (status = 'published');

CREATE POLICY "Admins can manage articles" 
    ON public.blog_articles FOR ALL 
    USING (auth.role() = 'authenticated');

-- seo_keyword_queue & cron_job_logs policies: only authenticated (admins)
CREATE POLICY "Admins can manage keyword queue" 
    ON public.seo_keyword_queue FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage cron logs" 
    ON public.cron_job_logs FOR ALL 
    USING (auth.role() = 'authenticated');

-- 7. Insert Seed Data
INSERT INTO public.seo_keyword_queue (keyword, category, priority) VALUES
-- Priority 1: Kurikulum Merdeka
('cara membuat modul ajar Kurikulum Merdeka', 'Modul Ajar', 1),
('contoh RPP Kurikulum Merdeka SD', 'RPP', 1),
('contoh RPP Kurikulum Merdeka SMP', 'RPP', 1),
('cara membuat LKPD yang menarik', 'LKPD', 1),
('asesmen formatif Kurikulum Merdeka', 'Asesmen', 1),
('perbedaan RPP dan modul ajar', 'Tips Guru', 1),
('aplikasi membuat RPP otomatis gratis', 'RPP', 1),
('contoh modul ajar bahasa Indonesia SD', 'Modul Ajar', 1),
('download modul ajar matematika SMP', 'Modul Ajar', 1),
('perangkat ajar Kurikulum Merdeka semua mapel', 'Modul Ajar', 1),

-- Priority 1: KBC & Madrasah
('cara membuat modul ajar KBC madrasah', 'Modul Ajar', 1),
('contoh RPP KBC MI kelas 1 2 3 4 5 6', 'RPP', 1),
('contoh RPP KBC MTs', 'RPP', 1),
('contoh RPP KBC MA', 'RPP', 1),
('perbedaan KBC dan Kurikulum Merdeka', 'Tips Guru', 1),
('Kurikulum Berbasis Cinta Kemenag adalah', 'Tips Guru', 1),
('aplikasi generator RPP madrasah KBC', 'RPP', 1),
('modul ajar PAI Kurikulum KBC', 'Modul Ajar', 1),
('download RPP KBC gratis semua mapel madrasah', 'RPP', 1),
('perangkat ajar madrasah KBC otomatis AI', 'Modul Ajar', 1),
('contoh modul ajar Akidah Akhlak KBC MI', 'Modul Ajar', 1),
('contoh modul ajar Al-Quran Hadis KBC MTs', 'Modul Ajar', 1),
('contoh modul ajar Fikih KBC MA', 'Modul Ajar', 1),
('contoh modul ajar SKI (Sejarah Kebudayaan Islam) KBC', 'Modul Ajar', 1),
('contoh modul ajar Bahasa Arab KBC madrasah', 'Modul Ajar', 1),
('RPP tematik MI KBC kelas 1', 'RPP', 1),
('RPP Matematika MI KBC', 'RPP', 1),
('RPP IPA MTs KBC', 'RPP', 1),
('RPP Bahasa Indonesia MA KBC', 'RPP', 1),

-- Priority 2: Kurikulum Merdeka
('cara menggunakan AI untuk membuat RPP', 'Tips Guru', 2),
('contoh asesmen diagnostik Kurikulum Merdeka', 'Asesmen', 2),
('LKPD interaktif Kurikulum Merdeka', 'LKPD', 2),
('tips guru membuat perangkat ajar cepat', 'Tips Guru', 2),

-- Priority 2: KBC & Madrasah
('apa itu KBC Kemenag penjelasan lengkap', 'Tips Guru', 2),
('implementasi KBC di madrasah', 'Tips Guru', 2),
('komponen modul ajar KBC madrasah', 'Modul Ajar', 2),
('asesmen KBC madrasah formatif sumatif', 'Asesmen', 2),
('LKPD KBC madrasah', 'LKPD', 2),
('tips membuat RPP KBC cepat untuk guru madrasah', 'Tips Guru', 2),
('perbedaan modul ajar KBC dan RPP lama', 'Tips Guru', 2),
('struktur modul ajar KBC yang benar', 'Modul Ajar', 2);
