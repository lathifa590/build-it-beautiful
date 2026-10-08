import {
  School,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  FileText,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Sparkles,
  Share2,
  Printer,
  ShieldCheck,
  Clock,
  MessageCircle,
  Star,
  Lock,
  TrendingUp,
  GraduationCap,
  ClipboardList,
  CalendarX,
  SearchX,
  FileQuestion,
  Zap,
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
const WA_DEMO_TEXT = `Halo Admin ModulAjar.Online 👋

Saya Kepala Sekolah / Waka Kurikulum dari [Nama Sekolah].

Kami tertarik dengan Program Sekolah Perintis "Mode Sekolah" (Rp 1.500.000/tahun untuk 25 guru).

Mohon info jadwal demo 15 menit & cara aktivasi paketnya. Terima kasih!`;
const WA_DEMO_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_DEMO_TEXT)}`;

const FAQ_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Apakah guru-guru saya harus berlangganan lagi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tidak perlu. Satu Paket Sekolah sudah mencakup 25 akun guru aktif selama 1 tahun penuh dengan fitur pembuatan modul penuh (Mode Cepat & Modul Multi-Pertemuan).',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa batas Workspace untuk tiap guru?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Setiap guru dalam Paket Sekolah mendapatkan batas maksimal 10 Workspace (setara akun Pro). Satu Workspace mampu menampung Modul Ajar multi-pertemuan, LKPD, dan Asesmen untuk satu mata pelajaran.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa lama data sekolah dan dokumen guru tersimpan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Selama langganan aktif, semua dokumen tersimpan aman di cloud tanpa batas durasi. Kami tidak menghapus data secara otomatis saat masa langganan berakhir, namun kami sarankan sekolah mengunduh arsip dokumen penting (export Word/PDF) secara berkala sebagai cadangan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apa bedanya Paket Sekolah dengan paket personal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paket personal (Rp 149.000–197.000) untuk satu guru. Paket Sekolah menambahkan lapisan pengelolaan khusus Kepala Sekolah & Waka Kurikulum: Dashboard Monitoring, Kalender Waka terpusat, Bank Modul dengan kurasi, Kop & Standar Sekolah, dan Rekap Supervisi Dinas siap cetak.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana pembayaran lewat dana BOS?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kami mengirimkan invoice resmi atas nama sekolah/yayasan. Pembayaran bisa per tahun penuh atau per semester, sesuai mekanisme pencairan anggaran sekolah.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana jika guru kami lebih dari 25 orang?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bisa tambah kapan saja tanpa ganti paket: Rp 90.000 per guru per tahun. Untuk kebutuhan di atas 50 guru (yayasan/gugus), hubungi kami untuk skema khusus.',
      },
    },
  ],
});

// ---------------- Data ----------------

const painPoints = [
  {
    icon: ClipboardList,
    title: 'Waka begadang akhir tahun',
    desc: 'Memeriksa modul ajar satu per satu dari 20+ guru, dikerjakan manual lewat tumpukan file Word yang dikirim ke grup WhatsApp.',
  },
  {
    icon: CalendarX,
    title: 'Prota & Promes tidak seragam',
    desc: 'Tiap guru menghitung pekan efektif versinya sendiri. Kalender kelas A berbeda dengan kelas B — sulit dikontrol pimpinan.',
  },
  {
    icon: SearchX,
    title: 'Supervisi selalu buru-buru',
    desc: 'Saat Pengawas datang, rekap administrasi disusun terburu-buru dari file-file yang tersecer di HP dan laptop masing-masing guru.',
  },
  {
    icon: FileQuestion,
    title: 'Dokumen tanpa standar',
    desc: 'Ada guru pakai kop lama, ada yang tanpa kop, ada yang nama pejabatnya salah. Tidak ada satu standar dokumen resmi sekolah.',
  },
];

const features = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard Monitoring',
    desc: 'Progres penyusunan modul seluruh guru dalam satu layar: berapa Workspace, berapa JP terencana, dan berapa modul yang sudah siap. Tidak perlu menagih lewat grup WA.',
  },
  {
    icon: CalendarDays,
    label: 'Kalender Waka',
    desc: 'Waka mengatur kalender pendidikan sekolah sekali saja — pekan efektif, JP per minggu, libur, PTS/PAS. Saat guru membuat modul baru, kalender otomatis tersalin ke workspace guru. Satu sumber kebenaran untuk semua.',
  },
  {
    icon: BookOpen,
    label: 'Bank Modul Sekolah',
    desc: 'Guru membagikan modul terbaiknya ke bank sekolah. Waka mengkurasi: setujui, minta revisi, atau jadikan template resmi. Mutu kurikulum naik, pekerjaan tidak diulang dari nol.',
  },
  {
    icon: Users,
    label: 'Dewan Guru & Undangan',
    desc: 'Undang seluruh guru lewat satu tautan WhatsApp atau kode undangan sekolah. Guru klik, langsung aktif — tanpa proses daftar akun yang membingungkan.',
  },
  {
    icon: FileText,
    label: 'Kop & Standar Sekolah',
    desc: 'Atur kop surat, logo, nama & NIP Kepala Sekolah dan Waka satu kali. Semua dokumen guru otomatis mengikuti standar resmi sekolah.',
  },
  {
    icon: FileSpreadsheet,
    label: 'Rekap Supervisi Dinas',
    desc: 'Rekap kepatuhan administrasi perangkat ajar per guru, siap cetak / simpan PDF lengkap dengan kop sekolah — tinggal serahkan saat supervisi Pengawas atau akreditasi.',
  },
];

const steps = [
  {
    icon: CalendarDays,
    title: 'Waka atur kalender',
    desc: 'Tentukan tahun ajaran, pekan efektif, dan alokasi JP. Sekali simpan, berlaku otomatis untuk semua guru di sekolah Anda.',
  },
  {
    icon: Share2,
    title: 'Guru bergabung via WhatsApp',
    desc: 'Sebar tautan undangan ke grup dewan guru. Guru klik, langsung masuk ke sekolah Anda dan bisa mulai menyusun modul.',
  },
  {
    icon: Printer,
    title: 'Pantau & cetak rekap',
    desc: 'Progres terlihat real-time di Dashboard Monitoring. Saat supervisi, cukup klik cetak — rekap lengkap dengan kop sekolah siap diserahkan.',
  },
];

const perintisBenefits = [
  '25 akun guru aktif 1 tahun penuh (Mode Cepat + Modul Multi-Pertemuan + Kurikulum Merdeka & KBC)',
  'Semua fitur Mode Sekolah: Dashboard Monitoring, Kalender Waka, Bank Modul, Kop & Standar, Rekap Supervisi',
  'Harga terkunci — tidak akan naik selama tetap berlangganan',
  'Request fitur diprioritaskan — sekolah perintis adalah penguji kami',
  'Bantuan onboarding langsung via WhatsApp',
];

const faqs = [
  {
    q: 'Apakah guru-guru saya harus berlangganan lagi?',
    a: 'Tidak perlu. Satu Paket Sekolah sudah mencakup 25 akun guru aktif selama 1 tahun penuh dengan fitur pembuatan modul penuh (Mode Cepat & Modul Multi-Pertemuan, Kurikulum Merdeka & KBC).',
  },
  {
    q: 'Berapa batas Workspace untuk tiap guru?',
    a: 'Setiap guru mendapatkan batas maksimal 10 Workspace — setara dengan akun Pro. Satu Workspace mampu menampung Modul Ajar multi-pertemuan, LKPD, dan Asesmen untuk satu mata pelajaran. Untuk satu tahun ajaran, 10 Workspace lebih dari cukup untuk semua mapel yang diampu.',
  },
  {
    q: 'Berapa lama data sekolah dan dokumen guru tersimpan?',
    a: 'Selama langganan aktif, semua dokumen tersimpan aman di cloud tanpa batas durasi. Kami tidak menghapus data secara otomatis saat masa langganan berakhir — namun untuk keamanan jangka panjang, kami sarankan sekolah mengunduh arsip dokumen penting (export Word/PDF) secara berkala sebagai cadangan.',
  },
  {
    q: 'Apa bedanya Paket Sekolah dengan paket personal Rp 149rb–197rb?',
    a: 'Paket personal untuk satu guru. Paket Sekolah menambahkan lapisan pengelolaan khusus Kepala Sekolah & Waka Kurikulum: Dashboard Monitoring, Kalender Waka terpusat, Bank Modul dengan kurasi, Kop & Standar Sekolah, dan Rekap Supervisi Dinas siap cetak.',
  },
  {
    q: 'Bagaimana pembayaran lewat dana BOS?',
    a: 'Kami kirim invoice resmi atas nama sekolah/yayasan. Pembayaran bisa per tahun penuh atau per semester, menyesuaikan mekanisme pencairan anggaran sekolah.',
  },
  {
    q: 'Apakah guru perlu pelatihan khusus?',
    a: 'Tidak. Alur bagi guru sama persis dengan aplikasi ModulAjar yang sudah biasa mereka pakai. Waka Kurikulum mendapat onboarding singkat via WhatsApp/Zoom dan siap dipandu sampai jalan sendiri.',
  },
  {
    q: 'Bagaimana jika guru kami lebih dari 25 orang?',
    a: 'Bisa tambah kapan saja tanpa ganti paket: Rp 90.000 per guru per tahun. Untuk kebutuhan di atas 50 guru (yayasan/gugus sekolah), hubungi kami untuk skema khusus.',
  },
  {
    q: 'Apakah data sekolah kami aman?',
    a: 'Aman. Data sekolah hanya dapat dilihat oleh anggota sekolah Anda sendiri, dengan peran terpisah antara Guru, Waka Kurikulum, dan Kepala Sekolah. Sekolah lain tidak dapat mengakses data Anda.',
  },
  {
    q: 'Apakah semua fitur sudah benar-benar berjalan?',
    a: 'Ya. Enam fitur di atas sudah aktif dan dipakai hari ini — bukan roadmap. Yang membuat harga perintis lebih murah karena Mode Sekolah masih terus kami sempurnakan bersama sekolah perintis: masukan Anda diprioritaskan.',
  },
  {
    q: 'Kapan harga normal berlaku & apa untungnya ikut perintis?',
    a: 'Setelah program perintis selesai, harga normal mulai Rp 1.200.000/tahun (15 guru) hingga Rp 3.500.000/tahun (50 guru). Sekolah perintis mengunci harga Rp 1.500.000 untuk 25 guru — selama tetap berlangganan, harga tidak pernah naik.',
  },
];

// ---------------- Page ----------------

export default function PaketSekolahPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Paket Sekolah — Mode Sekolah ModulAjar.Online"
        description="Satu paket untuk 25 guru: Dashboard Monitoring, Kalender Waka terpusat, Bank Modul Sekolah, Kop & Standar resmi, dan Rekap Supervisi Dinas siap cetak. Khusus 10 sekolah perintis pertama."
        canonical="/paketsekolah"
        schema={FAQ_SCHEMA}
      />
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative py-16 md:py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-full mb-6">
                <School className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-700">
                  Program Uji Coba — Sekolah Perintis
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-[3.4rem] font-extrabold text-foreground leading-tight mb-6">
                Satu Sekolah, Satu Kurikulum,{' '}
                <span className="text-primary">Semua Guru Sinkron.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                <strong>Mode Sekolah</strong> menyatukan Kalender Pendidikan, Bank Modul, dan
                Monitoring Progres <strong>seluruh dewan guru</strong> dalam satu dashboard — dari
                Waka Kurikulum sampai guru kelas.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center lg:justify-start">
                <a href={WA_DEMO_LINK} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-6 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Jadwalkan Demo Gratis
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollTo('fitur')}
                  className="w-full sm:w-auto text-base px-6 py-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Lihat Fitur Sekolah
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>✓ Tanpa install aplikasi</span>
                <span>✓ Guru aktif 1-klik via WhatsApp</span>
                <span>✓ Khusus 10 sekolah pertama</span>
              </div>

              <p className="mt-4 text-sm text-muted-foreground font-medium">
                <span className="line-through">Rp 197.000 × 25 guru = Rp 4.925.000</span>
                <span className="ml-2 font-extrabold text-emerald-700">
                  Rp 1.500.000/tahun untuk 25 guru
                </span>
              </p>
            </div>

            {/* Mock Dashboard Visual */}
            <div className="relative w-full max-w-md mx-auto lg:max-w-none">
              <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal p-5">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-foreground/15">
                  <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg border-2 border-foreground flex items-center justify-center font-bold">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-foreground">SMP Nusantara</p>
                    <p className="text-[10px] text-muted-foreground font-mono font-bold">
                      NPSN 20250123 · Tahun Ajaran 2025/2026
                    </p>
                  </div>
                  <span className="ml-auto bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                    Aktif
                  </span>
                </div>

                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground mb-2">
                  Dashboard Monitoring — Progres Dewan Guru
                </p>
                <div className="space-y-3">
                  {[
                    { name: 'Bu Ratna · Matematika', pct: 92 },
                    { name: 'Pak Dedi · IPA', pct: 78 },
                    { name: 'Bu Sari · Bahasa Indonesia', pct: 64 },
                    { name: 'Pak Arif · IPS', pct: 45 },
                  ].map((g) => (
                    <div key={g.name}>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-foreground">{g.name}</span>
                        <span className="text-primary">{g.pct}%</span>
                      </div>
                      <div className="h-3 rounded-full border-2 border-foreground bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${g.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: Users, label: '24 Guru' },
                    { icon: BookOpen, label: '168 Modul' },
                    { icon: TrendingUp, label: '71% Siap' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-foreground/20 bg-secondary/40"
                    >
                      <s.icon className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PAIN ============ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Pernah Ini, Pak/Bu Kepsek?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mengelola administrasi perangkat ajar puluhan guru dengan cara manual melelahkan —
              dan hasilnya tetap tidak seragam.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="flex gap-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm p-6"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 text-red-600 border-2 border-foreground flex items-center justify-center">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FITUR ============ */}
      <section id="fitur" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Sudah Aktif Hari Ini</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Semua yang Waka Kurikulum Butuhkan, Sudah Jalan.
            </h2>
            <p className="text-lg text-muted-foreground">
              Bukan roadmap, bukan janji. Enam fitur ini sudah berjalan di Mode Sekolah.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex flex-col bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm hover:shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border-2 border-foreground flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-foreground mb-2">{f.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CARA KERJA ============ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Kurang dari 15 Menit, Sekolah Anda Beres.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative bg-card border-2 border-foreground rounded-2xl shadow-brutal p-6"
              >
                <div className="absolute -top-4 -left-2 w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center font-black shadow-brutal-sm">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border-2 border-foreground flex items-center justify-center mb-4 mt-2">
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HARGA ============ */}
      <section id="harga" className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-full mb-4">
              <Star className="w-4 h-4 fill-current text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">
                Sekolah Perintis — Hanya 10 Sekolah Pertama
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Harga Perintis, Terkunci Selama Menjadi Anggota.
            </h2>
            <p className="text-lg text-muted-foreground">
              Harga normal akan berlaku setelah launching resmi. Sekolah perintis tidak pernah
              terkena kenaikan.
            </p>
          </div>

          <div className="relative bg-card border-4 border-primary rounded-2xl shadow-[8px_8px_0px_0px_hsl(var(--primary))] p-6 md:p-10 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 pb-6 border-b-2 border-foreground/10">
              <div>
                <h3 className="text-2xl font-extrabold text-foreground">Paket Sekolah Perintis</h3>
                <p className="text-muted-foreground text-sm">
                  Untuk satu sekolah — maksimal 25 guru aktif
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground line-through">Rp 4.925.000</p>
                <p className="text-4xl font-extrabold text-foreground">
                  Rp 1.500.000
                  <span className="text-base font-bold text-muted-foreground"> / tahun</span>
                </p>
                <p className="text-xs font-bold text-emerald-700">
                  Setara Rp 60.000/guru/tahun
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {perintisBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  Guru tambahan: <strong>Rp 90.000/guru/tahun</strong> — kapan saja, tanpa naik
                  paket
                </span>
              </li>
            </ul>

            <a href={WA_DEMO_LINK} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                size="lg"
                className="w-full text-lg px-8 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Amankan Slot Sekolah Perintis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </div>

          <div className="max-w-2xl mx-auto mt-8 space-y-3">
            <div className="bg-secondary/40 border-2 border-foreground/20 rounded-xl p-4 text-sm text-muted-foreground">
              <p className="font-bold text-foreground mb-1">
                Harga normal setelah launching resmi (sebagai pembanding):
              </p>
              <p>
                Sekolah Kecil (15 guru) Rp 1.200.000 · Sekolah Reguler (30 guru) Rp 2.250.000 ·
                Sekolah Plus (50 guru) Rp 3.500.000 · Yayasan/Gugus 50+ guru: hubungi kami.
              </p>
            </div>
            <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 text-sm text-amber-900 flex gap-3">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                <strong>Transparansi:</strong> beberapa bagian Mode Sekolah masih terus kami
                sempurnakan bersama sekolah perintis. Itulah kenapa harganya begini — Anda ikut
                membentuknya, dan masukan Anda diprioritaskan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-muted-foreground">
              Masih ada yang ingin ditanyakan? Langsung chat admin kami.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border-2 border-foreground rounded-xl px-4 py-2 shadow-brutal-sm data-[state=open]:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">Slot Terbatas</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Jadilah 1 dari 10 Sekolah Perintis.
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Demo 15 menit via WhatsApp/Zoom khusus Kepala Sekolah & Waka Kurikulum. Tanpa
            komitmen — lihat langsung bagaimana Mode Sekolah mengurangi beban administrasi
            sekolah Anda.
          </p>
          <a href={WA_DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="text-lg px-10 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat Admin — Jadwalkan Demo
            </Button>
          </a>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Data sekolah terpisah & aman
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-green-600" /> Onboarding dipandu sampai jalan
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-green-600" /> Dibuat untuk Kurikulum Merdeka
              & KBC
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
