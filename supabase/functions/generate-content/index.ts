import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPertemuanContext } from "./pertemuan-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping sintaks berdasarkan model pembelajaran dengan distribusi ke fase MEMAHAMI/MENGAPLIKASI/MEREFLEKSI
// Module-scoped agar bisa diakses oleh kedua case ("modul" dan "modul-pertemuan").
const SINTAKS_MAP: Record<string, { sintaks: string[]; deskripsi: string; distribusi: { memahami: string[]; mengaplikasi: string[]; merefleksi: string[] } }> = {
  "Project Based Learning (PjBL)": {
    sintaks: [
      "Penentuan Pertanyaan Mendasar (Essential Question)",
      "Perencanaan & Penyusunan Jadwal Proyek",
      "Monitoring Kemajuan Proyek",
      "Pengujian Hasil & Penilaian",
      "Evaluasi Pengalaman & Refleksi"
    ],
    deskripsi: "Pembelajaran berbasis proyek dengan pertanyaan esensial sebagai pemicu",
    distribusi: {
      memahami: ["Penentuan Pertanyaan Mendasar (Essential Question)", "Observasi & Studi Kasus"],
      mengaplikasi: ["Perencanaan & Penyusunan Jadwal Proyek", "Monitoring Kemajuan Proyek", "Pengujian Hasil & Penilaian"],
      merefleksi: ["Evaluasi Pengalaman & Refleksi", "Presentasi & Umpan Balik"]
    }
  },
  "Problem Based Learning (PBL)": {
    sintaks: [
      "Orientasi Peserta Didik pada Masalah",
      "Mengorganisasikan Peserta Didik untuk Belajar",
      "Membimbing Penyelidikan Individual/Kelompok",
      "Mengembangkan dan Menyajikan Hasil Karya",
      "Menganalisis dan Mengevaluasi Proses Pemecahan Masalah"
    ],
    deskripsi: "Pembelajaran berbasis masalah nyata yang menantang",
    distribusi: {
      memahami: ["Orientasi Peserta Didik pada Masalah", "Mengorganisasikan Peserta Didik untuk Belajar"],
      mengaplikasi: ["Membimbing Penyelidikan Individual/Kelompok", "Mengembangkan dan Menyajikan Hasil Karya"],
      merefleksi: ["Menganalisis dan Mengevaluasi Proses Pemecahan Masalah"]
    }
  },
  "Discovery Learning": {
    sintaks: [
      "Stimulasi (Pemberian Rangsangan)",
      "Identifikasi Masalah (Problem Statement)",
      "Pengumpulan Data (Data Collection)",
      "Pengolahan Data (Data Processing)",
      "Pembuktian (Verification)",
      "Menarik Kesimpulan (Generalization)"
    ],
    deskripsi: "Pembelajaran penemuan dengan eksplorasi mandiri",
    distribusi: {
      memahami: ["Stimulasi (Pemberian Rangsangan)", "Identifikasi Masalah (Problem Statement)"],
      mengaplikasi: ["Pengumpulan Data (Data Collection)", "Pengolahan Data (Data Processing)", "Pembuktian (Verification)"],
      merefleksi: ["Menarik Kesimpulan (Generalization)"]
    }
  },
  "Inquiry Learning": {
    sintaks: [
      "Orientasi",
      "Merumuskan Masalah",
      "Merumuskan Hipotesis",
      "Mengumpulkan Data",
      "Menguji Hipotesis",
      "Menarik Kesimpulan"
    ],
    deskripsi: "Pembelajaran inkuiri dengan metode ilmiah",
    distribusi: {
      memahami: ["Orientasi", "Merumuskan Masalah", "Merumuskan Hipotesis"],
      mengaplikasi: ["Mengumpulkan Data", "Menguji Hipotesis"],
      merefleksi: ["Menarik Kesimpulan"]
    }
  },
  "Cooperative Learning": {
    sintaks: [
      "Menyampaikan Tujuan dan Memotivasi Siswa",
      "Menyajikan Informasi",
      "Mengorganisasikan Siswa ke dalam Kelompok",
      "Membimbing Kelompok Bekerja dan Belajar",
      "Evaluasi",
      "Memberikan Penghargaan"
    ],
    deskripsi: "Pembelajaran kooperatif dengan kerja kelompok",
    distribusi: {
      memahami: ["Menyampaikan Tujuan dan Memotivasi Siswa", "Menyajikan Informasi"],
      mengaplikasi: ["Mengorganisasikan Siswa ke dalam Kelompok", "Membimbing Kelompok Bekerja dan Belajar"],
      merefleksi: ["Evaluasi", "Memberikan Penghargaan"]
    }
  },
  "Flipped Classroom": {
    sintaks: [
      "Persiapan Pra-Kelas (Pre-class Learning)",
      "Aktivitas Awal Kelas (Review & Check Understanding)",
      "Aktivitas Inti (Collaborative Learning & Application)",
      "Refleksi dan Penguatan"
    ],
    deskripsi: "Pembelajaran terbalik dengan materi dipelajari di rumah",
    distribusi: {
      memahami: ["Persiapan Pra-Kelas (Pre-class Learning)", "Aktivitas Awal Kelas (Review & Check Understanding)"],
      mengaplikasi: ["Aktivitas Inti (Collaborative Learning & Application)"],
      merefleksi: ["Refleksi dan Penguatan"]
    }
  },
  "Teaching at the Right Level (TaRL)": {
    sintaks: [
      "Asesmen Awal (Baseline Assessment)",
      "Pengelompokan Berdasarkan Level",
      "Pembelajaran Sesuai Level",
      "Asesmen Berkala & Penyesuaian"
    ],
    deskripsi: "Pembelajaran sesuai level kemampuan siswa",
    distribusi: {
      memahami: ["Asesmen Awal (Baseline Assessment)", "Pengelompokan Berdasarkan Level"],
      mengaplikasi: ["Pembelajaran Sesuai Level"],
      merefleksi: ["Asesmen Berkala & Penyesuaian"]
    }
  },
  "Kontekstual (CTL)": {
    sintaks: [
      "Konstruktivisme (Constructivism)",
      "Menemukan (Inquiry)",
      "Bertanya (Questioning)",
      "Masyarakat Belajar (Learning Community)",
      "Pemodelan (Modeling)",
      "Refleksi (Reflection)",
      "Penilaian Autentik (Authentic Assessment)"
    ],
    deskripsi: "Pembelajaran kontekstual dengan 7 komponen utama",
    distribusi: {
      memahami: ["Konstruktivisme (Constructivism)", "Menemukan (Inquiry)", "Bertanya (Questioning)"],
      mengaplikasi: ["Masyarakat Belajar (Learning Community)", "Pemodelan (Modeling)"],
      merefleksi: ["Refleksi (Reflection)", "Penilaian Autentik (Authentic Assessment)"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    // Get user's API key from profile if authenticated
    let userApiKey: string | null = null;
    let useGeminiDirect = false;
    let userProvider: 'gemini' | 'grok' | 'openai' = 'gemini'; // routing target
    let userKeyPool: Array<{ key: string; provider: 'gemini' | 'grok' | 'openai' }> = [];
    let isUsingDemoKeys = false; // true saat menggunakan demo key pool (bukan user key pribadi)
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      let user: any = null; if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && data.admin_override_user_id) { const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(data.admin_override_user_id); user = adminData.user; } else { const { data: authData } = await supabaseAdmin.auth.getUser(token); user = authData.user; }
      
      if (user) {
        // Check account type from allowed_customers
        const { data: customerData } = await supabaseAdmin
          .from('allowed_customers')
          .select('account_type, subscription_expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        const isTrial = customerData?.account_type === 'trial';

        // Block expired annual subscriptions
        if (
          customerData?.account_type === 'annual' &&
          customerData?.subscription_expires_at &&
          new Date(customerData.subscription_expires_at).getTime() < Date.now()
        ) {
          return new Response(JSON.stringify({
            error: 'Langganan tahunan Anda telah berakhir. Silakan perpanjang untuk lanjut menggunakan layanan.',
            errorCode: 'subscription_expired',
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Rate limit check - only for trial users
        let dailyCount = 0;
        if (isTrial) {
          const contentLimit = 100;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const { count } = await supabaseAdmin
            .from('generation_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .neq('content_type', 'image')
            .gte('created_at', today.toISOString());

          dailyCount = count ?? 0;

          if (dailyCount >= contentLimit) {
            return new Response(JSON.stringify({
              error: `Batas harian tercapai (${contentLimit}/hari). Coba lagi besok.`,
              errorCode: 'rate_limit_exceeded',
              remaining: 0,
              limit: contentLimit,
              isTrial
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        // Trial users: skip personal key, go straight to demo keys
        if (!isTrial) {
          // Check user's preferred provider
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('preferred_provider')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const preferredProvider = (profileData?.preferred_provider as 'gemini' | 'grok' | 'openai' | null) || null;
          
          // Fetch ALL active keys (across all providers) so we can fallback cross-provider
          const { data: userKeys } = await supabaseAdmin
            .from('user_api_keys')
            .select('api_key, provider')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true });
          
          if (userKeys && userKeys.length > 0) {
            // Build ordered pool: preferred provider first, then everything else
            const normalized = userKeys.map((k: any) => ({
              key: k.api_key as string,
              provider: ((k.provider as 'gemini' | 'grok' | 'openai') || 'gemini'),
            }));
            const ordered = preferredProvider
              ? [
                  ...normalized.filter(k => k.provider === preferredProvider),
                  ...normalized.filter(k => k.provider !== preferredProvider),
                ]
              : normalized;
            
            userKeyPool = ordered;
            userApiKey = ordered[0].key;
            userProvider = ordered[0].provider;
            useGeminiDirect = true; // route via direct provider call
            console.log(`Key pool: ${ordered.map(k => `${k.provider}/...${k.key.slice(-4)}`).join(', ')}`);
          }
        }

        // Fallback ke demo API keys — gunakan SEMUA key sebagai pool agar lebih tahan banting
        if (!userApiKey) {
          const { data: demoKeys } = await supabaseAdmin
            .from('demo_api_keys')
            .select('api_key')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (demoKeys && demoKeys.length > 0) {
            // Rotasi starting key berdasarkan dailyCount, tapi coba SEMUA key sebagai fallback
            const startIndex = (dailyCount ?? 0) % demoKeys.length;
            const rotatedKeys = [
              ...demoKeys.slice(startIndex),
              ...demoKeys.slice(0, startIndex),
            ];
            userKeyPool = rotatedKeys.map(k => ({ key: k.api_key as string, provider: 'gemini' as const }));
            userApiKey = rotatedKeys[0].api_key;
            useGeminiDirect = true;
            isUsingDemoKeys = true;
            console.log(`Using demo key pool: ${demoKeys.length} keys, starting from index ${startIndex} (trial=${isTrial})`);
          }
        }
      }
    }
    
    // Fallback to Lovable API Key if no user key and no demo key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = userApiKey || LOVABLE_API_KEY;
    
    // Determine endpoint based on which key we're using
    // Native Gemini API for user keys, Lovable AI gateway for default
    const GEMINI_MODEL_CHAIN = [
      "gemini-2.5-flash",
      "gemini-3.0-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash-lite"
    ];
    
    const getGeminiEndpoint = (model: string, key: string) => 
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    
    // Helper: Parse Gemini error untuk pesan yang lebih akurat
    const parseGeminiError = (statusCode: number, errorText: string): { errorCode: string; message: string; isModelNotFound?: boolean } => {
      try {
        const errorJson = JSON.parse(errorText);
        const errorStatus = errorJson?.error?.status || "";
        const errorMessage = errorJson?.error?.message || "";
        
        // Deteksi 404 model not found
        if (statusCode === 404 || errorStatus === "NOT_FOUND") {
          return {
            errorCode: "model_not_found",
            message: `Model tidak tersedia (404). Detail API: ${errorText.substring(0, 300)}`,
            isModelNotFound: true
          };
        }
        
        // Deteksi limit: 0 (kuota belum aktif, bukan habis)
        if (errorStatus === "RESOURCE_EXHAUSTED" || statusCode === 429) {
          if (errorMessage.includes("limit: 0") || errorText.includes("limit: 0")) {
            return {
              errorCode: "quota_unavailable",
              message: "Kuota free tier untuk API Key ini belum aktif (limit: 0). Tunggu 10-60 menit setelah membuat key, atau aktifkan billing di AI Studio."
            };
          }
          return {
            errorCode: "quota_exceeded", 
            message: "Kuota API Key habis untuk hari ini. Coba lagi besok atau gunakan API Key lain."
          };
        }
        
        if (statusCode === 401 || statusCode === 403 || errorStatus === "PERMISSION_DENIED") {
          return {
            errorCode: "invalid_key",
            message: "API Key tidak valid. Periksa kembali key yang dimasukkan."
          };
        }
        
        if (statusCode === 503 || errorStatus === "UNAVAILABLE") {
          return {
            errorCode: "service_unavailable",
            message: "Model sedang mengalami high demand. Sistem akan mencoba model alternatif...",
            isModelNotFound: true
          };
        }
        
        if (statusCode === 400) {
          return {
            errorCode: "bad_request",
            message: "Format request tidak valid. Coba lagi."
          };
        }
        
        return {
          errorCode: "unknown",
          message: errorMessage || "Terjadi kesalahan koneksi API"
        };
      } catch {
        return {
          errorCode: "unknown",
          message: "Terjadi kesalahan koneksi API"
        };
      }
    };
    
    // Helper: Eksekusi request ke Gemini dengan multi-model fallback (429/404)
    // Now also supports multi-key fallback for user_api_keys pool
    const executeGeminiRequest = async (
      requestBody: object, 
      apiKeyToUse: string | string[], 
      modelChain: string[]
    ): Promise<{ response: Response; usedModel: string; triedModels: string[] }> => {
      const triedModels: string[] = [];
      let lastResponse: Response | null = null;
      let lastModel = modelChain[0];
      
      const allUserKeys = Array.isArray(apiKeyToUse) ? apiKeyToUse : [apiKeyToUse];
      
      for (const currentKey of allUserKeys) {
        let allModelsExhausted = true;
        
        for (const model of modelChain) {
          triedModels.push(`gemini/${model}/...${currentKey.slice(-4)}`);
          console.log(`Trying model: ${model} with key ending ...${currentKey.slice(-4)}`);
          
          const response = await fetch(getGeminiEndpoint(model, currentKey), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
          
          lastResponse = response;
          lastModel = model;
          
          if (response.ok) {
            console.log(`Model ${model} berhasil digunakan dengan key ...${currentKey.slice(-4)}`);
            return { response, usedModel: model, triedModels };
          }
          
          // Non-recoverable errors (401, 403, 400) - stop immediately
          if (response.status !== 404 && response.status !== 429 && response.status !== 503) {
            console.log(`Model ${model} error ${response.status} - tidak recoverable`);
            return { response, usedModel: model, triedModels };
          }
          
          console.log(`Model ${model} gagal (${response.status}), mencoba berikutnya...`);
        }
        
        // All models exhausted for this key, try next key
        if (allUserKeys.indexOf(currentKey) < allUserKeys.length - 1) {
          console.log(`All models exhausted for key ...${currentKey.slice(-4)}, trying next key...`);
        }
      }
      
      // All keys and models failed
      console.log(`Semua key dan model gagal`);
      return { response: lastResponse!, usedModel: lastModel, triedModels };
    };
    
    // ============================================================
    // Multi-provider routing (GROK / OpenAI) — wrapper that mimics
    // the Gemini "executeGeminiRequest" return shape so downstream
    // parsing logic does not need to change.
    // For OpenAI-compatible providers, we adapt their response into
    // the Gemini { candidates: [{ content: { parts: [{ text }] } }] }
    // shape via a wrapper Response object.
    // ============================================================
    const PROVIDER_ENDPOINTS: Record<string, string> = {
      grok: 'https://api.x.ai/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions',
    };
    const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
      grok: 'grok-4-fast-reasoning',
      openai: 'gpt-4o-mini',
    };
    
    const callOpenAICompatible = async (
      provider: 'grok' | 'openai',
      apiKeyToUse: string,
      systemText: string,
      userText: string,
      maxTokens: number,
      jsonMode: boolean
    ): Promise<{ response: Response; usedModel: string; triedModels: string[] }> => {
      const model = PROVIDER_DEFAULT_MODEL[provider];
      const endpoint = PROVIDER_ENDPOINTS[provider];
      const allUserKeys: string[] = [apiKeyToUse];
      
      let lastResp: Response | null = null;
      
      for (const currentKey of allUserKeys) {
        const body: any = {
          model,
          messages: [
            ...(systemText ? [{ role: 'system', content: systemText }] : []),
            { role: 'user', content: userText },
          ],
          max_tokens: maxTokens,
        };
        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }
        
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        lastResp = resp;
        
        if (resp.ok) {
          // Adapt OpenAI-format response → Gemini-shape so downstream parser works.
          const oaiJson = await resp.json();
          const text = oaiJson?.choices?.[0]?.message?.content || '';
          const adapted = {
            candidates: [{ content: { parts: [{ text }] } }],
            // also include OpenAI shape so non-Gemini parser works too
            choices: oaiJson?.choices,
          };
          const adaptedResp = new Response(JSON.stringify(adapted), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
          return { response: adaptedResp, usedModel: `${provider}/${model}`, triedModels: [model] };
        }
        
        // 401/403/429/503 → recoverable (try next key). Other errors → stop.
        const recoverable = resp.status === 401 || resp.status === 403 || resp.status === 429 || resp.status === 503;
        if (!recoverable) {
          console.log(`${provider} error ${resp.status} - non-recoverable`);
          return { response: resp, usedModel: model, triedModels: [model] };
        }
        console.log(`${provider} key ...${currentKey.slice(-4)} exhausted (${resp.status}), trying next key`);
      }
      
      return { response: lastResp!, usedModel: model, triedModels: [model] };
    };
    
    // ============================================================
    // Cross-provider executor: iterates the user's full key pool
    // (preferred provider first, others as fallback). Dispatches to
    // either native Gemini or OpenAI-compatible endpoint per entry.
    // Returns Gemini-shaped response (callOpenAICompatible already adapts).
    // ============================================================
    const executeCrossProvider = async (
      systemText: string,
      userText: string,
      maxTokens: number,
      jsonMode: boolean,
      temperature = 0.8,
    ): Promise<{ response: Response; usedModel: string; triedModels: string[] }> => {
      const pool = userKeyPool;
      
      if (pool.length === 0) {
        // Should never happen here (caller guards); fall back to legacy path
        return { response: new Response('no keys', { status: 500 }), usedModel: '', triedModels: [] };
      }
      
      const triedAll: string[] = [];
      let lastResp: Response | null = null;
      
      for (let i = 0; i < pool.length; i++) {
        const entry = pool[i];
        console.log(`[cross-provider] attempt ${i + 1}/${pool.length}: ${entry.provider} ...${entry.key.slice(-4)}`);
        
        if (entry.provider === 'gemini') {
          // Use native Gemini chain for THIS single key
          const geminiBody = {
            contents: [{ role: 'user', parts: [{ text: `${systemText}\n\n${userText}` }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            },
          };
          const r = await executeGeminiRequest(geminiBody, entry.key, GEMINI_MODEL_CHAIN);
          lastResp = r.response;
          triedAll.push(...r.triedModels);
          if (r.response.ok) return { response: r.response, usedModel: `gemini/${r.usedModel}`, triedModels: triedAll };
          // Recoverable status → try next pool entry
          if (r.response.status === 401 || r.response.status === 403 || r.response.status === 429 || r.response.status === 503 || r.response.status === 404) {
            continue;
          }
          // Hard error: surface immediately
          return { response: r.response, usedModel: `gemini/${r.usedModel}`, triedModels: triedAll };
        } else {
          // GROK / OpenAI — single key, single model
          const r = await callOpenAICompatible(entry.provider, entry.key, systemText, userText, maxTokens, jsonMode);
          lastResp = r.response;
          triedAll.push(r.usedModel);
          if (r.response.ok) return { response: r.response, usedModel: r.usedModel, triedModels: triedAll };
          // callOpenAICompatible already classifies; only retry next provider on recoverable
          if (r.response.status === 401 || r.response.status === 403 || r.response.status === 429 || r.response.status === 503) {
            continue;
          }
          return { response: r.response, usedModel: r.usedModel, triedModels: triedAll };
        }
      }
      
      console.log('[cross-provider] all keys exhausted');
      return { response: lastResp!, usedModel: triedAll[triedAll.length - 1] || '', triedModels: triedAll };
    };
    
    // Helper: Sanitasi response markdown (hapus ```json wrapper jika ada)
    const sanitizeJsonResponse = (text: string): string => {
      let cleaned = text.trim();
      // Hapus markdown code block wrapper
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();
      
      // Fix illegal backslash escapes (e.g. \pi, \frac, \times from LaTeX)
      // JSON only allows: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
      cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      // Replace all LITERAL control characters (bare newlines, CRs, tabs) inside the raw string
      // These are invalid inside JSON string values and cause "Bad control character" parse errors.
      // We do a smart replacement: only replace bare \n/\r/\t that are INSIDE a JSON string,
      // meaning not at the structural level. Since the text is a flat pre-parsed string from AI,
      // we replace ALL literal newlines with a space — JSON structural whitespace is irrelevant here
      // because we will re-extract the JSON after this.
      cleaned = cleaned.replace(/[\n\r\t]+/g, ' ');
      
      return cleaned;
    };
    
    const extractJsonFromResponse = (text: string): string => {
      let cleaned = sanitizeJsonResponse(text);
      
      const objectStart = cleaned.indexOf('{');
      const arrayStart = cleaned.indexOf('[');
      const starts = [objectStart, arrayStart].filter((idx) => idx >= 0);
      const start = starts.length ? Math.min(...starts) : -1;

      if (start >= 0) {
        const isObject = cleaned[start] === '{';
        const end = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
        
        if (end > start) {
          return cleaned.substring(start, end + 1);
        }
      }
      
      return cleaned;
    };

    const parseGeneratedJson = (text: string): { parsed?: any; sanitized: string; error?: unknown } => {
      const sanitized = extractJsonFromResponse(text);
      try {
        return { parsed: JSON.parse(sanitized), sanitized };
      } catch (parseError) {
        try {
          const fallbackContent = sanitizeJsonResponse(text);
          return { parsed: JSON.parse(fallbackContent), sanitized: fallbackContent };
        } catch {
          try {
            let repaired = sanitizeJsonResponse(text);
            repaired = extractJsonFromResponse(repaired);
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
            repaired = repaired.replace(/,\s*$/, '');
            for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
            return { parsed: JSON.parse(repaired), sanitized: repaired };
          } catch (repairError) {
            return { sanitized, error: repairError || parseError };
          }
        }
      }
    };

    const extractAiContent = (result: any, directProvider: boolean): string => {
      return directProvider
        ? (result.candidates?.[0]?.content?.parts?.[0]?.text || "")
        : (result.choices?.[0]?.message?.content || "");
    };

    const executeCrossProviderParsedJson = async (
      systemText: string,
      userText: string,
      maxTokens: number,
    ): Promise<{
      ok: boolean;
      parsedContent?: any;
      content?: string;
      sanitizedContent?: string;
      usedModel: string;
      triedModels: string[];
      error?: string;
      errorCode?: string;
    }> => {
      const triedAll: string[] = [];
      let lastError = "Response AI tidak dapat diproses. Coba generate ulang.";
      let lastErrorCode = "parse_error";

      const strictSystemText = `${systemText}\n\nKHUSUS LKPD: Kembalikan JSON murni saja. Jangan memakai markdown, jangan menambah komentar sebelum/sesudah JSON, dan pastikan semua string tertutup.`;
      const strictUserText = `${userText}\n\nOUTPUT WAJIB berupa satu object JSON valid yang langsung dimulai dengan { dan diakhiri dengan }. Tidak boleh ada teks tambahan.`;

      for (let i = 0; i < userKeyPool.length; i++) {
        const entry = userKeyPool[i];
        console.log(`[lkpd-json-fallback] attempt key ${i + 1}/${userKeyPool.length}: ${entry.provider} ...${entry.key.slice(-4)}`);

        if (entry.provider === 'gemini') {
          for (const model of GEMINI_MODEL_CHAIN) {
            const modelLabel = `gemini/${model}/...${entry.key.slice(-4)}`;
            triedAll.push(modelLabel);
            const resp = await fetch(getGeminiEndpoint(model, entry.key), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `${strictSystemText}\n\n${strictUserText}` }] }],
                generationConfig: {
                  temperature: 0.25,
                  maxOutputTokens: maxTokens,
                  responseMimeType: "application/json",
                },
              }),
            });

            if (!resp.ok) {
              const errorText = await resp.text();
              const parsedError = parseGeminiError(resp.status, errorText);
              lastError = parsedError.message;
              lastErrorCode = parsedError.errorCode;
              console.log(`[lkpd-json-fallback] ${modelLabel} failed ${resp.status}: ${parsedError.errorCode}`);
              if (resp.status === 400) {
                return { ok: false, usedModel: `gemini/${model}`, triedModels: triedAll, error: lastError, errorCode: lastErrorCode };
              }
              continue;
            }

            const responseJson = await resp.json();
            const text = extractAiContent(responseJson, true);
            if (!text) {
              lastError = "Model tidak mengembalikan konten LKPD. Sistem mencoba model lain.";
              lastErrorCode = "empty_content";
              continue;
            }
            const parsed = parseGeneratedJson(text);
            if (parsed.parsed) {
              console.log(`[lkpd-json-fallback] parse success with ${modelLabel}`);
              return {
                ok: true,
                parsedContent: parsed.parsed,
                content: text,
                sanitizedContent: parsed.sanitized,
                usedModel: `gemini/${model}`,
                triedModels: triedAll,
              };
            }
            lastError = "Response AI untuk LKPD belum valid sebagai JSON. Sistem mencoba model/key lain.";
            lastErrorCode = "parse_error";
            console.log(`[lkpd-json-fallback] parse failed with ${modelLabel}`);
          }
        } else {
          const r = await callOpenAICompatible(entry.provider, entry.key, strictSystemText, strictUserText, maxTokens, true);
          triedAll.push(...r.triedModels.map((m) => `${entry.provider}/${m}/...${entry.key.slice(-4)}`));
          if (!r.response.ok) {
            lastError = `${entry.provider.toUpperCase()} gagal dipakai untuk LKPD. Sistem mencoba key lain.`;
            lastErrorCode = "provider_error";
            continue;
          }
          const responseJson = await r.response.json();
          const text = extractAiContent(responseJson, true);
          const parsed = parseGeneratedJson(text);
          if (parsed.parsed) {
            return {
              ok: true,
              parsedContent: parsed.parsed,
              content: text,
              sanitizedContent: parsed.sanitized,
              usedModel: r.usedModel,
              triedModels: triedAll,
            };
          }
          lastError = "Response AI untuk LKPD belum valid sebagai JSON. Sistem mencoba key lain.";
          lastErrorCode = "parse_error";
        }
      }

      return { ok: false, usedModel: triedAll[triedAll.length - 1] || "", triedModels: triedAll, error: lastError, errorCode: lastErrorCode };
    };
    const LOVABLE_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API Key tidak tersedia. Silakan tambahkan Gemini API Key di halaman Pengaturan.',
        needApiKey: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test connection
    if (type === "test") {
      let testResponse: Response;
      let usedModel = GEMINI_MODEL_CHAIN[0];
      let triedModels: string[] = [];
      
      if (useGeminiDirect && userKeyPool.length > 0) {
        const result = await executeCrossProvider('', "Say 'test successful' in 2 words", 10, false, 0.2);
        testResponse = result.response;
        usedModel = result.usedModel;
        triedModels = result.triedModels;
      } else if (useGeminiDirect) {
        // Native Gemini API test with multi-model fallback
        const testBody = {
          contents: [{ role: "user", parts: [{ text: "Say 'test successful' in 2 words" }] }],
          generationConfig: { maxOutputTokens: 10 }
        };
        
        const result = await executeGeminiRequest(
          testBody, 
          apiKey, 
          GEMINI_MODEL_CHAIN
        );
        testResponse = result.response;
        usedModel = result.usedModel;
        triedModels = result.triedModels;
      } else {
        // Lovable AI gateway test
        testResponse = await fetch(LOVABLE_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: "Say 'test successful' in 2 words" }],
            max_tokens: 10,
          }),
        });
      }

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("API test failed:", errorText);
        
        // Gunakan helper parseGeminiError
        const { errorCode, message } = parseGeminiError(testResponse.status, errorText);
        
        const isAllQuotaExhausted = testResponse.status === 429 || testResponse.status === 404;
        
        return new Response(JSON.stringify({
          error: message,
          errorCode: isAllQuotaExhausted ? "all_quota_exceeded" : errorCode,
          triedModels: triedModels,
          success: false
        }), {
          status: 200, // Return 200 agar frontend bisa baca error message
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        model: usedModel,
        triedModels: triedModels,
        message: `Koneksi berhasil! Model: ${usedModel}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate content based on type
    let systemPrompt = "";
    let userPrompt = "";

    // Context block (opsional) — dipakai mode hierarki untuk kesinambungan
    // antar pertemuan. Diabaikan jika data.previousSummary kosong/undefined,
    // jadi 100% backward compatible dengan pemanggilan lama.
    const ctxBlock = (data && typeof data.previousSummary === 'string' && data.previousSummary.trim())
      ? `\n\nKONTEKS PERTEMUAN SEBELUMNYA (lanjutkan dari sini, JANGAN ulang materi yang sama):\n${data.previousSummary.trim()}\n`
      : '';

    // ---------------------------------------------------------------------
    // FASE 2 — Metadata & prompt per pertemuan (helper murni & teruji).
    // Semua nilai OPSIONAL: jika request tidak mengirim info pertemuan,
    // pertemuanMeta = null dan tidak ada perubahan perilaku (backward compatible).
    // ---------------------------------------------------------------------
    const {
      meta: pertemuanMeta,
      promptBlock: pertemuanBlock,
    } = buildPertemuanContext(data);


    switch (type) {

      case "meeting-titles":
        systemPrompt = `Kamu adalah perancang kurikulum Kurikulum Merdeka yang berpengalaman.

KONTEKS:
- Mata Pelajaran: ${data.mataPelajaran || '-'} (Rumpun: ${data.rumpun || '-'})
- Kelas: ${data.kelas || '-'} / Fase: ${data.fase || '-'}  
- Topik: ${data.judulTopik || '-'}
- Total Alokasi: ${data.totalJP || '-'} JP
- Jumlah Pertemuan: ${data.jumlahPertemuan || '-'} pertemuan
- JP per Pertemuan: ${data.jpPerPertemuan || '-'} JP (~${data.menit || '-'} menit)

TUGAS:
Buatkan judul untuk ${data.jumlahPertemuan || '-'} pertemuan yang membentuk learning progression yang logis dan kontekstual untuk topik di atas.

ATURAN WAJIB:
1. Setiap judul HARUS mencerminkan materi/aktivitas SPESIFIK dari topik ini — bukan judul generik
2. Tidak boleh ada judul yang IDENTIK atau terlalu mirip antar pertemuan
3. Alur harus membentuk spiral: dari pemahaman awal → pendalaman → aplikasi → evaluasi (disesuaikan jumlah pertemuan)
4. Aktivitas harus SESUAI rumpun mata pelajaran:
   - Rumpun Bahasa: fokus pada 4 keterampilan (menyimak, berbicara, membaca, menulis)
   - Rumpun Eksak: fokus pada eksperimen, pembuktian, problem solving
   - dst sesuai rumpun
5. Durasi ${data.jpPerPertemuan || '-'} JP per pertemuan harus realistis — jangan paksakan terlalu banyak aktivitas dalam 1 pertemuan singkat
6. Pertemuan terakhir HARUS menyisakan ruang untuk evaluasi/refleksi

CONTOH OUTPUT untuk Bahasa Inggris Kelas IX, Topik "Teks Recount; Simple Past Tense", 6 pertemuan @ 2 JP:
[
  "Mengenal teks recount: orientasi, events, reorientation",
  "Simple Past Tense: bentuk, fungsi, dan latihan kalimat",
  "Membaca & menganalisis model teks recount autentik",
  "Menyusun kerangka & draf teks recount pengalaman pribadi",
  "Peer review, revisi, dan penyempurnaan teks recount",
  "Presentasi teks recount & refleksi pembelajaran"
]

Jawab HANYA dengan JSON array of strings, tanpa penjelasan, tanpa markdown code block.`;
        userPrompt = "Hasilkan array JSON judul pertemuan sekarang.";
        
        try {
          const result = await executeCrossProviderParsedJson(systemPrompt, userPrompt, 1500);
          
          if (result.ok && Array.isArray(result.parsedContent)) {
            return new Response(JSON.stringify({ 
              success: true, 
              titles: result.parsedContent,
              model: result.usedModel 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            error: result.error || "Gagal memproses response",
            titles: [] 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Error generating meeting titles:", err);
          return new Response(JSON.stringify({ success: false, error: err.message, titles: [] }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;

      case "modul":
        const pertemuanList = data.pertemuan || [{ nomorPertemuan: 1, durasi: '90' }];
        const pertemuanInfo = pertemuanList.map((p: { nomorPertemuan: number; durasi: string }) => 
          `Pertemuan ${p.nomorPertemuan}: ${p.durasi} menit`
        ).join('\n');

        const selectedModel = data.modelPembelajaran || "Discovery Learning";
        const modelInfo = SINTAKS_MAP[selectedModel] || SINTAKS_MAP["Discovery Learning"];
        const sintaksList = modelInfo.sintaks.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
        
        // Format distribusi sintaks ke fase
        const distribusiInfo = `
DISTRIBUSI SINTAKS KE FASE INTI:
- MEMAHAMI: ${modelInfo.distribusi.memahami.join(', ')}
- MENGAPLIKASI: ${modelInfo.distribusi.mengaplikasi.join(', ')}
- MEREFLEKSI: ${modelInfo.distribusi.merefleksi.join(', ')}`;

        const isKBC = data.kurikulum === 'kbc';
        const kurikulumLabel = isKBC ? "Kurikulum Berbasis Cinta (KBC) Kemenag" : "Kurikulum Merdeka";
        
        const kbcInstruction = isKBC ? `

INSTRUKSI KHUSUS KBC (Kurikulum Berbasis Cinta - Kemenag):
- DPL (Dimensi Profil Lulusan) tetap digunakan seperti Kurikulum Merdeka
- Selain DPL, terdapat Topik Panca Cinta yang dipilih user: ${(data.topikPancaCinta || []).join(', ') || '(belum dipilih, pilihkan 2-3 yang relevan)'}
- Generate "Materi Integrasi KBC": untuk setiap Panca Cinta yang dipilih, jelaskan bagaimana integrasinya dengan materi pelajaran. Format: "- **[Nama Panca Cinta]**: [Deskripsi integrasi 2-3 kalimat]"
- KRUSIAL: Di setiap langkah Pengalaman Belajar (tahap awal, inti, penutup), WAJIB tampilkan integrasi DPL dan Panca Cinta secara EKSPLISIT. Misalnya: "Kegiatan diskusi mengintegrasikan DPL 3 (Penalaran Kritis) dengan Cinta Ilmu, di mana peserta didik menganalisis data secara kritis sambil menumbuhkan kecintaan terhadap ilmu pengetahuan."
- Gunakan istilah "peserta didik" (bukan "murid") sesuai konvensi Kemenag
- Nuansa keagamaan dan spiritual boleh lebih kental` : '';

        systemPrompt = `Kamu adalah ahli pendidikan Indonesia yang membuat RPP/Perencanaan Pembelajaran Mendalam sesuai ${kurikulumLabel}.
${kbcInstruction}

PENTING - PRINSIP PEMBELAJARAN MENDALAM (Deep Learning):
Setiap kegiatan pembelajaran WAJIB diberi label dengan prinsip berikut:
1. "Membangun kesadaran (Mindful)" - Membuat ${isKBC ? 'peserta didik' : 'murid'} sadar penuh terhadap tujuan dan proses belajar
2. "Bermakna (Meaningful)" - Menghubungkan materi dengan pengalaman hidup nyata
3. "Menggembirakan (Joyful)" - Menciptakan suasana belajar positif dan menyenangkan

MODEL PEMBELAJARAN: ${selectedModel}
DESKRIPSI: ${modelInfo.deskripsi}

SINTAKS YANG HARUS DIIKUTI:
${sintaksList}
${distribusiInfo}

FORMAT OUTPUT JSON YANG HARUS DIHASILKAN:
{
  "pemahaman_bermakna": "string - pemahaman bermakna yang ingin dicapai",
  "pertemuan": [
    {
      "nomorPertemuan": 1,
      "durasi": "200 menit",
      "tahap_awal": {
        "judul": "PENGALAMAN BELAJAR AWAL",
        "prinsip_utama": "Membangun kesadaran, Bermakna, Menggembirakan",
        "durasi_total": "20 menit",
        "kegiatan": [
          {
            "sintaks": "Orientasi",
            "durasi": "10 menit",
            "prinsip": "Membangun kesadaran (Mindful)",
            "sub_kegiatan": [
              {
                "judul": "Salam dan Doa",
                "durasi": "1 menit",
                "aktivitas": [
                  "Guru mengucapkan salam dan meminta ketua kelas memimpin doa dengan khidmat.",
                  "Salah satu murid memimpin salam dan doa bersama."
                ]
              },
              {
                "judul": "Penyampaian Tujuan Pembelajaran",
                "durasi": "3 menit",
                "aktivitas": [
                  "Guru memfasilitasi murid untuk menyampaikan apa yang sudah mereka ketahui tentang topik.",
                  "Murid menyampaikan pengetahuan awal mereka secara bergantian.",
                  "Guru membimbing murid merumuskan tujuan pembelajaran bersama.",
                  "Murid bersama-sama merumuskan tujuan pembelajaran hari ini."
                ]
              },
              {
                "judul": "Pengenalan Topik dengan Media",
                "durasi": "6 menit",
                "aktivitas": [
                  "Guru menampilkan gambar atau video pendek yang relevan dengan topik.",
                  "Murid mengamati gambar/video dengan seksama.",
                  "Guru mengajukan pertanyaan pemantik untuk memicu rasa ingin tahu.",
                  "Murid menjawab pertanyaan pemantik secara aktif."
                ],
                "pertanyaan_pemantik": [
                  "Apa yang kalian lihat pada gambar/video ini?",
                  "Mengapa hal ini penting untuk kita pelajari?"
                ]
              }
            ]
          },
          {
            "sintaks": "Apersepsi",
            "durasi": "5 menit",
            "prinsip": "Bermakna (Meaningful)",
            "sub_kegiatan": [
              {
                "judul": "Mengaitkan dengan Pengalaman Sehari-hari",
                "durasi": "5 menit",
                "aktivitas": [
                  "Guru menggali pengalaman murid terkait topik dengan pertanyaan terbuka.",
                  "Murid berbagi pengalaman personal yang relevan."
                ],
                "pertanyaan_pemantik": ["Pernahkah kalian mengalami hal serupa dalam kehidupan sehari-hari?"]
              }
            ]
          },
          {
            "sintaks": "Motivasi",
            "durasi": "5 menit",
            "prinsip": "Menggembirakan (Joyful)",
            "sub_kegiatan": [
              {
                "judul": "Ice Breaking / Energizer",
                "durasi": "5 menit",
                "aktivitas": [
                  "Guru memimpin aktivitas ice breaking singkat yang berkaitan dengan topik.",
                  "Murid berpartisipasi dengan antusias dan semangat."
                ]
              }
            ]
          }
        ]
      },
      "tahap_inti": {
        "judul": "INTI",
        "prinsip_utama": "Bermakna, Membangun kesadaran, Menggembirakan",
        "durasi_total": "160 menit",
        "fase_pembelajaran": [
          {
            "nama": "MEMAHAMI",
            "prinsip": "Bermakna, Membangun kesadaran (Meaningful, Mindful)",
            "durasi": "50 menit",
            "deskripsi": "Fase untuk membangun pemahaman konsep melalui observasi dan analisis",
            "sintaks": [
              {
                "sintaks": "[NAMA SINTAKS MODEL SESUAI DISTRIBUSI]",
                "durasi": "25 menit",
                "prinsip": "Bermakna (Meaningful)",
                "sub_kegiatan": [
                  {
                    "judul": "Nama Aktivitas Spesifik",
                    "durasi": "10 menit",
                    "aktivitas": [
                      "Guru mengajak murid berdiskusi dan mengajukan pertanyaan kompleks.",
                      "Murid menyampaikan pendapat awal berdasarkan pengamatan.",
                      "Guru membimbing murid untuk mengidentifikasi masalah utama.",
                      "Murid mendiskusikan pertanyaan pemantik dalam kelompok kecil."
                    ],
                    "pertanyaan_pemantik": [
                      "Mengapa ada perbedaan yang signifikan antar individu?",
                      "Faktor apa saja yang mungkin mempengaruhi hal ini?"
                    ]
                  }
                ]
              }
            ]
          },
          {
            "nama": "MENGAPLIKASI",
            "prinsip": "Menggembirakan (Joyful)",
            "durasi": "80 menit",
            "deskripsi": "Fase untuk menerapkan pemahaman dalam kegiatan praktik/proyek",
            "sintaks": [
              {
                "sintaks": "[NAMA SINTAKS MODEL SESUAI DISTRIBUSI]",
                "durasi": "40 menit",
                "prinsip": "Menggembirakan (Joyful)",
                "sub_kegiatan": [
                  {
                    "judul": "Nama Aktivitas Praktik",
                    "durasi": "20 menit",
                    "aktivitas": [
                      "Guru membimbing murid dalam pelaksanaan proyek/praktik.",
                      "Murid bekerja secara kolaboratif dalam kelompok.",
                      "Guru berkeliling memantau dan memberikan umpan balik konstruktif.",
                      "Murid mencatat hasil dan temuan dalam lembar kerja."
                    ]
                  }
                ]
              }
            ]
          },
          {
            "nama": "MEREFLEKSI",
            "prinsip": "Membangun kesadaran (Mindful)",
            "durasi": "30 menit",
            "deskripsi": "Fase untuk merefleksikan pembelajaran dan menarik kesimpulan",
            "sintaks": [
              {
                "sintaks": "[NAMA SINTAKS MODEL SESUAI DISTRIBUSI]",
                "durasi": "30 menit",
                "prinsip": "Membangun kesadaran (Mindful)",
                "sub_kegiatan": [
                  {
                    "judul": "Presentasi Hasil",
                    "durasi": "15 menit",
                    "aktivitas": [
                      "Guru memfasilitasi presentasi kelompok secara bergantian.",
                      "Setiap kelompok mempresentasikan hasil kerja mereka."
                    ]
                  },
                  {
                    "judul": "Umpan Balik dan Refleksi",
                    "durasi": "15 menit",
                    "aktivitas": [
                      "Guru memberikan umpan balik konstruktif terhadap presentasi.",
                      "Murid merespons umpan balik dengan terbuka.",
                      "Guru memandu diskusi refleksi tentang proses pembelajaran."
                    ],
                    "pertanyaan_pemantik": [
                      "Apa yang sudah kalian pahami hari ini?",
                      "Apa yang masih ingin kalian pelajari lebih lanjut?"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      "tahap_penutup": {
        "judul": "PENUTUP",
        "prinsip_utama": "Membangun kesadaran, Bermakna, Menggembirakan",
        "durasi_total": "20 menit",
        "kegiatan": [
          {
            "sintaks": "Refleksi Individu & Kelompok",
            "durasi": "10 menit",
            "prinsip": "Membangun kesadaran (Mindful)",
            "sub_kegiatan": [
              {
                "judul": "Refleksi Pembelajaran",
                "durasi": "5 menit",
                "aktivitas": [
                  "Guru meminta murid menuliskan 3 hal yang dipelajari hari ini.",
                  "Murid menuliskan refleksi pribadi di buku catatan.",
                  "Guru memfasilitasi diskusi refleksi singkat.",
                  "Murid berbagi insight dengan teman sebangku."
                ]
              },
              {
                "judul": "Jurnal Refleksi",
                "durasi": "5 menit",
                "aktivitas": [
                  "Guru membimbing pengisian jurnal refleksi.",
                  "Murid mengisi jurnal dengan jujur dan terbuka."
                ],
                "pertanyaan_pemantik": [
                  "Apa yang paling berkesan dari pembelajaran hari ini?",
                  "Bagaimana saya akan menerapkan ilmu ini dalam kehidupan sehari-hari?"
                ]
              }
            ]
          },
          {
            "sintaks": "Kesimpulan Bersama",
            "durasi": "5 menit",
            "prinsip": "Bermakna (Meaningful)",
            "sub_kegiatan": [
              {
                "judul": "Menyimpulkan Pembelajaran",
                "durasi": "5 menit",
                "aktivitas": [
                  "Guru membimbing murid menyusun kesimpulan bersama.",
                  "Murid menyampaikan poin-poin penting yang dipelajari.",
                  "Guru mengaitkan kesimpulan dengan tujuan pembelajaran.",
                  "Murid mencatat kesimpulan di buku catatan."
                ]
              }
            ]
          },
          {
            "sintaks": "Pesan Inspiratif & Apresiasi",
            "durasi": "5 menit",
            "prinsip": "Menggembirakan (Joyful)",
            "sub_kegiatan": [
              {
                "judul": "Apresiasi dan Motivasi",
                "durasi": "3 menit",
                "aktivitas": [
                  "Guru memberikan apresiasi atas partisipasi aktif murid.",
                  "Murid menerima apresiasi dengan gembira.",
                  "Guru menyampaikan pesan inspiratif terkait materi yang dipelajari."
                ]
              },
              {
                "judul": "Doa dan Salam Penutup",
                "durasi": "2 menit",
                "aktivitas": [
                  "Guru meminta salah satu murid memimpin doa penutup.",
                  "Murid berdoa bersama dan menjawab salam dengan semangat."
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}

ATURAN PENTING:
1. STRUKTUR TAHAP INTI: WAJIB menggunakan 3 fase pembelajaran: MEMAHAMI, MENGAPLIKASI, MEREFLEKSI
2. Distribusikan sintaks model ${selectedModel} ke 3 fase tersebut sesuai karakteristiknya
3. Tulis nama sintaks langsung TANPA prefix "✅ Sintaks:" - cukup nama sintaksnya saja (misal: "Orientasi", "Stimulasi", dll)
4. Gunakan format "aktivitas" sebagai array string yang menggabungkan narasi guru dan murid secara BERURUTAN dan NATURAL
5. JANGAN gunakan "aktivitas_guru" dan "aktivitas_siswa" terpisah - gabungkan menjadi satu alur "aktivitas"
6. Sertakan pertanyaan_pemantik di fase MEMAHAMI dan fase awal
7. Total durasi harus sesuai dengan durasi pertemuan yang ditentukan
8. ${isKBC ? 'Gunakan istilah "peserta didik" (sesuai konvensi Kemenag)' : 'Gunakan istilah "murid" bukan "siswa" (sesuai Kurikulum Merdeka)'}
9. Bahasa harus formal namun mudah dipahami guru`;

        // Build auto-fill instruction for empty fields
        const autoFillInstruction = `
INSTRUKSI AUTO-FILL (PENTING!):
Jika data berikut KOSONG atau "-", buatkan secara CERDAS berdasarkan konteks pembelajaran:

1. IDENTIFIKASI MURID (jika kosong):
   - aspekPengetahuanAwal: Analisis prerequisite knowledge untuk murid ${data.fase} sebelum mempelajari ${data.tujuanPembelajaran || 'topik ini'}
   - aspekMinat: Kaitkan dengan minat umum anak usia ${data.fase} terkait ${data.mataPelajaran}
   - aspekLatarBelakang: Karakteristik umum murid Indonesia fase ${data.fase}
   - aspekKebutuhanBelajar: Kebutuhan berdasarkan CP dan model ${selectedModel}

2. JENIS PENGETAHUAN MATERI (jika kosong):
   - faktual: Data, fakta, terminologi terkait topik
   - konseptual: Konsep, prinsip, teori yang mendasari
   - prosedural: Langkah-langkah, cara, metode yang dipelajari
   - metakognitif: Strategi berpikir dan refleksi diri

3. ${isKBC ? 'DIMENSI PROFIL LULUSAN (jika kosong):\n   - Pilih 2-4 DPL yang paling relevan (DPL 1-8)\n\n   TOPIK PANCA CINTA (jika kosong):\n   - Pilih 2-3 Topik Panca Cinta yang paling relevan' : 'DIMENSI PROFIL LULUSAN (jika kosong):\n   - Pilih 2-4 DPL yang paling relevan (DPL 1-8)'}

4. NILAI KARAKTER (jika kosong):
   - Pilih 3-5 nilai karakter yang terintegrasi

5. LINTAS DISIPLIN ILMU (jika kosong):
   - Identifikasi 2-3 mata pelajaran yang dapat diintegrasikan

6. KEMITRAAN PEMBELAJARAN (jika kosong):
   - Suggest stakeholder relevan berdasarkan topik

7. LINGKUNGAN & DIGITAL (jika kosong):
   - Sesuaikan dengan model pembelajaran ${selectedModel}
`;

        // Check which fields are empty and need auto-fill
        const needsAutoFill = {
          identifikasiMurid: !data.aspekPengetahuanAwal && !data.aspekMinat,
          materiPengetahuan: !data.materiPengetahuan?.faktual && !data.materiPengetahuan?.konseptual,
          dimensiProfilLulusan: !data.dimensiProfilLulusan || data.dimensiProfilLulusan.length === 0,
          nilaiKarakter: !data.nilaiKarakter || data.nilaiKarakter.length === 0,
          lintasDisiplinIlmu: !data.lintasDisiplinIlmu?.ppkn && !data.lintasDisiplinIlmu?.ips,
          kemitraan: !data.kemitraanPembelajaran?.guruBidangStudiLain,
          lingkungan: !data.lingkunganPembelajaranDetail?.ruangFisik,
        };

        const hasEmptyFields = Object.values(needsAutoFill).some(v => v);

        userPrompt = `Buatkan langkah-langkah pembelajaran DETAIL sesuai format Perencanaan Pembelajaran Mendalam untuk:

INFORMASI DASAR:
- Mata Pelajaran: ${data.mataPelajaran}
- Kelas: ${data.kelas}
- Fase: ${data.fase}
- Materi: ${data.materi || '-'}
- Sub Materi: ${data.subMateri || '-'}
- Topik: ${data.materi || data.tujuanPembelajaran}
- Tujuan Pembelajaran: ${data.tujuanPembelajaran}
- Model Pembelajaran: ${selectedModel}

JUMLAH PERTEMUAN: ${pertemuanList.length}
${pertemuanInfo}

IDENTIFIKASI MURID:
- Aspek Pengetahuan Awal: ${data.aspekPengetahuanAwal || '(AUTO-FILL)'}
- Aspek Minat: ${data.aspekMinat || '(AUTO-FILL)'}
- Aspek Latar Belakang: ${data.aspekLatarBelakang || '(AUTO-FILL)'}
- Aspek Kebutuhan Belajar: ${data.aspekKebutuhanBelajar || '(AUTO-FILL)'}

JENIS PENGETAHUAN MATERI:
- Faktual: ${data.materiPengetahuan?.faktual || '(AUTO-FILL)'}
- Konseptual: ${data.materiPengetahuan?.konseptual || '(AUTO-FILL)'}
- Prosedural: ${data.materiPengetahuan?.prosedural || '(AUTO-FILL)'}
- Metakognitif: ${data.materiPengetahuan?.metakognitif || '(AUTO-FILL)'}

KAITAN KEHIDUPAN: ${data.kaitanKehidupan || '(AUTO-FILL berdasarkan topik)'}

DIMENSI PROFIL LULUSAN (DPL): ${data.dimensiProfilLulusan?.join(', ') || '(AUTO-FILL: pilih 2-4 DPL relevan)'}
${isKBC ? `
TOPIK PANCA CINTA (KBC): ${(data.topikPancaCinta || []).join(', ') || '(AUTO-FILL: pilih 2-3 Topik Panca Cinta relevan)'}
MATERI INTEGRASI KBC: ${data.materiIntegrasiKBC || '(AUTO-FILL: generate integrasi tiap Panca Cinta dengan materi)'}` : ''}

NILAI KARAKTER: ${data.nilaiKarakter?.join(', ') || '(AUTO-FILL: pilih 3-5 nilai relevan)'}

LINTAS DISIPLIN ILMU:
- PPKn: ${data.lintasDisiplinIlmu?.ppkn || '(AUTO-FILL jika relevan)'}
- IPS: ${data.lintasDisiplinIlmu?.ips || '(AUTO-FILL jika relevan)'}
- Matematika: ${data.lintasDisiplinIlmu?.matematika || '(AUTO-FILL jika relevan)'}
- Bahasa Indonesia: ${data.lintasDisiplinIlmu?.bahasaIndonesia || '(AUTO-FILL jika relevan)'}

KEMITRAAN PEMBELAJARAN:
- Guru Bidang Studi Lain: ${data.kemitraanPembelajaran?.guruBidangStudiLain || '(AUTO-FILL)'}
- Orang Tua: ${data.kemitraanPembelajaran?.orangTua || '(AUTO-FILL)'}
- Instansi Terkait: ${data.kemitraanPembelajaran?.instansiTerkait || '(AUTO-FILL)'}

LINGKUNGAN PEMBELAJARAN:
- Ruang Fisik: ${data.lingkunganPembelajaranDetail?.ruangFisik || '(AUTO-FILL sesuai model)'}
- Ruang Virtual: ${data.lingkunganPembelajaranDetail?.ruangVirtual || '(AUTO-FILL)'}
- Budaya Belajar: ${data.lingkunganPembelajaranDetail?.budayaBelajar || '(AUTO-FILL)'}

PEMANFAATAN DIGITAL:
- Perencanaan: ${data.pemanfaatanDigitalDetail?.perencanaan || '(AUTO-FILL)'}
- Pelaksanaan: ${data.pemanfaatanDigitalDetail?.pelaksanaan || '(AUTO-FILL)'}
- Asesmen: ${data.pemanfaatanDigitalDetail?.asesmen || '(AUTO-FILL)'}

${hasEmptyFields ? autoFillInstruction : ''}

INSTRUKSI KHUSUS:
1. Buat langkah pembelajaran TERPISAH untuk SETIAP PERTEMUAN
2. WAJIB gunakan struktur 3 fase pada TAHAP INTI: MEMAHAMI, MENGAPLIKASI, MEREFLEKSI
3. Distribusikan sintaks model ${selectedModel} ke 3 fase tersebut:
${distribusiInfo}

4. Setiap kegiatan harus SANGAT DETAIL dengan:
   - Sub-kegiatan yang jelas dan spesifik
   - Aktivitas guru yang konkret (apa yang dikatakan/dilakukan)
   - Aktivitas murid yang konkret (apa yang dilakukan/respons)
   - Pertanyaan pemantik yang relevan dengan topik
   - Pertanyaan diskusi kelompok jika ada kerja kelompok

5. Total durasi di setiap pertemuan HARUS sesuai dengan durasi yang ditentukan
6. Pastikan setiap kegiatan diberi label prinsip pembelajaran mendalam yang tepat

7. PENTING: Untuk field yang ditandai (AUTO-FILL), sertakan dalam output JSON dengan key "auto_generated" berisi semua field yang kamu generate:
{
  "pemahaman_bermakna": "...",
  "pertemuan": [...],
  "auto_generated": {
    "identifikasi_murid": {
      "aspek_pengetahuan_awal": "...",
      "aspek_minat": "...",
      "aspek_latar_belakang": "...",
      "aspek_kebutuhan_belajar": "..."
    },
    "materi_pengetahuan": {
      "faktual": "...",
      "konseptual": "...",
      "prosedural": "...",
      "metakognitif": "..."
    },
    "kaitan_kehidupan": "...",
    "dimensi_profil_lulusan": ["DPL 3", "DPL 5"],
    "dpl_deskripsi": {
      "DPL 3": "Deskripsi 1-2 kalimat bagaimana DPL 3 diterapkan secara spesifik dalam materi ini.",
      "DPL 5": "Deskripsi 1-2 kalimat bagaimana DPL 5 diterapkan secara spesifik dalam materi ini."
    },
    "nilai_karakter": ["Kritis dan Kreatif", "Kolaborasi"],
    "lintas_disiplin": {
      "ppkn": "...",
      "ips": "..."
    },
    "kemitraan": {
      "guru_bidang_studi_lain": "...",
      "orang_tua": "...",
      "instansi_terkait": "..."
    },
    "lingkungan": {
      "ruang_fisik": "...",
      "ruang_virtual": "...",
      "budaya_belajar": "..."
    },
    "pemanfaatan_digital": {
      "perencanaan": "...",
      "pelaksanaan": "...",
      "asesmen": "..."
    }${isKBC ? `,
    "topik_panca_cinta": ["Cinta kepada Ilmu", "Cinta kepada Diri dan Sesama Manusia"],
    "panca_cinta_deskripsi": {
      "Cinta kepada Ilmu": "Deskripsi kontekstual penerapan pilar ini dalam materi...",
      "Cinta kepada Diri dan Sesama Manusia": "Deskripsi kontekstual penerapan pilar ini dalam materi..."
    },
    "materi_integrasi_kbc": "- **Cinta kepada Ilmu**: [deskripsi integrasi]\\n- **Cinta kepada Diri dan Sesama Manusia**: [deskripsi integrasi]"` : ''}
  }
}`;

        const autoFillInstructionPertemuan = `
INSTRUKSI AUTO-FILL (PENTING!):
Karena beberapa field Identifikasi Murid atau Jenis Pengetahuan materi masih kosong, WAJIB hasilkan field 'auto_generated' secara cerdas berdasarkan konteks pembelajaran:

1. IDENTIFIKASI MURID:
   - aspekPengetahuanAwal: Analisis prerequisite knowledge
   - aspekMinat: Kaitkan dengan minat umum anak
   - aspekLatarBelakang: Karakteristik umum murid
   - aspekKebutuhanBelajar: Kebutuhan berdasarkan CP dan model

2. JENIS PENGETAHUAN MATERI:
   - faktual: Data, fakta, terminologi terkait topik
   - konseptual: Konsep, prinsip, teori yang mendasari
   - prosedural: Langkah-langkah, cara, metode yang dipelajari
   - metakognitif: Strategi berpikir dan refleksi diri

3. DIMENSI PROFIL LULUSAN & NILAI KARAKTER:
   - Pilih 2-4 DPL dan 3-5 nilai karakter

PENTING: Karena ini adalah pembuatan SATU pertemuan, sisipkan key "auto_generated" SEJAJAR dengan "nomorPertemuan" dan "tahap_awal" di root level output JSON:
{
  "nomorPertemuan": ${data.pertemuanIndex ? data.pertemuanIndex + 1 : 1},
  "durasi": "...",
  "auto_generated": {
    "identifikasi_murid": {
      "aspek_pengetahuan_awal": "...",
      "aspek_minat": "...",
      "aspek_latar_belakang": "...",
      "aspek_kebutuhan_belajar": "..."
    },
    "materi_pengetahuan": {
      "faktual": "...",
      "konseptual": "...",
      "prosedural": "...",
      "metakognitif": "..."
    },
    "dimensi_profil_lulusan": ["DPL 3", "DPL 5"],
    "nilai_karakter": ["Kritis dan Kreatif"]
  },
  "tahap_awal": { ... },
  ...
}`;
        break;

      case "modul-pertemuan": {
        // Generate a single pertemuan (meeting) for multi-meeting sequential generation
        const pData = data;
        const pPertemuanIndex = pData.pertemuanIndex || 0;
        const pPertemuanTarget = pData.pertemuanTarget || { nomorPertemuan: pPertemuanIndex + 1, durasi: '90' };
        const pTotalPertemuan = pData.totalPertemuan || 1;
        const pPreviousSummary = pData.previousSummary || '';
        
        const pSelectedModel = pData.modelPembelajaran || "Discovery Learning";
        const pModelInfo = SINTAKS_MAP[pSelectedModel] || SINTAKS_MAP["Discovery Learning"];
        const pSintaksList = pModelInfo.sintaks.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
        const pDistribusiInfo = `
DISTRIBUSI SINTAKS KE FASE INTI:
- MEMAHAMI: ${pModelInfo.distribusi.memahami.join(', ')}
- MENGAPLIKASI: ${pModelInfo.distribusi.mengaplikasi.join(', ')}
- MEREFLEKSI: ${pModelInfo.distribusi.merefleksi.join(', ')}`;

        const pIsKBC = pData.kurikulum === 'kbc';

        systemPrompt = `Kamu adalah ahli pendidikan Indonesia yang membuat RPP/Perencanaan Pembelajaran Mendalam sesuai ${pIsKBC ? 'Kurikulum Berbasis Cinta (KBC) Kemenag' : 'Kurikulum Merdeka'}.

MODEL PEMBELAJARAN: ${pSelectedModel}
SINTAKS: ${pSintaksList}
${pDistribusiInfo}

Kamu sedang membuat SATU PERTEMUAN saja (pertemuan ke-${pPertemuanIndex + 1} dari total ${pTotalPertemuan}).

FORMAT OUTPUT JSON (WAJIB persis struktur nested berikut, JANGAN disederhanakan):
{
  "nomorPertemuan": ${pPertemuanIndex + 1},
  "durasi": "${pPertemuanTarget.durasi || '90'} menit",
  "tahap_awal": {
    "judul": "PENGALAMAN BELAJAR AWAL",
    "prinsip_utama": "Membangun kesadaran (Mindful), Bermakna (Meaningful)",
    "durasi_total": "...",
    "kegiatan": [
      {
        "sintaks": "Nama Sintaks Pembuka",
        "durasi": "X menit",
        "prinsip": "Membangun kesadaran (Mindful)",
        "sub_kegiatan": [
          {
            "judul": "Nama Aktivitas Pembuka",
            "durasi": "X menit",
            "aktivitas": [
              "Guru ... (kalimat lengkap konkret).",
              "Murid ... (kalimat lengkap konkret)."
            ],
            "pertanyaan_pemantik": ["...", "..."]
          }
        ]
      }
    ]
  },
  "tahap_inti": {
    "judul": "INTI",
    "prinsip_utama": "Bermakna, Menggembirakan, Membangun kesadaran",
    "durasi_total": "...",
    "fase_pembelajaran": [
      {
        "nama": "MEMAHAMI",
        "prinsip": "Bermakna (Meaningful)",
        "durasi": "X menit",
        "deskripsi": "Fase untuk membangun pemahaman konsep",
        "sintaks": [
          {
            "sintaks": "[Nama sintaks model SESUAI DISTRIBUSI fase MEMAHAMI]",
            "durasi": "X menit",
            "prinsip": "Bermakna (Meaningful)",
            "sub_kegiatan": [
              {
                "judul": "Nama Aktivitas",
                "durasi": "X menit",
                "aktivitas": [
                  "Guru ... (kalimat konkret).",
                  "Murid ... (kalimat konkret)."
                ],
                "pertanyaan_pemantik": ["...", "..."]
              }
            ]
          }
        ]
      },
      {
        "nama": "MENGAPLIKASI",
        "prinsip": "Menggembirakan (Joyful)",
        "durasi": "X menit",
        "deskripsi": "Fase untuk menerapkan pemahaman dalam praktik/proyek",
        "sintaks": [
          {
            "sintaks": "[Nama sintaks model SESUAI DISTRIBUSI fase MENGAPLIKASI]",
            "durasi": "X menit",
            "prinsip": "Menggembirakan (Joyful)",
            "sub_kegiatan": [
              {
                "judul": "Nama Aktivitas Praktik",
                "durasi": "X menit",
                "aktivitas": [
                  "Guru ... .",
                  "Murid ... ."
                ]
              }
            ]
          }
        ]
      },
      {
        "nama": "MEREFLEKSI",
        "prinsip": "Membangun kesadaran (Mindful)",
        "durasi": "X menit",
        "deskripsi": "Fase untuk merefleksikan pembelajaran",
        "sintaks": [
          {
            "sintaks": "[Nama sintaks model SESUAI DISTRIBUSI fase MEREFLEKSI]",
            "durasi": "X menit",
            "prinsip": "Membangun kesadaran (Mindful)",
            "sub_kegiatan": [
              {
                "judul": "Refleksi & Umpan Balik",
                "durasi": "X menit",
                "aktivitas": [
                  "Guru ... .",
                  "Murid ... ."
                ],
                "pertanyaan_pemantik": ["...", "..."]
              }
            ]
          }
        ]
      }
    ]
  },
  "tahap_penutup": {
    "judul": "PENUTUP",
    "prinsip_utama": "Membangun kesadaran, Bermakna, Menggembirakan",
    "durasi_total": "...",
    "kegiatan": [
      {
        "sintaks": "Refleksi & Kesimpulan",
        "durasi": "X menit",
        "prinsip": "Membangun kesadaran (Mindful)",
        "sub_kegiatan": [
          {
            "judul": "Refleksi Pembelajaran",
            "durasi": "X menit",
            "aktivitas": [
              "Guru ... .",
              "Murid ... ."
            ],
            "pertanyaan_pemantik": ["..."]
          }
        ]
      },
      {
        "sintaks": "Pesan Inspiratif & Apresiasi",
        "durasi": "X menit",
        "prinsip": "Menggembirakan (Joyful)",
        "sub_kegiatan": [
          {
            "judul": "Apresiasi & Doa Penutup",
            "durasi": "X menit",
            "aktivitas": [
              "Guru ... .",
              "Murid ... ."
            ]
          }
        ]
      }
    ]
  }
}

PENTING - STRUKTUR OUTPUT:
- Kembalikan SATU OBJECT pertemuan langsung di level teratas (kecuali jika ada instruksi khusus untuk menambahkan field lain).
- Output JSON HARUS dimulai dengan { "nomorPertemuan": ${pPertemuanIndex + 1}, ... }
- JANGAN tambahkan field "pemahaman_bermakna" atau "auto_generated" (KECUALI jika diinstruksikan secara eksplisit di bagian Instruksi Auto-Fill).

ATURAN STRUKTUR (WAJIB):
1. WAJIB gunakan 3 fase pada TAHAP INTI: MEMAHAMI, MENGAPLIKASI, MEREFLEKSI.
2. Setiap item di "kegiatan" (tahap_awal & tahap_penutup) HARUS object dengan field: sintaks, durasi, prinsip, sub_kegiatan[].
3. Setiap item di "fase_pembelajaran[].sintaks" HARUS object dengan field: sintaks, durasi, prinsip, sub_kegiatan[]. JANGAN PERNAH gunakan array string biasa.
4. Setiap "sub_kegiatan" HARUS object dengan field: judul, durasi, aktivitas[] (array string kalimat konkret guru-murid), dan opsional pertanyaan_pemantik[].
5. Field "aktivitas" WAJIB diisi dengan minimal 2-4 kalimat konkret yang menggabungkan langkah guru dan murid secara berurutan. JANGAN biarkan kosong, jangan placeholder.
6. Distribusikan sintaks model ${pSelectedModel} ke 3 fase sesuai DISTRIBUSI di atas.
7. Total durasi semua tahap harus = ${pPertemuanTarget.durasi || '90'} menit.
8. ${pIsKBC ? 'Gunakan istilah "peserta didik".' : 'Gunakan istilah "murid" bukan "siswa".'}
9. Pastikan kesinambungan dengan pertemuan sebelumnya, JANGAN mengulang materi.`;

        const pHasEmptyFields = !pData.aspekPengetahuanAwal || !pData.aspekMinat || !pData.materiPengetahuan?.faktual || !pData.dimensiProfilLulusan || pData.dimensiProfilLulusan.length === 0;

        const pAutoFillInstructionPertemuan = `
INSTRUKSI AUTO-FILL (PENTING!):
Karena beberapa field Identifikasi Murid atau Jenis Pengetahuan materi masih kosong, WAJIB hasilkan field 'auto_generated' secara cerdas berdasarkan konteks pembelajaran:

1. IDENTIFIKASI MURID:
   - aspekPengetahuanAwal: Analisis prerequisite knowledge
   - aspekMinat: Kaitkan dengan minat umum anak
   - aspekLatarBelakang: Karakteristik umum murid
   - aspekKebutuhanBelajar: Kebutuhan berdasarkan CP dan model

2. JENIS PENGETAHUAN MATERI:
   - faktual: Data, fakta, terminologi terkait topik
   - konseptual: Konsep, prinsip, teori yang mendasari
   - prosedural: Langkah-langkah, cara, metode yang dipelajari
   - metakognitif: Strategi berpikir dan refleksi diri

3. DIMENSI PROFIL LULUSAN & NILAI KARAKTER:
   - Pilih 2-4 DPL dan 3-5 nilai karakter

PENTING: Karena ini adalah pembuatan SATU pertemuan, sisipkan key "auto_generated" SEJAJAR dengan "nomorPertemuan" dan "tahap_awal" di root level output JSON:
{
  "nomorPertemuan": ${pData.pertemuanIndex ? pData.pertemuanIndex + 1 : 1},
  "durasi": "...",
  "auto_generated": {
    "identifikasi_murid": {
      "aspek_pengetahuan_awal": "...",
      "aspek_minat": "...",
      "aspek_latar_belakang": "...",
      "aspek_kebutuhan_belajar": "..."
    },
    "materi_pengetahuan": {
      "faktual": "...",
      "konseptual": "...",
      "prosedural": "...",
      "metakognitif": "..."
    },
    "dimensi_profil_lulusan": ["DPL 3", "DPL 5"],
    "nilai_karakter": ["Kritis dan Kreatif"]
  },
  "tahap_awal": { ... },
  ...
}`;

        userPrompt = `Buatkan langkah pembelajaran untuk PERTEMUAN KE-${pPertemuanIndex + 1} dari total ${pTotalPertemuan} pertemuan:

INFORMASI:
- Mata Pelajaran: ${pData.mataPelajaran}
- Kelas: ${pData.kelas}, Fase: ${pData.fase}
- Materi: ${pData.materi || '-'}
- Sub Materi: ${pData.subMateri || '-'}
- Tujuan Pembelajaran: ${pData.tujuanPembelajaran}
- Model: ${pSelectedModel}
- Durasi Pertemuan Ini: ${pPertemuanTarget.durasi || '90'} menit

${pPreviousSummary ? `RINGKASAN PERTEMUAN SEBELUMNYA (untuk kesinambungan):\n${pPreviousSummary}\n\nPastikan pertemuan ini melanjutkan dan memperdalam topik dari pertemuan sebelumnya, TIDAK mengulang materi yang sama.` : ''}

${pHasEmptyFields ? pAutoFillInstructionPertemuan : ''}

INSTRUKSI:
- Buat HANYA 1 pertemuan (ke-${pPertemuanIndex + 1})
- Kegiatan harus SANGAT DETAIL dengan sub-kegiatan, aktivitas konkret, dan pertanyaan pemantik
- Harus ada kesinambungan dengan pertemuan sebelumnya`;
        break;
      }

      case "lkpd":
        systemPrompt = `Kamu adalah asisten ahli pendidikan yang membuat LKPD (Lembar Kerja Peserta Didik) yang interaktif dan bermakna${data.kurikulum === 'kbc' ? ' sesuai Kurikulum Berbasis Cinta (KBC) Kemenag. Gunakan istilah "peserta didik" dan integrasikan nilai-nilai Elemen Cinta dalam konteks aktivitas.' : '.'}

PENTING - FORMAT MATEMATIKA (WAJIB DIIKUTI UNTUK MAPEL MATEMATIKA/FISIKA/KIMIA):
SEMUA ekspresi matematika WAJIB dibungkus dengan delimiter $...$ tanpa kecuali.
- Akar: $\\sqrt{x}$ contoh: $\\sqrt{72}$
- Pecahan: $\\frac{a}{b}$ contoh: $\\frac{1}{2}$, $\\frac{\\sin x}{x}$
- Pangkat: $x^{2}$ atau $2^{-3}$
- Subscript: $x_{1}$ contoh: $a_{n}$
- Fungsi trigonometri: $\\sin x$, $\\cos x$, $\\tan x$, $\\sin^{2} x$
- Limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$
- Simbol: $\\times$, $\\div$, $\\pi$, $\\alpha$, $\\beta$, $\\theta$, $\\to$, $\\infty$
- Identitas: $\\sin^{2} x + \\cos^{2} x = 1$

ATURAN ESCAPE JSON (SANGAT KRITIS):
Karena output adalah JSON, setiap backslash WAJIB ditulis GANDA agar tidak hilang saat parsing.
- BENAR:  "Hitunglah $\\\\lim_{x \\\\to 0} \\\\frac{\\\\sin x}{x}$"
- SALAH:  "Hitunglah $\\lim_{x \\to 0} \\frac{\\sin x}{x}$"  (akan rusak jadi "x o 0", "sin")
- BENAR:  "$\\\\sin x$, $\\\\cos x$, $\\\\sqrt{2}$"
- DILARANG menulis perintah LaTeX (\\sin, \\cos, \\lim, \\frac, \\sqrt, \\to) DI LUAR delimiter $...$.

ATURAN TABEL (WAJIB):
Jika perlu menampilkan tabel (misal tabel nilai limit/fungsi), gunakan HTML murni:
<table border="1" style="border-collapse:collapse;width:100%"><thead><tr><th>x</th><th>$\\\\sin x$</th></tr></thead><tbody><tr><td>0.1</td><td>0.0998</td></tr></tbody></table>
DILARANG menggunakan format Markdown pipe (| x | sin x |) karena tidak akan dirender sebagai tabel.

PENTING - AKTIVITAS DENGAN TEKS/BACAAN:
Jika aktivitas membutuhkan siswa membaca teks (misal: "Baca teks...", "Analisis teks...", "Read the text..."), 
maka WAJIB sertakan teks tersebut dalam field "teks_pendukung" di aktivitas.
- Teks pendukung harus lengkap dan dapat dibaca oleh siswa
- Jangan hanya memberikan instruksi untuk membaca tanpa menyediakan teksnya
- Teks harus relevan dengan topik dan sesuai tingkat kesulitan siswa

Aturan format matematika, JSON escape, dan tabel di atas BERLAKU untuk SEMUA field: informasi_pendukung, masalah_kontekstual, teks_pendukung, instruksi, pertanyaan_kunci, format_jawaban.

Selalu berikan respons dalam format JSON yang valid dengan struktur:
{
  "judul_lkpd": "string",
  "petunjuk_belajar": ["string"],
  "informasi_pendukung": "string",
  "pertanyaan_pemantik": "string",
  "masalah_kontekstual": "string",
  "aktivitas_utama": [
    {
      "judul": "string - judul aktivitas", 
      "jenis": "string - jenis aktivitas (Analisis Teks, Diskusi, Praktik, dll)", 
      "teks_pendukung": "string (WAJIB jika instruksi merujuk pada teks/bacaan yang harus dibaca siswa)",
      "instruksi": "string - instruksi kegiatan", 
      "pertanyaan_kunci": ["string - pertanyaan yang harus dijawab siswa"], 
      "format_jawaban": "string - format jawaban yang diharapkan"
    }
  ],
  "refleksi": {"diri": ["string"], "sejawat": ["string"]}
}`;
        userPrompt = `Buatkan LKPD untuk:
Mata Pelajaran: ${data.mataPelajaran}
Materi: ${data.materi || '-'}
Sub Materi: ${data.subMateri || '-'}
Tujuan: ${data.tujuanPembelajaran}
Kelas: ${data.kelas}

PENTING: Jika ada aktivitas yang membutuhkan siswa membaca teks atau bacaan, WAJIB sertakan teks lengkap tersebut dalam field "teks_pendukung". Jangan hanya memberikan instruksi untuk membaca tanpa menyediakan teksnya.${ctxBlock}`;
        break;

      case "asesmen":
        systemPrompt = `Kamu adalah ahli asesmen pendidikan Indonesia yang membuat instrumen penilaian sesuai Kurikulum Merdeka dengan Pembelajaran Mendalam.

PRINSIP ASESMEN ${data.kurikulum === 'kbc' ? 'KBC (Kurikulum Berbasis Cinta)' : 'KURIKULUM MERDEKA'}:
1. Asesmen merupakan bagian terpadu dari pembelajaran
2. Dirancang sesuai fungsi: diagnostik, formatif, sumatif
3. Adil, proporsional, valid, dan reliabel
4. Hasil digunakan untuk refleksi dan perbaikan${data.kurikulum === 'kbc' ? '\n5. Integrasikan nilai-nilai Elemen Cinta dalam konteks asesmen\n6. Gunakan istilah "peserta didik" sesuai konvensi Kemenag' : ''}

JENIS ASESMEN YANG HARUS DIBUAT:

1. ASESMEN AWAL PEMBELAJARAN (Diagnostik):
   - Fungsi: Assessment for Learning - mengidentifikasi pengetahuan awal
   - Metode: Pertanyaan lisan, pretest sederhana, observasi
   - Bentuk: 2-3 pertanyaan pemantik untuk menggali prior knowledge

2. ASESMEN PROSES PEMBELAJARAN (Formatif):
   - Fungsi: Assessment as Learning - memantau kemajuan dan umpan balik
   - Metode: Observasi, penilaian kinerja, lembar kerja, diskusi kelompok
   - Bentuk: Instrumen observasi, rubrik diskusi, pertanyaan reflektif
   - Termasuk: Penilaian diri dan penilaian sejawat

3. ASESMEN AKHIR PEMBELAJARAN (Sumatif):
   - Fungsi: Assessment of Learning - mengukur pencapaian tujuan
   - Metode: Tes tertulis (uraian), penilaian proyek/produk
   - Bentuk: 3-5 soal uraian dengan kunci jawaban dan rubrik

Selalu berikan respons dalam format JSON yang valid dengan struktur:
{
  "asesmen_awal": {
    "deskripsi": "Penjelasan singkat tujuan asesmen awal untuk mengidentifikasi pengetahuan awal siswa",
    "metode": "Pertanyaan Lisan / Pretest",
    "items": [
      {"pertanyaan": "string - pertanyaan pemantik", "tujuan": "string - apa yang ingin diketahui"}
    ]
  },
  "asesmen_proses": {
    "deskripsi": "Penjelasan asesmen formatif untuk memantau kemajuan belajar",
    "metode": "Observasi, Penilaian Kinerja, Lembar Kerja, Diskusi Kelompok",
    "aktivitas": [
      {
        "nama": "string - nama aktivitas",
        "instruksi": "string - instruksi kegiatan",
        "pertanyaan_diskusi": ["string - pertanyaan untuk diskusi"],
        "kunci_jawaban": ["string - kunci/panduan jawaban"]
      }
    ],
    "rubrik": [
      {
        "aspek": "string - aspek yang dinilai",
        "sangat_baik": "string - deskripsi skor 4",
        "baik": "string - deskripsi skor 3",
        "cukup": "string - deskripsi skor 2",
        "kurang": "string - deskripsi skor 1"
      }
    ],
    "penilaian_diri": ["string - pertanyaan refleksi diri untuk siswa"],
    "penilaian_sejawat": ["string - aspek penilaian antar teman"]
  },
  "asesmen_akhir": {
    "deskripsi": "Penjelasan asesmen sumatif untuk mengukur pencapaian tujuan pembelajaran",
    "metode": "Tes Tertulis Uraian",
    "soal": [
      {"no": 1, "pertanyaan": "string - soal uraian", "kunci_jawaban": "string - kunci jawaban lengkap", "skor": 20}
    ],
    "rubrik": [
      {
        "aspek": "string - aspek yang dinilai",
        "sangat_baik": "string - deskripsi skor 4",
        "baik": "string - deskripsi skor 3",
        "cukup": "string - deskripsi skor 2",
        "kurang": "string - deskripsi skor 1"
      }
    ],
    "pedoman_penskoran": {
      "skor_total": 100,
      "rumus_nilai": "(Skor Perolehan / Skor Maksimal) x 100"
    }
  }
}`;
        userPrompt = `Buatkan instrumen asesmen lengkap untuk:
Mata Pelajaran: ${data.mataPelajaran}
Kelas: ${data.kelas}
Materi: ${data.materi || '-'}
Sub Materi: ${data.subMateri || '-'}
Tujuan Pembelajaran: ${data.tujuanPembelajaran}

Pastikan asesmen:
1. Relevan dengan tujuan pembelajaran
2. Menggunakan konteks nyata sesuai karakteristik siswa
3. Mencakup aspek kognitif, afektif, dan psikomotorik
4. Memiliki rubrik yang jelas dengan 4 level capaian (Sangat Baik, Baik, Cukup, Kurang)
5. Menyediakan penilaian diri dan penilaian sejawat untuk asesmen proses${ctxBlock}`;
        break;

      case "materi":
        // Helper function untuk parsing kelas dengan angka Romawi
        const parseKelasMateri = (kelasInput: string | undefined): number => {
          if (!kelasInput) return 0;
          const kelas = kelasInput.toUpperCase().trim();
          const romawiMap: Record<string, number> = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
            'XI': 11, 'XII': 12
          };
          // Cek angka Romawi (prioritas: XII dulu, lalu XI, dst dari terpanjang)
          const sortedRomawi = Object.entries(romawiMap).sort((a, b) => b[0].length - a[0].length);
          for (const [romawi, nilai] of sortedRomawi) {
            if (kelas === romawi || kelas.includes(romawi)) {
              return nilai;
            }
          }
          const angka = parseInt(kelas.replace(/\D/g, ''), 10);
          return isNaN(angka) ? 0 : angka;
        };
        
        const kelasNumMateri = parseKelasMateri(data.kelas);
        const jenjangMateri = kelasNumMateri <= 6 ? 'SD' : kelasNumMateri <= 9 ? 'SMP' : 'SMA';
        
        // Define grade-level specific language guidance
        const gradeLanguageGuide = jenjangMateri === 'SD' 
          ? `UNTUK SISWA SD (Fase A-C):
- Gunakan nada CERIA dan PERSONAL: "Halo adik-adik! 👋", "Ayo kita lihat...", "Wah, ternyata... 🤩"
- Gunakan BANYAK EMOJI di seluruh teks (🌟, 📝, 🎯, 💡, 🤔, 👀, ✅, 🎉)
- "poin_utama" harus SANGAT SINGKAT (1 kalimat sederhana, maks 15 kata)
- "contoh_konkret" ambil dari kehidupan anak: mainan, keluarga, hewan peliharaan, jajan, bermain
- Gunakan analogi familiar: tangga, kelereng, kue, pizza, balok
- Hindari istilah akademis — gunakan kata sehari-hari
- "penjelasan_detail" ditulis seperti bercerita/petualangan, bukan ceramah`
          : jenjangMateri === 'SMP' 
            ? `UNTUK SISWA SMP (Fase D):
- Gunakan nada MENTOR SEBAYA: "Pernah gak sih kalian...", "Nah, coba bayangin...", "Keren kan?"
- "poin_utama" harus ringkas tapi informatif (1-2 kalimat)
- "contoh_konkret" hubungkan dengan hobi remaja, teknologi, media sosial, tren, atau olahraga
- Boleh gunakan istilah teknis DENGAN penjelasan singkat di sampingnya
- "penjelasan_detail" ditulis engaging, boleh sesekali retoris ("Kenapa bisa begitu? Karena...")
- Hubungkan dengan fenomena yang relevan untuk remaja zaman sekarang`
            : `UNTUK SISWA SMA (Fase E-F):
- Gunakan nada FORMAL AKADEMIS tapi TIDAK KAKU — tetap readable
- "poin_utama" fokus pada KONSEP, PRINSIP, atau DEFINISI kunci (1-2 kalimat padat)
- "contoh_konkret" berupa STUDI KASUS, penerapan karier, fakta ilmiah, atau data nyata
- "penjelasan_detail" boleh membahas konsep abstrak, sebab-akibat, dan analisis
- Sertakan koneksi antar-konsep dan referensi akademis jika relevan
- "istilah_penting" WAJIB diisi untuk setiap sub-bab`;

        // Detect language subjects for model text requirement
        const isLanguageSubject = /bahasa|english|sastra|literasi/i.test(data.mataPelajaran || '');
        const isTextBasedMateri = /narasi|deskripsi|eksposisi|prosedur|eksplanasi|negosiasi|teks|recount|report|analytical|hortatory|narrative|discussion|review|anecdote|spoof|news item/i.test(`${data.materi || ''} ${data.subMateri || ''}`);
        const needsModelText = isLanguageSubject || isTextBasedMateri;

        // Deteksi Bahasa Arab + tier proporsi bahasa berdasarkan jenjang
        const isArabicSubject = /bahasa\s*arab/i.test(data.mataPelajaran || '');
        const arabicTier: 'sd-low' | 'sd-high-smp' | 'sma' =
          kelasNumMateri <= 3 ? 'sd-low' : kelasNumMateri <= 9 ? 'sd-high-smp' : 'sma';

        const arabicMateriInstruction = isArabicSubject ? `
INSTRUKSI KHUSUS BAHASA ARAB (Tier: ${arabicTier}):
- Seluruh MODEL TEKS dan CONTOH KALIMAT ditulis dalam aksara Arab (huruf hijaiyah), BUKAN transliterasi Latin.
- WAJIB berikan HARAKAT LENGKAP (fathah, kasrah, dhammah, sukun, syaddah, tanwin) pada setiap kata dalam teks model dan contoh, terutama untuk SD/SMP.
- Tulis paragraf Arab sebagai satu blok utuh (browser akan menangani RTL otomatis). Jangan campur setengah kalimat Arab-Indonesia dalam satu kalimat.
${arabicTier === 'sd-low'
  ? `- Kelas rendah SD: teks Arab SANGAT PENDEK (kalimat tunggal, kosakata familiar: keluarga, angka, warna, benda kelas). Setiap kalimat Arab WAJIB diikuti terjemahan Indonesia di baris berikutnya dengan format "Artinya: ...".
- Penjelasan konsep, poin_utama, penjelasan_detail: gunakan Bahasa Indonesia yang ceria.
- Panjang model teks: minimum 30 kata Arab (boleh berupa daftar kosakata + 2-3 kalimat pendek).`
  : arabicTier === 'sd-high-smp'
  ? `- SD tinggi & SMP: teks Arab pendek-menengah (100-150 kata) dengan harakat penuh. Sertakan terjemahan Indonesia UTUH setelah teks Arab (bukan per-kalimat), dengan sub-heading "Terjemahan:".
- Kosakata kunci (mufradat) minimum 5 kata: tampilkan tabel Arab | Latin (transliterasi) | Indonesia di contoh_konkret.
- Penjelasan tata bahasa (nahwu/sharaf) dalam Bahasa Indonesia, contoh pola kalimat dalam Arab berharakat.`
  : `- SMA/MA: teks Arab utuh minimum 180 kata, dengan harakat pada kata sulit / kata kerja bentuk khusus (harakat lengkap opsional untuk kata umum).
- Sertakan terjemahan Indonesia RINGKAS di akhir (paragraf tunggal), BUKAN per-kalimat, agar siswa berlatih memahami teks Arab langsung.
- Bedah struktur teks (muqaddimah, 'ardh, khatimah) dan analisis nahwu/sharaf boleh dwibahasa; istilah kebahasaan (fi'il, isim, harf, jumlah ismiyyah, jumlah fi'liyyah, dll) tulis dalam Arab + Indonesia.
- Genre teks: hiwar (dialog), qishah qashirah (cerita pendek), maqal (artikel), atau khutbah pendek sesuai materi.`}
- Jika materi tentang tata bahasa (nahwu/sharaf/qawaid), poin_utama & penjelasan_detail utama boleh Bahasa Indonesia, tapi SETIAP contoh WAJIB dalam Arab berharakat + terjemahan.
` : '';

        // Model text instructions for language subjects
        const modelTextInstruction = needsModelText ? `
INSTRUKSI KHUSUS MATA PELAJARAN BAHASA:
- Salah satu item isi_materi WAJIB berupa "Model Teks" (contoh teks utuh, BUKAN ringkasan).
- Format sub_judul: "Model Teks: [Judul Teks]"
- poin_utama: Kalimat ajakan membaca teks ("Mari kita baca contoh teks berikut untuk memahami strukturnya.")
- penjelasan_detail: TEKS UTUH lengkap sesuai panjang minimum jenjang di bawah. Tulis teks penuh dengan paragraf yang mengalir alami — jangan potong, jangan diringkas, jangan diberi label "[teks singkat]".
- contoh_konkret: BEDAH STRUKTUR teks — identifikasi setiap bagian dengan kutipan ("Paragraf 1 adalah Thesis karena '...'", "Paragraf 2 adalah Argument 1 karena '...'"). Tambahkan minimal 2 kosakata kunci beserta artinya (untuk SMP/SMA level B1–B2 CEFR).

Panjang & Struktur Model Teks per Jenjang (WAJIB DIPATUHI):
- SD: minimum 80 kata, 1–2 paragraf sederhana. Contoh genre: fabel, cerita rakyat pendek, deskripsi benda kesayangan, pantun anak. Kosakata sederhana, kalimat tunggal.
- SMP: minimum 180 kata, 3 paragraf (pembuka–isi–penutup). Contoh genre: recount pribadi, procedure/tutorial, artikel populer remaja, cerita pendek. Bahasa komunikatif, boleh ada kalimat majemuk.
- SMA: minimum 250 kata, 4 paragraf ATAU lebih dengan struktur genre PENUH sesuai jenis teks yang diminta:
  * Narrative: Orientation → Complication → Resolution (+ optional Coda)
  * Analytical/Hortatory Exposition: Thesis → Argument 1 → Argument 2 (+ Counter-argument) → Reiteration/Recommendation
  * News Item: Newsworthy Event (headline + lead) → Elaboration (background) → Source (kutipan/pihak)
  * Report/Discussion/Review: ikuti struktur baku genre tersebut
  Bahasa baku, argumentatif, gunakan cohesive devices (however, therefore, furthermore). Wajib cantumkan atribusi sumber di akhir teks dengan format: "Adapted from: [judul/sumber fiktif yang plausibel], accessed [tanggal]" — untuk melatih siswa membaca teks otentik.
- Untuk Bahasa Inggris: seluruh teks model DALAM BAHASA INGGRIS, bukan campuran. Bedah struktur di contoh_konkret boleh dwibahasa.
${arabicMateriInstruction}` : arabicMateriInstruction;


        systemPrompt = `Kamu adalah penulis materi pembelajaran ahli yang menyajikan konten edukatif sesuai ${data.kurikulum === 'kbc' ? 'Kurikulum Berbasis Cinta (KBC) Kemenag' : 'Kurikulum Merdeka Indonesia'}.${data.kurikulum === 'kbc' ? '\nGunakan istilah "peserta didik" dan integrasikan nilai-nilai Elemen Cinta dalam narasi materi.' : ''}

PANDUAN PENULISAN MATERI:

1. GAYA BAHASA SESUAI JENJANG (${jenjangMateri}):
${gradeLanguageGuide}

2. STRUKTUR MATERI YANG KOMPREHENSIF:
   a) Pendahuluan: 
      - Gambaran umum materi
      - Mengapa materi ini penting dipelajari
      - Hubungan dengan kehidupan sehari-hari
   
   b) Isi Materi (minimal 4-6 sub-bab):
      - Definisi dan konsep dasar
      - Penjelasan detail dengan contoh
      - Karakteristik/ciri-ciri
      - Jenis/klasifikasi
      - Penerapan/aplikasi
      - Contoh soal atau kasus
   
   c) Fakta Unik: Informasi menarik yang menambah wawasan
   
   d) Glosarium: Istilah-istilah kunci dengan definisi
   
   e) Referensi: Sumber belajar tambahan

3. KESESUAIAN DENGAN TUJUAN PEMBELAJARAN:
   - Materi harus mendukung pencapaian tujuan pembelajaran yang ditetapkan
   - Setiap sub-bab harus berkontribusi pada pemahaman tujuan pembelajaran
${modelTextInstruction}
FORMAT PENULISAN:
- Untuk poin-poin/daftar dalam penjelasan_detail atau contoh_konkret, gunakan HTML tag <ul><li>...</li></ul> atau <ol><li>...</li></ol>
- JANGAN gunakan simbol manual (-, *, 1.) untuk membuat daftar
- Untuk teks tebal gunakan <b>...</b> atau **...**
- Untuk teks miring gunakan <i>...</i> atau *...*

PENTING - SIMBOL DAN PANAH:
- Untuk panah urutan/alur, LANGSUNG gunakan karakter Unicode: → (panah kanan) dan ← (panah kiri)
- JANGAN gunakan format LaTeX seperti \\rightarrow atau \\leftarrow di LUAR formula matematika
- Contoh BENAR untuk urutan: "Menghitung maju: 1 → 2 → 3 → 4 → 5"
- Contoh SALAH: "1\\rightarrow2\\rightarrow3" (ini akan error di tampilan)

PENTING - FORMAT MATEMATIKA (hanya untuk RUMUS dalam delimiter $...$):
Untuk materi yang mengandung rumus matematika, gunakan format LaTeX DALAM DELIMITER:
- Akar: $\\sqrt{x}$ contoh: $\\sqrt{72}$
- Pecahan: $\\frac{a}{b}$ contoh: $\\frac{1}{2}$
- Pangkat: $x^{n}$ contoh: $2^{3}$, $x^{-2}$
- Subscript: $x_{n}$ contoh: $a_{1}$
- Simbol matematika: $\\times$, $\\div$, $\\pi$, $\\alpha$, $\\beta$

Selalu berikan respons dalam format JSON yang valid dengan struktur:
{
  "judul_materi": "string - judul materi yang menarik",
  "pendahuluan": "string - paragraf pembuka yang komprehensif (minimal 100 kata) menjelaskan gambaran umum, pentingnya materi, dan hubungan dengan kehidupan nyata",
  "isi_materi": [
    {
      "sub_judul": "string - judul sub-bab yang deskriptif",
      "poin_utama": "string - ringkasan inti / definisi singkat (1-2 kalimat, cocok untuk highlight box)",
      "penjelasan_detail": "string - uraian utama yang komprehensif (minimal 100 kata). Gunakan HTML <ul><li> untuk daftar poin.",
      "contoh_konkret": "string - contoh aplikatif yang TERPISAH dan kontekstual sesuai jenjang siswa. Gunakan HTML <ul><li> untuk bedah struktur.",
      "istilah_penting": "string (opsional) - kata kunci utama dari sub-bab ini"
    }
  ],
  "fakta_unik": "string - 2-3 fakta menarik terkait materi",
  "glosarium": [{"istilah": "string", "definisi": "string"}],
  "referensi": ["string - sumber belajar"]
}`;
        userPrompt = `Buatkan materi pembelajaran yang KOMPREHENSIF dan LENGKAP untuk:

IDENTITAS PEMBELAJARAN:
- Mata Pelajaran: ${data.mataPelajaran}
- Materi: ${data.materi || '-'}
- Sub Materi: ${data.subMateri || '-'}
- Fase: ${data.fase}
- Kelas: ${data.kelas}

CAPAIAN PEMBELAJARAN:
${data.capaianPembelajaran || 'Tidak ditentukan'}

TUJUAN PEMBELAJARAN:
${data.tujuanPembelajaran}

INSTRUKSI KHUSUS:
1. Materi HARUS mendukung pencapaian Tujuan Pembelajaran di atas
2. Buat minimal 4-6 sub-bab yang progresif dari konsep dasar hingga penerapan
3. Sertakan contoh konkret yang relevan dengan kehidupan siswa Indonesia
4. Gunakan bahasa yang sesuai jenjang ${jenjangMateri}
5. Untuk Bahasa Inggris: sertakan penjelasan Social Function, Generic Structure, dan Language Features
6. Untuk Matematika/IPA: sertakan rumus dengan format LaTeX dan contoh soal

INSTRUKSI FORMAT MODERN LEARNING MODULE:
7. "poin_utama" harus 1-2 kalimat ringkas yang merangkum INTI sub-bab — cocok untuk highlight box
8. "penjelasan_detail" adalah uraian utama (minimal 100 kata), ditulis dengan gaya ${jenjangMateri === 'SD' ? 'bercerita/petualangan' : jenjangMateri === 'SMP' ? 'engaging dan retoris' : 'analitis dan terstruktur'}
9. "contoh_konkret" harus TERPISAH dari penjelasan — berisi contoh aplikatif ${jenjangMateri === 'SD' ? 'dari kehidupan anak (mainan, keluarga, hewan)' : jenjangMateri === 'SMP' ? 'dari dunia remaja (teknologi, hobi, tren)' : 'berupa studi kasus atau penerapan karier'}
10. ${jenjangMateri === 'SD' ? 'Gunakan BANYAK EMOJI di setiap field (🌟📝🎯💡)' : jenjangMateri === 'SMP' ? 'Gunakan emoji secukupnya untuk poin_utama dan contoh' : '"istilah_penting" WAJIB diisi untuk setiap sub-bab'}
${needsModelText ? `11. Sertakan satu sub-bab khusus "Model Teks: [Judul]" berisi contoh teks UTUH (minimal 150 kata, bukan ringkasan)
12. Di bawah model teks, berikan analisis/bedah struktur teks tersebut di kolom contoh_konkret
13. Gunakan HTML list (<ul><li>) untuk poin-poin, BUKAN simbol strip manual` : '11. Gunakan HTML list (<ul><li>) untuk poin-poin dalam penjelasan_detail dan contoh_konkret, BUKAN simbol strip manual'}${ctxBlock}`;
        break;

      case "tindakLanjut":
        systemPrompt = `Kamu adalah ahli evaluasi pembelajaran yang membuat rencana tindak lanjut.
Selalu berikan respons dalam format JSON yang valid dengan struktur:
{
  "refleksi_guru": ["string"],
  "refleksi_siswa": ["string"],
  "remedial": "string",
  "pengayaan": "string"
}`;
        userPrompt = `Buatkan rencana tindak lanjut untuk:
Mata Pelajaran: ${data.mataPelajaran}
Materi: ${data.materi || '-'}
Sub Materi: ${data.subMateri || '-'}
Tujuan: ${data.tujuanPembelajaran}

PENTING — FORMAT "remedial" dan "pengayaan":
- Tulis MINIMAL 3 paragraf, pisahkan setiap paragraf dengan dua newline (\\n\\n).
- Setiap paragraf membahas aspek berbeda (misal: diagnosis, strategi, contoh kegiatan, integrasi program).
- Jangan jadikan satu paragraf panjang tanpa jeda.${ctxBlock}`;
        break;

      case "bankSoal":
        // Helper function untuk parsing kelas dengan angka Romawi
        const parseKelasSoal = (kelasInput: string | undefined): number => {
          if (!kelasInput) return 0;
          const kelas = kelasInput.toUpperCase().trim();
          const romawiMap: Record<string, number> = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
            'XI': 11, 'XII': 12
          };
          // Cek angka Romawi (prioritas: XII dulu, lalu XI, dst dari terpanjang)
          const sortedRomawi = Object.entries(romawiMap).sort((a, b) => b[0].length - a[0].length);
          for (const [romawi, nilai] of sortedRomawi) {
            if (kelas === romawi || kelas.includes(romawi)) {
              return nilai;
            }
          }
          const angka = parseInt(kelas.replace(/\D/g, ''), 10);
          return isNaN(angka) ? 0 : angka;
        };
        
        // Tentukan jumlah opsi berdasarkan jenjang (kelas)
        const kelasNum = parseKelasSoal(data.kelas);
        const jumlahOpsi = kelasNum <= 9 ? 4 : 5; // SD-SMP (1-9) = 4 opsi, SMA (10-12) = 5 opsi
        const hurufOpsi = kelasNum <= 9 ? 'A-D' : 'A-E';
        const opsiArray = kelasNum <= 9 ? '["...", "...", "...", "..."]' : '["...", "...", "...", "...", "..."]';
        
        const isEnglishSubjectSoal = /bahasa\s*inggris|english/i.test(data.mataPelajaran || '');
        const isArabicSubjectSoal = /bahasa\s*arab/i.test(data.mataPelajaran || '');
        const isIndonesianSubjectSoal = /bahasa\s*indonesia/i.test(data.mataPelajaran || '');
        const isLanguage = isEnglishSubjectSoal || isIndonesianSubjectSoal || isArabicSubjectSoal;

        let stimulusLengthGuide = '';
        if (kelasNum <= 3) {
          stimulusLengthGuide = '   - Panjang teks: 3-5 kalimat sederhana (target pembaca kelas 1-3 SD).';
        } else if (kelasNum <= 6) {
          stimulusLengthGuide = `   - Panjang teks: 2-3 paragraf utuh (sekitar 100-200 kata, target kelas 4-6 SD).${isLanguage ? ' WAJIB berupa teks bacaan yang komprehensif, BUKAN HANYA 1 paragraf singkat.' : ''}`;
        } else if (kelasNum <= 9) {
          stimulusLengthGuide = `   - Panjang teks: 3-4 paragraf yang komprehensif (sekitar 200-350 kata, target SMP).${isLanguage ? ' WAJIB menyajikan bacaan literasi (misal: Narrative, Report, Descriptive) yang mendalam (minimal 3 paragraf utuh). JANGAN BUAT TEKS YANG TERLALU PENDEK.' : ''}`;
        } else {
          stimulusLengthGuide = `   - Panjang teks: Teks literasi panjang dan kompleks (sekitar 300-500 kata, target SMA/SMK).${isLanguage ? ' WAJIB menyajikan bacaan tingkat lanjut setara soal UTBK/SNBT. JANGAN BUAT TEKS PENDEK.' : ''}`;
        }

        const arabicTierSoal: 'sd-low' | 'sd-high-smp' | 'sma' =
          kelasNum <= 3 ? 'sd-low' : kelasNum <= 9 ? 'sd-high-smp' : 'sma';


        // Hitung distribusi tipe soal dari typeConfigs
        const typeConfigs: Record<string, { quantity: number; useStimulus: boolean; stimulusCount: number; useImages: boolean; imageCount: number }> = data.config?.typeConfigs || {};
        // Backward compat: support old typeQuantities format
        if (!data.config?.typeConfigs && data.config?.typeQuantities) {
          const oldQty = data.config.typeQuantities as Record<string, number>;
          for (const [tipe, qty] of Object.entries(oldQty)) {
            typeConfigs[tipe] = { quantity: qty, useStimulus: !!data.config?.stimulus, stimulusCount: Math.ceil(qty / 5), useImages: !!data.config?.includeImages, imageCount: 1 };
          }
        }
        // Filter only active types (qty > 0)
        const activeTypes = Object.entries(typeConfigs).filter(([_, cfg]) => cfg.quantity > 0);
        const jumlahSoal = activeTypes.reduce((sum, [_, cfg]) => sum + cfg.quantity, 0) || 10;
        const distribusiTipe = activeTypes.map(([tipe, cfg]) => `${tipe}: ${cfg.quantity} soal`).join('\n   - ');

        // Per-type stimulus/image distribution
        const hasAnyStimulus = activeTypes.some(([_, cfg]) => cfg.useStimulus);
        const hasAnyImages = activeTypes.some(([_, cfg]) => cfg.useImages);
        const soalPerStimulus = 5;
        
        // Build per-type stimulus/image info for prompt
        const perTypeDistribusi = activeTypes.map(([tipe, cfg]) => {
          const parts = [`${tipe} (${cfg.quantity} soal)`];
          if (cfg.useStimulus) {
            parts.push(`${cfg.stimulusCount} stimulus`);
          } else {
            parts.push('tanpa stimulus');
          }
          if (cfg.useImages && cfg.imageCount > 0) {
            const n = Math.min(cfg.imageCount, cfg.quantity);
            parts.push(`TEPAT ${n} soal bergambar (requires_image=true)`);
          } else {
            parts.push('tanpa gambar');
          }
          return `   - ${parts.join(', ')}`;
        }).join('\n');

        // Ringkasan target gambar per tipe untuk instruksi eksplisit
        const imageTargetsLines = activeTypes
          .filter(([_, cfg]) => cfg.useImages && cfg.imageCount > 0)
          .map(([tipe, cfg]) => `   - ${tipe}: TEPAT ${Math.min(cfg.imageCount, cfg.quantity)} soal dari ${cfg.quantity} soal wajib requires_image=true`)
          .join('\n');
        const hasImageTargets = imageTargetsLines.length > 0;

        // Calculate total stimuli needed across all types
        const totalStimuli = activeTypes.reduce((sum, [_, cfg]) => sum + (cfg.useStimulus ? cfg.stimulusCount : 0), 0);
        const useStimulus = hasAnyStimulus;
        const jumlahStimulus = totalStimuli;

        systemPrompt = `Kamu adalah ahli penilaian pendidikan Indonesia yang membuat bank soal berkualitas sesuai standar ${data.kurikulum === 'kbc' ? 'Kurikulum Berbasis Cinta (KBC) Kemenag' : 'Kurikulum Merdeka'} dan TKA (Tes Kemampuan Akademik).${data.kurikulum === 'kbc' ? '\nGunakan istilah "peserta didik" dan integrasikan konteks keagamaan/spiritual dalam stimulus soal jika relevan.' : ''}

PRINSIP PENYUSUNAN SOAL YANG BAIK DAN BENAR:

1. KAIDAH MATERI:
   - Soal harus sesuai dengan indikator/tujuan pembelajaran
   - Tidak menimbulkan multi tafsir (satu jawaban benar untuk PG biasa)
   - Pilihan jawaban homogen dan logis
   - Distraktor (pengecoh) berfungsi dengan baik - masuk akal tapi salah

2. KAIDAH KONSTRUKSI:
   - Pokok soal (stem) dirumuskan dengan jelas dan tegas
   - Rumusan stem dan pilihan jawaban merupakan pernyataan yang diperlukan saja
   - Pilihan jawaban TIDAK menggunakan "semua benar" atau "semua salah"
   - Panjang pilihan jawaban relatif sama
   - Pilihan jawaban berupa angka diurutkan dari kecil ke besar atau sebaliknya
   - Gambar/grafik/tabel harus jelas dan berfungsi

   KAIDAH PENGECOH PILIHAN GANDA (WAJIB):
   - Panjang semua opsi (A-D/E) HARUS relatif sama (selisih maks ~20% jumlah kata)
   - Jawaban benar TIDAK BOLEH selalu menjadi opsi terpanjang
   - Semua distraktor harus masuk akal dan homogen dengan kunci jawaban
   - Hindari pola: kunci selalu di posisi yang sama (variasikan A-E secara acak)
   - Distraktor berupa kesalahan konsep yang umum, bukan jawaban absurd
   - Jangan gunakan "semua jawaban benar/salah" atau "A dan B benar"
   - Setiap opsi harus berdiri sendiri dan tidak saling mengeliminasi
   - Distraktor harus mewakili miskonsepsi siswa yang realistis

3. KAIDAH BAHASA:
   - Menggunakan bahasa Indonesia baku
   - Komunikatif dan mudah dipahami sesuai jenjang
   - Tidak menggunakan bahasa yang menyinggung atau bias

4. DISTRIBUSI LEVEL KOGNITIF (Taksonomi Bloom Revisi):
   - C1 Mengingat: Mengingat fakta, konsep, prinsip
   - C2 Memahami: Menjelaskan, membandingkan, mengklasifikasikan
   - C3 Menerapkan: Menggunakan prosedur dalam situasi tertentu
   - C4 Menganalisis: Menguraikan, membedakan, mengorganisasikan
   - C5 Mengevaluasi: Menilai, mengkritik, memutuskan
   - C6 Mencipta: Merancang, menghasilkan, merencanakan

5. DISTRIBUSI TIPE SOAL (WAJIB DIIKUTI PERSIS):
   - ${distribusiTipe}
   - TOTAL: ${jumlahSoal} soal

6. FORMAT TIPE SOAL (SESUAI JENJANG: ${kelasNum <= 9 ? 'SD/SMP - 4 opsi (A-D)' : 'SMA - 5 opsi (A-E)'}):

   a) Pilihan Ganda: 
      - 1 stem + ${jumlahOpsi} opsi (${hurufOpsi}), 1 kunci benar
      - PENTING: Isi field "opsi" TANPA huruf prefix! 
      - Contoh BENAR: ["Narrative Text", "Descriptive Text", "Report Text", "Recount Text"]
      - Contoh SALAH: ["A. Narrative Text", "B. Descriptive Text", ...]
      - Field "pertanyaan" WAJIB ADA dan berisi stem soal yang jelas
   
   b) PG Kategori Benar/Salah (TKA):
      - 1 stimulus + 3-5 pernyataan, masing-masing dijawab Benar/Salah
      - Field "pertanyaan" WAJIB ADA, contoh: "Perhatikan pernyataan-pernyataan berikut berdasarkan teks di atas."
      - Gunakan field "pernyataan_benar_salah": [{"pernyataan": "...", "jawaban": "Benar"}, ...]
      - Field "kunci" berisi rangkuman jawaban, misal: "1. Benar, 2. Salah, 3. Benar"
      - JANGAN gunakan field "opsi" untuk tipe ini!
   
   c) PG Multiple Choice Multiple Answer (TKA):
      - 1 stimulus + 3-5 pernyataan/opsi, lebih dari 1 jawaban benar
      - Field "pertanyaan" WAJIB ADA, contoh: "Pilih pernyataan yang BENAR berdasarkan teks! (Lebih dari satu jawaban)"
      - Gunakan field "opsi" untuk daftar pernyataan (TANPA prefix huruf)
      - Field "kunci" berisi ARRAY jawaban benar, misal: ["1", "3", "5"] atau ["A", "C", "E"]
   
   d) Menjodohkan:
      - 3-5 premis (bernomor) + 3-5 respon (berhuruf) yang harus dicocokkan
      - Field "pertanyaan" WAJIB ADA, contoh: "Jodohkan premis di kolom kiri dengan respon yang tepat di kolom kanan."
      - Gunakan field "premis" dan "respon" (TANPA nomor/huruf prefix)
      - Field "kunci" berisi pasangan, misal: "1-C, 2-A, 3-D, 4-B"
   
   e) Isian Singkat:
      - Stem dengan bagian kosong yang harus diisi 1-3 kata
      - Field "pertanyaan" WAJIB ADA dan berisi soal dengan bagian kosong (______)
      - Field "kunci" berisi jawaban yang benar
   
   f) Uraian:
      - Pertanyaan terbuka yang membutuhkan penjelasan
      - Field "pertanyaan" WAJIB ADA dan berisi pertanyaan yang jelas
      - Field "kunci" berisi kunci jawaban lengkap

7. KONTEKS INDONESIA:
   - Gunakan nama orang Indonesia (Budi, Siti, Ahmad, Dewi, dll)
   - Gunakan lokasi Indonesia (nama kota, provinsi, tempat wisata lokal)
   - Gunakan konteks budaya Indonesia (tradisi, makanan, kesenian lokal)
   - Relevan dengan kehidupan sehari-hari siswa Indonesia

8. PENTING - STIMULUS/TEKS BACAAN:
${useStimulus 
  ? `   - Total soal: ${jumlahSoal} soal
   - Setiap stimulus/bacaan MAKSIMAL untuk ${soalPerStimulus} soal
   - Jadi perlu ${jumlahStimulus} teks bacaan yang BERBEDA
   - Setiap bacaan dengan topik/fokus yang berbeda tapi masih dalam materi yang sama
${stimulusLengthGuide}
   - Gunakan field "stimulus_list" (array) untuk menyimpan multiple stimulus:
     [{"id": 1, "teks": "Bacaan 1..."}, {"id": 2, "teks": "Bacaan 2..."}]
   - Setiap soal memiliki field "stimulus_id" yang merujuk ke id stimulus yang relevan
   - Field "stimulus" utama berisi string kosong jika menggunakan stimulus_list`
  : '   - Tidak menggunakan stimulus/teks bacaan'
}

9. PENULISAN TEKS BACAAN (PENTING):
   - JANGAN menulis "Stimulus 1", "Stimulus 2", dsb dalam pertanyaan
   - Cukup tulis "berdasarkan teks di atas" atau "based on the text above"
   - Teks bacaan akan ditampilkan secara visual sebelum soal, jadi tidak perlu label nomor
   - Contoh SALAH: "Berdasarkan Stimulus 1, tentukan..."
   - Contoh BENAR: "Berdasarkan teks di atas, tentukan..."
   - Contoh BENAR (Inggris): "Based on the text above, determine..."

10. BAHASA INSTRUKSI SOAL:
${isEnglishSubjectSoal
  ? `   - Karena mata pelajaran Bahasa Inggris, SEMUA instruksi soal dan stem WAJIB dalam Bahasa Inggris
   - Contoh stem PG: "What is the main idea of the text above?"
   - Contoh stem Benar/Salah: "Based on the text, determine if each statement is True or False."
   - Contoh stem MCMA: "Choose ALL correct statements about the text. (Multiple answers)"
   - Pernyataan dalam tabel juga harus dalam Bahasa Inggris`
  : isArabicSubjectSoal
  ? (arabicTierSoal === 'sma'
      ? `   - Karena mata pelajaran Bahasa Arab (SMA/MA): SEMUA stem soal, opsi jawaban, dan pernyataan WAJIB dalam aksara Arab berharakat (harakat pada kata sulit/kata kerja khusus, harakat penuh opsional untuk kata umum).
   - Teks bacaan (stimulus) WAJIB dalam Arab berharakat penuh.
   - Pembahasan (kunci jawaban) ditulis DWIBAHASA: baris Arab dulu, lalu terjemahan Indonesia di bawahnya.
   - Contoh stem PG: "مَا الْفِكْرَةُ الرَّئِيْسِيَّةُ لِلنَّصِّ السَّابِقِ؟"
   - Contoh stem Benar/Salah: "اِقْرَأِ النَّصَّ ثُمَّ حَدِّدْ صَحِيْحًا أَوْ خَطَأً."
   - Contoh stem MCMA: "اِخْتَرْ جَمِيْعَ الْإِجَابَاتِ الصَّحِيْحَةِ."`
      : arabicTierSoal === 'sd-high-smp'
      ? `   - Karena mata pelajaran Bahasa Arab (SD tinggi/SMP): stem soal & opsi dalam Arab berharakat LENGKAP, WAJIB diikuti terjemahan Indonesia dalam kurung "(Artinya: ...)".
   - Teks bacaan (stimulus) dalam Arab berharakat penuh + terjemahan Indonesia utuh di bawahnya.
   - Pembahasan ditulis dalam Bahasa Indonesia (boleh mengutip potongan Arab).
   - Contoh stem PG: "مَا مَعْنَى كَلِمَةِ 'مَدْرَسَة'؟ (Apa arti kata 'مَدْرَسَة'?)"`
      : `   - Karena mata pelajaran Bahasa Arab (SD kelas rendah): instruksi & stem soal dalam BAHASA INDONESIA yang ceria; kata/frasa Arab yang diuji WAJIB ditulis dalam aksara Arab berharakat LENGKAP.
   - Opsi jawaban: jika berupa kosakata Arab tulis dengan harakat penuh, boleh diikuti transliterasi Latin dalam kurung untuk kelas 1-2.
   - Pembahasan dalam Bahasa Indonesia sederhana.
   - Contoh stem PG: "Apa arti kata مَدْرَسَة dalam Bahasa Indonesia?"`)
  : '   - Gunakan Bahasa Indonesia untuk instruksi dan stem soal'
}


PENTING - FORMAT MATEMATIKA:
Untuk soal matematika, WAJIB gunakan format LaTeX:
- Akar: $\\sqrt{x}$ contoh: $\\sqrt{72}$
- Pecahan: $\\frac{a}{b}$ contoh: $\\frac{1}{2}$
- Pangkat: $x^{n}$ contoh: $2^{3}$, $x^{-2}$
- Perkalian: $\\times$ contoh: $2 \\times 3$
- Pembagian: $\\div$ contoh: $6 \\div 2$
- Simbol lain: $\\pi$, $\\leq$, $\\geq$, $\\neq$

CONTOH FORMAT OUTPUT PER TIPE (WAJIB IKUTI):

a) Pilihan Ganda:
{
  "no": 1,
  "tipe": "Pilihan Ganda",
  "level_kognitif": "C2 Memahami",
  "indikator_soal": "Mengidentifikasi jenis teks berdasarkan ciri-cirinya",
  "pertanyaan": "What is the main idea of the text?",
  "stimulus_id": 1,
  "opsi": ["The benefits of breakfast", "How to skip meals", "Weight loss tips", "Sleeping habits"],
  "kunci": "A",
  "pembahasan": "Jawaban A benar karena teks menjelaskan pentingnya sarapan...",
  "skor": 10
}

b) PG Kategori Benar/Salah${isEnglishSubjectSoal ? ' (B. Inggris)' : ''}:
{
  "no": 2,
  "tipe": "PG Kategori Benar/Salah",
  "level_kognitif": "C4 Menganalisis",
  "indikator_soal": "${isEnglishSubjectSoal ? 'Analyze the truth of statements based on the text' : 'Menganalisis kebenaran pernyataan berdasarkan teks'}",
  "pertanyaan": "${isEnglishSubjectSoal ? 'Based on the text above, determine if each statement is True or False.' : 'Berdasarkan teks di atas, tentukan apakah setiap pernyataan Benar atau Salah!'}",
  "stimulus_id": 1,
  "pernyataan_benar_salah": [
    {"pernyataan": "Skipping breakfast helps lose weight", "jawaban": "Salah"},
    {"pernyataan": "Breakfast provides energy for the day", "jawaban": "Benar"},
    {"pernyataan": "Morning meals improve concentration", "jawaban": "Benar"}
  ],
  "kunci": "1. Salah, 2. Benar, 3. Benar",
  "pembahasan": "${isEnglishSubjectSoal ? 'Statement 1 is false because the text mentions...' : 'Pernyataan 1 salah karena teks menyebutkan...'}",
  "skor": 15
}

c) PG Multiple Choice Multiple Answer:
{
  "no": 3,
  "tipe": "PG Multiple Choice Multiple Answer",
  "level_kognitif": "C4 Menganalisis",
  "indikator_soal": "Memilih pernyataan yang sesuai dengan isi teks",
  "pertanyaan": "Pilih pernyataan yang BENAR berdasarkan teks! (Lebih dari satu jawaban benar)",
  "stimulus_id": 1,
  "opsi": ["Breakfast gives energy", "Skipping breakfast is healthy", "Breakfast helps focus", "Morning meals are unnecessary"],
  "kunci": ["1", "3"],
  "pembahasan": "Jawaban 1 dan 3 benar karena sesuai dengan isi teks...",
  "skor": 15
}

OUTPUT JSON YANG HARUS DIHASILKAN:
{
  "judul_latihan": "Bank Soal [Mata Pelajaran] - [Topik]",
  "stimulus": "${useStimulus && jumlahStimulus > 1 ? '' : 'string (konteks/bacaan jika diminta)'}",
  ${useStimulus && jumlahStimulus > 1 ? '"stimulus_list": [{"id": 1, "teks": "..."}, {"id": 2, "teks": "..."}],' : ''}
  "kisi_kisi": {
    "kompetensi_dasar": "string - KD yang diujikan",
    "indikator": ["string - indikator pencapaian yang diujikan"]
  },
  "daftar_soal": [
    {
      "no": 1,
      "tipe": "Pilihan Ganda | PG Kategori Benar/Salah | PG Multiple Choice Multiple Answer | Menjodohkan | Isian Singkat | Uraian",
      "level_kognitif": "C1 Mengingat | C2 Memahami | C3 Menerapkan | C4 Menganalisis | C5 Mengevaluasi | C6 Mencipta",
      "indikator_soal": "string - indikator spesifik yang diukur oleh soal ini",
      "pertanyaan": "string - stem soal (WAJIB ADA untuk SEMUA tipe!)",
      ${useStimulus && jumlahStimulus > 1 ? '"stimulus_id": number,' : ''}
      "opsi": ${opsiArray},
      "pernyataan_benar_salah": [{"pernyataan": "...", "jawaban": "Benar/Salah"}],
      "premis": ["...", "..."],
      "respon": ["...", "..."],
      "kunci": "string atau array - jawaban benar",
      "pembahasan": "string - penjelasan mengapa jawaban benar dan mengapa distraktor salah",
      "skor": number,
      "requires_image": ${hasImageTargets ? 'true | false (WAJIB diisi; true HANYA untuk soal yang dipilih bergambar sesuai target per tipe di bawah)' : 'false'},
      "stimulus_image_prompt": "string - HANYA jika requires_image=true. Prompt English deskriptif untuk generate ilustrasi soal (aman untuk edukasi)."
    }
  ],
  "pedoman_penilaian": {
    "skor_maksimal": number,
    "rumus": "(Skor Perolehan / Skor Maksimal) x 100"
  }
}

CATATAN PENTING:
- SETIAP soal WAJIB memiliki field "pertanyaan" yang berisi stem soal!
- Hanya isi field yang relevan dengan tipe soal! 
- Untuk Pilihan Ganda biasa: isi "opsi" saja, JANGAN isi "pernyataan_benar_salah" atau "premis/respon"
- Untuk PG Kategori Benar/Salah: isi "pernyataan_benar_salah" saja, JANGAN isi "opsi"
- Untuk Menjodohkan: isi "premis" dan "respon" saja, JANGAN isi "opsi"
- IKUTI DISTRIBUSI TIPE SOAL DENGAN TEPAT!`;

        // Hitung distribusi level kognitif
        let distribusiLevel = '';
        const configLevel = data.config?.level || 'Seimbang (LOTS & HOTS)';
        if (configLevel === 'Dominan LOTS (C1-C3)') {
          distribusiLevel = '70% soal level LOTS (C1 Mengingat, C2 Memahami, C3 Menerapkan) dan 30% soal level HOTS (C4 Menganalisis, C5 Mengevaluasi, C6 Mencipta)';
        } else if (configLevel === 'Dominan HOTS (C4-C6)') {
          distribusiLevel = '30% soal level LOTS (C1, C2, C3) dan 70% soal level HOTS (C4 Menganalisis, C5 Mengevaluasi, C6 Mencipta)';
        } else {
          distribusiLevel = '50% soal level LOTS (C1, C2, C3) dan 50% soal level HOTS (C4, C5, C6)';
        }

        userPrompt = `Buatkan bank soal untuk:

IDENTITAS:
- Mata Pelajaran: ${data.mataPelajaran}
- Materi: ${data.materi || '-'}
- Sub Materi: ${data.subMateri || '-'}
- Kelas: ${data.kelas || 'tidak ditentukan'}
- Jenjang: ${kelasNum <= 6 ? 'SD' : kelasNum <= 9 ? 'SMP' : 'SMA'}

KONFIGURASI:
- Jumlah Soal: ${jumlahSoal}
- Level Kognitif: ${configLevel}
- Tipe Soal yang Diminta: ${activeTypes.map(([t]) => t).join(", ")}
- Jumlah Opsi PG: ${jumlahOpsi} opsi (${hurufOpsi}) karena jenjang ${kelasNum <= 6 ? 'SD' : kelasNum <= 9 ? 'SMP' : 'SMA'}

DISTRIBUSI STIMULUS & GAMBAR PER TIPE:
${perTypeDistribusi}
${useStimulus ? `- Total stimulus yang dibutuhkan: ${jumlahStimulus} bacaan (masing-masing untuk maks ${soalPerStimulus} soal)\n${stimulusLengthGuide}` : '- Tidak ada tipe soal yang menggunakan stimulus'}

DISTRIBUSI TIPE SOAL (WAJIB DIIKUTI PERSIS):
- ${distribusiTipe}
- TOTAL: ${jumlahSoal} soal

DISTRIBUSI LEVEL KOGNITIF:
${distribusiLevel}

INSTRUKSI PENTING:
1. SETIAP soal WAJIB memiliki field "pertanyaan" yang berisi stem soal yang jelas!
2. IKUTI distribusi tipe soal di atas DENGAN TEPAT
3. Untuk Pilihan Ganda biasa: 
   - Buat ${jumlahOpsi} opsi (${hurufOpsi}) TANPA huruf prefix
   - Contoh benar: ["Teks naratif", "Teks deskriptif", "Teks laporan", "Teks recount"]
   - Hanya isi field "opsi", JANGAN isi field lain
   - WAJIB: Panjang semua opsi HARUS relatif sama, kunci jawaban TIDAK BOLEH selalu terpanjang
4. Untuk PG Kategori Benar/Salah:
   - Field "pertanyaan" WAJIB berisi instruksi, misal: "Perhatikan pernyataan berikut..."
   - Gunakan field "pernyataan_benar_salah" dengan 3-5 pernyataan
   - JANGAN gunakan field "opsi"
5. Untuk PG Multiple Choice Multiple Answer:
   - Field "pertanyaan" WAJIB berisi instruksi, misal: "Pilih pernyataan yang BENAR..."
   - Gunakan field "opsi" untuk daftar pernyataan TANPA prefix
   - Field "kunci" harus berupa array, misal: ["1", "3"] atau ["A", "C"]
6. Untuk Menjodohkan: 
   - Field "pertanyaan" WAJIB berisi instruksi, misal: "Jodohkan premis dengan respon yang tepat."
   - Gunakan field "premis" dan "respon" TANPA nomor/huruf prefix
   - JANGAN gunakan field "opsi"
7. Gunakan konteks Indonesia (nama orang, tempat, budaya lokal) dalam soal
8. Pastikan distribusi level kognitif sesuai dengan konfigurasi
9. Stimulus/bacaan HANYA dibuat untuk tipe soal yang dikonfigurasi menggunakan stimulus. Tipe tanpa stimulus = soal mandiri tanpa bacaan.
10. HINDARI FRASA REDUNDAN: JANGAN memulai stem soal dengan kata-kata referensi seperti "Berdasarkan teks di atas...", "Berdasarkan teks 1...", "Dari wacana...", dsb. Sistem aplikasi sudah otomatis melabeli dan mengaitkan teks dengan nomor soal. Langsung saja tulis inti pertanyaannya.
${useStimulus && jumlahStimulus > 1 ? `11. Buat ${jumlahStimulus} teks bacaan yang BERBEDA topiknya dalam stimulus_list, dan hubungkan setiap soal ke stimulus yang relevan via stimulus_id\n` : ''}${hasImageTargets ? `
12. PENANDA SOAL BERGAMBAR (WAJIB TEPAT JUMLAHNYA):
${imageTargetsLines}
   - Untuk tiap soal yang dipilih bergambar: set "requires_image": true dan sediakan "stimulus_image_prompt" (Bahasa Inggris singkat, deskriptif, aman untuk edukasi — untuk diberikan ke ChatGPT/Gemini/Midjourney).
   - Untuk soal lain yang TIDAK bergambar: set "requires_image": false (atau hilangkan field-nya) dan JANGAN isi "stimulus_image_prompt".
   - PILIH soal yang paling efektif menggunakan visual (diagram, ilustrasi proses, peta, grafik, tabel visual, urutan kejadian, bagian organ, situasi kontekstual, objek pengamatan). JANGAN memilih secara acak dan JANGAN gambar dekoratif.
   - Pertimbangkan CP, Tujuan Pembelajaran, materi, indikator, level kognitif, dan manfaat pedagogis gambar.
   - KUALITAS SOAL TIDAK BOLEH TURUN karena adanya gambar. Pertanyaan tetap lengkap, kontekstual, dan sesuai level kognitif yang diminta. Gambar adalah STIMULUS VISUAL PENDUKUNG, BUKAN pengganti informasi penting dalam stem.
   - Soal bergambar TIDAK harus punya teks stimulus terpisah — gambar sendiri sudah bisa jadi stimulus visual.
` : ''}`;
        break;

      case "tujuan-pembelajaran":
        const kalender = data.kalender;
        const ruangLingkup = data.ruangLingkupMateri;
        let jpInstruction = "Buat 3-5 TP yang progresif dari level rendah ke tinggi";
        let jpUserInstruction = "Buatkan 3-5 Tujuan Pembelajaran yang sesuai dengan CP di atas. Pastikan TP progresif dari level kognitif rendah ke tinggi.";
        if (kalender) {
          const m1 = parseInt(kalender.mingguEfektifSem1) || 0;
          const m2 = parseInt(kalender.mingguEfektifSem2) || 0;
          const jp = parseInt(kalender.jpPerMinggu) || 0;
          const totalJp = (m1 + m2) * jp;
          
          if (totalJp > 0) {
            const topicCount = ruangLingkup
              ? ruangLingkup.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0).length
              : 0;
            
            const fromJp = Math.floor(totalJp / 8);
            const fromTopics = topicCount > 0 ? topicCount : fromJp;
            
            const minTp = Math.max(fromTopics, Math.max(5, fromJp));
            const maxTp = Math.max(minTp + 5, topicCount > 0 ? topicCount * 2 : fromJp + 10);
            
            if (ruangLingkup) {
              jpInstruction = `Ada ${topicCount} topik/materi yang harus diajarkan guru. Buat MINIMAL ${minTp} hingga ${maxTp} TP, dimana SETIAP topik harus mendapatkan MINIMAL 1 TP. Topik yang lebih besar/kompleks boleh mendapatkan 2-3 TP. Total durasi: ${totalJp} JP selama ${m1 + m2} minggu efektif.`;
              jpUserInstruction = `Guru akan mengajarkan ${topicCount} topik/materi berikut:\n\nTOPIK / RUANG LINGKUP MATERI:\n${ruangLingkup}\n\nATURAN PENTING:\n- Buat MINIMAL ${minTp} Tujuan Pembelajaran (idealnya hingga ${maxTp} TP)\n- SETIAP topik di atas WAJIB mendapatkan MINIMAL 1 TP yang spesifik\n- Jangan menggabungkan banyak topik dalam 1 TP — setiap TP harus fokus pada 1 topik\n- TP harus progresif dari level kognitif rendah ke tinggi\n- Total durasi: ${totalJp} JP (${m1 + m2} minggu efektif)`;
            } else {
              jpInstruction = `Buat sekitar ${minTp} hingga ${maxTp} TP yang progresif dan proporsional untuk diajarkan selama total ${totalJp} Jam Pelajaran (${m1 + m2} minggu efektif).`;
              jpUserInstruction = `Buatkan sekitar ${minTp} hingga ${maxTp} Tujuan Pembelajaran yang sesuai dengan CP di atas secara komprehensif agar memadai untuk durasi ${totalJp} Jam Pelajaran selama 1 tahun ajaran. Pastikan TP progresif dari level kognitif rendah ke tinggi dan cakupannya merata.`;
            }
          }
        } else if (ruangLingkup) {
          const topicCount = ruangLingkup.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0).length;
          jpInstruction = `Ada ${topicCount} topik yang harus diajarkan guru. Buat MINIMAL ${topicCount} TP, satu untuk SETIAP topik yang disebutkan. Topik besar boleh dapat 2 TP.`;
          jpUserInstruction = `Guru akan mengajarkan ${topicCount} topik/materi berikut:\n\nTOPIK / RUANG LINGKUP MATERI:\n${ruangLingkup}\n\nATURAN PENTING:\n- Buat MINIMAL ${topicCount} Tujuan Pembelajaran (SETIAP topik WAJIB punya minimal 1 TP)\n- Jangan menggabungkan banyak topik ke dalam 1 TP\n- TP harus progresif dari level kognitif rendah ke tinggi`;
        }

        systemPrompt = `Kamu adalah ahli pendidikan Indonesia yang membuat Tujuan Pembelajaran (TP) berdasarkan Capaian Pembelajaran (CP) resmi Kemdikbud.

ATURAN PEMBUATAN TP:
1. TP harus SMART: Specific, Measurable, Achievable, Relevant, Time-bound
2. Gunakan kata kerja operasional taksonomi Bloom yang TERUKUR:
   - C1 (Mengingat): menyebutkan, mengidentifikasi, mendaftar
   - C2 (Memahami): menjelaskan, membedakan, mencontohkan
   - C3 (Mengaplikasikan): menghitung, menerapkan, menggunakan
   - C4 (Menganalisis): menganalisis, membandingkan, mengkategorikan
   - C5 (Mengevaluasi): menilai, menyimpulkan, mengkritisi
   - C6 (Mencipta): merancang, membuat, menghasilkan
3. Format: Setiap TP diawali "Peserta didik mampu..." atau "Murid mampu..."
4. ${jpInstruction}
5. Pastikan TP dapat diukur dan diamati
6. JANGAN gunakan tanda kutip ganda (") di dalam nilai teks, gunakan kutip tunggal (') sebagai gantinya.
7. PENTING: Anda WAJIB membuat Tujuan Pembelajaran SEJUMLAH yang diinstruksikan. Jangan hanya membuat 1 atau 2 TP jika diminta membuat belasan/puluhan TP! Pecah materinya menjadi sub-topik yang lebih spesifik jika perlu.

FORMAT OUTPUT JSON:
{
  "tujuan_pembelajaran": [
    {
      "nomor": 1,
      "level_bloom": "C2 (Memahami)",
      "teks": "Peserta didik mampu menjelaskan konsep ..."
    }
  ],
  "teks_gabungan": "TP1: Peserta didik mampu...\\nTP2: Peserta didik mampu...\\n..."
}`;
        
        userPrompt = `Buatkan Tujuan Pembelajaran berdasarkan informasi berikut:

CAPAIAN PEMBELAJARAN (CP):
${data.capaianPembelajaran || '(tidak diisi)'}

MATA PELAJARAN: ${data.mataPelajaran || '(tidak diisi)'}
MATERI: ${data.materi || '(tidak diisi)'}
SUB MATERI: ${data.subMateri || '(tidak diisi)'}
FASE: ${data.fase || '(tidak diisi)'}
KELAS: ${data.kelas || '(tidak diisi)'}

${jpUserInstruction}`;
        break;

      case "kontekstualisasi-cp":
        systemPrompt = `Kamu adalah ahli kurikulum pendidikan Indonesia yang memahami Capaian Pembelajaran (CP) Kurikulum Merdeka secara mendalam.

TUGASMU:
Kamu menerima CP resmi (mentah) dari Kemdikbud beserta informasi Materi dan Sub Materi.
Tugasmu adalah mengontekstualisasikan CP tersebut menjadi kalimat CP yang RINGKAS dan EFEKTIF.

ATURAN PENTING:
- Maksimal 2-3 kalimat (30-50 kata). JANGAN menulis paragraf panjang.
- Gunakan hanya 2-3 kata kerja operasional Bloom yang paling tepat untuk materi tersebut:
   C1: menyebutkan, mengidentifikasi | C2: menjelaskan, membedakan | C3: mengaplikasikan, menerapkan
   C4: menganalisis, membandingkan | C5: menilai, menyimpulkan | C6: merancang, membuat
- Hubungkan dengan kata penghubung "serta", "dan", "melalui"
- JANGAN mengulang informasi yang sama dengan kata berbeda
- Hanya ambil bagian CP yang RELEVAN dengan Materi dan Sub Materi
- Diawali dengan "Murid mampu..."
- TIDAK menambahkan informasi di luar CP resmi

CONTOH OUTPUT IDEAL:
"Murid mampu menganalisis konsep pertumbuhan dan perkembangan hewan, mengidentifikasi jenis reproduksi dan tahapan metamorfosis, serta mengaplikasikan pengetahuan tersebut melalui observasi siklus hidup hewan."

OUTPUT: Langsung tulis kalimatnya saja. Tanpa wrapper JSON, tanpa label, tanpa penjelasan. Cukup 1 kalimat dimulai "Murid mampu...".`;

        userPrompt = `Kontekstualisasikan CP berikut sesuai dengan materi:

CP RESMI (MENTAH):
${data.capaianPembelajaran || '(tidak diisi)'}

MATA PELAJARAN: ${data.mataPelajaran || '(tidak diisi)'}
MATERI: ${data.materi || '(tidak diisi)'}
SUB MATERI: ${data.subMateri || '(tidak diisi)'}
FASE: ${data.fase || '(tidak diisi)'}
KELAS: ${data.kelas || '(tidak diisi)'}

Ekstrak bagian CP yang relevan dengan materi di atas, lalu reformulasi menjadi SATU paragraf koheren dengan kata kerja Bloom yang tepat.`;
        break;

      case "suggest-desain-pembelajaran":
        systemPrompt = `Kamu adalah ahli desain pembelajaran Indonesia. Berdasarkan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Materi yang diberikan, kamu harus menyarankan:

1. Model Pembelajaran (pilih SATU yang paling tepat dari list berikut):
   - Problem Based Learning (PBL)
   - Project Based Learning (PjBL)
   - Discovery Learning
   - Inquiry Learning
   - Cooperative Learning
   - Flipped Classroom
   - Teaching at the Right Level (TaRL)
   - Kontekstual (CTL)

2. Metode Pembelajaran (pilih 2-4 yang paling sesuai dari list berikut):
   - Ceramah Interaktif, Diskusi Kelompok, Demonstrasi, Tanya Jawab, Simulasi, Studi Kasus, Observasi, Mind Mapping, Gamifikasi, Observasi Diri dan Lingkungan, Pengumpulan Data, Presentasi Proyek

3. Dimensi Profil Lulusan (pilih 2-4 kode DPL yang paling relevan):
   - DPL 1: Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa
   - DPL 2: Kewargaan Global
   - DPL 3: Penalaran Kritis
   - DPL 4: Kreativitas
   - DPL 5: Kolaborasi
   - DPL 6: Kemandirian
   - DPL 7: Kesehatan
   - DPL 8: Komunikasi

4. Integrasi Nilai & Karakter (pilih 2-4 dari list berikut):
   - Tanggung Jawab, Peduli Diri dan Sesama, Kritis dan Kreatif, Kolaborasi, Komunikatif, Religius, Nasionalis, Mandiri, Gotong Royong, Integritas

5. Identifikasi Murid & Jenis Pengetahuan:
   - Berikan deskripsi singkat (1 kalimat) untuk 4 aspek identifikasi murid
   - Berikan deskripsi singkat (1 kalimat) untuk 4 jenis materi pengetahuan

FORMAT OUTPUT JSON:
{
  "modelPembelajaran": "nama model dari list",
  "metodePembelajaran": ["metode1", "metode2"],
  "dimensiProfilLulusan": ["DPL 3", "DPL 4"],
  "nilaiKarakter": ["Tanggung Jawab", "Kritis dan Kreatif"],
  "identifikasiMurid": {
    "pengetahuanAwal": "1 kalimat",
    "minat": "1 kalimat",
    "latarBelakang": "1 kalimat",
    "kebutuhanBelajar": "1 kalimat"
  },
  "jenisPengetahuan": {
    "faktual": "1 kalimat",
    "konseptual": "1 kalimat",
    "prosedural": "1 kalimat",
    "metakognitif": "1 kalimat"
  },
  "alasan": "Penjelasan singkat mengapa pilihan ini cocok (1-2 kalimat)"
}

PENTING: Pilih HANYA dari opsi yang tersedia di list. Jangan buat opsi baru.`;

        userPrompt = `Sarankan desain pembelajaran berdasarkan informasi berikut:

CAPAIAN PEMBELAJARAN (CP):
${data.capaianPembelajaran || '(tidak diisi)'}

TUJUAN PEMBELAJARAN (TP):
${data.tujuanPembelajaran || '(tidak diisi)'}

MATA PELAJARAN: ${data.mataPelajaran || '(tidak diisi)'}
MATERI: ${data.materi || '(tidak diisi)'}
SUB MATERI: ${data.subMateri || '(tidak diisi)'}
FASE: ${data.fase || '(tidak diisi)'}
KELAS: ${data.kelas || '(tidak diisi)'}

Berikan saran model, metode, DPL, dan nilai karakter yang paling sesuai.`;
        break;

      default:
        throw new Error("Unknown generation type");
    }

    // === INTEGRASI PROGRAM NASIONAL (KKA / SIKAP / 7KAIH) ===
    // Suntik blok integrasi ke userPrompt untuk tipe konten yang relevan.
    // Catatan: 'bankSoal' sengaja TIDAK diintegrasikan dengan 7KAIH/KKA/SIKAP —
    // Bank Soal fokus drilling pemahaman materi, bukan penyisipan program nasional.
    const integrasiTypes = new Set([
      'modul', 'modul-pertemuan', 'lkpd', 'asesmen', 'materi', 'tindakLanjut'
    ]);
    if (integrasiTypes.has(type) && data.integrasiProgram) {
      const ip = data.integrasiProgram;
      const kelasNum = parseInt(String(data.kelas || '').replace(/\D/g, '') || '0', 10);
      const jenjang = kelasNum >= 1 && kelasNum <= 6 ? 'SD'
        : kelasNum >= 7 && kelasNum <= 9 ? 'SMP' : 'SMA';

      const KKA: Record<string, { koding: string[]; ai: string[] }> = {
        SD: {
          koding: [
            'Solusi masalah sehari-hari secara terstruktur (balok susun / kepingan gambar).',
            'Langkah sistematis dengan simbol/kosakata terbatas (algoritma dasar).',
            'Instruksi bersyarat sederhana (program berbasis blok: percabangan & pengulangan).',
            'Pemahaman distopia teknologi.',
          ],
          ai: [
            'Dampak AI dalam kehidupan sehari-hari.',
            'Etika AI: tidak 100% benar, perlindungan data pribadi, AI untuk kebaikan.',
            'Membedakan teknologi AI vs non-AI; konsep input–proses–output.',
          ],
        },
        SMP: {
          koding: [
            'Program sistem manajemen sederhana (kumpul–pahami–olah data).',
            'Program pada aplikasi berbasis simbol; merancang produk digital sederhana.',
          ],
          ai: [
            'Dampak AI terhadap masyarakat.',
            'Persoalan AI: bias, ketergantungan, halusinasi, hak cipta.',
            'Hubungan data & AI lewat Teachable Machine; pentingnya data berkualitas.',
          ],
        },
        SMA: {
          koding: [
            'Program berbasis teks lebih kompleks (fungsi & modul).',
            'Program untuk masalah nyata (mis. simulasi pergerakan objek); produk digital kompleks.',
          ],
          ai: [
            'Prompt engineering; dampak AI terhadap pekerjaan.',
            'Evaluasi AI: transparansi, explainability, sustainability.',
            'Membangun model AI sederhana & aplikasi via library/API.',
          ],
        },
      };

      const blocks: string[] = [];
      if (ip.kka) {
        const k = KKA[jenjang];
        blocks.push(
`KKA — Koding & Kecerdasan Artifisial (jenjang ${jenjang})
  Koding:
${k.koding.map((x: string) => '  - ' + x).join('\n')}
  Kecerdasan Artifisial:
${k.ai.map((x: string) => '  - ' + x).join('\n')}
  Cara integrasi: sisipkan minimal 1 aktivitas inti yang menggunakan logika algoritmik/literasi AI sesuai materi. JANGAN ganti topik utama.`
        );
      }
      if (ip.sikap) {
        blocks.push(
`SIKAP — Sekolah Inovatif Ketahanan Pangan
  - Praktis & kontekstual (pembibitan → perawatan → panen).
  - Peduli lingkungan & pemanfaatan barang bekas.
  - Membentuk karakter wirausaha, tanggung jawab, gotong royong.
  - Kolaboratif lintas warga sekolah & instansi.
  Cara integrasi: jadikan urban farming / hidroponik / akuaponik sebagai "kaitan kehidupan"; sisipkan ≥1 aktivitas projek mini kemandirian pangan; tambahkan butir asesmen sikap peduli lingkungan & wirausaha.`
        );
      }
      if (ip.kaih) {
        blocks.push(
`7KAIH — 7 Kebiasaan Anak Indonesia Hebat
  1. Bangun Pagi  2. Beribadah  3. Berolahraga  4. Makan Sehat & Bergizi
  5. Gemar Belajar  6. Bermasyarakat  7. Tidur Cukup
  Cara integrasi: sisipkan rutinitas relevan pada Tahap Awal (doa, ice-breaking, refleksi syukur) dan Tahap Penutup (komitmen tidur cukup / gemar belajar); selaraskan nilai karakter dengan kebiasaan paling relevan terhadap materi.`
        );
      }

      if (blocks.length) {
        userPrompt += `

INTEGRASI PROGRAM NASIONAL (WAJIB diintegrasikan secara cerdas, tidak boleh diabaikan):

${blocks.join('\n\n')}

Jahit ke seksi/konten yang sudah ada — JANGAN buat seksi baru di luar struktur output yang sudah ditentukan.`;
      }
    }

    // FASE 2 — sisipkan fokus pertemuan untuk dokumen non-modul.
    // Hanya aktif jika request membawa info pertemuan (mode hierarki / V2).
    if (pertemuanBlock && ['lkpd', 'asesmen', 'materi', 'tindakLanjut', 'bankSoal'].includes(type)) {
      userPrompt += pertemuanBlock;
    }


    // Tentukan maxOutputTokens berdasarkan tipe konten (konservatif untuk kecepatan)
    const tokenLimitByType: Record<string, number> = {
      modul: 12000,
      'modul-pertemuan': 8000,
      lkpd: 7000,
      asesmen: 11000,
      materi: 10000,
      bankSoal: 9000,
      tindakLanjut: 5000,
      'tujuan-pembelajaran': 10000,
      'kontekstualisasi-cp': 1000,
      'suggest-desain-pembelajaran': 2000,
      'edit-section': 4000
    };
    const maxTokens = tokenLimitByType[type] || 8000;

    // Make request based on endpoint type
    let response: Response;
    let usedModel = GEMINI_MODEL_CHAIN[0];
    let triedModels: string[] = [];
    let parsedContent: any;
    let preParsedContentReady = false;
    let preParsedContentText = "";
    let preParsedSanitizedContent = "";
    
    const userPool = userKeyPool;
    const isJsonMode = type !== 'kontekstualisasi-cp';
    
    if (useGeminiDirect && userPool.length > 0 && type === 'lkpd' && isJsonMode) {
      const result = await executeCrossProviderParsedJson(systemPrompt, userPrompt, maxTokens);
      usedModel = result.usedModel;
      triedModels = result.triedModels;

      if (!result.ok) {
        return new Response(JSON.stringify({
          error: result.error || "LKPD belum berhasil dibuat. Semua key/model aktif sudah dicoba.",
          errorCode: result.errorCode || "lkpd_generation_failed",
          triedModels,
          needApiKey: result.errorCode === "invalid_key" || result.errorCode === "quota_unavailable"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      parsedContent = result.parsedContent;
      preParsedContentReady = true;
      preParsedContentText = result.content || "";
      preParsedSanitizedContent = result.sanitizedContent || "";
      response = new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: preParsedContentText }] } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else if (useGeminiDirect && userPool.length > 0) {
      // Cross-provider fallback: tries preferred provider key(s) first, then any other provider keys
      const result = await executeCrossProvider(systemPrompt, userPrompt, maxTokens, isJsonMode);
      response = result.response;
      usedModel = result.usedModel;
      triedModels = result.triedModels;
    } else if (useGeminiDirect) {
      // Demo Gemini key path (trial users / no user keys) — native Gemini multi-model
      const generateBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: maxTokens,
          responseMimeType: isJsonMode ? "application/json" : "text/plain"
        }
      };
      
      const result = await executeGeminiRequest(
        generateBody, 
        apiKey, 
        GEMINI_MODEL_CHAIN
      );
      response = result.response;
      usedModel = result.usedModel;
      triedModels = result.triedModels;
    } else {
      // Lovable AI gateway (OpenAI-compatible format)
      response = await fetch(LOVABLE_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...(type !== 'kontekstualisasi-cp' ? { response_format: { type: "json_object" } } : {}),
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Gunakan helper parseGeminiError untuk semua error
      if (useGeminiDirect) {
        const { errorCode, message } = parseGeminiError(response.status, errorText);
        
        const isAllQuotaExhausted = response.status === 429 || response.status === 404;
        
        // Ketika semua demo keys habis → tampilkan pesan server ramai (bukan error teknis)
        if (isAllQuotaExhausted && isUsingDemoKeys) {
          return new Response(
            JSON.stringify({
              error: 'Saat ini permintaan pembuatan modul dengan mode gratis sedang sangat banyak. Server gratis kami sedang penuh.',
              errorCode: 'demo_server_busy',
              isTrial: true,
              triedModels,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: message, 
            errorCode: isAllQuotaExhausted ? "all_quota_exceeded" : errorCode,
            triedModels: triedModels,
            needApiKey: errorCode === "invalid_key" || errorCode === "quota_unavailable"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Lovable AI gateway errors - return 200 so frontend can read error message
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Coba lagi beberapa saat.", 
            errorCode: "rate_limit" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Anda belum memiliki API Key Gemini. Silakan tambahkan di menu Pengaturan → API Key untuk menggunakan fitur ini.",
            errorCode: "no_api_key",
            needApiKey: true 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI generation failed");
    }

    let content: string;
    if (preParsedContentReady) {
      content = preParsedContentText;
    } else {
      const result = await response.json();
      content = extractAiContent(result, useGeminiDirect);
    }

    if (!content) {
      throw new Error("No content in response");
    }

    // Sanitasi response dengan fallback extraction
    let sanitizedContent = preParsedContentReady ? preParsedSanitizedContent : extractJsonFromResponse(content);

    // Logging untuk debugging
    console.log("Raw AI content length:", content.length);
    console.log("Sanitized content preview:", sanitizedContent.substring(0, 500));

    // Untuk kontekstualisasi-cp, response adalah plain text — langsung wrap
    if (type === 'kontekstualisasi-cp') {
      const plainText = content.trim().replace(/^```[\s\S]*?```$/gm, '').replace(/^["']|["']$/g, '').trim();
      const parsedContent = { cp_kontekstual: plainText };
      console.log("kontekstualisasi-cp: wrapped plain text, length:", plainText.length);
      
      // Log generation
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        let user: any = null; if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && data.admin_override_user_id) { const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(data.admin_override_user_id); user = adminData.user; } else { const { data: authData } = await supabaseAdmin.auth.getUser(token); user = authData.user; }
        if (user) {
          await supabaseAdmin.from('generation_logs').insert({
            user_id: user.id,
            content_type: type,
            metadata: { model: usedModel }
          });
        }
      }

      return new Response(JSON.stringify({ data: parsedContent, model: usedModel, ...(pertemuanMeta ? { meta: { type, ...pertemuanMeta } } : {}) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!preParsedContentReady) {
      const parsed = parseGeneratedJson(content);
      if (parsed.parsed) {
        parsedContent = parsed.parsed;
        sanitizedContent = parsed.sanitized;
        console.log("Parse success:", typeof parsedContent === 'object');
        console.log("Has auto_generated:", !!parsedContent?.auto_generated);
        console.log("Has pertemuan:", !!parsedContent?.pertemuan);
      } else {
        console.error("JSON parse failed (all methods):", parsed.error);
        console.error("Raw content (first 1500 chars):", content.substring(0, 1500));
        
        return new Response(JSON.stringify({
          error: type === 'lkpd'
            ? "Response AI untuk LKPD belum valid. Semua fallback sudah dicoba, silakan coba lagi atau tambahkan API Key lain."
            : `Gagal memproses JSON dari AI. Error: ${(parsed.error as any)?.message || 'Unknown'}. Preview: ${content.substring(0, 150)}...`,
          errorCode: "parse_error",
          triedModels,
          rawPreview: content.substring(0, 500)
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("LKPD pre-parse success:", typeof parsedContent === 'object');
    }

    // Untuk type 'modul-pertemuan', normalisasi & validasi single pertemuan object
    if (type === 'modul-pertemuan') {
      // Auto-unwrap jika AI membungkus dengan { pertemuan: [obj] }
      if (parsedContent?.pertemuan && Array.isArray(parsedContent.pertemuan) && parsedContent.pertemuan[0]) {
        console.log("Unwrapping pertemuan wrapper from modul-pertemuan response");
        parsedContent = parsedContent.pertemuan[0];
      }
      // Validasi struktur minimum
      if (!parsedContent?.tahap_awal || !parsedContent?.tahap_inti || !parsedContent?.tahap_penutup) {
        console.error("Invalid modul-pertemuan structure, keys:", Object.keys(parsedContent || {}));
        return new Response(JSON.stringify({
          error: "Struktur pertemuan tidak lengkap (tahap_awal/inti/penutup hilang). Coba lagi.",
          errorCode: "invalid_pertemuan_structure",
          parsedKeys: Object.keys(parsedContent || {})
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Pastikan nomorPertemuan & durasi terisi dari request bila AI mengabaikan
      const reqIdx = (data?.pertemuanIndex ?? 0) + 1;
      const reqDur = data?.pertemuanTarget?.durasi || '90';
      parsedContent.nomorPertemuan = parsedContent.nomorPertemuan || reqIdx;
      parsedContent.durasi = parsedContent.durasi || `${reqDur} menit`;
    }

    // Untuk type 'modul', validasi struktur yang diharapkan
    if (type === 'modul') {
      if (!parsedContent.pertemuan || !Array.isArray(parsedContent.pertemuan)) {
        console.error("Invalid modul structure: missing pertemuan array");
        console.error("parsedContent keys:", Object.keys(parsedContent));
        return new Response(JSON.stringify({
          error: "Struktur response tidak valid. AI tidak mengembalikan data pertemuan. Coba generate ulang.",
          errorCode: "invalid_structure",
          parsedKeys: Object.keys(parsedContent)
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Untuk type 'materi', validasi struktur yang diharapkan
    if (type === 'materi') {
      if (!parsedContent.judul_materi || !parsedContent.isi_materi) {
        console.error("Invalid materi structure: missing required fields");
        console.error("parsedContent keys:", Object.keys(parsedContent));
        return new Response(JSON.stringify({
          error: "Struktur Materi tidak valid. AI tidak mengembalikan konten lengkap. Coba generate ulang.",
          errorCode: "invalid_materi_structure",
          parsedKeys: Object.keys(parsedContent)
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Log successful generation for analytics (non-blocking) & compute remaining quota
    let remaining: number | undefined;
    let limit: number | undefined;
    let isTrial: boolean | undefined;
    
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        let user: any = null; if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && data.admin_override_user_id) { const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(data.admin_override_user_id); user = adminData.user; } else { const { data: authData } = await supabaseAdmin.auth.getUser(token); user = authData.user; }
        
        if (user) {
          await supabaseAdmin.from('generation_logs').insert({
            user_id: user.id,
            content_type: type,
            metadata: {
              mata_pelajaran: data.mataPelajaran || null,
              kelas: data.kelas || null,
              model_used: usedModel,
              pertemuan_nomor: pertemuanMeta?.nomorPertemuan ?? null,
              pertemuan_id: pertemuanMeta?.pertemuanId ?? null
            }
          });
          console.log('Generation logged for user:', user.id, 'type:', type);

          // Compute remaining quota
          const { data: customerData } = await supabaseAdmin
            .from('allowed_customers')
            .select('account_type')
            .eq('user_id', user.id)
            .maybeSingle();

          isTrial = customerData?.account_type === 'trial';

          // Only compute remaining for trial users
          if (isTrial) {
            const contentLimit = 100;
            limit = contentLimit;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: newDailyCount } = await supabaseAdmin
              .from('generation_logs')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .neq('content_type', 'image')
              .gte('created_at', today.toISOString());

            remaining = Math.max(0, contentLimit - (newDailyCount ?? 0));
          }
        }
      }
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log generation (non-critical):', logError);
    }

    return new Response(JSON.stringify({ data: parsedContent, model: usedModel, remaining, limit, isTrial, ...(pertemuanMeta ? { meta: { type, ...pertemuanMeta } } : {}) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
