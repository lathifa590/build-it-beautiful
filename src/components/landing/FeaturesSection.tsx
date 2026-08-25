import { BookOpen, FileText, ClipboardCheck, Database, GraduationCap, RefreshCw, CalendarRange, CalendarDays, Target, Pencil, Sparkles, Copy, Layers, FolderOpen, LineChart } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Modul Ajar (RPM)',
    description: 'Rencana Pembelajaran Mendalam sesuai Kurikulum Merdeka dan KBC (Kurikulum Berbasis Cinta) Kemenag.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  {
    icon: FileText,
    title: 'LKPD Deep Learning',
    description: 'Lembar Kerja Peserta Didik dengan pendekatan Higher Order Thinking Skills (HOTS).',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
  {
    icon: ClipboardCheck,
    title: 'Asesmen Lengkap',
    description: 'Asesmen Diagnostik, Formatif, dan Sumatif dalam satu kali generate.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  {
    icon: Database,
    title: 'Bank Soal HOTS',
    description: 'Pilihan Ganda, Isian, Essay, dan TKA dengan level kognitif C1-C6.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
  },
  {
    icon: GraduationCap,
    title: 'Materi Pembelajaran',
    description: 'Materi lengkap dengan pendahuluan, isi materi, glosarium, dan referensi.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  {
    icon: RefreshCw,
    title: 'Refleksi & Tindak Lanjut',
    description: 'Refleksi guru-siswa serta program remedial dan pengayaan otomatis.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
  },
  {
    icon: CalendarRange,
    title: 'Program Tahunan (Prota)',
    description: 'Distribusi TP, JP, dan Dimensi Profil Lulusan otomatis per semester dari CP.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-300',
    isNew: true,
  },
  {
    icon: CalendarDays,
    title: 'Program Semester (Prosem)',
    description: 'Grid jadwal mingguan dengan event PTS, PAS, dan libur terintegrasi.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    isNew: true,
  },
  {
    icon: Target,
    title: 'KKTP',
    description: 'Rubrik 4 level deskriptor per Tujuan Pembelajaran, auto-generate dari Prota.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-300',
    isNew: true,
  },
  {
    icon: RefreshCw,
    title: 'Regenerate per Tab',
    description: 'Generate ulang konten per tab tanpa reset semua. Regenerate Modul otomatis reset tab lain untuk konsistensi data.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    isNew: true,
  },
  {
    icon: Sparkles,
    title: 'Edit Manual & AI',
    description: 'Edit bagian dokumen secara manual atau gunakan instruksi AI untuk mengubah section tertentu tanpa regenerate seluruh dokumen.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    isNew: true,
  },
  {
    icon: Copy,
    title: 'Export Prompt AI',
    description: 'Salin prompt berkualitas tinggi ke ChatGPT, Claude, atau Gemini. Gratis, tanpa kuota, langsung dari data form Anda.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-300',
    isNew: true,
  },
  {
    icon: Layers,
    title: 'Modul Multi-Pertemuan',
    description: 'Generate Rencana Pembelajaran untuk banyak pertemuan (misalnya 10 pertemuan) sekaligus dalam sekali klik!',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-300',
    isNew: true,
  },
  {
    icon: FolderOpen,
    title: 'Manajemen Workspace',
    description: 'Simpan dan kelola perangkat ajar secara terstruktur berdasarkan mata pelajaran, kelas, dan tahun ajaran.',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100',
    borderColor: 'border-fuchsia-300',
    isNew: true,
  },
  {
    icon: LineChart,
    title: 'Tracking Progress',
    description: 'Pantau otomatis persentase ketercapaian Program Semester (Prosem) dan target Jam Pelajaran (JP).',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    isNew: true,
  },
];
export const FeaturesSection = () => {
  return (
    <section id="fitur" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            15 Fitur Unggulan dalam Satu Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk menyiapkan administrasi pembelajaran, 
            tersedia dalam satu aplikasi.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group bg-card border-2 border-foreground rounded-xl p-3 md:p-6 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 ${feature.bgColor} border-2 ${feature.borderColor} rounded-xl mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 md:w-7 md:h-7 ${feature.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <h3 className="text-sm md:text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  {'isNew' in feature && feature.isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] md:text-xs font-bold bg-primary text-primary-foreground rounded">
                      Baru
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-base text-muted-foreground line-clamp-3 md:line-clamp-none">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
