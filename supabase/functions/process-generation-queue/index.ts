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
    // Only accept POST (could be triggered by pg_cron or HTTP service)
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // No strict auth check - this function is triggered by pg_cron internally
    // Supabase gateway handles JWT validation at the infrastructure level

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Fetch pending jobs
    const { data: jobs, error: fetchError } = await supabase
      .from("generation_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(3); // Process 3 at a time to prevent timeout

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Mark as processing
    const jobIds = jobs.map((j) => j.id);
    await supabase
      .from("generation_queue")
      .update({ status: "processing" })
      .in("id", jobIds);

    const results = [];

    // 3. Process each job
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} for workspace ${job.workspace_id}, pertemuan ${job.pertemuan_id}, type ${job.jenis_dokumen}`);
        
        // Fetch the workspace to ensure it exists and get the user_id
        const { data: workspace, error: wsError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", job.workspace_id)
          .single();

        if (wsError || !workspace) {
          console.error("Workspace fetch error:", wsError?.message, "for workspace_id:", job.workspace_id);
          throw new Error(`Workspace not found: ${wsError?.message || 'no data returned'}`);
        }

        // Add admin_override_user_id to data so generate-content knows whose quota to use
        const payload = { ...(job.payload || {}) } as any;
        let baseFormData = payload.baseFormData || payload.data;
        if (!baseFormData) baseFormData = {};
        baseFormData.admin_override_user_id = workspace.user_id;

        if (job.jenis_dokumen === 'prepare_pertemuan') {
          console.log(`Executing preparation steps for pertemuan ${job.pertemuan_id}`);
          
          // 1. Kontekstualisasi CP
          try {
            const cpRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ type: 'kontekstualisasi-cp', data: baseFormData }),
            });
            if (cpRes.ok) {
              const cpData = await cpRes.json();
              if (cpData?.data?.cp_kontekstual) baseFormData.capaianPembelajaran = cpData.data.cp_kontekstual;
            }
          } catch (e) {
            console.warn("Kontekstualisasi CP failed", e);
          }

          // 2. Suggest Desain Pembelajaran (if needed)
          if (!baseFormData.modelPembelajaran || baseFormData.modelPembelajaran === 'AI Auto-Select' || !baseFormData.metodePembelajaran || baseFormData.metodePembelajaran.length === 0) {
            try {
              const suggestRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({ type: 'suggest-desain-pembelajaran', data: baseFormData }),
              });
              if (suggestRes.ok) {
                const sData = await suggestRes.json();
                const suggestion = sData?.data;
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
              }
            } catch (e) {
              console.warn("Suggest desain failed", e);
            }
          }

          // 3. Auto Fill (to generate DPL deskripsi, kaitan kehidupan, identifikasi murid, etc.)
          try {
            const autoFillRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ type: 'auto-fill', data: baseFormData }),
            });
            if (autoFillRes.ok) {
              const afData = await autoFillRes.json();
              const autoGen = afData?.data?.auto_generated || afData?.auto_generated;
              if (autoGen) {
                baseFormData.auto_generated = autoGen;
              }
            }
          } catch (e) {
            console.warn("Auto-fill failed", e);
          }

          // 4. Create actual jobs for the documents
          const BACKEND_TYPE_MAP: Record<string, string> = {
            modul: 'modul-pertemuan',
            lkpd: 'lkpd',
            asesmen: 'asesmen',
            soal: 'bankSoal',
            materi: 'materi',
          };
          
          const jenisDocs = ['modul', 'lkpd', 'asesmen', 'materi', 'soal'];
          const { item, slot, totalMinutes, genSettings } = payload;
          
          const insertData = jenisDocs.map(jenis => {
            const extra = jenis === 'soal' && genSettings?.soalConfig ? { config: genSettings.soalConfig } : {};
            const docPayload = {
              type: BACKEND_TYPE_MAP[jenis],
              data: {
                ...baseFormData,
                ...extra,
                subMateri: item?.materi_pokok || baseFormData.materi,
                pertemuanTarget: {
                  id: slot?.id || job.pertemuan_id,
                  nomorPertemuan: slot?.sequence || 1,
                  durasi: totalMinutes ? totalMinutes.toString() : '90',
                },
                pertemuanIndex: 0,
                totalPertemuan: 1
              }
            };
            return {
              workspace_id: job.workspace_id,
              pertemuan_id: job.pertemuan_id,
              jenis_dokumen: jenis,
              payload: docPayload,
              status: 'pending'
            };
          });

          const { error: insertError } = await supabase.from('generation_queue').insert(insertData);
          if (insertError) throw insertError;

          // Mark prepare job as completed
          await supabase
            .from("generation_queue")
            .update({ status: "completed", error_message: null })
            .eq("id", job.id);
            
          results.push({ id: job.id, status: "completed" });
          
        } else {
          // Standard document generation
          if (!payload.data) payload.data = {};
          payload.data.admin_override_user_id = workspace.user_id;
  
          // Call generate-content Edge Function
          const generateUrl = `${SUPABASE_URL}/functions/v1/generate-content`;
          const response = await fetch(generateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify(payload),
          });
  
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`generate-content failed: ${response.status} ${errText}`);
          }
  
          const generatedData = await response.json();
          
          if (generatedData && generatedData.error) {
            throw new Error(`generate-content returned error: ${JSON.stringify(generatedData.error)}`);
          }
          
          if (!generatedData || Object.keys(generatedData).length === 0) {
            throw new Error(`generate-content returned empty response`);
          }
          
          let rawData = generatedData.data || generatedData;
          
          if (job.jenis_dokumen === 'modul') {
            const list = rawData.pertemuan;
            const inner = (Array.isArray(list) ? list[0] : undefined) ?? rawData;
            rawData = { ...inner };
          }
          
          const { error: rpcError } = await supabase.rpc('append_generation_result', {
            p_workspace_id: job.workspace_id,
            p_pertemuan_id: job.pertemuan_id,
            p_jenis_dokumen: job.jenis_dokumen,
            p_generated_data: rawData
          });
  
          if (rpcError) {
            console.error("Failed to append generation result:", rpcError.message);
            throw rpcError;
          }
  
          // Mark job as completed
          await supabase
            .from("generation_queue")
            .update({ status: "completed", error_message: null })
            .eq("id", job.id);
            
          results.push({ id: job.id, status: "completed" });
        }

      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err);
        const newRetryCount = job.retry_count + 1;
        const newStatus = newRetryCount >= 3 ? "failed" : "pending";
        
        await supabase
          .from("generation_queue")
          .update({ 
            status: newStatus, 
            retry_count: newRetryCount,
            error_message: err.message || String(err)
          })
          .eq("id", job.id);
          
        results.push({ id: job.id, status: newStatus, error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Queue Processor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
