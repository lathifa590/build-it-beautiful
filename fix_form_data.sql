-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan 'form_data' ke daftar tipe dokumen yang diizinkan

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE public.documents ADD CONSTRAINT documents_document_type_check 
CHECK (document_type IN ('modul', 'lkpd', 'materi', 'asesmen', 'soal', 'refleksi', 'form_data'));
