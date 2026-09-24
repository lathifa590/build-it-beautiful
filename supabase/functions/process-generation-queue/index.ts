import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // ponytail: atomic claim via RPC FOR UPDATE SKIP LOCKED; scale to dedicated queue when >100 jobs/min
    let jobs: any[] | null = null;
    const { data: claimed, error: claimError } = await supabase.rpc("claim_generation_jobs", { p_limit: 1 });
    if (claimError) {
      // fallback for DB before migration applied (select+update)
      console.warn("claim_generation_jobs failed, fallback:", claimError.message);
      const { data: pending, error: fetchError } = await supabase.from("generation_queue").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(1);
      if (fetchError) throw fetchError;
      if (!pending || pending.length === 0) {
        return new Response(JSON.stringify({ message: "No pending jobs" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const ids = pending.map((j: any) => j.id);
      await supabase.from("generation_queue").update({ status: "processing" }).in("id", ids);
      jobs = pending;
    } else {
      jobs = claimed as any[];
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending jobs" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} for workspace ${job.workspace_id}, pertemuan ${job.pertemuan_id}, type ${job.jenis_dokumen}`);
        const { data: workspace, error: wsError } = await supabase.from("workspaces").select("*").eq("id", job.workspace_id).single();
        if (wsError || !workspace) throw new Error(`Workspace not found: ${wsError?.message || "no data"}`);

        const payload: any = { ...(job.payload || {}) };
        let baseFormData = payload.baseFormData || payload.data;
        if (!baseFormData) baseFormData = {};
        baseFormData.admin_override_user_id = workspace.user_id;

        if (job.jenis_dokumen === "prepare_pertemuan") {
          console.log(`Executing preparation steps for pertemuan ${job.pertemuan_id}`);
          try {
            const cpRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ type: "kontekstualisasi-cp", data: baseFormData }),
              signal: AbortSignal.timeout(30000),
            });
            if (cpRes.ok) {
              const cpData = await cpRes.json();
              if (cpData?.data?.cp_kontekstual) baseFormData.capaianPembelajaran = cpData.data.cp_kontekstual;
            }
          } catch (e) { console.warn("Kontekstualisasi CP failed", e); }
          if (!baseFormData.modelPembelajaran || baseFormData.modelPembelajaran === "AI Auto-Select" || !baseFormData.metodePembelajaran || baseFormData.metodePembelajaran.length === 0) {
            try {
              const suggestRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
                body: JSON.stringify({ type: "suggest-desain-pembelajaran", data: baseFormData }),
                signal: AbortSignal.timeout(30000),
              });
              if (suggestRes.ok) {
                const sData = await suggestRes.json();
                const s = sData?.data;
                if (s) {
                  if (s.modelPembelajaran) baseFormData.modelPembelajaran = s.modelPembelajaran;
                  if (s.metodePembelajaran) baseFormData.metodePembelajaran = s.metodePembelajaran;
                  if (s.dimensiProfilLulusan || s.dimensiProfilPelajarPancasila) {
                    baseFormData.dimensiProfilLulusan = (s.dimensiProfilLulusan || s.dimensiProfilPelajarPancasila).map((d: string) => { const m = d.match(/DPL\s*\d/i); return m ? m[0].toUpperCase().replace(/\s+/, " ") : d; });
                  }
                  if (s.nilaiKarakter) baseFormData.nilaiKarakter = s.nilaiKarakter;
                }
              }
            } catch (e) { console.warn("Suggest desain failed", e); }
          }
          try {
            const afRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ type: "auto-fill", data: baseFormData }),
              signal: AbortSignal.timeout(30000),
            });
            if (afRes.ok) {
              const afData = await afRes.json();
              const ag = afData?.data?.auto_generated || afData?.auto_generated;
              if (ag) {
                // AI-first: hasil auto-fill menimpa isian lama (bukan sebaliknya)
                // agar konten selalu kontekstual dengan materi pertemuan ini.
                // Semantik disamakan dengan src/lib/autofill.ts (applyAutoGeneratedFields).
                if (ag.identifikasi_murid) {
                  baseFormData.aspekPengetahuanAwal = ag.identifikasi_murid.aspek_pengetahuan_awal || baseFormData.aspekPengetahuanAwal || "";
                  baseFormData.aspekMinat = ag.identifikasi_murid.aspek_minat || baseFormData.aspekMinat || "";
                  baseFormData.aspekLatarBelakang = ag.identifikasi_murid.aspek_latar_belakang || baseFormData.aspekLatarBelakang || "";
                  baseFormData.aspekKebutuhanBelajar = ag.identifikasi_murid.aspek_kebutuhan_belajar || baseFormData.aspekKebutuhanBelajar || "";
                }
                if (ag.materi_pengetahuan) {
                  baseFormData.materiPengetahuan = {
                    faktual: ag.materi_pengetahuan.faktual || baseFormData.materiPengetahuan?.faktual || "",
                    konseptual: ag.materi_pengetahuan.konseptual || baseFormData.materiPengetahuan?.konseptual || "",
                    prosedural: ag.materi_pengetahuan.prosedural || baseFormData.materiPengetahuan?.prosedural || "",
                    metakognitif: ag.materi_pengetahuan.metakognitif || baseFormData.materiPengetahuan?.metakognitif || "",
                  };
                }
                baseFormData.dimensiProfilLulusan = (ag.dimensi_profil_lulusan?.length ? ag.dimensi_profil_lulusan : null) || baseFormData.dimensiProfilLulusan || [];
                baseFormData.dimensiProfilLulusanDeskripsi = ag.dpl_deskripsi || "";
                baseFormData.nilaiKarakter = (ag.nilai_karakter?.length ? ag.nilai_karakter : null) || baseFormData.nilaiKarakter || [];
                baseFormData.kaitanKehidupan = ag.kaitan_kehidupan || "";
                baseFormData.pemahamanBermakna = ag.pemahaman_bermakna || "";
                baseFormData.topikPancaCinta = ag.topik_panca_cinta || [];
                baseFormData.topikPancaCintaDeskripsi = ag.panca_cinta_deskripsi || "";
                baseFormData.materiIntegrasiKBC = ag.materi_integrasi_kbc || "";
                baseFormData.lintasDisiplinIlmu = ag.lintas_disiplin || {};
                baseFormData.kemitraanPembelajaran = ag.kemitraan || {};
                baseFormData.lingkunganPembelajaranDetail = ag.lingkungan || {};
                baseFormData.pemanfaatanDigitalDetail = ag.pemanfaatan_digital || {};
                baseFormData.auto_generated = ag;
              }
            }
          } catch (e) { console.warn("Auto-fill failed", e); }

          const BACKEND_TYPE_MAP: Record<string, string> = { modul: "modul-pertemuan", lkpd: "lkpd", asesmen: "asesmen", soal: "bankSoal", materi: "materi" };
          const jenisDocs = ["modul", "lkpd", "asesmen", "materi", "soal"];
          const { item, slot, totalMinutes, genSettings } = payload as any;
          const insertData = jenisDocs.map((jenis) => {
            const extra = jenis === "soal" && genSettings?.soalConfig ? { config: genSettings.soalConfig } : {};
            const docPayload = {
              type: BACKEND_TYPE_MAP[jenis],
              data: { ...baseFormData, ...extra, subMateri: item?.materi_pokok || baseFormData.materi, pertemuanTarget: { id: slot?.id || job.pertemuan_id, nomorPertemuan: slot?.sequence || 1, durasi: totalMinutes ? totalMinutes.toString() : "90" }, pertemuanIndex: 0, totalPertemuan: 1 },
            };
            return { workspace_id: job.workspace_id, pertemuan_id: job.pertemuan_id, jenis_dokumen: jenis, payload: docPayload, status: "pending" as const };
          });
          const { error: insertError } = await supabase.from("generation_queue").insert(insertData);
          if (insertError) throw insertError;
          await supabase.from("generation_queue").update({ status: "completed", error_message: null }).eq("id", job.id);
          results.push({ id: job.id, status: "completed" });
        } else {
          if (!payload.data) payload.data = {};
          payload.data.admin_override_user_id = workspace.user_id;
          const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify(payload),
          });
          if (!response.ok) { const t = await response.text(); throw new Error(`generate-content failed: ${response.status} ${t}`); }
          const generatedData: any = await response.json();
          if (generatedData && generatedData.error) throw new Error(`generate-content returned error: ${JSON.stringify(generatedData.error)}`);
          if (!generatedData || Object.keys(generatedData).length === 0) throw new Error(`generate-content returned empty response`);
          let rawData = generatedData.data || generatedData;
          if (job.jenis_dokumen === "modul") { const list = rawData.pertemuan; const inner = (Array.isArray(list) ? list[0] : undefined) ?? rawData; rawData = { ...inner }; }
          const { error: rpcError } = await supabase.rpc("append_generation_result", { p_workspace_id: job.workspace_id, p_pertemuan_id: job.pertemuan_id, p_jenis_dokumen: job.jenis_dokumen, p_generated_data: rawData });
          if (rpcError) throw rpcError;
          await supabase.from("generation_queue").update({ status: "completed", error_message: null }).eq("id", job.id);
          results.push({ id: job.id, status: "completed" });
        }
      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err);
        const newRetryCount = (job.retry_count ?? 0) + 1;
        const newStatus = newRetryCount >= 3 ? "failed" : "pending";
        await supabase.from("generation_queue").update({ status: newStatus, retry_count: newRetryCount, error_message: err.message || String(err) }).eq("id", job.id);
        results.push({ id: job.id, status: newStatus, error: err.message });
      }
    }
    return new Response(JSON.stringify({ processed: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Queue Processor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
