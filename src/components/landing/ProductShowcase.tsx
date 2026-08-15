import { Check, FileDown, Monitor, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PURCHASE_LINK = 'https://aidukasi.shop/checkout?id=PRD-14';

const features = [
  'Rencana Pembelajaran Mendalam (RPM)',
  'Kurikulum Merdeka & KBC Kemenag',
  'Export ke PDF & Microsoft Word',
  'Untuk TK, SD, SMP, SMA, SMK',
  'Program Tahunan (Prota) Otomatis',
  'Program Semester & Kalender Pendidikan',
  'KKTP (Rubrik Ketercapaian TP)',
  'Bank Soal dengan Level C1-C6',
  'Refleksi & Tindak Lanjut Otomatis',
  'Regenerate per Tab Dokumen',
  'Edit Manual & AI per Section',
];

export const ProductShowcase = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Screenshot/Mockup */}
          <div className="relative order-2 lg:order-1 pb-8 md:pb-0 w-full md:max-w-none mx-auto px-2 sm:px-0">
            <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b-2 border-foreground/20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground border border-foreground/20">
                    modulajar.online/app
                  </div>
                </div>
              </div>

              {/* App Screenshot Simulation */}
              <div className="p-4 md:p-6 bg-background">
                {/* Tabs */}
                <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
                  {['Modul', 'LKPD', 'Asesmen', 'Soal', 'Perencanaan'].map((tab, i) => (
                    <div
                      key={tab}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        i === 0
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tab}
                      {tab === 'Perencanaan' && (
                        <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 text-[8px] font-bold bg-primary text-primary-foreground rounded leading-none">
                          Baru
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Document Preview */}
                <div className="relative bg-white border border-foreground/20 rounded-lg p-4 md:p-6">
                  <div className="absolute top-3 right-3 w-5 h-5 bg-muted rounded flex items-center justify-center">
                    <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-center pb-4 border-b border-foreground/10">
                      <div className="text-xs text-muted-foreground mb-1">MODUL AJAR</div>
                      <div className="font-bold text-foreground">Matematika - Operasi Penjumlahan</div>
                      <div className="text-xs text-muted-foreground">Kelas 2 SD | Fase A</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="text-sm font-medium">A. Tujuan Pembelajaran</div>
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="h-2.5 bg-foreground/10 rounded w-full" />
                        <div className="h-2.5 bg-foreground/10 rounded w-4/5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="text-sm font-medium">B. Kegiatan Pembelajaran</div>
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="h-2.5 bg-foreground/10 rounded w-full" />
                        <div className="h-2.5 bg-foreground/10 rounded w-3/4" />
                        <div className="h-2.5 bg-foreground/10 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    <FileDown className="w-4 h-4" />
                    Export Word
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-2 right-2 md:-bottom-4 md:-right-4 bg-primary text-primary-foreground px-2 py-1 rounded-lg border-2 border-foreground shadow-brutal-sm text-[10px] md:text-sm font-bold">
              <div className="flex items-center gap-1 md:gap-2">
                <Monitor className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Live Preview</span>
                <span className="sm:hidden">Live</span>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
              Solusi Lengkap untuk{' '}
              <span className="text-primary">Guru Modern</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              ModulAjar menyediakan semua yang Anda butuhkan untuk menyiapkan 
              administrasi pembelajaran dengan cepat dan profesional.
            </p>

            {/* Feature List */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="text-lg px-8 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Dapatkan Akses Sekarang →
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
