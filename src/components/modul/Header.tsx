import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallAppButton } from '@/components/InstallAppButton';

interface HeaderProps {
  hasGeneratedSteps: boolean;
  onReset: () => void;
}

export const Header = ({ hasGeneratedSteps, onReset }: HeaderProps) => {
  return (
    <header className="bg-card border-b-2 border-foreground flex-none z-40">
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="bg-white p-1.5 rounded-lg border-2 border-foreground shadow-brutal-sm flex-shrink-0">
            <img
              src="/favicon.png"
              alt="ModulAjar Logo"
              className="w-6 h-6 md:w-7 md:h-7"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-extrabold truncate">ModulAjar.Online</h1>
            <p className="hidden sm:block text-[10px] md:text-xs font-bold text-muted-foreground truncate">
              Kurikulum Merdeka - Pembelajaran Mendalam & KBC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <InstallAppButton variant="icon" />
          {hasGeneratedSteps && (
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

