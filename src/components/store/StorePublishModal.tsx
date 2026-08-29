import React, { useState } from 'react';
import JSZip from 'jszip';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportProtaToWord, exportProsemToWord } from '@/lib/export-word';
import type { ProtaData, ProsemData, FormData } from '@/types/modul';
import { Store } from 'lucide-react';

interface StorePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  protaData: ProtaData | null;
  prosemSem1: ProsemData | null;
  prosemSem2: ProsemData | null;
  formData: FormData;
}

export const StorePublishModal = ({ 
  isOpen, 
  onClose,
  protaData,
  prosemSem1,
  prosemSem2,
  formData
}: StorePublishModalProps) => {
  const { user } = useAuth();
  
  const [listingData, setListingData] = useState<Partial<StoreListing>>({
    title: `Paket Lengkap ${formData.mataPelajaran || ''} Kelas ${formData.kelas || ''}`,
    description: `Paket dokumen perencanaan pembelajaran lengkap berisi Program Tahunan dan Program Semester untuk ${formData.mataPelajaran || ''} Kelas ${formData.kelas || ''} Fase ${formData.fase || ''}.`,
    price: 50000,
    category: 'UMUM', // default
    status: 'PUBLISHED',
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id && isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) throw new Error("Profil toko tidak ditemukan. Buat profil toko Anda di Manajemen Toko terlebih dahulu.");
      
      const zip = new JSZip();
      
      // Add Prota
      if (protaData) {
        const protaBlob = exportProtaToWord(protaData, formData, true) as Blob;
        if (protaBlob) zip.file(`Program_Tahunan_${formData.mataPelajaran}.doc`, protaBlob);
      }
      
      // Add Prosem Sem 1
      if (prosemSem1) {
        const prosem1Blob = exportProsemToWord(prosemSem1, formData, 1, true) as Blob;
        if (prosem1Blob) zip.file(`Program_Semester_1_${formData.mataPelajaran}.doc`, prosem1Blob);
      }
      
      // Add Prosem Sem 2
      if (prosemSem2) {
        const prosem2Blob = exportProsemToWord(prosemSem2, formData, 2, true) as Blob;
        if (prosem2Blob) zip.file(`Program_Semester_2_${formData.mataPelajaran}.doc`, prosem2Blob);
      }
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], `Paket_Modul_${formData.mataPelajaran}_Kelas_${formData.kelas}.zip`, { type: 'application/zip' });
      
      // Upload Zip
      const filePath = `${profile.store_id}/workspace_${Date.now()}_${zipFile.name}`;
      const originalUrl = await storeApi.uploadStoreFile(filePath, zipFile);
      
      const finalListingData = {
        ...listingData,
        store_id: profile.store_id,
        url_modul_ajar: originalUrl,
      };

      return storeApi.upsertListing(finalListingData);
    },
    onSuccess: () => {
      toast.success('Workspace berhasil dipaketkan dan diterbitkan ke Toko!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menerbitkan workspace');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b-2 border-[#111] bg-[#f5f0e8] flex gap-3 items-center">
          <Store className="w-6 h-6 text-[#111]" />
          <div>
            <h2 className="font-black text-xl text-[#111]">Terbitkan Workspace ke Toko</h2>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Bundle Prota & Prosem ini menjadi 1 file ZIP untuk dijual.
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="field-group">
            <label>Judul Produk</label>
            <input 
              type="text" 
              value={listingData.title || ''}
              onChange={e => setListingData({...listingData, title: e.target.value})}
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
                value={listingData.price || 0}
                onChange={e => setListingData({...listingData, price: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-md p-3">
            <p className="text-xs font-semibold text-amber-800">
              Isi Paket Otomatis (ZIP):
              <br/>- Program Tahunan
              <br/>- Program Semester (1 & 2)
            </p>
            <p className="text-xs text-amber-700 mt-1 italic">
              *Modul Ajar Harian belum disertakan pada auto-zip versi ini.
            </p>
          </div>
          
        </div>
        
        <div className="p-6 bg-gray-50 border-t-2 border-[#111] flex justify-end gap-3">
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
            disabled={mutation.isPending || profileLoading}
          >
            {mutation.isPending ? 'Memproses ZIP & Upload...' : 'Bungkus & Terbitkan'}
          </button>
        </div>
      </div>
    </div>
  );
};
