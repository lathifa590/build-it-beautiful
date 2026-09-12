import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { Store, ShoppingBag, FileText, ArrowLeft } from 'lucide-react';

const StoreProfilePage = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['publicStoreProfile', storeSlug],
    queryFn: () => storeApi.getStoreProfile(storeSlug as string),
    enabled: !!storeSlug,
  });

  const { data: listings, isLoading: isListingsLoading } = useQuery({
    queryKey: ['publicStoreListings', profile?.store_id],
    queryFn: () => storeApi.getStoreListings(profile!.store_id, true),
    enabled: !!profile?.store_id,
  });

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0e8] p-4 text-center">
        <div className="w-20 h-20 bg-white border-2 border-[#111] rounded-full flex items-center justify-center mb-4">
          <Store className="w-10 h-10 text-[#111]" />
        </div>
        <h1 className="text-2xl font-black text-[#111] mb-2">Toko Tidak Ditemukan</h1>
        <p className="text-gray-500 font-semibold mb-6">Toko yang Anda cari tidak ada atau belum aktif.</p>
        <button onClick={() => navigate('/store')} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Jelajah
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Navbar / Header Simple */}
      <div className="bg-white border-b-2 border-[#111] sticky top-0 z-20">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/store')}>
            <Store className="w-5 h-5 md:w-6 md:h-6 text-[#111]" />
            <span className="font-black text-base md:text-lg text-[#111]">ModulAjar Store</span>
          </div>
        </div>
      </div>

      {/* Banner & Profile Info */}
      <div className="bg-white border-b-2 border-[#111]">
        {/* Banner */}
        <div className="h-32 md:h-48 w-full bg-[#f5f0e8] relative overflow-hidden">
          {profile.banner_desktop_url ? (
            <img src={profile.banner_desktop_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Store className="w-16 h-16 md:w-24 md:h-24 text-[#111]" />
            </div>
          )}
        </div>

        {/* Profile Info Container */}
        <div className="container mx-auto px-4 sm:px-6 relative pb-6">
          <div className="flex flex-row items-end gap-4 md:gap-6 -mt-10 md:-mt-14">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl border-4 border-white bg-[#f5f0e8] overflow-hidden shrink-0 shadow-[0_4px_0_0_rgba(17,17,17,1)] relative z-10">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.store_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-8 h-8 md:w-12 md:h-12 text-[#111] opacity-50" />
                </div>
              )}
            </div>
            
            {/* Text Info */}
            <div className="flex-1 pb-1 md:pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-[#111] leading-tight">{profile.store_name}</h1>
              {profile.tagline && <p className="text-xs md:text-base text-gray-600 font-semibold mt-0.5 md:mt-1">{profile.tagline}</p>}
            </div>
          </div>
          {profile.description && <p className="text-sm md:text-base text-gray-600 font-medium mt-4 max-w-3xl leading-relaxed">{profile.description}</p>}
        </div>
      </div>

      {/* Katalog Produk */}
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-6 h-6 text-[#111]" />
          <h2 className="text-xl md:text-2xl font-black text-[#111]">Katalog Modul Ajar</h2>
        </div>

        {isListingsLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="store-catalog-grid">
            {listings.map(item => (
              <div 
                key={item.listing_id} 
                className="store-product-card"
                onClick={() => navigate(`/store/item/${item.listing_id}`)}
              >
                <div className="store-product-card__thumb">
                  {item.preview_image_url ? (
                    <img src={item.preview_image_url} alt={item.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#f5f0e8]">
                      <FileText className="w-12 h-12 text-[#111] opacity-20" />
                    </div>
                  )}
                  {item.category && (
                     <span className="store-product-card__jenjang-badge">
                       {item.category}
                     </span>
                  )}
                </div>
                <div className="store-product-card__info">
                  <h4 className="store-product-card__title">{item.title}</h4>
                  <div className="store-product-card__price">
                    {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 md:p-16 text-center bg-white flex flex-col items-center">
            <div className="w-20 h-20 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <ShoppingBag className="w-10 h-10 text-[#111]" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#111] mb-2">Belum ada modul ajar</h3>
            <p className="text-sm md:text-base text-gray-500 font-medium">Toko ini belum menerbitkan modul ajar apapun.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProfilePage;
