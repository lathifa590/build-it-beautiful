-- ==============================================================
-- PERBAIKAN KRITIS RLS: public.modul_store_orders
--
-- Kenapa file ini ada:
-- Migrasi `20261013140000_fix_store_orders_security_rls.sql` TIDAK PERNAH
-- benar-benar jalan di production. Buktinya: function track_store_order dan
-- get_store_order_by_id tidak ada di database (HTTP 404 PGRST202), padahal
-- keduanya dibuat oleh migrasi tersebut.
--
-- Akibatnya policy lama dari `20260829025545_add_modul_store.sql` masih aktif:
--   "Public can view own order"   -> FOR SELECT USING (true)
--   "Public can update own order" -> FOR UPDATE USING (true)
--
-- Dampak nyata: siapa pun yang punya anon key (dan key itu memang terkirim
-- ke browser lewat bundle Vite) bisa membaca SELURUH isi tabel order —
-- nama, email, nomor WhatsApp, nominal, dan URL bukti bayar pembeli —
-- serta mengubah status/nominal order mana pun.
--
-- Catatan: migrasi lama memang akan gagal kalau dijalankan, karena
-- mereferensikan kolom yang tidak ada (original_amount, discount_amount,
-- payment_method, l.price, l.file_path). File ini dibuat idempoten dan
-- hanya memakai kolom yang benar-benar ada di tabel.
--
-- Cara pakai: Supabase Dashboard -> SQL Editor -> tempel seluruh isi file
-- ini -> Run. Aman dijalankan berulang kali.
-- ==============================================================

begin;

-- 1. Buang semua policy lama, termasuk yang dibuat migrasi yang gagal
drop policy if exists "Public can view own order"                on public.modul_store_orders;
drop policy if exists "Public can update own order"              on public.modul_store_orders;
drop policy if exists "Public can create orders"                 on public.modul_store_orders;
drop policy if exists "Public can create orders with initial status" on public.modul_store_orders;
drop policy if exists "Buyers can only transition to review"     on public.modul_store_orders;
drop policy if exists "Sellers and logged in buyers can view orders" on public.modul_store_orders;
drop policy if exists "Sellers can manage orders for their store" on public.modul_store_orders;

alter table public.modul_store_orders enable row level security;

-- 2. INSERT anonim: hanya order baru yang belum dibayar, atau order gratis
create policy "Public can create orders with initial status"
  on public.modul_store_orders
  for insert
  with check (
    status = 'PENDING_PAYMENT'
    or (status = 'SELESAI' and total_amount = 0)
  );

