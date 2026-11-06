import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface QuotaIndicatorProps {
  remaining: number;
  limit: number;
  isTrial: boolean;
}

export const QuotaIndicator = ({ remaining, limit, isTrial }: QuotaIndicatorProps) => {
  if (!isTrial) return null;

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
