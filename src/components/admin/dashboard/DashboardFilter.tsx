import React from 'react';
import { TimeRangeOption } from './useDashboardAnalytics';
import { Calendar, RefreshCw, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DashboardFilterProps {
  timeRange: TimeRangeOption;
  setTimeRange: (val: TimeRangeOption) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
  activeLabel: string;
}

const FILTER_OPTIONS: { id: TimeRangeOption; label: string }[] = [
  { id: '7d', label: '7 Hari' },
  { id: '14d', label: '14 Hari' },
  { id: '30d', label: '30 Hari' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: '90d', label: '3 Bulan (Pekanan)' },
  { id: 'ytd', label: 'Tahun Ini' },
  { id: 'all', label: 'Semua' },
  { id: 'custom', label: 'Kustom' },
];

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  timeRange,
  setTimeRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onRefresh,
  onExport,
  isRefreshing,
  activeLabel,
}) => {
  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-3 md:p-4 shadow-brutal flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" /> Filter:
          </span>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = timeRange === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm -translate-y-0.5'
                    : 'bg-secondary text-secondary-foreground border-foreground/20 hover:border-foreground/60 hover:bg-secondary/80'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Right: Actions (Refresh & Export) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-2 border-foreground text-xs font-bold gap-1.5 shadow-brutal-sm hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="border-2 border-foreground text-xs font-bold gap-1.5 shadow-brutal-sm hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border-emerald-700/50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Picker Inputs when 'custom' is active */}
      {timeRange === 'custom' && (
        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-3 bg-secondary/30 p-2.5 rounded-lg">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" /> Rentang Tanggal:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-semibold">Dari:</label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 text-xs w-36 border-2 border-foreground/40 bg-card font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-semibold">Sampai:</label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 text-xs w-36 border-2 border-foreground/40 bg-card font-medium"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto italic">
            Periode aktif: <strong className="text-foreground">{activeLabel}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
