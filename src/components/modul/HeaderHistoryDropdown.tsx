import { History, Save, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ContentHistoryItem } from '@/hooks/useContentHistory';

interface HeaderHistoryDropdownProps {
  historyItems: ContentHistoryItem[];
  selectedHistoryId: string | null;
  isLoading: boolean;
  isDeleting: boolean;
  hasContent: boolean;
  onSelectHistory: (id: string | null) => void;
  onLoadHistory: (item: ContentHistoryItem) => void;
  onSaveClick: () => void;
  onDeleteClick: () => void;
}

const truncateName = (name: string, maxLength: number = 18) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

const getContentIndicators = (item: ContentHistoryItem): string[] => {
  const indicators: string[] = [];
  if (item.modul_data) indicators.push('M');
  if (item.lkpd_data) indicators.push('L');
  if (item.asesmen_data) indicators.push('A');
  if (item.materi_data) indicators.push('Ma');
  if (item.bank_soal_data) indicators.push('BS');
  if (item.tindak_lanjut_data) indicators.push('R');
  if (item.prota_data) indicators.push('P');
  if (item.kktp_data) indicators.push('K');
  if (item.prosem_data) indicators.push('S');
  return indicators;
};

export const HeaderHistoryDropdown = ({
  historyItems,
  selectedHistoryId,
  isLoading,
  isDeleting,
  hasContent,
  onSelectHistory,
  onLoadHistory,
  onSaveClick,
  onDeleteClick,
}: HeaderHistoryDropdownProps) => {
  const selectedItem = historyItems.find((h) => h.id === selectedHistoryId);

  const handleSelectItem = (item: ContentHistoryItem) => {
    onSelectHistory(item.id);
    onLoadHistory(item);
  };

  const handleClearSelection = () => {
    onSelectHistory(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-foreground/30 shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all max-w-[200px]"
        >
          <History className="w-4 h-4 flex-shrink-0" />
          <span className="truncate hidden sm:inline">
            {selectedItem ? truncateName(selectedItem.name) : 'Riwayat'}
          </span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-2 border-foreground/20 shadow-brutal">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-muted-foreground">Riwayat Konten</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* History items */}
        <div className="max-h-[200px] overflow-y-auto">
          {historyItems.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              Belum ada riwayat tersimpan
            </div>
          ) : (
            <>
              {selectedHistoryId && (
                <DropdownMenuItem
                  onClick={handleClearSelection}
                  className="text-muted-foreground text-xs"
                >
                  -- Batal Pilih --
                </DropdownMenuItem>
              )}
              {historyItems.map((item) => {
                const indicators = getContentIndicators(item);
                const isSelected = item.id === selectedHistoryId;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        onClick={() => handleSelectItem(item)}
                        className={`flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <span className="truncate text-sm">{truncateName(item.name, 22)}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          [{indicators.join(',')}]
                        </span>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem
          onClick={onSaveClick}
          disabled={!hasContent}
          className={`gap-2 ${!hasContent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Save className="w-4 h-4" />
          <span>Simpan Riwayat Baru</span>
        </DropdownMenuItem>

        {selectedHistoryId && (
          <DropdownMenuItem
            onClick={onDeleteClick}
            disabled={isDeleting}
            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Hapus Riwayat Terpilih</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
