import React, { useState } from "react";
import { BookOpen, PlusCircle, ChevronDown, Layers, BarChart3 } from "lucide-react";
import type { CurriculumPlanDB, ProsemItemDB, MeetingSlotDB } from "@/hooks/useProsemData";
import { TopicRow } from "./TopicRow";

interface SemesterPlanViewProps {
  plan: CurriculumPlanDB;
  items: ProsemItemDB[];
  onMeetingClick?: (slot: MeetingSlotDB) => void;
  onAddItem?: () => void;
}

export const SemesterPlanView: React.FC<SemesterPlanViewProps> = ({
  plan,
  items,
  onMeetingClick,
  onAddItem,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const totalJp = items.reduce((s, i) => s + i.allocated_jp, 0);
  const totalMeetings = items.reduce((s, i) => s + i.meeting_slots.length, 0);
  const completedMeetings = items.reduce(
    (s, i) => s + i.meeting_slots.filter(m => m.status === "completed").length,
    0
  );
  const progress = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

  // Compute cumulative meeting start per topic
  const meetingStarts: number[] = [];
  let cumulative = 1;
  for (const item of items) {
    meetingStarts.push(cumulative);
    cumulative += item.meeting_slots.length;
  }

  const semLabel = `Semester ${plan.semester ?? "?"}`;
  const gradientClass = plan.semester === 1
    ? "from-blue-500 to-indigo-600"
    : "from-violet-500 to-purple-700";

  return (
    <section className="space-y-4">
      {/* Semester Header */}
      <div
        className={`flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r ${gradientClass} text-white shadow-lg`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{semLabel}</h2>
            <p className="text-xs text-white/80">
              {items.length} topik · {totalJp} JP · {completedMeetings}/{totalMeetings} pertemuan selesai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Circular progress */}
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-white/20" />
              <circle
                cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                strokeDasharray={`${progress * 0.879} 87.9`}
                className="stroke-white transition-all duration-700"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{progress}%</span>
          </div>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!collapsed && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Topik", value: items.length, icon: Layers },
            { label: "Total JP", value: totalJp, icon: BarChart3 },
            { label: "Progress", value: `${progress}%`, icon: BarChart3 },
          ].map(stat => (
            <div key={stat.label} className="bg-card border-2 border-foreground/10 rounded-xl p-3 flex items-center gap-3">
              <stat.icon className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-bold text-sm">{stat.value}</p>
              </div>
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
                  onClick={onAddItem}
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
              />
            ))
          )}
        </div>
      )}
    </section>
  );
};
