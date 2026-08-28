import { ArrowRight, Zap, FileText, BookOpen, ClipboardCheck, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WA_NUMBER = '6288228511309';
const PURCHASE_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya tertarik untuk berlangganan Paket Standar ModulAjar.Online. Mohon info cara pembayarannya.')}`;

export const HeroSection = () => {
  const scrollToFeatures = () => {
    const element = document.getElementById('fitur');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Cepat & Mudah</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Generator Dokumen{' '}
              <span className="text-primary">Pembelajaran Profesional</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Buat Modul Ajar, LKPD, Asesmen, Bank Soal, hingga Prota & Prosem 
              sesuai <strong>Kurikulum Merdeka</strong> dan <strong>KBC Kemenag</strong> — dengan fitur <strong>Edit AI</strong> dan <strong>Regenerate</strong> per bagian.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                >
                  Berlangganan Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>✓ Akses Penuh Semua Fitur</span>
              <span>✓ Export PDF & Word</span>
              <span>✓ Kurikulum Merdeka & KBC</span>
            </div>
          </div>

          {/* Right Content - App Preview Illustration */}
          <div className="relative w-full max-w-[320px] sm:max-w-sm md:max-w-none mx-auto">
            <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal p-4 sm:p-6 md:p-8">
              {/* Mock App Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-foreground/20">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm font-medium text-muted-foreground">ModulAjar Generator</span>
              </div>

              {/* Mock App Content */}
              <div className="space-y-4">
                {/* Mock Tab Bar */}
                <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                  {['Modul', 'LKPD', 'Asesmen', 'Soal', 'Materi'].map((tab, i) => (
                    <div
                      key={tab}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap border-2 ${
                        i === 0
                          ? 'bg-primary text-primary-foreground border-foreground'
                          : 'bg-muted border-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                {/* Mock Document Preview */}
                <div className="relative bg-white border-2 border-foreground/30 rounded-lg p-4">
                  {/* Edit icon */}
                  <div className="absolute top-2 right-2 w-6 h-6 bg-muted rounded flex items-center justify-center">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <div className="h-4 bg-foreground/20 rounded w-48" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-foreground/10 rounded w-full" />
                      <div className="h-3 bg-foreground/10 rounded w-4/5" />
                      <div className="h-3 bg-foreground/10 rounded w-3/5" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs text-blue-700">
                        <FileText className="w-3 h-3" />
                        Fase A
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-green-700">
                        <ClipboardCheck className="w-3 h-3" />
                        Kelas 2
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Generate & Regenerate Buttons */}
                <div className="flex justify-center gap-2">
                  <div className="px-4 py-3 bg-primary text-primary-foreground rounded-lg border-2 border-foreground shadow-brutal-sm text-sm font-bold">
                    ✨ Generate Otomatis
                  </div>
                  <div className="px-3 py-3 bg-muted text-foreground rounded-lg border-2 border-foreground/30 text-sm font-medium flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements - Hidden on mobile */}
            <div className="hidden md:block absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="hidden md:block absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
