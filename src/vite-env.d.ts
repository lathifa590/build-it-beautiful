/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  /** Feature flag: arsitektur Dokumen per Pertemuan V2. Default OFF. */
  readonly VITE_ENABLE_PERTEMUAN_DOCS_V2?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
