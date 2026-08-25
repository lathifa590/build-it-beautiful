import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Apa itu ModulAjar.Online?',
    answer: 'Platform berbasis AI cerdas (Gemini 2.5 Pro) untuk membantu guru menyusun administrasi pembelajaran sesuai format Kurikulum Merdeka dan KBC secara instan.',
  },
  {
    question: 'Apa bedanya Mode Cepat dan Mode Workspace?',
    answer: 'Pilih Mode Cepat jika Anda sedang buru-buru, butuh Modul Ajar dadakan untuk mengajar besok, tanpa pusing memikirkan pengarsipan jangka panjang. Tapi, kalau Anda ingin merencanakan pembelajaran satu semester penuh, memantau target Jam Pelajaran (JP), dan menyimpan semua dokumen agar bisa dipakai lagi tahun depan, maka Mode Workspace (Paket Pro) adalah jawabannya.',
  },
  {
    question: 'Apakah aplikasi ini perlu di-install?',
    answer: 'Tidak perlu! ModulAjar.Online 100% berbasis cloud (web). Anda bisa mengaksesnya kapan saja dari laptop, tablet, atau smartphone (HP) tanpa perlu mengunduh atau menginstal apapun.',
  },
  {
    question: 'Apa bedanya Paket Standar (149K) dan Paket Pro (197K)?',
    answer: 'Paket Standar (149K) memberikan akses ke AI dan Mode Cepat selama setahun. Paket Pro (197K) memberikan fitur eksklusif Workspace untuk manajemen perangkat ajar yang jauh lebih rapi, terukur, dan tersimpan aman di cloud.',
  },
  {
    question: 'Apakah format yang dihasilkan sudah sesuai aturan resmi?',
    answer: 'Ya, seluruh dokumen dirancang menyesuaikan regulasi terbaru Kurikulum Merdeka (Kemdikbudristek) dan KBC (Kemenag).',
  },
  {
    question: 'Apakah dokumen bisa diedit dan diunduh?',
    answer: 'Tentu! Anda bisa mengeditnya secara manual di web, atau menggunakan AI untuk mengubah spesifik bagian. Dokumen siap di-export ke format Word (.docx) maupun PDF.',
  },
];

export const FAQSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-lg text-muted-foreground">
            Punya pertanyaan lain? Silakan tanyakan kepada kami.
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
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
