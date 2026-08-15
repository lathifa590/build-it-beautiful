import { ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PURCHASE_LINK = 'https://aidukasi.shop/checkout?id=PRD-14';

export const CTASection = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">Mulai Sekarang</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
          Siap Menyiapkan Administrasi{' '}
          <span className="text-primary">Pembelajaran?</span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Bergabung dengan ratusan guru Indonesia yang sudah merasakan kemudahan
          membuat dokumen pembelajaran dengan AI.
        </p>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-8 bg-card border-2 border-foreground rounded-2xl shadow-brutal p-6 md:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-primary/30 rounded-full mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              Langganan Tahunan
            </span>
          </div>
          <div className="flex items-baseline justify-center gap-2 mb-2 flex-nowrap">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground whitespace-nowrap leading-none">
              Rp 149.000
            </span>
            <span className="text-base sm:text-lg font-bold text-muted-foreground whitespace-nowrap">/ tahun</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Setara dengan <strong className="text-foreground">Rp 12.500 / bulan</strong> —
            akses penuh semua fitur selama 12 bulan.
          </p>

          <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              size="lg"
              className="w-full text-lg md:text-xl px-10 py-7 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-3"
            >
              Berlangganan Sekarang
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Akses 1 Tahun Penuh</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Update Gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Dukungan Penuh</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Kurikulum Merdeka & KBC</span>
          </div>
        </div>
      </div>
    </section>
  );
};
