-- ==============================================================
-- PERBAIKAN LANJUTAN: akses file berbayar + pembuatan order gratis
--
-- Dua masalah yang ditutup di sini:
--
-- (A) REGRESI dari migrasi 20261120090000_harden_store_orders_rls.sql.
--     Versi get_store_order_by_id di migrasi itu mengembalikan
--     `url_modul_ajar` TANPA syarat status. Versi asli (20261029233500)
--     hanya mengembalikannya kalau order sudah 'SELESAI'. Tanpa gate itu,
--     pembeli yang belum bayar bisa membaca URL file produk.
--     -> dikembalikan ke gate status = 'SELESAI'.
--
-- (B) Order bisa dibuat langsung berstatus 'SELESAI' dengan total_amount 0.
--     Policy INSERT dan RPC create_store_order sama-sama mempercayai
--     p_total_amount / status kiriman client. Padahal policy storage
--     "Buyers can download completed order files" hanya mengecek
--     status = 'SELESAI'. Jadi siapa pun bisa membuat order "selesai"
--     gratis lalu mengunduh file produk berbayar.
--     -> status 'SELESAI' saat pembuatan order hanya diizinkan kalau
--        harga listing-nya memang 0 (produk gratis).
--
-- Cara pakai: Supabase Dashboard -> SQL Editor -> tempel -> Run.
-- Aman dijalankan berulang kali.
-- ==============================================================

begin;

-- ---------- (A) Gate url_modul_ajar ----------
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
        -- INTI PERBAIKAN: URL file hanya untuk order yang sudah selesai
        'url_modul_ajar',      case when o.status = 'SELESAI' then l.url_modul_ajar else null end,
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

-- ---------- (B) INSERT: status SELESAI hanya untuk produk gratis ----------
drop policy if exists "Public can create orders with initial status" on public.modul_store_orders;

create policy "Public can create orders with initial status"
  on public.modul_store_orders
  for insert
  with check (
    status = 'PENDING_PAYMENT'
    or (
      status = 'SELESAI'
      and total_amount = 0
      and exists (
        select 1
        from public.modul_store_listings l
        where l.listing_id = public.modul_store_orders.listing_id
          and l.price_amount = 0
      )
    )
  );

-- ---------- (B2) RPC create_store_order: status ditentukan server ----------
-- Signature dipertahankan supaya pemanggilan dari src/lib/store-api.ts
-- tidak berubah.
create or replace function public.create_store_order(
  p_invoice_number   text,
  p_store_id         uuid,
  p_listing_id       uuid,
  p_buyer_email      text,
  p_buyer_name       text,
  p_buyer_whatsapp   text    default null,
  p_total_amount     integer default 0,
  p_coupon_code_used text    default null,
  p_status           text    default 'PENDING_PAYMENT'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order        public.modul_store_orders;
  v_price_raw    numeric;   -- harga asli dari listing (bisa NULL)
  v_price        numeric;
  v_total        numeric;
  v_safe_status  text;
begin
  -- Harga diambil dari listing, bukan dari client
  select l.price_amount
    into v_price_raw
    from public.modul_store_listings l
   where l.listing_id = p_listing_id;

  v_price := coalesce(v_price_raw, 0);

  -- Nominal tidak boleh melebihi harga listing
  v_total := greatest(0, coalesce(p_total_amount, 0));
  if v_price_raw is not null and v_total > v_price then
    v_total := v_price;
  end if;

  -- Status SELESAI hanya kalau harga listing EKSPLISIT 0.
  -- Harga NULL (belum diisi) TIDAK dianggap gratis.
  -- p_status dari client tidak dipercaya lagi.
  v_safe_status := case when v_price_raw = 0 then 'SELESAI' else 'PENDING_PAYMENT' end;

  insert into public.modul_store_orders (
    invoice_number, store_id, listing_id, buyer_email, buyer_name,
    buyer_whatsapp, total_amount, coupon_code_used, status
  ) values (
    p_invoice_number, p_store_id, p_listing_id, trim(p_buyer_email), trim(p_buyer_name),
    p_buyer_whatsapp, v_total, p_coupon_code_used, v_safe_status
  )
  returning * into v_order;

  if p_coupon_code_used is not null and length(trim(p_coupon_code_used)) > 0 then
    update public.modul_store_coupons
       set used_count = coalesce(used_count, 0) + 1
     where store_id = p_store_id
       and upper(code) = upper(trim(p_coupon_code_used))
       and status = 'ACTIVE';
  end if;

  return to_jsonb(v_order);
end;
$fn$;

revoke all on function public.get_store_order_by_id(uuid) from public;
revoke all on function public.create_store_order(text, uuid, uuid, text, text, text, integer, text, text) from public;

grant execute on function public.get_store_order_by_id(uuid) to anon, authenticated;
grant execute on function public.create_store_order(text, uuid, uuid, text, text, text, integer, text, text) to anon, authenticated;

commit;
