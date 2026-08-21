import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GenerateTpParams {
  cp: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  kalender?: any; // KalenderPendidikan
  ruangLingkupMateri?: string;
}

interface TpResult {
  code: string;
  description: string;
}

export function useTpGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateTpParams): Promise<TpResult[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "tujuan-pembelajaran",
          data: {
            capaianPembelajaran: params.cp,
            mataPelajaran: params.mataPelajaran,
            fase: params.fase,
            kelas: params.kelas,
            kalender: params.kalender,
            ruangLingkupMateri: params.ruangLingkupMateri,
          }
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      const tpArray = data?.data?.tujuan_pembelajaran;
      if (!tpArray || !Array.isArray(tpArray)) {
        throw new Error("Format response TP tidak valid dari AI");
      }

      return tpArray.map((item: any, idx: number) => ({
        code: `TP ${item.nomor || idx + 1}`,
        description: item.teks
      }));
    } catch (err: any) {
      const msg = err?.message || "Gagal generate Tujuan Pembelajaran";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}
