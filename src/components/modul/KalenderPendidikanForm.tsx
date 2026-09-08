import { useEffect, useMemo } from 'react';
import { Calendar, Clock, Trash2, Plus, AlertCircle, Calculator } from 'lucide-react';
import type { KalenderPendidikan, ProsemEvent } from '@/types/modul';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BULAN_NAMES } from '@/lib/constants';

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

  const handleChange = (field: keyof KalenderPendidikan, value: any) => {
    onChange({ ...kalender, [field]: value });
  };

  const handleUpdateMingguCount = (tahun: number, bulan: number, count: number) => {
    const key = `${tahun}-${bulan}`;
    const baru = { ...(kalender.mingguPerBulan || {}) };
    baru[key] = count;
    
    // We should also recalculate total mingguEfektif when this changes, 
    // but for now we let the derived values show it.
    onChange({ ...kalender, mingguPerBulan: baru });
  };

  const getMonthsForSemester = (startDateStr: string) => {
    if (!startDateStr) return [];
    const startDate = new Date(startDateStr);
    const months = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < 6; i++) {
      months.push({
        bulan: currentDate.getMonth() + 1,
        tahun: currentDate.getFullYear()
      });
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    return months;
  };

  const sem1Months = getMonthsForSemester(kalender.tanggalMulaiSem1);
  const sem2Months = getMonthsForSemester(kalender.tanggalMulaiSem2);
  const events = kalender.kegiatanNonPembelajaran || [];

  const getMingguCount = (tahun: number, bulan: number) => {
    const key = `${tahun}-${bulan}`;
    if (kalender.mingguPerBulan?.[key] !== undefined) {
      return kalender.mingguPerBulan[key];
    }
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    return Math.ceil(daysInMonth / 7);
  };

  const getNonEffectiveCount = (semester: 1 | 2, bulan: number) => {
    return events.filter(e => e.semester === semester && e.bulan === bulan).length;
  };

  // Calculate totals
  const derivedMingguEfektifSem1 = useMemo(() => {
    return sem1Months.reduce((total, m) => {
      const w = getMingguCount(m.tahun, m.bulan);
      const ne = getNonEffectiveCount(1, m.bulan);
      return total + Math.max(0, w - ne);
    }, 0);
  }, [sem1Months, kalender.mingguPerBulan, events]);

  const derivedMingguEfektifSem2 = useMemo(() => {
    return sem2Months.reduce((total, m) => {
      const w = getMingguCount(m.tahun, m.bulan);
      const ne = getNonEffectiveCount(2, m.bulan);
      return total + Math.max(0, w - ne);
    }, 0);
  }, [sem2Months, kalender.mingguPerBulan, events]);

  // Sync derived values back to kalender to ensure prosem/prota generation uses the correct total
  useEffect(() => {
    if (derivedMingguEfektifSem1 !== kalender.mingguEfektifSem1 || derivedMingguEfektifSem2 !== kalender.mingguEfektifSem2) {
      onChange({
        ...kalender,
        mingguEfektifSem1: derivedMingguEfektifSem1,
        mingguEfektifSem2: derivedMingguEfektifSem2
      });
    }
  }, [derivedMingguEfektifSem1, derivedMingguEfektifSem2, kalender.mingguEfektifSem1, kalender.mingguEfektifSem2]);

  const totalJPSem1 = kalender.jpPerMinggu * derivedMingguEfektifSem1;
  const totalJPSem2 = kalender.jpPerMinggu * derivedMingguEfektifSem2;

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

  const renderMonthTable = (semester: 1 | 2, months: {bulan: number, tahun: number}[]) => {
    if (months.length === 0) return null;
    let totalMinggu = 0;
    let totalEfektif = 0;
    
    return (
      <div className="border border-border rounded-lg overflow-hidden mb-4 bg-card shadow-sm">
        <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
          <h4 className="text-xs font-bold">Rincian Semester {semester}</h4>
        </div>
        <table className="w-full text-[10px] sm:text-xs text-left border-collapse">
          <thead>
            <tr className="bg-muted/30">
              <th className="p-2 border-b font-medium w-1/3">Bulan</th>
              <th className="p-2 border-b font-medium text-center">Jml Minggu</th>
              <th className="p-2 border-b font-medium text-center">Tdk Efektif</th>
              <th className="p-2 border-b font-medium text-center">Efektif</th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => {
              const count = getMingguCount(m.tahun, m.bulan);
              const nonEffective = getNonEffectiveCount(semester, m.bulan);
              const effective = Math.max(0, count - nonEffective);
              totalMinggu += count;
              totalEfektif += effective;
              
              return (
                <tr key={`${m.tahun}-${m.bulan}`} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-2">{BULAN_NAMES[m.bulan]} {m.tahun}</td>
                  <td className="p-1 text-center">
                    <Input 
                      type="number" 
                      min={1} max={6}
                      value={count}
                      onChange={(e) => handleUpdateMingguCount(m.tahun, m.bulan, parseInt(e.target.value) || 0)}
                      className="h-6 w-12 text-center mx-auto text-[10px] p-0"
                    />
                  </td>
                  <td className="p-2 text-center text-amber-600 font-medium">{nonEffective}</td>
                  <td className="p-2 text-center text-primary font-bold">{effective}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-bold border-t border-border">
              <td className="p-2 text-right">Total:</td>
              <td className="p-2 text-center">{totalMinggu}</td>
              <td className="p-2 text-center text-amber-600">{totalMinggu - totalEfektif}</td>
              <td className="p-2 text-center text-primary">{totalEfektif}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Kalender Pendidikan</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
        {/* Tanggal Mulai */}
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
          <div className="bg-card rounded-md p-2 border border-foreground/10 flex justify-between">
            <span className="text-muted-foreground">Semester 1:</span>
            <span className="font-bold">{totalJPSem1} JP <span className="text-[10px] font-normal opacity-70">({derivedMingguEfektifSem1} mg)</span></span>
          </div>
          <div className="bg-card rounded-md p-2 border border-foreground/10 flex justify-between">
            <span className="text-muted-foreground">Semester 2:</span>
            <span className="font-bold">{totalJPSem2} JP <span className="text-[10px] font-normal opacity-70">({derivedMingguEfektifSem2} mg)</span></span>
          </div>
        </div>
      </div>

      {/* Kegiatan Non Pembelajaran */}
      <div className="pt-2 border-t border-border mt-2">
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
          Tambahkan minggu khusus seperti PTS, PAS, atau Libur. Ini akan memotong jumlah Minggu Efektif.
        </p>

        {events.length === 0 ? (
          <div className="text-center p-4 border border-dashed rounded-lg bg-muted/20 text-xs text-muted-foreground mb-4">
            Belum ada kegiatan non-pembelajaran.
          </div>
        ) : (
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
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

      {/* Rincian Minggu per Bulan */}
      <div className="pt-2 border-t border-border mt-2">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Perhitungan Minggu Efektif</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          Sesuaikan "Jumlah Minggu" jika ada bulan yang dihitung 4 atau 5 minggu. Minggu Efektif akan otomatis dikurangi dengan kegiatan non-pembelajaran di atas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderMonthTable(1, sem1Months)}
          {renderMonthTable(2, sem2Months)}
        </div>
      </div>
    </div>
  );
};
