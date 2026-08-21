import React from "react";
import { CheckCircle2, Circle, BookOpen, PlayCircle, ChevronRight } from "lucide-react";
import type { MeetingSlotDB } from "@/hooks/useProsemData";

const STATUS_CONFIG = {
  planned:    { label: "Direncanakan",    icon: Circle,       color: "text-muted-foreground", bg: "bg-muted/50" },
  taught:     { label: "Sudah Diajarkan", icon: PlayCircle,   color: "text-amber-500",        bg: "bg-amber-50 dark:bg-amber-950/40" },
  completed:  { label: "Selesai",         icon: CheckCircle2, color: "text-emerald-500",      bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  skipped:    { label: "Dilewati",        icon: BookOpen,     color: "text-rose-400",         bg: "bg-rose-50 dark:bg-rose-950/40" },
};

interface MeetingCardProps {
  slot: MeetingSlotDB;
  meetingIndex: number;
  onClick?: (slot: MeetingSlotDB) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ slot, meetingIndex, onClick }) => {
  const cfg = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.planned;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => onClick?.(slot)}
      className={`
        group flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-foreground/10
        cursor-pointer transition-all duration-150
        hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5
        ${cfg.bg}
      `}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">
        {meetingIndex}
      </div>

      <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {slot.title || `Pertemuan ${meetingIndex}`}
          {slot.week_number && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">Minggu {slot.week_number}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{slot.planned_jp} JP</p>
      </div>

      <span className={`text-xs font-medium ${cfg.color} hidden sm:block`}>{cfg.label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </div>
  );
};
