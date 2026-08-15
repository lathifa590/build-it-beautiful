import { Download, Loader2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ProsemData, ProsemEvent, FormData } from '@/types/modul';
import { BULAN_NAMES } from '@/lib/constants';

interface ProsemPreviewProps {
  prosemSem1: ProsemData | null;
  prosemSem2: ProsemData | null;
  formData: FormData;
  onExportWord: (semester: 1 | 2) => void;
  isExporting?: boolean;
}

export const ProsemPreview = ({
  prosemSem1,
  prosemSem2,
  formData,
  onExportWord,
  isExporting,
}: ProsemPreviewProps) => {
  const [activeSem, setActiveSem] = useState<1 | 2>(1);
  const isMobile = useIsMobile();
  const data = activeSem === 1 ? prosemSem1 : prosemSem2;

  if (!data) return null;

  if (isMobile) {
    return (
      <div className="bg-card border-2 border-foreground rounded-xl p-5 shadow-brutal-sm text-center">
        <Monitor className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="font-bold text-sm">Buka di Desktop</p>
        <p className="text-xs text-muted-foreground mt-1">
          Tabel Program Semester terlalu lebar untuk layar mobile. Buka di desktop untuk tampilan optimal.
        </p>
        <Button
          onClick={() => onExportWord(activeSem)}
          disabled={isExporting}
          variant="outline"
          className="mt-4 text-xs border-2 border-foreground"
        >
          {isExporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
          Download Word Saja
        </Button>
      </div>
    );
  }

  // Build week keys for this semester
  const allWeekKeys: string[] = [];
  data.months.forEach(m => {
    for (let w = 1; w <= m.mingguCount; w++) {
      allWeekKeys.push(`${m.tahun}-${String(m.bulan).padStart(2, '0')}-W${w}`);
    }
  });

  // Find event weeks
  const eventWeekMap: Record<string, ProsemEvent> = {};
  data.events.forEach(ev => {
    const key = `${data.months[0]?.tahun || 2025}-${String(ev.bulan).padStart(2, '0')}-W${ev.mingguKe}`;
    // Only if key exists in allWeekKeys
    if (allWeekKeys.includes(key)) {
      eventWeekMap[key] = ev;
    }
  });

  return (
    <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-foreground/20">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSem(1)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors ${
              activeSem === 1
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-foreground/20 text-muted-foreground hover:border-foreground/40'
            }`}
          >
            Semester 1
          </button>
          <button
            onClick={() => setActiveSem(2)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-colors ${
              activeSem === 2
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-foreground/20 text-muted-foreground hover:border-foreground/40'
            }`}
          >
            Semester 2
          </button>
        </div>
        <Button
          onClick={() => onExportWord(activeSem)}
          disabled={isExporting}
          variant="outline"
          className="text-xs border-2 border-foreground shadow-brutal-sm"
        >
          {isExporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
          Download Word
        </Button>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse text-[10px] min-w-[800px]">
          <thead>
            {/* Month header row */}
            <tr>
              <th rowSpan={2} className="border border-foreground/30 bg-[#0D7C8F] text-white p-1.5 w-8 text-center">No</th>
              <th rowSpan={2} className="border border-foreground/30 bg-[#0D7C8F] text-white p-1.5 min-w-[180px]">Tujuan Pembelajaran</th>
              <th rowSpan={2} className="border border-foreground/30 bg-[#0D7C8F] text-white p-1.5 min-w-[100px]">Materi</th>
              <th rowSpan={2} className="border border-foreground/30 bg-[#0D7C8F] text-white p-1.5 w-10 text-center">JP</th>
              {data.months.map(m => (
                <th
                  key={`${m.tahun}-${m.bulan}`}
                  colSpan={m.mingguCount}
                  className="border border-foreground/30 bg-[#0D7C8F] text-white p-1.5 text-center"
                >
                  {BULAN_NAMES[m.bulan]?.substring(0, 3)} {m.tahun}
                </th>
              ))}
            </tr>
            {/* Week sub-header row */}
            <tr>
              {data.months.map(m =>
                Array.from({ length: m.mingguCount }, (_, w) => (
                  <th
                    key={`${m.tahun}-${m.bulan}-W${w + 1}`}
                    className="border border-foreground/30 bg-[#0D7C8F]/80 text-white p-1 text-center w-8"
                  >
                    {w + 1}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {data.rows.map(row => (
              <tr key={row.no}>
                <td className="border border-foreground/20 p-1.5 text-center font-bold">{row.no}</td>
                <td className="border border-foreground/20 p-1.5">{row.tujuan_pembelajaran}</td>
                <td className="border border-foreground/20 p-1.5">{row.materi_pokok}</td>
                <td className="border border-foreground/20 p-1.5 text-center font-bold">{row.alokasi_jp}</td>
                {allWeekKeys.map(wk => {
                  const cell = row.weeks[wk];
                  const event = eventWeekMap[wk];
                  const isEventWeek = !!event;
                  const bgColor = isEventWeek
                    ? (event.tipe === 'PTS' || event.tipe === 'PAS' ? '#FFF9C4' : '#EEEEEE')
                    : cell?.hasActivity ? '#E0F4F7' : 'transparent';

                  return (
                    <td
                      key={wk}
                      className="border border-foreground/20 p-1 text-center"
                      style={{ backgroundColor: bgColor }}
                      title={isEventWeek ? event.nama : undefined}
                    >
                      {isEventWeek ? '' : cell?.hasActivity ? '✓' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Event rows */}
            {data.events.map((ev, i) => (
              <tr key={`event-${i}`}>
                <td
                  colSpan={4}
                  className="border border-foreground/20 p-1.5 font-bold text-xs"
                  style={{
                    backgroundColor: ev.tipe === 'PTS' || ev.tipe === 'PAS' ? '#FFF9C4' : '#EEEEEE',
                  }}
                >
                  {ev.nama} ({ev.tipe})
                </td>
                {allWeekKeys.map(wk => {
                  const weekBulan = parseInt(wk.split('-')[1]);
                  const weekNum = parseInt(wk.split('W')[1]);
                  const isThisWeek = weekBulan === ev.bulan && weekNum === ev.mingguKe;
                  const bg = ev.tipe === 'PTS' || ev.tipe === 'PAS' ? '#FFF9C4' : '#EEEEEE';

                  return (
                    <td
                      key={wk}
                      className="border border-foreground/20 p-1 text-center"
                      style={{ backgroundColor: isThisWeek ? bg : 'transparent' }}
                    >
                      {isThisWeek ? '■' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
