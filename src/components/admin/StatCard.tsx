import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'info' | 'destructive';
}

const colorMap = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  success: 'bg-success/10 text-success border-success/30',
  info: 'bg-info/10 text-info border-info/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
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
    <div className="bg-card border-2 border-foreground rounded-xl p-3 md:p-6 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground mb-0.5 md:mb-1 truncate">
            {title}
          </p>
          <p className="text-xl md:text-3xl font-extrabold text-foreground">{value}</p>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">{description}</p>
          )}
          {trend && (
            <p
              className={`text-xs md:text-sm font-medium mt-1 md:mt-2 ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-2 md:p-3 rounded-lg border-2 flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
};
