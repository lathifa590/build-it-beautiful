import React from 'react';
import { Book, CheckCircle2, FileText, ArrowRight, Sparkles, BookOpen, Scroll, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RPPMadrasahContent() {
  const jenjang = [
    { title: "MI (Madrasah Ibtidaiyah)", desc: "Pendekatan tematik terpadu yang menyenangkan dengan sisipan nilai dasar islami.", icon: <GraduationCap className="w-8 h-8 text-[#15803d]" /> },
    { title: "MTs (Madrasah Tsanawiyah)", desc: "Pendalaman akidah dan syariah terintegrasi lintas mata pelajaran (IPA/IPS).", icon: <BookOpen className="w-8 h-8 text-[#c04a1a]" /> },
    { title: "MA (Madrasah Aliyah)", desc: "Analisis kritis dalil dan pembentukan karakter kepemimpinan berbasis sunnah.", icon: <Scroll className="w-8 h-8 text-[#111]" /> }
  ];

  const faqs = [
    { q: "Apakah RPP KBC berbeda dengan RPP Kurikulum Merdeka?", a: "Ya, RPP KBC mewajibkan adanya insersi nilai-nilai kasih sayang dan spiritual di dalam pendahuluan, inti, hingga penutup pembelajaran." },
    { q: "Bagaimana cara membuat RPP KBC di ModulAjar.Online?", a: "Sangat mudah. Anda hanya perlu memilih jenjang madrasah (MI/MTs/MA), lalu memasukkan topik pelajaran. Sistem kami otomatis mengonfigurasi output sesuai SK Dirjen Pendis." },
    { q: "Apakah dalil Al-Quran dan Hadis otomatis masuk ke RPP?", a: "Tentu. Ini adalah fitur unggulan kami. AI akan mencari dan menyisipkan dalil yang paling relevan dengan topik (misalnya QS. Al-Baqarah: 43 untuk topik Zakat) lengkap dengan terjemahannya." },
    { q: "Berapa lama membuat RPP KBC dengan AI?", a: "Kurang dari 30 detik. RPP langsung siap diunduh dalam format Word (Docx) dan siap untuk dicetak atau disunting." },
    { q: "Apakah bisa untuk semua mapel madrasah?", a: "Ya, kami mendukung mapel umum (Matematika, IPA) maupun mapel agama (Fikih, SKI, Qur'an Hadis, Akidah Akhlak, Bahasa Arab)." }
  ];

  return (
    <div className="w-full font-sans">
      
      {/* Jenjang Dukungan */}
      <div className="py-8 mb-4 mt-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-[#111] mb-3">Dukungan Penuh Semua Jenjang Madrasah</h2>
          <p className="text-[#111] font-medium leading-relaxed max-w-2xl mx-auto">
            Sistem kami dilatih untuk membedakan gaya bahasa, kedalaman materi, dan kompleksitas dalil sesuai tingkatan siswa Anda.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {jenjang.map((item, i) => (
            <div key={i} className="bg-[#ffffff] rounded-[10px] p-6 border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:-translate-y-1 hover:shadow-[5px_5px_0_#111] transition-all flex flex-col text-center items-center">
              <div className="w-16 h-16 rounded-[8px] bg-[#f5f0e8] border-[2.5px] border-[#111] flex items-center justify-center mb-5 shadow-[2px_2px_0_#111]">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-[#111] mb-3">{item.title}</h3>
              <p className="text-[#333] font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fitur Integrasi Dalil (MOCKUP UI) */}
      <div className="py-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-1/2">
            <span className="text-[#111] font-black tracking-widest uppercase text-xs mb-3 block border-[2.5px] border-[#111] inline-block px-3 py-1 bg-[#fff3ed] rounded-md">USP (Unique Selling Proposition)</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#111] mb-6">Integrasi Dalil & Hadis Otomatis</h2>
            <p className="text-[#111] font-medium leading-relaxed mb-6 text-lg">
              Tidak perlu lagi membuka kitab atau mencari di Google. Cukup ketik topik Anda, AI kami akan mencarikan <strong>ayat Al-Quran</strong> dan <strong>Hadis shahih</strong> yang paling relevan dengan materi pelajaran secara otomatis.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-6 h-6 text-[#15803d] shrink-0" strokeWidth={3} />Teks Arab dengan harakat lengkap.</li>
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-6 h-6 text-[#15803d] shrink-0" strokeWidth={3} />Terjemahan Bahasa Indonesia baku.</li>
              <li className="flex gap-3 text-[#111] font-bold"><CheckCircle2 className="w-6 h-6 text-[#15803d] shrink-0" strokeWidth={3} />Otomatis terhubung dengan Nilai KBC.</li>
            </ul>
          </div>
          
          <div className="w-full lg:w-1/2">
            {/* Mockup UI Window */}
            <div className="bg-[#ffffff] rounded-[10px] border-[3px] border-[#111] shadow-[6px_6px_0_#111] overflow-hidden transform md:rotate-2">
              <div className="bg-[#fafafa] border-b-[2.5px] border-[#111] p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#111] bg-[#c04a1a]"></div>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#111] bg-[#f5f0e8]"></div>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#111] bg-[#15803d]"></div>
                </div>
                <div className="mx-auto font-black text-xs text-[#111] uppercase tracking-wider bg-[#ffffff] px-3 py-1 border-[2.5px] border-[#111] rounded-md shadow-[1px_1px_0_#111]">
                  Output RPP (Topik: Zakat Fitrah)
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-[#111] font-black text-sm uppercase mb-2">
                    <Sparkles className="w-4 h-4 text-[#c04a1a]" fill="currentColor" /> Landasan Spiritual (Integrasi AI)
                  </div>
                  <div className="bg-[#f0fdf4] border-[2px] border-[#111] rounded-[6px] p-4 relative shadow-[2px_2px_0_#111]">
                    <h4 className="font-bold text-[#111] text-sm mb-2 border-b-2 border-dashed border-[#111] pb-2">1. Dalil Al-Quran</h4>
                    <p className="font-arabic text-2xl text-right leading-relaxed mb-3 text-[#111]" dir="rtl">
                      وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ
                    </p>
                    <p className="text-sm font-medium text-[#333] leading-relaxed italic border-l-[3px] border-[#15803d] pl-3">
                      "Dan dirikanlah shalat, tunaikanlah zakat dan ruku'lah beserta orang-orang yang ruku'." 
                      <strong className="block mt-1 not-italic text-[#111]">— QS. Al-Baqarah: 43</strong>
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="bg-[#fff3ed] border-[2.5px] border-[#111] rounded-[6px] p-4 relative shadow-[2px_2px_0_#111]">
                    <h4 className="font-bold text-[#111] text-sm mb-2 border-b-2 border-dashed border-[#111] pb-2">2. Hadis Pendukung</h4>
                    <p className="text-sm font-medium text-[#333] leading-relaxed italic border-l-[3px] border-[#c04a1a] pl-3">
                      "Rasulullah SAW mewajibkan zakat fitrah untuk mensucikan orang yang berpuasa... sebanyak satu sha' kurma atau gandum."
                      <strong className="block mt-1 not-italic text-[#111]">— HR. Abu Dawud & Ibnu Majah</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <div className="bg-[#ffffff] border-[2.5px] border-[#111] rounded-[6px] p-3 shadow-[2px_2px_0_#111] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f5f0e8] border-[2.5px] border-[#111] rounded-[4px] flex items-center justify-center font-black text-[#111]">KBC</div>
                    <div>
                      <p className="font-bold text-[#111] text-sm leading-none">Rubrik Nilai KBC Diaktifkan</p>
                      <p className="text-xs font-medium text-[#555] mt-1">Mengandung indikator "Cinta Kepada Allah" & "Cinta Sesama Manusia"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Khusus */}
      <div className="py-16 border-t-[2.5px] border-[#111] mt-8">
        <div className="text-center mb-10">
          <span className="text-[#111] font-black tracking-widest uppercase text-xs mb-2 block border-[2.5px] border-[#111] inline-block px-3 py-1 bg-[#fff3ed] rounded-md">FAQ</span>
          <h2 className="text-3xl font-black text-[#111]">Tanya Jawab Seputar RPP Madrasah</h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#ffffff] border-[2.5px] border-[#111] rounded-[8px] p-5 shadow-[3px_3px_0_#111]">
              <h3 className="font-black text-[#111] text-lg flex items-start gap-3 mb-2">
                <span className="text-[#c04a1a] shrink-0 mt-0.5">Q.</span> {faq.q}
              </h3>
              <p className="text-[#333] font-medium leading-relaxed pl-7 border-l-[2px] border-dashed border-[#ccc] ml-2">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Links Navigation */}
      <div className="pt-8 pb-4 flex flex-wrap gap-4 justify-center text-sm border-t-[2.5px] border-[#111] mt-12">
        <Link to="/kurikulum-kbc" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Info Kurikulum KBC <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
        <span className="text-[#111] font-black hidden sm:inline">•</span>
        <Link to="/generator-rpp" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Generator RPP Umum <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
        <span className="text-[#111] font-black hidden sm:inline">•</span>
        <Link to="/generator-lkpd" className="text-[#c04a1a] hover:text-[#111] font-bold inline-flex items-center hover:-translate-y-0.5 transition-transform">Generator LKPD <ArrowRight className="w-4 h-4 ml-1 stroke-[3]"/></Link>
      </div>
    </div>
  );
}
