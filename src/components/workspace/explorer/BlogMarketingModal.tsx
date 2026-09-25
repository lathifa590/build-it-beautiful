import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Store, Link2, Loader2, CheckCircle2 } from 'lucide-react';

interface BlogMarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'semester' | 'topic' | 'meeting';
  sourceId: string;
  sourceTitle: string;
}

export const BlogMarketingModal = ({ isOpen, onClose, sourceType, sourceId, sourceTitle }: BlogMarketingModalProps) => {
  const { user } = useAuth();
  const [ctaType, setCtaType] = useState<'store' | 'custom'>('store');
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch Store Profile to get Store ID
  const { data: profile } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id && isOpen,
  });

  // Fetch Store Listings
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['storeListings', profile?.store_id],
    queryFn: () => storeApi.getStoreListings(profile!.store_id, false),
    enabled: !!profile?.store_id && isOpen,
  });

  const handleGenerate = async () => {
    let targetUrl = '';

    if (ctaType === 'store') {
      if (!selectedListingId) {
        toast.error('Pilih produk toko terlebih dahulu.');
        return;
      }
      const baseUrl = window.location.origin;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      targetUrl = isLocalhost 
        ? `${baseUrl}/store/item/${selectedListingId}`
        : `https://modulajar.online/store/item/${selectedListingId}`;
    } else {
      if (!customUrl || !customUrl.startsWith('http')) {
        toast.error('Masukkan URL tujuan yang valid (harus diawali http/https).');
        return;
      }
      targetUrl = customUrl;
    }

    try {
      setIsGenerating(true);
      toast.info('Sedang menganalisis konten dan membuat artikel SEO...');
      
      const { data, error } = await supabase.functions.invoke('generate-blog-from-workspace', {
        body: { 
          source_type: sourceType,
          source_id: sourceId,
          source_title: sourceTitle,
          target_url: targetUrl 
        }
      });

      if (error) throw error;

      toast.success('Artikel SEO berhasil dibuat!', {
        description: data.article?.title || 'Artikel telah diterbitkan ke blog.',
        action: data.article?.slug ? {
          label: 'Lihat',
          onClick: () => window.open(`/blog/${data.article.slug}`, '_blank')
        } : undefined
      });
      
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal membuat artikel', {
        description: err.message || 'Terjadi kesalahan sistem.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isGenerating && onClose()}>
      <DialogContent className="max-w-4xl h-[100dvh] md:h-auto md:max-h-[85vh] p-0 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Newspaper className="w-6 h-6 text-primary" />
              Promosi via Blog SEO
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Buat artikel blog otomatis menggunakan AI berdasarkan materi <strong className="text-foreground">{sourceTitle}</strong> untuk menarik traffic Google.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-6">
            
            {/* CTA Type Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pilih Tujuan Tautan (Call-to-Action)</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={ctaType === 'store' ? 'default' : 'outline'}
                  className={`flex-1 h-12 text-sm sm:text-base ${ctaType === 'store' ? 'border-2 border-primary' : 'border-2'}`}
                  onClick={() => setCtaType('store')}
                >
                  <Store className="w-5 h-5 mr-2" />
                  Produk Toko Saya
                </Button>
                <Button
                  type="button"
                  variant={ctaType === 'custom' ? 'default' : 'outline'}
                  className={`flex-1 h-12 text-sm sm:text-base ${ctaType === 'custom' ? 'border-2 border-primary' : 'border-2'}`}
                  onClick={() => setCtaType('custom')}
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  Tautan Bebas
                </Button>
              </div>
            </div>

            {/* Content Selection */}
            {ctaType === 'store' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Pilih Produk untuk Diiklankan</Label>
                
                {listingsLoading ? (
                  <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat etalase toko...
                  </div>
                ) : !profile ? (
                  <div className="text-sm text-red-500 font-medium bg-red-50 p-4 rounded-xl border border-red-200">
                    Anda belum membuka toko. Silakan buka toko terlebih dahulu atau gunakan opsi Tautan Bebas.
                  </div>
                ) : listings && listings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map(item => {
                      const isSelected = selectedListingId === item.listing_id;
                      return (
                        <div 
                          key={item.listing_id}
                          onClick={() => setSelectedListingId(item.listing_id)}
                          className={`relative flex flex-col rounded-xl p-3 cursor-pointer transition-all border-2
                            ${isSelected 
                              ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                              : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 z-10 bg-primary text-white rounded-full">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                          
                          <div className="aspect-video w-full bg-slate-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
                            {item.preview_image_url ? (
                              <img src={item.preview_image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-10 h-10 text-slate-300" />
                            )}
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-between">
                            <h4 className="font-bold text-sm leading-snug line-clamp-2 text-foreground mb-2">
                              {item.title}
                            </h4>
                            <p className="text-sm font-black text-primary">
                              Rp {(item.price_amount || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
                    Anda belum mengunggah produk di toko. Silakan upload produk terlebih dahulu atau gunakan opsi Tautan Bebas.
                  </div>
                )}
              </div>
            )}

            {ctaType === 'custom' && (
              <div className="space-y-3 bg-white p-5 rounded-xl border-2 border-border shadow-sm">
                <Label className="text-base font-semibold">URL Tujuan / Link Download</Label>
                <Input 
                  type="url" 
                  className="h-12 border-2 text-base"
                  placeholder="https://drive.google.com/..." 
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tautan ini akan disisipkan di akhir artikel blog (sebagai tombol "Download" atau "Beli"). Pastikan tautan valid dan dapat diakses oleh publik.
                </p>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-background">
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-11 border-2" onClick={onClose} disabled={isGenerating}>Batal</Button>
            <Button 
              className="w-full sm:w-auto h-12 sm:h-11 shadow-md font-bold"
              onClick={handleGenerate} 
              disabled={isGenerating || (ctaType === 'store' && (!profile || !selectedListingId))}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Sedang Menulis...
                </>
              ) : (
                'Generate Artikel SEO Sekarang'
              )}
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
};
