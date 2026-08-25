import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProtaData } from "@/types/modul";

export function useProtaData(workspaceId: string | null) {
  const [protaData, setProtaData] = useState<ProtaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: planError } = await supabase
        .from("curriculum_plans")
        .select("id, content")
        .eq("workspace_id", workspaceId)
        .eq("type", "prota")
        .maybeSingle();

      if (planError) throw planError;
      if (data?.content) {
        setProtaData(data.content as unknown as ProtaData);
      }
    } catch (err: any) {
      console.error("Error loading prota data:", err);
      setError(err?.message || "Gagal memuat data prota");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { loadData(); }, [loadData]);

  return { protaData, isLoading, error, refresh: loadData };
}
