import { useState } from 'react';
import { FileDown, Loader2, ClipboardList, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { KKTPData, FormData } from '@/types/modul';

interface KKTPPreviewProps {
  kktpData: KKTPData;
  formData: FormData;
  onExportWord: () => void;
  isExporting?: boolean;
  onDataChange?: (data: KKTPData) => void;
}

type EditingCell = { tp: number; indIdx: number; field: string } | null;

export const KKTPPreview = ({ kktpData, formData, onExportWord, isExporting, onDataChange }: KKTPPreviewProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);

  const isEditing = (tp: number, indIdx: number, field: string) =>
    editingCell?.tp === tp && editingCell?.indIdx === indIdx && editingCell?.field === field;

  const handleCellChange = (tpNo: number, indIdx: number, field: string, value: string) => {
    if (!onDataChange) return;
    const newKktp = { ...kktpData, kktp: kktpData.kktp.map(item => {
      if (item.no !== tpNo) return item;
      const newIndicators = [...item.indikator];
      (newIndicators[indIdx] as any)[field] = value;
      return { ...item, indikator: newIndicators };
    })};
    onDataChange(newKktp);
  };

  const renderEditableCell = (tpNo: number, indIdx: number, field: string, value: string) => {
    if (!editMode || !onDataChange) return <>{value}</>;

    if (isEditing(tpNo, indIdx, field)) {
      return (
        <textarea
          autoFocus
          defaultValue={value}
          className="w-full text-xs border border-primary rounded p-1 min-h-[30px] resize-y bg-background"
          onBlur={(e) => { handleCellChange(tpNo, indIdx, field, e.target.value); setEditingCell(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null); }}
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 min-h-[16px]"
        onClick={() => setEditingCell({ tp: tpNo, indIdx, field })}
      >
        {value}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Kriteria Ketercapaian Tujuan Pembelajaran</h3>
        </div>
        <div className="flex gap-2">
          {onDataChange && (
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setEditMode(!editMode); setEditingCell(null); }}
              className="border-2 border-foreground shadow-brutal-sm font-bold"
            >
              <PenLine className="w-4 h-4 mr-2" />
              {editMode ? 'Selesai Edit' : 'Edit'}
            </Button>
          )}
          <Button
            onClick={onExportWord}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="border-2 border-foreground shadow-brutal-sm font-bold"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</>
            ) : (
              <><FileDown className="w-4 h-4 mr-2" />Download Word</>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {formData.mataPelajaran} | {formData.kelas || ''} | Fase {formData.fase || ''}
      </p>

      {editMode && (
        <p className="text-xs text-primary bg-primary/5 p-2 rounded-lg">
          💡 Klik sel tabel untuk mengedit deskriptor. Tekan Escape untuk batal.
        </p>
      )}

      {/* KKTP per TP */}
      {kktpData.kktp.map((item) => (
        <div key={item.no} className="bg-card border-2 border-foreground rounded-xl overflow-hidden shadow-brutal-sm">
          {/* TP Header */}
          <div className="bg-primary/10 px-4 py-3 border-b-2 border-foreground">
            <p className="text-sm font-bold text-primary">TP {item.no}</p>
            <p className="text-sm mt-1">{item.tujuan_pembelajaran}</p>
          </div>

          {/* Indikator Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-white" style={{ backgroundColor: '#374151', minWidth: '200px' }}>
                    Indikator
                  </th>
                  <th className="px-3 py-2 text-left font-bold" style={{ backgroundColor: '#FFEBEE', minWidth: '150px' }}>
                    Belum Berkembang
                  </th>
                  <th className="px-3 py-2 text-left font-bold" style={{ backgroundColor: '#FFFDE7', minWidth: '150px' }}>
                    Mulai Berkembang
                  </th>
                  <th className="px-3 py-2 text-left font-bold" style={{ backgroundColor: '#E8F5E9', minWidth: '150px' }}>
                    Berkembang Sesuai Harapan
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-white" style={{ backgroundColor: '#1B5E20', minWidth: '150px' }}>
                    Sangat Berkembang
                  </th>
                </tr>
              </thead>
              <tbody>
                {item.indikator.map((ind, idx) => (
                  <tr key={idx} className="border-t border-foreground/10">
                    <td className="px-3 py-2 font-medium bg-muted/30">
                      <span className="text-muted-foreground">{ind.no_indikator}.</span>{' '}
                      {renderEditableCell(item.no, idx, 'indikator', ind.indikator)}
                    </td>
                    <td className="px-3 py-2">{renderEditableCell(item.no, idx, 'belum_berkembang', ind.belum_berkembang)}</td>
                    <td className="px-3 py-2">{renderEditableCell(item.no, idx, 'mulai_berkembang', ind.mulai_berkembang)}</td>
                    <td className="px-3 py-2">{renderEditableCell(item.no, idx, 'berkembang_sesuai_harapan', ind.berkembang_sesuai_harapan)}</td>
                    <td className="px-3 py-2">{renderEditableCell(item.no, idx, 'sangat_berkembang', ind.sangat_berkembang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
