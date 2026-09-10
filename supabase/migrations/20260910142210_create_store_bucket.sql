-- Ensure storage buckets exist for store functionality
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('modul_store_assets', 'modul_store_assets', true),
  ('modul_store_files', 'modul_store_files', false)
ON CONFLICT (id) DO NOTHING;
