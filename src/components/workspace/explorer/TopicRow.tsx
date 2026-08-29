import React, { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Target, Layers } from "lucide-react";
import type { ProsemItemDB, MeetingSlotDB } from "@/hooks/useProsemData";
import { MeetingCard } from "./MeetingCard";

interface TopicRowProps {
  item: ProsemItemDB;
  globalMeetingStart: number;
  onMeetingClick?: (slot: MeetingSlotDB) => void;
  onEditProsem?: (step?: number) => void;
}

export const TopicRow: React.FC<TopicRowProps> = ({ item, globalMeetingStart, onMeetingClick, onEditProsem }) => {
  const [open, setOpen] = useState(false);

  const completedSlots = item.meeting_slots.filter(s => s.status === "completed").length;
  const totalSlots = item.meeting_slots.length;
  const progress = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  return (
    <div className="mb-2.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="topik-row w-full text-left m-0"
        style={{ 
          marginBottom: open ? 0 : undefined,
          borderBottomLeftRadius: open ? 0 : undefined,
          borderBottomRightRadius: open ? 0 : undefined,
          boxShadow: open ? 'none' : undefined
        }}
      >
        {/* Sequence number */}
        <div className="topik-number">
          {item.sequence}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
            <h3 className="topik-title">{item.materi_pokok}</h3>
          </div>

          {/* TP Chips */}
          {item.tp_snapshot && item.tp_snapshot.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {item.tp_snapshot.map((tp, i) => {
                const code = typeof tp === 'string' ? `TP${item.sequence}` : (tp.code || `TP${item.sequence}`);
                return (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold bg-secondary/20 text-secondary-foreground rounded border-2 border-black px-1.5 py-0.5 uppercase">
                    <Target className="w-3 h-3" />
                    {code}
                  </span>
                );
              })}
            </div>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 progress-wrap m-0">
              <div
                className={`progress-fill ${progress === 100 ? 'done' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              {completedSlots}/{totalSlots} pertemuan
            </span>
            <span className="text-xs font-black text-black">{item.allocated_jp} JP</span>
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
                  onClick={(e) => { e.stopPropagation(); onEditProsem(3); }}
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
