import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreProfile } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Link, ExternalLink } from 'lucide-react';

const StoreProfileTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<Partial<StoreProfile> | null>(null);
  


  // Queries
  const { data: profile, isLoading } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  // Effect to sync remote profile to local edit state
  React.useEffect(() => {
    if (profile && !editingProfile) {
      setEditingProfile(profile);
    } else if (!profile && !isLoading && !editingProfile) {
      setEditingProfile({
        owner_user_id: user?.id,
        status: 'ACTIVE',
        primary_color: '#c04a1a'
      });
    }
  }, [profile, isLoading, editingProfile, user?.id]);

  // Mutations
  const mutation = useMutation({
    mutationFn: async (updatedProfile: Partial<StoreProfile>) => {
      let finalAvatarUrl = updatedProfile.avatar_url;
      let finalBannerUrl = updatedProfile.banner_desktop_url;



      const dataToSave = { 
        ...updatedProfile, 
        avatar_url: finalAvatarUrl,
        banner_desktop_url: finalBannerUrl
      };

      return storeApi.upsertStoreProfile(dataToSave);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['storeProfile', user?.id], data);
      setEditingProfile(data);
      toast.success('Profil toko berhasil disimpan');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan profil');
    }
  });

  const handleSave = () => {
    if (!editingProfile?.store_name || !editingProfile?.store_slug) {
      toast.error('Nama dan URL Publik Toko wajib diisi');
      return;
    }
    const slug = editingProfile.store_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    mutation.mutate({ ...editingProfile, store_slug: slug });
  };

  if (isLoading || !editingProfile) return <div>Memuat profil...</div>;

  return (
    <div className="space-y-6">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Kunjungan toko</div>
          <div className="stat-value">{profile?.metrics?.views || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dilihat modul ajar</div>
          <div className="stat-value">{profile?.metrics?.clicks || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Penjualan selesai</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendapatan</div>
          <div className="stat-value">Rp0</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head flex-col items-start gap-3 md:flex-row md:items-center justify-between">
          <div>
            <h4 className="text-lg font-black text-[#111]">Profil & Identitas Toko</h4>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Bangun identitas toko yang memiliki alamat publik sendiri di ModulAjar.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const baseUrl = window.location.origin;
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const storeUrl = isLocalhost 
                  ? `${baseUrl}/store/${editingProfile.store_slug || ''}`
                  : `https://modulajar.id/store/${editingProfile.store_slug || ''}`;
                  
                window.open(storeUrl, '_blank');
              }}
              title="Kunjungi Toko"
              className="flex items-center justify-center p-1.5 bg-[#f5f0e8] border-2 border-[#111] rounded-md hover:bg-[#e8e0d0] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const baseUrl = window.location.origin;
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const storeUrl = isLocalhost 
                  ? `${baseUrl}/store/${editingProfile.store_slug || ''}`
                  : `https://modulajar.id/store/${editingProfile.store_slug || ''}`;
                  
                navigator.clipboard.writeText(storeUrl);
                toast.success('Link toko berhasil disalin!');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold bg-[#f5f0e8] border-2 border-[#111] rounded-md hover:bg-[#e8e0d0] transition-colors whitespace-nowrap"
            >
              <Link className="w-4 h-4" />
              Bagikan Toko
            </button>
          </div>
        </div>
        <div className="card-body space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field-group">
              <label htmlFor="store_name">Nama Toko</label>
              <input 
                id="store_name" 
                type="text"
                placeholder="Misal: Edu Digital" 
                value={editingProfile.store_name || ''} 
                onChange={(e) => setEditingProfile({...editingProfile, store_name: e.target.value})}
              />
            </div>
            <div className="field-group">
              <label htmlFor="store_slug">Alamat Publik (URL Slug)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border-2 border-r-0 border-[#111] bg-muted text-muted-foreground text-sm font-semibold h-[44px]">
                  modulajar.id/store/
                </span>
                <input 
                  id="store_slug" 
                  type="text"
                  className="rounded-l-none"
                  placeholder="edudigital" 
                  value={editingProfile.store_slug || ''} 
                  onChange={(e) => setEditingProfile({...editingProfile, store_slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="tagline">Tagline</label>
            <input 
              id="tagline" 
              type="text"
              placeholder="Modul Ajar dan perangkat pendidikan terbaik" 
              value={editingProfile.tagline || ''} 
              onChange={(e) => setEditingProfile({...editingProfile, tagline: e.target.value})}
            />
          </div>

          <div className="field-group">
            <label htmlFor="description">Deskripsi Toko</label>
            <textarea 
              id="description" 
              placeholder="Jelaskan tentang toko Anda..." 
              value={editingProfile.description || ''} 
              onChange={(e) => setEditingProfile({...editingProfile, description: e.target.value})}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field-group">
              <label>Kategori Utama</label>
              <select value={editingProfile.category || ''} onChange={(e) => setEditingProfile({...editingProfile, category: e.target.value})}>
                <option value="" disabled>Pilih Kategori</option>
                <option value="SD">Modul Ajar SD</option>
                <option value="SMP">Modul Ajar SMP</option>
                <option value="SMA">Modul Ajar SMA</option>
                <option value="Umum">Umum / Lainnya</option>
              </select>
            </div>
            
            <div className="field-group">
              <label>Warna Utama</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  className="w-16 h-[44px] p-1 border-2 border-[#111] rounded-md" 
                  value={editingProfile.primary_color || '#c04a1a'} 
                  onChange={(e) => setEditingProfile({...editingProfile, primary_color: e.target.value})}
                />
                <input 
                  type="text"
                  value={editingProfile.primary_color || '#c04a1a'} 
                  onChange={(e) => setEditingProfile({...editingProfile, primary_color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="field-group pt-4">
            <label>URL Gambar Avatar Toko (1:1)</label>
            <div className="flex items-center gap-4 mt-1">
              {editingProfile.avatar_url && (
                <div className="w-16 h-16 rounded-full border-2 border-[#111] overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={editingProfile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Avatar';
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="url"
                  placeholder="Masukkan URL gambar avatar..."
                  value={editingProfile.avatar_url || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, avatar_url: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>URL Banner Desktop (3:1)</label>
            <div className="mt-1 space-y-3">
              {editingProfile.banner_desktop_url && (
                <div className="w-full h-32 rounded-lg border-2 border-[#111] overflow-hidden bg-gray-100">
                  <img 
                    src={editingProfile.banner_desktop_url} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/900x300?text=Banner';
                    }}
                  />
                </div>
              )}
              <input 
                type="url"
                placeholder="Masukkan URL gambar banner..."
                value={editingProfile.banner_desktop_url || ''}
                onChange={(e) => setEditingProfile({...editingProfile, banner_desktop_url: e.target.value})}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="field-group">
            <label>Status Toko</label>
            <select value={editingProfile.status || 'ACTIVE'} onChange={(e) => setEditingProfile({...editingProfile, status: e.target.value as any})}>
              <option value="ACTIVE">Publik (Dapat diakses)</option>
              <option value="PRIVAT">Privat (Hanya Saya)</option>
            </select>
          </div>

          <div className="pt-6 border-t-2 border-[#111] mt-6">
            <button onClick={handleSave} disabled={mutation.isPending} className="btn-simpan w-full md:w-auto">
              {mutation.isPending ? 'Menyimpan...' : 'Simpan Profil Toko'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileTab;
