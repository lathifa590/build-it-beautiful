import { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  Calculator,
  TrendingUp,
  ShieldCheck,
  Clock,
  MessageCircle,
  Users,
  Award,
  Wallet,
  Coins,
  CheckCircle2,
  FileText,
  BookOpen,
  Zap,
  HelpCircle,
  Share2,
  Laptop,
  Flame,
  PhoneCall,
  ExternalLink,
  Percent,
  Info,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const WA_NUMBER = '6288228511309';

const REGULAR_SUBSCRIBE_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  'Halo Admin ModulAjar.Online 👋\n\nSaya tertarik untuk berlangganan Paket Standar ModulAjar.Online (Rp 149.000/thn) terlebih dahulu sebelum mendaftar lisensi agency.\n\nMohon info nomor rekening pembayarannya ya. Terima kasih!'
)}`;

interface AgencyPackageData {
  id: string;
  name: string;
  buttonText: string;
  quota: number;
  priceIdr: number;
  costPerAccount: number;
  recommendedRetail: number;
  sellSlots: number;
  netProfitAtStandard: number;
  tag?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  idealFor: string;
}

const PACKAGES: AgencyPackageData[] = [
  {
    id: 'starter',
    name: 'Starter',
    buttonText: 'BELI STARTER MODULAJAR',
    quota: 10,
    priceIdr: 349000,
    costPerAccount: 34900,
    recommendedRetail: 149000,
    sellSlots: 9,
    netProfitAtStandard: 993000,
    idealFor: 'Pemula yang ingin mencoba pasar di 1-2 sekolah atau rekan satu gugus KKG/MGMP.',
  },
  {
    id: 'advance',
    name: 'Advance',
    buttonText: 'BELI ADVANCE MODULAJAR',
    quota: 30,
    priceIdr: 849000,
    costPerAccount: 28300,
    recommendedRetail: 149000,
    sellSlots: 29,
    netProfitAtStandard: 3472000,
    tag: 'Paling Populer',
    isPopular: true,
    idealFor: 'Guru aktif di MGMP/KKG, kemitraan satu sekolah penuh, atau komunitas pendidik lokal.',
  },
  {
    id: 'master',
    name: 'Master',
    buttonText: 'BELI MASTER MODULAJAR',
    quota: 60,
    priceIdr: 1499000,
    costPerAccount: 24983,
    recommendedRetail: 149000,
    sellSlots: 59,
    netProfitAtStandard: 7292000,
    tag: 'BEST VALUE',
    isBestValue: true,
    idealFor: 'Penyelenggara webinar guru, yayasan sekolah berjejaring, atau distributor skala komunitas besar.',
  },
];

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

const getWaOrderLink = (pkg: AgencyPackageData) => {
  const text = `Halo Admin ModulAjar.Online 👋\n\nSaya ingin memesan Lisensi Agency Resmi:\n\n*Paket: ${pkg.name} (${pkg.quota} Slot Paket Standar)*\n- Investasi: ${formatIDR(pkg.priceIdr)}\n- Modal per Slot: ${formatIDR(pkg.costPerAccount)}/akun\n- Lisensi yang dijual: Paket Standar ModulAjar.Online (Rp 149.000/thn)\n- Estimasi Profit (Jual ${pkg.sellSlots} slot @Rp149rb): +${formatIDR(pkg.netProfitAtStandard)}\n- Catatan: Saya sudah memiliki akun/akses aktif ke ModulAjar.Online\n\nMohon info nomor rekening pembayaran dan cara aktivasi Dashboard Agency. Terima kasih!`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
};

const getWaConsultLink = () => {
  const text = `Halo Admin ModulAjar.Online 👋\n\nSaya ingin konsultasi mengenai Program Kemitraan Lisensi Agency ModulAjar.Online.\nMohon informasi lengkapnya ya. Terima kasih!`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
};

const FAQ_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Apakah saya harus sudah punya akun ModulAjar.Online sebelum membeli lisensi Agency?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ya, benar! Syarat wajib menjadi mitra Agency adalah Anda harus sudah memiliki akun dan akses aktif ke ModulAjar.Online. Jika belum memiliki akses, Anda harus berlangganan terlebih dahulu (Paket Standar) agar Anda sudah mencoba, memahami, dan percaya diri mendemokan ke rekan guru.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hak akses paket apa yang dijual ke rekan guru pembeli?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hak akses yang dijual adalah Paket Standar ModulAjar.Online (1 Tahun Penuh) senilai harga resmi Rp 149.000/tahun — bukan paket Lite atau Paket Pro.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa harga paket lisensi agency ModulAjar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tersedia 3 paket resmi: Starter (10 Slot - Rp 349.000, profit +Rp 993.000), Advance (30 Slot - Rp 849.000, profit +Rp 3.472.000), dan Master (60 Slot - Rp 1.499.000, profit +Rp 7.292.000).',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah kuota lisensi yang saya beli memiliki masa kedaluwarsa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tidak ada kedaluwarsa (No Expiry). Kuota lisensi yang Anda beli tersimpan permanen di Dashboard Agency Anda dan tidak akan hangus hingga Anda mengaktifkannya ke pengguna.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa lama masa aktif akun untuk guru yang saya aktivasi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Setiap akun guru yang diaktivasi akan mendapatkan masa aktif Paket Standar selama 1 Tahun Penuh (365 hari) sejak tanggal Anda melakukan aktivasi di Dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana cara mengaktifkan akun guru pembeli?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sangat praktis. Anda cukup login ke Dashboard Agency Anda dari HP atau laptop, masukkan email rekan guru, lalu klik aktivasi. Akun rekan guru langsung aktif otomatis dalam 5 detik.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah disediakan materi promosi dan panduan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ya! Pemilik lisensi agency mendapatkan materi promosi lengkap: flyer digital, video demo fitur, template pesan WhatsApp siap broadcast, dan panduan lengkap.',
      },
    },
  ],
});

export default function PaketAgencyPage() {
  // Calculator State
  const [calcQuota, setCalcQuota] = useState<number>(30);
  const [calcSellingPrice, setCalcSellingPrice] = useState<number>(149000);
  const [useOneSlotSelf, setUseOneSlotSelf] = useState<boolean>(true);

  // Derive package matching calculator quota or interpolate
  const matchingPkg =
    PACKAGES.find((p) => p.quota === calcQuota) ||
    PACKAGES.reduce((prev, curr) =>
      Math.abs(curr.quota - calcQuota) < Math.abs(prev.quota - calcQuota) ? curr : prev
    );

  const totalCost = matchingPkg.priceIdr * (calcQuota / matchingPkg.quota);
  const costPerUnit = totalCost / calcQuota;
  const soldSlots = useOneSlotSelf ? Math.max(1, calcQuota - 1) : calcQuota;
  const totalRevenue = soldSlots * calcSellingPrice;
  const totalProfit = Math.max(0, totalRevenue - totalCost);
  const profitMarginPercent = totalCost > 0 ? Math.round((totalProfit / totalCost) * 100) : 0;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Paket Lisensi Agency & Reseller Resmi — ModulAjar.Online"
        description="Peluang Bisnis AI Pendidikan: Miliki Lisensi Agency ModulAjar.Online. Beli kuota slot Paket Standar harga grosir mulai Rp 24.900/slot (10, 30, 60 Slot), aktivasi instan dari HP, dan raup margin cuan hingga 480%+ tanpa ganggu jam mengajar."
        canonical="/paketagency"
        schema={FAQ_SCHEMA}
      />
      <Navbar />

      {/* ============ HERO SECTION ============ */}
      <section className="relative py-14 md:py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-2 border-amber-500/40 rounded-full text-foreground shadow-brutal-sm">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-amber-700">
                  Peluang Bisnis AI Pendidikan #1
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.15]">
                Kelola Akses AI untuk Sesama Guru, Kantongi Selisihnya —{' '}
                <span className="text-primary underline decoration-wavy decoration-primary/40">
                  Tanpa Ganggu Jam Mengajar
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Miliki <strong>Lisensi Agency Resmi ModulAjar.Online</strong>. Beli kuota slot{' '}
                <strong className="text-foreground">Paket Standar</strong> dengan harga khusus agency, kelola dari HP,
                dan jual kembali ke sesama guru —{' '}
                <strong className="text-foreground">sambil tetap mengajar seperti biasa</strong>.
              </p>

              {/* Requirement Alert Pill */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2.5 max-w-xl mx-auto lg:mx-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Syarat Kemitraan:</strong> Calon agency wajib sudah memiliki akun/akses aktif ke ModulAjar.Online. (Hak akses yang dijual adalah <strong>Paket Standar</strong>).
                </span>
              </div>

              {/* Trust Value Points */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-left">
                <div className="bg-card border-2 border-foreground/30 p-2.5 rounded-lg shadow-brutal-sm">
                  <div className="text-xs text-muted-foreground font-semibold">Modal Mulai</div>
                  <div className="text-base font-black text-primary">Rp 24.900<span className="text-xs font-normal">/slot</span></div>
                </div>
                <div className="bg-card border-2 border-foreground/30 p-2.5 rounded-lg shadow-brutal-sm">
                  <div className="text-xs text-muted-foreground font-semibold">Potensi Margin</div>
                  <div className="text-base font-black text-emerald-600">Hingga 480%+</div>
                </div>
                <div className="bg-card border-2 border-foreground/30 p-2.5 rounded-lg shadow-brutal-sm">
                  <div className="text-xs text-muted-foreground font-semibold">Aktivasi Mandiri</div>
                  <div className="text-base font-black text-foreground">5 Detik dari HP</div>
                </div>
                <div className="bg-card border-2 border-foreground/30 p-2.5 rounded-lg shadow-brutal-sm">
                  <div className="text-xs text-muted-foreground font-semibold">Masa Aktif Kuota</div>
                  <div className="text-base font-black text-amber-600">Tanpa Kedaluwarsa</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => scrollTo('paket')}
                  className="text-base md:text-lg px-8 py-6 font-bold border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                >
                  Lihat Paket Lisensi Agency
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <a href={getWaConsultLink()} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base md:text-lg px-7 py-6 font-bold border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    Konsultasi via WhatsApp
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs md:text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Akses Dashboard Agency
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Materi Promosi Siap Pakai
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lisensi Paket Standar 1 Tahun
                </span>
              </div>
            </div>

            {/* Right Content - Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow accent */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-amber-500 rounded-2xl blur-lg opacity-30" />

                <div className="relative bg-card border-3 border-foreground rounded-2xl shadow-brutal p-5 sm:p-6 space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b-2 border-foreground/20 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center border-2 border-foreground shadow-brutal-sm text-sm">
                        MA
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          Dashboard Agency Resmi
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            Aktif
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">ModulAjar.Online Partner System</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Status Lisensi</div>
                      <div className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-end">
                        <Award className="w-3.5 h-3.5" /> Mitra Resmi
                      </div>
                    </div>
                  </div>

                  {/* Quota Highlights */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
                      <div className="text-[11px] font-bold text-muted-foreground">Sisa Kuota</div>
                      <div className="text-xl font-black text-primary">30</div>
                      <div className="text-[10px] text-muted-foreground">Slot Standar</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[11px] font-bold text-emerald-800">Teraktivasi</div>
                      <div className="text-xl font-black text-emerald-700">22</div>
                      <div className="text-[10px] text-emerald-600">Guru Aktif</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-[11px] font-bold text-amber-800">Laba Terkumpul</div>
                      <div className="text-base font-black text-amber-700 mt-1">Rp 2.42Jt</div>
                      <div className="text-[10px] text-amber-600">Margin Bersih</div>
                    </div>
                  </div>

                  {/* Interactive Mock Invite Form */}
                  <div className="p-4 bg-muted/50 rounded-xl border-2 border-foreground/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Aktivasi Cepat Guru Baru (5 Detik)
                      </span>
                      <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded">
                        Otomatis
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-muted-foreground">Email Rekan Guru:</div>
                      <div className="bg-background border-2 border-foreground/30 rounded-lg px-3 py-2 text-xs text-foreground font-mono">
                        guru.smpn1@gmail.com
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Hak Akses yang Diaktifkan:</span>
                      <span className="font-extrabold text-foreground">Paket Standar 1 Tahun</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollTo('paket')}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-lg text-xs border-2 border-foreground shadow-brutal-sm flex items-center justify-center gap-2 transition-transform active:translate-y-0.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Aktifkan Lisensi Paket Standar Guru
                    </button>
                  </div>

                  {/* Trust Footer */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-foreground/10">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Legal &amp; Resmi Terdaftar
                    </span>
                    <span>Modul Ajar • Kurikulum Merdeka &amp; KBC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PAIN POINTS / REALITY SECTION ============ */}
      <section className="py-16 md:py-24 bg-muted/30 border-y-2 border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              Lihat Kenyataan Yang Terjadi di Lapangan
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Kenapa Menjadi Reseller ModulAjar Adalah Peluang Emas?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Banyak rekan guru di sekitar Anda yang kewalahan dan butuh bantuan, namun belum menemukan solusi yang tepat dan terpercaya.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal hover:shadow-brutal-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border-2 border-foreground flex items-center justify-center text-rose-600">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Gaji Tidak Sebanding</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bekerja lebih dari jam kerja normal, tapi gaji guru di Indonesia banyak yang masih pas-pasan. Kebutuhan hidup terus naik, tapi penghasilan diam di tempat.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal hover:shadow-brutal-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-foreground flex items-center justify-center text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Beban Administrasi Melelahkan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Setiap semester, guru wajib menyusun Modul Ajar berpuluh-puluh lembar, LKPD, rubrik asesmen, serta Prota &amp; Promes. Waktu habis untuk ketik dokumen, bukan mengajar.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal hover:shadow-brutal-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 border-2 border-foreground flex items-center justify-center text-blue-600">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Guru Gaptek &amp; Butuh Panduan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Banyak rekan guru yang ingin memanfaatkan teknologi AI, tapi bingung cara berlangganan atau takut salah. Mereka jauh lebih percaya membeli lewat rekan guru di sekolahnya!
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal hover:shadow-brutal-hover transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border-2 border-foreground flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Pasar Jutaan Guru Terbuka</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lebih dari 3,3 juta guru di Indonesia membutuhkan perangkat ajar setiap tahunnya. Kebutuhan ini bersifat rutin, berulang, dan selalu dicari menjelang tahun ajaran baru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS / THE AGENCY SOLUTION ============ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              Model Bisnis Sangat Sederhana
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Bagaimana Anda Menghasilkan Uang dari Lisensi Agency?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Tidak perlu pengalaman teknis. Tidak perlu pusing coding atau server. Semuanya sudah kami siapkan, Anda tinggal mengelola kuota dan menerima transferan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-card border-2 border-foreground rounded-2xl p-7 shadow-brutal relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
                1
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Sudah Punya Akun &amp; Beli Slot Grosir</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pastikan Anda telah memiliki akun/akses aktif ke ModulAjar.Online (jika belum, silakan langganan dulu). Pilih paket lisensi agency (10, 30, atau 60 Slot Paket Standar). Modal mulai dari <strong>Rp 24.900/slot</strong>.
              </p>
              <div className="bg-muted p-3 rounded-lg text-xs font-semibold text-foreground">
                ✓ Kuota slot tidak ada masa kadaluarsa (bebas dijual kapan saja)
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border-2 border-foreground rounded-2xl p-7 shadow-brutal relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-background font-black text-xl flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
                2
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Tawarkan ke Rekan Guru / Sekolah</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gunakan materi promosi, flyer resmi, dan template broadcast WhatsApp yang telah kami sediakan. Anda menjual hak akses resmi <strong>Paket Standar (Rp 149.000/thn)</strong>.
              </p>
              <div className="bg-muted p-3 rounded-lg text-xs font-semibold text-foreground">
                ✓ Rekan guru langsung transfer uangnya ke rekening pribadi Anda
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border-2 border-foreground rounded-2xl p-7 shadow-brutal relative space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-background font-black text-xl flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
                3
              </div>
              <h3 className="text-xl font-extrabold text-foreground">Aktivasi Instan &amp; Kantongi Selisih</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Buka Dashboard Agency dari ponsel Anda, masukkan email rekan guru, dan klik aktivasi. Akun rekan guru langsung aktif Paket Standar selama 1 tahun penuh, dan 100% selisih keuntungan milik Anda!
              </p>
              <div className="bg-muted p-3 rounded-lg text-xs font-semibold text-foreground">
                ✓ Aktivasi instan 5 detik tanpa perlu konfirmasi manual lagi
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROFIT CALCULATOR SECTION ============ */}
      <section id="kalkulator" className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background border-y-2 border-foreground/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Simulasi Keuntungan Interaktif
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Hitung Potensi Cuan Bersih Anda
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Pilih jumlah slot Paket Standar dan sesuaikan simulasi penjualan untuk melihat proyeksi keuntungan nyata yang masuk ke rekening Anda.
            </p>
          </div>

          <div className="bg-card border-3 border-foreground rounded-2xl shadow-brutal p-6 md:p-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Controls */}
              <div className="space-y-6">
                {/* Select Package Quota */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>1. Pilih Jumlah Slot Paket Standar:</span>
                    <span className="text-primary font-black text-base">{calcQuota} Slot Standar</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 30, 60].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setCalcQuota(q)}
                        className={`py-2.5 px-3 rounded-xl font-extrabold text-sm border-2 transition-all ${
                          calcQuota === q
                            ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm scale-102'
                            : 'bg-background hover:bg-muted border-foreground/30 text-foreground'
                        }`}
                      >
                        {q} Slot
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Harga modal agency: <strong>{formatIDR(matchingPkg.priceIdr)}</strong> (hanya {formatIDR(matchingPkg.costPerAccount)}/slot)
                  </div>
                </div>

                {/* Toggle: Pakai 1 slot sendiri? */}
                <div className="p-3 bg-muted/60 rounded-xl border border-foreground/20 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">1 Slot Digunakan Sendiri</div>
                    <div className="text-muted-foreground">
                      {useOneSlotSelf ? `Jual ${calcQuota - 1} slot ke rekan guru` : `Jual seluruh ${calcQuota} slot`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseOneSlotSelf(!useOneSlotSelf)}
                    className={`px-3 py-1.5 rounded-lg font-bold border-2 text-xs transition-all ${
                      useOneSlotSelf
                        ? 'bg-emerald-600 text-white border-foreground'
                        : 'bg-background text-foreground border-foreground/40'
                    }`}
                  >
                    {useOneSlotSelf ? 'Ya (Rekomendasi)' : 'Tidak (Jual Semua)'}
                  </button>
                </div>

                {/* Slider Selling Price */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-foreground">
                      2. Rencana Harga Jual per Akun (Paket Standar):
                    </label>
                    <span className="text-base font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                      {formatIDR(calcSellingPrice)} <span className="text-xs font-normal">/thn</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min={100000}
                    max={200000}
                    step={1000}
                    value={calcSellingPrice}
                    onChange={(e) => setCalcSellingPrice(Number(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />

                  <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>Rp 100.000 (Harga Promo)</span>
                    <span className="text-foreground font-bold">Rp 149.000 (Harga Resmi Standar)</span>
                    <span>Rp 200.000 (Bundling Bimtek)</span>
                  </div>
                </div>
              </div>

              {/* Live Result Display */}
              <div className="bg-foreground text-background rounded-2xl p-6 md:p-8 space-y-6 border-2 border-foreground shadow-brutal-sm">
                <div className="border-b border-background/20 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-background/70">
                    Estimasi Keuntungan Bersih (Profit)
                  </span>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 mt-1">
                    +{formatIDR(totalProfit)}
                  </div>
                  <div className="text-xs text-background/80 mt-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Margin Keuntungan: <strong className="text-emerald-400 font-extrabold">{profitMarginPercent}%</strong>
                    <span className="text-[11px] text-background/60">({soldSlots} slot terjual)</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-background/80">
                    <span>Investasi Paket ({calcQuota} Slot):</span>
                    <span className="font-bold text-background">{formatIDR(totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-background/80">
                    <span>Modal per Slot:</span>
                    <span className="font-bold text-background">{formatIDR(costPerUnit)}</span>
                  </div>
                  <div className="flex justify-between items-center text-background/80">
                    <span>Total Omset ({soldSlots} x {formatIDR(calcSellingPrice)}):</span>
                    <span className="font-bold text-emerald-400">{formatIDR(totalRevenue)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => scrollTo('paket')}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-foreground font-black text-base py-6 border-2 border-background shadow-brutal-sm"
                >
                  Ambil Paket {calcQuota} Slot Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY MODULAJAR IS EASY TO SELL ============ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              Kualitas Produk #1 di Kalangan Pendidik
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Kenapa ModulAjar.Online Sangat Mudah &amp; Cepat Laris?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Anda tidak menjual produk kaleng-kaleng. Guru-guru langsung merasakan manfaat nyata dalam 10 detik pertama pemakaian.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-foreground flex items-center justify-center text-primary font-black">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Generator Modul Ajar Terlengkap</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Menyusun Modul Ajar Multi-Pertemuan atau Mode Cepat dalam hitungan detik. Tersedia identitas sekolah, tujuan pembelajaran, asesmen, hingga lampiran materi.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border-2 border-foreground flex items-center justify-center text-emerald-700 font-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Sesuai Regulasi Terkini</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mendukung standar resmi <strong>Kurikulum Merdeka (Kemdikbudristek)</strong>, pendekatan <strong>Pembelajaran Mendalam (Deep Learning)</strong>, serta <strong>KBC Kemenag</strong> untuk madrasah.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 border-2 border-foreground flex items-center justify-center text-amber-700 font-black">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">LKPD, Asesmen &amp; Prota Promes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bukan cuma modul ajar! Termasuk generator Lembar Kerja Peserta Didik (LKPD), kisi-kisi dan rubrik asesmen, serta kalkulator Prota &amp; Promes otomatis berdasarkan kalender.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 border-2 border-foreground flex items-center justify-center text-blue-700 font-black">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Fitur AI Edit &amp; Regenerate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Guru bisa mengubah dan menyempurnakan bagian tertentu dokumen semudah mengetik pesan. Tambahkan diferensiasi, sesuaikan kegiatan apersepsi, atau ganti rubrik nilai instan.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-foreground flex items-center justify-center text-purple-700 font-black">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Export Microsoft Word &amp; PDF</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dokumen langsung siap diunduh ke format .DOCX dengan format tabel rapi, font standar dinas, dan kop surat sekolah. Tinggal cetak atau simpan ke Google Drive.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 border-2 border-foreground flex items-center justify-center text-rose-700 font-black">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Akses Mudah dari HP Tanpa Install</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                100% berbasis website cloud responsif. Guru bisa menyusun modul santai lewat ponsel saat jeda istirahat maupun lewat laptop saat di ruang guru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING PACKAGES SECTION ============ */}
      <section id="paket" className="py-16 md:py-24 bg-muted/40 border-y-2 border-foreground/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              Pilihan Lisensi Resmi Agency
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Paket Lisensi Agency ModulAjar
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Miliki hak akses Dashboard Agency resmi, aktivasi instan 5 detik, materi promosi siap pakai, dan kuota slot aktif permanen tanpa masa hangus.
            </p>
          </div>

          {/* ============ PREREQUISITE WARNING BANNER ============ */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-5 md:p-6 shadow-brutal-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-foreground font-black flex items-center justify-center shrink-0 border-2 border-foreground shadow-sm">
                  <AlertCircle className="w-6 h-6 text-black" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-black text-foreground text-base flex items-center gap-2">
                    ⚠️ Syarat Wajib Calon Mitra Agency:
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Untuk mendaftar sebagai mitra Agency, Anda <strong>harus sudah memiliki akun &amp; akses aktif ke ModulAjar.Online</strong>. 
                    Jika belum memiliki akses, <strong>Anda diwajibkan berlangganan terlebih dahulu</strong> agar sudah memahami dan menguasai aplikasinya sebelum merekomendasikan ke rekan guru.
                  </p>
                </div>
              </div>
              <a
                href={REGULAR_SUBSCRIBE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-full md:w-auto"
              >
                <Button
                  variant="outline"
                  className="w-full md:w-auto border-2 border-foreground bg-background hover:bg-amber-100 font-extrabold text-xs shadow-brutal-sm gap-2 whitespace-nowrap"
                >
                  Belum Punya Akses? Langganan Dulu
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Official Calculation Info Box (Matching Reference) */}
          <div className="max-w-5xl mx-auto mb-10">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-blue-900 shadow-sm">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                Hitungan profit berdasarkan <strong>harga jual resmi</strong>: ModulAjar{' '}
                <strong className="text-blue-950 underline decoration-blue-400">Paket Standar Rp 149.000/akun</strong>.
                <span className="block text-blue-800/90 text-xs mt-1">
                  (Simulasi profit dihitung dengan 1 slot untuk Anda gunakan sendiri, dan sisa slot dijual ke rekan guru).{' '}
                  <strong className="text-blue-950 font-bold">
                    Penting: Hak akses yang dijual adalah Paket Standar, bukan paket Lite atau Paket Pro.
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid (3 Cards matching user screenshot) */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-card border-3 border-foreground rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                  pkg.isBestValue
                    ? 'shadow-brutal ring-2 ring-amber-500 scale-102 lg:-translate-y-2'
                    : pkg.isPopular
                    ? 'shadow-brutal ring-2 ring-primary'
                    : 'shadow-brutal-sm hover:shadow-brutal'
                }`}
              >
                {/* Badge Best Value */}
                {pkg.tag && (
                  <div className="absolute -top-3.5 right-6">
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border-2 border-foreground shadow-brutal-sm flex items-center gap-1 ${
                        pkg.isBestValue
                          ? 'bg-amber-400 text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {pkg.isBestValue && <Award className="w-3.5 h-3.5" />}
                      {pkg.tag}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-foreground/15 pb-3">
                    <div>
                      <h3 className="text-xl font-black text-foreground">{pkg.name}</h3>
                      <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                        Lisensi Paket Standar
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {pkg.quota} Slot
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="text-3xl sm:text-4xl font-black text-blue-600">
                      {formatIDR(pkg.priceIdr)}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground mt-1">
                      Modal hanya <strong className="text-foreground">{formatIDR(pkg.costPerAccount)}</strong> / slot
                    </div>
                  </div>

                  {/* Green Profit Highlight (Exact match with reference screenshot) */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span>Jual {pkg.sellSlots} slot @Rp149rb</span>
                    <span className="font-black text-emerald-700">+{formatIDR(pkg.netProfitAtStandard)} profit</span>
                  </div>

                  <p className="text-[12px] text-muted-foreground italic leading-relaxed pt-1">
                    Cocok untuk: {pkg.idealFor}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                      Fasilitas yang didapat:
                    </div>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>{pkg.quota} Slot Lisensi Paket Standar (1 Tahun)</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Hak akses resmi <strong>Paket Standar</strong> (Bukan Paket Lite atau Paket Pro)
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Modul Ajar Multi-Pertemuan, Mode Cepat, LKPD, Asesmen &amp; Prota Promes</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Kurikulum Merdeka, Deep Learning &amp; KBC Kemenag</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Export Word (.docx) &amp; PDF Rapi Siap Cetak</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Dashboard Agency Mandiri (Aktivasi instan via email 5 detik)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Kuota slot permanen <strong>tanpa masa kedaluwarsa</strong></span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Paket materi promosi, flyer &amp; template broadcast WA</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Akses Prioritas VIP WhatsApp Support</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTA Button matching screenshot label */}
                <div className="pt-6">
                  <a href={getWaOrderLink(pkg)} target="_blank" rel="noopener noreferrer">
                    <Button
                      className={`w-full font-black text-sm py-5 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] transition-all gap-1.5 ${
                        pkg.isBestValue
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {pkg.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Butuh kuota lebih besar (100+ slot) untuk yayasan sekolah berjejaring atau dinas pendidikan?{' '}
              <a
                href={getWaConsultLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold underline hover:text-primary/80"
              >
                Hubungi kami untuk penawaran khusus distributor skala besar
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ============ AGENCY AMMUNITION & EXCLUSIVE BONUSES ============ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              Fasilitas &amp; Amunisi Penjualan
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Semua yang Anda Butuhkan untuk Sukses Berjualan
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Kami tidak membiarkan Anda berjuang sendirian. Kami sediakan seluruh amunisi promosi hingga dukungan teknis penuh.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border-2 border-foreground flex items-center justify-center text-primary font-black">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Dashboard Agency Mandiri</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pantau sisa kuota, riwayat aktivasi, dan daftar pelanggan Anda kapan saja dari smartphone maupun laptop. Tidak perlu repot lapor manual ke kami.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-foreground flex items-center justify-center text-amber-600 font-black">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Kuota Tanpa Kedaluwarsa</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kuota lisensi yang Anda beli tidak akan pernah hangus. Anda bebas menjualnya secara santai, baik dalam hitungan minggu, bulan, maupun tahun ajaran baru.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border-2 border-foreground flex items-center justify-center text-emerald-600 font-black">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Materi Promosi Siap Sebar</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tersedia flyer grafis beresolusi tinggi, format copywriting broadcast WhatsApp teruji, dan video demo fitur yang siap Anda teruskan ke grup-grup guru.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 border-2 border-foreground flex items-center justify-center text-blue-600 font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Akun Master Demo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dapatkan akses demo khusus untuk Anda pamerkan secara langsung saat mengadakan presentasi di sekolah, rapat dinas, maupun pertemuan KKG/MGMP.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 border-2 border-foreground flex items-center justify-center text-purple-600 font-black">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Jalur VIP WhatsApp Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kendala aktivasi atau pertanyaan teknis dari pelanggan Anda? Tim teknis kami siap memandu dan membantu Anda melalui kontak WhatsApp prioritas.
              </p>
            </div>

            <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border-2 border-foreground flex items-center justify-center text-rose-600 font-black">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Bebas Strategi Penetapan Harga</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Anda memiliki kendali 100% atas harga penjualan. Bisa jual eceran biasa harga resmi Rp 149.000, diskon rekan sekolah, atau bundling bimtek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF / TESTIMONIALS ============ */}
      <section className="py-16 md:py-24 bg-muted/30 border-y-2 border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
              Kisah Rekan Mitra Agency
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Dipercaya Guru &amp; Reseller di Seluruh Indonesia
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Mereka telah merasakan langsung mudahnya mendapatkan penghasilan tambahan jutaan rupiah sambil tetap fokus pada tugas utama mendidik anak bangsa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-brutal space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/20 border-2 border-foreground flex items-center justify-center font-black text-primary">
                  BS
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Bambang S., S.Pd.</div>
                  <div className="text-xs text-muted-foreground">Guru SMP &amp; Pengurus MGMP IPA (Jawa Timur)</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;Awalnya saya pakai ModulAjar sendiri dan sangat terbantu. Setelah itu saya ambil paket Starter 10 slot Paket Standar untuk rekan di MGMP. Pas saya demo cara buat modul 1 semester dalam 5 menit, langsung ludes dalam 2 hari! Sekarang saya rutin ambil paket Master 60 slot.&rdquo;
              </p>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                Profit Bersih: &gt; Rp 7.200.000 / periode
              </div>
            </div>

            <div className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-brutal space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-foreground flex items-center justify-center font-black text-amber-700">
                  NH
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Nurul Hidayah, M.Pd.</div>
                  <div className="text-xs text-muted-foreground">Guru Madrasah Ibtidaiyah (Jawa Tengah)</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;Sebagai pengguna setia ModulAjar, saya tahu persis betapa mudahnya fitur KBC Kemenag di sini. Saya aktivasi paket Advance 30 slot Paket Standar untuk rekan guru se-kecamatan, semuanya sangat terbantu dan prosesnya sangat cepat via HP.&rdquo;
              </p>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                Profit Bersih: &gt; Rp 3.400.000
              </div>
            </div>

            <div className="bg-card border-2 border-foreground rounded-2xl p-6 shadow-brutal space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 border-2 border-foreground flex items-center justify-center font-black text-blue-700">
                  RA
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">Rian Ariyanto, S.Pd.</div>
                  <div className="text-xs text-muted-foreground">Penggiat Komunitas Guru Digital (Sumatera)</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;Saya sering adakan workshop AI untuk guru. Selesai sesi, saya tawarkan aktivasi Paket Standar ModulAjar.Online. Dashboard agencynya sangat simpel, tinggal input email peserta langsung aktif Paket Standar 1 tahun penuh. Luar biasa menguntungkan!&rdquo;
              </p>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                Profit Bersih: &gt; Rp 7.292.000
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ SECTION ============ */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Semua Jawaban Seputar Lisensi Agency
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Masih ragu atau punya pertanyaan lain? Temukan penjelasan lengkapnya di bawah ini.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="faq-prerequisite" className="bg-amber-50/60 border-2 border-amber-300 rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline text-amber-950">
                Apakah saya harus sudah punya akun ModulAjar.Online sebelum membeli lisensi Agency?
              </AccordionTrigger>
              <AccordionContent className="text-amber-900/90 leading-relaxed text-sm pt-2">
                <strong>Ya, betul sekali!</strong> Syarat mutlak menjadi mitra Agency adalah Anda <strong>harus sudah memiliki akun dan akses aktif ke ModulAjar.Online</strong>. Jika Anda belum memiliki akses, Anda <strong>diwajibkan berlangganan terlebih dahulu</strong> (Paket Standar) agar Anda sudah mencoba langsung, memahami alur kerja aplikasi, dan dapat membimbing serta mendemonstrasikan fitur ke calon pembeli dengan percaya diri.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-paket-standar" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Hak akses paket apa yang saya jual ke rekan guru pembeli?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Hak akses yang didistribusikan dalam lisensi agency adalah <strong>Paket Standar ModulAjar.Online (1 Tahun Penuh)</strong> senilai harga resmi Rp 149.000/tahun — <strong>bukan paket Lite atau Paket Pro</strong>. Paket Standar sudah sangat lengkap dengan generator Modul Ajar (Multi-pertemuan &amp; Cepat), LKPD interaktif, instrumen asesmen &amp; rubrik, serta perhitungan Prota &amp; Promes otomatis.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-1" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Apa itu Lisensi Agency ModulAjar.Online?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Lisensi Agency adalah program kemitraan resmi yang memberikan hak bagi Anda untuk mendistribusikan akun Paket Standar ModulAjar.Online kepada rekan guru dengan harga modal grosir (mulai Rp 24.900/slot) dibanding harga eceran resmi Rp 149.000/akun. Anda mengantongi seluruh selisih penjualannya sebagai keuntungan bersih.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Apakah kuota lisensi yang saya beli memiliki masa kedaluwarsa?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                <strong>Sama sekali tidak ada masa kedaluwarsa (No Expiry).</strong> Kuota lisensi tersimpan aman di Dashboard Agency Anda dan tidak akan hangus. Anda bebas menjualnya kapan saja, baik dalam 1 bulan, 6 bulan, maupun tahun ajaran baru berikutnya.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Berapa lama masa aktif akun untuk guru yang saya aktivasi?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Setiap rekan guru yang Anda aktivasi akan mendapatkan akses <strong>Paket Standar selama 1 Tahun Penuh (365 hari)</strong> sejak tanggal aktivasi dilakukan. Guru mendapatkan akses penuh ke generator modul ajar, LKPD, asesmen, Prota Promes, dan export Word/PDF.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Berapa harga jual eceran yang disarankan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Harga eceran resmi ModulAjar.Online adalah <strong>Rp 149.000 per tahun</strong> untuk Paket Standar. Anda bebas menjual di harga resmi tersebut, memberikan diskon khusus rekan satu sekolah, atau bundling dengan jasa pelatihan/bimtek yang Anda adakan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Bagaimana cara aktivasi akun guru yang membeli ke saya?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Sangat mudah dan cepat. Anda cukup login ke Dashboard Agency Anda dari ponsel atau laptop, masukkan alamat email rekan guru tersebut, lalu klik tombol aktivasi. Dalam hitungan 5 detik, status akun rekan guru otomatis berubah menjadi aktif Paket Standar tanpa perlu campur tangan admin kami.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Apakah saya disediakan materi promosi?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Ya! Kami menyediakan paket lengkap materi promosi: flyer grafis siap pasang logo Anda, template pesan broadcast WhatsApp, dan video tutorial yang bisa Anda bagikan langsung ke rekan-rekan guru.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-7" className="bg-card border-2 border-foreground rounded-xl px-5 shadow-brutal-sm">
              <AccordionTrigger className="font-extrabold text-base text-left hover:no-underline">
                Bagaimana prosedur pembayaran untuk mengambil paket agency?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                Pembayaran dilakukan melalui transfer bank atau QRIS resmi. Setelah transfer dikonfirmasi via WhatsApp, Dashboard Agency dan kuota slot Anda akan langsung diaktifkan dalam waktu kurang dari 15 menit.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ============ FINAL CTA SECTION ============ */}
      <section className="py-16 md:py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Amankan Kuota Lisensi Agency Sekarang
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-background tracking-tight max-w-3xl mx-auto leading-tight">
            Mulai Bisnis AI Pendidikan Anda Hari Ini Bersama{' '}
            <span className="text-amber-400">ModulAjar.Online</span>
          </h2>

          <p className="text-base sm:text-lg text-background/80 max-w-2xl mx-auto leading-relaxed">
            Bantu rekan guru di sekolah Anda menghemat ratusan jam kerja administrasi, sembari mengantongi penghasilan tambahan jutaan rupiah secara halal dan elegan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              onClick={() => scrollTo('paket')}
              className="text-base sm:text-lg px-8 py-6 bg-amber-400 hover:bg-amber-300 text-foreground font-black border-2 border-background shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
            >
              Pilih Paket Lisensi Agency
              <ArrowRight className="w-5 h-5" />
            </Button>
            <a href={getWaConsultLink()} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 font-bold bg-background text-foreground border-2 border-background hover:bg-background/90 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Hubungi Admin via WhatsApp
              </Button>
            </a>
          </div>

          <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-background/70">
            <span>✓ Hak Akses Resmi Paket Standar</span>
            <span>✓ Kuota Tanpa Kedaluwarsa</span>
            <span>✓ Jaminan Support Teknis Penuh</span>
          </div>
        </div>
      </section>

      {/* ============ STICKY BOTTOM BAR ON MOBILE ============ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t-2 border-foreground p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="text-[11px] text-muted-foreground font-semibold">Lisensi Agency Mulai</div>
          <div className="text-sm font-black text-primary">Rp 24.900<span className="text-[10px] font-normal text-muted-foreground">/slot</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => scrollTo('paket')}
            className="font-bold text-xs px-3 border-2 border-foreground shadow-brutal-sm"
          >
            Pilih Paket
          </Button>
          <a href={getWaConsultLink()} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-xs px-2.5 border-2 border-foreground shadow-brutal-sm text-emerald-700"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
