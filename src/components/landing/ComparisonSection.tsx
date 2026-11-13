import React, { useState } from 'react';
import { Check, X, AlertTriangle, Sparkles, Zap, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComparisonRow {
  aspek: string;
  konvensional: string;
  generatorLain: string;
  modulAjar: string;
  highlight?: boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    aspek: 'Sistem Biaya & Kuota Generate',
    konvensional: 'Waktu lembur berjam-jam atau beli paket modul siap pakai yang mahal dan kaku.',
    generatorLain: 'Sistem kredit/token terbatas. Tiap generate memotong kuota, jika habis wajib beli paket top-up lagi.',
    modulAjar: 'Sistem BYOK (Bring Your Own Key) → UNLIMITED GENERATE sepuasnya tanpa batas kuota & jauh lebih hemat!',
    highlight: true,
  },
  {
    aspek: 'Capaian Pembelajaran (CP) Resmi',
    konvensional: 'Buka dokumen PDF juknis ratusan halaman, scroll mencari mapel, lalu copy-paste satu per satu.',
    generatorLain: 'Tidak ada database CP resmi. Pengguna harus mencari, merangkum, dan menempelkan teks CP sendiri.',
    modulAjar: 'Database CP Resmi Otomatis (BSKAP No. 046/H/KR/2025 & Kemenag). Tinggal 1-klik pilih mapel & fase, CP terisi instan!',
    highlight: true,
  },
  {
    aspek: 'Fleksibilitas Export Prompt AI',
    konvensional: 'Rancang prompt sendiri dari nol di AI lain, sering gagal atau menghasilkan format yang tidak sesuai.',
    generatorLain: 'Terkunci di platform mereka saja. Tidak bisa menyalin prompt atau menggunakan AI eksternal.',
    modulAjar: '1-Klik Export Prompt Berkualitas Tinggi. Bebas dipakai langsung di Claude, Gemini, atau ChatGPT secara gratis!',
    highlight: true,
  },
  {
    aspek: 'Waktu Pembuatan 1 Set Perangkat',
    konvensional: '3 – 6 Jam per modul ajar (mengetik manual, mencari materi, menyusun lembar kerja & rubrik).',
    generatorLain: '15 – 30 Menit (hanya teks mentah di layar, layout masih berantakan dan butuh diedit ulang).',
    modulAjar: '< 2 Menit Instan (Modul/RPM, LKPD, Asesmen, Bank Soal, dan Bahan Ajar langsung tersaji lengkap).',
  },
  {
    aspek: 'Kepatuhan Regulasi Terbaru',
    konvensional: 'Perlu riset manual regulasi kementerian yang dinamis dan berpotensi salah mengacu juknis lama.',
    generatorLain: 'Sering memakai format usang (K-13 atau CP awal 2022) serta rawan halusinasi elemen CP.',
    modulAjar: '100% Selaras Regulasi Resmi: BSKAP No. 046/H/KR/2025, Pembelajaran Mendalam (Deep Learning), & KBC Kemenag.',
  },
  {
    aspek: 'Format & Ekspor Word (.docx) & PDF',
    konvensional: 'Format tabel manual sering pecah atau bergeser saat dicetak ke kertas F4 atau A4.',
    generatorLain: 'Tidak ada ekspor Word berformat, hanya teks markdown polos atau file PDF tanpa kop sekolah.',
    modulAjar: '1-Klik Download Word (.docx) & PDF Siap Cetak (Standar F4/A4) lengkap dengan Kop Sekolah resmi & Lembar Pengesahan.',
  },
  {
    aspek: 'Kelengkapan Dokumen Pembelajaran',
    konvensional: 'Dibuat terpisah satu per satu: modul ajar, lembar kerja siswa, kisi-kisi, dan instrumen asesmen.',
    generatorLain: 'Hanya draf RPP ringkas. LKPD, bank soal, dan rubrik asesmen harus di-generate terpisah berulang kali.',
    modulAjar: 'Paket Lengkap 15-in-1 sekali jalan (RPM, LKPD HOTS, Asesmen Diagnostik/Formatif/Sumatif, Bank Soal C1–C6, Bahan Ajar).',
  },
  {
    aspek: 'Perencanaan Semester (Prota & Prosem)',
    konvensional: 'Hitung manual minggu efektif & distribusi JP di Excel, rawan selisih total alokasi jam pelajaran.',
    generatorLain: 'Tidak memiliki modul perencanaan semester, kalender pendidikan, maupun rubrik KKTP.',
    modulAjar: 'Otomatis Prota, Prosem Mingguan, & KKTP 4-Level Deskriptor terintegrasi pelacak target Jam Pelajaran (JP).',
  },
  {
    aspek: 'Konsistensi & Asisten Revisi AI',
    konvensional: 'Bongkar ulang dokumen manual jika ada revisi dari Kepala Sekolah atau Pengawas Pembina.',
    generatorLain: 'Regenerate acak seluruh dokumen; bagian yang sudah bagus hilang dan LKPD tidak sinkron lagi.',
    modulAjar: 'Regenerate per Tab & Asisten Edit AI per Section. Ubah hanya bagian yang diinginkan tanpa merusak bagian lain.',
  },
  {
    aspek: 'Penyimpanan & Manajemen File',
    konvensional: 'Tercecer di flashdisk atau folder komputer lokal, rawan terhapus atau terselip.',
    generatorLain: 'Hasil sekali pakai; dokumen langsung hilang jika browser tertutup tanpa sengaja.',
    modulAjar: 'Cloud Workspace Terstruktur. Tersimpan rapi per kelas/mapel & bisa digunakan kembali untuk tahun ajaran berikutnya.',
  },
];

