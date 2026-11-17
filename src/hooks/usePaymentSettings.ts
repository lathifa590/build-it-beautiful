import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '@/types/orders';
import { toast } from 'sonner';

const PAYMENT_SETTINGS_KEY = 'app_payment_settings';

export function usePaymentSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PAYMENT_SETTINGS_KEY],
    queryFn: async (): Promise<PaymentSettings> => {
      try {
        const { data, error } = await supabase
          .from('payment_settings' as any)
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Could not fetch remote payment_settings, using fallback:', error.message);
          return DEFAULT_PAYMENT_SETTINGS;
        }

        if (data) {
          return data as PaymentSettings;
        }
      } catch (err) {
        console.warn('Payment settings query exception:', err);
      }
      return DEFAULT_PAYMENT_SETTINGS;
    },
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<PaymentSettings>) => {
      const now = new Date().toISOString();
      const currentId = query.data?.id;

      if (currentId) {
        const { error } = await supabase
          .from('payment_settings' as any)
          .update({
            ...newSettings,
            updated_at: now,
          })
          .eq('id', currentId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_settings' as any)
          .insert({
            ...DEFAULT_PAYMENT_SETTINGS,
            ...newSettings,
            updated_at: now,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYMENT_SETTINGS_KEY] });
      toast.success('Pengaturan rekening & pembayaran berhasil disimpan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan pengaturan rekening');
    },
  });

  return {
    settings: query.data || DEFAULT_PAYMENT_SETTINGS,
    isLoading: query.isLoading,
    refetch: query.refetch,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
