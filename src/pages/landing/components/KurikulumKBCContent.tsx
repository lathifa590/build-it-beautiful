import React from 'react';
import { Heart, Users, Globe, BookOpen, Star, CheckCircle2, Quote, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function KurikulumKBCContent() {
  const pancaCinta = [
    { title: "Cinta Kepada Allah", desc: "Menanamkan nilai tauhid dan spiritualitas dalam setiap materi ajar.", icon: <Star className="w-8 h-8 text-[#c04a1a]" /> },
    { title: "Cinta Kepada Rasulullah", desc: "Mengambil keteladanan akhlak Nabi dalam proses pembelajaran.", icon: <BookOpen className="w-8 h-8 text-[#15803d]" /> },
    { title: "Cinta Diri Sendiri", desc: "Membangun karakter tangguh, percaya diri, dan sehat jasmani rohani.", icon: <Heart className="w-8 h-8 text-[#c04a1a]" /> },
    { title: "Cinta Sesama Manusia", desc: "Mengembangkan empati, toleransi, dan kepedulian sosial.", icon: <Users className="w-8 h-8 text-[#15803d]" /> },
    { title: "Cinta Kepada Alam Semesta", desc: "Menjaga kelestarian lingkungan sebagai bentuk syukur.", icon: <Globe className="w-8 h-8 text-[#c04a1a]" /> }
  ];

  const testimonials = [
    { text: "Alhamdulillah, akhirnya ada aplikasi yang paham kebutuhan guru madrasah. RPP jadi lebih terarah.", author: "Guru MI, Jawa Timur" },
    { text: "Nilai-nilai KBC langsung terintegrasi, tidak perlu tambah manual lagi. Sangat membantu!", author: "Guru MTs, Jawa Tengah" },
    { text: "Hemat waktu 3-4 jam per minggu untuk buat RPP. Mengajar jadi lebih fokus dan santai.", author: "Guru MA, Sulawesi Selatan" }
  ];

  return (
    <div className="w-full font-sans">
      
      {/* Introduction & Subjects */}
      <div className="py-8 mb-4">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-[#111] mb-3">Apa itu Kurikulum Berbasis Cinta (KBC)?</h2>
          <p className="text-[#111] font-medium leading-relaxed">
            Kurikulum Berbasis Cinta (KBC) adalah kurikulum resmi yang diusung oleh Kementerian Agama Republik Indonesia (Kemenag) untuk diaplikasikan di Madrasah (MI, MTs, dan MA). Kurikulum ini menekankan pendidikan karakter yang berakar pada kasih sayang dan spiritualitas keagamaan (Panca Cinta).
          </p>
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-[#111] mb-5">Mata Pelajaran Madrasah yang Didukung</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Akidah Akhlak', 'Al-Quran Hadis', 'Fikih', 'SKI (Sejarah Kebudayaan Islam)', 'Bahasa Arab', 'Matematika', 'IPA / IPS', 'Bahasa Indonesia'].map((mapel, i) => (
              <div key={i} className="bg-[#f0fdf4] text-[#15803d] font-bold px-4 py-3 rounded-[6px] border-[2.5px] border-[#111] shadow-[2px_2px_0_#111] text-center hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#111] transition-all">
                {mapel}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5 Nilai Panca Cinta Section */}
      <div className="py-12">
        <div className="text-center mb-12">
          <span className="text-[#c04a1a] font-black tracking-widest uppercase text-xs mb-2 block border-[2.5px] border-[#c04a1a] inline-block px-3 py-1 bg-[#fff3ed] rounded-md">Pilar Utama</span>
          <h2 className="text-3xl md:text-4xl font-black text-[#111] mb-4">Integrasi 5 Nilai Panca Cinta</h2>
          <p className="text-[#111] font-medium max-w-2xl mx-auto">Sistem AI kami dilatih khusus untuk menyisipkan nilai-nilai Panca Cinta ke dalam tujuan, materi, hingga asesmen secara natural.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {pancaCinta.map((item, i) => (
            <div key={i} className="bg-[#ffffff] rounded-[10px] p-6 border-[2.5px] border-[#111] shadow-[4px_4px_0px_#111] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#111] transition-all duration-150">
              <div className="w-14 h-14 rounded-xl bg-[#fafafa] border-[2.5px] border-[#111] shadow-[2px_2px_0px_#111] flex items-center justify-center mb-5">
                {item.icon}
              </div>
              <h3 className="font-black text-[#111] mb-2 leading-tight">{item.title}</h3>
              <p className="text-sm text-[#333] font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Counter Section */}
      <div className="py-16 my-8 bg-[#15803d] rounded-[10px] text-white text-center border-[2.5px] border-[#111] shadow-[5px_5px_0px_#111] relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-5xl md:text-7xl font-black mb-4 tabular-nums tracking-tight text-[#ffffff] drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">50.000+</h3>
          <p className="text-[#ffffff] text-lg md:text-xl font-bold max-w-md mx-auto">
            Guru Madrasah di seluruh Indonesia telah terbantu dalam menyusun administrasi KBC.
          </p>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="py-12">
        <h2 className="text-3xl font-black text-center text-[#111] mb-12">Mengapa Memilih AI Kami untuk KBC?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#ffffff] rounded-[10px] p-8 border-[2.5px] border-[#111] shadow-[4px_4px_0px_#111]">
            <h3 className="text-xl font-black text-[#111] mb-6 flex items-center gap-3 pb-4 border-b-2 border-[#111]">
              <span className="w-8 h-8 rounded-[6px] bg-[#f5f0e8] border-[2.5px] border-[#111] flex items-center justify-center text-sm shadow-[2px_2px_0_#111]">❌</span> 
              Modul Ajar Biasa
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-[#111] font-medium"><span className="mt-1 text-[#111] font-bold">✕</span>Hanya fokus pada materi kognitif umum.</li>
              <li className="flex gap-3 text-[#111] font-medium"><span className="mt-1 text-[#111] font-bold">✕</span>Harus mencari dalil Al-Quran/Hadis secara manual.</li>
              <li className="flex gap-3 text-[#111] font-medium"><span className="mt-1 text-[#111] font-bold">✕</span>Tidak ada rubrik Panca Cinta Kemenag.</li>
              <li className="flex gap-3 text-[#111] font-medium"><span className="mt-1 text-[#111] font-bold">✕</span>Format tidak sesuai SK Dirjen Pendis.</li>
            </ul>
          </div>
          <div className="bg-[#f0fdf4] rounded-[10px] p-8 border-[2.5px] border-[#111] shadow-[4px_4px_0px_#111] relative transform md:-translate-y-2">
            <div className="absolute -top-4 right-8 bg-[#15803d] text-white text-xs font-black px-4 py-1.5 rounded-[4px] uppercase tracking-wider border-[2.5px] border-[#111] shadow-[2px_2px_0px_#111]">Pilihan Terbaik</div>
            <h3 className="text-xl font-black text-[#111] mb-6 flex items-center gap-3 pb-4 border-b-[2.5px] border-[#111]">
              <span className="w-8 h-8 rounded-[6px] bg-[#f0fdf4] border-[2.5px] border-[#111] flex items-center justify-center text-sm shadow-[2px_2px_0_#111]">✅</span> 
              Modul Ajar KBC (AI)
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" strokeWidth={3} />Otomatis terintegrasi nilai spiritual & karakter.</li>
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" strokeWidth={3} />AI mencarikan ayat & hadis yang relevan dengan otomatis.</li>
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" strokeWidth={3} />Rubrik penilaian mencakup 5 nilai Panca Cinta.</li>
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" strokeWidth={3} />Struktur dokumen 100% patuh regulasi Kemenag terbaru.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 mt-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[#111] mb-4">Dipercaya oleh Guru Madrasah</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testi, i) => (
            <div key={i} className="bg-[#ffffff] rounded-[10px] p-6 border-[2.5px] border-[#111] shadow-[4px_4px_0px_#111] relative">
              <div className="w-10 h-10 rounded-[6px] bg-[#fff3ed] border-[2.5px] border-[#111] flex items-center justify-center mb-4 shadow-[2px_2px_0_#111]">
                <Quote className="w-5 h-5 text-[#c04a1a]" fill="currentColor" />
              </div>
              <p className="text-[#111] font-medium mb-6 relative z-10 leading-relaxed">"{testi.text}"</p>
              <div className="flex items-center gap-3 mt-auto pt-4 border-t-2 border-[#111] border-dashed">
                <div className="w-10 h-10 rounded-[6px] bg-[#15803d] border-2 border-[#111] flex items-center justify-center text-white font-black text-sm shadow-[2px_2px_0_#111]">
                  {testi.author.charAt(5)}
                </div>
                <div className="font-bold text-sm text-[#111]">{testi.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Links Navigation */}
      <div className="pt-8 pb-4 flex flex-wrap gap-4 justify-center text-sm border-t-[2.5px] border-[#111] mt-12">
        <Link to="/rpp-madrasah" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Generator RPP Madrasah <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
        <span className="text-[#111] font-black hidden sm:inline">•</span>
        <Link to="/modul-ajar-mi" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Modul Ajar MI <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
        <span className="text-[#111] font-black hidden sm:inline">•</span>
        <Link to="/modul-ajar-mts" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Modul Ajar MTs <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
        <span className="text-[#111] font-black hidden sm:inline">•</span>
        <Link to="/modul-ajar-ma" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Modul Ajar MA <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
      </div>
    </div>
  );
}
