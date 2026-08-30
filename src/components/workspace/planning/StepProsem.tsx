import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutList } from "lucide-react";
import { ProsemPreview } from "@/components/modul/ProsemPreview";
import { useProsemGenerator } from "@/hooks/useProsemGenerator";
import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/workspace";
import type { ProtaData, KalenderPendidikan, ProsemData } from "@/types/modul";
import { exportProsemToWord } from "@/lib/export-word";
import { exportProtaProsemToExcel } from "@/lib/export-excel";
interface StepProsemProps {
  workspace: Workspace;
  onNext: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const StepProsem: React.FC<StepProsemProps> = ({ workspace, onNext, isLocked, onShowUpsell }) => {
  const [protaData, setProtaData] = useState<ProtaData | null>(null);
  const [kalenderData, setKalenderData] = useState<KalenderPendidikan | null>(null);
  
  const [prosemSem1, setProsemSem1] = useState<ProsemData | null>(null);
  const [prosemSem2, setProsemSem2] = useState<ProsemData | null>(null);
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
  
  // Track existing DB IDs to prevent deletion errors
  const [existingItemsSem1, setExistingItemsSem1] = useState<any[]>([]);
  const [existingItemsSem2, setExistingItemsSem2] = useState<any[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { generate, isLoading: isGenerating, error: genError } = useProsemGenerator();

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load Prota to generate Prosem from it
        const { data: protaPlans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "prota")
          .limit(1);

        if (protaPlans && protaPlans.length > 0 && protaPlans[0].content) {
          const content = protaPlans[0].content as any;
          if (content.prota) setProtaData(content as ProtaData);
          if (content.kalender) setKalenderData(content.kalender as KalenderPendidikan);
        }

        // 2. Load existing Prosem Sem 1
        const { data: ps1 } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "prosem")
          .eq("semester", 1)
          .limit(1);
          
        if (ps1 && ps1.length > 0 && ps1[0].content) {
          setProsemSem1(ps1[0].content as ProsemData);
        }

        // 3. Load existing Prosem Sem 2
        const { data: ps2 } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "prosem")
          .eq("semester", 2)
          .limit(1);
          
        if (ps2 && ps2.length > 0 && ps2[0].content) {
          setProsemSem2(ps2[0].content as ProsemData);
        }

        // 4. Load existing prosem_items IDs to preserve them during save
        const { data: existingItems } = await supabase
          .from("prosem_items")
          .select("id, sequence, semester")
          .eq("workspace_id", workspace.id)
          .order("sequence");

