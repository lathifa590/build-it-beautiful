import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, ExternalLink } from 'lucide-react';

interface WorkspaceUpsellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceUpsellDialog = ({ open, onOpenChange }: WorkspaceUpsellDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-foreground shadow-brutal">
        <DialogHeader className="text-center items-center">
          <div className="w-16 h-16 bg-amber-100 rounded-xl border-2 border-foreground flex items-center justify-center mb-4 shadow-brutal-sm">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-extrabold">Fitur Eksklusif PRO!</DialogTitle>
          <DialogDescription className="text-sm font-medium leading-relaxed pt-3 px-2">
            Fitur <strong>Workspace & Perencanaan</strong> hanya tersedia untuk pengguna dengan lisensi PRO. 
            Kelola modul, program tahunan, program semester, dan bank soal dalam satu tempat terpusat!
          </DialogDescription>
        </DialogHeader>
        <div className="bg-secondary/50 p-4 rounded-lg border-2 border-foreground/10 text-xs font-medium space-y-2 mb-2">
          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> Manajemen Kelas Terpusat</p>
          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> Generate Prota & Prosem Otomatis</p>
          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> Penjadwalan Pertemuan Cerdas</p>
        </div>
        <DialogFooter className="flex flex-col gap-3 sm:flex-col mt-2">
          <Button
            asChild
            className="w-full font-bold text-base py-6 shadow-brutal-sm hover:translate-y-0.5 transition-all"
          >
            <a
              href="https://aidukasi.shop/checkout?id=PRD-14"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Upgrade ke PRO Sekarang
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
