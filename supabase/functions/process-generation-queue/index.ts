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
        // payload format from queue: { type: 'lkpd', data: {...actual data...} }
        const payload = { ...(job.payload || {}) } as any;
        if (!payload.data) payload.data = {};
        payload.data.admin_override_user_id = workspace.user_id;

        // Call generate-content Edge Function
        // Using fetch directly to the edge function URL
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
        
        // Check if the response body itself contains an error
        if (generatedData && generatedData.error) {
          throw new Error(`generate-content returned error: ${JSON.stringify(generatedData.error)}`);
        }
        
        // Validate that we actually got content (not empty)
        if (!generatedData || Object.keys(generatedData).length === 0) {
          throw new Error(`generate-content returned empty response`);
        }
        
        // Ensure result structure - use existing generation_result or empty object
        let currentResult: any = workspace.generation_result || {};
        if (!currentResult.pertemuanDocs) {
          currentResult.pertemuanDocs = {};
        }
        if (!currentResult.pertemuanDocs[job.pertemuan_id]) {
          currentResult.pertemuanDocs[job.pertemuan_id] = {};
        }

        // Merge generated document back into workspace JSON
        currentResult.pertemuanDocs[job.pertemuan_id][job.jenis_dokumen] = generatedData;

        // Save back to workspace - if column doesn't exist, this will fail gracefully
        const { error: updateWsError } = await supabase
          .from("workspaces")
          .update({ generation_result: currentResult })
          .eq("id", job.workspace_id);

        if (updateWsError) {
          console.error("Failed to update workspace:", updateWsError.message);
          throw updateWsError;
        }

        // Mark job as completed
        await supabase
          .from("generation_queue")
          .update({ status: "completed", error_message: null })
          .eq("id", job.id);
          
        results.push({ id: job.id, status: "completed" });

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
