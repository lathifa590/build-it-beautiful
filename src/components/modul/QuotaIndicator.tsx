import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles } from 'lucide-react';

interface QuotaIndicatorProps {
  remaining: number;
  limit: number;
  isTrial: boolean;
  isOnboardingQuota?: boolean;
  onOpenSettings?: () => void;
}

export const QuotaIndicator = ({
  remaining,
  limit,
  isTrial,
  isOnboardingQuota,
  onOpenSettings,
}: QuotaIndicatorProps) => {
  if (!isTrial && !isOnboardingQuota) return null;

  // Mode Onboarding bagi user baru berbayar yang belum memasang API Key
  if (isOnboardingQuota) {
    const displayLimit = limit || 20;
    const displayRemaining = Math.min(Math.max(0, remaining), displayLimit);
    const ratio = displayRemaining / displayLimit;

    let colorClass = 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100';
    if (ratio <= 0.25) {
      colorClass = 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20';
    } else if (ratio <= 0.5) {
      colorClass = 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
    }

    return (
      <Badge
        onClick={onOpenSettings}
        className={`${colorClass} border text-xs font-bold gap-1 px-2.5 py-1 rounded-md shrink-0 shadow-xs transition-colors ${onOpenSettings ? 'cursor-pointer' : 'cursor-default'}`}
        variant="outline"
        title={`Sisa kuota pengenalan sistem: ${displayRemaining} dari ${displayLimit}. Pasang Gemini API Key gratis Anda di Pengaturan untuk akses Unlimited! (Klik untuk ke Pengaturan)`}
      >
        <Sparkles className="w-3.5 h-3.5 fill-current text-blue-600" />
        <span>Kuota Awal: {displayRemaining}/{displayLimit}</span>
      </Badge>
    );
  }

  // Pastikan batas kuota adalah 50 (bukan 100)
  const displayLimit = (limit === 100 || !limit) ? 50 : limit;
  const displayRemaining = Math.min(Math.max(0, remaining), displayLimit);
  const ratio = displayRemaining / displayLimit;
  
  let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (ratio <= 0.2) {
    colorClass = 'bg-destructive/10 text-destructive border-destructive/30';
  } else if (ratio <= 0.5) {
    colorClass = 'bg-amber-100 text-amber-700 border-amber-300';
  }

  return (
    <Badge
      className={`${colorClass} border text-xs font-bold gap-1 px-2.5 py-1 rounded-md cursor-default shrink-0 shadow-xs`}
      variant="outline"
      title={`Sisa kuota generate: ${displayRemaining} dari ${displayLimit} (Akun Trial)`}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span>Sisa: {displayRemaining}/{displayLimit}</span>
    </Badge>
  );
};
