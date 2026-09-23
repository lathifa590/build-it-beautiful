import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { ShoppingBag, Search, FileText, Filter, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua Kategori' },
  { id: 'SD', label: 'Modul SD' },
  { id: 'SMP', label: 'Modul SMP' },
  { id: 'SMA', label: 'Modul SMA' },
  { id: 'UMUM', label: 'Umum / Lainnya' },
];

const StoreIndex = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const { data: listings, isLoading } = useQuery({
    queryKey: ['globalMarketplaceListings', activeCategory],
    queryFn: () => storeApi.getPublicListings(activeCategory === 'ALL' ? undefined : activeCategory),
  });

  const filteredListings = listings?.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* ══ HERO SECTION ══ */}
      <div className="bg-[#111] text-white pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="container mx-auto relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-bold mb-6">
            <ShoppingBag className="w-4 h-4 text-[#FF7A00]" />
            <span className="text-[#FF7A00]">Global Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Temukan Ribuan Modul Ajar <br className="hidden md:block"/> Terbaik dari Guru-guru Hebat.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
            Beli dan jual modul ajar, RPP, dan perangkat pembelajaran lainnya dengan mudah, aman, dan langsung digunakan.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 rounded-xl border-4 border-transparent focus:border-[#FF7A00] bg-white text-[#111] font-bold text-lg placeholder-gray-400 focus:outline-none transition-colors shadow-2xl"
              placeholder="Cari judul modul ajar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ══ CONTENT SECTION ══ */}
      <div className="container mx-auto px-4 py-12 flex-1">
        
        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full border-2 font-bold text-sm transition-all ${
                activeCategory === cat.id 
                  ? 'bg-[#111] border-[#111] text-white shadow-[4px_4px_0px_0px_rgba(255,122,0,1)]' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-[#111] hover:text-[#111]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#FF7A00]"></div>
          </div>
        ) : filteredListings && filteredListings.length > 0 ? (
          <div className="store-catalog-grid">
            {filteredListings.map(item => (
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
                <div className="store-product-card__info flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="store-product-card__title line-clamp-2" title={item.title}>{item.title}</h4>
                    {item.store_profile && (
                      <p className="text-sm font-semibold text-gray-500 mt-1 flex items-center gap-1">
                        Oleh <span className="text-[#111] hover:underline cursor-pointer" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/store/${item.store_profile?.store_slug}`);
                        }}>{item.store_profile.store_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="store-product-card__price mt-3">
                    {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 md:p-20 text-center bg-white flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-[#f5f0e8] border-4 border-[#111] rounded-3xl flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rotate-3">
              <Search className="w-10 h-10 text-[#111]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[#111] mb-3">Modul Ajar Tidak Ditemukan</h3>
            <p className="text-base md:text-lg text-gray-500 font-medium max-w-md">
              Maaf, kami tidak dapat menemukan modul ajar yang sesuai dengan pencarian Anda saat ini.
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-8 btn-secondary"
              >
                Hapus Pencarian
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* ══ CTA SECTION ══ */}
      <div className="bg-[#FF7A00] text-[#111] py-16 border-t-4 border-[#111]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Punya Modul Ajar Keren?</h2>
          <p className="text-lg font-bold mb-8 opacity-90 max-w-xl mx-auto">
            Bagikan karya Anda ke ribuan guru di seluruh Indonesia. Mulai buka toko Anda secara gratis sekarang!
          </p>
          <button 
            onClick={() => navigate('/app/store-management')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#111] text-white rounded-xl font-black text-lg hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]"
          >
            Buka Toko Sekarang <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreIndex;
