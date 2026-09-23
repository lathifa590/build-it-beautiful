import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { ShoppingBag, Search, FileText, ArrowRight, Menu, X, Filter } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const CATEGORIES = [
  { id: 'ALL', label: 'Semua Kategori' },
  { id: 'SD', label: 'SD / MI' },
  { id: 'SMP', label: 'SMP / MTs' },
  { id: 'SMA', label: 'SMA / SMK' },
  { id: 'UMUM', label: 'Umum / Lainnya' },
];

const CARD_COLORS = ['bg-[#2563eb]', 'bg-[#059669]', 'bg-[#d97706]', 'bg-[#7c3aed]', 'bg-[#0284c7]', 'bg-[#be123c]'];
const ACCENT_COLORS = ['bg-[#1d4ed8]', 'bg-[#047857]', 'bg-[#b45309]', 'bg-[#6d28d9]', 'bg-[#0369a1]', 'bg-[#9f1239]'];

const StoreIndex = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <div className="bg-brand-cream text-brand-dark min-h-screen flex flex-col antialiased">
      <SEOHead 
        title="Global Marketplace Modul Ajar | ModulAjar.Online"
        description="Temukan ribuan modul ajar, RPP, dan perangkat pembelajaran berkualitas dari guru-guru se-Indonesia."
        canonical="/store"
      />

      {/* BEGIN: AnnouncementBar */}
      <aside className="bg-brand-accentYellow border-b-[2.5px] border-brand-dark py-2 px-4 text-xs md:text-sm font-bold tracking-tight text-brand-dark text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="inline-block bg-brand-dark text-brand-cream px-1.5 py-0.5 rounded text-[11px] font-extrabold uppercase">Update 2026/2027</span>
          <span>Marketplace Perangkat Ajar Kurikulum Merdeka Terlengkap</span>
        </div>
      </aside>
      {/* END: AnnouncementBar */}

      {/* BEGIN: MainHeader */}
      <header className="sticky top-0 z-40 bg-white border-b-[2.5px] border-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo ModulAjar Store */}
            <div className="flex items-center gap-3">
              <Link to="/store" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 bg-brand-orange text-white neo-border-sm neo-shadow-sm flex items-center justify-center font-black text-xl rounded-sm">
                  <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight leading-none text-brand-dark">ModulAjar<span className="text-brand-orange">.Store</span></span>
                  <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mt-0.5">Marketplace Guru</span>
                </div>
              </Link>
            </div>

            {/* Search Bar Neobrutalist (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form className="w-full flex items-stretch">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    className="w-full h-11 pl-4 pr-10 text-sm font-semibold bg-brand-surfaceAlt neo-border neo-shadow-sm focus:ring-0 focus:border-brand-dark focus:bg-white placeholder-gray-500 rounded-l-md" 
                    placeholder="Cari modul ajar, fase, kelas, atau mapel..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  </span>
                </div>
                <button type="button" className="h-11 px-5 bg-brand-orange text-white font-bold text-sm neo-border neo-shadow-sm -ml-[2.5px] hover:bg-[#a93e15] active:translate-x-0.5 active:translate-y-0.5 rounded-r-md flex items-center gap-1.5 transition-colors">
                  <span>Cari</span>
                </button>
              </form>
            </div>

            {/* Action Items */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Search Toggle */}
              <button 
                type="button" 
                className="md:hidden h-11 w-11 bg-brand-surfaceAlt text-brand-dark neo-border neo-shadow neo-shadow-hover flex items-center justify-center rounded-md font-bold"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                {isSearchOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Search className="w-5 h-5 stroke-[2.5]" />}
              </button>

              <button onClick={() => navigate('/app/store-management')} className="hidden sm:inline-flex items-center gap-2 h-11 px-4 bg-brand-dark text-white font-bold text-sm neo-border neo-shadow neo-shadow-hover rounded-md">
                Buka Toko
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Expandable */}
          {isSearchOpen && (
            <div className="md:hidden py-3 border-t-[2.5px] border-brand-dark/10">
              <form className="w-full flex items-stretch">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    className="w-full h-11 pl-4 pr-10 text-sm font-semibold bg-brand-surfaceAlt neo-border neo-shadow-sm focus:ring-0 focus:border-brand-dark focus:bg-white placeholder-gray-500 rounded-l-md" 
                    placeholder="Cari modul ajar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="button" className="h-11 px-4 bg-brand-orange text-white font-bold text-sm neo-border neo-shadow-sm -ml-[2.5px] active:translate-x-0.5 active:translate-y-0.5 rounded-r-md flex items-center gap-1.5">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Bottom Navigation Links */}
          <nav className="border-t-[2px] border-brand-dark/20 py-2.5 flex items-center justify-between text-xs md:text-sm font-bold overflow-x-auto gap-4 no-scrollbar">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <a href="#katalog" className="px-3 py-1 bg-brand-dark text-white rounded neo-border-sm neo-shadow-sm font-bold">Semua Kategori</a>
              <a href="#cara-beli" className="px-3 py-1 bg-white hover:bg-brand-cream rounded neo-border-sm font-semibold transition-colors">Cara Pembelian</a>
              <a href="#bantuan" className="px-3 py-1 bg-white hover:bg-brand-cream rounded neo-border-sm font-semibold transition-colors">Pusat Bantuan</a>
            </div>
            <div className="hidden lg:flex items-center gap-1 text-xs font-extrabold text-brand-orange uppercase whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span>
              File Instant Download .DOCX
            </div>
          </nav>
        </div>
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: MainContent */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {/* BEGIN: StoreHeroSection */}
        <section className="mb-10">
          <div className="bg-white neo-border neo-shadow-lg rounded-xl overflow-hidden">
            {/* Top Visual Banner Canvas */}
            <div className="bg-[#111] border-b-[2.5px] border-brand-dark p-6 sm:p-8 lg:p-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              {/* Decorative geometric patterns */}
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-brand-orange neo-border rounded-full opacity-60 pointer-events-none hidden md:block"></div>
              <div className="absolute right-40 -bottom-10 w-28 h-28 bg-[#fec84b] neo-border rotate-12 opacity-80 pointer-events-none hidden lg:block"></div>
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-3 py-1 rounded neo-border-sm text-xs font-extrabold tracking-wide mb-4 uppercase">
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-orange" />
                  <span className="text-brand-orange">Global Marketplace</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-[2px_2px_0px_#111111]">
                  Temukan Ribuan Modul Ajar Terbaik.
                </h1>
                <p className="mt-4 text-sm sm:text-base md:text-lg font-bold text-gray-300 max-w-2xl">
                  Beli dan jual modul ajar, RPP, dan perangkat pembelajaran lainnya dari guru-guru hebat se-Indonesia dengan mudah, aman, dan langsung digunakan.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* END: StoreHeroSection */}

        {/* BEGIN: FilterSection */}
        <section className="mb-8" id="katalog">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-dark text-brand-cream neo-border-sm flex items-center justify-center font-black rounded text-sm neo-shadow-sm">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-dark">Eksplorasi Modul Ajar</h2>
                <p className="text-xs sm:text-sm font-bold text-gray-600">Temukan referensi terbaik untuk kelas Anda</p>
              </div>
            </div>
          </div>

          {/* Phase Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                type="button"
                className={`px-4 py-2 text-xs sm:text-sm font-black rounded-md neo-border neo-shadow-sm whitespace-nowrap transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-brand-orange text-white' 
                    : 'bg-white hover:bg-brand-cream text-brand-dark'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>
        {/* END: FilterSection */}

        {/* BEGIN: ProductGrid */}
        <section className="mb-12">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-dark"></div>
            </div>
          ) : filteredListings && filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item, i) => {
                const colorBg = CARD_COLORS[i % CARD_COLORS.length];
                const colorAccent = ACCENT_COLORS[i % ACCENT_COLORS.length];
                return (
                  <article key={item.listing_id} className="bg-white rounded-xl neo-border neo-shadow neo-shadow-hover flex flex-col overflow-hidden cursor-pointer" onClick={() => navigate(`/store/item/${item.listing_id}`)}>
                    {/* Card Visual Cover Header */}
                    <div className={`relative ${colorBg} p-5 text-white neo-border-sm border-b-[2.5px] border-brand-dark flex flex-col justify-between min-h-[190px] overflow-hidden`}>
                      <div className={`absolute -right-4 -bottom-4 w-28 h-28 ${colorAccent} neo-border rounded-full opacity-60 pointer-events-none`}></div>
                      
                      {item.preview_image_url ? (
                        <div className="absolute inset-0 z-0">
                          <img src={item.preview_image_url} alt={item.title} className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                        </div>
                      ) : null}

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          {item.category && (
                            <span className="bg-brand-dark text-white font-black text-xs px-2 py-0.5 rounded neo-border-sm uppercase">{item.category}</span>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 mt-auto mb-2">
                        <div className="bg-brand-accentYellow text-brand-dark inline-block px-2 py-0.5 text-[10px] font-black rounded neo-border-sm uppercase mb-1">
                          SIAP PAKAI
                        </div>
                        <h3 className="text-xl font-black tracking-tight leading-tight text-white drop-shadow-[2px_2px_0px_#111] line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        {item.store_profile && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mb-1">
                            <span>Oleh </span>
                            <span 
                              className="text-brand-dark hover:text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/store/${item.store_profile?.store_slug}`);
                              }}
                            >
                              {item.store_profile.store_name}
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-gray-600 mt-2 line-clamp-2">
                          Modul ajar premium berkualitas. Tersedia dalam format file Word (.docx) yang dapat diedit sepenuhnya.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t-[2px] border-brand-dark/15">
                        <div className="flex items-baseline justify-between mb-3">
                          <div className="text-2xl font-black text-brand-orange tracking-tight">
                            {item.price_amount === 0 ? 'Gratis' : `Rp${(item.price_amount || 0).toLocaleString('id-ID')}`}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" className="w-full py-2.5 px-2 bg-brand-surfaceAlt hover:bg-gray-200 text-brand-dark text-xs font-extrabold rounded-md neo-border-sm neo-shadow-sm text-center transition-colors">
                            Detail Isi
                          </button>
                          <button type="button" className="w-full py-2.5 px-2 bg-brand-dark hover:bg-black text-white text-xs font-black rounded-md neo-border-sm neo-shadow-orange text-center flex items-center justify-center gap-1 transition-all">
                            <span>+ Beli Cepat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="card p-12 md:p-20 text-center bg-white flex flex-col items-center max-w-2xl mx-auto neo-border neo-shadow-lg rounded-xl">
              <div className="w-24 h-24 bg-brand-cream border-4 border-brand-dark rounded-3xl flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rotate-3">
                <Search className="w-10 h-10 text-brand-dark" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-brand-dark mb-3">Modul Ajar Tidak Ditemukan</h3>
              <p className="text-base md:text-lg text-gray-500 font-medium max-w-md">
                Maaf, kami tidak dapat menemukan modul ajar yang sesuai dengan pencarian Anda saat ini.
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-8 px-6 py-3 bg-white border-2 border-brand-dark text-brand-dark font-bold rounded-lg neo-shadow-sm hover:neo-shadow-hover transition-all"
                >
                  Hapus Pencarian
                </button>
              )}
            </div>
          )}
        </section>
        {/* END: ProductGrid */}

        {/* ══ CTA SECTION ══ */}
        <div className="bg-brand-accentYellow text-brand-dark p-8 md:p-12 rounded-xl neo-border neo-shadow-lg mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Punya Modul Ajar Keren?</h2>
            <p className="text-sm md:text-base font-bold opacity-90 max-w-xl">
              Bagikan karya Anda ke ribuan guru di seluruh Indonesia. Mulai buka toko Anda secara gratis sekarang!
            </p>
          </div>
          <button 
            onClick={() => navigate('/app/store-management')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-brand-dark text-white rounded-lg font-black text-sm md:text-base neo-border-sm neo-shadow-orange hover:-translate-y-1 hover:shadow-[5px_5px_0px_#c04a1a] transition-all whitespace-nowrap"
          >
            Buka Toko Sekarang <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* BEGIN: TrustBadgeSection */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-brand-accentYellow neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">📄</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">100% File Word (.docx)</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Mayoritas produk bisa diedit dan diganti identitas sekolah.</p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-[#ffccd5] neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">⚖️</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">Berkualitas Tinggi</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Dibuat oleh ratusan guru tersertifikasi di seluruh Indonesia.</p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-[#bbf7d0] neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">⚡</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">Akses Selamanya</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Unduh kapan saja setelah transaksi tanpa batas kedaluwarsa.</p>
              </div>
            </div>
          </div>
        </section>
        {/* END: TrustBadgeSection */}
      </main>

      {/* BEGIN: MainFooter */}
      <footer className="bg-white border-t-[2.5px] border-brand-dark mt-auto" id="bantuan">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-brand-orange text-white neo-border-sm flex items-center justify-center font-black text-lg rounded-sm">
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xl font-extrabold text-brand-dark">ModulAjar<span className="text-brand-orange">.Store</span></span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 max-w-md leading-relaxed">
                Platform kurasi perangkat ajar terlengkap untuk guru Indonesia. Berkomitmen meringankan beban kerja guru lewat penyediaan bahan ajar bermutu tinggi dari guru, untuk guru.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark mb-3">Kategori Fase</h4>
              <ul className="space-y-2 text-xs font-bold text-gray-700">
                <li><a href="#" className="hover:text-brand-orange hover:underline">Fase A (Kelas 1 - 2 SD)</a></li>
                <li><a href="#" className="hover:text-brand-orange hover:underline">Fase B (Kelas 3 - 4 SD)</a></li>
                <li><a href="#" className="hover:text-brand-orange hover:underline">Fase D (Kelas 7 - 9 SMP)</a></li>
                <li><a href="#" className="hover:text-brand-orange hover:underline">Fase E & F (SMA / SMK)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark mb-3">Bantuan Guru</h4>
              <ul className="space-y-2 text-xs font-bold text-gray-700 mb-4">
                <li><a href="#" className="hover:text-brand-orange hover:underline">Konfirmasi Pembayaran</a></li>
                <li><a href="#" className="hover:text-brand-orange hover:underline">Pertanyaan Umum (FAQ)</a></li>
                <li><a href="#" className="hover:text-brand-orange hover:underline">Panduan Buka Toko</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t-[2px] border-brand-dark/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs font-bold text-gray-600">
            <div className="text-center sm:text-left">
              © {new Date().getFullYear()} <strong>ModulAjar.Online</strong>. Seluruh Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Platform Siap 24 Jam
              </span>
            </div>
          </div>
        </div>
      </footer>
      {/* END: MainFooter */}
    </div>
  );
};

export default StoreIndex;
