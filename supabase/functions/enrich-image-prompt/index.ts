import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
];

const SYSTEM_PROMPT = `You are a Master Image Prompt Engineer for Indonesian K-12 educational materials (worksheets, question banks, teaching materials).

Turn an Indonesian description (and optional English seed prompt) into ONE detailed English prompt suitable for ChatGPT / Gemini / Midjourney / Nano Banana to produce a classroom-appropriate illustration.

PROCESS (silent):
1. Extract subject, action, setting, mood, key objects from the ID text.
2. Translate + expand: composition, lighting, palette, textures, style (prefer "clean flat illustration" / "textbook illustration" unless the input suggests otherwise), age-appropriate framing.
3. Append quality tags: "high resolution, sharp focus, clean background, no watermark, no signature, no text, no letters".

REFINE MODE: apply the Indonesian instruction to the existing prompt, keep the rest intact, output the full updated prompt only.

OUTPUT: only the final English prompt. One paragraph, 50–150 words. No preamble, markdown, or quotes.`;

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface Body {
  pertanyaan?: string;
  current_prompt?: string;
  mode?: 'enrich' | 'refine';
  instruction?: string;
  history?: ChatMsg[];
  apiKeys?: string[];
}

function stripWrapping(text: string): string {
  let t = text.trim();
  // Strip triple-fence
  t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  // Strip surrounding quotes
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

function buildUserPrompt(body: Body): string {
  if (body.mode === 'refine') {
    const historyText = (body.history ?? [])
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
      .join('\n');
    return [
      'REFINE MODE.',
      body.current_prompt ? `CURRENT PROMPT:\n${body.current_prompt}` : '',
      historyText ? `CONVERSATION SO FAR:\n${historyText}` : '',
      `NEW INSTRUCTION (Indonesian): ${body.instruction ?? ''}`,
      'Return the full updated English prompt only.',
    ].filter(Boolean).join('\n\n');
  }
  return [
    'ENRICH MODE.',
    body.pertanyaan ? `INDONESIAN CONTEXT:\n${body.pertanyaan}` : '',
    body.current_prompt ? `SEED PROMPT (English, optional):\n${body.current_prompt}` : '',
    'Return one detailed English image prompt.',
  ].filter(Boolean).join('\n\n');
}

async function callGemini(apiKey: string, model: string, userPrompt: string, temperature: number) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature, maxOutputTokens: 800 },
    }),
  });
  const status = resp.status;
  const text = await resp.text();
  return { status, text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: Body = await req.json();
    const mode = body.mode ?? 'enrich';
    const apiKeys = (body.apiKeys ?? []).map((k) => k?.trim()).filter(Boolean);

    if (apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tidak ada API key Gemini. Tambahkan di halaman Pengaturan.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode === 'refine') {
      const instr = (body.instruction ?? '').trim();
      if (instr.length < 2 || instr.length > 500) {
        return new Response(
          JSON.stringify({ error: 'Instruksi harus 2–500 karakter.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const userPrompt = buildUserPrompt(body);
    const temperature = mode === 'refine' ? 0.3 : 0.5;

    let lastErr = 'Semua API key & model gagal.';
    for (const key of apiKeys) {
      let keyInvalid = false;
      for (const model of MODEL_CHAIN) {
        try {
          const { status, text } = await callGemini(key, model, userPrompt, temperature);
          if (status === 200) {
            let data: any;
            try { data = JSON.parse(text); } catch { lastErr = 'Response bukan JSON valid'; continue; }
            const out = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (!out) { lastErr = 'Response kosong dari model'; continue; }
            const clean = stripWrapping(out);
            return new Response(
              JSON.stringify({ prompt: clean, model, mode }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (status === 403 || /API_KEY_INVALID/i.test(text)) {
            keyInvalid = true;
            lastErr = 'API key ditolak (403).';
            break; // stop trying models for this key
          }
          if (status === 429 || status >= 500) {
            lastErr = `Model ${model} status ${status}`;
            continue;
          }
          lastErr = `Model ${model} status ${status}: ${text.slice(0, 200)}`;
        } catch (e) {
          lastErr = `Network error: ${(e as Error).message}`;
        }
      }
      if (keyInvalid) continue;
    }

    return new Response(
      JSON.stringify({ error: lastErr }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
