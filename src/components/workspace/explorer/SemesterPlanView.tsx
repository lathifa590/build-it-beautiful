import React, { useState } from "react";
import { BookOpen, PlusCircle, ChevronDown, Layers, BarChart3 } from "lucide-react";
import type { CurriculumPlanDB, ProsemItemDB, MeetingSlotDB } from "@/hooks/useProsemData";
import { TopicRow } from "./TopicRow";

interface SemesterPlanViewProps {
  plan: CurriculumPlanDB;
  items: ProsemItemDB[];
  onMeetingClick?: (slot: MeetingSlotDB) => void;
  onAddItem?: (step?: number) => void;
  onGenerateClick?: (slot: MeetingSlotDB) => Promise<void>;
}

export const SemesterPlanView: React.FC<SemesterPlanViewProps> = ({
  plan,
  items,
  onMeetingClick,
  onAddItem,
  onGenerateClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalJp = items.reduce((s, i) => s + i.allocated_jp, 0);
  const totalMeetings = items.reduce((s, i) => s + i.meeting_slots.length, 0);
  const completedMeetings = items.reduce(
    (s, i) => s + i.meeting_slots.filter(m => m.status === "completed").length,
    0
  );
  const completedJp = items.reduce(
    (s, i) => s + i.meeting_slots.filter(m => m.status === "completed").reduce((ss, m) => ss + m.planned_jp, 0),
    0
  );
  const progress = totalJp > 0 ? Math.round((completedJp / totalJp) * 100) : 0;

  // Compute cumulative meeting start per topic
  const meetingStarts: number[] = [];
  let cumulative = 1;
  for (const item of items) {
    meetingStarts.push(cumulative);
    cumulative += item.meeting_slots.length;
  }

  const semLabel = `Semester ${plan.semester ?? "?"}`;
  const isSem2 = plan.semester === 2;

  return (
    <section className="space-y-4">
      {/* Semester Header */}
      <div
        className={`semester-header ${isSem2 ? 'sem-2' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border-2 border-transparent">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2>{semLabel}</h2>
            <p className="meta">
              {items.length} topik · {totalJp} JP · {completedMeetings} pertemuan selesai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress badge instead of circular progress per DESIGN_SYSTEM.md */}
          <div className="semester-progress-badge">
            {progress}%
          </div>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!collapsed && (
        <div className="stat-grid">
          {[
            { label: "Total Topik", value: items.length, icon: Layers },
            { label: "Total JP", value: totalJp, icon: BarChart3 },
            { label: "Progress", value: `${progress}%`, icon: BarChart3 },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <span className="stat-label flex items-center gap-1.5">
                <stat.icon className="w-3.5 h-3.5 text-primary" /> {stat.label}
              </span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Topic List */}
      {!collapsed && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-foreground/20 rounded-2xl p-8 text-center space-y-2">
              <Layers className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="font-semibold text-muted-foreground">Belum ada topik di semester ini</p>
              <p className="text-xs text-muted-foreground">Tambahkan materi dari editor Program Semester.</p>
              {onAddItem && (
                <button
                  onClick={() => onAddItem()}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Topik
                </button>
              )}
            </div>
          ) : (
            items.map((item, idx) => (
              <TopicRow
                key={item.id}
                item={item}
                globalMeetingStart={meetingStarts[idx]}
                onMeetingClick={onMeetingClick}
                onEditProsem={onAddItem}
                onGenerateClick={onGenerateClick}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};
