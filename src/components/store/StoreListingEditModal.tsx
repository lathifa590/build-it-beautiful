import React, { useState, useEffect } from 'react';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit } from 'lucide-react';

interface StoreListingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: StoreListing | null;
}

export const StoreListingEditModal = ({ 
  isOpen, 
  onClose,
  listing
}: StoreListingEditModalProps) => {
  const queryClient = useQueryClient();
  
  const [listingData, setListingData] = useState<Partial<StoreListing>>({});

  useEffect(() => {
    if (listing && isOpen) {
      setListingData(listing);
    }
  }, [listing, isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!listing?.listing_id) throw new Error("ID Produk tidak ditemukan.");
      return storeApi.upsertListing(listingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeListings'] });
      toast.success('Modul Ajar berhasil diperbarui!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui Modul Ajar');
    }
  });

  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b-2 border-[#111] bg-[#f5f0e8] flex gap-3 items-center shrink-0">
          <Edit className="w-6 h-6 text-[#111]" />
          <div>
            <h2 className="font-black text-xl text-[#111]">Edit Modul Ajar</h2>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Sesuaikan rincian Modul Ajar Anda.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="field-group">
            <label>Judul Produk</label>
            <input 
              type="text" 
              value={listingData.title || ''}
              onChange={e => setListingData({...listingData, title: e.target.value})}
            />
          </div>
          
          <div className="field-group">
            <label>URL Gambar Thumbnail (4:3)</label>
            <input 
              type="url" 
              placeholder="https://..."
              value={listingData.preview_image_url || ''}
              onChange={e => setListingData({...listingData, preview_image_url: e.target.value})}
            />
          </div>

          <div className="field-group">
            <label>Deskripsi</label>
            <textarea 
              rows={3}
              value={listingData.description || ''}
              onChange={e => setListingData({...listingData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="field-group">
              <label>Kategori</label>
              <select 
                value={listingData.category || ''}
                onChange={e => setListingData({...listingData, category: e.target.value})}
              >
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="UMUM">UMUM</option>
              </select>
            </div>
            <div className="field-group">
              <label>Harga (Rp)</label>
              <input 
                type="number" 
                value={listingData.price_amount === undefined ? 0 : listingData.price_amount}
                onChange={e => setListingData({...listingData, price_amount: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="field-group">
            <label>Status Publikasi</label>
            <select 
              value={listingData.status || 'PUBLISHED'}
              onChange={e => setListingData({...listingData, status: e.target.value as any})}
            >
              <option value="PUBLISHED">Aktif (PUBLISHED)</option>
              <option value="DRAFT">Draf (Sembunyikan)</option>
              <option value="TAKEDOWN">Takedown</option>
            </select>
          </div>
          
        </div>
        
        <div className="p-6 bg-gray-50 border-t-2 border-[#111] flex justify-end gap-3 shrink-0">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Batal
          </button>
          <button 
            className="btn-simpan" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
};
