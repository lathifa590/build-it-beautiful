import { useEffect } from 'react';
import { Calendar, Clock, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { KalenderPendidikan, ProsemEvent } from '@/types/modul';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface KalenderPendidikanFormProps {
  kalender: KalenderPendidikan;
  onChange: (kalender: KalenderPendidikan) => void;
}

const STORAGE_KEY = 'prota_kalender_pendidikan';

export const KalenderPendidikanForm = ({ kalender, onChange }: KalenderPendidikanFormProps) => {
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        onChange({ ...kalender, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load kalender from localStorage', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kalender));
    } catch (e) {
      console.error('Failed to save kalender to localStorage', e);
    }
  }, [kalender]);

  const handleChange = (field: keyof KalenderPendidikan, value: string | number) => {
    onChange({ ...kalender, [field]: value });
  };

  const totalJPSem1 = kalender.jpPerMinggu * kalender.mingguEfektifSem1;
  const totalJPSem2 = kalender.jpPerMinggu * kalender.mingguEfektifSem2;

  const events = kalender.kegiatanNonPembelajaran || [];

  const handleAddEvent = () => {
    const newEvent: ProsemEvent = {
      nama: 'Kegiatan Baru',
      semester: 1,
      bulan: new Date().getMonth() + 1,
      mingguKe: 1,
      tipe: 'Libur Sekolah'
    };
    onChange({ ...kalender, kegiatanNonPembelajaran: [...events, newEvent] });
  };

  const handleUpdateEvent = (index: number, field: keyof ProsemEvent, value: any) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    onChange({ ...kalender, kegiatanNonPembelajaran: newEvents });
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    onChange({ ...kalender, kegiatanNonPembelajaran: newEvents });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Kalender Pendidikan</h3>
      </div>

      {/* JP per Minggu */}
      <div>
        <label className="field-label mb-1 block">
          JP per Minggu
        </label>
        <Input
          type="number"
          min={1}
          max={12}
          value={kalender.jpPerMinggu}
          onChange={(e) => handleChange('jpPerMinggu', parseInt(e.target.value) || 1)}
          className="border-2 border-foreground/20 font-medium"
        />
      </div>

      {/* Minggu Efektif */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label mb-1 block">
            Minggu Efektif Sem 1
          </label>
          <Input
            type="number"
            min={1}
            max={26}
            value={kalender.mingguEfektifSem1}
            onChange={(e) => handleChange('mingguEfektifSem1', parseInt(e.target.value) || 1)}
            className="border-2 border-foreground/20 font-medium"
          />
        </div>
        <div>
          <label className="field-label mb-1 block">
            Minggu Efektif Sem 2
          </label>
          <Input
            type="number"
            min={1}
            max={26}
            value={kalender.mingguEfektifSem2}
            onChange={(e) => handleChange('mingguEfektifSem2', parseInt(e.target.value) || 1)}
            className="border-2 border-foreground/20 font-medium"
          />
        </div>
      </div>

      {/* Tanggal Mulai */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label mb-1 block">
            Mulai Sem 1
          </label>
          <Input
            type="date"
            value={kalender.tanggalMulaiSem1}
            onChange={(e) => handleChange('tanggalMulaiSem1', e.target.value)}
            className="border-2 border-foreground/20 font-medium text-xs"
          />
        </div>
        <div>
          <label className="field-label mb-1 block">
            Mulai Sem 2
          </label>
          <Input
            type="date"
            value={kalender.tanggalMulaiSem2}
            onChange={(e) => handleChange('tanggalMulaiSem2', e.target.value)}
            className="border-2 border-foreground/20 font-medium text-xs"
          />
        </div>
      </div>

      {/* Kalkulasi Total JP */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">Total JP Tersedia</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-card rounded-md p-2 border border-foreground/10">
            <span className="text-muted-foreground">Semester 1:</span>
            <span className="font-bold ml-1">{totalJPSem1} JP</span>
          </div>
          <div className="bg-card rounded-md p-2 border border-foreground/10">
            <span className="text-muted-foreground">Semester 2:</span>
            <span className="font-bold ml-1">{totalJPSem2} JP</span>
          </div>
        </div>
      </div>

      {/* Kegiatan Non Pembelajaran */}
      <div className="pt-4 border-t border-border mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm">Kegiatan Non-Pembelajaran</h3>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddEvent} className="h-7 text-xs px-2">
            <Plus className="w-3 h-3 mr-1" /> Tambah
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Tambahkan minggu-minggu khusus seperti PTS, PAS, atau Libur. AI tidak akan mengalokasikan JP/Materi pada minggu tersebut di Program Semester.
        </p>

        {events.length === 0 ? (
          <div className="text-center p-4 border border-dashed rounded-lg bg-muted/20 text-xs text-muted-foreground">
            Belum ada kegiatan non-pembelajaran.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev, idx) => (
              <div key={idx} className="border border-border bg-card p-3 rounded-lg relative group">
                <button
                  onClick={() => handleRemoveEvent(idx)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-1 gap-2 mb-2 pr-6">
                  <Input
                    value={ev.nama}
                    onChange={(e) => handleUpdateEvent(idx, 'nama', e.target.value)}
                    placeholder="Nama Kegiatan (Misal: UTS)"
                    className="h-7 text-xs font-medium"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={ev.semester}
                    onChange={(e) => handleUpdateEvent(idx, 'semester', parseInt(e.target.value))}
                    className="flex h-7 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                  
                  <div className="relative">
                    <Input
                      value={ev.tipe}
                      onChange={(e) => handleUpdateEvent(idx, 'tipe', e.target.value)}
                      placeholder="Tipe Kegiatan..."
                      list={`tipe-options-${idx}`}
                      className="h-7 text-xs font-medium"
                    />
                    <datalist id={`tipe-options-${idx}`}>
                      <option value="PTS" />
                      <option value="PAS" />
                      <option value="Libur Nasional" />
                      <option value="Libur Sekolah" />
                    </datalist>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-12">Bulan:</span>
                    <select
                      value={ev.bulan}
                      onChange={(e) => handleUpdateEvent(idx, 'bulan', parseInt(e.target.value))}
                      className="flex h-7 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {Array.from({length: 12}).map((_, i) => (
                        <option key={i+1} value={i+1}>Bulan {i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-12">Minggu:</span>
                    <select
                      value={ev.mingguKe}
                      onChange={(e) => handleUpdateEvent(idx, 'mingguKe', parseInt(e.target.value))}
                      className="flex h-7 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {[1,2,3,4,5].map(w => (
                        <option key={w} value={w}>Minggu {w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
