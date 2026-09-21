import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { WhyUsSection } from '@/components/landing/WhyUsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { CommunityPopup } from '@/components/landing/CommunityPopup';
import { FAQSection } from '@/components/landing/FAQSection';
import { CurriculumSection } from '@/components/landing/CurriculumSection';
import { SEOHead } from '@/components/seo/SEOHead';

const landingSchema = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ModulAjar.Online",
    "url": "https://modulajar.online",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://modulajar.online/blog?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ModulAjar.Online - Generator Modul Ajar AI",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "description": "Generator Modul Ajar AI & RPP Kurikulum Merdeka otomatis. Menyusun Modul Ajar, LKPD, Asesmen, Prota & Promes, dan KBC Kemenag dalam hitungan detik.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1250"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Apa itu ModulAjar.Online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Platform berbasis AI cerdas (Gemini 2.5 Pro) untuk membantu guru menyusun administrasi pembelajaran sesuai format Kurikulum Merdeka dan KBC secara instan."
        }
      },
      {
        "@type": "Question",
        "name": "Apa bedanya Mode Cepat dan Mode Workspace?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pilih Mode Cepat jika Anda sedang buru-buru, butuh Modul Ajar dadakan untuk mengajar besok. Pilih Mode Workspace untuk merencanakan pembelajaran satu semester penuh, memantau target JP, dan menyimpan dokumen di cloud."
        }
      },
      {
        "@type": "Question",
        "name": "Apakah aplikasi ini perlu di-install?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tidak perlu! ModulAjar.Online 100% berbasis cloud (web). Anda bisa mengaksesnya kapan saja dari laptop, tablet, atau smartphone (HP) tanpa perlu mengunduh atau menginstal apapun."
        }
      },
      {
        "@type": "Question",
        "name": "Apakah format yang dihasilkan sudah sesuai aturan resmi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ya, seluruh dokumen dirancang menyesuaikan regulasi terbaru Kurikulum Merdeka (Kemdikbudristek), pendekatan Pembelajaran Mendalam (Deep Learning), dan KBC (Kemenag)."
        }
      },
      {
        "@type": "Question",
        "name": "Apakah dokumen bisa diedit dan diunduh?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tentu! Anda bisa mengeditnya secara manual di web, atau menggunakan AI untuk mengubah spesifik bagian. Dokumen siap di-export ke format Word (.docx) maupun PDF."
        }
      }
    ]
  }
]);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Modul Ajar Generator AI Otomatis & Kurikulum Merdeka | ModulAjar.Online" 
        description="Aplikasi Modul Ajar Generator & Pembuat RPP Otomatis dengan AI. Buat Modul Ajar Kurikulum Merdeka, Pembelajaran Mendalam (Deep Learning), LKPD, Asesmen, Prota & Promes, dan KBC Kemenag dalam hitungan detik." 
        schema={landingSchema}
      />
      <header>
        <Navbar />
      </header>
      <main>
        <HeroSection />
        <CurriculumSection />
        <StatsSection />
        <FeaturesSection />
        <WhyUsSection />
        <TestimonialsSection />
        <ProductShowcase />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <CommunityPopup />
    </div>
  );
};

export default Landing;
