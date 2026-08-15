ALTER TABLE public.allowed_customers
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS lynk_purchased_at TIMESTAMPTZ NULL;

UPDATE public.allowed_customers
SET account_type = 'lifetime'
WHERE account_type = 'regular';

ALTER TABLE public.allowed_customers
  ALTER COLUMN account_type SET DEFAULT 'annual';

CREATE INDEX IF NOT EXISTS idx_allowed_customers_account_type
  ON public.allowed_customers(account_type);
CREATE INDEX IF NOT EXISTS idx_allowed_customers_expires
  ON public.allowed_customers(subscription_expires_at);