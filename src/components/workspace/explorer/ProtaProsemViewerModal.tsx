import React, { useState } from "react";
import { X, Download, FileText, Loader2 } from "lucide-react";
import type { Workspace } from "@/types/workspace";
import { useProtaData } from "@/hooks/useProtaData";
import { exportProtaProsemToExcel } from "@/lib/export-excel";
import { supabase } from "@/integrations/supabase/client";
import { ProtaPreview } from "@/components/modul/ProtaPreview";
import { ProsemPreview } from "@/components/modul/ProsemPreview";
import { KKTPPreview } from "@/components/modul/KKTPPreview";
import { exportProtaToWord, exportProsemToWord, exportKktpToWord } from "@/lib/export-word";
import { useKktpGenerator } from "@/hooks/useKktpGenerator";
import type { ProsemData, KKTPData } from "@/types/modul";

interface ProtaProsemViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export const ProtaProsemViewerModal: React.FC<ProtaProsemViewerModalProps> = ({
  isOpen,
  onClose,
  workspace,
}) => {
  const [activeTab, setActiveTab] = useState<"prota" | "prosem" | "kktp">("prota");
  const { protaData, isLoading: isProtaLoading } = useProtaData(isOpen ? workspace.id : null);
  const { generate, isLoading: isGenerating, error: genError } = useKktpGenerator();
  const [isSavingKktp, setIsSavingKktp] = useState(false);

  const [prosemSem1, setProsemSem1] = useState<ProsemData | null>(null);
  const [prosemSem2, setProsemSem2] = useState<ProsemData | null>(null);
  const [kktpData, setKktpData] = useState<KKTPData | null>(null);
  const [profile, setProfile] = useState<{namaPenyusun?: string; nipPenyusun?: string; kepalaSekolah?: string; nipKepalaSekolah?: string} | null>(null);
  const [isProsemLoading, setIsProsemLoading] = useState(false);

  React.useEffect(() => {
    if (!isOpen || !workspace.id) return;
    
    const loadData = async () => {
      setIsProsemLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
        }

        const { data: plans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .in("type", ["prosem", "kktp"]);
          
        if (plans) {
          const ps1 = plans.find(p => p.type === 'prosem' && p.semester === 1);
          if (ps1?.content) setProsemSem1(ps1.content as ProsemData);
          
          const ps2 = plans.find(p => p.type === 'prosem' && p.semester === 2);
          if (ps2?.content) setProsemSem2(ps2.content as ProsemData);
          
          const kktp = plans.find(p => p.type === 'kktp');
          if (kktp?.content) setKktpData(kktp.content as KKTPData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProsemLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, workspace.id]);

  if (!isOpen) return null;

  const isLoading = isProtaLoading || isProsemLoading;

  const handleExport = () => {
    exportProtaProsemToExcel(workspace, protaData, prosemSem1, prosemSem2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-2xl border-2 border-foreground shadow-brutal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-lg border border-primary/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold font-heading text-lg leading-tight">Perencanaan (Prota, Prosem, KKTP)</h2>
              <p className="text-xs text-muted-foreground">{workspace.subject} • Kelas {workspace.grade}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300 rounded-md transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b-2 border-foreground bg-muted/10 overflow-x-auto whitespace-nowrap shrink-0">
          <button
            onClick={() => setActiveTab("prota")}
            className={`px-4 py-3 text-base font-bold border-b-2 -mb-[2px] transition-colors ${
              activeTab === "prota" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Program Tahunan (Prota)
          </button>
          <button
            onClick={() => setActiveTab("prosem")}
            className={`px-4 py-3 text-base font-bold border-b-2 -mb-[2px] transition-colors ${
              activeTab === "prosem" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Program Semester (Prosem)
          </button>
          <button
            onClick={() => setActiveTab("kktp")}
            className={`px-4 py-3 text-base font-bold border-b-2 -mb-[2px] transition-colors ${
              activeTab === "kktp" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            KKTP
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-muted/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Memuat data...</p>
            </div>
          ) : activeTab === "prota" ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 h-full">
              {!protaData?.prota || protaData.prota.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Belum ada data Program Tahunan.
                </div>
              ) : (
                <ProtaPreview 
                  protaData={protaData} 
                  formData={{ cp: '', mataPelajaran: workspace.subject, fase: workspace.grade, kelas: workspace.grade, sekolah: workspace.name } as any}
                  onExportWord={() => exportProtaToWord(protaData, { 
                    mataPelajaran: workspace.subject, 
                    fase: workspace.grade, 
                    kelas: workspace.grade,
                    ...(profile || {})
                  } as any)}
                  onExportExcel={handleExport}
                  kurikulum={workspace.curriculum}
                />
              )}
            </div>
          ) : activeTab === "prosem" ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 h-full">
              {!prosemSem1 && !prosemSem2 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Belum ada data Program Semester.
                </div>
              ) : (
                <ProsemPreview 
                  prosemSem1={prosemSem1} 
                  prosemSem2={prosemSem2} 
                  formData={{ cp: '', mataPelajaran: workspace.subject, fase: workspace.grade, kelas: workspace.grade, sekolah: workspace.name } as any}
                  onExportWord={(semester) => {
                    const data = semester === 1 ? prosemSem1 : prosemSem2;
                    if (data) {
                      exportProsemToWord(data, { 
                        mataPelajaran: workspace.subject, 
                        fase: workspace.grade, 
                        kelas: workspace.grade,
                        ...(profile || {})
                      } as any, semester);
                    }
                  }}
                  onExportExcel={handleExport}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 h-full">
              {!kktpData?.kktp?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-base mb-4">Belum ada data KKTP.</p>
                  <button
                    onClick={async () => {
                      if (!protaData?.prota || protaData.prota.length === 0) {
                        alert("Program Tahunan belum tersedia. Tidak bisa membuat KKTP.");
                        return;
                      }
                      const tpList = protaData.prota.map(p => p.tujuan_pembelajaran);
                      const result = await generate({
                        tpList,
                        mataPelajaran: workspace.subject,
                        fase: workspace.grade,
                        kelas: workspace.grade,
                      });
                      if (result) {
                        setKktpData(result);
                        setIsSavingKktp(true);
                        try {
                          await supabase.rpc("upsert_curriculum_plan", {
                            p_workspace_id: workspace.id,
                            p_type: "kktp",
                            p_semester: null,
                            p_content: result
                          });
                        } catch (err) {
                          console.error("Error saving KKTP:", err);
                        } finally {
                          setIsSavingKktp(false);
                        }
                      }
                    }}
                    disabled={isGenerating || isSavingKktp}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {isGenerating || isSavingKktp ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sedang Membuat...</>
                    ) : (
                      "Buat KKTP Sekarang"
                    )}
                  </button>
                  {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
                </div>
              ) : (
                <KKTPPreview 
                  kktpData={kktpData} 
                  formData={{ cp: '', mataPelajaran: workspace.subject, fase: workspace.grade, kelas: workspace.grade, sekolah: workspace.name } as any}
                  onExportWord={() => exportKktpToWord(kktpData, { 
                    mataPelajaran: workspace.subject, 
                    fase: workspace.grade, 
                    kelas: workspace.grade,
                    ...(profile || {})
                  })}
                  onDataChange={(newData) => setKktpData(newData)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
