-- Aktifkan ekstensi pg_net jika belum aktif (untuk HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Hapus job lama jika ada
SELECT cron.unschedule('auto-generate-blog-article');

-- Jadwalkan cron job untuk berjalan setiap jam pada menit ke-0
-- "0 * * * *" artinya jalan setiap jam
SELECT cron.schedule(
  'auto-generate-blog-article',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url:='https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/generate-blog-article',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.headers')::json->>'apikey' || '"}'::jsonb
    );
  $$
);
