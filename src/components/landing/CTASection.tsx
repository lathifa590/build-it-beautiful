import { ArrowRight, Sparkles, Calendar, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WA_NUMBER = '6288228511309';
const PURCHASE_LINK_LITE = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya tertarik untuk berlangganan Paket Lite ModulAjar.Online. Mohon info cara pembayarannya.')}`;
const PURCHASE_LINK_BIASA = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya tertarik untuk berlangganan Paket Standar ModulAjar.Online. Mohon info cara pembayarannya.')}`;
const PURCHASE_LINK_PRO = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya tertarik untuk berlangganan Paket Pro ModulAjar.Online. Mohon info cara pembayarannya.')}`;

export const CTASection = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">Pilih Paket Anda</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
          Siap Menyiapkan Administrasi{' '}
          <span className="text-primary">Pembelajaran?</span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Bergabung dengan ratusan guru Indonesia yang sudah merasakan kemudahan
          membuat dokumen pembelajaran dengan AI.
        </p>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8 text-left">
          
          {/* Paket Lite */}
          <div className="flex flex-col bg-card border-2 border-foreground rounded-2xl shadow-brutal p-6 md:p-8">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-foreground">Paket Lite</h3>
              <p className="text-muted-foreground">Cocok bagi yang mau coba-coba dulu</p>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-foreground">Rp 99.000</span>
              <span className="text-sm font-bold text-muted-foreground">/ 6 bulan</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6 pb-6 border-b border-foreground/10">
              Setara dengan Rp 16.500 / bulan
            </p>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Akses 6 Bulan Penuh</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm"><strong>Mode Cepat</strong> (Modul Instan)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Modul Multi-Pertemuan</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Kurikulum Merdeka & KBC</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Update Fitur Reguler</span>
              </li>
            </ul>

            <a href={PURCHASE_LINK_LITE} target="_blank" rel="noopener noreferrer" className="block mt-auto">
              <Button
                variant="outline"
                className="w-full text-base px-6 py-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-card"
              >
                Pilih Paket Lite
              </Button>
            </a>
          </div>

          {/* Paket Standar */}
          <div className="flex flex-col bg-card border-2 border-foreground rounded-2xl shadow-brutal p-6 md:p-8">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-foreground">Paket Standar</h3>
              <p className="text-muted-foreground">Cocok untuk kebutuhan instan</p>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-foreground">Rp 149.000</span>
              <span className="text-sm font-bold text-muted-foreground">/ tahun</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6 pb-6 border-b border-foreground/10">
              Setara dengan Rp 12.400 / bulan
            </p>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Akses 1 Tahun Penuh</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm"><strong>Mode Cepat</strong> (Modul Instan)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Modul Multi-Pertemuan</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Kurikulum Merdeka & KBC</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">Update Fitur Reguler</span>
              </li>
            </ul>

            <a href={PURCHASE_LINK_BIASA} target="_blank" rel="noopener noreferrer" className="block mt-auto">
              <Button
                variant="outline"
                className="w-full text-base px-6 py-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-card"
              >
                Pilih Paket Standar
              </Button>
            </a>
          </div>

          {/* Paket Pro */}
          <div className="relative flex flex-col bg-card border-4 border-primary rounded-2xl shadow-[8px_8px_0px_0px_hsl(var(--primary))] p-6 md:p-8 transform md:-translate-y-4">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 border-2 border-foreground whitespace-nowrap">
              <Star className="w-4 h-4 fill-current" />
              Rekomendasi Utama
            </div>
            
            <div className="mb-4 pt-2">
              <h3 className="text-2xl font-bold text-foreground">Paket Pro</h3>
              <p className="text-muted-foreground">Untuk manajemen jangka panjang</p>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-foreground">Rp 197.000</span>
              <span className="text-sm font-bold text-muted-foreground">/ tahun</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6 pb-6 border-b border-foreground/10">
              Setara dengan Rp 16.400 / bulan
            </p>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm"><strong>Semua fitur Paket Standar, ditambah:</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Akses Mode Workspace</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Manajemen File Terstruktur</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Tracking Progress Prosem & JP</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Penyimpanan Dokumen Reusable</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Dukungan Prioritas</span>
              </li>
            </ul>

            <a href={PURCHASE_LINK_PRO} target="_blank" rel="noopener noreferrer" className="block mt-auto">
              <Button
                className="w-full text-base px-6 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
              >
                Pilih Paket Pro
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
