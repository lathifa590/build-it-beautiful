import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AllowedCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  user_id: string | null;
  account_type: string;
  subscription_expires_at: string | null;
  lynk_purchased_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewCustomerInput {
  email: string;
  name: string;
  phone?: string;
  account_type?: string;
  subscription_expires_at?: string | null;
}

export const useAllowedCustomers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['allowed-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowed_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AllowedCustomer[];
    },
    enabled: !!user,
  });
};

export const useAddAllowedCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: NewCustomerInput) => {
      const accountType = customer.account_type || 'annual';
      let expiresAt = customer.subscription_expires_at ?? null;
      if (accountType === 'annual' && !expiresAt) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        expiresAt = d.toISOString();
      }

      const { error } = await supabase
        .from('allowed_customers')
        .insert({
          email: customer.email.toLowerCase().trim(),
          name: customer.name.trim(),
          phone: customer.phone?.trim() || null,
          account_type: accountType,
          subscription_expires_at: expiresAt,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
    },
  });
};

export const useAddBulkAllowedCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customers: { email: string; name: string; phone?: string }[]) => {
      // Bulk import defaults to annual + 1 year
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      const expiresAt = d.toISOString();

      const formattedCustomers = customers.map((c) => ({
        email: c.email.toLowerCase().trim(),
        name: c.name.trim(),
        phone: c.phone?.trim() || null,
        account_type: 'annual',
        subscription_expires_at: expiresAt,
      }));

      const { error } = await supabase
        .from('allowed_customers')
        .upsert(formattedCustomers, {
          onConflict: 'email',
          ignoreDuplicates: true,
        });

      if (error) throw error;
      return { inserted: formattedCustomers.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
    },
  });
};

export const useDeleteAllowedCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('allowed_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
    },
  });
};

export const useUpdateAllowedCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      account_type?: string;
      subscription_expires_at?: string | null;
      name?: string;
      phone?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase
        .from('allowed_customers')
        .update(patch as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
    },
  });
};

export const useExtendSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; currentExpiresAt: string | null; years?: number }) => {
      const { id, currentExpiresAt, years = 1 } = input;
      const base = currentExpiresAt && new Date(currentExpiresAt) > new Date()
        ? new Date(currentExpiresAt)
        : new Date();
      base.setFullYear(base.getFullYear() + years);
      const { error } = await supabase
        .from('allowed_customers')
        .update({ subscription_expires_at: base.toISOString(), account_type: 'annual' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
    },
  });
};

// Check if an email exists in allowed_customers (public check for login flow)
export const checkAllowedEmail = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('allowed_customers')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error('Error checking allowed email:', error);
    return false;
  }

  return !!data;
};
