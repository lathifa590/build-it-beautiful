import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";
import { KKTPPreview } from "@/components/modul/KKTPPreview";
import { useKktpGenerator } from "@/hooks/useKktpGenerator";
import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/workspace";
import type { KKTPData, ProtaData } from "@/types/modul";
import { exportKktpToWord } from "@/lib/export-word";

interface StepKktpProps {
  workspace: Workspace;
  onNext: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const StepKktp: React.FC<StepKktpProps> = ({ workspace, onNext, isLocked, onShowUpsell }) => {
  const [kktpData, setKktpData] = useState<KKTPData | null>(null);
  const [protaData, setProtaData] = useState<ProtaData | null>(null);
  const [profile, setProfile] = useState<{namaPenyusun?: string; nipPenyusun?: string; kepalaSekolah?: string; nipKepalaSekolah?: string} | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cpData, setCpData] = useState<any>(null);

  const { generate, isLoading: isGenerating, error: genError } = useKktpGenerator();

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load CP Data (for phase, grade, subject)
        const { data: tpPlans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "tp")
          .limit(1);

        if (tpPlans && tpPlans.length > 0) {
          setCpData(tpPlans[0].content as any);
        }

        // 2. Load existing Prota to get TPs
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
        }

        // 3. Load existing KKTP
        const { data: kktpPlans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "kktp")
          .limit(1);

        if (kktpPlans && kktpPlans.length > 0 && kktpPlans[0].content) {
          setKktpData(kktpPlans[0].content as KKTPData);
        }
      } catch (err) {
        console.error("Error loading KKTP data:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    
    if (workspace.id) loadData();
  }, [workspace.id]);

  // Fetch user profile for export signature
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('nama_guru, nip, nama_kepala_sekolah, nip_kepala_sekolah')
        .eq('user_id', user.id)
        .maybeSingle();
      if (p) setProfile({
        namaPenyusun: p.nama_guru || '',
        nipPenyusun: p.nip || '',
        kepalaSekolah: p.nama_kepala_sekolah || '',
        nipKepalaSekolah: p.nip_kepala_sekolah || '',
      });
    };
    fetchProfile();
  }, []);

  const handleGenerate = async () => {
    if (!protaData || protaData.prota.length === 0) {
      alert("Program Tahunan belum dibuat. Silakan kembali ke Langkah 2.");
      return;
    }

    const tpList = protaData.prota.map(p => p.tujuan_pembelajaran);

    const result = await generate({
      tpList,
      mataPelajaran: cpData?.mataPelajaran || workspace.subject,
      fase: cpData?.fase || workspace.phase,
      kelas: cpData?.kelas || workspace.grade,
    });

    if (result) {
      setKktpData(result);
    }
  };

  const handleSave = async () => {
    if (!kktpData) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase.rpc("upsert_curriculum_plan", {
        p_workspace_id: workspace.id,
        p_type: "kktp",
        p_semester: null,
        p_content: kktpData
      });

      if (error) throw error;
      onNext();
    } catch (err: any) {
      alert("Error saving KKTP: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="shrink-0 p-4 pb-0">
        <h2 className="text-xl font-semibold mb-1">Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</h2>
        <p className="text-sm text-muted-foreground">Rubrik kriteria ketercapaian untuk mengukur ketuntasan Tujuan Pembelajaran.</p>
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 border-t bg-white">
        <div className="md:w-[300px] lg:w-[350px] border-r bg-slate-50 p-4 shrink-0 overflow-y-auto">
          <div className="sticky top-0 space-y-6">
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-4 pb-2 border-b">
                <ClipboardList className="w-4 h-4 text-primary" /> 
                Data Tujuan Pembelajaran
              </h3>
              
              {!protaData ? (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm mb-4">
                  <AlertCircle className="w-4 h-4 inline mr-1 mb-0.5" />
                  <strong>Belum ada Prota.</strong><br/>
                  Anda perlu men-generate Program Tahunan terlebih dahulu untuk mendapatkan daftar TP.
                </div>
              ) : (
                <div className="p-3 bg-white border rounded-md shadow-sm mb-4 max-h-[300px] overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    {protaData.prota.length} TP dari Program Tahunan:
                  </p>
                  <ol className="text-xs space-y-2 list-decimal list-inside">
                    {protaData.prota.map((item, idx) => (
                      <li key={item.no || idx} className="text-slate-700 leading-relaxed">
                        {item.tujuan_pembelajaran}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={() => {
                if (isLocked && onShowUpsell) onShowUpsell();
                else handleGenerate();
              }}
              disabled={isGenerating || !protaData || protaData.prota.length === 0}
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generate Ulang...</> : (kktpData ? "Generate Ulang KKTP" : "Generate KKTP")}
            </Button>
            
            {genError && (
              <p className="text-xs text-red-500 mt-2">{genError}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white p-4">
          {kktpData ? (
             <KKTPPreview
                kktpData={kktpData}
                formData={{ mataPelajaran: cpData?.mataPelajaran || workspace.subject, fase: cpData?.fase || workspace.phase, kelas: cpData?.kelas || workspace.grade } as any}
                onExportWord={() => exportKktpToWord(kktpData!, {
                  mataPelajaran: cpData?.mataPelajaran || workspace.subject,
                  fase: cpData?.fase || workspace.phase,
                  kelas: cpData?.kelas || workspace.grade,
                  ...(profile || {})
                })}
                onDataChange={setKktpData}
             />
          ) : (
            <div className="border border-dashed rounded-lg h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
              <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
              <p>Belum ada data KKTP.</p>
              <p className="text-sm mt-1">Klik Generate untuk menyusun rubrik penilaian secara otomatis.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t flex justify-end shrink-0 bg-white">
        <Button onClick={handleSave} disabled={isSaving || !kktpData}>
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan & Lanjut"}
        </Button>
      </div>
    </div>
  );
};
