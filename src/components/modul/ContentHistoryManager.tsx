import { Save, Trash2, History, Loader2 } from 'lucide-react';
import { useContentHistory, useDeleteContentHistory, type ContentHistoryItem } from '@/hooks/useContentHistory';

interface ContentHistoryManagerProps {
  selectedHistoryId: string | null;
  onSelectHistory: (historyId: string | null) => void;
  onLoadHistory: (item: ContentHistoryItem) => void;
  onSaveClick: () => void;
  hasContent: boolean;
}

export const ContentHistoryManager = ({
  selectedHistoryId,
  onSelectHistory,
  onLoadHistory,
  onSaveClick,
  hasContent,
}: ContentHistoryManagerProps) => {
  const { data: historyItems = [], isLoading } = useContentHistory();
  const deleteHistoryMutation = useDeleteContentHistory();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      onSelectHistory(null);
      return;
    }

    const item = historyItems.find((h) => h.id === value);
    if (item) {
      onSelectHistory(value);
      onLoadHistory(item);
    }
  };

  const handleDelete = async () => {
    if (!selectedHistoryId) return;
    
    const confirmed = window.confirm('Hapus riwayat konten ini?');
    if (!confirmed) return;

    try {
      await deleteHistoryMutation.mutateAsync(selectedHistoryId);
      onSelectHistory(null);
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContentIndicators = (item: ContentHistoryItem) => {
    const indicators: string[] = [];
    if (item.modul_data) indicators.push('M');
    if (item.lkpd_data) indicators.push('L');
    if (item.asesmen_data) indicators.push('A');
    if (item.materi_data) indicators.push('Ma');
    if (item.bank_soal_data) indicators.push('BS');
    if (item.tindak_lanjut_data) indicators.push('R');
    return indicators;
  };

  return (
    <div className="bg-secondary p-4 rounded-xl border-2 border-muted-foreground/30 mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-extrabold uppercase text-muted-foreground flex items-center gap-1">
          <History className="w-3 h-3" /> Riwayat Konten
        </span>
        {selectedHistoryId && (
          <button
            onClick={handleDelete}
            disabled={deleteHistoryMutation.isPending}
            className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            title="Hapus riwayat"
          >
            {deleteHistoryMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        <select
          value={selectedHistoryId || ''}
          onChange={handleSelectChange}
          disabled={isLoading}
          className="flex-1 text-sm p-2 rounded-lg border-2 border-muted-foreground/30 focus:border-foreground outline-none bg-card"
        >
          <option value="">-- Pilih Riwayat --</option>
          {historyItems.map((item) => {
            const indicators = getContentIndicators(item);
            return (
              <option key={item.id} value={item.id}>
                {item.name} [{indicators.join(', ')}]
              </option>
            );
          })}
        </select>
        
        <button
          onClick={onSaveClick}
          disabled={!hasContent}
          className={`px-3 rounded-lg transition-colors ${
            hasContent
              ? 'bg-foreground text-background hover:bg-foreground/80'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          title={hasContent ? 'Simpan riwayat baru' : 'Generate konten dulu'}
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {isLoading ? (
          'Memuat...'
        ) : historyItems.length > 0 ? (
          `${historyItems.length} riwayat tersimpan`
        ) : (
          'Belum ada riwayat'
        )}
      </p>
    </div>
  );
};
