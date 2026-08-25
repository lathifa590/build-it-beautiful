import { useState, useCallback } from "react";
import type { ProtaData, ProsemData, ProsemEvent } from "@/types/modul";

export function useProsemGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    protaData: ProtaData | null, 
    semester: 1 | 2, 
    mingguEfektif: number,
    tanggalMulai: string,
    kegiatanNonPembelajaran: ProsemEvent[] = []
  ): Promise<ProsemData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!protaData) {
        throw new Error("Data Program Tahunan belum tersedia");
      }

      // Filter Prota items for this semester
      const semesterItems = protaData.prota.filter(item => item.semester === semester);
      
      if (semesterItems.length === 0) {
        throw new Error(`Tidak ada data Program Tahunan untuk Semester ${semester}`);
      }

      const startDate = new Date(tanggalMulai);
      const months: ProsemData['months'] = [];
      const allWeekKeys: string[] = [];

      let currentDate = new Date(startDate);
      let totalWeeks = 0;

      // Always generate exactly 6 months per semester
      for (let i = 0; i < 6; i++) {
        const bulan = currentDate.getMonth() + 1;
        const tahun = currentDate.getFullYear();

        // Calculate weeks in this month (roughly 4-5)
        const daysInMonth = new Date(tahun, bulan, 0).getDate();
        const mingguCount = Math.ceil(daysInMonth / 7);

        months.push({ bulan, tahun, mingguCount });
        for (let w = 1; w <= mingguCount; w++) {
          allWeekKeys.push(`${tahun}-${String(bulan).padStart(2, '0')}-W${w}`);
          totalWeeks++;
        }

        // Move to next month
        currentDate = new Date(tahun, bulan, 1);
      }

      // Filter events for this semester
      const events: ProsemEvent[] = kegiatanNonPembelajaran.filter(ev => ev.semester === semester);
      
      const nonInstructionalWeekKeys = new Set(events.map(ev => {
        const monthStr = String(ev.bulan).padStart(2, '0');
        return allWeekKeys.find(key => key.endsWith(`-${monthStr}-W${ev.mingguKe}`));
      }).filter(Boolean));

      let weekPointer = 0;
      const rows = semesterItems.map((item, index) => {
        // distribute JP over 2 JP per week roughly
        const jp = item.alokasi_jp;
        const weeksNeeded = Math.max(1, Math.ceil(jp / 2));
        const weeks: Record<string, { hasActivity: boolean, jp?: number }> = {};

        let i = 0;
        while (i < weeksNeeded) {
          if (weekPointer < allWeekKeys.length) {
            const wk = allWeekKeys[weekPointer];
            
            // Skip non-instructional weeks
            if (nonInstructionalWeekKeys.has(wk)) {
              weekPointer++;
              continue;
            }

            weeks[wk] = { hasActivity: true, jp: 2 };
            weekPointer++;
            i++;
          } else {
            // run out of weeks
            break;
          }
        }

        return {
          no: index + 1,
          materi_pokok: item.materi_pokok,
          tujuan_pembelajaran: item.tujuan_pembelajaran,
          alokasi_jp: jp,
          weeks
        };
      });

      return {
        semester,
        rows,
        events,
        months
      };
      
    } catch (err: any) {
      setError(err?.message || `Gagal menyusun Program Semester ${semester}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}
