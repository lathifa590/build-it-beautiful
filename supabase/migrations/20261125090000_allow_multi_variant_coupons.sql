-- Migration: Allow multi-variant coupon package selections
-- Removes single-value CHECK constraint so coupons can apply to any combination of packages (e.g. 'lite,standar', 'standar,pro', 'all', etc.)

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_applicable_to_check;
