import React, { useState } from 'react';
import JSZip from 'jszip';
import { useAuth } from '@/contexts/AuthContext';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportProtaToWord, exportProsemToWord, exportKktpToWord } from '@/lib/export-word';
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
  // Kolom global_form_data belum ada di tipe Workspace/DB — aman pakai fallback
  const formData = (workspace as any).global_form_data || DEFAULT_FORM_DATA;
  const semester = semesterPlan.semester || 1;
  
  const completedMeetings = prosemItems.flatMap(item => item.meeting_slots).filter(s => s.status === 'completed').length;
  const totalJP = prosemItems.reduce((sum, item) => sum + item.allocated_jp, 0);
  const tahunAjaran = workspace.academic_year || '';
  const semLabel = semester === 1 ? 'Ganjil' : 'Genap';
  const mapelStr = formData.mataPelajaran || workspace.subject || '';
  const kelasStr = formData.kelas || (workspace.grade ? `Kelas ${workspace.grade}` : '');
  const faseStr = formData.fase || workspace.phase || '';
  
  const topikList = prosemItems
    .filter(item => item.meeting_slots.some(s => s.status === 'completed'))
    .map((item, i) => `${i+1}. ${item.materi_pokok}`)
    .join('\n');

  const [listingData, setListingData] = useState<Partial<StoreListing>>({
    title: `[LENGKAP] ${mapelStr} ${kelasStr} Fase ${faseStr} Semester ${semLabel} ${tahunAjaran}`,
    description: `Paket Modul Ajar ${mapelStr} lengkap untuk ${kelasStr} Fase ${faseStr} Semester ${semLabel}${tahunAjaran ? ` T.A. ${tahunAjaran}` : ''}.

✅ Isi paket:
• ${completedMeetings} Pertemuan (${totalJP} JP total)
• Modul Ajar per pertemuan (termasuk RPP, LKPD, Asesmen, Materi & Refleksi)
• Sesuai Kurikulum ${formData.kurikulum === 'kbc' ? 'KBC (Kemenag)' : 'Merdeka Belajar'}

📚 Daftar Topik/Materi:
${topikList}

Cocok untuk guru ${mapelStr} ${kelasStr} yang ingin hemat waktu persiapan mengajar.`,
    price_amount: 50000,
    category: 'UMUM', 
    status: 'PUBLISHED',
  });

  const [progressMsg, setProgressMsg] = useState('');
  const [includeExtras, setIncludeExtras] = useState(true);
  const [extrasFormat, setExtrasFormat] = useState<'word' | 'excel_word'>('excel_word');

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
      let finalZipBlob = zipBlob;
      
      if (includeExtras) {
        setProgressMsg('Mengumpulkan dokumen pendukung...');
        const { data: plans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .in("type", ["prota", "prosem", "kktp"]);
          
        let protaData = null;
        let prosemSem1 = null;
        let prosemSem2 = null;
        let kktpData = null;
        
        if (plans) {
          const pt = plans.find((p: any) => p.type === 'prota');
          if (pt?.content) protaData = pt.content;
          
          const ps1 = plans.find((p: any) => p.type === 'prosem' && p.semester === 1);
          if (ps1?.content) prosemSem1 = ps1.content;
          
          const ps2 = plans.find((p: any) => p.type === 'prosem' && p.semester === 2);
          if (ps2?.content) prosemSem2 = ps2.content;
          
          const kktp = plans.find((p: any) => p.type === 'kktp');
          if (kktp?.content) kktpData = kktp.content;
        }
        
        if (protaData || prosemSem1 || prosemSem2 || kktpData) {
          setProgressMsg('Memproses dokumen pendukung...');
          const zip = await JSZip.loadAsync(zipBlob);
          
          if (extrasFormat === 'word') {
            if (protaData) {
              const b = exportProtaToWord(protaData as any, formData, true) as Blob;
              if (b) zip.file(`Program_Tahunan_${mapelStr}.doc`, b);
            }
            if (prosemSem1) {
              const b = exportProsemToWord(prosemSem1 as any, formData, 1, true) as Blob;
              if (b) zip.file(`Program_Semester_1_${mapelStr}.doc`, b);
            }
            if (prosemSem2) {
              const b = exportProsemToWord(prosemSem2 as any, formData, 2, true) as Blob;
              if (b) zip.file(`Program_Semester_2_${mapelStr}.doc`, b);
            }
          } else if (extrasFormat === 'excel_word') {
            if (protaData || prosemSem1 || prosemSem2) {
              const { exportProtaProsemToExcel } = await import('@/lib/export-excel');
              const buffer = await exportProtaProsemToExcel(workspace, protaData as any, prosemSem1 as any, prosemSem2 as any, true);
              if (buffer) {
                zip.file(`Prota_Prosem_${mapelStr}.xlsx`, buffer);
              }
            }
          }
          
          if (kktpData) {
            const b = exportKktpToWord(kktpData as any, formData, true) as Blob;
            if (b) zip.file(`KKTP_${mapelStr}.doc`, b);
          }
          
          setProgressMsg('Menyusun ulang ZIP...');
          finalZipBlob = await zip.generateAsync({ type: 'blob' });
        }
      }
      
      setProgressMsg('Mengunggah ke Toko...');
      const mapelFile = (formData.mataPelajaran || workspace.subject || 'Modul').replace(/[^a-zA-Z0-9]/g, '_');
      const kelasFile = formData.kelas || workspace.grade || '-';
      const zipFile = new File([finalZipBlob], `Paket_Modul_${mapelFile}_Kelas_${kelasFile}_Sem_${semester}.zip`, { type: 'application/zip' });
      
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

          <div className="mt-4 p-4 border-2 border-[#111] rounded-lg bg-white">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#111]">
              <input 
                type="checkbox" 
                checked={includeExtras}
                onChange={(e) => setIncludeExtras(e.target.checked)}
                className="w-5 h-5 accent-[#ff5e5e] border-2 border-[#111] rounded cursor-pointer"
              />
              Sertakan Kelengkapan Dokumen (Prota, Prosem, KKTP)
            </label>
            {includeExtras && (
              <div className="mt-3 ml-7">
                <label className="block text-sm font-bold text-[#111] mb-2">Pilih Format Dokumen Pendukung:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input 
                      type="radio" 
                      name="extrasFormat"
                      value="excel_word"
                      checked={extrasFormat === 'excel_word'}
                      onChange={() => setExtrasFormat('excel_word')}
                      className="accent-[#111] cursor-pointer"
                    />
                    <span>Excel (.xlsx) untuk Prota/Prosem & Word untuk KKTP <span className="text-gray-500 font-normal">(Rekomendasi)</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input 
                      type="radio" 
                      name="extrasFormat"
                      value="word"
                      checked={extrasFormat === 'word'}
                      onChange={() => setExtrasFormat('word')}
                      className="accent-[#111] cursor-pointer"
                    />
                    <span>Word (.doc) untuk Semua (Prota, Prosem, KKTP)</span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">Sistem akan secara otomatis mengambil kelengkapan dari ruang kerja saat ini.</p>
              </div>
            )}
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
