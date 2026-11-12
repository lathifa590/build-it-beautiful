export interface MapelMapping {
  slug: string;
  nama: string;
  aliases: string[];
  filterNama?: string;
  isMadrasah?: boolean;
  isMasterOnly?: boolean;
}

export const MAPEL_LIST: MapelMapping[] = [
  // Local-master exclusive entries placed before broader names to avoid slug collisions
  { slug: 'pendidikan-anak-usia-dini', nama: 'Capaian Pembelajaran PAUD (Fase Fondasi)', aliases: ['paud', 'tk', 'ra', 'tk/paud', 'paud/ra', 'pendidikan anak usia dini', 'pendidikan anak usia dini / ra'], isMasterOnly: true },
  { slug: 'projek-ipas', nama: 'Projek IPAS (Ilmu Pengetahuan Alam dan Sosial)', aliases: ['projek ipas', 'projek ipas smk', 'ipas smk'], isMasterOnly: true },
  { slug: 'matematika-tingkat-lanjut', nama: 'Matematika Tingkat Lanjut', aliases: ['mtk lanjut'], filterNama: 'Matematika Tingkat Lanjut' },
  { slug: 'matematika', nama: 'Matematika', aliases: ['mtk', 'math'], filterNama: 'Matematika' },
  { slug: 'bahasa-indonesia-tingkat-lanjut', nama: 'Bahasa Indonesia Tingkat Lanjut', aliases: ['bindo lanjut'], filterNama: 'Bahasa Indonesia Tingkat Lanjut' },
  { slug: 'bahasa-indonesia', nama: 'Bahasa Indonesia', aliases: ['bindo', 'b.indo', 'b. indonesia'], filterNama: 'Bahasa Indonesia' },
  { slug: 'bahasa-inggris-tingkat-lanjut', nama: 'Bahasa Inggris Tingkat Lanjut', aliases: ['bing lanjut'], filterNama: 'Bahasa Inggris Tingkat Lanjut' },
  { slug: 'bahasa-inggris', nama: 'Bahasa Inggris', aliases: ['bing', 'b.ing', 'b. inggris', 'english'], filterNama: 'Bahasa Inggris' },
  { slug: 'ilmu-pengetahuan-alam-dan-sosial-ipas', nama: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', aliases: ['ipas', 'ilmu pengetahuan alam dan sosial', 'ilmu pengetahuan alam dan sosial (ipas)'], filterNama: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)' },
  { slug: 'ilmu-pengetahuan-alam-ipa', nama: 'IPA (Ilmu Pengetahuan Alam)', aliases: ['ipa', 'ilmu pengetahuan alam', 'ilmu pengetahuan alam (ipa)'], filterNama: 'Ilmu Pengetahuan Alam (IPA)' },
  { slug: 'ilmu-pengetahuan-sosial-ips', nama: 'IPS (Ilmu Pengetahuan Sosial)', aliases: ['ips', 'ilmu pengetahuan sosial', 'ilmu pengetahuan sosial (ips)'], filterNama: 'Ilmu Pengetahuan Sosial (IPS)' },
  { slug: 'pendidikan-pancasila', nama: 'Pendidikan Pancasila', aliases: ['ppkn', 'pkn', 'pancasila'], filterNama: 'Pendidikan Pancasila' },
  // Pendidikan Agama - per agama spesifik
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Islam dan Budi Pekerti', aliases: ['pai', 'agama islam', 'islam'], filterNama: 'Pendidikan Agama Islam' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Kristen dan Budi Pekerti', aliases: ['agama kristen', 'kristen', 'pak'], filterNama: 'Pendidikan Agama Kristen' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Katolik dan Budi Pekerti', aliases: ['agama katolik', 'katolik'], filterNama: 'Pendidikan Agama Katolik' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Hindu dan Budi Pekerti', aliases: ['agama hindu', 'hindu'], filterNama: 'Pendidikan Agama Hindu' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Buddha dan Budi Pekerti', aliases: ['agama buddha', 'buddha', 'budha'], filterNama: 'Pendidikan Agama Buddha' },
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama Konghucu dan Budi Pekerti', aliases: ['agama konghucu', 'konghucu', 'khonghucu', 'agama khonghucu', 'pendidikan agama khonghucu dan budi pekerti'], filterNama: 'Pendidikan Agama Khonghucu' },
  // Entry generik tanpa filter (tampilkan semua agama)
  { slug: 'pendidikan-agama-dan-budi-pekerti', nama: 'Pendidikan Agama dan Budi Pekerti', aliases: ['agama', 'pabp'] },
  // Madrasah Subjects
  { slug: 'bahasa-arab-mapk', nama: 'Bahasa Arab (MAPK)', aliases: ['arab mapk'], filterNama: 'Bahasa Arab (MAPK)', isMadrasah: true },
  { slug: 'bahasa-arab', nama: 'Bahasa Arab', aliases: ['arab'], isMadrasah: true },
  { slug: 'al-quran-hadis-tafsir', nama: "Al-Qur'an Hadis (Tafsir)", aliases: ['quran hadis tafsir'], filterNama: "Al-Qur'an Hadis (Tafsir)", isMadrasah: true },
  { slug: 'al-quran-hadis-hadis', nama: "Al-Qur'an Hadis (Hadis)", aliases: ['quran hadis hadis'], filterNama: "Al-Qur'an Hadis (Hadis)", isMadrasah: true },
  { slug: 'al-quran-hadis', nama: "Al-Qur'an Hadis", aliases: ['alquran', 'hadis', 'quran hadis'], isMadrasah: true },
  { slug: 'akidah-akhlak', nama: 'Akidah Akhlak', aliases: ['akidah', 'akhlak'], isMadrasah: true },
  { slug: 'fikih-mapk', nama: 'Fikih (MAPK)', aliases: ['fikih mapk', 'fiqih mapk'], filterNama: 'Fikih (MAPK)', isMadrasah: true },
  { slug: 'ushul-fikih-mapk', nama: 'Ushul Fikih (MAPK)', aliases: ['ushul fikih', 'ushul fiqih'], filterNama: 'Ushul Fikih (MAPK)', isMadrasah: true },
  { slug: 'fikih', nama: 'Fikih', aliases: ['fiqih', 'fikih'], isMadrasah: true },
  { slug: 'sejarah-kebudayaan-islam', nama: 'Sejarah Kebudayaan Islam (SKI)', aliases: ['ski', 'sejarah kebudayaan islam'], isMadrasah: true },
  { slug: 'ilmu-tafsir', nama: 'Ilmu Tafsir', aliases: ['tafsir'], filterNama: 'Ilmu Tafsir', isMadrasah: true },
  { slug: 'ilmu-hadis', nama: 'Ilmu Hadis', aliases: ['ilmu hadis'], filterNama: 'Ilmu Hadis', isMadrasah: true },
  { slug: 'ilmu-kalam', nama: 'Ilmu Kalam', aliases: ['kalam'], filterNama: 'Ilmu Kalam', isMadrasah: true },
  { slug: 'akhlak-tasawuf', nama: 'Akhlak Tasawuf', aliases: ['tasawuf'], filterNama: 'Akhlak Tasawuf', isMadrasah: true },
  { slug: 'pendidikan-jasmani-olahraga-dan-kesehatan-pjok', nama: 'PJOK (Pendidikan Jasmani Olahraga dan Kesehatan)', aliases: ['pjok', 'penjas', 'olahraga', 'pendidikan jasmani, olahraga, dan kesehatan', 'pendidikan jasmani, olahraga, dan kesehatan (pjok)'], filterNama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
  { slug: 'informatika', nama: 'Informatika', aliases: ['info', 'tik'], filterNama: 'Informatika' },
  { slug: 'koding-dan-kecerdasan-artifisial', nama: 'Koding dan Kecerdasan Artifisial (SMK/MAK)', aliases: ['koding smk', 'ka smk', 'koding dan kecerdasan artifisial smk'], filterNama: 'Koding dan Kecerdasan Artifisial (SMK/MAK)' },
  { slug: 'koding-dan-kecerdasan-artifisial', nama: 'Koding dan Kecerdasan Artifisial', aliases: ['koding', 'ai', 'coding', 'koding dan kecerdasan artifisial (ka)', 'koding dan kecerdasan artifisial (sd/mi, smp/mts, sma/ma)'], filterNama: 'Koding dan Kecerdasan Artifisial (SD/MI, SMP/MTs, SMA/MA)' },
  { slug: 'fisika', nama: 'Fisika', aliases: [], filterNama: 'Fisika' },
  { slug: 'kimia', nama: 'Kimia', aliases: [], filterNama: 'Kimia' },
  { slug: 'biologi', nama: 'Biologi', aliases: ['bio'], filterNama: 'Biologi' },
  { slug: 'sejarah-tingkat-lanjut', nama: 'Sejarah Tingkat Lanjut', aliases: ['sejarah lanjut'], filterNama: 'Sejarah Tingkat Lanjut' },
  { slug: 'sejarah', nama: 'Sejarah (SMK/MAK)', aliases: ['sejarah smk', 'sejarah (smk)', 'sejarah smk/mak'], filterNama: 'Sejarah (SMK/MAK)' },
  { slug: 'sejarah', nama: 'Sejarah', aliases: ['sejarah (sma/ma)', 'sejarah sma', 'sejarah indonesia'], filterNama: 'Sejarah (SMA/MA)' },
  { slug: 'geografi', nama: 'Geografi', aliases: ['geo'], filterNama: 'Geografi' },
  { slug: 'ekonomi', nama: 'Ekonomi', aliases: ['eko'], filterNama: 'Ekonomi' },
  { slug: 'sosiologi', nama: 'Sosiologi', aliases: ['sosio'], filterNama: 'Sosiologi' },
  { slug: 'antropologi', nama: 'Antropologi', aliases: [], filterNama: 'Antropologi' },
  { slug: 'seni-musik', nama: 'Seni Musik', aliases: ['musik'], filterNama: 'Seni Musik' },
  { slug: 'seni-rupa', nama: 'Seni Rupa', aliases: [], filterNama: 'Seni Rupa' },
  { slug: 'seni-tari', nama: 'Seni Tari', aliases: ['tari'], filterNama: 'Seni Tari' },
  { slug: 'seni-teater', nama: 'Seni Teater', aliases: ['teater'], filterNama: 'Seni Teater' },
];

export interface MapelMatch {
  slug: string;
  filterNama?: string;
  isMadrasah?: boolean;
  isMasterOnly?: boolean;
}

export function normalizeMapelLabel(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/khonghucu/g, 'konghucu')
    .replace(/\s+/g, ' ');
}

