import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Zap, FileText, Download, ShieldCheck, ArrowRight, LayoutDashboard, BrainCircuit } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface LandingPageProps {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subheadline: string;
  showKbcBadge?: boolean;
  features?: { title: string; description: string; icon: React.ReactNode }[];
  steps?: { title: string; description: string }[];
  customContent?: React.ReactNode; // For specific sections like mapel KBC
  faqs: FAQItem[];
  schema?: string;
  ctaText?: string;
  bottomCtaText?: string;
  ctaClassName?: string;
}

export function LandingPageTemplate({
  slug,
  seoTitle,
  seoDescription,
  h1,
  subheadline,
  showKbcBadge = false,
  features,
  steps,
  customContent,
  faqs,
  schema,
  ctaText = "Buat Sekarang - Gratis",
  bottomCtaText = "Coba Gratis Sekarang",
  ctaClassName = "bg-[#111] hover:bg-[#c04a1a] text-white shadow-[3px_3px_0_#c04a1a]",
}: LandingPageProps) {
  
  const defaultFeatures = [
    {
      title: "Teknologi AI Mutakhir",
      description: "Ditenagai AI terbaru yang dilatih khusus untuk memahami kurikulum dan pedagogi pendidikan Indonesia.",
      icon: <BrainCircuit className="w-10 h-10 text-[#c04a1a] mb-4" />
    },
    {
      title: "Cepat & Otomatis",
      description: "Hemat puluhan jam kerja. Hasilkan perangkat ajar lengkap hanya dalam hitungan detik.",
      icon: <Zap className="w-10 h-10 text-[#c04a1a] mb-4" />
    },
    {
      title: "Sesuai Standar Resmi",
      description: "Format output yang langsung siap pakai dan 100% mematuhi panduan resmi pemerintah.",
      icon: <ShieldCheck className="w-10 h-10 text-[#c04a1a] mb-4" />
    }
  ];

  const displayFeatures = features || defaultFeatures;

  const defaultSteps = [
    {
      title: "Isi Identitas & Materi",
      description: "Masukkan informasi mata pelajaran, kelas, dan topik yang akan diajarkan."
    },
    {
      title: "Pilih Preferensi AI",
      description: "Sesuaikan profil siswa, metode pembelajaran, dan target capaian."
    },
    {
      title: "Generate & Unduh",
      description: "AI akan memproses dan perangkat ajar Anda siap diunduh dalam format Word (Docx)."
    }
  ];
  
  const displaySteps = steps || defaultSteps;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        canonical={slug}
        schema={schema}
      />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[var(--color-page-bg)] border-b-2 border-black">
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          {showKbcBadge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#f0fdf4] text-[#15803d] text-sm font-black mb-6 border-2 border-[#15803d] shadow-[2px_2px_0px_#15803d]">
              <CheckCircle2 className="w-5 h-5 text-[#15803d]" strokeWidth={3} />
              Sesuai SK Dirjen Pendis Kemenag (Kurikulum Berbasis Cinta)
            </div>
          )}
          
          <h1 className="text-4xl md:text-6xl font-black text-[#111] leading-[1.1] mb-6 tracking-tight">
            {h1}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/app">
              <Button size="lg" className={`h-14 px-8 text-base font-black w-full sm:w-auto border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#111] transition-all rounded-[8px] ${ctaClassName}`}>
                {ctaText} <ArrowRight className="ml-2 w-6 h-6 stroke-[3]" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Custom Content Section (if any) */}
      {customContent && (
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-4 max-w-5xl">
            {customContent}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-[#ffffff]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-[#111] mb-4">Fitur Unggulan</h2>
            <p className="text-[#333] font-medium max-w-2xl mx-auto">Dirancang khusus untuk memudahkan administrasi guru.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {displayFeatures.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-[10px] p-8 border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:-translate-y-1 hover:shadow-[5px_5px_0_#111] transition-all">
                {feature.icon}
                <h3 className="text-xl font-black text-[#111] mb-3">{feature.title}</h3>
                <p className="text-[#111] font-medium leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-[#111] text-white border-b-2 border-black">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Cara Kerja 3 Langkah Mudah</h2>
            <p className="text-gray-300 font-medium">Tidak perlu prompt engineering yang rumit.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[3px] bg-[#333] -translate-y-1/2 z-0" />
            
            {displaySteps.map((step, idx) => (
              <div key={idx} className="relative z-10 text-center">
                <div className="w-16 h-16 bg-[#c04a1a] rounded-[8px] border-2 border-white flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-[4px_4px_0_#fff]">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-black mb-3">{step.title}</h3>
                <p className="text-gray-300 font-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Output Example Section */}
      <section className="py-24 bg-[#f5f0e8] overflow-hidden border-b-2 border-black">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-[#111] mb-6">Hasil Output Profesional & Siap Cetak</h2>
              <p className="text-[#333] font-medium text-lg mb-6 leading-relaxed">
                Dokumen yang dihasilkan sudah tertata rapi dalam format tabel dan narasi yang sesuai dengan standar nasional. Anda bisa langsung mengunduhnya dalam format Word (.docx) untuk disunting lebih lanjut jika diperlukan.
              </p>
              <ul className="space-y-4">
                {[
                  "Beragam pilihan format (Tabel, Ringkasan, Modular)",
                  "Otomatis menyertakan rubrik penilaian",
                  "Mendukung lampiran materi dan instrumen",
                  "Kompatibel penuh dengan Microsoft Word"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#c04a1a] mt-1 flex-shrink-0" strokeWidth={3} />
                    <span className="text-[#111] font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-[#fff3ed] border-[2.5px] border-[#111] rounded-[10px] transform rotate-3 scale-105 -z-10 shadow-[4px_4px_0_#111]" />
              <div className="bg-[#ffffff] border-[2.5px] border-[#111] rounded-[10px] shadow-[4px_4px_0_#111] overflow-hidden p-2">
                 {/* Placeholder mockup for output preview */}
                 <div className="bg-[#fafafa] rounded-[6px] p-6 pb-20 border-[2px] border-[#111] relative">
                    <div className="h-4 w-3/4 bg-[#e5e7eb] rounded-[4px] mb-4" />
                    <div className="h-4 w-1/2 bg-[#e5e7eb] rounded-[4px] mb-8" />
                    <div className="h-32 w-full bg-[#ffffff] border-[2px] border-[#111] rounded-[6px] mb-4 shadow-[2px_2px_0_#111]" />
                    <div className="h-24 w-full bg-[#ffffff] border-[2px] border-[#111] rounded-[6px] shadow-[2px_2px_0_#111]" />
                    
                    <div className="absolute bottom-4 right-4 bg-[#ffffff] px-4 py-2 rounded-[6px] border-[2.5px] border-[#111] flex items-center gap-2 text-sm font-bold text-[#111] shadow-[2px_2px_0_#111]">
                      <Download className="w-4 h-4 text-[#111]" /> document.docx
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#ffffff] border-b-2 border-black">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#111] mb-4">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-[#ffffff] rounded-[10px] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111]">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="px-6 border-b-2 border-[#111] last:border-b-0">
                <AccordionTrigger className="text-left font-black text-[#111] hover:text-[#c04a1a] hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#333] font-medium leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#c04a1a] border-b-2 border-black">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-black text-[#ffffff] mb-6 drop-shadow-[2px_2px_0_#111]">Mulai Buat Perangkat Ajar Anda Sekarang</h2>
          <p className="text-[#fff3ed] font-medium text-lg mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan guru lainnya yang telah menghemat waktu administrasi dan fokus pada apa yang paling penting: mengajar.
          </p>
          <Link to="/app">
            <Button size="lg" className="h-14 px-10 text-lg font-black bg-[#ffffff] text-[#111] hover:bg-[#fff3ed] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#111] transition-all rounded-[8px]">
              {bottomCtaText}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
