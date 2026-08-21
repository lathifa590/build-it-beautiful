import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MeetingSlotDB {
  id: string;
  prosem_item_id: string;
  sequence: number;
  title: string;
  planned_jp: number;
  week_number: number | null;
  planned_date: string | null;
  status: "planned" | "taught" | "completed" | "skipped";
}

export interface ProsemItemDB {
  id: string;
  sequence: number;
  materi_pokok: string;
  allocated_jp: number;
  semester: number;
  tp_snapshot: Array<{ id: string; code: string | null; description: string }>;
  meeting_slots: MeetingSlotDB[];
}

export interface CurriculumPlanDB {
  id: string;
  type: string;
  semester: number | null;
}

export function useProsemData(workspaceId: string | null) {
  const [prosemPlans, setProsemPlans] = useState<CurriculumPlanDB[]>([]);
  const [prosemItems, setProsemItems] = useState<Record<string, ProsemItemDB[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: plans, error: plansError } = await supabase
        .from("curriculum_plans")
        .select("id, type, semester")
        .eq("workspace_id", workspaceId)
        .eq("type", "prosem")
        .order("semester");

      if (plansError) throw plansError;
      setProsemPlans((plans || []) as CurriculumPlanDB[]);

      if (!plans || plans.length === 0) {
        setProsemItems({});
        return;
      }

      const itemsByPlan: Record<string, ProsemItemDB[]> = {};
      for (const plan of plans) {
        const { data: items, error: itemsError } = await supabase
          .from("prosem_items")
          .select(`
            id, sequence, materi_pokok, allocated_jp, semester, tp_snapshot,
            meeting_slots ( id, prosem_item_id, sequence, title, planned_jp, week_number, planned_date, status )
          `)
          .eq("prosem_plan_id", plan.id)
          .order("sequence");
        if (itemsError) throw itemsError;
        itemsByPlan[plan.id] = (items || []) as unknown as ProsemItemDB[];
      }
      setProsemItems(itemsByPlan);
    } catch (err: any) {
      console.error("Error loading prosem data:", err);
      setError(err?.message || "Gagal memuat data prosem");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { loadData(); }, [loadData]);

  return { prosemPlans, prosemItems, isLoading, error, refresh: loadData };
}
