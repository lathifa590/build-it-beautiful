import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink } from 'lucide-react';

interface TrialCTADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TrialCTADialog = ({ open, onOpenChange }: TrialCTADialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-7 h-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Kuota Trial Anda Telah Habis</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            Kuota harian untuk akun trial Anda sudah terpakai. Untuk terus menggunakan semua fitur tanpa batas, dapatkan akses full sekarang!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
          <Button
            asChild
            className="w-full font-bold text-base py-5"
          >
            <a
              href="https://aidukasi.shop/checkout?id=PRD-14"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Dapatkan Akses Full
            </a>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            atau hubungi affiliator Anda untuk info lebih lanjut
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
