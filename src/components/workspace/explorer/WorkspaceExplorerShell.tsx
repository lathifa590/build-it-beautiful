import React from "react";
import { ArrowLeft, RefreshCw, BookOpen, Layers, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProsemData } from "@/hooks/useProsemData";
import type { Workspace } from "@/types/workspace";
import { SemesterPlanView } from "./SemesterPlanView";
import type { MeetingSlotDB } from "@/hooks/useProsemData";

interface WorkspaceExplorerShellProps {
  workspace: Workspace;
  onStartPlanning?: () => void;
  onMeetingClick?: (slot: MeetingSlotDB) => void;
}

export const WorkspaceExplorerShell: React.FC<WorkspaceExplorerShellProps> = ({
  workspace,
  onStartPlanning,
  onMeetingClick,
}) => {
  const navigate = useNavigate();
  const { prosemPlans, prosemItems, isLoading, error, refresh } = useProsemData(workspace.id);

  const totalTopics = Object.values(prosemItems).reduce((s, items) => s + items.length, 0);
  const totalJp = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.allocated_jp, 0),
    0
  );
  const totalMeetings = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.meeting_slots.length, 0),
    0
  );
  const completedMeetings = Object.values(prosemItems).reduce(
    (s, items) => s + items.reduce((ss, i) => ss + i.meeting_slots.filter(m => m.status === "completed").length, 0),
    0
  );
  const overallProgress = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-24 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/app/workspace")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Semua Workspace
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium truncate">{workspace.subject}</span>
      </div>

      {/* Workspace Identity Header */}
      <div className="bg-card border-2 border-foreground rounded-2xl p-5 shadow-brutal flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-heading">{workspace.subject}</h1>
          <p className="text-muted-foreground text-sm">
            Kelas {workspace.grade} · Fase {workspace.phase} · {workspace.academic_year}
          </p>
          {workspace.school_name && (
            <p className="text-xs text-muted-foreground">{workspace.school_name}</p>
          )}
        </div>

        {/* Overall Progress Ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="stroke-muted" />
              <circle
                cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                strokeDasharray={`${overallProgress * 0.879} 87.9`}
                className="stroke-primary transition-all duration-700"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{overallProgress}%</span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{totalTopics} topik</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{completedMeetings}/{totalMeetings} pertemuan</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{totalJp} JP total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 rounded-2xl p-5 text-center space-y-2">
          <p className="text-rose-600 font-semibold">Gagal memuat data Program Semester</p>
          <p className="text-sm text-rose-500">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}

      {/* Empty: no prosem plans */}
      {!isLoading && !error && prosemPlans.length === 0 && (
        <div className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <div>
            <h3 className="text-lg font-bold">Belum ada Program Semester</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Susun perencanaan pembelajaran Workspace ini terlebih dahulu:<br />
              CP / TP → Prota → Program Semester → Topik & Pertemuan.
            </p>
          </div>
          {onStartPlanning && (
            <button
              onClick={onStartPlanning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow"
            >
              Mulai Perencanaan
            </button>
          )}
        </div>
      )}

      {/* Semester Plans */}
      {!isLoading && !error && prosemPlans.map((plan) => (
        <SemesterPlanView
          key={plan.id}
          plan={plan}
          items={prosemItems[plan.id] || []}
          onMeetingClick={onMeetingClick}
          onAddItem={onStartPlanning}
        />
      ))}
    </div>
  );
};
