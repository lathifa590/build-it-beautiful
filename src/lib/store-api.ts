import { supabase } from "@/integrations/supabase/client";
import { 
  StoreProfile, 
  StoreListing, 
  StoreOrder, 
  StoreCoupon,
  StoreMetricRow
} from "@/types/store";
import { logSecurityEvent } from "@/lib/security-logger";

export const storeApi = {
  // --- Profiles ---
  async getStoreProfile(storeSlug: string): Promise<StoreProfile | null> {
    const { data, error } = await supabase
      .from('modul_store_profiles')
      .select('*')
      .eq('store_slug', storeSlug)
      .eq('status', 'ACTIVE')
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching store profile:', error);
      return null;
    }
    return data as StoreProfile;
  },

  async getMyStoreProfile(userId: string): Promise<StoreProfile | null> {
    const { data, error } = await supabase
      .from('modul_store_profiles')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching my store profile:', error);
      return null;
    }
    return data as StoreProfile;
  },

  async upsertStoreProfile(profile: Partial<StoreProfile>): Promise<StoreProfile | null> {
    const { data, error } = await supabase
      .from('modul_store_profiles')
      .upsert(profile, { onConflict: 'owner_user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting store profile:', error);
      throw error;
    }
    return data as StoreProfile;
  },

  // --- Listings ---
  async getPublicListings(category?: string): Promise<StoreListing[]> {
    let query = supabase
      .from('modul_store_listings')
      .select('*, store_profile:modul_store_profiles!inner(*)')
      .eq('status', 'PUBLISHED')
      .eq('show_in_global_marketplace', true)
      .eq('modul_store_profiles.status', 'ACTIVE');
      
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching public listings:', error);
      return [];
    }
    return data as StoreListing[];
  },

  async getStoreListings(storeId: string, onlyPublished = true): Promise<StoreListing[]> {
    let query = supabase
      .from('modul_store_listings')
      .select('*')
      .eq('store_id', storeId);
      
    if (onlyPublished) {
      query = query.eq('status', 'PUBLISHED');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store listings:', error);
      return [];
    }
    return data as StoreListing[];
  },
  
  async getListingDetails(listingId: string): Promise<StoreListing | null> {
    const { data, error } = await supabase
      .from('modul_store_listings')
      .select('*, store_profile:modul_store_profiles(*)')
      .eq('listing_id', listingId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching listing details:', error);
      return null;
    }
    return data as StoreListing;
  },

  async upsertListing(listing: Partial<StoreListing>): Promise<StoreListing | null> {
    const { data, error } = await supabase
      .from('modul_store_listings')
      .upsert(listing, { onConflict: 'listing_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting listing:', error);
      throw error;
    }
    return data as StoreListing;
  },

  async deleteListing(listingId: string): Promise<boolean> {
    const { error } = await supabase
      .from('modul_store_listings')
      .delete()
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
    return true;
  },

  // --- Orders ---
  async createOrder(order: Omit<StoreOrder, 'order_id' | 'created_at' | 'updated_at'>): Promise<StoreOrder | null> {
    const { data, error } = await supabase
      .from('modul_store_orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }
    return data as StoreOrder;
  },

  async getMyStoreOrders(storeId: string): Promise<StoreOrder[]> {
    const { data, error } = await supabase
      .from('modul_store_orders')
      .select('*, listing:modul_store_listings(title)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store orders:', error);
      return [];
    }
    return data as StoreOrder[];
  },

  async getOrder(orderId: string): Promise<StoreOrder | null> {
    const { data, error } = await supabase
      .from('modul_store_orders')
      .select('*, listing:modul_store_listings(*, store_profile:modul_store_profiles(*))')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!error && data) {
      return data as StoreOrder;
    }

    // Secure fallback via RPC for anonymous buyers
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_store_order_by_id', {
        p_order_id: orderId,
      });
      if (!rpcError && rpcData) {
        return rpcData as StoreOrder;
      }
    } catch (e) {
      console.error('Error fetching order via RPC:', e);
    }

    if (error) {
      console.error('Error fetching order:', error);
    }
    return null;
  },

  async updateOrderStatus(orderId: string, updates: Partial<StoreOrder>): Promise<StoreOrder | null> {
    const { data, error } = await supabase
      .from('modul_store_orders')
      .update(updates)
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
    return data as StoreOrder;
  },

  // --- Coupons ---
  async getStoreCoupons(storeId: string): Promise<StoreCoupon[]> {
    const { data, error } = await supabase
      .from('modul_store_coupons')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store coupons:', error);
      return [];
    }
    return data as StoreCoupon[];
  },

  async validateCoupon(
    storeId: string, 
    code: string, 
    listingId?: string, 
    purchaseAmount?: number
  ): Promise<{ valid: boolean; coupon?: StoreCoupon; message?: string }> {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('modul_store_coupons')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', cleanCode)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error || !data) {
      return { valid: false, message: 'Kode kupon tidak ditemukan atau tidak aktif' };
    }

    const coupon = data as StoreCoupon;

    // Check usage limit
    if (coupon.usage_limit > 0 && (coupon.used_count || 0) >= coupon.usage_limit) {
      return { valid: false, message: 'Kupon ini sudah mencapai batas pemakaian maksimal' };
    }

    // Check minimum purchase
    if (purchaseAmount !== undefined && coupon.min_purchase > 0 && purchaseAmount < coupon.min_purchase) {
      return { 
        valid: false, 
        message: `Minimum pembelian untuk kupon ini adalah Rp${coupon.min_purchase.toLocaleString('id-ID')}` 
      };
    }

    // Check product scope (if coupon is specific to certain listings)
    if (coupon.scope_type === 'SPECIFIC' && listingId) {
      const allowedIds = Array.isArray(coupon.applicable_listing_ids) ? coupon.applicable_listing_ids : [];
      if (!allowedIds.includes(listingId)) {
        return { 
          valid: false, 
          message: 'Kupon ini tidak berlaku untuk modul ajar yang dipilih' 
        };
      }
    }

    return { valid: true, coupon };
  },
  
  async upsertCoupon(coupon: Partial<StoreCoupon>): Promise<StoreCoupon | null> {
    const { data, error } = await supabase
      .from('modul_store_coupons')
      .upsert(coupon, { onConflict: 'coupon_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting coupon:', error);
      throw error;
    }
    return data as StoreCoupon;
  },

  async deleteCoupon(couponId: string): Promise<boolean> {
    const { error } = await supabase
      .from('modul_store_coupons')
      .delete()
      .eq('coupon_id', couponId);

    if (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
    return true;
  },

  async incrementCouponUsage(couponId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('modul_store_coupons')
        .select('used_count')
        .eq('coupon_id', couponId)
        .single();
      
      if (data) {
        await supabase
          .from('modul_store_coupons')
          .update({ used_count: (data.used_count || 0) + 1 })
          .eq('coupon_id', couponId);
      }
    } catch (err) {
      console.error('Error incrementing coupon usage:', err);
    }
  },

  // --- Storage & Files ---
  async uploadStoreAsset(filePath: string, file: File): Promise<string | null> {
    const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

    // OWASP A08: Validate MIME type
    if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
      logSecurityEvent({
        eventType: 'FILE_UPLOAD_REJECTED',
        details: { reason: 'Invalid MIME type', type: file.type, name: file.name },
      });
      throw new Error('Format file tidak didukung. Harap unggah gambar JPG, PNG, WEBP, atau GIF.');
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      logSecurityEvent({
        eventType: 'FILE_UPLOAD_REJECTED',
        details: { reason: 'File size exceeded limit', size: file.size, limit: MAX_IMAGE_SIZE },
      });
      throw new Error('Ukuran file maksimal 5 MB.');
    }

    // Sanitize path (prevent path traversal)
    const safePath = filePath.replace(/(\.\.[\/\\])+/g, '').replace(/[^a-zA-Z0-9_\-./]/g, '_');

    const { data, error } = await supabase.storage
      .from('modul_store_assets')
      .upload(safePath, file, { upsert: true, contentType: file.type });
      
    if (error) {
      console.error('Error uploading store asset:', error);
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('modul_store_assets')
      .getPublicUrl(data.path);
      
    return publicUrl;
  },

  async uploadStoreFile(filePath: string, file: File | Blob): Promise<string | null> {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    if (file.size > MAX_FILE_SIZE) {
      logSecurityEvent({
        eventType: 'FILE_UPLOAD_REJECTED',
        details: { reason: 'Document file size exceeded limit', size: file.size, limit: MAX_FILE_SIZE },
      });
      throw new Error('Ukuran file dokumen maksimal 50 MB.');
    }

    const safePath = filePath.replace(/(\.\.[\/\\])+/g, '').replace(/[^a-zA-Z0-9_\-./]/g, '_');

    const { data, error } = await supabase.storage
      .from('modul_store_files')
      .upload(safePath, file, { upsert: true });
      
    if (error) {
      console.error('Error uploading store file:', error);
      throw error;
    }
    
    return data.path;
  },
  
  // --- Metrics ---
  /**
   * Mengambil baris metrik harian toko (kunjungan, views produk, pesanan, pendapatan)
   * untuk diagregasi di dashboard & kartu katalog.
   */
  async getStoreMetrics(storeId: string): Promise<StoreMetricRow[]> {
    const { data, error } = await supabase
      .from('modul_store_metrics' as any)
      .select('date, listing_id, store_views, product_views, checkout_started, orders_completed, revenue_amount')
      .eq('store_id', storeId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching store metrics:', error);
      return [];
    }
    return (data as unknown as StoreMetricRow[]) || [];
  },

  async incrementStoreMetric(storeId: string, listingId: string | null, metricType: 'views' | 'clicks'): Promise<void> {
    if (metricType === 'views') {
      await this.recordStoreVisit(storeId);
    } else {
      if (listingId) {
        await this.recordProductView(storeId, listingId);
      }
    }
  },

  /**
   * Mencatat kunjungan toko (store_views) secara aman melalui Edge Function
   */
  async recordStoreVisit(storeId: string): Promise<void> {
    try {
      await supabase.functions.invoke('record-store-metric', {
        body: { store_id: storeId, type: 'store_view' }
      });
    } catch (err) {
      console.warn('Failed to record store visit:', err);
    }
  },

  /**
   * Mencatat interaksi modul dilihat (product_views) secara aman melalui Edge Function
   */
  async recordProductView(storeId: string, listingId: string): Promise<void> {
    try {
      await supabase.functions.invoke('record-store-metric', {
        body: { store_id: storeId, listing_id: listingId, type: 'product_view' }
      });
    } catch (err) {
      console.warn('Failed to record product view:', err);
    }
  }
};

