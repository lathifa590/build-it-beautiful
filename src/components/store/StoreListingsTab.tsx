import React, { useState } from 'react';
import { Plus, Upload, FileText, Download, Edit, Copy, Trash, Search, Eye, ShoppingBag } from 'lucide-react';
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  const filteredListings = listings?.filter(item => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
                className="btn-primary w-full md:w-auto" 
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
          <h2 className="text-2xl font-black text-[#111]">Katalog Modul Ajar</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Kelola Modul Ajar yang Anda jual di marketplace.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4" />
          Tambah Modul Ajar Baru
        </button>
      </div>

      <div className="catalog-filter-bar">
        <input 
          type="text" 
          placeholder="Cari modul..." 
          className="catalog-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="catalog-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="PUBLISHED">Aktif</option>
          <option value="DRAFT">Draf</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
        </div>
      ) : filteredListings && filteredListings.length > 0 ? (
        <div className="product-grid">
          {filteredListings.map(item => (
            <div key={item.listing_id} className="product-card">
              <div className="product-card__thumb">
                {item.preview_image_url ? (
                  <img src={item.preview_image_url} alt={item.title} />
                ) : (
                  <div className="product-card__thumb-placeholder">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                
                {item.status === 'PUBLISHED' ? (
                  <span className="product-card__badge product-card__badge--aktif">Aktif</span>
                ) : (
                  <span className="product-card__badge product-card__badge--draf">Draf</span>
                )}
              </div>
              
              <div className="product-card__info">
                <span className="product-card__jenjang">{item.category}</span>
                <h3 className="product-card__title">{item.title}</h3>
                <span className="product-card__price">
                  {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                </span>
                
                <div className="product-card__meta">
                  <Eye className="w-3 h-3" />
                  <span>0 dilihat</span>
                  <span>·</span>
                  <span>0 terjual</span>
                </div>
              </div>
              
              <div className="product-card__actions">
                 <button 
                    className="product-card__action-btn"
                    title="Edit" 
                    onClick={() => {
                      setEditingListing(item);
                      setIsEditModalOpen(true);
                    }}
                 >
                   <Edit className="w-4 h-4" /> Edit
                 </button>
                 <button 
                    className="product-card__action-btn"
                    title="Duplikat" 
                    onClick={() => {
                      if(confirm('Duplikat modul ajar ini?')) duplicateMutation.mutate(item);
                    }}
                    disabled={duplicateMutation.isPending}
                 >
                   <Copy className="w-4 h-4" /> Copy
                 </button>
                 <button 
                    className="product-card__action-btn product-card__action-btn--danger"
                    title="Hapus" 
                    onClick={() => {
                      if(confirm('Yakin ingin menghapus modul ajar ini?')) deleteMutation.mutate(item.listing_id);
                    }}
                    disabled={deleteMutation.isPending}
                 >
                   <Trash className="w-4 h-4" /> Hapus
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <div className="catalog-empty__icon">
            <Plus className="w-8 h-8" />
          </div>
          <h4 className="catalog-empty__title">
            {searchQuery || filterStatus !== 'ALL' ? 'Modul Ajar Tidak Ditemukan' : 'Belum ada modul ajar'}
          </h4>
          <p className="catalog-empty__desc">
            {searchQuery || filterStatus !== 'ALL' 
              ? 'Tidak ada modul ajar yang cocok dengan filter pencarian Anda.' 
              : 'Anda belum mengunggah modul ajar apapun. Mulai bagikan modul ajar Anda ke publik sekarang.'}
          </p>
          {!(searchQuery || filterStatus !== 'ALL') && (
            <button className="btn btn-secondary mt-2" onClick={() => setIsAddingNew(true)}>
              Tambah Modul Ajar Pertama
            </button>
          )}
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
