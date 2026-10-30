import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeApi } from './store-api';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('storeApi must-fix checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects expired and not-yet-started coupons in validateCoupon', async () => {
    const mockMaybeSingle = vi.fn();
    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: mockMaybeSingle }),
          }),
        }),
      }),
    });

    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        coupon_id: 'c1',
        code: 'EXPIRED',
        status: 'ACTIVE',
        expires_at: new Date(Date.now() - 60_000).toISOString(),
        usage_limit: 0,
        min_purchase: 0,
      },
      error: null,
    });
    const expRes = await storeApi.validateCoupon('s1', 'EXPIRED');
    expect(expRes.valid).toBe(false);
    expect(expRes.message).toMatch(/kedaluwarsa/i);

    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        coupon_id: 'c2',
        code: 'FUTURE',
        status: 'ACTIVE',
        starts_at: new Date(Date.now() + 60_000).toISOString(),
        usage_limit: 0,
        min_purchase: 0,
      },
      error: null,
    });
    const futRes = await storeApi.validateCoupon('s1', 'FUTURE');
    expect(futRes.valid).toBe(false);
    expect(futRes.message).toMatch(/belum mulai/i);
  });

  it('uses create_store_order RPC in createOrder so anonymous and free orders succeed', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: { order_id: 'ord-1', invoice_number: 'INV-1', status: 'SELESAI', total_amount: 0 },
      error: null,
    });

    const res = await storeApi.createOrder({
      invoice_number: 'INV-1',
      store_id: 's1',
      listing_id: 'l1',
      buyer_email: 'anon@example.com',
      buyer_name: 'Anon',
      total_amount: 0,
      coupon_code_used: 'FREE100',
      status: 'SELESAI',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('create_store_order', expect.objectContaining({
      p_invoice_number: 'INV-1',
      p_coupon_code_used: 'FREE100',
      p_status: 'SELESAI',
    }));
    expect(res?.order_id).toBe('ord-1');
  });
});