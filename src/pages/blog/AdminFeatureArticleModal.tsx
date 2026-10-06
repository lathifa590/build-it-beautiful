import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Wand2, Sparkles } from 'lucide-react';
import { BlogArticle } from '@/types/blog';

interface AdminFeatureArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (draft: Partial<BlogArticle>) => void;
}

const PREDEFINED_FEATURES = [
  "Generator Modul Ajar AI Terintegrasi",
  "Export RPP & Modul ke format Word/PDF/Excel",
  "Generator Bank Soal & Rubrik Penilaian",
  "Prota & Promes Generator",
  "Mode Cepat (Pembuatan Modul Instan)",
  "Integrasi Kurikulum Berbasis Cinta (KBC)"
];

export const AdminFeatureArticleModal = ({ isOpen, onClose, onGenerated }: AdminFeatureArticleModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);

  const handleGenerate = async (topic: string) => {
    if (!topic.trim()) {
      toast.error('Topik tidak boleh kosong');
      return;
    }

    try {
      setIsGenerating(true);
      setLoadingTopic(topic);
      
      const { data, error } = await supabase.functions.invoke('generate-promo-article', {
        body: { topic }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.data) {
        toast.success('Draf artikel berhasil dibuat oleh AI!');
        onGenerated({
          title: data.data.title,
          excerpt: data.data.excerpt,
          content: data.data.content,
          status: 'draft',
          category: 'Fitur',
        });
        onClose();
      } else {
        throw new Error('Respon AI tidak valid.');
      }
    } catch (err: any) {
      console.error('Error generating article:', err);
      toast.error(err.message || 'Gagal menghasilkan artikel.');
    } finally {
      setIsGenerating(false);
      setLoadingTopic(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isGenerating && onClose()}>
      <DialogContent className="max-w-3xl flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-slate-50/80">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Promo Generator (Admin Only)
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Daftar Fitur Unggulan</h3>
              <p className="text-sm text-slate-500">Pilih salah satu fitur di bawah ini untuk dibuatkan artikel promosi otomatis.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREDEFINED_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-2 gap-1.5 flex-shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => handleGenerate(feature)}
                    disabled={isGenerating}
                  >
                    {loadingTopic === feature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Buat
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Topik Bebas (Custom Topic)</h3>
              <p className="text-sm text-slate-500">Buat artikel berdasarkan topik spesifik atau masalah tertentu yang dihadapi guru.</p>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="custom-topic">Topik atau Nama Fitur Baru</Label>
                <Input 
                  id="custom-topic" 
                  placeholder="Misal: Cara mengatasi kejenuhan siswa dengan AI..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <Button 
                onClick={() => handleGenerate(customTopic)}
                disabled={isGenerating || !customTopic.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loadingTopic === customTopic ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Proses...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Generate</>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/80">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
