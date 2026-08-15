import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'ModulAjar sangat membantu saya membuat modul pembelajaran terstruktur. Hemat waktu dan hasilnya profesional!',
    name: 'Budi Santoso',
    role: 'Guru Matematika SMP',
    avatar: '👨‍🏫',
  },
  {
    quote: 'Tidak perlu lagi berjam-jam membuat LKPD. Cukup input materi, AI langsung generate dokumen berkualitas.',
    name: 'Siti Rahayu',
    role: 'Guru IPA SD',
    avatar: '👩‍🏫',
  },
  {
    quote: 'Fitur Bank Soal HOTS-nya luar biasa! Soal-soal yang dihasilkan variatif dan sesuai dengan level kognitif yang diinginkan.',
    name: 'Ahmad Fauzi',
    role: 'Guru Bahasa Indonesia SMA',
    avatar: '👨‍💼',
  },
  {
    quote: 'Sebagai guru TK, saya butuh materi yang sesuai usia anak. ModulAjar bisa menyesuaikan gaya bahasa dengan sempurna!',
    name: 'Dewi Kartika',
    role: 'Guru TK',
    avatar: '👩‍🎨',
  },
  {
    quote: 'Asesmen diagnostik, formatif, dan sumatif langsung jadi dalam satu kali generate. Sangat efisien!',
    name: 'Rudi Hermawan',
    role: 'Guru Fisika SMK',
    avatar: '👨‍🔬',
  },
  {
    quote: 'Investasi terbaik untuk produktivitas mengajar. Waktu yang tersisa bisa digunakan untuk fokus ke siswa.',
    name: 'Nur Hidayah',
    role: 'Guru Bahasa Inggris SMP',
    avatar: '👩‍💻',
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimoni" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Apa Kata Guru Indonesia?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bergabung dengan ratusan guru yang sudah menggunakan ModulAjar 
            untuk meningkatkan produktivitas mengajar.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border-2 border-foreground rounded-xl p-3 md:p-6 shadow-brutal-sm hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              {/* Quote Icon */}
              <Quote className="w-5 h-5 md:w-8 md:h-8 text-primary/30 mb-2 md:mb-4" />

              {/* Stars */}
              <div className="flex gap-0.5 md:gap-1 mb-2 md:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-xs md:text-base text-foreground mb-3 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 md:gap-3 pt-2 md:pt-4 border-t border-foreground/10">
                <div className="text-xl md:text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="text-xs md:text-base font-bold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-[10px] md:text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
