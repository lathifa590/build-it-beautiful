# Fase 4A — History V2 (dokumentasi)

Migration canonical (satu-satunya yang dijalankan) ada di:

`supabase/migrations/20260804064446_ce417cbe-d24f-45a0-9f3d-bc02d878b4a1.sql`

Isi: menambah `content_history.generation_result_v2 jsonb` (nullable) dan
`content_history.content_schema_version integer NOT NULL DEFAULT 1`, plus index
`content_history_schema_version_idx (user_id, content_schema_version)`.

File SQL duplikat di folder ini sudah dihapus agar tidak ada dua sumber migrasi.
