import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { KKTPData } from "@/types/modul";

interface GenerateKKTPParams {
  tpList: string[];
  mataPelajaran: string;
  fase: string;
  kelas: string;
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

export function useKktpGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateKKTPParams): Promise<KKTPData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-kktp", {
        body: {
          tujuan_pembelajaran: params.tpList,
          mata_pelajaran: params.mataPelajaran,
          fase: params.fase,
          kelas: params.kelas
        },
      });

      if (fnError) {
        const extracted = await extractErrorMessage(fnError);
        throw new Error(extracted);
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.data) throw new Error("Format response KKTP tidak valid");

      return data.data as KKTPData;
    } catch (err: any) {
      const msg = err?.message || "Gagal generate KKTP";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}

