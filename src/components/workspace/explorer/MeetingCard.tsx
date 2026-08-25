import React, { useState } from "react";
import { CheckCircle2, Circle, BookOpen, PlayCircle, ChevronRight, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(slot.title || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!title.trim() || title === slot.title) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("meeting_slots")
        .update({ title: title.trim() })
        .eq("id", slot.id);
      
      if (!error) {
        slot.title = title.trim(); // Optimistic update
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(slot.title || "");
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => {
        if (!isEditing) onClick?.(slot);
      }}
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
        {isEditing ? (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-2 py-1 text-sm font-semibold border-2 border-primary/50 rounded focus:outline-none focus:border-primary"
              placeholder={`Pertemuan ${meetingIndex}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave(e as any);
                if (e.key === 'Escape') handleCancel(e as any);
              }}
              disabled={isSaving}
            />
            <button onClick={handleSave} disabled={isSaving} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={handleCancel} disabled={isSaving} className="p-1 hover:bg-rose-100 text-rose-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group/edit">
            <p className="text-sm font-semibold truncate">
              {slot.title || `Pertemuan ${meetingIndex}`}
              {slot.week_number && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">Minggu {slot.week_number}</span>
              )}
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="opacity-0 group-hover/edit:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground transition-opacity"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{slot.planned_jp} JP</p>
      </div>

      <span className={`text-xs font-medium ${cfg.color} hidden sm:block`}>{cfg.label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </div>
  );
};
