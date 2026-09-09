export interface MapelMapping {
  slug: string;
  nama: string;
  aliases: string[];
  filterNama?: string;
  isMadrasah?: boolean;
}

export const MAPEL_LIST: MapelMapping[] = [
  { slug: 'matematika', nama: 'Matematika', aliases: ['mtk', 'math'] },
  { slug: 'matematika-tingkat-lanjut', nama: 'Matematika Tingkat Lanjut', aliases: ['mtk lanjut'] },
  { slug: 'bahasa-indonesia', nama: 'Bahasa Indonesia', aliases: ['bindo', 'b.indo', 'b. indonesia'] },
  { slug: 'bahasa-indonesia-tingkat-lanjut', nama: 'Bahasa Indonesia Tingkat Lanjut', aliases: ['bindo lanjut'] },
  { slug: 'bahasa-inggris', nama: 'Bahasa Inggris', aliases: ['bing', 'b.ing', 'b. inggris', 'english'] },
  { slug: 'bahasa-inggris-tingkat-lanjut', nama: 'Bahasa Inggris Tingkat Lanjut', aliases: ['bing lanjut'] },
  { slug: 'ilmu-pengetahuan-alam-dan-sosial-ipas', nama: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', aliases: ['ipas'] },
  { slug: 'ilmu-pengetahuan-alam-ipa', nama: 'IPA (Ilmu Pengetahuan Alam)', aliases: ['ipa', 'ilmu pengetahuan alam'] },
  { slug: 'ilmu-pengetahuan-sosial-ips', nama: 'IPS (Ilmu Pengetahuan Sosial)', aliases: ['ips', 'ilmu pengetahuan sosial'] },
  { slug: 'pendidikan-pancasila', nama: 'Pendidikan Pancasila', aliases: ['ppkn', 'pkn', 'pancasila'] },
  // Pendidikan Agama - per agama spesifik
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Islam dan Budi Pekerti', aliases: ['pai', 'agama islam', 'islam'], filterNama: 'Pendidikan Agama Islam' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Kristen dan Budi Pekerti', aliases: ['agama kristen', 'kristen', 'pak'], filterNama: 'Pendidikan Agama Kristen' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Katolik dan Budi Pekerti', aliases: ['agama katolik', 'katolik'], filterNama: 'Pendidikan Agama Katolik' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Hindu dan Budi Pekerti', aliases: ['agama hindu', 'hindu'], filterNama: 'Pendidikan Agama Hindu' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Buddha dan Budi Pekerti', aliases: ['agama buddha', 'buddha', 'budha'], filterNama: 'Pendidikan Agama Buddha' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Konghucu dan Budi Pekerti', aliases: ['agama konghucu', 'konghucu', 'khonghucu'], filterNama: 'Pendidikan Agama Konghucu' },
  // Entry generik tanpa filter (tampilkan semua agama)
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama dan Budi Pekerti', aliases: ['agama', 'pabp'] },
  // Madrasah Subjects
  { slug: 'bahasa-arab', nama: 'Bahasa Arab', aliases: ['arab'], isMadrasah: true },
  { slug: 'al-quran-hadis', nama: "Al-Qur'an Hadis", aliases: ['alquran', 'hadis', 'quran hadis'], isMadrasah: true },
  { slug: 'akidah-akhlak', nama: 'Akidah Akhlak', aliases: ['akidah', 'akhlak'], isMadrasah: true },
  { slug: 'fikih', nama: 'Fikih', aliases: ['fiqih', 'fikih'], isMadrasah: true },
  { slug: 'sejarah-kebudayaan-islam', nama: 'Sejarah Kebudayaan Islam (SKI)', aliases: ['ski', 'sejarah kebudayaan islam'], isMadrasah: true },
  { slug: 'al-quran-hadis-tafsir', nama: "Al-Qur'an Hadis (Tafsir)", aliases: ['quran hadis tafsir'], filterNama: "Al-Qur'an Hadis (Tafsir)", isMadrasah: true },
  { slug: 'al-quran-hadis-hadis', nama: "Al-Qur'an Hadis (Hadis)", aliases: ['quran hadis hadis'], filterNama: "Al-Qur'an Hadis (Hadis)", isMadrasah: true },
  { slug: 'ilmu-tafsir', nama: 'Ilmu Tafsir', aliases: ['tafsir'], filterNama: 'Ilmu Tafsir', isMadrasah: true },
  { slug: 'ilmu-hadis', nama: 'Ilmu Hadis', aliases: ['ilmu hadis'], filterNama: 'Ilmu Hadis', isMadrasah: true },
  { slug: 'ilmu-kalam', nama: 'Ilmu Kalam', aliases: ['kalam'], filterNama: 'Ilmu Kalam', isMadrasah: true },
  { slug: 'akhlak-tasawuf', nama: 'Akhlak Tasawuf', aliases: ['tasawuf'], filterNama: 'Akhlak Tasawuf', isMadrasah: true },
  { slug: 'fikih-mapk', nama: 'Fikih (MAPK)', aliases: ['fikih mapk', 'fiqih mapk'], filterNama: 'Fikih (MAPK)', isMadrasah: true },
  { slug: 'ushul-fikih-mapk', nama: 'Ushul Fikih (MAPK)', aliases: ['ushul fikih', 'ushul fiqih'], filterNama: 'Ushul Fikih (MAPK)', isMadrasah: true },
  { slug: 'bahasa-arab-mapk', nama: 'Bahasa Arab (MAPK)', aliases: ['arab mapk'], filterNama: 'Bahasa Arab (MAPK)', isMadrasah: true },
  { slug: 'pendidikan-jasmani-olahraga-dan-kesehatan-pjok', nama: 'PJOK (Pendidikan Jasmani Olahraga dan Kesehatan)', aliases: ['pjok', 'penjas', 'olahraga'] },
  { slug: 'informatika', nama: 'Informatika', aliases: ['info', 'tik'] },
  { slug: 'koding-dan-kecerdasan-artifisial', nama: 'Koding dan Kecerdasan Artifisial', aliases: ['koding', 'ai', 'coding'] },
  { slug: 'fisika', nama: 'Fisika', aliases: [] },
  { slug: 'kimia', nama: 'Kimia', aliases: [] },
  { slug: 'biologi', nama: 'Biologi', aliases: ['bio'] },
  { slug: 'sejarah', nama: 'Sejarah', aliases: [] },
  { slug: 'sejarah-tingkat-lanjut', nama: 'Sejarah Tingkat Lanjut', aliases: [] },
  { slug: 'geografi', nama: 'Geografi', aliases: ['geo'] },
  { slug: 'ekonomi', nama: 'Ekonomi', aliases: ['eko'] },
  { slug: 'sosiologi', nama: 'Sosiologi', aliases: ['sosio'] },
  { slug: 'antropologi', nama: 'Antropologi', aliases: [] },
  { slug: 'seni-musik', nama: 'Seni Musik', aliases: ['musik'] },
  { slug: 'seni-rupa', nama: 'Seni Rupa', aliases: [] },
  { slug: 'seni-tari', nama: 'Seni Tari', aliases: ['tari'] },
  { slug: 'seni-teater', nama: 'Seni Teater', aliases: ['teater'] },
];

