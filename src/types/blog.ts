export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  content: string;
  excerpt?: string;
  category?: string;
  keyword_target?: string;
  keyword_secondary?: string[];
  status: ArticleStatus;
  featured_image_url?: string;
  author_name: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_auto_generated: boolean;
  reading_time_minutes?: number;
  view_count: number;
}
