import React, { useState } from 'react';
import JSZip from 'jszip';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportProtaToWord, exportProsemToWord } from '@/lib/export-word';
import { Store, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Workspace } from '@/types/workspace';
import type { CurriculumPlanDB, ProsemItemDB, MeetingSlotDB } from '@/hooks/useProsemData';
import { DEFAULT_FORM_DATA } from '@/lib/constants';
import { generateBundleZip } from '@/lib/bundle-generator';
import type { GenerationResultV2 } from '@/types/modul';

interface StoreBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  semesterPlan: CurriculumPlanDB;
  prosemItems: ProsemItemDB[];
}

export const StoreBundleModal = ({ 
  isOpen, 
  onClose,
  workspace,
  semesterPlan,
  prosemItems
}: StoreBundleModalProps) => {
  const { user } = useAuth();
  const formData = workspace.global_form_data || DEFAULT_FORM_DATA;
  const semester = semesterPlan.semester || 1;
  
  const completedMeetings = prosemItems.flatMap(item => item.meeting_slots).filter(s => s.status === 'completed').length;
  const totalJP = prosemItems.reduce((sum, item) => sum + item.allocated_jp, 0);
  const tahunAjaran = workspace.academic_year || '';
  const semLabel = semester === 1 ? 'Ganjil' : 'Genap';
  const mapelStr = formData.mataPelajaran || workspace.subject || '';
  const kelasStr = formData.kelas || (workspace.grade ? `Kelas ${workspace.grade}` : '');
  const faseStr = formData.fase || workspace.phase || '';

  const [listingData, setListingData] = useState<Partial<StoreListing>>({
    title: `[LENGKAP] ${mapelStr} ${kelasStr} Fase ${faseStr} Semester ${semLabel} ${tahunAjaran}`,
    description: `Paket Modul Ajar ${mapelStr} lengkap untuk ${kelasStr} Fase ${faseStr} Semester ${semLabel}${tahunAjaran ? ` T.A. ${tahunAjaran}` : ''}.

✅ Isi paket:
• ${completedMeetings} Pertemuan (${totalJP} JP total)
• Modul Ajar per pertemuan (termasuk RPP, LKPD, Asesmen, Materi & Refleksi)
• Sesuai Kurikulum ${formData.kurikulum === 'kbc' ? 'KBC (Kemenag)' : 'Merdeka Belajar'}

Cocok untuk guru ${mapelStr} ${kelasStr} yang ingin hemat waktu persiapan mengajar.`,
    price_amount: 50000,
    category: 'UMUM', 
    status: 'PUBLISHED',
  });

  const [progressMsg, setProgressMsg] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id && isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile?.store_id) throw new Error("Profil toko tidak ditemukan. Buat profil toko Anda di Manajemen Toko terlebih dahulu.");
      if (profile.status !== 'ACTIVE') throw new Error("Profil toko tidak aktif. Aktifkan profil toko di Manajemen Toko.");
      
      setProgressMsg('Mengumpulkan data Program Tahunan & Semester...');
      
      const zipBlob = await generateBundleZip(workspace, semester, prosemItems, setProgressMsg);
      
      setProgressMsg('Mengunggah ke Toko...');
      const zipFile = new File([zipBlob], `Paket_Modul_${formData.mataPelajaran}_Kelas_${formData.kelas}_Sem_${semester}.zip`, { type: 'application/zip' });
      
      // Upload Zip
      const filePath = `${profile.store_id}/workspace_${Date.now()}_${zipFile.name}`;
      const originalUrl = await storeApi.uploadStoreFile(filePath, zipFile);
      
      const finalListingData = {
        ...listingData,
        store_id: profile.store_id,
        url_modul_ajar: originalUrl,
        published_at: new Date().toISOString(),
      };

      setProgressMsg('Menyimpan ke Toko...');
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
            <h2 className="text-xl font-bold font-heading text-[#111]">Terbitkan ke Toko (V2)</h2>
            <p className="text-sm text-gray-600">Jual bundle modul satu semester secara instan.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#111] mb-1">Judul Paket</label>
            <input 
              type="text" 
              className="w-full p-2 border-2 border-[#111] rounded-lg"
              value={listingData.title || ''}
              onChange={(e) => setListingData({...listingData, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#111] mb-1">Deskripsi</label>
            <textarea 
              className="w-full p-2 border-2 border-[#111] rounded-lg h-24"
              value={listingData.description || ''}
              onChange={(e) => setListingData({...listingData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#111] mb-1">Harga (Rp)</label>
              <input 
                type="number" 
                className="w-full p-2 border-2 border-[#111] rounded-lg"
                value={listingData.price_amount || 0}
                onChange={(e) => setListingData({...listingData, price_amount: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111] mb-1">Kategori</label>
              <select 
                className="w-full p-2 border-2 border-[#111] rounded-lg"
                value={listingData.category || 'UMUM'}
                onChange={(e) => setListingData({...listingData, category: e.target.value})}
              >
                <option value="UMUM">UMUM</option>
                <option value="TK/PAUD">TK/PAUD</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA/SMK">SMA/SMK</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t-2 border-[#111] bg-gray-50 flex justify-end gap-3 items-center">
          {mutation.isPending && (
            <span className="text-sm text-blue-600 font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progressMsg}
            </span>
          )}
          <button 
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-6 py-2 bg-[#ff5e5e] text-white font-bold rounded-lg border-2 border-[#111] shadow-[2px_2px_0px_#111] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Publish Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
