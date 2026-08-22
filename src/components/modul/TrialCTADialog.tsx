import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, X, Users } from 'lucide-react';

interface TrialCTADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 'quota' = kuota harian habis | 'busy' = server gratis penuh/overload */
  reason?: 'quota' | 'busy';
}

const WA_NUMBER = '6288228511309';
const WA_PREFILL = encodeURIComponent(
  'Halo, saya ingin membeli akses FULL Modul Ajar Online! 🎓\n' +
  'Saya sudah mencoba versi trial dan tertarik untuk upgrade ke lisensi penuh.\n' +
  'Mohon info harga dan cara pembelian. Terima kasih!'
);
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_PREFILL}`;

const BENEFITS = [
  'Generate modul ajar tanpa batas kuota',
  'LKPD, Asesmen, Materi & Bank Soal lengkap',
  'Akses Workspace & Perencanaan PRO',
  'Prota, Prosem & Penjadwalan otomatis',
];

const CONTENT = {
  quota: {
    icon: Sparkles,
    title: 'Kuota Harian Anda Habis!',
    description: (
      <>
        Kuota harian untuk akun gratis sudah terpakai.{' '}
        Upgrade ke akses <strong className="text-white">FULL</strong> dan generate{' '}
        <strong className="text-white">tanpa batas kuota</strong>!
      </>
    ),
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
  },
  busy: {
    icon: Users,
    title: 'Server Gratis Sedang Ramai!',
    description: (
      <>
        Saat ini <strong className="text-white">banyak guru</strong> sedang menggunakan
        mode gratis bersamaan. Upgrade ke akses{' '}
        <strong className="text-white">FULL</strong> untuk generate tanpa antrian,{' '}
        kapan saja!
      </>
    ),
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
  },
};

export const TrialCTADialog = ({ open, onOpenChange, reason = 'quota' }: TrialCTADialogProps) => {
  const content = CONTENT[reason];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-foreground shadow-brutal p-0 overflow-hidden">

        {/* Hero banner */}
        <div className={`relative bg-gradient-to-br ${content.gradient} px-6 pt-8 pb-6 text-center`}>
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors text-white"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-white/40 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-extrabold drop-shadow-sm">
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-sm font-medium mt-1 leading-relaxed">
              {content.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Benefit list */}
          <ul className="space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm font-medium">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-1">
            {/* Primary CTA — WA */}
            <Button
              asChild
              className="w-full font-bold text-base py-6 bg-green-500 hover:bg-green-600 text-white border-2 border-green-700 shadow-brutal-sm hover:translate-y-0.5 active:translate-y-1 transition-all gap-2"
            >
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5" />
                Beli Sekarang via WhatsApp
              </a>
            </Button>

            {/* Secondary — dismiss */}
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Nanti saja
            </Button>
          </DialogFooter>

          {/* Trust badges */}
          <p className="text-xs text-muted-foreground text-center pt-1 flex items-center justify-center gap-3">
            <span>⚡ Respon cepat</span>
            <span>·</span>
            <span>💳 Pembayaran mudah</span>
            <span>·</span>
            <span>✅ Aktif langsung</span>
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
};
