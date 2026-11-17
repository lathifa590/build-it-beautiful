import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus, PackageType, PACKAGES_CONFIG } from '@/types/orders';
import { incrementCouponUsage } from '@/hooks/useCoupons';
import { CustomerActivationInfo } from '@/components/admin/ActivationMessageModal';
import { toast } from 'sonner';

export const ORDERS_QUERY_KEY = 'admin-orders';

/**
 * Generate invoice string: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${randomStr}`;
}

/**
 * Generate 3-digit unique code for bank transfer reconciliation (100 - 999)
 */
export function generateUniqueCode(): number {
  return Math.floor(100 + Math.random() * 899);
}

/**
 * Calculate expiry date based on package type and optional existing expiry date
 */
export function calculateSubscriptionExpiry(packageType: string, existingExpiry?: string | null): string {
  const normalizedType = packageType.toLowerCase();
  const isLite = normalizedType === 'lite';
  const monthsToAdd = isLite ? 6 : 12;

  const baseDate = existingExpiry && new Date(existingExpiry) > new Date()
    ? new Date(existingExpiry)
    : new Date();

  baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
  return baseDate.toISOString();
}

/**
 * Normalize account_type string for allowed_customers
 */
export function normalizeAccountType(packageType: string): 'lite' | 'annual' | 'pro_annual' {
  const p = packageType.toLowerCase();
  if (p === 'lite') return 'lite';
  if (p === 'pro' || p === 'pro_annual') return 'pro_annual';
  return 'annual';
}

/**
 * Find user_id by email from profiles table if registered
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (data?.id) return data.id;
  } catch (err) {
    console.warn('Could not find user in profiles:', err);
  }
  return null;
}

/**
 * Automatically activate or update customer in allowed_customers upon order approval
 */
export async function autoActivateCustomerFromOrder(order: Order): Promise<CustomerActivationInfo> {
  const cleanEmail = order.buyer_email.toLowerCase().trim();
  const cleanName = order.buyer_name?.trim() || 'Pelanggan';
  const cleanPhone = order.buyer_whatsapp?.trim() || null;
  const accountType = normalizeAccountType(order.package_type);

  // 1. Check existing customer record in allowed_customers
  const { data: existingCustomer, error: fetchErr } = await supabase
    .from('allowed_customers')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    console.warn('Error checking allowed_customers:', fetchErr);
  }

  const newExpiry = calculateSubscriptionExpiry(
    order.package_type,
    existingCustomer?.subscription_expires_at
  );

  // 2. Lookup user_id if already registered in profiles
  const matchedUserId = order.user_id || await findUserIdByEmail(cleanEmail);

  let customerId = existingCustomer?.id;

  if (existingCustomer) {
    // Update existing customer record
    const updatePayload: Record<string, any> = {
      account_type: accountType,
      subscription_expires_at: newExpiry,
      name: cleanName || existingCustomer.name,
      updated_at: new Date().toISOString(),
    };
    if (cleanPhone && !existingCustomer.phone) {
      updatePayload.phone = cleanPhone;
    }
    if (matchedUserId && !existingCustomer.user_id) {
      updatePayload.user_id = matchedUserId;
      updatePayload.is_claimed = true;
      updatePayload.claimed_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from('allowed_customers')
      .update(updatePayload)
      .eq('id', existingCustomer.id);

    if (updateErr) {
      throw new Error(`Gagal memperbarui status pelanggan: ${updateErr.message}`);
    }
  } else {
    // Insert new customer record
    const insertPayload: Record<string, any> = {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      account_type: accountType,
      subscription_expires_at: newExpiry,
      is_claimed: !!matchedUserId,
      claimed_at: matchedUserId ? new Date().toISOString() : null,
      user_id: matchedUserId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('allowed_customers')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertErr) {
      throw new Error(`Gagal mendaftarkan pelanggan di allowed_customers: ${insertErr.message}`);
    }
    customerId = inserted?.id;
  }

  return {
    id: customerId,
    email: cleanEmail,
    name: cleanName,
    phone: cleanPhone || existingCustomer?.phone || null,
    account_type: accountType,
    subscription_expires_at: newExpiry,
  };
}

