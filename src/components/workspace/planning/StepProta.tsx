import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { KalenderPendidikanForm } from "@/components/modul/KalenderPendidikanForm";
import { ProtaPreview } from "@/components/modul/ProtaPreview";
import { useProtaGenerator } from "@/hooks/useProtaGenerator";
import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/workspace";
import type { ProtaData, KalenderPendidikan } from "@/types/modul";

interface StepProtaProps {
  workspace: Workspace;
  onNext: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const StepProta: React.FC<StepProtaProps> = ({ workspace, onNext, isLocked, onShowUpsell }) => {
  const [protaData, setProtaData] = useState<ProtaData | null>(null);
  const [kalenderData, setKalenderData] = useState<KalenderPendidikan>({
    jpPerMinggu: 4,
    mingguEfektifSem1: 18,
    mingguEfektifSem2: 16,
    tanggalMulaiSem1: "2024-07-15",
    tanggalMulaiSem2: "2025-01-06"
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cpData, setCpData] = useState<any>(null);

  const { generate, isLoading: isGenerating, error: genError } = useProtaGenerator();

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load CP Data to check if we can generate
        const { data: tpPlans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "tp")
          .limit(1);

        if (tpPlans && tpPlans.length > 0) {
          const tpContent = tpPlans[0].content as any;
          setCpData(tpContent);
          
          // Load default kalender dari TP plan jika ada
          if (tpContent?.kalender) {
            setKalenderData(tpContent.kalender);
          }
        }

        // 2. Load existing Prota
        const { data: protaPlans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "prota")
          .limit(1);

        if (protaPlans && protaPlans.length > 0 && protaPlans[0].content) {
          const content = protaPlans[0].content as any;
          if (content.prota) {
            setProtaData(content as ProtaData);
          }
          // Timpa dengan kalender dari Prota jika sudah pernah disave di Prota
          if (content.kalender) {
            setKalenderData(content.kalender as KalenderPendidikan);
          }
        }
      } catch (err) {
        console.error("Error loading Prota:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    
    if (workspace.id) loadData();
  }, [workspace.id]);

  const handleGenerate = async () => {
    if (!cpData?.cp) {
      alert("Capaian Pembelajaran (CP) belum diisi. Silakan kembali ke Langkah 1.");
      return;
    }

    const result = await generate({
      cp: cpData.cp,
      mataPelajaran: cpData.mataPelajaran || "Mata Pelajaran",
      fase: cpData.fase || "D",
      kelas: cpData.kelas || "7",
      jpPerMinggu: kalenderData.jpPerMinggu,
      mingguEfektifSem1: kalenderData.mingguEfektifSem1,
      mingguEfektifSem2: kalenderData.mingguEfektifSem2
    });

    if (result) {
      setProtaData(result);
    }
  };

  const handleSave = async () => {
    if (!protaData) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase.rpc("upsert_curriculum_plan", {
        p_workspace_id: workspace.id,
        p_type: "prota",
        p_semester: null,
        p_content: {
          ...protaData,
          kalender: kalenderData
        }
      });

      if (error) throw error;
      onNext();
    } catch (err: any) {
      alert("Error saving Prota: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Program Tahunan (Prota)</h2>
        <p className="text-sm text-muted-foreground">Peta besar alokasi waktu dan materi selama satu tahun ajaran penuh.</p>
      </div>

      {!cpData?.cp && (
        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm">
          <strong>Perhatian:</strong> Anda belum mengisi Capaian Pembelajaran (CP). Silakan kembali ke Langkah 1 (CP & TP) untuk mengisi CP terlebih dahulu sebelum menyusun Program Tahunan.
        </div>
      )}

      <div className="flex flex-col md:flex-row h-[700px] border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="md:w-[350px] border-r bg-slate-50 p-4 shrink-0 overflow-y-auto">
          <div className="sticky top-0">
            <h3 className="font-medium flex items-center gap-2 mb-4 pb-2 border-b">
              <Calendar className="w-4 h-4 text-primary" /> 
              Alokasi Waktu
            </h3>
            <KalenderPendidikanForm 
              kalender={kalenderData} 
              onChange={(newData) => setKalenderData(newData)} 
            />
            
            <Button 
              className="w-full mt-6" 
              onClick={() => {
                if (isLocked && onShowUpsell) onShowUpsell();
                else handleGenerate();
              }}
              disabled={isGenerating || !cpData?.cp}
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generate Ulang...</> : "Generate Ulang Prota"}
            </Button>
            
            {genError && (
              <p className="text-xs text-red-500 mt-2">{genError}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white">
          {protaData ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                <h3 className="font-medium text-sm">Preview Program Tahunan</h3>
                <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                  <div>Sem 1: <span className="text-primary">{protaData.total_jp_sem1} JP</span></div>
                  <div>Sem 2: <span className="text-primary">{protaData.total_jp_sem2} JP</span></div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ProtaPreview 
                  protaData={protaData} 
                  onDataChange={setProtaData}
                  formData={{ cp: cpData?.cp || '', mata_pelajaran: cpData?.mataPelajaran || '', fase: cpData?.fase || '', kelas: cpData?.kelas || '' } as any}
                  onExportWord={() => {}}
                  kurikulum={workspace.curriculum}
                />
              </div>
            </div>
          ) : (
            <div className="border border-dashed rounded-lg h-[400px] flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p>Belum ada Program Tahunan.</p>
              <p className="text-sm mt-1">Atur alokasi waktu dan klik Generate untuk menyusun dengan AI.</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !protaData}>
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan & Lanjut"}
        </Button>
      </div>
    </div>
  );
};
