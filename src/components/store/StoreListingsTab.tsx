import React, { useState } from 'react';
import { Plus, Upload, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const StoreListingsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StoreListing>>({
    status: 'PUBLISHED',
  });
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ['storeListings', profile?.store_id],
    queryFn: () => storeApi.getStoreListings(profile!.store_id, false),
    enabled: !!profile?.store_id,
  });

  // Mutations
  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) throw new Error("Profil toko tidak ditemukan");
      
      let previewUrl = formData.url_preview;
      let originalUrl = formData.url_modul_ajar;

      // Handle Preview Upload
      if (previewFile) {
        const filePath = `${profile.store_id}/preview_${Date.now()}_${previewFile.name}`;
        const url = await storeApi.uploadStoreAsset(filePath, previewFile);
        if (url) previewUrl = url;
      }

      // Handle Original File Upload (Private Bucket)
      if (originalFile) {
        const filePath = `${profile.store_id}/original_${Date.now()}_${originalFile.name}`;
        const path = await storeApi.uploadStoreFile(filePath, originalFile);
        if (path) originalUrl = path;
      }

      const listingData = {
        ...formData,
        store_id: profile.store_id,
        url_preview: previewUrl,
        url_modul_ajar: originalUrl,
      };

      return storeApi.upsertListing(listingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeListings', profile?.store_id] });
      toast.success('Produk berhasil diterbitkan');
      setIsAddingNew(false);
      setFormData({ status: 'PUBLISHED' });
      setPreviewFile(null);
      setOriginalFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan produk');
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast.error('Judul, kategori, dan harga wajib diisi');
      return;
    }
    mutation.mutate();
  };

  if (isAddingNew) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="section-heading mb-0 border-none pb-0">Tambah Produk Baru</h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Isi detail modul ajar yang akan Anda jual secara eceran.</p>
          </div>
          <button className="btn-secondary" onClick={() => setIsAddingNew(false)} disabled={mutation.isPending}>
            Batal
          </button>
        </div>

        <div className="card">
          <div className="card-head">
            <h4 className="font-bold">Informasi Produk</h4>
          </div>
          <div className="card-body space-y-4 pt-4">
            <div className="field-group">
              <label>Judul Produk</label>
              <input 
                type="text" 
                placeholder="Misal: Modul Ajar Matematika Kelas 4" 
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="field-group">
              <label>Deskripsi</label>
              <textarea 
                placeholder="Jelaskan tentang produk Anda..." 
                rows={4}
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field-group">
                <label>Kategori</label>
                <select 
                  value={formData.category || ''}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Pilih Kategori</option>
                  <option value="SD">Modul Ajar SD</option>
                  <option value="SMP">Modul Ajar SMP</option>
                  <option value="SMA">Modul Ajar SMA</option>
                  <option value="UMUM">Umum / Lainnya</option>
                </select>
              </div>
              <div className="field-group">
                <label>Harga (Rp)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={formData.price || ''}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="field-group">
              <label>File Preview (Opsional) - PDF/Image</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-[#111] rounded-md bg-white hover:bg-gray-50 cursor-pointer font-bold text-sm">
                  <Upload className="w-4 h-4" />
                  {previewFile ? previewFile.name : 'Pilih File Preview'}
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setPreviewFile(e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">Bisa juga menggunakan link eksternal jika tidak ingin upload:</p>
              <input 
                type="text" 
                placeholder="Atau masukkan URL Google Drive..." 
                value={formData.url_preview || ''}
                onChange={e => setFormData({...formData, url_preview: e.target.value})}
                disabled={!!previewFile}
                className="mt-1"
              />
            </div>

            <div className="field-group mt-4">
              <label>File Dokumen Asli (.zip / .pdf)</label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-green-700 text-green-800 rounded-md bg-green-50 hover:bg-green-100 cursor-pointer font-bold text-sm">
                  <Upload className="w-4 h-4" />
                  {originalFile ? originalFile.name : 'Unggah File Jualan'}
                  <input 
                    type="file" 
                    accept=".zip,.pdf,.docx" 
                    className="hidden" 
                    onChange={(e) => e.target.files && setOriginalFile(e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">Bisa juga menggunakan link eksternal (Hanya terlihat oleh pembeli):</p>
              <input 
                type="text" 
                placeholder="Atau masukkan URL Google Drive privat..." 
                value={formData.url_modul_ajar || ''}
                onChange={e => setFormData({...formData, url_modul_ajar: e.target.value})}
                disabled={!!originalFile}
                className="mt-1"
              />
            </div>

            <div className="pt-6 mt-6 border-t-2 border-[#111]">
              <button 
                className="btn-simpan w-full md:w-auto" 
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Menyimpan...' : 'Simpan & Terbitkan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="section-heading mb-0 border-none pb-0">Katalog Produk</h3>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Kelola Modul Ajar dan produk yang Anda jual di marketplace.</p>
        </div>
        <button className="btn-simpan flex items-center gap-2" onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>
      
      {isLoading ? (
        <div>Memuat katalog...</div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(item => (
            <div key={item.listing_id} className="card overflow-hidden flex flex-col">
              <div className="h-40 bg-[#f5f0e8] border-b-2 border-[#111] flex items-center justify-center p-4 text-center relative">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-12 h-12 text-[#111] opacity-20" />
                )}
                {item.status === 'PUBLISHED' ? (
                  <span className="absolute top-2 right-2 bg-green-100 text-green-800 border-2 border-green-800 text-xs font-bold px-2 py-1 rounded">Aktif</span>
                ) : (
                  <span className="absolute top-2 right-2 bg-gray-100 text-gray-800 border-2 border-gray-800 text-xs font-bold px-2 py-1 rounded">Draf</span>
                )}
              </div>
              <div className="card-body p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-lg leading-tight mb-1">{item.title}</h4>
                <p className="text-xs font-bold text-muted-foreground mb-3">{item.category}</p>
                <div className="mt-auto">
                  <div className="text-xl font-black text-[#c04a1a]">Rp{item.price.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-[#111]" />
            </div>
            <h4 className="text-lg font-black mb-1">Belum ada produk</h4>
            <p className="text-sm font-semibold text-muted-foreground mb-4 max-w-sm">
              Anda belum mengunggah produk apapun. Mulai bagikan modul ajar Anda ke publik sekarang.
            </p>
            <button className="btn-secondary" onClick={() => setIsAddingNew(true)}>
              Tambah Produk Pertama
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreListingsTab;
