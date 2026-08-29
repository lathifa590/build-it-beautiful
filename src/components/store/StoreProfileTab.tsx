import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreProfile } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';

const StoreProfileTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<Partial<StoreProfile> | null>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

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

      // Handle avatar upload
      if (avatarFile && user?.id) {
        const filePath = `${user.id}/avatar_${Date.now()}`;
        const url = await storeApi.uploadStoreAsset(filePath, avatarFile);
        if (url) finalAvatarUrl = url;
      }

      // Handle banner upload
      if (bannerFile && user?.id) {
        const filePath = `${user.id}/banner_${Date.now()}`;
        const url = await storeApi.uploadStoreAsset(filePath, bannerFile);
        if (url) finalBannerUrl = url;
      }

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
      setAvatarFile(null);
      setBannerFile(null);
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
          <div className="stat-label">Dilihat produk</div>
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
        <div className="card-head flex-col items-start gap-1">
          <h4 className="text-lg font-black text-[#111]">Profil & Identitas Toko</h4>
          <p className="text-sm font-semibold text-muted-foreground">Bangun identitas toko yang memiliki alamat publik sendiri di ModulAjar.</p>
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
            <label>Avatar Toko (1:1)</label>
            <div className="flex items-center gap-4 mt-1">
              {(avatarFile || editingProfile.avatar_url) && (
                <div className="w-16 h-16 rounded-full border-2 border-[#111] overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={avatarFile ? URL.createObjectURL(avatarFile) : editingProfile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-[#111] rounded-md bg-white hover:bg-gray-50 cursor-pointer w-max font-bold text-sm">
                  <Upload className="w-4 h-4" />
                  Pilih Gambar Avatar
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>Banner Desktop (3:1)</label>
            <div className="mt-1 space-y-3">
              {(bannerFile || editingProfile.banner_desktop_url) && (
                <div className="w-full h-32 rounded-lg border-2 border-[#111] overflow-hidden bg-gray-100">
                  <img 
                    src={bannerFile ? URL.createObjectURL(bannerFile) : editingProfile.banner_desktop_url} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-[#111] rounded-md bg-white hover:bg-gray-50 cursor-pointer w-max font-bold text-sm">
                <Upload className="w-4 h-4" />
                Pilih Gambar Banner
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files && setBannerFile(e.target.files[0])}
                />
              </label>
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
