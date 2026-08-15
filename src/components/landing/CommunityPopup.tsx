import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';

const WHATSAPP_LINK = 'https://chat.whatsapp.com/JY4ssfOsOd0CCz6UamvNKA';
const SESSION_KEY = 'adcanvas_community_popup_shown';
const POPUP_DELAY_MS = 3000;

export const CommunityPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-2 border-foreground shadow-brutal">
        <DialogHeader className="text-left">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 mb-3 bg-green-100 border-2 border-foreground rounded-full text-xs font-bold text-green-900">
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp Community
          </div>
          <DialogTitle className="text-2xl font-extrabold leading-tight">
            Gabung Komunitas Guru AI
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2 text-foreground/80">
            Dapatkan tips Modul Ajar, update fitur baru, dan promo eksklusif yang tidak diumumkan ke publik. Gratis selamanya.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            asChild
            className="w-full font-bold text-base py-5 bg-primary hover:bg-primary/90 border-2 border-foreground shadow-brutal-sm"
            onClick={() => setOpen(false)}
          >
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              Gabung Sekarang
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button
            variant="ghost"
            className="w-full font-semibold"
            onClick={() => setOpen(false)}
          >
            Nanti saja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
