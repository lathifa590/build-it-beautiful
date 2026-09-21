import React from 'react';
import { LandingPageProps } from './LandingPageTemplate';
import { CheckCircle2 } from 'lucide-react';
import { KurikulumKBCContent } from './components/KurikulumKBCContent';
import { RPPMadrasahContent } from './components/RPPMadrasahContent';

export const SEOPagesData: Record<string, Omit<LandingPageProps, 'slug'>> = {
  'generator-modul-ajar': {
    seoTitle: "Generator Modul Ajar Otomatis dengan AI | ModulAjar.Online",
    seoDescription: "Buat Modul Ajar Kurikulum Merdeka & KBC secara otomatis menggunakan AI. Menghemat waktu guru dengan hasil yang profesional dan sesuai standar.",
    h1: "Generator Modul Ajar Otomatis dengan AI",
    subheadline: "Platform AI pintar yang membantu guru Indonesia menyusun Modul Ajar lengkap (Identitas, Langkah Pembelajaran, Asesmen, LKPD) hanya dalam hitungan menit.",
    showKbcBadge: false,
    faqs: [
      { question: "Apa itu generator Modul Ajar AI?", answer: "Sebuah alat berbasis kecerdasan buatan (AI) yang membantu guru merancang dan menulis Modul Ajar secara otomatis berdasarkan topik dan kelas yang dipilih." },
      { question: "Apakah hasilnya sesuai Kurikulum Merdeka?", answer: "Ya, output yang dihasilkan telah disesuaikan dengan format dan standar Kurikulum Merdeka yang berlaku di Indonesia." },
      { question: "Apakah aplikasinya gratis?", answer: "Kami menyediakan versi uji coba gratis untuk memastikan Anda bisa mencoba langsung kemudahan menyusun perangkat ajar dengan AI." },
      { question: "Format apa yang didukung untuk unduhan?", answer: "Anda dapat mengunduh hasilnya secara langsung dalam format Microsoft Word (.docx) sehingga mudah untuk disunting kembali." }
    ],
    schema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Generator Modul Ajar AI",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR"
      }
    })
  },
  'generator-rpp': {
    seoTitle: "Generator RPP Kurikulum Merdeka Otomatis | ModulAjar.Online",
    seoDescription: "Aplikasi pembuat RPP Kurikulum Merdeka otomatis dengan AI. Dapatkan RPP berdiferensiasi yang terintegrasi Profil Pelajar Pancasila dengan cepat.",
    h1: "Generator RPP Kurikulum Merdeka Otomatis",
    subheadline: "Tinggalkan kerumitan format RPP manual. Gunakan AI untuk men-generate RPP yang inovatif, berdiferensiasi, dan mematuhi standar Kurikulum Merdeka secara instan.",
    showKbcBadge: false,
    faqs: [
      { question: "Apa bedanya RPP dengan Modul Ajar di Kurikulum Merdeka?", answer: "Modul Ajar sering dianggap sebagai RPP Plus. RPP biasanya lebih ringkas (berisi tujuan, langkah, dan asesmen), sedangkan Modul Ajar dilengkapi dengan materi bahan ajar, LKPD yang komprehensif, dan instrumen asesmen lengkap." },
      { question: "Bisakah RPP ini diedit lagi?", answer: "Tentu saja. Hasil generate AI bisa langsung Anda download sebagai file Word dan dapat diubah sesuai kebutuhan spesifik kelas Anda." },
      { question: "Apakah RPP yang dihasilkan sudah mencakup pembelajaran berdiferensiasi?", answer: "Ya, AI kami dirancang untuk memasukkan elemen pembelajaran berdiferensiasi baik dari segi konten, proses, maupun produk." }
    ],
    schema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Generator RPP Otomatis",
      "applicationCategory": "EducationalApplication"
    })
  },
  'generator-lkpd': {
    seoTitle: "Generator LKPD Otomatis dengan AI | ModulAjar.Online",
    seoDescription: "Buat Lembar Kerja Peserta Didik (LKPD) yang menarik dan interaktif secara otomatis menggunakan AI untuk Kurikulum Merdeka & KBC.",
    h1: "Generator LKPD Otomatis dengan AI untuk Guru",
    subheadline: "Hasilkan lembar kerja yang memancing berpikir kritis (HOTS) dan disesuaikan dengan tingkat pemahaman murid hanya dengan beberapa klik.",
    faqs: [
      { question: "Apakah bentuk LKPD yang dihasilkan bervariasi?", answer: "Ya, AI akan merancang berbagai tipe aktivitas seperti pilihan ganda, isian singkat, diskusi kelompok, hingga proyek sederhana." },
      { question: "Apakah kunci jawaban juga disediakan?", answer: "Ya, selain panduan pengerjaan untuk siswa, sistem juga meng-generate kunci jawaban dan rubrik penilaian untuk guru." }
    ]
  },
  'generator-asesmen': {
    seoTitle: "Generator Asesmen & Bank Soal Otomatis | ModulAjar.Online",
    seoDescription: "Buat soal asesmen formatif dan sumatif Kurikulum Merdeka secara otomatis. Dilengkapi kunci jawaban dan rubrik penilaian.",
    h1: "Generator Asesmen & Bank Soal Otomatis",
    subheadline: "Otomatiskan pembuatan soal formatif, sumatif, hingga asesmen diagnostik yang valid, reliabel, dan selaras dengan Tujuan Pembelajaran.",
    faqs: [
      { question: "Apakah soal yang dihasilkan berbasis HOTS?", answer: "Ya, Anda bisa menyesuaikan level kognitif soal (C1 hingga C6) termasuk soal-soal HOTS (Higher Order Thinking Skills)." },
      { question: "Berapa banyak soal yang bisa dibuat?", answer: "Anda bisa meng-generate mulai dari 5 hingga puluhan soal dalam satu kali proses generasi." }
    ]
  },
  'kurikulum-merdeka': {
    seoTitle: "Perangkat Ajar Kurikulum Merdeka Otomatis | ModulAjar.Online",
    seoDescription: "Aplikasi terpadu untuk membuat perangkat ajar Kurikulum Merdeka (Modul Ajar, RPP, Prota, Promes, ATP) untuk semua jenjang SD, SMP, SMA/SMK.",
    h1: "Platform AI Perangkat Ajar Kurikulum Merdeka",
    subheadline: "Satu aplikasi terintegrasi untuk menyusun CP, TP, ATP, Modul Ajar, hingga Asesmen yang 100% selaras dengan regulasi Kemendikbudristek.",
    faqs: [
      { question: "Apakah mendukung semua Fase?", answer: "Ya, sistem kami mendukung penuh dari Fase A (SD Kelas 1-2) hingga Fase F (SMA/SMK Kelas 11-12)." },
      { question: "Apakah update dengan regulasi terbaru?", answer: "Kami terus memonitor kebijakan BSKAP dan Kemendikbudristek untuk memastikan struktur modul yang dihasilkan relevan dan ter-update." }
    ]
  },
  'kurikulum-kbc': {
    seoTitle: "Modul Ajar & RPP Kurikulum KBC Madrasah | ModulAjar.Online",
    seoDescription: "Buat Modul Ajar dan RPP Kurikulum Berbasis Cinta (KBC) dari Kemenag untuk jenjang MI, MTs, dan MA secara otomatis.",
    h1: "Generator Modul Ajar & RPP Kurikulum KBC untuk Madrasah",
    subheadline: "Satu-satunya AI yang dirancang khusus memahami struktur Kurikulum Berbasis Cinta (KBC) Kemenag. Lengkap dengan integrasi nilai-nilai Panca Cinta.",
    showKbcBadge: true,
    ctaText: "Buat RPP KBC Gratis Sekarang →",
    bottomCtaText: "Buat RPP KBC Gratis Sekarang →",
    ctaClassName: "bg-[#15803d] hover:bg-[#111] shadow-[3px_3px_0_#111] text-white",
    customContent: <KurikulumKBCContent />,
    faqs: [
      { question: "Apa itu KBC Kemenag?", answer: "KBC singkatan dari Kurikulum Berbasis Cinta, sebuah terobosan Kemenag untuk menciptakan ekosistem madrasah yang ramah, penuh kasih, dan sarat nilai spiritual." },
      { question: "Apa bedanya KBC dengan Kurikulum Merdeka?", answer: "Perbedaan utamanya terletak pada landasan filosofis Panca Cinta dan struktur mata pelajaran agama yang lebih detail di KBC." },
      { question: "Apakah ModulAjar.Online support KBC?", answer: "Ya, kami adalah salah satu platform AI pertama yang memiliki opsi khusus untuk format dokumen dan alur pedagogi KBC." },
      { question: "Jenjang apa saja yang menggunakan KBC?", answer: "MI (Madrasah Ibtidaiyah), MTs (Madrasah Tsanawiyah), dan MA (Madrasah Aliyah)." },
      { question: "Apakah RPP KBC berbeda dengan RPP biasa?", answer: "Ya, RPP KBC mewajibkan adanya insersi nilai-nilai kasih sayang dan pendekatan spiritual di dalam pendahuluan, inti, hingga penutup pembelajaran." }
    ],
    schema: JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Generator KBC Madrasah",
        "applicationCategory": "EducationalApplication"
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Apa itu KBC Kemenag?", "acceptedAnswer": { "@type": "Answer", "text": "KBC singkatan dari Kurikulum Berbasis Cinta, sebuah terobosan Kemenag untuk menciptakan ekosistem madrasah yang ramah, penuh kasih, dan sarat nilai spiritual." } },
          { "@type": "Question", "name": "Apa bedanya KBC dengan Kurikulum Merdeka?", "acceptedAnswer": { "@type": "Answer", "text": "Perbedaan utamanya terletak pada landasan filosofis Panca Cinta dan struktur mata pelajaran agama yang lebih detail di KBC." } },
          { "@type": "Question", "name": "Apakah ModulAjar.Online support KBC?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, kami adalah salah satu platform AI pertama yang memiliki opsi khusus untuk format dokumen dan alur pedagogi KBC." } },
          { "@type": "Question", "name": "Jenjang apa saja yang menggunakan KBC?", "acceptedAnswer": { "@type": "Answer", "text": "MI (Madrasah Ibtidaiyah), MTs (Madrasah Tsanawiyah), dan MA (Madrasah Aliyah)." } },
          { "@type": "Question", "name": "Apakah RPP KBC berbeda dengan RPP biasa?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, RPP KBC mewajibkan adanya insersi nilai-nilai kasih sayang dan pendekatan spiritual di dalam pendahuluan, inti, hingga penutup pembelajaran." } }
        ]
      }
    ])
  },
  'rpp-madrasah': {
    seoTitle: "Generator RPP & Modul Ajar Madrasah KBC | ModulAjar.Online",
    seoDescription: "Buat RPP dan Modul Ajar untuk MI, MTs, dan MA secara otomatis dengan AI. Sesuaikan dengan standar Kemenag dan KBC.",
    h1: "Generator RPP & Modul Ajar Madrasah (MI, MTs, MA) Otomatis",
    subheadline: "Susun perangkat pembelajaran khas Madrasah secara cepat. Mendukung mata pelajaran keagamaan seperti Fikih, SKI, Akidah Akhlak dengan dalil-dalil otomatis.",
    showKbcBadge: true,
    ctaText: "Generate Modul Ajar Madrasah →",
    bottomCtaText: "Generate Modul Ajar Madrasah →",
    ctaClassName: "bg-[#15803d] hover:bg-[#111] shadow-[3px_3px_0_#111] text-white",
    customContent: <RPPMadrasahContent />,
    faqs: [
      { question: "Apakah RPP KBC berbeda dengan RPP Kurikulum Merdeka?", answer: "Ya, RPP KBC mewajibkan adanya insersi nilai-nilai kasih sayang dan spiritual di dalam pendahuluan, inti, hingga penutup pembelajaran." },
      { question: "Bagaimana cara membuat RPP KBC di ModulAjar.Online?", answer: "Sangat mudah. Anda hanya perlu memilih jenjang madrasah (MI/MTs/MA), lalu memasukkan topik pelajaran. Sistem kami otomatis mengonfigurasi output sesuai SK Dirjen Pendis." },
      { question: "Apakah dalil Al-Quran dan Hadis otomatis masuk ke RPP?", answer: "Tentu. Ini adalah fitur unggulan kami. AI akan mencari dan menyisipkan dalil yang paling relevan dengan topik (misalnya QS. Al-Baqarah: 43 untuk topik Zakat) lengkap dengan terjemahannya." },
      { question: "Berapa lama membuat RPP KBC dengan AI?", answer: "Kurang dari 30 detik. RPP langsung siap diunduh dalam format Word (Docx) dan siap untuk dicetak atau disunting." },
      { question: "Apakah bisa untuk semua mapel madrasah?", answer: "Ya, kami mendukung mapel umum (Matematika, IPA) maupun mapel agama (Fikih, SKI, Qur'an Hadis, Akidah Akhlak, Bahasa Arab)." }
    ],
    schema: JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Generator RPP Madrasah",
        "applicationCategory": "EducationalApplication"
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Apakah RPP KBC berbeda dengan RPP Kurikulum Merdeka?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, RPP KBC mewajibkan adanya insersi nilai-nilai kasih sayang dan spiritual di dalam pendahuluan, inti, hingga penutup pembelajaran." } },
          { "@type": "Question", "name": "Bagaimana cara membuat RPP KBC di ModulAjar.Online?", "acceptedAnswer": { "@type": "Answer", "text": "Sangat mudah. Anda hanya perlu memilih jenjang madrasah (MI/MTs/MA), lalu memasukkan topik pelajaran. Sistem kami otomatis mengonfigurasi output sesuai SK Dirjen Pendis." } },
          { "@type": "Question", "name": "Apakah dalil Al-Quran dan Hadis otomatis masuk ke RPP?", "acceptedAnswer": { "@type": "Answer", "text": "Tentu. Ini adalah fitur unggulan kami. AI akan mencari dan menyisipkan dalil yang paling relevan dengan topik (misalnya QS. Al-Baqarah: 43 untuk topik Zakat) lengkap dengan terjemahannya." } },
          { "@type": "Question", "name": "Berapa lama membuat RPP KBC dengan AI?", "acceptedAnswer": { "@type": "Answer", "text": "Kurang dari 30 detik. RPP langsung siap diunduh dalam format Word (Docx) dan siap untuk dicetak atau disunting." } },
          { "@type": "Question", "name": "Apakah bisa untuk semua mapel madrasah?", "acceptedAnswer": { "@type": "Answer", "text": "Ya, kami mendukung mapel umum (Matematika, IPA) maupun mapel agama (Fikih, SKI, Qur'an Hadis, Akidah Akhlak, Bahasa Arab)." } }
        ]
      }
    ])
  },
  'modul-ajar-mi': {
    seoTitle: "Modul Ajar MI (Madrasah Ibtidaiyah) Otomatis AI | ModulAjar.Online",
    seoDescription: "Generator Modul Ajar dan RPP khusus untuk jenjang MI (Madrasah Ibtidaiyah). Sesuai standar KBC Kemenag.",
    h1: "Generator Modul Ajar MI (Madrasah Ibtidaiyah) dengan AI",
    subheadline: "Bantu guru MI menyusun perangkat ajar tematik dan bidang studi dengan pendekatan yang menyenangkan dan penuh cinta ala KBC.",
    showKbcBadge: true,
    faqs: [
      { question: "Apakah mendukung pendekatan tematik untuk MI kelas bawah?", answer: "Ya, AI dapat memadukan beberapa mata pelajaran ke dalam satu tema besar sesuai standar MI kelas 1, 2, dan 3." }
    ]
  },
  'modul-ajar-mts': {
    seoTitle: "Modul Ajar MTs (Madrasah Tsanawiyah) Otomatis | ModulAjar.Online",
    seoDescription: "Aplikasi AI pembuat Modul Ajar dan RPP untuk MTs (Madrasah Tsanawiyah). Lengkap dan sesuai pedoman Kemenag.",
    h1: "Generator Modul Ajar MTs (Madrasah Tsanawiyah) dengan AI",
    subheadline: "Rancang pembelajaran yang menantang namun bermakna untuk siswa MTs. Otomatis terintegrasi dengan capaian pembelajaran Kemenag.",
    showKbcBadge: true,
    faqs: [
      { question: "Apakah mendukung Kurikulum Merdeka sekaligus KBC di MTs?", answer: "Ya, Anda bisa memilih format Kurikulum Merdeka standar atau format KBC spesifik saat men-generate dokumen." }
    ]
  },
  'modul-ajar-ma': {
    seoTitle: "Modul Ajar MA (Madrasah Aliyah) Otomatis AI | ModulAjar.Online",
    seoDescription: "Buat perangkat ajar untuk MA (Madrasah Aliyah) dalam hitungan menit. Modul Ajar, RPP, LKPD yang mendalam dan komprehensif.",
    h1: "Generator Modul Ajar MA (Madrasah Aliyah) dengan AI",
    subheadline: "Tingkatkan kualitas literasi dan pemikiran analitis siswa MA melalui perangkat ajar yang disusun cerdas oleh AI.",
    showKbcBadge: true,
    faqs: [
      { question: "Bisakah membuat modul untuk peminatan di MA?", answer: "Sangat bisa. Anda bisa spesifik menyebutkan materi peminatan seperti MIPA, IPS, Bahasa, atau Keagamaan (MAK) di prompt Anda." }
    ]
  },
  'generator-prota-promes': {
    seoTitle: "Generator Prota & Promes Kurikulum Merdeka Otomatis AI | ModulAjar.Online",
    seoDescription: "Aplikasi AI pembuat Program Tahunan (Prota) dan Program Semester (Promes) Kurikulum Merdeka otomatis. Hitung alokasi Jam Pelajaran (JP) dan distribusi materi secara instan.",
    h1: "Generator Prota & Promes Kurikulum Merdeka Otomatis AI",
    subheadline: "Otomatiskan penyusunan Program Tahunan (Prota) dan Program Semester (Promes). AI memetakan Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) langsung ke dalam distribusi pekan efektif dan jam pelajaran.",
    showKbcBadge: false,
    faqs: [
      { question: "Apa itu Generator Prota & Promes AI?", answer: "Alat bantu kecerdasan buatan yang secara otomatis menyusun tabel distribusi Tujuan Pembelajaran (TP), materi pokok, dan alokasi Jam Pelajaran (JP) ke dalam pekan efektif semester 1 dan semester 2." },
      { question: "Apakah perhitungan Jam Pelajaran (JP) otomatis dihitung?", answer: "Ya, sistem menghitung total JP semester dan mendistribusikannya secara proporsional sesuai bobot materi dan kalender pendidikan." },
      { question: "Bisakah langsung diturunkan menjadi Modul Ajar mingguan?", answer: "Sangat bisa! Di ModulAjar.Online, jadwal Prota yang sudah dibuat dapat langsung di-generate menjadi Modul Ajar per pertemuan secara bersambung." },
      { question: "Format file apa yang didukung?", answer: "Hasil Prota dan Promes dapat langsung di-export ke Microsoft Word (.docx) atau disalin dengan format tabel rapi yang siap cetak." }
    ],
    schema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Generator Prota & Promes AI",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR"
      }
    })
  },
  'generator-modul-ajar-deep-learning': {
    seoTitle: "Generator Modul Ajar Deep Learning (Pembelajaran Mendalam) AI | ModulAjar.Online",
    seoDescription: "Aplikasi AI pembuat Modul Ajar dengan pendekatan Deep Learning (Mindful, Meaningful, Joyful Learning). Rancang pembelajaran bermakna dan terarah sesuai standar Kemendikdasmen.",
    h1: "Generator Modul Ajar Deep Learning (Pembelajaran Mendalam) AI",
    subheadline: "Rancang modul ajar dengan pendekatan Pembelajaran Mendalam (Deep Learning) secara otomatis. Menghadirkan pembelajaran yang Mindful (sadar), Meaningful (bermakna), dan Joyful (menyenangkan) untuk siswa.",
    showKbcBadge: false,
    faqs: [
      { question: "Apa itu pendekatan Deep Learning dalam Kurikulum Merdeka?", answer: "Deep Learning (Pembelajaran Mendalam) adalah pendekatan pedagogis yang berfokus pada 3 pilar utama: Mindful Learning (siswa fokus dan sadar tujuan belajar), Meaningful Learning (materi dikaitkan dengan konteks dunia nyata), dan Joyful Learning (suasana belajar yang menyenangkan dan menumbuhkan rasa ingin tahu)." },
      { question: "Bagaimana AI ModulAjar.Online mengintegrasikan Deep Learning?", answer: "AI kami menyusun langkah pembelajaran yang memicu pemikiran tingkat tinggi (HOTS), refleksi bermakna, eksperimen kontekstual, dan asesmen autentik yang selaras dengan prinsip Pembelajaran Mendalam." },
      { question: "Apakah pendekatan ini cocok untuk semua jenjang (SD, SMP, SMA)?", answer: "Ya, pendekatan ini sangat fleksibel dan dapat diimplementasikan mulai dari fase fondasi/PAUD hingga jenjang menengah atas (SMA/SMK/MA)." },
      { question: "Apakah modul hasil generate bisa langsung dicetak?", answer: "Ya, dokumen langsung siap di-download dalam format Word (.docx) lengkap dengan komponen identitas, langkah deep learning, rubrik asesmen, dan LKPD." }
    ],
    schema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Generator Modul Ajar Deep Learning AI",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR"
      }
    })
  }
};
