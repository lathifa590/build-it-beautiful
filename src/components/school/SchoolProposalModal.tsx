import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  School,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  FileText,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface SchoolProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName?: string;
  teacherName?: string;
}

const SUPPORT_WA = '6288228511309';

export const SchoolProposalModal: React.FC<SchoolProposalModalProps> = ({
  open,
  onOpenChange,
  schoolName,
  teacherName,
}) => {
  const [recipientTitle, setRecipientTitle] = useState('Bapak/Ibu Kepala Sekolah & Waka Kurikulum');
  const [copied, setCopied] = useState(false);

  const currentSchool = schoolName || 'Sekolah kita';
  const currentTeacher = teacherName || 'Kami (Dewan Guru)';

  const generateWaMessage = () => {
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Yth. ${recipientTitle} di ${currentSchool},

Izin menyampaikan usulan inovasi perangkat pembelajaran digital untuk mempermudah administrasi dewan guru di ${currentSchool}.

Saat ini dewan guru telah mencoba platform AI Perangkat Pembelajaran Kurikulum Merdeka (ModulAjar.Online) yang sangat membantu menyusun Modul Ajar, LKPD, Asesmen, Bank Soal, dan Refleksi secara cepat dan terstandar.

Tersedia Paket "Mode Sekolah" resmi yang sangat hemat dan tepat untuk dialokasikan melalui Dana BOS (Komponen Pengembangan Profesi Guru & Bahan Pembelajaran):

💡 KEUNGGULAN PAKET RESMI SEKOLAH:
1. Akses Penuh untuk 25 Dewan Guru (Semua mapel & fase).
2. Kop Surat & Lembar Pengesahan Resmi Sekolah tercetak otomatis dan seragam pada setiap dokumen.
3. Bank Modul & Shared Drive Sekolah — Waka Kurikulum dapat memantau dan mengurasi dokumen secara terpusat tanpa perlu menagih file satu per satu.
4. Siap Akreditasi & Supervisi Dinas — Rekap perangkat ajar tersusun rapi.
5. Biaya Sangat Hemat: Hanya Rp 1.500.000 / tahun untuk 25 guru (menghemat ~70% dibanding langganan mandiri Rp 4,9jt+).
6. Kelengkapan LPJ Resmi: Disediakan invoice resmi dan kuitansi atas nama sekolah/yayasan untuk SPJ BOS.

Mohon izin dan pertimbangan Bapak/Ibu agar sekolah kita dapat mengaktifkan Paket Mode Sekolah ini demi peningkatan mutu dan efisiensi waktu mengajar dewan guru.

Informasi aktivasi & jadwal demo dapat dicek melalui website: https://modulajar.online/paket-sekolah atau dapat kami bantu koordinasikan dengan admin.

Terima kasih banyak atas perhatian dan arahan Bapak/Ibu.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.
— Hormat kami, ${currentTeacher}`;
  };

  const messageText = generateWaMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      toast.success('Template pesan WhatsApp berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin teks ke clipboard');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleContactAdmin = () => {
    const adminText = `Halo Admin ModulAjar.Online 👋\n\nSaya ${currentTeacher} dari ${currentSchool}. Ingin konsultasi mengenai pengajuan proposal Paket Mode Sekolah (Dana BOS 25 Guru). Mohon dibantu info detail & invoice penawarannya. Terima kasih!`;
    window.open(`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(adminText)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-foreground shadow-brutal rounded-2xl bg-card p-4 sm:p-6 space-y-4">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#fef08a] text-foreground border-foreground border-2 font-black text-[11px] shadow-xs">
              <Sparkles className="w-3 h-3 mr-1 text-amber-700" /> REKOMENDASI DANA BOS 2026/2027
            </Badge>
            <Badge variant="outline" className="border-foreground/40 font-bold text-[11px]">
              Kapasitas 25 Guru
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            Usulkan Mode Sekolah ke Kepala Sekolah
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Bantu sekolah Anda menghemat hingga <strong>70% anggaran kurikulum</strong> dengan lisensi resmi 25 guru,
            termasuk Kop Resmi Otomatis, Bank Modul terpadu, dan kelengkapan SPJ BOS.
          </DialogDescription>
        </DialogHeader>

        {/* 1. KALKULASI PENGHEMATAN DANA BOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Langganan Pribadi */}
          <div className="p-3.5 rounded-xl border-2 border-foreground/20 bg-muted/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-muted-foreground uppercase">Langganan Mandiri / Cetak</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground/80 line-through decoration-rose-500 decoration-2">
                Rp 4.975.000
              </p>
              <p className="text-[10px] text-muted-foreground">Estimasi 25 guru beli sendiri per tahun</p>
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-foreground/10">
              <li className="flex items-center gap-1.5">
                <span className="text-rose-500">✕</span> Dokumen tercecer di flashdisk guru
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-500">✕</span> Kop surat tidak seragam
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-500">✕</span> Waka kurikulum repot supervisi
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-rose-500">✕</span> Tanpa invoice resmi SPJ sekolah
              </li>
            </ul>
          </div>

          {/* Card Paket Mode Sekolah Resmi */}
          <div className="p-3.5 rounded-xl border-2 border-foreground bg-[#e0f2fe] space-y-2 shadow-brutal-sm relative">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black border border-foreground">
                HEMAT 70%
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-sky-950 uppercase">Paket Mode Sekolah Resmi</span>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">
                Rp 1.500.000 <span className="text-xs font-bold text-muted-foreground">/ thn</span>
              </p>
              <p className="text-[10px] font-bold text-sky-900">
                Hanya Rp 60.000 per guru untuk 1 tahun penuh!
              </p>
            </div>
            <ul className="text-[11px] text-sky-950 space-y-1 pt-1 border-t border-sky-300">
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Kuota penuh 25 Akun Dewan Guru
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Kop & Pengesahan Sekolah Otomatis
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Bank Modul & Google Shared Drive
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Faktur, Invoice & Kuitansi SPJ BOS
              </li>
            </ul>
          </div>
        </div>

        {/* 2. DANA BOS INFO BOX */}
        <div className="p-3 rounded-xl border-2 border-foreground/20 bg-emerald-50 text-emerald-950 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <p className="leading-snug">
            <strong>Dapat dialokasikan resmi lewat pos Dana BOS:</strong> Komponen Pengembangan Profesi Guru atau
            Penyediaan Bahan Ajar Digital. Pembayaran fleksibel per tahun atau per semester.
          </p>
        </div>

        {/* 3. GENERATOR PESAN WA KE KEPSEK / WAKA */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-xs font-black text-foreground">
              Draf Pesan Pengajuan WhatsApp ke Pimpinan:
            </Label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-bold">Tujuan:</span>
              <Input
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="Panggilan Pimpinan"
                className="h-7 text-[11px] w-48 border border-foreground/40 rounded-lg px-2"
              />
            </div>
          </div>

          <Textarea
            value={messageText}
            readOnly
            rows={7}
            className="text-xs font-mono bg-muted/30 border-2 border-foreground rounded-xl resize-none select-all focus-visible:ring-0 leading-relaxed"
          />
        </div>

        {/* 4. TOMBOL AKSI */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t-2 border-foreground/10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleContactAdmin}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 self-center sm:self-auto h-9"
          >
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
            <span>Tanya Admin / Minta Invoice Penawaran</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex-1 sm:flex-none h-9 text-xs font-black border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Pesan WA</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none h-9 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Buka WhatsApp</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
