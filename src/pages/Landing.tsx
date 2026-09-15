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

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="ModulAjar.Online - AI Generator Perangkat Ajar Kurikulum Merdeka & KBC" 
        description="Aplikasi AI pembuat Modul Ajar, RPP, LKPD, dan Asesmen otomatis. Mendukung Kurikulum Merdeka (SD/SMP/SMA) dan KBC Kemenag (MI/MTs/MA). Buat perangkat ajar secara instan dan profesional." 
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
