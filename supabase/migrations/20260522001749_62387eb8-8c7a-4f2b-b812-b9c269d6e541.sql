
CREATE TABLE public.agency_promos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  badge_text text NOT NULL DEFAULT 'FLASH SALE',
  discount_percent int NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  target_tier text CHECK (target_tier IN ('mini','lite','pro','max')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promos" ON public.agency_promos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated view active promos" ON public.agency_promos
  FOR SELECT TO authenticated
  USING (is_active = true AND now() BETWEEN starts_at AND ends_at);

CREATE TRIGGER trg_agency_promos_updated_at
  BEFORE UPDATE ON public.agency_promos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
