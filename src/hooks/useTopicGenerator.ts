import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GenerateTopicParams {
  mataPelajaran: string;
  fase: string;
  kelas: string;
  cp?: string;
  kalender?: any;
}

export function useTopicGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateTopicParams): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "ruang-lingkup",
          data: {
            mataPelajaran: params.mataPelajaran,
            fase: params.fase,
            kelas: params.kelas,
            capaianPembelajaran: params.cp,
            kalender: params.kalender,
          }
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const content = data?.data;
      if (!content) {
        throw new Error("Format respons tidak valid dari AI");
      }

      // Priority 1: teks_gabungan (already formatted by AI)
      if (typeof content.teks_gabungan === "string" && content.teks_gabungan.trim()) {
        return content.teks_gabungan.trim();
      }

      // Priority 2: daftar_topik array of objects
      if (Array.isArray(content.daftar_topik) && content.daftar_topik.length > 0) {
        return content.daftar_topik
          .map((item: any, idx: number) => {
            if (typeof item === "string") return item.match(/^\d+\./) ? item : `${idx + 1}. ${item}`;
            const title = item.topik || item.judul || item.materi || "";
            return title.match(/^\d+\./) ? title : `${idx + 1}. ${title}`;
          })
          .join("\n");
      }

      // Priority 3: topik array of strings or objects
      if (Array.isArray(content.topik) && content.topik.length > 0) {
        return content.topik
          .map((item: any, idx: number) => {
            if (typeof item === "string") return item.match(/^\d+\./) ? item : `${idx + 1}. ${item}`;
            const title = item.judul || item.topik || item.materi || "";
            return title.match(/^\d+\./) ? title : `${idx + 1}. ${title}`;
          })
          .join("\n");
      }

      if (typeof content === "string" && content.trim()) {
        return content.trim();
      }

      throw new Error("Gagal membaca daftar topik dari respons AI");
    } catch (err: any) {
      const msg = err?.message || "Gagal membuat Topik Materi dengan AI";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}
