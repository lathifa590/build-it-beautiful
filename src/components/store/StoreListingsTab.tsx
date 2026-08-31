import React, { useState } from 'react';
import { Plus, Upload, FileText, Download, Edit, Copy, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreListingEditModal } from './StoreListingEditModal';

const StoreListingsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState<Partial<StoreListing>>({
    status: 'PUBLISHED',
    price_amount: 0,
  });
  const [isFree, setIsFree] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<StoreListing | null>(null);

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



      // Handle Original File Upload (Private Bucket)
      if (originalFile) {
        const filePath = `${profile.store_id}/original_${Date.now()}_${originalFile.name}`;
        const path = await storeApi.uploadStoreFile(filePath, originalFile);
        if (path) originalUrl = path;
      }

      const listingData = {
        ...formData,
        store_id: profile.store_id,
        preview_image_url: previewUrl,
        url_modul_ajar: originalUrl,
        price_amount: isFree ? 0 : (formData.price_amount || 0),
      };

      return storeApi.upsertListing(listingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeListings', profile?.store_id] });
      toast.success('Modul ajar berhasil diterbitkan');
      setIsAddingNew(false);
      setFormData({ status: 'PUBLISHED' });
      setOriginalFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan modul ajar');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (item: StoreListing) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { listing_id, created_at, updated_at, published_at, store_profile, ...rest } = item;
      return storeApi.upsertListing({
        ...rest,
        title: `[Copy] ${item.title}`,
        status: 'DRAFT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeListings', profile?.store_id] });
      toast.success('Modul ajar berhasil diduplikat');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menduplikat modul ajar');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return storeApi.deleteListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeListings', profile?.store_id] });
      toast.success('Modul ajar berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus modul ajar');
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.category) {
      toast.error('Judul dan kategori wajib diisi');
      return;
    }
    if (!isFree && !formData.price_amount) {
      toast.error('Harga wajib diisi jika tidak gratis');
      return;
    }
    mutation.mutate();
  };

  if (isAddingNew) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="section-heading mb-0 border-none pb-0">Tambah Modul Ajar Baru</h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Isi detail modul ajar yang akan Anda jual secara eceran.</p>
          </div>
          <button className="btn-secondary" onClick={() => setIsAddingNew(false)} disabled={mutation.isPending}>
            Batal
          </button>
        </div>

        <div className="card">
          <div className="card-head">
            <h4 className="font-bold">Informasi Modul Ajar</h4>
          </div>
          <div className="card-body space-y-4 pt-4">
            <div className="field-group">
              <label>Judul Modul Ajar</label>
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
                placeholder="Jelaskan tentang modul ajar Anda..." 
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
                <div className="mt-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer w-max">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 border-2 border-[#111] rounded"
                      checked={isFree}
                      onChange={(e) => {
                        setIsFree(e.target.checked);
                        if (e.target.checked) {
                          setFormData({...formData, price_amount: 0});
                        }
                      }}
                    />
                    <span className="text-sm font-bold">Gratis (Rp 0)</span>
                  </label>
                </div>
                {!isFree && (
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={formData.price_amount || ''}
                    onChange={e => setFormData({...formData, price_amount: Number(e.target.value)})}
                  />
                )}
              </div>
            </div>

            <div className="field-group">
              <label>URL File Preview (Opsional) - Image/PDF</label>
              <p className="text-xs text-muted-foreground mt-1 mb-2 font-semibold">Gunakan link eksternal (contoh: Google Drive, Imgur, Canva, dll)</p>
              <input 
                type="url" 
                placeholder="Masukkan URL preview publik..." 
                value={formData.preview_image_url || ''}
                onChange={e => setFormData({...formData, preview_image_url: e.target.value})}
                className="mt-1 w-full"
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
          <h3 className="section-heading mb-0 border-none pb-0">Katalog Modul Ajar</h3>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Kelola Modul Ajar yang Anda jual di marketplace.</p>
        </div>
        <button className="btn-simpan flex items-center gap-2" onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4" />
          Tambah Modul Ajar Baru
        </button>
      </div>
      
      {isLoading ? (
        <div>Memuat katalog...</div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {listings.map(item => (
            <div key={item.listing_id} className="card overflow-hidden flex flex-col border border-[#111] md:border-2">
              <div className="aspect-[4/3] bg-[#f5f0e8] border-b border-[#111] md:border-b-2 flex items-center justify-center text-center relative overflow-hidden">
                {item.preview_image_url ? (
                  <img src={item.preview_image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-8 h-8 md:w-12 md:h-12 text-[#111] opacity-20" />
                )}
                {item.status === 'PUBLISHED' ? (
                  <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-green-100 text-green-800 border border-green-800 md:border-2 text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded">Aktif</span>
                ) : (
                  <span className="absolute top-1 right-1 md:top-2 md:right-2 bg-gray-100 text-gray-800 border border-gray-800 md:border-2 text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded">Draf</span>
                )}
              </div>
              <div className="card-body p-2 md:p-4 flex-1 flex flex-col bg-white">
                <h4 className="font-bold text-xs md:text-lg leading-tight mb-1 md:mb-1">{item.title}</h4>
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground mb-2 md:mb-3 truncate">{item.category}</p>
                <div className="mt-auto flex justify-between items-end">
                  <div className="text-sm md:text-xl font-black text-[#c04a1a]">
                    {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                  </div>
                  <div className="flex gap-0.5 md:gap-1">
                     <button 
                        className="p-1 md:p-1.5 hover:bg-gray-100 rounded text-gray-500" 
                        title="Edit" 
                        onClick={() => {
                          setEditingListing(item);
                          setIsEditModalOpen(true);
                        }}
                     >
                       <Edit className="w-3 h-3 md:w-4 md:h-4" />
                     </button>
                     <button 
                        className="p-1 md:p-1.5 hover:bg-gray-100 rounded text-gray-500" 
                        title="Duplikat" 
                        onClick={() => {
                          if(confirm('Duplikat modul ajar ini?')) duplicateMutation.mutate(item);
                        }}
                        disabled={duplicateMutation.isPending}
                     >
                       <Copy className="w-3 h-3 md:w-4 md:h-4" />
                     </button>
                     <button 
                        className="p-1 md:p-1.5 hover:bg-red-50 rounded text-red-500" 
                        title="Hapus" 
                        onClick={() => {
                          if(confirm('Yakin ingin menghapus modul ajar ini?')) deleteMutation.mutate(item.listing_id);
                        }}
                        disabled={deleteMutation.isPending}
                     >
                       <Trash className="w-3 h-3 md:w-4 md:h-4" />
                     </button>
                  </div>
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
            <h4 className="text-lg font-black mb-1">Belum ada modul ajar</h4>
            <p className="text-sm font-semibold text-muted-foreground mb-4 max-w-sm">
              Anda belum mengunggah modul ajar apapun. Mulai bagikan modul ajar Anda ke publik sekarang.
            </p>
            <button className="btn-secondary" onClick={() => setIsAddingNew(true)}>
              Tambah Modul Ajar Pertama
            </button>
          </div>
        </div>
      )}
      
      <StoreListingEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        listing={editingListing}
      />
    </div>
  );
};

export default StoreListingsTab;
