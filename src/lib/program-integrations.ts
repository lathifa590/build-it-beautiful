// Integrasi Program Nasional (KKA, SIKAP, 7KAIH) — payload + prompt builder
// Shared between frontend prompt builder dan edge function (lewat string export).

import type { FormData } from '@/types/modul';

export type Jenjang = 'SD' | 'SMP' | 'SMA';

export function detectJenjang(kelas: string | undefined): Jenjang {
  const n = parseInt((kelas || '').replace(/\D/g, '') || '0', 10);
  if (n >= 1 && n <= 6) return 'SD';
  if (n >= 7 && n <= 9) return 'SMP';
  return 'SMA';
}

export const KKA_BY_JENJANG: Record<Jenjang, { koding: string[]; ai: string[] }> = {
  SD: {
    koding: [
      'Menghasilkan solusi masalah sehari-hari secara terstruktur (balok susun / kepingan gambar).',
      'Menyusun langkah sistematis dan logis dengan simbol/kosakata terbatas (algoritma dasar).',
      'Menjalankan urutan instruksi bersyarat sederhana (program berbasis blok: percabangan & pengulangan).',
      'Memahami distopia teknologi.',
    ],
    ai: [
      'Memahami dampak AI dalam kehidupan sehari-hari.',
      'Etika AI: AI tidak 100% benar, perlindungan data pribadi, AI untuk kebaikan.',
      'Membedakan teknologi AI dan non-AI.',
      'Konsep dasar input–proses–output.',
    ],
  },
  SMP: {
    koding: [
      'Merancang program untuk sistem manajemen sederhana (kumpul–pahami–olah data).',
      'Menulis program pada aplikasi sederhana berbasis simbol.',
      'Merancang produk digital sederhana.',
    ],
    ai: [
      'Memahami dampak AI terhadap masyarakat.',
      'Memahami persoalan AI: bias, ketergantungan berlebihan, halusinasi, hak cipta.',
      'Hubungan data dan AI lewat Teachable Machine; pentingnya data berkualitas.',
    ],
  },
  SMA: {
    koding: [
      'Merancang program berbasis teks lebih kompleks (fungsi & modul).',
      'Membuat program berbasis teks untuk masalah nyata (mis. simulasi pergerakan objek).',
      'Membuat produk digital yang lebih kompleks.',
    ],
    ai: [
      'Menggunakan AI dengan prompt engineering yang tepat.',
      'Memahami dampak AI terhadap pekerjaan.',
      'Mengevaluasi AI: transparansi, explainability, sustainability.',
      'Membangun model AI sederhana.',
      'Membangun aplikasi dengan model AI siap pakai (library/API).',
    ],
  },
};

export const SIKAP_PILLARS = [
  'Praktis & Kontekstual: pembelajaran sampai praktik (pembibitan → perawatan → panen).',
  'Peduli Lingkungan: pertanian ramah lingkungan & pemanfaatan barang bekas (galon, dll).',
  'Membentuk Karakter: wirausaha, tanggung jawab, gotong royong untuk hadapi krisis pangan.',
  'Kolaboratif: lintas warga sekolah & pemangku kepentingan (lintas jurusan/instansi).',
] as const;

export const KAIH_HABITS = [
  'Bangun Pagi',
  'Beribadah',
  'Berolahraga',
  'Makan Sehat & Bergizi',
  'Gemar Belajar',
  'Bermasyarakat',
  'Tidur Cepat / Cukup',
] as const;

export const ADIWIYATA_ASPEK = [
  'Kebersihan dan Sanitasi',
  'Keanekaragaman Hayati',
  'Penghematan dan Konservasi Energi',
  'Pengelolaan Sampah',
  'Penghematan dan Konservasi Air',
] as const;

export const SSK_TOPIK_BY_JENJANG: Record<Jenjang, string[]> = {
  SD: [
    'Pengenalan diri, keluarga, dan lingkungan terdekat (SD kelas rendah 1–3).',
    'Pra-remaja: kependudukan sederhana, urbanisasi ringan, cita-cita masa depan (SD kelas tinggi 4–6).',
  ],
  SMP: [
    'Pembentukan karakter & perkembangan remaja beserta permasalahannya.',
    'Pemahaman umum kependudukan, urbanisasi, ledakan penduduk & dampaknya.',
    'Perubahan sosial, ketenagakerjaan, pengenalan alat reproduksi & kesehatan reproduksi remaja.',
    'Konsep keluarga berkualitas.',
  ],
  SMA: [
    'Bonus demografi: peluang & tantangan struktur usia penduduk.',
    'Urbanisasi, ledakan penduduk & dampaknya pada pembangunan.',
    'Ketenagakerjaan dalam kerangka pembangunan ekonomi.',
    'Kesehatan reproduksi, pencegahan penyakit menular seksual, perencanaan keluarga berkualitas.',
    'Perubahan sosial akibat dinamika kependudukan.',
  ],
};

export const SRA_PRINSIP = [
  'Proses belajar menyenangkan, inklusif, bebas diskriminasi, penuh kasih sayang.',
  'Disiplin positif TANPA kekerasan fisik maupun psikis; guru sebagai pembimbing/sahabat.',
  'Partisipasi anak: dengarkan usulan murid dalam menyusun aturan & aktivitas kelas.',
  'Integrasi tematik ramah anak: kesehatan reproduksi, lingkungan hidup, Pengurangan Risiko Bencana (PRB).',
] as const;

export type IntegrasiProgram = {
  kka?: boolean;
  sikap?: boolean;
  kaih?: boolean;
  adiwiyata?: boolean;
  ssk?: boolean;
  sra?: boolean;
};

