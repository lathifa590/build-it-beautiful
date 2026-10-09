DROP POLICY IF EXISTS "Authenticated view active agency_materials" ON public.agency_materials;
DROP POLICY IF EXISTS "Anyone view active agency_materials" ON public.agency_materials;

CREATE POLICY "Anyone view active agency_materials" ON public.agency_materials
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.agency_materials (title, description, url, category, button_label, sort_order, is_active)
SELECT 
  'Materi Desain & Template Promosi Agency',
  'Download flyer siap sebar, banner promosi resolusi tinggi, logo resmi, dan draft copywriting broadcast WhatsApp untuk membantu promosi Anda.',
  'https://drive.google.com',
  'Google Drive',
  'Buka Google Drive Materi',
  10,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.agency_materials);
