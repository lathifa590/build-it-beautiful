import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { CPSelectorModal } from "@/components/modul/CPSelectorModal";
import { supabase } from "@/integrations/supabase/client";
import { Workspace } from "@/types/workspace";
import { useTpGenerator } from "@/hooks/useTpGenerator";
import { KalenderPendidikanForm } from "@/components/modul/KalenderPendidikanForm";
import type { KalenderPendidikan } from "@/types/modul";
import { DEFAULT_KALENDER_PENDIDIKAN } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";

interface TPItem {
  id?: string;
  code: string;
  sequence: number;
  description: string;
}

interface StepCpTpProps {
  workspace: Workspace;
  onNext: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const StepCpTp: React.FC<StepCpTpProps> = ({ workspace, onNext, isLocked, onShowUpsell }) => {
  const [showCpModal, setShowCpModal] = useState(false);
  const [cpContent, setCpContent] = useState("");
  const [ruangLingkupMateri, setRuangLingkupMateri] = useState("");
  const [kalenderData, setKalenderData] = useState<KalenderPendidikan>(DEFAULT_KALENDER_PENDIDIKAN);
  
  const [tpItems, setTpItems] = useState<TPItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { generate: generateTp, isLoading: isGenerating, error: genError } = useTpGenerator();

  // 1. Load existing data if any
  useEffect(() => {
    const loadData = async () => {
      try {
        // Find existing CP/TP plan
        const { data: plans } = await supabase
          .from("curriculum_plans")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("type", "tp")
          .limit(1);

        if (plans && plans.length > 0) {
          const plan = plans[0];
          if (plan.content) {
            const c = plan.content as any;
            setCpContent(c.cp || "");
            if (c.ruangLingkupMateri) {
              setRuangLingkupMateri(c.ruangLingkupMateri);
            }
            if (c.kalender) {
              setKalenderData(c.kalender);
            }
          }

          // Load TP items
          const { data: items } = await supabase
            .from("tp_items")
            .select("*")
            .eq("tp_plan_id", plan.id)
            .order("sequence", { ascending: true });

          if (items) {
            setTpItems(items.map((i: any) => ({
              id: i.id,
              code: i.code,
              sequence: i.sequence,
              description: i.description
            })));
          }
        }
      } catch (err) {
        console.error("Error loading TP plan:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    
    if (workspace.id) loadData();
  }, [workspace.id]);

  const handleCpSelect = (cp: string) => {
    setCpContent(cp);
    setShowCpModal(false);
  };

  const handleAddTp = () => {
    setTpItems([
      ...tpItems, 
      { code: `TP ${tpItems.length + 1}`, sequence: tpItems.length + 1, description: "" }
    ]);
  };

  const handleUpdateTp = (index: number, field: keyof TPItem, value: string) => {
    const newItems = [...tpItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setTpItems(newItems);
  };

  const handleRemoveTp = (index: number) => {
    const newItems = [...tpItems];
    newItems.splice(index, 1);
    // Re-sequence
    newItems.forEach((item, i) => { item.sequence = i + 1; });
    setTpItems(newItems);
  };

  const handleGenerateAI = async () => {
    if (!cpContent) {
      alert("Pilih Capaian Pembelajaran terlebih dahulu.");
      return;
    }

    if (tpItems.length > 0) {
      const confirmMsg = "Generate ulang akan mengganti daftar TP saat ini. Lanjutkan?";
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    const result = await generateTp({
      cp: cpContent,
      mataPelajaran: workspace.subject,
      fase: workspace.phase,
      kelas: workspace.grade,
      kalender: kalenderData,
      ruangLingkupMateri: ruangLingkupMateri
    });

    if (result) {
      // mapping dari hasil AI ke local format
      const newTpItems = result.map((item, idx) => ({
        code: item.code || `TP ${idx + 1}`,
        sequence: idx + 1,
        description: item.description
      }));
      setTpItems(newTpItems);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validasi all TPs have description
      if (tpItems.some(tp => !tp.description.trim())) {
        alert("Harap lengkapi semua deskripsi Tujuan Pembelajaran.");
        setIsSaving(false);
        return;
      }

      // 1. Get or Create plan (upsert)
      const { data: planId, error: upsertErr } = await supabase.rpc("upsert_curriculum_plan", {
        p_workspace_id: workspace.id,
        p_type: "tp",
        p_semester: null,
        p_content: {
          cp: cpContent,
          mataPelajaran: workspace.subject,
          fase: workspace.phase,
          kelas: workspace.grade,
          kalender: kalenderData,
          ruangLingkupMateri: ruangLingkupMateri
        }
      });

      if (upsertErr) throw upsertErr;

      // 2. Save items atomically with snapshot
      const { error: saveErr } = await supabase.rpc("save_tp_plan", {
        p_workspace_id: workspace.id,
        p_tp_plan_id: planId,
        p_content: {
          cp: cpContent,
          mataPelajaran: workspace.subject,
          fase: workspace.phase,
          kelas: workspace.grade,
          kalender: kalenderData,
          ruangLingkupMateri: ruangLingkupMateri
        },
        p_items: tpItems
      });

      if (saveErr) {
        alert(saveErr.message || "Gagal menyimpan Tujuan Pembelajaran");
        return;
      }

      onNext();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-8">
      {/* Workspace Context Header */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Capaian & Tujuan Pembelajaran</h2>
        
        <div className="inline-flex flex-col bg-slate-100 rounded-lg px-4 py-3 border">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Workspace Aktif</div>
          <div className="font-medium text-slate-900">{workspace.subject}</div>
          <div className="text-sm text-slate-600 mt-0.5 flex items-center gap-2">
            <span>Kelas {workspace.grade}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Fase {workspace.phase}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{workspace.academic_year}</span>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Capaian Pembelajaran Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 uppercase tracking-wider">CAPAIAN PEMBELAJARAN</h3>
        </div>
        
        {cpContent ? (
          <div className="space-y-3 relative">
            <textarea 
              className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm min-h-[120px] focus:bg-white transition-colors"
              value={cpContent}
              onChange={e => setCpContent(e.target.value)}
              placeholder="Teks Capaian Pembelajaran..."
            />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCpModal(true)}>
                Ganti CP
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-md bg-white">
            <p className="text-sm text-muted-foreground mb-4">Belum ada CP yang dipilih</p>
            <Button onClick={() => setShowCpModal(true)}>Pilih CP Resmi</Button>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Kalender Pendidikan Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 uppercase tracking-wider">KALENDER PENDIDIKAN (ALOKASI WAKTU)</h3>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-4">
          <p className="text-sm text-slate-500 mb-4">
            Alokasi waktu ini akan digunakan oleh AI untuk memperkirakan seberapa banyak dan seberapa detail Tujuan Pembelajaran yang proporsional untuk diajarkan selama 1 tahun ajaran.
          </p>
          <KalenderPendidikanForm 
            kalender={kalenderData} 
            onChange={(newData) => setKalenderData(newData)} 
          />
        </div>

        {/* Ruang Lingkup Materi Section */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden mt-4">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-700">TOPIK / RUANG LINGKUP MATERI (OPSIONAL NAMUN DIREKOMENDASIKAN)</h4>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-slate-500 mb-3">
              Ketikkan topik atau materi spesifik yang akan diajarkan dari CP ini, pisahkan dengan koma atau baris baru (misal: <i>Procedure Text, Narrative Text</i>). Ini akan sangat membantu AI memecah CP yang terlalu luas menjadi belasan Tujuan Pembelajaran yang lebih riil.
            </p>
            <Textarea
              className="min-h-[100px] border-slate-200 focus:border-primary/50 text-slate-700 placeholder:text-slate-400"
              placeholder="Masukkan ruang lingkup materi di sini..."
              value={ruangLingkupMateri}
              onChange={(e) => setRuangLingkupMateri(e.target.value)}
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Tujuan Pembelajaran Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-base font-semibold text-slate-800 uppercase tracking-wider">TUJUAN PEMBELAJARAN</h3>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              disabled={isGenerating || !cpContent}
              onClick={() => {
                if (isLocked && onShowUpsell) onShowUpsell();
                else handleGenerateAI();
              }}
              className="flex-none gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyusun TP...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2 text-amber-200" /> Buat TP dengan AI</>
              )}
            </Button>
            <Button variant="outline" onClick={handleAddTp} className="flex-none px-3">
              <Plus className="w-4 h-4 mr-1" /> Manual
            </Button>
          </div>
        </div>

        {!cpContent && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
            Pilih Capaian Pembelajaran terlebih dahulu untuk menyusun Tujuan Pembelajaran dengan AI.
          </div>
        )}

        {genError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            Gagal menyusun TP: {genError}. Data yang sudah Anda isi tidak berubah.
          </div>
        )}

        {tpItems.length > 0 ? (
          <div className="space-y-3 mt-4">
            {tpItems.map((tp, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 border border-slate-200 rounded-md bg-white shadow-sm group hover:border-slate-300 transition-colors">
                <div className="w-20 sm:w-24 shrink-0">
                  <Input 
                    value={tp.code} 
                    onChange={e => handleUpdateTp(idx, "code", e.target.value)} 
                    placeholder="Kode" 
                    className="font-medium bg-slate-50"
                  />
                </div>
                <div className="flex-1">
                  <textarea 
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[40px] resize-y"
                    value={tp.description} 
                    onChange={e => handleUpdateTp(idx, "description", e.target.value)} 
                    placeholder="Deskripsi Tujuan Pembelajaran" 
                    rows={2}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-destructive hover:bg-destructive/10 shrink-0" 
                  onClick={() => handleRemoveTp(idx)}
                  title="Hapus TP"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-md bg-slate-50 text-slate-500">
            <p className="text-sm mb-4">Belum ada Tujuan Pembelajaran yang disusun.</p>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      <div className="pt-2 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !cpContent || tpItems.length === 0}
          className="min-w-[160px]"
          size="lg"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan & Lanjut"}
        </Button>
      </div>

      <CPSelectorModal 
        open={showCpModal} 
        onClose={() => setShowCpModal(false)}
        mataPelajaran={workspace.subject}
        fase={workspace.phase}
        onSelectCP={handleCpSelect} 
      />
    </div>
  );
};
