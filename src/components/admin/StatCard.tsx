import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'primary' | 'success' | 'info' | 'destructive' | 'warning';
}

const colorMap = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-success/10 text-success border-success/30',
  info: 'bg-info/10 text-info border-info/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'primary',
}: StatCardProps) => {
  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-3 md:p-5 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 leading-tight line-clamp-2">
            {title}
          </p>
          <p className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        </div>
        <div className={`p-2 md:p-2.5 rounded-lg border-2 flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-1 text-xs">
        {description && (
          <span className="text-muted-foreground truncate">{description}</span>
        )}
        {trend && (
          <span
            className={`font-semibold inline-flex items-center gap-0.5 ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && <span className="text-[10px] text-muted-foreground font-normal ml-0.5">({trend.label})</span>}
          </span>
        )}
      </div>
    </div>
  );
};
