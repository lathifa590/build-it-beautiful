-- Create allowed_customers table for whitelisting existing customers
CREATE TABLE public.allowed_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.allowed_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allowed_customers
CREATE POLICY "Admins can view all customers"
ON public.allowed_customers FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert customers"
ON public.allowed_customers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update customers"
ON public.allowed_customers FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete customers"
ON public.allowed_customers FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Anyone can check if their email exists (for login flow)
CREATE POLICY "Anyone can check email existence"
ON public.allowed_customers FOR SELECT
USING (lower(email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create trigger for updated_at
CREATE TRIGGER update_allowed_customers_updated_at
BEFORE UPDATE ON public.allowed_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();