export function useOrders(statusFilter?: string, searchKeyword?: string) {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: [ORDERS_QUERY_KEY, statusFilter, searchKeyword],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('orders' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Orders query error:', error.message);
        return [];
      }

      let list = (data || []) as Order[];

      if (searchKeyword && searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        list = list.filter(
          (o) =>
            o.invoice?.toLowerCase().includes(q) ||
            o.buyer_name?.toLowerCase().includes(q) ||
            o.buyer_email?.toLowerCase().includes(q) ||
            o.buyer_whatsapp?.includes(q) ||
            o.item_title?.toLowerCase().includes(q)
        );
      }

      return list;
    },
    staleTime: 10 * 1000,
  });

  // Approve Order with Automatic Customer Activation
  const approveMutation = useMutation({
    mutationFn: async (order: Order): Promise<{ order: Order; activationInfo: CustomerActivationInfo }> => {
      const now = new Date().toISOString();

      // 1. Auto-activate customer in allowed_customers
      const activationInfo = await autoActivateCustomerFromOrder(order);

      // 2. Update order status to 'paid'
      const updatePayload: Record<string, any> = {
        status: 'paid',
        paid_at: now,
        updated_at: now,
      };

      const matchedUserId = order.user_id || await findUserIdByEmail(order.buyer_email);
      if (matchedUserId) {
        updatePayload.user_id = matchedUserId;
      }

      const { error: orderUpdateErr } = await supabase
        .from('orders' as any)
        .update(updatePayload)
        .eq('id', order.id);

      if (orderUpdateErr) {
        throw new Error(`Gagal memperbarui status pesanan: ${orderUpdateErr.message}`);
      }

      return {
        order: { ...order, status: 'paid', paid_at: now, user_id: matchedUserId || order.user_id },
        activationInfo,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Pesanan #${data.order.invoice} disetujui! Email ${data.order.buyer_email} otomatis aktif.`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyetujui pesanan');
    },
  });

  // Cancel Order
  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('orders' as any)
        .update({ status: 'cancelled', updated_at: now })
        .eq('id', orderId);

      if (error) throw error;
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      toast.info('Pesanan telah dibatalkan');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal membatalkan pesanan');
    },
  });

  // Delete Order
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders' as any)
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      toast.success('Pesanan berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus pesanan');
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    refetch: ordersQuery.refetch,
    approveOrder: approveMutation.mutate,
    approveOrderAsync: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    cancelOrder: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    deleteOrder: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: {
      buyer_name: string;
      buyer_email: string;
      buyer_whatsapp: string;
      package_type: PackageType;
      item_title: string;
      original_price: number;
      price: number;
      discount_amount: number;
      coupon_code?: string | null;
      unique_code: number;
      total_amount: number;
      notes?: string | null;
      affiliate_code?: string | null;
      user_id?: string | null;
    }): Promise<Order> => {
      const invoice = generateInvoiceCode();
      const now = new Date().toISOString();

      const newOrder = {
        invoice,
        user_id: orderData.user_id || null,
        buyer_name: orderData.buyer_name.trim(),
        buyer_email: orderData.buyer_email.toLowerCase().trim(),
        buyer_whatsapp: orderData.buyer_whatsapp.trim(),
        package_type: orderData.package_type,
        item_title: orderData.item_title,
        original_price: orderData.original_price,
        price: orderData.price,
        discount_amount: orderData.discount_amount,
        coupon_code: orderData.coupon_code?.trim() || null,
        unique_code: orderData.unique_code,
        total_amount: orderData.total_amount,
        payment_method: 'manual_transfer',
        status: 'pending',
        notes: orderData.notes?.trim() || null,
        affiliate_code: orderData.affiliate_code || null,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('orders' as any)
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal membuat pesanan: ${error.message}`);
      }

      // Increment coupon usage if coupon applied
      if (orderData.coupon_code) {
        await incrementCouponUsage(orderData.coupon_code);
      }

      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memproses pesanan');
    },
  });
}