export interface MapelMatch {
  slug: string;
  filterNama?: string;
  isMadrasah?: boolean;
}

/**
 * Find the best matching mapel slug (and optional filterNama) from user input text
 */
export function findMapelSlug(input: string): MapelMatch | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  const toResult = (m: MapelMapping): MapelMatch => ({
    slug: m.slug,
    filterNama: m.filterNama,
    isMadrasah: m.isMadrasah,
  });

  // Exact match on nama
  const exact = MAPEL_LIST.find(m => m.nama.toLowerCase() === normalized);
  if (exact) return toResult(exact);

  // Exact match on alias
  const alias = MAPEL_LIST.find(m => m.aliases.some(a => a.toLowerCase() === normalized));
  if (alias) return toResult(alias);

  // Partial match on slug
  const slugMatch = MAPEL_LIST.find(m => m.slug === normalized.replace(/\s+/g, '-'));
  if (slugMatch) return toResult(slugMatch);

  // Contains match on nama
  const contains = MAPEL_LIST.find(m => m.nama.toLowerCase().includes(normalized) || normalized.includes(m.nama.toLowerCase()));
  if (contains) return toResult(contains);

  // Contains match on alias
  const aliasContains = MAPEL_LIST.find(m => m.aliases.some(a => normalized.includes(a) || a.includes(normalized)));
  if (aliasContains) return toResult(aliasContains);

  return null;
}

export interface FallbackInfo {
  parentMapelName: string;
  description: string;
  originalMapel: string;
}

export interface ResolvedMapelCP {
  slug: string;
  filterNama?: string;
  isMadrasah?: boolean;
  isFallback: boolean;
  fallbackInfo?: FallbackInfo;
}

export const PHASE_FALLBACK_MAPEL: Record<
  string,
  Record<string, { targetSlug: string; parentMapelName: string; description: string }>
> = {
  fisika: {
    E: {
      targetSlug: 'ilmu-pengetahuan-alam-ipa',
      parentMapelName: 'IPA (Ilmu Pengetahuan Alam)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Fisika pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi pengukuran ilmiah, gerak, dan energi alternatif untuk digunakan pada modul ajar Fisika Anda.',
    },
  },
  kimia: {
    E: {
      targetSlug: 'ilmu-pengetahuan-alam-ipa',
      parentMapelName: 'IPA (Ilmu Pengetahuan Alam)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Kimia pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi partikel materi dan stoikiometri reaksi kimia untuk modul ajar Kimia Anda.',
    },
  },
  biologi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-alam-ipa',
      parentMapelName: 'IPA (Ilmu Pengetahuan Alam)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Biologi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi keanekaragaman hayati, mikroorganisme, dan ekosistem untuk modul ajar Biologi Anda.',
    },
  },
  ekonomi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Ekonomi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup konsep kebutuhan manusia, kelangkaan, dan sistem keuangan untuk modul ajar Ekonomi Anda.',
    },
  },
  sosiologi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Sosiologi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup fungsi sosiologi, interaksi sosial, dan gejala sosial di masyarakat untuk modul ajar Sosiologi Anda.',
    },
  },
  geografi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemdikbudristek (BSKAP No. 032/2024), mata pelajaran Geografi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup konsep dasar geografi, litosfer, atmosfer, hidrosfer, dan SIG untuk modul ajar Geografi Anda.',
    },
  },
};

export function resolveMapelCP(mataPelajaran: string, fase?: string): ResolvedMapelCP | null {
  const match = findMapelSlug(mataPelajaran);
  if (!match) return null;

  const normalizedFase = (fase || '').trim().toUpperCase().replace(/^FASE\s*/i, '');
  const fallbackEntry = normalizedFase ? PHASE_FALLBACK_MAPEL[match.slug]?.[normalizedFase] : undefined;

  if (fallbackEntry) {
    return {
      slug: fallbackEntry.targetSlug,
      filterNama: match.filterNama,
      isMadrasah: match.isMadrasah,
      isFallback: true,
      fallbackInfo: {
        parentMapelName: fallbackEntry.parentMapelName,
        description: fallbackEntry.description,
        originalMapel: mataPelajaran,
      },
    };
  }

  return {
    slug: match.slug,
    filterNama: match.filterNama,
    isMadrasah: match.isMadrasah,
    isFallback: false,
  };
}