type ContentType = 'modul' | 'lkpd' | 'asesmen' | 'materi' | 'soal' | 'refleksi';

/**
 * Build the "INTEGRASI PROGRAM NASIONAL" block to inject into any prompt.
 * Returns empty string if nothing is enabled.
 */
export function buildIntegrationBlock(
  integrasi: IntegrasiProgram | undefined,
  kelas: string | undefined,
  contentType: ContentType = 'modul'
): string {
  if (!integrasi) return '';
  const active: string[] = [];
  const jenjang = detectJenjang(kelas);

  if (integrasi.kka) {
    const k = KKA_BY_JENJANG[jenjang];
    active.push(
`KKA — Kompetensi Koding & Kecerdasan Artifisial (jenjang ${jenjang})
  Koding:
${k.koding.map((x) => `  - ${x}`).join('\n')}
  Kecerdasan Artifisial:
${k.ai.map((x) => `  - ${x}`).join('\n')}
  Cara integrasi: sisipkan minimal 1 aktivitas pada Tahap Inti yang menggunakan logika algoritmik / literasi AI; pilih contoh problem yang sesuai materi inti. JANGAN ganti topik utama materi.`
    );
  }

  if (integrasi.sikap) {
    active.push(
`SIKAP — Sekolah Inovatif Ketahanan Pangan
${SIKAP_PILLARS.map((x) => `  - ${x}`).join('\n')}
  Cara integrasi: jadikan urban farming / hidroponik / akuaponik sebagai konteks "kaitan kehidupan"; tambahkan minimal 1 aktivitas projek mini bertema kemandirian pangan; tambahkan butir asesmen sikap peduli lingkungan & wirausaha.`
    );
  }

  if (integrasi.kaih) {
    active.push(
`7KAIH — 7 Kebiasaan Anak Indonesia Hebat
  ${KAIH_HABITS.map((x, i) => `${i + 1}. ${x}`).join('  •  ')}
  Cara integrasi: sisipkan 1 rutinitas relevan pada Tahap Awal (mis. doa, ice-breaking olahraga ringan, refleksi syukur) dan 1 pada Tahap Penutup (mis. komitmen tidur cukup / gemar belajar); selaraskan nilai karakter dengan kebiasaan yang paling relevan dengan materi.`
    );
  }

  if (integrasi.adiwiyata) {
    active.push(
`ADIWIYATA — Sekolah Peduli & Berbudaya Lingkungan
  Wajib memuat MINIMAL 1 aspek Kualitas Lingkungan Hidup:
${ADIWIYATA_ASPEK.map((x) => `  - ${x}`).join('\n')}
  Cara integrasi: sisipkan pada Tahap Inti/Penutup aktivitas nyata yang bertaut dengan salah satu aspek (mis. audit sampah kelas, hemat listrik & air, tanam bibit, kompos sederhana, inventaris keanekaragaman hayati sekolah); tambahkan minimal 1 butir asesmen sikap peduli lingkungan. Pilih aspek yang paling relevan dengan materi — JANGAN paksakan bila tidak nyambung.`
    );
  }

  if (integrasi.ssk) {
    const topikSSK = SSK_TOPIK_BY_JENJANG[jenjang];
    active.push(
`SSK — Sekolah Siaga Kependudukan (jenjang ${jenjang})
  Prinsip: sisipkan materi kependudukan ke mapel yang sudah ada TANPA menambah jam pelajaran.
  Topik rujukan untuk jenjang ini (pilih 1 yang paling relevan dengan materi inti):
${topikSSK.map((x) => `  - ${x}`).join('\n')}
  Cara integrasi: tambahkan 1 aktivitas pada Tahap Inti yang mengangkat topik kependudukan terpilih sebagai konteks (data/kasus/diskusi), dan 1 butir refleksi tentang implikasi kependudukan tersebut. JANGAN ganti materi inti — jadikan sisipan kontekstual.`
    );
  }

  if (integrasi.sra) {
    active.push(
`SRA — Sekolah Ramah Anak
  Prinsip yang WAJIB tercermin di Langkah Pembelajaran:
${SRA_PRINSIP.map((x) => `  - ${x}`).join('\n')}
  Cara integrasi: pada instruksi guru di Tahap Awal/Inti/Penutup, tampilkan secara eksplisit pendekatan ramah anak (mis. "guru mempersilakan murid mengusulkan aturan diskusi", "guru memberi umpan balik apresiatif tanpa membanding-bandingkan"); pada penilaian sikap, tambahkan 1 catatan disiplin positif. Bila relevan, sisipkan 1 aktivitas tematik ramah anak (kesehatan reproduksi / lingkungan hidup / Pengurangan Risiko Bencana).`
    );
  }



  if (!active.length) return '';

  const typeHint: Record<ContentType, string> = {
    modul: 'Jahit ke seksi yang sudah ada (Identifikasi Murid, Nilai Karakter, Kaitan Kehidupan, Langkah Pembelajaran, Penilaian). JANGAN buat seksi baru.',
    lkpd: 'Jadikan konteks aktivitas LKPD; sisipkan minimal 1 aktivitas yang merefleksikan program ini.',
    asesmen: 'Tambahkan minimal 1 butir rubrik / soal formatif terkait program ini.',
    materi: 'Tambahkan minimal 1 sub-bab/contoh konkret yang merujuk program ini.',
    soal: 'Sisipkan minimal 1 soal berkonteks program ini (sesuai jenjang).',
    refleksi: 'Tambahkan minimal 1 pertanyaan refleksi terkait program ini.',
  };

  return `

INTEGRASI PROGRAM NASIONAL (WAJIB diintegrasikan secara cerdas, tidak boleh diabaikan):

${active.join('\n\n')}

${typeHint[contentType]}
`;
}
