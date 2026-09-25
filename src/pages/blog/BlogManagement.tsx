import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogArticle } from '@/types/blog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileEdit, Globe, Trash2, Megaphone, Eye, Calendar, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { BlogEditorModal } from './BlogEditorModal';

export default function BlogManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // For this initial version, since we don't have author_id in the table, 
  // we fetch all articles if user is admin, or we might just show all articles where author_name matches their name.
  // Actually, since RLS is open for authenticated users, we just show all articles.
  // In a multi-tenant app, we'd filter. But for now, we'll fetch them all.
  
  const { data: articles, isLoading } = useQuery({
    queryKey: ['my_blog_articles'],
    queryFn: async () => {
      if (!user) return [];

      // Dapatkan profil toko user untuk mengetahui nama author yang digunakan
      const { data: profile } = await supabase
        .from('modul_store_profiles')
        .select('store_name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      const possibleNames = [];
      if (profile?.store_name) possibleNames.push(profile.store_name);
      if (user.user_metadata?.full_name) possibleNames.push(user.user_metadata.full_name);

      // Jika tidak ada nama yang bisa dicocokkan, tampilkan kosong (hindari fallback "Tim Pengajar" milik semua orang)
      if (possibleNames.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .in('author_name', possibleNames)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogArticle[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Artikel berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['my_blog_articles'] });
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus artikel: ' + err.message);
    }
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-slate-900">
            <Megaphone className="w-8 h-8 text-primary" />
            Pemasaran & Blog SEO
          </h1>
          <p className="text-slate-500 mt-1">Kelola artikel pemasaran Anda yang dihasilkan oleh AI.</p>
        </div>
        
        <Button onClick={() => navigate('/app/workspace')} className="gap-2 shadow-sm font-bold">
          <Plus className="w-4 h-4" />
          Buat Artikel Baru
        </Button>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Daftar Artikel SEO</CardTitle>
          <CardDescription>Semua artikel yang terhubung dengan modul ajar Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Belum ada artikel</h3>
              <p className="text-slate-500 max-w-md mx-auto mt-2">Anda belum membuat artikel SEO apapun. Mulai hasilkan artikel promosi melalui Workspace Modul Ajar.</p>
              <Button onClick={() => navigate('/app/workspace')} variant="outline" className="mt-6 border-2">
                Buka Workspace
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[300px]">Judul Artikel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="line-clamp-1">{article.title}</span>
                          <a 
                            href={`/blog/${article.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                          >
                            <LinkIcon className="w-3 h-3" /> /blog/{article.slug}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {format(new Date(article.created_at || new Date()), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Eye className="w-4 h-4 text-slate-400" />
                          {article.view_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-2 text-xs"
                            onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Lihat
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-2 text-xs"
                            onClick={() => {
                              setEditingArticle(article);
                              setIsEditorOpen(true);
                            }}
                          >
                            <FileEdit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus artikel ini?')) {
                                deleteMutation.mutate(article.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog Editor Modal */}
      <BlogEditorModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        article={editingArticle}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['my_blog_articles'] })}
      />
    </div>
  );
}
