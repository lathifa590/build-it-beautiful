import { useState } from 'react';
import { FileDown, Loader2, PenLine, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProtaData, ProtaItem, FormData } from '@/types/modul';

interface ProtaPreviewProps {
  protaData: ProtaData;
  formData: FormData;
  onExportWord: () => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
  onDataChange?: (data: ProtaData) => void;
  onCreateModul?: (item: ProtaItem) => void;
  kurikulum?: string;
}

type EditingCell = { row: number; field: string } | null;

export const ProtaPreview = ({ protaData, formData, onExportWord, onExportExcel, isExporting, onDataChange, onCreateModul, kurikulum }: ProtaPreviewProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);

  const hasPancaCinta = kurikulum === 'kbc' && protaData.prota.some(item => item.panca_cinta);

  const sem1Items = protaData.prota.filter(i => i.semester === 1);
  const sem2Items = protaData.prota.filter(i => i.semester === 2);

  // Progress tracking
  const totalTP = protaData.prota.length;
  const generatedTP = protaData.prota.filter(i => i.generated).length;
  const progressPercent = totalTP > 0 ? (generatedTP / totalTP) * 100 : 0;

  const handleCellChange = (itemIndex: number, field: string, value: string | number | string[]) => {
    if (!onDataChange) return;
    const newProta = [...protaData.prota];
    const globalIndex = newProta.findIndex(p => p.no === itemIndex + 1) !== -1 
      ? newProta.findIndex(p => p.no === itemIndex + 1)
      : itemIndex;
    
    (newProta[globalIndex] as any)[field] = value;
    
    const total_jp_sem1 = newProta.filter(i => i.semester === 1).reduce((sum, i) => sum + i.alokasi_jp, 0);
    const total_jp_sem2 = newProta.filter(i => i.semester === 2).reduce((sum, i) => sum + i.alokasi_jp, 0);
    
    onDataChange({ ...protaData, prota: newProta, total_jp_sem1, total_jp_sem2 });
  };

  const handleAddTP = (semester: number) => {
    if (!onDataChange) return;
    const newProta = [...protaData.prota];
    const maxNo = newProta.length > 0 ? Math.max(...newProta.map(p => p.no)) : 0;
    
    newProta.push({
      no: maxNo + 1,
      semester,
      tujuan_pembelajaran: '',
      materi_pokok: '',
      alokasi_jp: 0,
      profil_pelajar_pancasila: [],
      dimensi_profil_lulusan: [],
      keterangan: '',
      generated: false
    });
    
    newProta.sort((a, b) => a.semester - b.semester || a.no - b.no);
    
    const total_jp_sem1 = newProta.filter(i => i.semester === 1).reduce((sum, i) => sum + i.alokasi_jp, 0);
    const total_jp_sem2 = newProta.filter(i => i.semester === 2).reduce((sum, i) => sum + i.alokasi_jp, 0);
    
    onDataChange({ ...protaData, prota: newProta, total_jp_sem1, total_jp_sem2 });
    setEditMode(true);
  };

  const isEditing = (no: number, field: string) => editingCell?.row === no && editingCell?.field === field;

  const renderEditableCell = (item: typeof protaData.prota[0], field: string, value: string | number | string[], isTextarea = false) => {
    const globalIdx = protaData.prota.findIndex(p => p.no === item.no);
    if (!editMode || !onDataChange) {
      return <>{Array.isArray(value) ? (value.join(', ') || '-') : (typeof value === 'number' ? value : value || '-')}</>;
    }

    if (isEditing(item.no, field)) {
      const handleBlur = (newValue: string) => {
        let finalValue: string | number | string[] = newValue;
        if (field === 'alokasi_jp') finalValue = parseInt(newValue) || 0;
        if (field === 'dimensi_profil_lulusan' || field === 'profil_pelajar_pancasila') {
          finalValue = newValue.split(',').map(s => s.trim()).filter(s => s);
        }
        handleCellChange(globalIdx, field, finalValue);
        setEditingCell(null);
      };

      const stringValue = Array.isArray(value) ? value.join(', ') : String(value);

      if (isTextarea) {
        return (
          <textarea
            autoFocus
            defaultValue={stringValue}
            className="w-full text-xs border border-primary rounded p-1 min-h-[40px] resize-y bg-background"
            onBlur={(e) => handleBlur(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
          />
        );
      }
      return (
        <input
          autoFocus
          type={field === 'alokasi_jp' ? 'number' : 'text'}
          defaultValue={stringValue}
          className="w-full text-xs border border-primary rounded p-1 bg-background"
          onBlur={(e) => handleBlur(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { if (e.key === 'Enter') handleBlur((e.target as HTMLInputElement).value); else setEditingCell(null); } }}
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 min-h-[20px]"
        onClick={() => setEditingCell({ row: item.no, field })}
      >
        {Array.isArray(value) ? (value.join(', ') || '-') : (typeof value === 'number' ? value : value || '-')}
      </div>
    );
  };

  const renderTable = (items: typeof protaData.prota, semester: number) => (
    <div className="mb-6">
      <h3 className="font-bold text-sm bg-primary/10 text-primary px-3 py-2 rounded-t-lg border-2 border-foreground/20 border-b-0">
        SEMESTER {semester}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-2 border-foreground/20">
          <thead>
            <tr className="bg-[#0D7C8F] text-white">
              {onCreateModul && <th className="border border-foreground/20 px-2 py-2 w-8">✓</th>}
              <th className="border border-foreground/20 px-2 py-2 w-8">No</th>
              <th className="border border-foreground/20 px-2 py-2">Tujuan Pembelajaran</th>
              <th className="border border-foreground/20 px-2 py-2">Materi Pokok</th>
              <th className="border border-foreground/20 px-2 py-2 w-14">JP</th>
              <th className="border border-foreground/20 px-2 py-2">Dimensi Profil Lulusan</th>
              {hasPancaCinta && <th className="border border-foreground/20 px-2 py-2">Panca Cinta</th>}
              <th className="border border-foreground/20 px-2 py-2">Keterangan</th>
              {onCreateModul && <th className="border border-foreground/20 px-2 py-2 w-24">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={`hover:bg-muted/50 ${item.generated ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                {onCreateModul && (
                  <td className="border border-foreground/20 px-2 py-2 text-center">
                    <Checkbox checked={!!item.generated} disabled className="pointer-events-none" />
                  </td>
                )}
                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">{item.no}</td>
                <td className="border border-foreground/20 px-2 py-2">
                  {renderEditableCell(item, 'tujuan_pembelajaran', item.tujuan_pembelajaran, true)}
                </td>
                <td className="border border-foreground/20 px-2 py-2">
                  {renderEditableCell(item, 'materi_pokok', item.materi_pokok, true)}
                </td>
                <td className="border border-foreground/20 px-2 py-2 text-center font-bold">
                  {renderEditableCell(item, 'alokasi_jp', item.alokasi_jp)}
                </td>
                <td className="border border-foreground/20 px-2 py-2">
                  {renderEditableCell(item, 'dimensi_profil_lulusan', (item.dimensi_profil_lulusan || item.profil_pelajar_pancasila || []), true)}
                </td>
                {hasPancaCinta && (
                  <td className="border border-foreground/20 px-2 py-2">
                    {renderEditableCell(item, 'panca_cinta', item.panca_cinta || '')}
                  </td>
                )}
                <td className="border border-foreground/20 px-2 py-2">
                  {renderEditableCell(item, 'keterangan', item.keterangan)}
                </td>
                {onCreateModul && (
                  <td className="border border-foreground/20 px-2 py-2 text-center">
                    {item.generated ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2 border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => onCreateModul(item)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Buat Modul
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-muted/30 font-bold">
              <td colSpan={onCreateModul ? 4 : 3} className="border border-foreground/20 px-2 py-2 text-right">
                Total JP Semester {semester}
              </td>
              <td className="border border-foreground/20 px-2 py-2 text-center">
                {semester === 1 ? protaData.total_jp_sem1 : protaData.total_jp_sem2}
              </td>
              <td colSpan={hasPancaCinta ? (onCreateModul ? 4 : 3) : (onCreateModul ? 3 : 2)} className="border border-foreground/20 px-2 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
      {onDataChange && editMode && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTP(semester)}
            className="text-xs border-dashed border-primary text-primary hover:bg-primary/10"
          >
            + Tambah Tujuan Pembelajaran (Semester {semester})
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <h2 className="font-extrabold text-lg">PROGRAM TAHUNAN</h2>
            <p className="text-sm text-muted-foreground">{formData.sekolah || 'Sekolah'}</p>
            <div className="text-xs text-muted-foreground mt-1">
              <span>{formData.mataPelajaran}</span>
              {formData.kelas && <span> | {formData.kelas}</span>}
              {formData.fase && <span> | Fase {formData.fase}</span>}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {onCreateModul && totalTP > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-foreground/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Progress Modul Ajar</span>
              <span className="text-xs font-bold text-primary">{generatedTP}/{totalTP} TP</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {generatedTP === totalTP && totalTP > 0 && (
              <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Semua TP sudah dibuat modulnya! 🎉
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mb-4">
          {onDataChange && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setEditMode(!editMode); setEditingCell(null); }}
              className="border-2 border-foreground shadow-brutal-sm text-xs"
            >
              <PenLine className="w-4 h-4 mr-1" />
              {editMode ? 'Selesai Edit' : 'Edit'}
            </Button>
          )}
          {onExportExcel && (
            <Button
              onClick={onExportExcel}
              disabled={isExporting}
              className="border-2 border-foreground shadow-brutal-sm text-xs"
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-1" />
              )}
              Download Excel (.xlsx)
            </Button>
          )}
          <Button
            onClick={onExportWord}
            disabled={isExporting}
            className="border-2 border-foreground shadow-brutal-sm text-xs"
            size="sm"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1" />
            )}
            Download Prota (.docx)
          </Button>
        </div>

        {editMode && (
          <p className="text-xs text-primary mb-3 bg-primary/5 p-2 rounded-lg">
            💡 Klik sel tabel untuk mengedit. Tekan Enter atau klik di luar sel untuk menyimpan.
          </p>
        )}

        {/* Tables */}
        {sem1Items.length > 0 && renderTable(sem1Items, 1)}
        {sem2Items.length > 0 && renderTable(sem2Items, 2)}

        {/* Footer */}
        <div className="mt-6 text-xs text-muted-foreground grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold">Penyusun,</p>
            <p className="mt-8">{formData.namaPenyusun || '_______________'}</p>
            {formData.nipPenyusun && <p>NIP. {formData.nipPenyusun}</p>}
          </div>
          <div className="text-right">
            <p className="font-bold">Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <p className="mt-8">{formData.kepalaSekolah || '_______________'}</p>
            {formData.nipKepalaSekolah && <p>NIP. {formData.nipKepalaSekolah}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
