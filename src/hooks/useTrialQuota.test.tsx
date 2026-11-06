import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTrialQuota,
  TRIAL_DAILY_CONTENT_LIMIT,
} from '@/hooks/useTrialQuota';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useSubscriptionStatus', () => ({
  useSubscriptionStatus: vi.fn(),
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

describe('Prioritas 2: Pembatasan Kuota & Access Guard (useTrialQuota)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Validasi Batas Konstanta Kuota', () => {
    it('memastikan batas harian trial tepat 50 (bukan 100)', () => {
      expect(TRIAL_DAILY_CONTENT_LIMIT).toBe(50);
    });
  });

  describe('2. Perilaku Akun Pro / Berbayar (Access Guard)', () => {
    it('mengabaikan penghitungan kuota jika akun bukan trial (isTrial=false)', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'pro-user-123', email: 'pro@guru.id' },
        isAdmin: false,
      } as any);

      vi.mocked(useSubscriptionStatus).mockReturnValue({
        data: {
          accountType: 'pro_annual',
          isTrial: false,
          isPro: true,
          isLifetime: false,
          isAnnual: true,
          isLite: false,
          isExpired: false,
          isExpiringSoon: false,
          isCritical: false,
          daysLeft: 300,
          expiresAt: '2027-01-01',
        },
      } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isTrial).toBe(false);
      // Query tidak aktif untuk non-trial
      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.current.quotaInfo).toBeNull();
    });
  });

  describe('3. Perhitungan Sisa Kuota Akun Trial (Total 50 Selamanya)', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'trial-user-456', email: 'trial@guru.id' },
        isAdmin: false,
      } as any);

      vi.mocked(useSubscriptionStatus).mockReturnValue({
        data: {
          accountType: 'trial',
          isTrial: true,
          isPro: false,
          isLifetime: false,
          isAnnual: false,
          isLite: false,
          isExpired: false,
          isExpiringSoon: false,
          isCritical: false,
          daysLeft: null,
          expiresAt: null,
        },
      } as any);
    });

    it('menghitung sisa kuota 50/50 saat pemakaian total masih 0', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.quotaInfo).toEqual({
        remaining: 50,
        limit: 50,
        isTrial: true,
      });
    });

    it('menghitung sisa kuota dengan benar saat ada penggunaan (misal total 20 generate -> sisa 30)', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 20, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.quotaInfo).toEqual({
        remaining: 30,
        limit: 50,
        isTrial: true,
      });
    });

    it('mengembalikan remaining 0 saat total penggunaan mencapai batas 50', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 50, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.quotaInfo).toEqual({
        remaining: 0,
        limit: 50,
        isTrial: true,
      });
    });

    it('mencegah nilai negatif jika penggunaan melebihi 50 (clamped ke 0)', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 65, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.quotaInfo?.remaining).toBe(0);
    });

    it('memberikan fallback aman 50 jika query database gagal', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: null, error: new Error('Network error') }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.quotaInfo).toEqual({
        remaining: 50,
        limit: 50,
        isTrial: true,
      });
    });
  });

  describe('4. updateQuota & Normalisasi Batas 100 -> 50', () => {
    beforeEach(() => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 10, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
    });

    it('menormalisasi limit 100 dari respons legacy/backend menjadi 50 dan membatasi sisa kuota', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'trial-user-789', email: 'trial2@guru.id' },
        isAdmin: false,
      } as any);

      vi.mocked(useSubscriptionStatus).mockReturnValue({
        data: {
          accountType: 'trial',
          isTrial: true,
          isPro: false,
        },
      } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateQuota({
          limit: 100,
          remaining: 90,
          isTrial: true,
        });
      });

      await waitFor(() => {
        expect(result.current.quotaInfo).toEqual({
          limit: 50,
          remaining: 50, // Math.min(90, 50)
          isTrial: true,
        });
      });
    });

    it('memperbarui remaining kuota saat terjadi generate baru', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'trial-user-789', email: 'trial2@guru.id' },
        isAdmin: false,
      } as any);

      vi.mocked(useSubscriptionStatus).mockReturnValue({
        data: {
          accountType: 'trial',
          isTrial: true,
          isPro: false,
        },
      } as any);

      const { result } = renderHook(() => useTrialQuota(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateQuota({
          limit: 50,
          remaining: 42,
          isTrial: true,
        });
      });

      await waitFor(() => {
        expect(result.current.quotaInfo).toEqual({
          limit: 50,
          remaining: 42,
          isTrial: true,
        });
      });
    });
  });
});
