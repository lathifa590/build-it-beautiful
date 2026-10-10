import { useState } from 'react';
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
  ZoomIn,
  X,
  CheckCircle2,
  ExternalLink,
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
        text: 'Tidak perlu. Satu Paket Sekolah sudah mencakup 25 akun guru aktif selama 1 tahun penuh dengan fitur pembuatan modul penuh (Mode Cepat & Modul Multi-Pertemuan, Kurikulum Merdeka & KBC).',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa batas Workspace untuk tiap guru?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Setiap guru mendapatkan batas maksimal 10 Workspace — setara dengan akun Pro. Satu Workspace mampu menampung Modul Ajar multi-pertemuan, LKPD, dan Asesmen untuk satu mata pelajaran. Untuk satu tahun ajaran, 10 Workspace lebih dari cukup untuk semua mapel yang diampu.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa lama data sekolah dan dokumen guru tersimpan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Selama langganan aktif, semua dokumen tersimpan aman di cloud tanpa batas durasi. Kami tidak menghapus data secara otomatis saat masa langganan berakhir — namun untuk keamanan jangka panjang, kami sarankan sekolah mengunduh arsip dokumen penting (export Word/PDF) secara berkala sebagai cadangan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apa bedanya Paket Sekolah dengan paket personal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paket personal untuk satu guru. Paket Sekolah menambahkan lapisan pengelolaan khusus Kepala Sekolah & Waka Kurikulum: Dashboard Monitoring, Kalender Waka terpusat, Bank Modul dengan kurasi, Kop & Standar Sekolah, dan Rekap Supervisi Dinas siap cetak.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana pembayaran lewat dana BOS?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kami kirim invoice resmi atas nama sekolah/yayasan. Pembayaran bisa per tahun penuh atau per semester, menyesuaikan mekanisme pencairan anggaran sekolah.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana jika guru kami lebih dari 25 orang?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bisa tambah kapan saja tanpa ganti paket: Rp 90.000 per guru per tahun. Untuk kebutuhan di atas 50 guru (yayasan/gugus sekolah), hubungi kami untuk skema khusus.',
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

interface FeatureItem {
  id: string;
  icon: any;
  label: string;
  badge: string;
  tagline: string;
  desc: string;
  points: { title: string; desc: string }[];
  image: string;
  imageAlt: string;
  urlPath: string;
}

