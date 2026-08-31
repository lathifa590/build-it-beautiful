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
    return <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">Memuat Toko...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0e8] p-4 text-center">
        <Store className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-black text-[#111] mb-2">Toko Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-6">Toko yang Anda cari tidak ada atau belum aktif.</p>
        <button onClick={() => navigate('/store')} className="btn-secondary flex items-center gap-2">
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
            <span className="font-black text-base md:text-lg">ModulAjar Store</span>
          </div>
        </div>
      </div>

      {/* Banner & Profile Info */}
      <div className="bg-white border-b-2 border-[#111]">
        {/* Banner */}
        <div className="h-32 md:h-48 w-full bg-gray-200 relative overflow-hidden">
          {profile.banner_desktop_url ? (
            <img src={profile.banner_desktop_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#111] opacity-5 flex items-center justify-center">
              <Store className="w-16 h-16 md:w-24 md:h-24" />
            </div>
          )}
        </div>

        {/* Profile Info Container */}
        <div className="container mx-auto px-4 sm:px-6 relative pb-6">
          <div className="flex flex-row items-end gap-3 md:gap-6 -mt-10 md:-mt-14">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl border-4 border-white bg-white overflow-hidden shadow-sm shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.store_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Store className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Text Info */}
            <div className="flex-1 pb-1 md:pb-2">
              <h1 className="text-xl md:text-3xl font-black text-[#111] leading-tight">{profile.store_name}</h1>
              {profile.tagline && <p className="text-xs md:text-base text-gray-600 font-semibold mt-0.5 md:mt-1">{profile.tagline}</p>}
            </div>
          </div>
          {profile.description && <p className="text-xs md:text-sm text-gray-500 mt-4 max-w-3xl">{profile.description}</p>}
        </div>
      </div>

      {/* Katalog Produk */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-[#111]" />
          <h2 className="text-xl md:text-2xl font-black text-[#111]">Katalog Modul Ajar</h2>
        </div>

        {isListingsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[3/4] md:h-64 bg-gray-200 animate-pulse rounded-lg border-2 border-[#111]"></div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {listings.map(item => (
              <div 
                key={item.listing_id} 
                className="card overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 transition-transform border border-[#111] md:border-2"
                onClick={() => navigate(`/store/item/${item.listing_id}`)}
              >
                <div className="aspect-[4/3] bg-[#f5f0e8] border-b border-[#111] md:border-b-2 flex items-center justify-center text-center relative overflow-hidden">
                  {item.preview_image_url ? (
                    <img src={item.preview_image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 md:w-12 md:h-12 text-[#111] opacity-20" />
                  )}
                  {item.category && (
                     <span className="absolute top-1 left-1 md:top-2 md:left-2 bg-white text-[#111] border border-[#111] md:border-2 text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded">
                       {item.category}
                     </span>
                  )}
                </div>
                <div className="card-body p-2 md:p-4 flex-1 flex flex-col bg-white">
                  <h4 className="font-bold text-xs md:text-lg leading-tight mb-1.5 md:mb-3 line-clamp-2">{item.title}</h4>
                  <div className="mt-auto">
                    <div className="text-sm md:text-xl font-black text-[#c04a1a]">
                      {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 md:p-12 text-center bg-white">
            <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
            <h3 className="text-lg md:text-xl font-bold mb-2">Belum ada modul ajar</h3>
            <p className="text-sm md:text-base text-gray-500">Toko ini belum menerbitkan modul ajar apapun.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProfilePage;
