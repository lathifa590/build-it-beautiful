import { supabase } from "@/integrations/supabase/client";
import { 
  StoreProfile, 
  StoreListing, 
  StoreOrder, 
  StoreCoupon,
  StoreMetrics
} from "@/types/store";

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
      .select('*, store_profile:modul_store_profiles(*)')
      .eq('status', 'PUBLISHED');
      
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

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }
    return data as StoreOrder;
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

  async validateCoupon(storeId: string, code: string): Promise<StoreCoupon | null> {
    const { data, error } = await supabase
      .from('modul_store_coupons')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', code.toUpperCase())
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      console.error('Error validating coupon:', error);
      return null;
    }
    return data as StoreCoupon;
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

  // --- Storage & Files ---
  async uploadStoreAsset(filePath: string, file: File): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('modul_store_assets')
      .upload(filePath, file, { upsert: true });
      
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
    const { data, error } = await supabase.storage
      .from('modul_store_files')
      .upload(filePath, file, { upsert: true });
      
    if (error) {
      console.error('Error uploading store file:', error);
      throw error;
    }
    
    return data.path;
  },
  
  // --- Metrics ---
  async incrementStoreMetric(storeId: string, listingId: string | null, metricType: 'views' | 'clicks'): Promise<void> {
    const { error } = await supabase.rpc('increment_store_metric', {
      p_store_id: storeId,
      p_listing_id: listingId,
      p_metric_type: metricType
    });
    
    if (error) {
      console.error(`Error incrementing ${metricType}:`, error);
    }
  }
};

