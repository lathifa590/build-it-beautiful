import { useState, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { RefreshCw, ChevronDown, Maximize2, AlignJustify } from 'lucide-react';

export type RegenerateMode = 'default' | 'detail' | 'ringkas';

interface TabButtonProps {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
  exists: boolean;
  isActive: boolean;
  onClick: () => void;
  /** Jika diberikan, tampilkan tombol regenerate dropdown saat tab ini aktif & exists */
  onRegenerate?: (mode: RegenerateMode) => void;
}

export const TabButton = ({
  id,
  label,
  shortLabel,
  icon: Icon,
  exists,
  isActive,
  onClick,
  onRegenerate,
}: TabButtonProps) => {
  const compactLabel = shortLabel ?? label;
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const showRegenBtn = isActive && exists && onRegenerate;

  return (
    <div className="relative flex items-end shrink-0" ref={dropRef}>
      <button
        id={`tab-${id}`}
        onClick={onClick}
        className={`px-2 lg:px-3 py-2 rounded-tl-lg font-bold text-xs flex items-center gap-1.5 border-t-2 border-l-2 transition-all whitespace-nowrap ${showRegenBtn ? 'rounded-tr-none border-r-0' : 'rounded-tr-lg border-r-2'} ${
          isActive
            ? 'bg-card border-foreground text-foreground z-10 translate-y-[2px]'
            : 'bg-secondary border-transparent text-muted-foreground hover:bg-muted'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="hidden lg:inline">{label}</span>
        <span className="lg:hidden">{compactLabel}</span>
        {exists && <span className="ml-1 w-2 h-2 rounded-full bg-success" />}
      </button>

      {/* Regenerate dropdown trigger — only when tab is active and has content */}
      {showRegenBtn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropOpen((v) => !v);
          }}
          title="Opsi Regenerate"
          aria-label="Opsi Regenerate"
          className={`px-1.5 py-2 rounded-tr-lg font-bold text-xs flex items-center border-t-2 border-r-2 transition-all whitespace-nowrap border-l border-foreground/20 bg-card border-foreground text-foreground z-10 translate-y-[2px] hover:bg-primary/10`}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown menu */}
      {dropOpen && onRegenerate && (
        <div
          className="absolute top-full left-0 mt-0 z-50 w-44 bg-card border-2 border-foreground rounded-b-lg rounded-tr-lg shadow-brutal-sm overflow-hidden"
          style={{ minWidth: '11rem' }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-primary/10 transition-colors text-left"
            onClick={() => { onRegenerate('default'); setDropOpen(false); }}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0 text-primary" />
            Generate Ulang
          </button>
          <div className="h-px bg-border" />
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-primary/10 transition-colors text-left text-muted-foreground"
            onClick={() => { onRegenerate('detail'); setDropOpen(false); }}
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" />
            Buat Lebih Detail
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-primary/10 transition-colors text-left text-muted-foreground"
            onClick={() => { onRegenerate('ringkas'); setDropOpen(false); }}
          >
            <AlignJustify className="w-3.5 h-3.5 shrink-0" />
            Buat Lebih Ringkas
          </button>
        </div>
      )}
    </div>
  );
};
