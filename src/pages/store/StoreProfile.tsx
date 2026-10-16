import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { StoreListing } from '@/types/store';
import { Store, ShoppingBag, FileText, ArrowLeft, Search, MessageCircle, ChevronRight, Menu, X, RotateCcw, Filter } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const CARD_COLORS = ['bg-[#2563eb]', 'bg-[#059669]', 'bg-[#d97706]', 'bg-[#7c3aed]', 'bg-[#0284c7]', 'bg-[#be123c]'];
const ACCENT_COLORS = ['bg-[#1d4ed8]', 'bg-[#047857]', 'bg-[#b45309]', 'bg-[#6d28d9]', 'bg-[#0369a1]', 'bg-[#9f1239]'];

// Master daftar mapel & kata kunci pencocokan otomatis
const COMMON_SUBJECTS = [
  { id: 'PJOK', label: 'PJOK / Penjasorkes', keywords: ['pjok', 'pendidikan jasmani', 'penjas', 'olahraga'] },
  { id: 'Bahasa Indonesia', label: 'Bahasa Indonesia', keywords: ['bahasa indonesia', 'b. indonesia', 'b indonesia', 'bindo'] },
  { id: 'Matematika', label: 'Matematika', keywords: ['matematika', 'mtk', 'matematik'] },
  { id: 'IPAS', label: 'IPAS', keywords: ['ipas', 'ilmu pengetahuan alam dan sosial'] },
  { id: 'Pendidikan Pancasila', label: 'Pendidikan Pancasila', keywords: ['pendidikan pancasila', 'pancasila', 'ppkn'] },
  { id: 'PAI & BP', label: 'PAI & BP', keywords: ['pai', 'pendidikan agama islam', 'agama islam', 'pabp', 'budi pekerti'] },
  { id: 'Bahasa Inggris', label: 'Bahasa Inggris', keywords: ['bahasa inggris', 'b. inggris', 'b inggris', 'english'] },
  { id: 'Seni Rupa', label: 'Seni Rupa', keywords: ['seni rupa'] },
  { id: 'Seni Musik', label: 'Seni Musik', keywords: ['seni musik'] },
  { id: 'Seni Tari', label: 'Seni Tari', keywords: ['seni tari'] },
  { id: 'Seni Teater', label: 'Seni Teater', keywords: ['seni teater'] },
  { id: 'Seni Budaya', label: 'Seni Budaya', keywords: ['seni budaya'] },
  { id: 'IPA', label: 'IPA', keywords: ['ipa', 'ilmu pengetahuan alam', 'sains'] },
  { id: 'IPS', label: 'IPS', keywords: ['ips', 'ilmu pengetahuan sosial'] },
  { id: 'Informatika', label: 'Informatika', keywords: ['informatika', 'tik', 'komputer'] },
  { id: 'Prakarya', label: 'Prakarya', keywords: ['prakarya'] },
  { id: 'Bahasa Jawa', label: 'Bahasa Jawa', keywords: ['bahasa jawa', 'b. jawa'] },
  { id: 'Bahasa Sunda', label: 'Bahasa Sunda', keywords: ['bahasa sunda', 'b. sunda'] },
  { id: 'Fisika', label: 'Fisika', keywords: ['fisika'] },
  { id: 'Kimia', label: 'Kimia', keywords: ['kimia'] },
  { id: 'Biologi', label: 'Biologi', keywords: ['biologi'] },
  { id: 'Sejarah', label: 'Sejarah', keywords: ['sejarah'] },
  { id: 'Geografi', label: 'Geografi', keywords: ['geografi'] },
  { id: 'Ekonomi', label: 'Ekonomi', keywords: ['ekonomi'] },
  { id: 'Sosiologi', label: 'Sosiologi', keywords: ['sosiologi'] },
  { id: 'BK', label: 'BK (Bimbingan Konseling)', keywords: ['bimbingan konseling', ' bk '] },
];

