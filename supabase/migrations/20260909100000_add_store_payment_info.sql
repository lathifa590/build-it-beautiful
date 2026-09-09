-- Tambah kolom informasi rekening pembayaran dan WhatsApp di profil toko
ALTER TABLE public.modul_store_profiles
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Bank BRI',
ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '364401036953533',
ADD COLUMN IF NOT EXISTS bank_account_name TEXT DEFAULT 'HUSNUL KHULUQ',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '6288228511309';

-- Tambah kolom nomor whatsapp pembeli di tabel orders jika belum ada
ALTER TABLE public.modul_store_orders
ADD COLUMN IF NOT EXISTS buyer_whatsapp TEXT;