const WA_NUMBER = '6288228511309';
const PURCHASE_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya tertarik untuk berlangganan ModulAjar.Online dengan sistem Unlimited BYOK. Mohon info lengkapnya.')}`;

export const ComparisonSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'modulAjarVsManual' | 'modulAjarVsLain'>('all');

  return (
    <section id="perbandingan" className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/30 to-background border-y border-border/40 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-2 border-primary/30 rounded-full mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs md:text-sm font-extrabold text-primary tracking-wide uppercase">
              Perbandingan Layanan
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            Kenapa <span className="text-primary underline decoration-primary/40 decoration-wavy underline-offset-4">ModulAjar.Online</span> Jauh Lebih Unggul?
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Bandingkan cara konvensional/manual, generator AI serupa di pasaran, dengan <strong>ModulAjar.Online</strong>. 
            Selisih waktu & tenaganya bisa Anda gunakan untuk mengajar dengan lebih tenang dan bermakna.
          </p>

          {/* Quick Filter for Mobile */}
          <div className="flex md:hidden items-center justify-center gap-2 mt-6 p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua Kolom
            </button>
            <button
              onClick={() => setActiveTab('modulAjarVsManual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'modulAjarVsManual'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              vs Manual
            </button>
            <button
              onClick={() => setActiveTab('modulAjarVsLain')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'modulAjarVsLain'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              vs Generator Lain
            </button>
          </div>
        </div>

        {/* Comparison Table Container */}
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px] md:min-w-full">
              <thead>
                <tr className="border-b-2 border-foreground bg-muted/60">
                  <th className="py-5 px-4 md:px-6 w-[22%] font-extrabold text-sm md:text-base text-foreground uppercase tracking-wider">
                    Aspek Perencanaan
                  </th>
                  
                  {/* Column: Konvensional */}
                  {(activeTab === 'all' || activeTab === 'modulAjarVsManual') && (
                    <th className="py-5 px-4 md:px-6 w-[25%] font-bold text-sm md:text-base text-muted-foreground border-l border-border/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive/70" />
                        <span>Cara Konvensional / Manual</span>
                      </div>
                      <span className="block text-[11px] font-normal text-muted-foreground/80 mt-0.5">
                        Ketik sendiri dari nol di Word
                      </span>
                    </th>
                  )}

                  {/* Column: Generator Lain */}
                  {(activeTab === 'all' || activeTab === 'modulAjarVsLain') && (
                    <th className="py-5 px-4 md:px-6 w-[25%] font-bold text-sm md:text-base text-muted-foreground border-l border-border/80">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Generator AI Serupa</span>
                      </div>
                      <span className="block text-[11px] font-normal text-muted-foreground/80 mt-0.5">
                        Tool kredit berbayar / prompt polos
                      </span>
                    </th>
                  )}

                  {/* Column: ModulAjar.Online (Highlighted) */}
                  <th className="py-5 px-4 md:px-6 w-[28%] font-black text-sm md:text-lg text-primary border-l-2 border-primary bg-primary/10 relative">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-primary fill-primary" />
                        <span className="text-primary font-black">ModulAjar.Online</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary text-primary-foreground rounded-full shadow-sm">
                        Unggul & Rekomendasi
                      </span>
                    </div>
                    <span className="block text-xs font-medium text-primary/80 mt-1">
                      Otomatis, BSKAP 046/2025, Unlimited BYOK
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60 text-xs md:text-sm leading-relaxed">
                {comparisonData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-muted/30 ${
                      row.highlight ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {/* Aspek */}
                    <td className="py-4 px-4 md:px-6 font-bold text-foreground align-top">
                      <div className="flex items-start gap-2">
                        {row.highlight && (
                          <span className="inline-block mt-0.5 text-primary font-bold">★</span>
                        )}
                        <span>{row.aspek}</span>
                      </div>
                    </td>

                    {/* Konvensional */}
                    {(activeTab === 'all' || activeTab === 'modulAjarVsManual') && (
                      <td className="py-4 px-4 md:px-6 text-muted-foreground border-l border-border/60 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span>{row.konvensional}</span>
                        </div>
                      </td>
                    )}

                    {/* Generator Lain */}
                    {(activeTab === 'all' || activeTab === 'modulAjarVsLain') && (
                      <td className="py-4 px-4 md:px-6 text-muted-foreground border-l border-border/60 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <span>{row.generatorLain}</span>
                        </div>
                      </td>
                    )}

                    {/* ModulAjar.Online */}
                    <td className="py-4 px-4 md:px-6 font-semibold text-foreground border-l-2 border-primary bg-primary/[0.06] align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-foreground font-medium">
                          {row.modulAjar}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Callout inside Table Card */}
          <div className="p-4 md:p-6 bg-muted/70 border-t-2 border-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-xs md:text-sm text-foreground font-semibold">
                Lebih dari <span className="text-primary font-bold">1.250+ guru</span> di seluruh Indonesia telah beralih ke ModulAjar.Online untuk menghemat waktu administrasi.
              </p>
            </div>

            <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="default"
                className="w-full sm:w-auto font-bold border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

