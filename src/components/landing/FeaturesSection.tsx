import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  Database, 
  CalendarRange, 
  Copy, 
  Sparkles, 
  Download, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  FolderOpen, 
  LineChart, 
  RefreshCw, 
  GraduationCap, 
  Target, 
  Heart,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const WA_NUMBER = '6288228511309';
const DEMO_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin, saya ingin melihat demo atau mencoba ModulAjar.Online.')}`;

export const FeaturesSection: React.FC = () => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyDemoPrompt = () => {
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <section id="fitur" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-2 border-primary/30 rounded-full mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs md:text-sm font-extrabold text-primary tracking-wide uppercase">
              Bukan Sekadar Ikon Biasa
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            Lihat Langsung Antarmuka Nyata <span className="text-primary">ModulAjar.Online</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Setiap fitur dirancang langsung untuk mempermudah alur kerja guru: otomatis, rapi, patuh regulasi terbaru, dan siap cetak dalam hitungan detik.
          </p>
        </div>

        {/* 6 Flagship Features with Real UI Mockups */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          
          {/* Card 1: Modul Ajar (RPM) & Deep Learning */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/rpm
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-3">
                {/* Meta pills */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded">
                    Informatika • Fase D (Kelas 7)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded border border-emerald-300">
                    BSKAP No. 046/2025
                  </span>
                </div>

                {/* Sub tabs */}
                <div className="flex items-center gap-1 border-b border-border pb-1.5 text-[11px]">
                  <span className="font-bold text-primary border-b-2 border-primary pb-0.5">Modul Ajar (RPM)</span>
                  <span className="text-muted-foreground px-2">LKPD</span>
                  <span className="text-muted-foreground px-2">Asesmen</span>
                  <span className="text-muted-foreground px-2">Bank Soal</span>
                </div>

                {/* Document preview snippet */}
                <div className="bg-card p-2.5 rounded-lg border border-border text-[11px] space-y-1.5">
                  <div className="font-extrabold text-foreground">RENCANA PEMBELAJARAN MENDALAM (RPM)</div>
                  <div className="text-muted-foreground text-[10px] line-clamp-2">
                    Materi: Berpikir Komputasional • Model: Problem-Based Learning (PBL) Berdiferensiasi
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="font-semibold text-foreground text-[10px]">A. Kegiatan Pembelajaran Bermakna</span>
                  </div>
                  <div className="h-1.5 bg-primary/20 rounded w-5/6" />
                  <div className="h-1.5 bg-muted rounded w-4/6" />
                </div>
              </div>

              {/* Visual callout pointer */}
              <div className="absolute -bottom-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>⚡ Siap Cetak</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Modul Ajar (RPM) & Deep Learning
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Susun Rencana Pembelajaran Mendalam (RPM) lengkap dengan kegiatan awal, inti berdiferensiasi, dan penutup sesuai regulasi Kurikulum Merdeka & KBC Kemenag.
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Lihat Contoh Modul RPM
                </Button>
              </a>
            </div>
          </div>

          {/* Card 2: Database CP Resmi Otomatis */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/cp-selector
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-foreground">Cari CP Resmi Kemdikbud</span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    BSKAP No. 046/2025
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground border-b border-border pb-1">
                  Mata Pelajaran: <strong>Informatika — Fase D</strong>
                </div>

                {/* CP Element checklist items */}
                <div className="space-y-1.5">
                  <div className="p-1.5 rounded border border-primary/40 bg-primary/5 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[10px] text-primary">Berpikir Komputasional</div>
                      <div className="text-[9px] text-muted-foreground line-clamp-1">
                        Memahami konsep komputasi, pemodelan data, dan dekomposisi masalah.
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5 rounded border border-primary/40 bg-primary/5 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[10px] text-primary">Literasi Digital</div>
                      <div className="text-[9px] text-muted-foreground line-clamp-1">
                        Pemanfaatan perangkat TIK secara bijak, aman, dan beretika.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Callout */}
              <div className="absolute -bottom-2.5 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>🎯 Tanpa Buka PDF Manual</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Database CP Resmi Otomatis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Gak perlu lagi bongkar atau copy-paste PDF regulasi ratusan halaman! Cukup pilih mapel dan fase, seluruh elemen CP resmi terisi otomatis dan akurat.
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Coba Pencarian CP Otomatis
                </Button>
              </a>
            </div>
          </div>

          {/* Card 3: 1-Klik Ekspor Word (.docx) & PDF Lengkap Kop */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/export
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-foreground">Pengaturan Ekspor Dokumen</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">Kop ON</span>
                </div>

                {/* Export Buttons Simulator */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded border-2 border-primary bg-primary/5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-[10px] font-extrabold text-foreground">Word (.docx)</div>
                      <div className="text-[8px] text-muted-foreground">Format F4 / A4</div>
                    </div>
                  </div>
                  <div className="p-2 rounded border border-border bg-card flex items-center gap-2">
                    <Download className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="text-[10px] font-extrabold text-foreground">Dokumen PDF</div>
                      <div className="text-[8px] text-muted-foreground">Siap Cetak Instan</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Paper with Kop */}
                <div className="p-2 bg-muted/40 rounded border border-border text-[9px] space-y-1">
                  <div className="text-center font-bold text-[9px] uppercase border-b border-foreground/20 pb-1">
                    PEMERINTAH KABUPATEN • DINAS PENDIDIKAN
                  </div>
                  <div className="flex justify-between items-center text-[8px] pt-0.5 text-muted-foreground">
                    <span>Dokumen: Modul Ajar</span>
                    <span>Status: Disetujui Kepala Sekolah</span>
                  </div>
                </div>
              </div>

              {/* Callout */}
              <div className="absolute -bottom-2.5 right-4 bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>🖨️ Format Standar F4 & A4</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Ekspor Word (.docx) & PDF Lengkap Kop
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  1-klik unduh dokumen rapi standar F4/A4 dengan Kop Sekolah resmi dan lembar pengesahan. Tabel dan margin sudah presisi, siap cetak tanpa repot diedit lagi.
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Lihat Contoh Hasil Ekspor
                </Button>
              </a>
            </div>
          </div>

          {/* Card 4: Bank Soal HOTS & Asesmen Lengkap C1–C6 */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/soal-hots
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-2.5">
                {/* Cognitive level pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">C1</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">C2</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">C3</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded border border-purple-300">C4 (Analisis)</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded border border-purple-300">C5 (Evaluasi)</span>
                </div>

                {/* Sample Question */}
                <div className="bg-card p-2 rounded border border-border text-[10px] space-y-1">
                  <div className="font-bold text-foreground">1. Soal Pilihan Ganda (HOTS - C4)</div>
                  <div className="text-muted-foreground text-[9px] line-clamp-1">
                    Diberikan permasalahan algoritma pencarian rute terpendek...
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-muted-foreground pt-0.5">
                    <span className="p-0.5 bg-muted rounded">A. Dekomposisi</span>
                    <span className="p-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200">✓ B. Abstraksi</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>Asesmen: Diagnostik, Formatif, Sumatif</span>
                  <span className="font-bold text-primary">Kunci & Rubrik Terlampir</span>
                </div>
              </div>

              {/* Callout */}
              <div className="absolute -bottom-2.5 right-4 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>🧠 HOTS C1–C6 Komprehensif</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Bank Soal HOTS & Asesmen Lengkap
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Dilengkapi bank soal pilihan ganda, isian, dan uraian berbobot HOTS (C1–C6) lengkap dengan kunci jawaban, kisi-kisi, serta rubrik asesmen diagnostik, formatif, dan sumatif.
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Coba Buat Soal HOTS
                </Button>
              </a>
            </div>
          </div>

          {/* Card 5: Perencanaan Semester (Prota & Prosem Mingguan) */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/prota-prosem
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-foreground">Program Semester (Prosem) Gasal</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded">Target 72 JP</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">Ketercapaian Target JP</span>
                    <span className="font-bold text-emerald-600">72 / 72 JP (100%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Calendar Grid Mini */}
                <div className="grid grid-cols-4 gap-1 text-[8px] text-center pt-1">
                  <div className="p-1 bg-primary/10 rounded font-semibold text-primary">Juli: M3-M4</div>
                  <div className="p-1 bg-primary/10 rounded font-semibold text-primary">Agust: M1-M4</div>
                  <div className="p-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 rounded font-bold">PTS Ganjil</div>
                  <div className="p-1 bg-primary/10 rounded font-semibold text-primary">Okt: M1-M4</div>
                </div>
              </div>

              {/* Callout */}
              <div className="absolute -bottom-2.5 right-4 bg-cyan-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>📅 Matriks Mingguan & JP Otomatis</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Program Tahunan (Prota) & Prosem
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Hitung dan distribusikan Tujuan Pembelajaran (TP) serta alokasi Jam Pelajaran (JP) ke dalam kalender mingguan secara presisi tanpa perlu menghitung manual di Excel.
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Atur Jadwal Semester
                </Button>
              </a>
            </div>
          </div>

          {/* Card 6: Export Prompt AI Bebas Kuota & Sistem BYOK */}
          <div className="group bg-card border-2 border-foreground rounded-2xl shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col overflow-hidden">
            {/* Window Frame Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b-2 border-foreground/30">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-0.5 rounded border border-border">
                modulajar.online/app/prompt-export
              </span>
            </div>

            {/* Micro UI Mockup */}
            <div className="p-4 bg-muted/20 border-b border-border/60 relative">
              <div className="bg-background rounded-xl p-3.5 border border-border/80 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-foreground">Kirim Prompt ke AI Pilihan Anda</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Unlimited BYOK</span>
                </div>

                {/* Target AI Buttons */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1 rounded bg-muted/70 text-[9px] font-bold border border-border flex items-center justify-center gap-1">
                    <span>⚡ ChatGPT</span>
                  </div>
                  <div className="p-1 rounded bg-muted/70 text-[9px] font-bold border border-border flex items-center justify-center gap-1">
                    <span>✨ Claude</span>
                  </div>
                  <div className="p-1 rounded bg-muted/70 text-[9px] font-bold border border-border flex items-center justify-center gap-1">
                    <span>💎 Gemini</span>
                  </div>
                </div>

                {/* Copy button simulation */}
                <button
                  type="button"
                  onClick={handleCopyDemoPrompt}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPrompt ? 'Prompt Berhasil Disalin! ✓' : '1-Click Salin Prompt Siap Pakai'}</span>
                </button>
              </div>

              {/* Callout */}
              <div className="absolute -bottom-2.5 right-4 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <span>🚀 Bebas Pakai di AI Mana Saja</span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  Export Prompt AI & Sistem BYOK
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Mau buat sendiri di Claude, Gemini, atau ChatGPT? Salin prompt berkualitas tinggi langsung dari data form Anda secara gratis tanpa batasan kuota kredit!
                </p>
              </div>
              <a href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold border-2 border-foreground/30 hover:border-foreground">
                  Pelajari Sistem BYOK Unlimited
                </Button>
              </a>
            </div>
          </div>

        </div>

        {/* Compact Bar of Remaining Features (15-in-1 Complete Platform) */}
        <div className="bg-card border-2 border-foreground rounded-2xl p-6 md:p-8 shadow-brutal">
          <div className="text-center md:text-left mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-foreground">
                Plus 9 Fitur Hebat Lainnya dalam Satu Akun
              </h3>
              <p className="text-sm text-muted-foreground">
                Dirancang lengkap untuk memenuhi seluruh ekosistem administrasi guru Indonesia.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-center md:self-auto px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full">
              <span>Paket 15-in-1 Lengkap</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <Layers className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Modul Multi-Pertemuan</h4>
                <p className="text-xs text-muted-foreground">Generate s.d. 10 pertemuan sekaligus dalam satu klik.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <Target className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Rubrik KKTP 4-Level</h4>
                <p className="text-xs text-muted-foreground">Auto-generate kriteria ketercapaian dari Tujuan Pembelajaran.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Regenerate per Tab</h4>
                <p className="text-xs text-muted-foreground">Ubah modul tanpa merusak data LKPD atau asesmen yang sudah pas.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <Pencil className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Edit Manual & Asisten AI</h4>
                <p className="text-xs text-muted-foreground">Perbaiki bagian tertentu dokumen dengan instruksi teks santai.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <FolderOpen className="w-5 h-5 text-fuchsia-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Manajemen Workspace</h4>
                <p className="text-xs text-muted-foreground">Simpan terstruktur per mapel, kelas, dan tahun ajaran di cloud.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <LineChart className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Tracking Progress JP</h4>
                <p className="text-xs text-muted-foreground">Pantau otomatis ketercapaian semester dan sisa jam ajar.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <GraduationCap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Bahan Ajar & Glosarium</h4>
                <p className="text-xs text-muted-foreground">Materi pendahuluan, isi inti, glosarium, dan referensi belajar.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <Heart className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">KBC Kemenag (Madrasah)</h4>
                <p className="text-xs text-muted-foreground">Dukungan penuh Kurikulum Berbasis Cinta untuk RA, MI, MTs, MA.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
              <RefreshCw className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Refleksi & Remedial</h4>
                <p className="text-xs text-muted-foreground">Panduan refleksi guru-murid serta rencana remedial & pengayaan.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