export function filterMapelByNama<T extends { nama: string }>(mpList: T[], filterNama?: string): T[] {
  if (!filterNama) return mpList;
  const normFilter = normalizeMapelLabel(filterNama);
  const exactMatches = mpList.filter((mp) => normalizeMapelLabel(mp.nama) === normFilter);
  if (exactMatches.length > 0) return exactMatches;
  return mpList.filter((mp) => normalizeMapelLabel(mp.nama).includes(normFilter));
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWordMatch(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:$|[^a-z0-9])`, 'i');
  return pattern.test(haystack);
}

/**
 * Find the best matching mapel slug (and optional filterNama) from user input text
 */
export function findMapelSlug(input: string): MapelMatch | null {
  const normalized = normalizeMapelLabel(input);
  if (!normalized) return null;

  const toResult = (m: MapelMapping): MapelMatch => ({
    slug: m.slug,
    filterNama: m.filterNama,
    isMadrasah: m.isMadrasah,
    isMasterOnly: m.isMasterOnly,
  });

  // Exact match on nama
  const exact = MAPEL_LIST.find(m => normalizeMapelLabel(m.nama) === normalized);
  if (exact) return toResult(exact);

  // Exact match on alias
  const alias = MAPEL_LIST.find(m => m.aliases.some(a => normalizeMapelLabel(a) === normalized));
  if (alias) return toResult(alias);

  // Partial match on slug
  const slugMatch = MAPEL_LIST.find(m => m.slug === normalized.replace(/\s+/g, '-'));
  if (slugMatch) return toResult(slugMatch);

  // Word-boundary match on alias before broad substring matches
  const aliasWord = MAPEL_LIST.find(m => m.aliases.some(a => hasWordMatch(normalized, normalizeMapelLabel(a))));
  if (aliasWord) return toResult(aliasWord);

  // Contains match on nama
  const contains = MAPEL_LIST.find(m => {
    const namaNorm = normalizeMapelLabel(m.nama);
    return (normalized.length >= 3 && namaNorm.includes(normalized)) || normalized.includes(namaNorm);
  });
  if (contains) return toResult(contains);

  // Contains match on longer aliases
  const aliasContains = MAPEL_LIST.find(m =>
    m.aliases.some(a => {
      const aNorm = normalizeMapelLabel(a);
      return aNorm.length >= 4 && (normalized.includes(aNorm) || (normalized.length >= 4 && aNorm.includes(normalized)));
    })
  );
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
  isMasterOnly?: boolean;
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
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Fisika pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi pengukuran ilmiah, gerak, dan energi alternatif untuk digunakan pada modul ajar Fisika Anda.',
    },
  },
  kimia: {
    E: {
      targetSlug: 'ilmu-pengetahuan-alam-ipa',
      parentMapelName: 'IPA (Ilmu Pengetahuan Alam)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Kimia pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi partikel materi dan stoikiometri reaksi kimia untuk modul ajar Kimia Anda.',
    },
  },
  biologi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-alam-ipa',
      parentMapelName: 'IPA (Ilmu Pengetahuan Alam)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Biologi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPA. Di bawah ini disajikan CP resmi IPA Fase E yang mencakup kompetensi keanekaragaman hayati, mikroorganisme, dan ekosistem untuk modul ajar Biologi Anda.',
    },
  },
  ekonomi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Ekonomi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup konsep kebutuhan manusia, kelangkaan, dan sistem keuangan untuk modul ajar Ekonomi Anda.',
    },
  },
  sosiologi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Sosiologi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup fungsi sosiologi, interaksi sosial, dan gejala sosial di masyarakat untuk modul ajar Sosiologi Anda.',
    },
  },
  geografi: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Geografi pada Fase E (Kelas X) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup konsep dasar geografi, litosfer, atmosfer, hidrosfer, dan SIG untuk modul ajar Geografi Anda.',
    },
  },
  sejarah: {
    E: {
      targetSlug: 'ilmu-pengetahuan-sosial-ips',
      parentMapelName: 'IPS (Ilmu Pengetahuan Sosial)',
      description:
        'Sesuai regulasi resmi Kemendikdasmen (BSKAP No. 046/H/KR/2025), mata pelajaran Sejarah pada Fase E (Kelas X SMA) terintegrasi dalam Capaian Pembelajaran (CP) IPS. Di bawah ini disajikan CP resmi IPS Fase E yang mencakup konsep dasar ilmu sejarah dan penelitian sejarah untuk modul ajar Sejarah Anda.',
    },
  },
};

export function resolveMapelCP(mataPelajaran: string, fase?: string): ResolvedMapelCP | null {
  const match = findMapelSlug(mataPelajaran);
  if (!match) return null;

  const normalizedFase = (fase || '').trim().toUpperCase().replace(/^FASE\s*/i, '');
  const isSmkVariant = Boolean(match.filterNama?.toUpperCase().includes('SMK'));
  const fallbackEntry =
    normalizedFase && !isSmkVariant ? PHASE_FALLBACK_MAPEL[match.slug]?.[normalizedFase] : undefined;

  if (fallbackEntry) {
    return {
      slug: fallbackEntry.targetSlug,
      filterNama: undefined,
      isMadrasah: match.isMadrasah,
      isMasterOnly: false,
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
    isMasterOnly: match.isMasterOnly,
    isFallback: false,
  };
}
