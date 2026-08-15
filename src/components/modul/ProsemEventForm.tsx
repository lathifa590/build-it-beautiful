import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProsemEvent } from '@/types/modul';
import { PROSEM_EVENT_TYPES, BULAN_NAMES } from '@/lib/constants';

interface ProsemEventFormProps {
  events: ProsemEvent[];
  onChange: (events: ProsemEvent[]) => void;
}

export const ProsemEventForm = ({ events, onChange }: ProsemEventFormProps) => {
  const addEvent = () => {
    onChange([...events, { nama: '', semester: 1, bulan: 7, mingguKe: 1, tipe: 'Libur Nasional' }]);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof ProsemEvent, value: string | number) => {
    const updated = events.map((ev, i) => {
      if (i !== index) return ev;
      return { ...ev, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Daftar Event / Libur
      </h4>

      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_100px_70px_120px_32px] gap-2 text-[10px] font-bold text-muted-foreground uppercase">
        <span>Nama Event</span>
        <span>Semester</span>
        <span>Bulan</span>
        <span>Minggu</span>
        <span>Tipe</span>
        <span></span>
      </div>

      {events.map((ev, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_70px_120px_32px] gap-2 items-center bg-muted/30 rounded-lg p-2 sm:p-0 sm:bg-transparent">
          <Input
            value={ev.nama}
            onChange={(e) => updateEvent(i, 'nama', e.target.value)}
            placeholder="Nama event"
            className="text-xs h-8 border-foreground/20"
          />
          <select
            value={ev.semester}
            onChange={(e) => updateEvent(i, 'semester', Number(e.target.value))}
            className="text-xs h-8 rounded-md border border-foreground/20 bg-background px-2"
          >
            <option value={1}>Sem 1</option>
            <option value={2}>Sem 2</option>
          </select>
          <select
            value={ev.bulan}
            onChange={(e) => updateEvent(i, 'bulan', Number(e.target.value))}
            className="text-xs h-8 rounded-md border border-foreground/20 bg-background px-2"
          >
            {Array.from({ length: 12 }, (_, m) => m + 1).map(m => (
              <option key={m} value={m}>{BULAN_NAMES[m]?.substring(0, 3)}</option>
            ))}
          </select>
          <select
            value={ev.mingguKe}
            onChange={(e) => updateEvent(i, 'mingguKe', Number(e.target.value))}
            className="text-xs h-8 rounded-md border border-foreground/20 bg-background px-2"
          >
            {[1, 2, 3, 4, 5].map(w => (
              <option key={w} value={w}>W{w}</option>
            ))}
          </select>
          <select
            value={ev.tipe}
            onChange={(e) => updateEvent(i, 'tipe', e.target.value)}
            className="text-xs h-8 rounded-md border border-foreground/20 bg-background px-2"
          >
            {PROSEM_EVENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => removeEvent(i)}
            className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addEvent}
        className="text-xs border-dashed border-foreground/30"
      >
        <Plus className="w-3 h-3 mr-1" /> Tambah Event
      </Button>
    </div>
  );
};
