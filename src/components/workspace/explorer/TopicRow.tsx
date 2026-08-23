import React, { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Target, Layers } from "lucide-react";
import type { ProsemItemDB, MeetingSlotDB } from "@/hooks/useProsemData";
import { MeetingCard } from "./MeetingCard";

interface TopicRowProps {
  item: ProsemItemDB;
  globalMeetingStart: number;
  onMeetingClick?: (slot: MeetingSlotDB) => void;
  onEditProsem?: () => void;
}

export const TopicRow: React.FC<TopicRowProps> = ({ item, globalMeetingStart, onMeetingClick, onEditProsem }) => {
  const [open, setOpen] = useState(false);

  const completedSlots = item.meeting_slots.filter(s => s.status === "completed").length;
  const totalSlots = item.meeting_slots.length;
  const progress = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  return (
    <div className="border-2 border-foreground/10 rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Topic Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group"
      >
        {/* Sequence number */}
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          {item.sequence}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <h3 className="font-semibold text-sm leading-snug">{item.materi_pokok}</h3>
          </div>

          {/* TP Chips */}
          {item.tp_snapshot && item.tp_snapshot.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tp_snapshot.map((tp, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-secondary/60 text-secondary-foreground rounded-full px-2 py-0.5 border border-foreground/10">
                  <Target className="w-2.5 h-2.5" />
                  {tp.code || `TP${i+1}`}
                </span>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="pt-1 flex items-center gap-3">
            <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {completedSlots}/{totalSlots} pertemuan
            </span>
            <span className="text-xs font-bold text-muted-foreground">{item.allocated_jp} JP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {totalSlots > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {totalSlots} ptm
            </span>
          )}
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          }
        </div>
      </button>

      {/* Meeting Slots (expandable) */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t-2 border-foreground/5 bg-muted/20 pt-3">
          {item.meeting_slots.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground py-3 px-2 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground/60" />
                <span>Belum ada jadwal pertemuan.</span>
              </div>
              {onEditProsem && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditProsem(); }}
                  className="font-semibold text-primary hover:underline"
                >
                  Tambahkan dari editor Prosem &rarr;
                </button>
              )}
            </div>
          ) : (
            item.meeting_slots
              .sort((a, b) => a.sequence - b.sequence)
              .map((slot, idx) => (
                <MeetingCard
                  key={slot.id}
                  slot={slot}
                  meetingIndex={globalMeetingStart + idx}
                  onClick={onMeetingClick}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
};
