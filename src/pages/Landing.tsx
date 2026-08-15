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

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <header>
        <Navbar />
      </header>
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <WhyUsSection />
        <TestimonialsSection />
        <ProductShowcase />
        <CTASection />
      </main>
      <Footer />
      <CommunityPopup />
    </div>
  );
};

export default Landing;
