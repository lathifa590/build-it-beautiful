import { useState } from "react";
import { Download, Share2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface InstallAppButtonProps {
  variant?: "icon" | "full";
  className?: string;
}

export const InstallAppButton = ({ variant = "icon", className = "" }: InstallAppButtonProps) => {
  const { canPrompt, isIOS, shouldShow, promptInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!shouldShow) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        title="Install aplikasi di perangkatmu"
        className={`gap-2 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${className}`}
      >
        <Download className="w-4 h-4" />
        {variant === "full" && <span>Install App</span>}
      </Button>

      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" /> Install di iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              Safari di iOS tidak punya tombol install otomatis. Ikuti 3 langkah cepat ini:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold grid place-items-center">
                1
              </span>
              <span>
                Buka menu <strong>Share / Bagikan</strong>
                <Share2 className="inline w-4 h-4 mx-1 align-text-bottom" />
                di bagian bawah Safari.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold grid place-items-center">
                2
              </span>
              <span>
                Pilih <strong>"Add to Home Screen"</strong>
                <Plus className="inline w-4 h-4 mx-1 align-text-bottom" />.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold grid place-items-center">
                3
              </span>
              <span>
                Tap <strong>"Add"</strong>. Aplikasi ModulAjar akan muncul di home screen seperti app native.
              </span>
            </li>
          </ol>
          <Button onClick={() => setShowIOSGuide(false)} className="w-full mt-2">
            <X className="w-4 h-4 mr-2" /> Tutup
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