const detailedFeatures: FeatureItem[] = [
  {
    id: 'monitoring',
    icon: LayoutDashboard,
    label: 'Dashboard Monitoring Dewan Guru',
    badge: 'KENDALI PENUH WAKA & KEPSEK',
    tagline: 'Pantau Ketuntasan 25 Guru dalam Satu Layar Real-Time — Tanpa Perlu Menagih di Grup WhatsApp',
    desc: 'Waka Kurikulum dan Kepala Sekolah tidak perlu lagi menebak atau mengirim pesan berulang di grup WhatsApp menanyakan "Modul ajar siapa yang belum beres?". Dashboard Monitoring merangkum seluruh aktivitas dewan guru secara transparan: total alokasi jam pelajaran (JP) terencana vs tuntas, persentase kemajuan per individu, serta jumlah dokumen yang siap cetak.',
    points: [
      {
        title: 'Indikator Progres Akurat',
        desc: 'Bar persentase kemajuan tiap guru diperbarui otomatis setiap kali guru menyusun atau menyelesaikan modul.',
      },
      {
        title: 'Kalkulasi JP Terencana vs Tuntas',
        desc: 'Membandingkan target kurikulum dengan realisasi modul ajar yang sudah siap, memastikan tidak ada materi yang terlewat.',
      },
      {
        title: 'Evaluasi Tanpa Gesekan',
        desc: 'Pimpinan sekolah dapat memeriksa status administrasi kapan saja dari laptop atau smartphone sebelum rapat dewan guru.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/Sekolah%20Demo%20Monitoring%20Dashboard.png',
    imageAlt: 'Tampilan Dashboard Monitoring Dewan Guru ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/dashboard',
  },
  {
    id: 'bank-modul',
    icon: BookOpen,
    label: 'Bank Modul & Shared Drive Sekolah',
    badge: 'ASET KURIKULUM ABADI',
    tagline: 'Google Shared Drive Versi Kurikulum — Perangkat Ajar Jadi Aset Abadi Sekolah, Bebas Risiko Guru Mutasi',
    desc: 'Ketika guru berpindah tugas atau mutasi, sering kali perangkat ajar buatannya ikut hilang. Di Mode Sekolah, seluruh perangkat ajar dewan guru tersimpan rapi layaknya Google Shared Drive resmi sekolah. Dikelompokkan otomatis per mata pelajaran, fase, dan kelas, sehingga menjadi aset kurikulum abadi milik sekolah.',
    points: [
      {
        title: 'Folder Mapel & Jenjang Otomatis',
        desc: 'Modul terkelompok otomatis per Fase (A–F) dan Tahun Ajaran tanpa perlu membuat struktur folder manual di drive.',
      },
      {
        title: 'Sistem Kurasi & Persetujuan Waka',
        desc: 'Waka dapat meninjau modul yang disetor guru, memberikan status persetujuan, meminta revisi, atau menjadikannya template resmi sekolah.',
      },
      {
        title: 'Kolaborasi Rumpun Mata Pelajaran',
        desc: 'Guru serumpun dapat saling mereferensikan modul ajar terbaik, meningkatkan kualitas pembelajaran sekolah secara merata.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/School%20Module%20Bank%20Dashboard.png',
    imageAlt: 'Tampilan Bank Modul dan Shared Drive Sekolah ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/bank',
  },
  {
    id: 'kalender',
    icon: CalendarDays,
    label: 'Kalender Pendidikan Terpusat Waka',
    badge: 'SINGLE SOURCE OF TRUTH',
    tagline: 'Sekali Atur Kalender Waka, Otomatis Seragam ke 25 Guru — Akhiri Hitungan Pekan Efektif yang Belang-Belang',
    desc: 'Menghitung pekan efektif semester dan alokasi JP mingguan sering kali menghasilkan versi yang berbeda-beda di tiap guru. Waka Kurikulum cukup mengatur kalender pendidikan sekolah satu kali (pekan efektif, alokasi JP per minggu, hari libur, jadwal PTS/PAS). Saat guru membuat modul baru, kalkulasi otomatis menarik data kalender resmi ini.',
    points: [
      {
        title: 'Distribusi Instan ke Workspace Guru',
        desc: 'Tidak ada lagi perbedaan jumlah pekan efektif semester ganjil atau genap antar guru mapel.',
      },
      {
        title: 'Fleksibilitas Alokasi JP & Target Pertemuan',
        desc: 'Sistem otomatis mengalkulasi total jam pertemuan efektif sepanjang semester berdasarkan alokasi kurikulum sekolah.',
      },
      {
        title: 'Sinkronisasi Otomatis Prota & Promes',
        desc: 'Setiap modul ajar yang disusun guru langsung terhubung ke kalender akademik sekolah tanpa rumus Excel manual.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/Academic%20Calendar%20Dashboard.png',
    imageAlt: 'Tampilan Kalender Pendidikan Akademik Terpusat Waka ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/kalender',
  },
  {
    id: 'kop-standar',
    icon: FileText,
    label: 'Kop & Standarisasi Resmi Sekolah',
    badge: 'STANDARISASI SATU PINTU',
    tagline: 'Standarisasi Kop & Legalitas Otomatis — Cetak Dokumen Rapi Seragam Tanpa Format Belang-Belang',
    desc: 'Tidak ada lagi pemandangan di mana satu guru memakai kop lama, guru lain tanpa kop surat, atau salah menuliskan NIP Kepala Sekolah. Cukup unggah logo resmi, masukkan identitas dinas, NPSN, nama & NIP Kepala Sekolah serta Waka Kurikulum. Semua modul ajar, LKPD, dan asesmen yang diekspor ke Word maupun PDF otomatis mengikuti standar resmi sekolah.',
    points: [
      {
        title: 'Kop Kedinasan & Logo Sekolah Resmi',
        desc: 'Format kop standar Kemdikbud/Kemenag tersimpan di sistem dan terpasang di setiap lembar kerja secara konsisten.',
      },
      {
        title: 'Tanda Tangan & Titimangsa Sah',
        desc: 'Nama dan NIP Kepala Sekolah serta Waka otomatis tercantum di bagian pengesahan dokumen perangkat ajar.',
      },
      {
        title: 'Tampilan Dokumen Berwibawa',
        desc: 'Seluruh dokumen yang dicetak dewan guru seragam dan siap diajukan ke Pengawas Pembina atau Tim Asesor.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/Indonesian%20School%20Letterhead%20Dashboard.png',
    imageAlt: 'Tampilan Pengaturan Kop Surat dan Standarisasi Dokumen Sekolah ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/standar',
  },
  {
    id: 'supervisi',
    icon: FileSpreadsheet,
    label: 'Rekap Supervisi Dinas & Akreditasi',
    badge: 'SIAP PENGAWAS & AKREDITASI',
    tagline: 'Hadapi Pengawas & Visitasi Akreditasi Tanpa Panik — Rekap Kepatuhan Administrasi Siap Cetak 1-Klik',
    desc: 'Menjelang supervisi Pengawas atau visitasi Akreditasi, Waka biasanya lembur berhari-hari mengumpulkan file yang berserakan di flashdisk atau laptop guru. Dengan fitur Rekap Supervisi Dinas, sistem menyajikan tabel matriks kelengkapan seluruh perangkat ajar (Modul Ajar, ATP, Prota, Promes, LKPD, Asesmen) per guru. Cukup klik tombol cetak, dokumen laporan resmi ber-kop sekolah siap diserahkan.',
    points: [
      {
        title: 'Matriks Checklist Kepatuhan Administrasi',
        desc: 'Langsung memantau kelengkapan tiap guru (sudah lengkap atau dalam proses) per mata pelajaran dan kelas.',
      },
      {
        title: 'Cetak Laporan Resmi Ber-kop Sekolah',
        desc: 'Menghasilkan dokumen cetak resmi instrumen supervisi kurikulum siap tanda tangan Kepala Sekolah dan Pengawas Pembina.',
      },
      {
        title: 'Bebas Stres Saat Penilaian Tiba',
        desc: 'Arsip administrasi selalu tertata rapi dan siap disajikan kapan pun dibutuhkan tanpa persiapan darurat yang melelahkan.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/School%20Supervision%20Compliance%20Dashboard.png',
    imageAlt: 'Tampilan Rekap Supervisi Kepatuhan Administrasi Dinas ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/export',
  },
  {
    id: 'dewan-guru',
    icon: Users,
    label: 'Manajemen Dewan Guru & Undangan WA',
    badge: 'ONBOARDING KURANG DARI 5 MENIT',
    tagline: 'Undang Seluruh Dewan Guru Cukup Lewat Satu Link WhatsApp — Klik Langsung Aktif Tanpa Ribet',
    desc: 'Sistem onboarding dirancang seringkas mungkin agar tidak membingungkan para guru dari berbagai latar belakang kemampuan teknologi. Waka cukup membagikan tautan undangan khusus atau kode sekolah ke grup WhatsApp dewan guru. Begitu guru mengklik tautan, akun mereka langsung terhubung dengan kuota sekolah dan bisa langsung membuat modul.',
    points: [
      {
        title: 'Aktivasi Instan Tanpa Instalasi',
        desc: 'Guru tidak perlu mengunduh aplikasi berat. Berjalan lancar di browser laptop maupun smartphone.',
      },
      {
        title: 'Manajemen Kuota 25 Akun Guru',
        desc: 'Pimpinan sekolah dapat memantau kuota akun yang aktif, mengelola penugasan guru, dan menambah anggota dengan mudah.',
      },
      {
        title: 'Pendampingan Khusus Sekolah',
        desc: 'Sekolah mendapatkan sesi demo pengenalan serta layanan bantuan prioritas agar seluruh guru lancar beradaptasi.',
      },
    ],
    image: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/School%20Teacher%20Management%20Dashboard.png',
    imageAlt: 'Tampilan Manajemen Dewan Guru dan Undangan WhatsApp ModulAjar.Online',
    urlPath: 'modulajar.online/sekolah/anggota',
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

// ---------------- Component: Browser Window Frame ----------------

function BrowserFrame({
  url,
  imageSrc,
  imageAlt,
  onZoom,
  badgeText,
}: {
  url: string;
  imageSrc: string;
  imageAlt: string;
  onZoom?: () => void;
  badgeText?: string;
}) {
  return (
    <div className="relative group bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden transition-all duration-300 hover:shadow-brutal-lg">
      {/* Chrome header */}
      <div className="bg-muted/80 px-4 py-2.5 border-b-2 border-foreground flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400 border border-foreground/40" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-foreground/40" />
          <div className="w-3 h-3 rounded-full bg-green-400 border border-foreground/40" />
        </div>
        <div className="flex-1 max-w-md mx-auto bg-card border border-foreground/20 rounded-md px-3 py-0.5 text-[11px] font-mono text-muted-foreground truncate text-center">
          https://{url}
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {badgeText && (
            <span className="hidden sm:inline-block bg-primary/10 text-primary border border-primary/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Screen image with click-to-zoom hover */}
      <div
        className="relative bg-muted/20 cursor-pointer overflow-hidden aspect-video flex items-center justify-center"
        onClick={onZoom}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground font-extrabold text-xs md:text-sm border-2 border-foreground rounded-xl shadow-brutal-sm">
            <ZoomIn className="w-4 h-4 text-primary" />
            Klik untuk Perbesar Tampilan UI
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Page ----------------

export default function PaketSekolahPage() {
  const [activeTab, setActiveTab] = useState<string>('monitoring');
  const [zoomModal, setZoomModal] = useState<{
    url: string;
    title: string;
    desc: string;
  } | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentTabFeature = detailedFeatures.find((f) => f.id === activeTab) || detailedFeatures[0];

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
      <section className="relative py-16 md:py-20 lg:py-24 overflow-hidden border-b-2 border-foreground/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-600 rounded-full mb-6">
                <School className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-700">
                  Program Uji Coba — Sekolah Perintis (10 Kuota)
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-[3.2rem] font-extrabold text-foreground leading-[1.15] mb-6">
                Satu Sekolah, Satu Kurikulum,{' '}
                <span className="text-primary underline decoration-wavy decoration-primary/40 underline-offset-4">
                  Semua Guru Sinkron.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                <strong>Mode Sekolah</strong> menyatukan Kalender Pendidikan, Bank Modul, dan
                Monitoring Progres <strong>seluruh dewan guru</strong> dalam satu ekosistem terpadu — dari
                Waka Kurikulum sampai guru kelas.
              </p>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center lg:justify-start">
                <a href={WA_DEMO_LINK} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-7 py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Jadwalkan Demo 15 Menit
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollTo('fitur')}
                  className="w-full sm:w-auto text-base px-7 py-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Lihat UI & Fitur Sekolah
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tanpa install aplikasi
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Guru aktif 1-klik via WA
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Data tersimpan aman
                </span>
              </div>

              <div className="mt-5 inline-block bg-primary/10 border-2 border-primary/30 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-muted-foreground line-through mr-2">
                  Rp 197.000 × 25 guru = Rp 4.925.000
                </span>
                <span className="font-extrabold text-primary text-base">
                  Rp 1.500.000/tahun untuk 25 guru
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5 font-medium">
                  (Setara hanya Rp 60.000 / guru / tahun)
                </span>
              </div>
            </div>

            {/* Right Live UI Mockup */}
            <div className="lg:col-span-6">
              <div className="relative">
                {/* Floating Badge */}
                <div className="absolute -top-3 -right-2 z-10 bg-emerald-100 text-emerald-800 border-2 border-emerald-600 px-3 py-1 rounded-full text-xs font-black shadow-brutal-sm flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  UI Asli Mode Sekolah
                </div>

                <BrowserFrame
                  url="modulajar.online/sekolah/dashboard"
                  imageSrc="https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/Sekolah%20Demo%20Monitoring%20Dashboard.png"
                  imageAlt="Tampilan Live UI Dashboard Monitoring Mode Sekolah"
                  badgeText="Live Preview"
                  onZoom={() =>
                    setZoomModal({
                      url: 'https://file.garden/aehADr1aKQol7cT9/mode%20sekolah/Sekolah%20Demo%20Monitoring%20Dashboard.png',
                      title: 'Dashboard Monitoring Dewan Guru',
                      desc: 'Memantau ketuntasan alokasi JP dan progres dokumen seluruh guru dalam satu layar tanpa perlu menagih manual.',
                    })
                  }
                />

                {/* Sub-caption metrics */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-card border-2 border-foreground rounded-xl p-3 shadow-brutal-sm text-center">
                    <p className="text-xs text-muted-foreground font-bold">Kapasitas</p>
                    <p className="text-base font-extrabold text-foreground">25 Akun Guru</p>
                  </div>
                  <div className="bg-card border-2 border-foreground rounded-xl p-3 shadow-brutal-sm text-center">
                    <p className="text-xs text-muted-foreground font-bold">Sinkronisasi</p>
                    <p className="text-base font-extrabold text-primary">100% Otomatis</p>
                  </div>
                  <div className="bg-card border-2 border-foreground rounded-xl p-3 shadow-brutal-sm text-center">
                    <p className="text-xs text-muted-foreground font-bold">Akreditasi</p>
                    <p className="text-base font-extrabold text-emerald-700">Siap Cetak</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============ PAIN ============ */}
      <section className="py-16 md:py-20 bg-muted/30 border-b-2 border-foreground/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Pernah Mengalami Ini, Pak/Bu Kepsek & Waka?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mengelola administrasi kurikulum puluhan guru dengan cara manual sangat menguras energi —
              dan hasilnya tetap sering tidak seragam di hadapan dinas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="flex gap-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm p-6"
              >
                <div className="w-12 h-12 shrink-0 rounded-xl bg-red-50 text-red-600 border-2 border-foreground flex items-center justify-center">
                  <p.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FITUR UTAMA DENGAN SCREENSHOT UI ASLI ============ */}
      <section id="fitur" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Sudah Aktif & Berjalan Hari Ini</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              Semua yang Waka Kurikulum Butuhkan, Sudah Jalan.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Bukan rancangan mockup, bukan janji masa depan. Lihat langsung bagaimana 6 pilar fitur
              Mode Sekolah bekerja nyata menyederhanakan birokrasi perangkat ajar sekolah Anda.
            </p>
          </div>

          {/* ============ QUICK INTERACTIVE TOUR TABS ============ */}
          <div className="mb-20 bg-card border-2 border-foreground rounded-3xl p-6 md:p-8 shadow-brutal">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-foreground/10 flex-wrap">
              <div>
                <h3 className="font-extrabold text-xl text-foreground">
                  Tur Kilat UI: Jelajahi 6 Fitur Mode Sekolah
                </h3>
                <p className="text-sm text-muted-foreground">
                  Klik setiap tab di bawah untuk melihat tangkapan layar langsung dan fungsi utamanya.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-muted border border-foreground/20 px-3 py-1 rounded-full text-muted-foreground">
                Resolusi Asli 16:9 Desktop
              </span>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2.5 overflow-x-auto pb-3 mb-8 no-scrollbar">
              {detailedFeatures.map((f) => {
                const isActive = activeTab === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveTab(f.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold border-2 whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm -translate-y-0.5'
                        : 'bg-muted/60 text-foreground border-foreground/20 hover:border-foreground hover:bg-muted'
                    }`}
                  >
                    <f.icon className="w-4 h-4 shrink-0" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Spotlight View */}
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="inline-block bg-primary/10 text-primary border border-primary/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {currentTabFeature.badge}
                </span>
                <h4 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug">
                  {currentTabFeature.tagline}
                </h4>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {currentTabFeature.desc}
                </p>

                <div className="space-y-2.5 pt-2">
                  {currentTabFeature.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">{pt.title}:</strong>{' '}
                        <span className="text-muted-foreground">{pt.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() =>
                      setZoomModal({
                        url: currentTabFeature.image,
                        title: currentTabFeature.label,
                        desc: currentTabFeature.desc,
                      })
                    }
                    variant="outline"
                    className="border-2 border-foreground shadow-brutal-sm hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-bold gap-2"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-primary" />
                    Perbesar Layar Penuh (Zoom)
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <BrowserFrame
                  url={currentTabFeature.urlPath}
                  imageSrc={currentTabFeature.image}
                  imageAlt={currentTabFeature.imageAlt}
                  badgeText={currentTabFeature.label}
                  onZoom={() =>
                    setZoomModal({
                      url: currentTabFeature.image,
                      title: currentTabFeature.label,
                      desc: currentTabFeature.desc,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* ============ DETAILED DEEP-DIVE SHOWCASE (ALTERNATING LAYOUT) ============ */}
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Rincian Mendalam Setiap Fitur
            </h3>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Pelajari bagaimana setiap halaman dirancang khusus untuk memangkas waktu kerja Waka
              Kurikulum hingga 90%.
            </p>
          </div>

          <div className="space-y-20 md:space-y-28">
            {detailedFeatures.map((feat, index) => {
              const isEven = index % 2 === 1;
              return (
                <div
                  key={feat.id}
                  id={`feature-${feat.id}`}
                  className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
                  {/* Text Column */}
                  <div
                    className={`lg:col-span-5 space-y-4 ${
                      isEven ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center font-black shadow-brutal-sm">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <span className="text-xs font-black tracking-wider uppercase bg-secondary/80 text-foreground border border-foreground/30 px-3 py-1 rounded-full">
                        {feat.badge}
                      </span>
                    </div>

                    <h4 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug">
                      {feat.tagline}
                    </h4>

                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {feat.desc}
                    </p>

                    <div className="space-y-3 pt-3">
                      {feat.points.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-start gap-3 bg-card border-2 border-foreground/20 rounded-xl p-3 shadow-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{pt.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                              {pt.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() =>
                          setZoomModal({
                            url: feat.image,
                            title: feat.label,
                            desc: feat.desc,
                          })
                        }
                        variant="outline"
                        size="sm"
                        className="border-2 border-foreground shadow-brutal-sm hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] gap-2 text-xs font-bold"
                      >
                        <ZoomIn className="w-4 h-4 text-primary" />
                        Lihat Gambar Beresolusi Tinggi
                      </Button>
                    </div>
                  </div>

                  {/* Image Column */}
                  <div
                    className={`lg:col-span-7 ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <BrowserFrame
                      url={feat.urlPath}
                      imageSrc={feat.image}
                      imageAlt={feat.imageAlt}
                      badgeText={feat.label}
                      onZoom={() =>
                        setZoomModal({
                          url: feat.image,
                          title: feat.label,
                          desc: feat.desc,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============ CARA KERJA ============ */}
      <section className="py-16 md:py-20 bg-muted/30 border-y-2 border-foreground/10">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Kurang dari 15 Menit, Sekolah Anda Beres.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tidak ada proses migrasi yang berbelit-belit. Tiga langkah ringkas untuk memulai.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative bg-card border-2 border-foreground rounded-2xl shadow-brutal p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="absolute -top-4 -left-2 w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center font-black shadow-brutal-sm">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border-2 border-foreground flex items-center justify-center mb-4 mt-2">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
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
              terkena kenaikan harga.
            </p>
          </div>

          <div className="relative bg-card border-4 border-primary rounded-2xl shadow-[8px_8px_0px_0px_hsl(var(--primary))] p-6 md:p-10 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 pb-6 border-b-2 border-foreground/10">
              <div>
                <h3 className="text-2xl font-extrabold text-foreground">Paket Sekolah Perintis</h3>
                <p className="text-muted-foreground text-sm">
                  Untuk satu sekolah — kapasitas 25 guru aktif penuh
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground line-through">Rp 4.925.000</p>
                <p className="text-4xl font-extrabold text-foreground">
                  Rp 1.500.000
                  <span className="text-base font-bold text-muted-foreground"> / tahun</span>
                </p>
                <p className="text-xs font-bold text-emerald-700">
                  Setara Rp 60.000 / guru / tahun
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {perintisBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
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
                sempurnakan bersama sekolah perintis. Itulah kenapa harganya sangat terjangkau — Anda ikut
                membentuknya, dan masukan Anda diprioritaskan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-16 md:py-24 bg-muted/30 border-t-2 border-foreground/10">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-muted-foreground">
              Masih ada yang ingin ditanyakan? Langsung chat tim admin kami melalui WhatsApp.
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
            <span className="text-sm font-bold text-primary">Slot Terbatas (10 Sekolah)</span>
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
              <GraduationCap className="w-4 h-4 text-green-600" /> Dibuat untuk Kurikulum Merdeka & KBC
            </span>
          </div>
        </div>
      </section>

      {/* ============ LIGHTBOX ZOOM MODAL ============ */}
      {zoomModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in-0 duration-200"
          onClick={() => setZoomModal(null)}
        >
          <div
            className="relative bg-card border-4 border-foreground rounded-2xl shadow-brutal max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-muted px-4 py-3 border-b-2 border-foreground flex items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-base text-foreground">{zoomModal.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{zoomModal.desc}</p>
              </div>
              <button
                onClick={() => setZoomModal(null)}
                className="w-8 h-8 rounded-lg bg-card border-2 border-foreground flex items-center justify-center hover:bg-muted font-bold transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="overflow-auto p-2 bg-muted/30 flex items-center justify-center">
              <img
                src={zoomModal.url}
                alt={zoomModal.title}
                className="w-full h-auto max-h-[75vh] object-contain rounded-lg border border-foreground/20"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-card border-t-2 border-foreground flex items-center justify-between text-xs text-muted-foreground">
              <span>Resolusi Asli 16:9 • Tampilan Nyata Mode Sekolah</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomModal(null)}
                className="border-2 border-foreground text-xs font-bold"
              >
                Tutup Tampilan
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
