import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { ProtaData } from "@/types/modul";

interface GenerateProtaParams {
  cp: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  jpPerMinggu: number;
  mingguEfektifSem1: number;
  mingguEfektifSem2: number;
  tujuanPembelajaran?: string[];
}

async function extractErrorMessage(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const text = await err.context.text();
      try {
        const j = JSON.parse(text);
        return j.error || j.message || text;
      } catch {
        return text;
      }
    } catch {
      return err.message;
    }
  }
  return err instanceof Error ? err.message : String(err);
}

export function useProtaGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateProtaParams): Promise<ProtaData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-prota", {
        body: {
          cp: params.cp,
          mata_pelajaran: params.mataPelajaran,
          fase: params.fase,
          kelas: params.kelas,
          jp_per_minggu: params.jpPerMinggu,
          minggu_efektif_sem1: params.mingguEfektifSem1,
          minggu_efektif_sem2: params.mingguEfektifSem2,
          tujuan_pembelajaran: params.tujuanPembelajaran,
        },
      });

      if (fnError) {
        const extracted = await extractErrorMessage(fnError);
        throw new Error(extracted);
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.data) throw new Error("Format response Prota tidak valid");

      return data.data as ProtaData;
    } catch (err: any) {
      const msg = err?.message || "Gagal generate Program Tahunan";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}

