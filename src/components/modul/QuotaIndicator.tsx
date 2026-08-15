import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface QuotaIndicatorProps {
  remaining: number;
  limit: number;
  isTrial: boolean;
}

export const QuotaIndicator = ({ remaining, limit, isTrial }: QuotaIndicatorProps) => {
  if (!isTrial) return null;

  const ratio = remaining / limit;
  
  let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (ratio <= 0.2) {
    colorClass = 'bg-destructive/10 text-destructive border-destructive/30';
  } else if (ratio <= 0.5) {
    colorClass = 'bg-amber-100 text-amber-700 border-amber-300';
  }

  return (
    <Badge
      className={`${colorClass} border text-xs font-bold gap-1 px-2 py-1 rounded-md`}
      variant="outline"
    >
      <Zap className="w-3 h-3" />
      Sisa: {remaining}/{limit}
    </Badge>
  );
};
