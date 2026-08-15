import { Edit3, Eye } from 'lucide-react';

interface MobileNavigationProps {
  mobileTab: 'form' | 'result';
  setMobileTab: (tab: 'form' | 'result') => void;
  hasGeneratedSteps: boolean;
}

export const MobileNavigation = ({
  mobileTab,
  setMobileTab,
  hasGeneratedSteps,
}: MobileNavigationProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-foreground p-3 flex justify-around items-center z-50 shadow-lg">
      <button
        onClick={() => setMobileTab('form')}
        className={`flex flex-col items-center gap-1 ${
          mobileTab === 'form' ? 'text-primary font-bold' : 'text-muted-foreground'
        }`}
      >
        <Edit3 className="w-5 h-5" />
        <span className="text-[10px]">Input Data</span>
      </button>

      <div className="w-[1px] h-8 bg-border" />

      <button
        onClick={() => setMobileTab('result')}
        disabled={!hasGeneratedSteps}
        className={`flex flex-col items-center gap-1 ${
          mobileTab === 'result' ? 'text-primary font-bold' : 'text-muted-foreground'
        } ${!hasGeneratedSteps ? 'opacity-50' : ''}`}
      >
        <Eye className="w-5 h-5" />
        <span className="text-[10px]">Hasil Preview</span>
      </button>
    </div>
  );
};
