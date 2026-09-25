import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BlogArticle, ArticleStatus } from '@/types/blog';
import { Loader2 } from 'lucide-react';

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: BlogArticle | null;
  onSuccess: () => void;
}

export const BlogEditorModal = ({ isOpen, onClose, article, onSuccess }: BlogEditorModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BlogArticle>>({});

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        category: article.category || '',
        status: article.status || 'draft',
        featured_image_url: article.featured_image_url || '',
      });
    }
  }, [article, isOpen]);

  const handleChange = (field: keyof BlogArticle, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!article) return;
    
    if (!formData.title?.trim() || !formData.slug?.trim() || !formData.content?.trim()) {
      toast.error('Judul, Slug, dan Konten tidak boleh kosong.');
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('blog_articles')
        .update({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          content: formData.content,
          excerpt: formData.excerpt?.trim() || null,
          category: formData.category?.trim() || null,
          status: formData.status as ArticleStatus,
          featured_image_url: formData.featured_image_url?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (error) {
        if (error.code === '23505') { // unique_violation
          throw new Error('Slug sudah digunakan oleh artikel lain.');
        }
        throw error;
      }

      toast.success('Artikel berhasil diperbarui!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating article:', err);
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-slate-50/80">
          <DialogTitle className="text-xl font-bold">Edit Artikel Blog</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Artikel <span className="text-red-500">*</span></Label>
              <Input 
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Masukkan judul artikel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug / URL <span className="text-red-500">*</span></Label>
              <Input 
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="contoh-slug-artikel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input 
                id="category"
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Mis: Edukasi, Tips"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => handleChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">URL Gambar Utama</Label>
              <Input 
                id="image"
                value={formData.featured_image_url || ''}
                onChange={(e) => handleChange('featured_image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Ringkasan (Excerpt)</Label>
            <Textarea 
              id="excerpt"
              value={formData.excerpt || ''}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="Tulis ringkasan singkat artikel di sini..."
              rows={3}
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col h-full">
            <Label htmlFor="content">Konten (Markdown didukung) <span className="text-red-500">*</span></Label>
            <Textarea 
              id="content"
              value={formData.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Tulis konten artikel Anda di sini..."
              className="flex-1 min-h-[300px] font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-slate-50/80">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