        if (existingItems) {
          setExistingItemsSem1(existingItems.filter(i => i.semester === 1));
          setExistingItemsSem2(existingItems.filter(i => i.semester === 2));
        }

      } catch (err) {
        console.error("Error loading Prosem:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    
    if (workspace.id) loadData();
  }, [workspace.id]);

  const handleGenerate = async () => {
    if (!protaData || !kalenderData) {
      alert("Data Program Tahunan belum lengkap. Silakan kembali ke Langkah 2.");
      return;
    }

    const res1 = await generate(protaData, 1, kalenderData.mingguEfektifSem1, kalenderData.tanggalMulaiSem1, kalenderData.kegiatanNonPembelajaran || []);
    const res2 = await generate(protaData, 2, kalenderData.mingguEfektifSem2, kalenderData.tanggalMulaiSem2, kalenderData.kegiatanNonPembelajaran || []);

    if (res1) setProsemSem1(res1);
    if (res2) setProsemSem2(res2);
  };

  const handleSave = async () => {
    // Membutuhkan minimal 1 semester terisi
    if (!prosemSem1 && !prosemSem2) return;
    setIsSaving(true);
    
    try {
      // Helper function to save a semester
      const saveSemester = async (sem: 1 | 2, prosemData: ProsemData | null) => {
        if (!prosemData) return;
        
        // 1. Dapatkan atau buat ID Plan untuk semester ini
        const { data: planId, error: upsertErr } = await supabase.rpc("upsert_curriculum_plan", {
          p_workspace_id: workspace.id,
          p_type: "prosem",
          p_semester: sem,
          p_content: prosemData
        });
        
        if (upsertErr) throw upsertErr;

        // 2. Siapkan array items sesuai schema save_prosem_plan
        // Format payload: [{id?, sequence, materi_pokok, allocated_jp, tp_snapshot, tp_ids[]}]
        const existingItemsForSem = sem === 1 ? existingItemsSem1 : existingItemsSem2;
        
        const itemsToSave = prosemData.rows.map((item, idx) => {
          // Cari existing item by sequence to preserve its ID
          const existingItem = existingItemsForSem.find(e => e.sequence === idx + 1);
          
          return {
            id: existingItem?.id, // include ID so RPC updates instead of deletes
            sequence: idx + 1,
            materi_pokok: item.materi_pokok,
            allocated_jp: item.alokasi_jp,
            tp_snapshot: [{
              id: `temp-${item.no}`,
              code: `TP${item.no}`,
              description: item.tujuan_pembelajaran
            }],
            tp_ids: [] // kosongi dulu, butuh mapping UUID dari tp_items DB
          };
        });

        // 3. Panggil RPC save_prosem_plan (Atomik: save items + update snapshot)
        const { error: saveErr } = await supabase.rpc("save_prosem_plan", {
          p_workspace_id: workspace.id,
          p_prosem_plan_id: planId,
          p_semester: sem,
          p_content: prosemData,
          p_items: itemsToSave
        });
        
        if (saveErr) throw saveErr;
      };

      // Simpan kedua semester
      if (prosemSem1) await saveSemester(1, prosemSem1);
      if (prosemSem2) await saveSemester(2, prosemSem2);

      onNext();
    } catch (err: any) {
      alert("Error saving Prosem: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  const activeData = activeSemester === 1 ? prosemSem1 : prosemSem2;
  const setSemesterData = activeSemester === 1 ? setProsemSem1 : setProsemSem2;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h2 className="text-xl font-semibold mb-1">Program Semester (Prosem)</h2>
        <p className="text-sm text-muted-foreground">Distribusi topik dari Prota ke dalam minggu efektif per semester.</p>
      </div>

      {!protaData && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm">
          <strong>Perhatian:</strong> Anda belum memiliki Program Tahunan. Silakan kembali ke Langkah 2 untuk menyusun Program Tahunan terlebih dahulu.
        </div>
      )}

      {/* Konten Prosem */}
      <div className="flex-1 min-h-[400px]">
        {(prosemSem1 || prosemSem2) ? (
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden h-[550px] flex flex-col">
            <div className="flex-1 overflow-auto bg-slate-50 p-4">
              <ProsemPreview 
                prosemSem1={prosemSem1} 
                prosemSem2={prosemSem2} 
                formData={{ cp: '', mata_pelajaran: workspace.subject, fase: workspace.phase, kelas: workspace.grade } as any}
                onExportWord={(semester) => {
                  const data = semester === 1 ? prosemSem1 : prosemSem2;
                  if (data) {
                    exportProsemToWord(data, { 
                      mataPelajaran: workspace.subject, 
                      fase: workspace.phase, 
                      kelas: workspace.grade 
                    } as any, semester);
                  }
                }} 
                onExportExcel={() => {
                  exportProtaProsemToExcel(workspace, protaData, prosemSem1, prosemSem2);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-lg h-[400px] flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
            <LayoutList className="w-12 h-12 mb-4 opacity-20" />
            <p>Program Semester (Semester 1 & 2) belum disusun.</p>
            <Button 
              className="mt-4" 
              onClick={() => {
                if (isLocked && onShowUpsell) onShowUpsell();
                else handleGenerate();
              }}
              disabled={isGenerating || !protaData}
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyusun...</> : "Susun Prosem"}
            </Button>
            {genError && (
              <p className="text-xs text-red-500 mt-2">{genError}</p>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || (!prosemSem1 && !prosemSem2)}>
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan & Lanjut"}
        </Button>
      </div>
    </div>
  );
};