const isItemInJenjang = (item: StoreListing, jenjang: string) => {
  if (jenjang === 'ALL') return true;
  const category = (item.category || '').toUpperCase();
  const title = (item.title || '').toLowerCase();
  if (jenjang === 'SD') {
    return category === 'SD' || /\b(sd|mi|fase a|fase b|fase c|kelas (i|ii|iii|iv|v|vi|1|2|3|4|5|6))\b/i.test(title);
  }
  if (jenjang === 'SMP') {
    return category === 'SMP' || /\b(smp|mts|fase d|kelas (vii|viii|ix|7|8|9))\b/i.test(title);
  }
  if (jenjang === 'SMA') {
    return category === 'SMA' || category === 'SMK' || /\b(sma|smk|ma|mak|fase e|fase f|kelas (x|xi|xii|10|11|12))\b/i.test(title);
  }
  return true;
};

const StoreProfilePage = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('NEWEST');

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

  // Hitung mapel yang benar-benar TERSEDIA di toko ini (berdasarkan jenjang yang aktif)
  const availableSubjects = useMemo(() => {
    if (!listings || listings.length === 0) return [];

    const pool = selectedJenjang === 'ALL'
      ? listings
      : listings.filter(item => isItemInJenjang(item, selectedJenjang));

    const list: { id: string; label: string; count: number }[] = [];

    COMMON_SUBJECTS.forEach((subj) => {
      let count = 0;
      pool.forEach((item) => {
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        if (subj.keywords.some((kw) => text.includes(kw))) {
          count++;
        }
      });
      if (count > 0) {
        list.push({ id: subj.id, label: subj.label, count });
      }
    });

    return list;
  }, [listings, selectedJenjang]);

  // Jika mapel yang sedang dipilih tidak ada di jenjang yang baru dipilih, reset ke ALL
  useEffect(() => {
    if (selectedSubject !== 'ALL') {
      const exists = availableSubjects.some((s) => s.id === selectedSubject);
      if (!exists) {
        setSelectedSubject('ALL');
      }
    }
  }, [availableSubjects, selectedSubject]);

  const matchingJenjangCount = useMemo(() => {
    if (!listings) return 0;
    if (selectedJenjang === 'ALL') return listings.length;
    return listings.filter((item) => isItemInJenjang(item, selectedJenjang)).length;
  }, [listings, selectedJenjang]);

  // Logika filter dan pencarian
  const filteredListings = useMemo(() => {
    if (!listings) return [];

    return listings.filter((item) => {
      // 1. Filter Jenjang
      if (!isItemInJenjang(item, selectedJenjang)) return false;

      // 2. Filter Mata Pelajaran
      if (selectedSubject !== 'ALL') {
        const subj = COMMON_SUBJECTS.find((s) => s.id === selectedSubject);
        if (subj) {
          const text = `${item.title} ${item.description || ''}`.toLowerCase();
          if (!subj.keywords.some((kw) => text.includes(kw))) return false;
        }
      }

      // 3. Filter Semester
      if (selectedSemester !== 'ALL') {
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        if (selectedSemester === 'GANJIL') {
          const isGanjil = text.includes('ganjil') || text.includes('semester 1') || text.includes('semester i');
          if (!isGanjil) return false;
        } else if (selectedSemester === 'GENAP') {
          const isGenap = text.includes('genap') || text.includes('semester 2') || text.includes('semester ii');
          if (!isGenap) return false;
        }
      }

      // 4. Filter Kata Kunci Pencarian (Search Query)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const text = `${item.title} ${item.description || ''} ${item.category || ''}`.toLowerCase();
        const terms = q.split(/\s+/).filter(Boolean);
        const allMatch = terms.every((term) => text.includes(term));
        if (!allMatch) return false;
      }

      return true;
    });
  }, [listings, selectedJenjang, selectedSubject, selectedSemester, searchQuery]);

  // Logika Pengurutan (Sorting)
  const sortedListings = useMemo(() => {
    const items = [...filteredListings];
    if (selectedSort === 'PRICE_ASC') {
      return items.sort((a, b) => (a.price_amount || 0) - (b.price_amount || 0));
    }
    if (selectedSort === 'PRICE_DESC') {
      return items.sort((a, b) => (b.price_amount || 0) - (a.price_amount || 0));
    }
    // Default: NEWEST
    return items.sort((a, b) => new Date(b.published_at || b.created_at || 0).getTime() - new Date(a.published_at || a.created_at || 0).getTime());
  }, [filteredListings, selectedSort]);

  const hasActiveFilter = Boolean(
    searchQuery.trim() !== '' ||
    selectedJenjang !== 'ALL' ||
    selectedSubject !== 'ALL' ||
    selectedSemester !== 'ALL' ||
    selectedSort !== 'NEWEST'
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const catalogEl = document.getElementById('katalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedJenjang('ALL');
    setSelectedSubject('ALL');
    setSelectedSemester('ALL');
    setSelectedSort('NEWEST');
  };

  // Catat kunjungan toko (store visit) sekali per sesi per hari
  React.useEffect(() => {
    if (profile?.store_id) {
      const today = new Date().toISOString().slice(0, 10);
      const sessionKey = `visited_store_${profile.store_id}_${today}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        storeApi.recordStoreVisit(profile.store_id);
      }
    }
  }, [profile?.store_id]);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-dark"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream p-4 text-center">
        <div className="w-20 h-20 bg-white border-4 border-brand-dark rounded-xl flex items-center justify-center mb-4 neo-shadow">
          <Store className="w-10 h-10 text-brand-dark" />
        </div>
        <h1 className="text-2xl font-black text-brand-dark mb-2 tracking-tight">Toko Tidak Ditemukan</h1>
        <p className="text-gray-600 font-semibold mb-6">Toko yang Anda cari tidak ada atau belum aktif.</p>
        <button onClick={() => navigate('/store')} className="px-6 py-3 bg-brand-dark text-white font-bold rounded-lg neo-border-sm neo-shadow-sm hover:neo-shadow-hover flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Jelajah
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream text-brand-dark min-h-screen flex flex-col antialiased">
      <SEOHead 
        title={`${profile.store_name} - ModulAjar Store`}
        description={profile.tagline || `Koleksi modul ajar dari ${profile.store_name}`}
      />

      {/* BEGIN: AnnouncementBar */}
      <aside className="bg-brand-accentYellow border-b-[2.5px] border-brand-dark py-2 px-4 text-xs md:text-sm font-bold tracking-tight text-brand-dark text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="inline-block bg-brand-dark text-brand-cream px-1.5 py-0.5 rounded text-[11px] font-extrabold uppercase">Update 2026/2027</span>
          <span>Perangkat Ajar Kurikulum Merdeka & Deep Learning siap edit!</span>
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
                  <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mt-0.5 truncate max-w-[120px] sm:max-w-none">{profile.store_name}</span>
                </div>
              </Link>
            </div>

            {/* Search Bar Neobrutalist (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearchSubmit} className="w-full flex items-stretch">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 text-sm font-semibold bg-brand-surfaceAlt neo-border neo-shadow-sm focus:ring-0 focus:border-brand-dark focus:bg-white placeholder-gray-500 rounded-l-md" 
                    placeholder="Cari modul ajar di toko ini..." 
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700"
                      title="Hapus pencarian"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  ) : (
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                      <Search className="w-5 h-5 stroke-[2.5]" />
                    </span>
                  )}
                </div>
                <button type="submit" className="h-11 px-5 bg-brand-orange text-white font-bold text-sm neo-border neo-shadow-sm -ml-[2.5px] hover:bg-[#a93e15] active:translate-x-0.5 active:translate-y-0.5 rounded-r-md flex items-center gap-1.5 transition-colors">
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

              {/* WhatsApp Contact Button */}
              {profile.whatsapp_number && (
                <a href={`https://wa.me/${profile.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-2 h-11 px-4 bg-white text-brand-dark font-bold text-sm neo-border neo-shadow neo-shadow-hover rounded-md">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Chat Guru</span>
                </a>
              )}
            </div>
          </div>

          {/* Mobile Search Bar Expandable */}
          {isSearchOpen && (
            <div className="md:hidden py-3 border-t-[2.5px] border-brand-dark/10">
              <form onSubmit={handleSearchSubmit} className="w-full flex items-stretch">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 text-sm font-semibold bg-brand-surfaceAlt neo-border neo-shadow-sm focus:ring-0 focus:border-brand-dark focus:bg-white placeholder-gray-500 rounded-l-md" 
                    placeholder="Cari modul ajar di toko ini..." 
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
                <button type="submit" className="h-11 px-4 bg-brand-orange text-white font-bold text-sm neo-border neo-shadow-sm -ml-[2.5px] active:translate-x-0.5 active:translate-y-0.5 rounded-r-md flex items-center gap-1.5">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Bottom Navigation Links */}
          <nav className="border-t-[2px] border-brand-dark/20 py-2.5 flex items-center justify-between text-xs md:text-sm font-bold overflow-x-auto gap-4 no-scrollbar">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <a href="#katalog" className="px-3 py-1 bg-brand-dark text-white rounded neo-border-sm neo-shadow-sm font-bold">Katalog Modul</a>
              <Link to="/lacak-pesanan" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded neo-border-sm neo-shadow-sm font-bold transition-colors">Lacak Pesanan Saya</Link>
              <a href="#cara-beli" className="px-3 py-1 bg-white hover:bg-brand-cream rounded neo-border-sm font-semibold transition-colors">Cara Pembelian</a>
              <a href="#bantuan" className="px-3 py-1 bg-white hover:bg-brand-cream rounded neo-border-sm font-semibold transition-colors">Bantuan Guru</a>
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
            <div className="bg-[#e85c27] border-b-[2.5px] border-brand-dark p-6 sm:p-8 lg:p-10 relative overflow-hidden" style={profile.banner_desktop_url ? { backgroundImage: `url(${profile.banner_desktop_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
              <div className="absolute inset-0 bg-[#e85c27]/80 mix-blend-multiply"></div>
              {/* Decorative geometric patterns */}
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#c04a1a] neo-border rounded-full opacity-60 pointer-events-none hidden md:block"></div>
              <div className="absolute right-40 -bottom-10 w-28 h-28 bg-[#fec84b] neo-border rotate-12 opacity-80 pointer-events-none hidden lg:block"></div>
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-brand-dark text-white px-3 py-1 rounded neo-border-sm neo-shadow-sm text-xs font-extrabold tracking-wide mb-3 uppercase">
                  <span>★ Official Creator</span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-[2px_2px_0px_#111111]">
                  {profile.store_name}
                </h1>
                <p className="mt-3 text-sm sm:text-base md:text-lg font-bold text-brand-dark bg-white/95 p-3 rounded neo-border-sm neo-shadow max-w-2xl">
                  {profile.tagline || 'Perangkat Pembelajaran Siap Pakai untuk Guru'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center px-2.5 py-1 bg-white text-brand-dark text-xs font-extrabold rounded neo-border-sm neo-shadow-sm">✓ RPP / Modul Ajar</span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-brand-accentYellow text-brand-dark text-xs font-extrabold rounded neo-border-sm neo-shadow-sm">✓ Format Word Siap Edit</span>
                </div>
              </div>
            </div>

            {/* Store Profile & Meta Info Bar */}
            <div className="p-6 sm:p-8 bg-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-surfaceAlt neo-border neo-shadow rounded-lg p-1.5 flex-shrink-0 flex flex-col items-center justify-center text-center bg-[#fff8f0]">
                    {profile.avatar_url ? (
                       <img src={profile.avatar_url} alt={profile.store_name} className="w-full h-full object-cover rounded-md neo-border-sm" />
                    ) : (
                      <div className="w-full h-full rounded-md bg-brand-orange text-white neo-border-sm flex items-center justify-center font-black text-2xl mb-1 shadow-[2px_2px_0px_#111]">
                        {profile.store_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-dark">{profile.store_name}</h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-orange text-white text-xs font-black rounded neo-border-sm">
                        ✓ VERIFIED
                      </span>
                    </div>
                    {profile.description && (
                      <p className="text-sm font-bold text-gray-700 mt-1 line-clamp-2">
                        {profile.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-auto flex items-center justify-between sm:justify-start gap-3 bg-brand-cream p-3 rounded-lg neo-border neo-shadow-sm self-stretch lg:self-center">
                  <div className="px-3 py-1 text-center flex-1 sm:flex-none">
                    <div className="text-xl sm:text-2xl font-black text-brand-orange">{listings?.length || 0}+</div>
                    <div className="text-[11px] font-extrabold uppercase text-gray-700">Modul</div>
                  </div>
                  <div className="h-8 w-[2px] bg-brand-dark/30"></div>
                  <div className="px-3 py-1 text-center flex-1 sm:flex-none">
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">100%</div>
                    <div className="text-[11px] font-extrabold uppercase text-gray-700">File Word</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: StoreHeroSection */}

        {/* BEGIN: FilterSection */}
        <section className="mb-8" id="katalog">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-dark text-brand-cream neo-border-sm flex items-center justify-center font-black rounded text-sm neo-shadow-sm">#</div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-dark">Katalog Modul Ajar</h2>
                <p className="text-xs sm:text-sm font-bold text-gray-600">Pilih berdasarkan fase tingkatan kelas dan semester</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 bg-brand-card rounded neo-border-sm neo-shadow-sm self-start sm:self-auto">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black inline-block"></span>
              <span>Format Word (.docx)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-brand-card p-4 rounded-lg neo-border neo-shadow">
            {/* Jenjang */}
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">Jenjang Sekolah</label>
              <select 
                value={selectedJenjang}
                onChange={(e) => setSelectedJenjang(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-brand-surfaceAlt rounded neo-border-sm py-2 px-2.5 focus:ring-0 focus:border-brand-dark cursor-pointer"
              >
                <option value="ALL">Semua Jenjang</option>
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / SMK / MA</option>
              </select>
            </div>

            {/* Mata Pelajaran - Dinamis berdasarkan modul yang ada di toko */}
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">Mata Pelajaran</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-brand-surfaceAlt rounded neo-border-sm py-2 px-2.5 focus:ring-0 focus:border-brand-dark cursor-pointer"
              >
                <option value="ALL">
                  Semua Mapel {listings ? `(${matchingJenjangCount})` : ''}
                </option>
                {availableSubjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.label} ({subj.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">Semester</label>
              <select 
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-brand-surfaceAlt rounded neo-border-sm py-2 px-2.5 focus:ring-0 focus:border-brand-dark cursor-pointer"
              >
                <option value="ALL">Semua Semester</option>
                <option value="GANJIL">Ganjil (1)</option>
                <option value="GENAP">Genap (2)</option>
              </select>
            </div>

            {/* Urutan */}
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">Urutan</label>
              <select 
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-brand-surfaceAlt rounded neo-border-sm py-2 px-2.5 focus:ring-0 focus:border-brand-dark cursor-pointer"
              >
                <option value="NEWEST">Terbaru</option>
                <option value="PRICE_ASC">Harga: Terendah</option>
                <option value="PRICE_DESC">Harga: Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Bar Info Filter Aktif & Reset */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 p-3 bg-brand-surfaceAlt rounded-md neo-border-sm text-xs font-bold text-brand-dark animate-in fade-in duration-150">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-600 font-extrabold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-brand-dark" />
                  <span>Ditemukan {sortedListings.length} modul:</span>
                </span>
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded neo-border-sm text-[11px]">
                    Cari: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedJenjang !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded neo-border-sm text-[11px]">
                    Jenjang: {selectedJenjang}
                    <button onClick={() => setSelectedJenjang('ALL')} className="hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSubject !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded neo-border-sm text-[11px]">
                    Mapel: {availableSubjects.find(s => s.id === selectedSubject)?.label || selectedSubject}
                    <button onClick={() => setSelectedSubject('ALL')} className="hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSemester !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded neo-border-sm text-[11px]">
                    Semester: {selectedSemester === 'GANJIL' ? 'Ganjil (1)' : 'Genap (2)'}
                    <button onClick={() => setSelectedSemester('ALL')} className="hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <button 
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-extrabold hover:underline ml-auto text-xs py-0.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua</span>
              </button>
            </div>
          )}
        </section>
        {/* END: FilterSection */}

        {/* BEGIN: ProductGrid */}
        <section className="mb-12">
          {isListingsLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-dark"></div>
            </div>
          ) : sortedListings && sortedListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedListings.map((item, i) => {
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
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mb-1">
                          <span>Kurikulum Merdeka</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-extrabold">Format .docx</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-600 mt-2 line-clamp-2">
                          {item.description || 'Modul ajar lengkap yang dapat diunduh dan diedit langsung sesuai kebutuhan administrasi sekolah Anda.'}
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
            <div className="card p-10 md:p-16 text-center bg-white flex flex-col items-center neo-border neo-shadow rounded-xl">
              <div className="w-20 h-20 bg-brand-cream border-4 border-brand-dark rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                <FileText className="w-10 h-10 text-brand-dark" />
              </div>
              {listings && listings.length > 0 ? (
                <>
                  <h3 className="text-xl md:text-2xl font-black text-brand-dark mb-2">Modul Ajar Tidak Ditemukan</h3>
                  <p className="text-sm md:text-base text-gray-500 font-bold max-w-md mb-6">
                    Tidak ada modul yang cocok dengan kata kunci pencarian atau kombinasi filter yang Anda pilih.
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="px-5 py-2.5 bg-brand-orange text-white font-black text-sm rounded-lg neo-border-sm neo-shadow-sm hover:bg-[#a93e15] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Semua Filter</span>
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-black text-brand-dark mb-2">Belum ada modul ajar</h3>
                  <p className="text-sm md:text-base text-gray-500 font-bold">Toko ini belum menerbitkan modul ajar apapun.</p>
                </>
              )}
            </div>
          )}
        </section>
        {/* END: ProductGrid */}

        {/* BEGIN: TrustBadgeSection */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-brand-accentYellow neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">📄</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">100% File Word (.docx)</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Bisa diedit dan diganti identitas sekolah tanpa proteksi password.</p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-[#ffccd5] neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">⚖️</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">Sesuai Panduan</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Struktur modul mengacu pada regulasi Capaian Pembelajaran terbaru.</p>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-lg neo-border neo-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded bg-[#bbf7d0] neo-border-sm flex items-center justify-center font-black text-xl flex-shrink-0 text-brand-dark neo-shadow-sm">⚡</div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-brand-dark">Akses Selamanya</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 mt-1">Link download langsung via Google Drive tanpa batas kedaluwarsa.</p>
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
                Platform kurasi perangkat ajar terlengkap untuk guru Indonesia. Berkomitmen meringankan beban kerja guru lewat penyediaan bahan ajar bermutu tinggi.
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
              </ul>
              {profile.whatsapp_number && (
                <a href={`https://wa.me/${profile.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-brand-orange text-white text-xs font-black rounded neo-border-sm neo-shadow-sm hover:bg-[#a93e15] transition-colors">
                  Hubungi Admin {profile.store_name}
                </a>
              )}
            </div>
          </div>
          <div className="pt-6 border-t-[2px] border-brand-dark/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs font-bold text-gray-600">
            <div className="text-center sm:text-left">
              © {new Date().getFullYear()} <strong>ModulAjar.Online</strong> & <strong>{profile.store_name}</strong>. Seluruh Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Server Siap 24 Jam
              </span>
            </div>
          </div>
        </div>
      </footer>
      {/* END: MainFooter */}
    </div>
  );
};

export default StoreProfilePage;
