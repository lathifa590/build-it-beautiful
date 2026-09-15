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
}: LandingPageProps) {
  
  const defaultFeatures = [
    {
      title: "Teknologi AI Mutakhir",
      description: "Ditenagai AI terbaru yang dilatih khusus untuk memahami kurikulum dan pedagogi pendidikan Indonesia.",
      icon: <BrainCircuit className="w-10 h-10 text-indigo-600 mb-4" />
    },
    {
      title: "Cepat & Otomatis",
      description: "Hemat puluhan jam kerja. Hasilkan perangkat ajar lengkap hanya dalam hitungan detik.",
      icon: <Zap className="w-10 h-10 text-amber-500 mb-4" />
    },
    {
      title: "Sesuai Standar Resmi",
      description: "Format output yang langsung siap pakai dan 100% mematuhi panduan resmi pemerintah.",
      icon: <ShieldCheck className="w-10 h-10 text-emerald-600 mb-4" />
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
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 -z-10" />
        
        {/* Background shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl -z-10 opacity-60" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60" />

        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          {showKbcBadge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              Satu-satunya AI yang support KBC + Kurikulum Merdeka
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
            {h1}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/app">
              <Button size="lg" className="h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-lg shadow-indigo-200">
                Buat Sekarang - Gratis <ArrowRight className="ml-2 w-5 h-5" />
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Fitur Unggulan</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Dirancang khusus untuk memudahkan administrasi guru.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {displayFeatures.map((feature, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-md transition-shadow">
                {feature.icon}
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Cara Kerja 3 Langkah Mudah</h2>
            <p className="text-slate-400">Tidak perlu prompt engineering yang rumit.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            
            {displaySteps.map((step, idx) => (
              <div key={idx} className="relative z-10 text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-xl shadow-indigo-900/50">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Output Example Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Hasil Output Profesional & Siap Cetak</h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
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
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-emerald-50 rounded-2xl transform rotate-3 scale-105 -z-10" />
              <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-2">
                 {/* Placeholder mockup for output preview */}
                 <div className="bg-slate-100 rounded-lg p-6 pb-20 border border-slate-200 relative shadow-inner">
                    <div className="h-4 w-3/4 bg-slate-200 rounded mb-4" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded mb-8" />
                    <div className="h-32 w-full bg-white border border-slate-300 rounded mb-4" />
                    <div className="h-24 w-full bg-white border border-slate-300 rounded" />
                    
                    <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow border border-slate-200 flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Download className="w-4 h-4 text-indigo-600" /> document.docx
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm border border-slate-200">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="px-6">
                <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-indigo-600 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Mulai Buat Perangkat Ajar Anda Sekarang</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan guru lainnya yang telah menghemat waktu administrasi dan fokus pada apa yang paling penting: mengajar.
          </p>
          <Link to="/app">
            <Button size="lg" className="h-14 px-10 text-lg bg-white text-indigo-600 hover:bg-slate-50 shadow-xl">
              Coba Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