-- 3. SELECT: penjual tokonya sendiri, atau pembeli dengan email yang sama
create policy "Sellers and logged in buyers can view orders"
  on public.modul_store_orders
  for select
  using (
    exists (
      select 1
      from public.modul_store_profiles p
      where p.store_id = public.modul_store_orders.store_id
        and p.owner_user_id = auth.uid()
    )
    or (
      auth.uid() is not null
      and lower(buyer_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 4. Penjual tetap boleh mengelola order di tokonya
create policy "Sellers can manage orders for their store"
  on public.modul_store_orders
  for all
  using (
    exists (
      select 1
      from public.modul_store_profiles p
      where p.store_id = public.modul_store_orders.store_id
        and p.owner_user_id = auth.uid()
    )
  );

-- 5. Tidak ada policy UPDATE/DELETE untuk anon, dan grant-nya dicabut.
--    Upload bukti bayar harus lewat RPC submit_payment_proof() di bawah.
revoke update, delete, truncate on public.modul_store_orders from anon;

-- 6. RPC baca order untuk pembeli anonim.
--    Dipanggil dari src/lib/store-api.ts -> getOrder() sebagai fallback.
create or replace function public.get_store_order_by_id(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $fn$
  select jsonb_build_object(
    'order_id',         o.order_id,
    'invoice_number',   o.invoice_number,
    'store_id',         o.store_id,
    'listing_id',       o.listing_id,
    'buyer_email',      o.buyer_email,
    'buyer_name',       o.buyer_name,
    'buyer_whatsapp',   o.buyer_whatsapp,
    'total_amount',     o.total_amount,
    'coupon_code_used', o.coupon_code_used,
    'status',           o.status,
    'payment_proof_url',o.payment_proof_url,
    'uploaded_at',      o.uploaded_at,
    'created_at',       o.created_at,
    'updated_at',       o.updated_at,
    'completed_at',     o.completed_at,
    'listing', (
      select jsonb_build_object(
        'listing_id',          l.listing_id,
        'store_id',            l.store_id,
        'title',               l.title,
        'description',         l.description,
        'category',            l.category,
        'price_amount',        l.price_amount,
        'normal_price_amount', l.normal_price_amount,
        'status',              l.status,
        'preview_image_url',   l.preview_image_url,
        'url_modul_ajar',      l.url_modul_ajar,
        'created_at',          l.created_at,
        'updated_at',          l.updated_at,
        'published_at',        l.published_at,
        'store_profile', (
          select jsonb_build_object(
            'store_id',            sp.store_id,
            'store_name',          sp.store_name,
            'store_slug',          sp.store_slug,
            'avatar_url',          sp.avatar_url,
            'bank_name',           sp.bank_name,
            'bank_account_number', sp.bank_account_number,
            'bank_account_name',   sp.bank_account_name,
            'whatsapp_number',     sp.whatsapp_number
          )
          from public.modul_store_profiles sp
          where sp.store_id = l.store_id
        )
      )
      from public.modul_store_listings l
      where l.listing_id = o.listing_id
    )
  )
  from public.modul_store_orders o
  where o.order_id = p_order_id
$fn$;

-- 7. RPC lacak order berdasarkan email + nomor invoice
create or replace function public.track_store_order(p_email text, p_invoice_number text)
returns table (
  order_id       uuid,
  invoice_number text,
  status         text,
  total_amount   numeric,
  created_at     timestamptz
)
language sql
security definer
set search_path = public
stable
as $fn$
  select o.order_id, o.invoice_number, o.status, o.total_amount, o.created_at
  from public.modul_store_orders o
  where p_email is not null
    and p_invoice_number is not null
    and lower(o.buyer_email) = lower(trim(p_email))
    and o.invoice_number ilike ('%' || trim(p_invoice_number) || '%')
  limit 5
$fn$;

-- 8. RPC upload bukti bayar — pengganti UPDATE USING (true).
--    Hanya bisa mengubah payment_proof_url + status PENDING_PAYMENT -> PENDING_REVIEW,
--    dan hanya jika email pembeli cocok. Tidak bisa mengubah nominal.
create or replace function public.submit_payment_proof(
  p_order_id  uuid,
  p_email     text,
  p_proof_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.modul_store_orders;
begin
  update public.modul_store_orders
     set payment_proof_url = p_proof_url,
         uploaded_at       = now(),
         status            = 'PENDING_REVIEW',
         updated_at        = now()
   where order_id = p_order_id
     and lower(buyer_email) = lower(trim(p_email))
     and status = 'PENDING_PAYMENT'
  returning * into v_order;

  if v_order.order_id is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'Order tidak ditemukan, email tidak cocok, atau status bukan PENDING_PAYMENT'
    );
  end if;

  return jsonb_build_object('ok', true, 'order', to_jsonb(v_order));
end;
$fn$;

-- 9. Hak eksekusi RPC untuk anon & user login
revoke all on function public.get_store_order_by_id(uuid)           from public;
revoke all on function public.track_store_order(text, text)         from public;
revoke all on function public.submit_payment_proof(uuid, text, text) from public;

grant execute on function public.get_store_order_by_id(uuid)           to anon, authenticated;
grant execute on function public.track_store_order(text, text)         to anon, authenticated;
grant execute on function public.submit_payment_proof(uuid, text, text) to anon, authenticated;

commit;
