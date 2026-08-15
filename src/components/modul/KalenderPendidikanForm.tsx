import { useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { KalenderPendidikan } from '@/types/modul';
import { Input } from '@/components/ui/input';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Kalender Pendidikan</h3>
      </div>

      {/* JP per Minggu */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
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
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
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
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
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
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
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
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
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
    </div>
  );
};
