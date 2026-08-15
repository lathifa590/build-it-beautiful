import { Zap, Clock, FileCheck, Brain, FileDown, BadgeCheck, Globe, Monitor } from 'lucide-react';

const reasons = [
  {
    icon: Brain,
    title: 'AI Cerdas',
    description: 'Didukung oleh Gemini 2.5 Pro, AI tercanggih dari Google untuk menghasilkan konten berkualitas tinggi.',
    highlight: 'Gemini 2.5 Pro',
  },
  {
    icon: Clock,
    title: 'Hemat Waktu',
    description: 'Buat dokumen pembelajaran lengkap dalam hitungan menit, bukan jam atau hari.',
    highlight: 'Menit, Bukan Jam',
  },
  {
    icon: FileCheck,
    title: 'Format Resmi',
    description: 'Semua dokumen sesuai dengan format resmi Kurikulum Merdeka (Kemdikbud) dan KBC (Kemenag).',
    highlight: 'Merdeka & KBC',
  },
  {
    icon: Zap,
    title: 'Deep Learning Ready',
    description: 'Modul yang dihasilkan sudah menerapkan prinsip Pembelajaran Mendalam dan HOTS.',
    highlight: 'HOTS & RPM',
  },
  {
    icon: FileDown,
    title: 'Export Siap Pakai',
    description: 'Dokumen langsung bisa diunduh dalam format Word dan PDF dengan layout yang rapi dan profesional.',
    highlight: 'Word & PDF',
  },
  {
    icon: BadgeCheck,
    title: 'Sekali Beli, Akses Selamanya',
    description: 'Cukup satu kali pembelian, akses penuh selamanya. Tidak ada biaya langganan bulanan.',
    highlight: 'Tanpa Langganan',
  },
  {
    icon: Globe,
    title: 'Berbasis Web',
    description: 'Tanpa install, tanpa download. Cukup buka browser dan langsung gunakan selama ada koneksi internet.',
    highlight: 'Tanpa Install',
  },
  {
    icon: Monitor,
    title: 'Multi-Device',
    description: 'Bisa diakses dari berbagai perangkat: laptop, tablet, maupun smartphone.',
    highlight: 'Laptop, Tablet, HP',
  },
];

export const WhyUsSection = () => {
  return (
    <section
      id="mengapa-kami"
      className="py-16 md:py-24 scroll-mt-20"
      style={{ backgroundColor: 'hsl(18, 75%, 47%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Mengapa Memilih ModulAjar?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Platform yang dirancang khusus untuk kebutuhan guru Indonesia 
            dengan teknologi AI terdepan.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                className="flex flex-col gap-2 md:gap-4 bg-card border-2 border-foreground rounded-xl p-3 md:p-5 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <div className="flex flex-col gap-1 mb-1 md:mb-2">
                    <h3 className="text-sm md:text-base font-bold text-foreground">
                      {reason.title}
                    </h3>
                    <span className="hidden md:inline-block w-fit px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">
                      {reason.highlight}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
                    {reason.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
