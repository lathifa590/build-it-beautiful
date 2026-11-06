import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Prioritas 2: Access Guard & Status Langganan (useSubscriptionStatus)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Super Admin & Akun Khusus Deploy Terbatas', () => {
    it('memberikan status isPro & isLifetime = true untuk admin', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'admin-1', email: 'admin@modulajar.online' },
        isAdmin: true,
      } as any);

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'trial', subscription_expires_at: null },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isPro).toBe(true);
      expect(result.current.data?.isLifetime).toBe(true);
    });

    it('memberikan status isPro & isLifetime = true untuk akun jagofeed@gmail.com', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'jagofeed-uid', email: 'jagofeed@gmail.com' },
        isAdmin: false,
      } as any);

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'unknown', subscription_expires_at: null },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isPro).toBe(true);
      expect(result.current.data?.isLifetime).toBe(true);
    });
  });

  describe('2. Mapping Tipe Akun (Trial vs Pro vs Lifetime)', () => {
    it('mengidentifikasi akun trial secara akurat', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'trial-u1', email: 'guru@sekolah.id' },
        isAdmin: false,
      } as any);

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'trial', subscription_expires_at: null },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isTrial).toBe(true);
      expect(result.current.data?.isPro).toBe(false);
      expect(result.current.data?.isLifetime).toBe(false);
    });

    it('mengidentifikasi paket pro_annual dengan benar', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'pro-u1', email: 'guru-pro@sekolah.id' },
        isAdmin: false,
      } as any);

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          account_type: 'pro_annual',
          subscription_expires_at: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isPro).toBe(true);
      expect(result.current.data?.isAnnual).toBe(true);
      expect(result.current.data?.isTrial).toBe(false);
      expect(result.current.data?.isExpired).toBe(false);
    });
  });

  describe('3. Deteksi Masa Kedaluwarsa Langganan', () => {
    it('mendeteksi akun kedaluwarsa jika tanggal telah lewat', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'exp-u1', email: 'expired@sekolah.id' },
        isAdmin: false,
      } as any);

      // 5 hari yang lalu
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'annual', subscription_expires_at: pastDate },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isExpired).toBe(true);
      expect(result.current.data?.isCritical).toBe(true);
    });

    it('mendeteksi status kritis jika sisa masa aktif <= 7 hari', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'crit-u1', email: 'crit@sekolah.id' },
        isAdmin: false,
      } as any);

      // 4 hari ke depan
      const nearDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'annual', subscription_expires_at: nearDate },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isCritical).toBe(true);
      expect(result.current.data?.isExpired).toBe(false);
    });

    it('mendeteksi isExpiringSoon jika sisa masa aktif antara 8 sampai 30 hari', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'soon-u1', email: 'soon@sekolah.id' },
        isAdmin: false,
      } as any);

      // 20 hari ke depan
      const soonDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { account_type: 'annual', subscription_expires_at: soonDate },
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
        }),
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isExpiringSoon).toBe(true);
      expect(result.current.data?.isCritical).toBe(false);
      expect(result.current.data?.isExpired).toBe(false);
    });
  });

  describe('4. Fallback Pencarian Berdasarkan Email', () => {
    it('mencari allowed_customers via email jika user_id belum terhubung', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'new-u1', email: 'guru-baru@sekolah.id' },
        isAdmin: false,
      } as any);

      // Panggilan pertama (by user_id) -> null
      // Panggilan kedua (by email) -> data ditemukan
      const mockSelect = vi.fn();
      let callCount = 0;
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve({ data: null });
            return Promise.resolve({
              data: { account_type: 'pro_lifetime', subscription_expires_at: null },
            });
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isPro).toBe(true);
      expect(result.current.data?.isLifetime).toBe(true);
      expect(result.current.data?.isTrial).toBe(false);
    });
  });
});

