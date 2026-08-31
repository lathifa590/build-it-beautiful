import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_FORM_DATA } from "@/lib/constants";
import type { Workspace } from "@/types/workspace";
import type { ProsemItemDB, MeetingSlotDB } from "@/hooks/useProsemData";
import { toast } from "sonner";

export const generateWorkspaceModul = async (
  workspace: Workspace,
  prosemItems: Record<string, ProsemItemDB[]>,
  specificSlot?: MeetingSlotDB
) => {
  try {
    // 1. Fetch CP
    const { data: cpData } = await supabase
      .from('curriculum_plans')
      .select('content')
      .eq('workspace_id', workspace.id)
      .eq('type', 'cp')
      .maybeSingle();
      
    const cpContent = (cpData?.content as any)?.cp || '';

    // 2. Fetch User Profile for defaults
    const { data: profile } = await supabase.from('profiles').select('*').maybeSingle();
    
    // Determine which slots to generate
    const slotsToProcess: { item: ProsemItemDB, slot: MeetingSlotDB }[] = [];
    if (specificSlot) {
      const item = Object.values(prosemItems).flat().find(i => i.id === specificSlot.prosem_item_id);
      if (item) slotsToProcess.push({ item, slot: specificSlot });
    } else {
      // Bulk generation for all missing meetings
      Object.values(prosemItems).flat().forEach(item => {
        item.meeting_slots.forEach(slot => {
          if (slot.status === 'planned' || slot.status === 'skipped') { // Assume skipped is also missing
             // Wait, usually it's only when there is no generation for it.
             // We'll just generate for all 'planned'
             if (slot.status === 'planned') {
               slotsToProcess.push({ item, slot });
             }
          }
        });
      });
    }

    if (slotsToProcess.length === 0) {
      toast.info("Tidak ada pertemuan yang perlu di-generate.");
      return false;
    }

    const jpDuration = workspace.jp_duration_minutes || (workspace.phase === 'F' || workspace.phase === 'E' ? 45 : workspace.phase === 'D' ? 40 : 35);
    const genSettings = workspace.generation_settings || {};
    let cpKontekstual = cpContent;
    let baseDimensi: string[] | undefined;
    let baseModel: string | undefined;
    let baseMetode: string[] | undefined;
    let baseKarakter: string[] | undefined;

    // We can contextualize CP and get AI suggest for the first item, or we can do it per meeting?
    // Actually, AI Suggest is per meeting based on TP/Materi. CP is per workspace.
    // For CP, we only contextualize once. But wait, kontekstualisasi CP depends on TP!
    
    let totalInserted = 0;

    toast.loading(`Mempersiapkan antrean untuk ${slotsToProcess.length} pertemuan...`, { id: 'gen-queue' });

    for (const { item, slot } of slotsToProcess) {
      const totalMinutes = (slot.planned_jp || 2) * jpDuration;
      
      const tps = (item.tp_snapshot || []).map((tp: any) => `${tp.code || `TP${item.sequence}`}: ${tp.description || tp.teks}`).join('\n');

      const baseFormData = {
        ...DEFAULT_FORM_DATA,
        ...(profile ? profile : {}),
        mataPelajaran: workspace.subject,
        fase: workspace.phase,
        kelas: workspace.grade.toString(),
        materi: item.materi_pokok,
        capaianPembelajaran: cpContent, // will be updated
        tujuanPembelajaran: tps,
        pertemuan: [{ id: slot.id, nomorPertemuan: slot.sequence, durasi: totalMinutes.toString() }],
      };

      // Kontekstualisasi CP per meeting (using its TP)
      try {
        const { data: cpRes } = await supabase.functions.invoke('generate-content', { 
          body: { type: 'kontekstualisasi-cp', data: baseFormData }
        });
        if (cpRes?.data?.cp_kontekstual) {
          baseFormData.capaianPembelajaran = cpRes.data.cp_kontekstual;
        }
      } catch (e) {
        console.warn("Kontekstualisasi CP gagal", e);
      }

      // Apply Global Settings
      if (genSettings.modelPembelajaran && genSettings.modelPembelajaran !== 'AI Auto-Select') {
        baseFormData.modelPembelajaran = genSettings.modelPembelajaran;
      }
      if (genSettings.metodePembelajaran && !genSettings.metodePembelajaran.includes('AI Auto-Select')) {
        baseFormData.metodePembelajaran = genSettings.metodePembelajaran;
      }

      // Suggest Design if AI Auto-Select
      if (!baseFormData.modelPembelajaran || baseFormData.modelPembelajaran === 'AI Auto-Select' || !baseFormData.metodePembelajaran || baseFormData.metodePembelajaran.length === 0) {
        try {
          const { data: suggestRes } = await supabase.functions.invoke('generate-content', { 
            body: { type: 'suggest-desain-pembelajaran', data: baseFormData }
          });
          const suggestion = suggestRes?.data;
          if (suggestion) {
            if (suggestion.modelPembelajaran) baseFormData.modelPembelajaran = suggestion.modelPembelajaran;
            if (suggestion.metodePembelajaran) baseFormData.metodePembelajaran = suggestion.metodePembelajaran;
            if (suggestion.dimensiProfilLulusan || suggestion.dimensiProfilPelajarPancasila) {
              baseFormData.dimensiProfilLulusan = (suggestion.dimensiProfilLulusan || suggestion.dimensiProfilPelajarPancasila).map((d: string) => { 
                  const match = d.match(/DPL\s*\d/i); 
                  return match ? match[0].toUpperCase().replace(/\s+/, ' ') : d; 
              });
            }
            if (suggestion.nilaiKarakter) baseFormData.nilaiKarakter = suggestion.nilaiKarakter;
          }
        } catch (e) {
          console.warn("Suggest desain gagal", e);
        }
      }

      // Prepare payloads for 5 documents
      const jenisDocs = ['modul', 'lkpd', 'asesmen', 'materi', 'tindakLanjut'] as const;
      const insertData = jenisDocs.map(jenis => {
        const payload = {
          formData: baseFormData,
          pertemuan: {
            id: slot.id,
            nomor: slot.sequence,
            durasiMenit: totalMinutes,
            materiPokok: item.materi_pokok,
            tujuanPertemuan: tps,
          },
          jenis,
          totalPertemuan: 1, // We generate them individually
          extra: jenis === 'soal' && genSettings.soalConfig ? { config: genSettings.soalConfig } : undefined,
          pertemuanId: slot.id,
          nomorPertemuan: slot.sequence,
          durasiMenit: totalMinutes,
        };

        return {
          workspace_id: workspace.id,
          pertemuan_id: slot.id,
          jenis_dokumen: jenis,
          payload,
          status: 'pending'
        };
      });

      const { error } = await supabase.from('generation_queue').insert(insertData);
      if (!error) {
        totalInserted += insertData.length;
      }
    }

    if (totalInserted > 0) {
      toast.success(`${totalInserted} dokumen berhasil dimasukkan ke antrean`, { id: 'gen-queue' });
      await supabase.from('workspaces').update({ is_autogenerated: true }).eq('id', workspace.id);
      // Trigger background processing
      supabase.functions.invoke('process-generation-queue').catch(console.error);
      return true;
    } else {
      toast.error(`Gagal memasukkan dokumen ke antrean`, { id: 'gen-queue' });
      return false;
    }
  } catch (error) {
    console.error("Error generating workspace modul:", error);
    toast.error(`Terjadi kesalahan: ${error instanceof Error ? error.message : String(error)}`, { id: 'gen-queue' });
    return false;
  }
};
