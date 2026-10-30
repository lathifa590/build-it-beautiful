---
name: byok-gemini-docx
description: >-
  Standardized blueprint and workflows for building resilient AI content/document generators using
  Bring-Your-Own-Key (BYOK), multi-key Gemini pooling with auto-failover, and print-ready OOXML DOCX export.
---

# BYOK Gemini & Print-Ready DOCX Generator Skill

This skill teaches agents how to implement, adapt, and maintain document/content generator applications following the battle-tested **BYOK (Bring Your Own Key)** pattern with multiple Google Gemini API keys and professional **print-ready Microsoft Word (.docx)** compilation.

---

## 1. Core Architecture Overview

Applications built with this pattern consist of three decoupled layers:

```
[ Frontend: User / Client ]
      │
      ├── 1. Key Management UI (CRUD user_api_keys with RLS)
      ├── 2. invokeWithRetry() (Transparent exponential backoff on transient errors)
      └── 3. docx-engine (Client-side OOXML generation with print typography & margins)
            │
            ▼
[ Backend: Supabase Edge Function ]
      │
      └── executeGeminiRequest()
            ├── Multi-key Pool Rotation (handles 429 quota exhaustion)
            ├── Model Chain Fallback (handles model outages/deprecations)
            └── JSON Sanitizer & Schema Enforcement
```

---

## 2. Gemini Multi-Key & Model Chain Rules

### CRITICAL: Model Hierarchy & Fallback
When targeting accounts operating under Google AI Studio API keys (standard or experimental tiers), **do NOT hardcode unavailable models**.

Recommended resilient model chain:
1. `gemini-3.6-flash` (Primary / Recommended high-speed reasoning)
2. `gemini-3.5-flash` / `gemini-3.0-flash`
3. `gemini-2.5-flash`
4. `gemini-2.5-flash-lite`

> [!WARNING]
> If a model returns `404 Not Found`, the model name is invalid or not enabled for that API key tier. The engine MUST fall back to the next model in `GEMINI_MODEL_CHAIN`.
> If a model returns `429 Too Many Requests`, the engine MUST cycle to the **next API key in the user's key pool**.

### Key Pool Rotation Logic
```typescript
for (const currentKey of userApiKeys) {
  for (const model of modelChain) {
    const res = await callGemini(model, currentKey, promptPayload);
    if (res.ok) return res.data;
    if (res.status === 429) break; // Key quota hit -> switch immediately to next key
    if (res.status === 404 || res.status === 503) continue; // Try next model on same key
    if (res.status === 401 || res.status === 403) break; // Invalid key -> next key
  }
}
```

---

## 3. Database Schema: `user_api_keys`

Always enforce Supabase Row Level Security (RLS) so users only read and write their own keys:

```sql
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gemini' CHECK (provider IN ('gemini', 'openai', 'anthropic', 'openrouter')),
  api_key TEXT NOT NULL,
  label TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON public.user_api_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_lookup 
  ON public.user_api_keys(user_id, provider, is_active);
```

---

## 4. Client-Side Resilience: `invokeWithRetry`

Network drops, gateway timeouts (504), and temporary server load (503) should be invisible to the user:
- Max attempts: 3 (1 initial + 2 retries).
- Base delay: 800ms with exponential backoff ($800ms \times 2^{\text{attempt}-1}$).
- Custom JSON schema validator: checks if required keys exist before accepting output.
- Do NOT retry deterministic errors (`needApiKey`, 401 unauthenticated, explicit invalid input).

---

## 5. Print-Ready DOCX Best Practices

A document is only "print-ready" if it looks publisher-grade when opened in Microsoft Word:

1. **Standard Page Setup (A4 / F4)**:
   - Margins: Left 3cm, Top 2.5cm, Right 2cm, Bottom 2.5cm (standard administrative format).
   - Line spacing: 1.15x with 6pt space-after.
2. **Table Formatting**:
   - Always set `table.cantSplit` on rows to prevent awkward page splits across cell text.
   - Header row must have `tblHeader` set so headers repeat on multi-page tables.
   - Use explicit percentage column widths (`WidthType.PERCENTAGE`).
   - Clean borders: light grey inner grid (`#D3D3D3`) and bold or colored header background.
3. **Headings & Hierarchy**:
   - `HeadingLevel.HEADING_1`: Bold, 14pt, `keepWithNext: true` (avoids orphan titles at page bottoms).
   - `HeadingLevel.HEADING_2`: Bold, 12pt, `keepWithNext: true`.
4. **Header & Footer**:
   - Header: Document title / section name (8pt, grey, right-aligned).
   - Footer: "Halaman X dari Y" using `PageNumber.CURRENT` and `PageNumber.TOTAL_PAGES`.
5. **LaTeX Formula Injection (Optional)**:
   - For mathematical or scientific documents, inject markers `__MATH_N__` in docx runs.
   - Post-process with JSZip: transform `LaTeX -> Temml (MathML) -> mathml2omml -> OMML XML` and replace within `word/document.xml`.

---

## 6. How to Implement in a New Project

When instructed to create a new generator app or adopt this pattern:
1. **Copy or reference files** from `templates/byok-gemini-docx-starter/`:
   - Run `database/schema.sql` on the Supabase instance.
   - Deploy `supabase/functions/generate-content-core/`.
   - Add `useGeminiKeys.ts` and `ApiKeyManagerModal.tsx` to the client.
   - Adapt `docx-builder.ts` and `docx-styles.ts` with the specific domain fields.
2. **Customize Prompts**:
   - Keep system instructions deterministic: *"Return ONLY raw JSON conforming to this TypeScript interface: {...}"*.
   - Add markdown codeblock stripping (````json ... ````) before parsing.
3. **Connect Export Flow**:
   - Provide preview UI (`docx-preview` or HTML preview) before export.
   - Trigger direct download of the `.docx` Blob using `file-saver` or browser anchor click.
