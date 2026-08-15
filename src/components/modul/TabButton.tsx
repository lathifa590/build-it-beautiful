import type { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
  exists: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ id, label, shortLabel, icon: Icon, exists, isActive, onClick }: TabButtonProps) => {
  const compactLabel = shortLabel ?? label;

  return (
    <button
      onClick={onClick}
      className={`px-2 lg:px-3 py-2 rounded-t-lg font-bold text-xs flex items-center gap-1.5 border-t-2 border-x-2 transition-all whitespace-nowrap shrink-0 ${
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
  );
};
