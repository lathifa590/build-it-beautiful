import {
  PenTool,
  ClipboardCheck,
  FileQuestion,
  BookOpen,
  HeartHandshake,
  FileDown,
  Download,
  Loader2,
  Layout,
  Layers,
  FileText,
  ChevronDown,
  Calendar,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabButton } from './TabButton';
import { LetterheadControl } from './LetterheadControl';
import { QuotaIndicator } from './QuotaIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ToolbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loaders: {
    lkpd: boolean;
    asesmen: boolean;
    materi: boolean;
    tindakLanjut: boolean;
    bankSoal: boolean;
  };
  lkpdData: unknown;
  asesmenData: unknown;
  materiData: unknown;
  tindakLanjutData: unknown;
  bankSoalData: unknown;
  modulData?: boolean;
  onGenerateLKPD: () => void;
  onGenerateAsesmen: () => void;
  onGenerateMateri: () => void;
  onGenerateTindakLanjut: () => void;
  onOpenSoalModal: () => void;
  onRegenerateModul?: () => void;
  onRegenerateLKPD?: () => void;
  onRegenerateAsesmen?: () => void;
  onRegenerateMateri?: () => void;
  onRegenerateTindakLanjut?: () => void;
  onRegenerateBankSoal?: () => void;
  onExportCurrentTab: () => void;
  onExportAll: () => void;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
  onExportSoalDocx?: () => void;
  isExportingSoalDocx?: boolean;
  onOpenPromptExport?: () => void;
  // Letterhead props
  letterheadUrl?: string | null;
  isLetterheadEnabled?: boolean;
  rawLetterheadEnabled?: boolean;
  hasLetterhead?: boolean;
  isUploadingLetterhead?: boolean;
  isDeletingLetterhead?: boolean;
  letterheadUploadError?: string;
  onToggleLetterhead?: (enabled: boolean) => void;
  onUploadLetterhead?: (file: File) => void;
  onDeleteLetterhead?: () => void;
  // Quota props
  quotaInfo?: { remaining: number; limit: number; isTrial: boolean } | null;
  isModulComplete?: boolean;
  isPlanningTab?: boolean;
  /** V2: sembunyikan tombol generate per jenis dokumen (dipindah ke panel pertemuan). */
  hideDocGenerate?: boolean;
  /** V2 aktif: sembunyikan tab dokumen legacy (navigasi dipegang navigator V2). */
  v2Mode?: boolean;
  /** FASE 4B: buka dialog export V2 (dipakai semua jalur saat v2Mode). */
  onOpenV2Export?: () => void;
}

export const Toolbar = ({
  activeTab,
  setActiveTab,
  loaders,
  lkpdData,
  asesmenData,
  materiData,
  tindakLanjutData,
  bankSoalData,
  onGenerateLKPD,
  onGenerateAsesmen,
  onGenerateMateri,
  onGenerateTindakLanjut,
  onOpenSoalModal,
  onRegenerateModul,
  onRegenerateLKPD,
  onRegenerateAsesmen,
  onRegenerateMateri,
  onRegenerateTindakLanjut,
  onRegenerateBankSoal,
  onExportCurrentTab,
  onExportAll,
  onExportPDF,
  isExportingPDF,
  onExportSoalDocx,
  isExportingSoalDocx,
  onOpenPromptExport,
  // Letterhead props
  letterheadUrl,
  isLetterheadEnabled,
  rawLetterheadEnabled,
  hasLetterhead,
  isUploadingLetterhead,
  isDeletingLetterhead,
  letterheadUploadError,
  onToggleLetterhead,
  onUploadLetterhead,
  onDeleteLetterhead,
  quotaInfo,
  modulData,
  isModulComplete = true,
  isPlanningTab = false,
  hideDocGenerate = false,
  v2Mode = false,
  onOpenV2Export,
}: ToolbarProps) => {
  const lockOther = !isModulComplete;
  const lockTitle = lockOther ? 'Selesaikan semua pertemuan modul terlebih dahulu' : '';

  /**
   * Isi menu Export. Saat V2 aktif, seluruh export dokumen legacy dinonaktifkan
   * (hasil V2 tidak boleh dikonversi lossy ke state legacy). Tombol non-export
   * seperti "Salin Prompt AI" tetap tersedia.
   */
  const renderExportItems = () => (
    <>
      {v2Mode ? (
        onOpenV2Export ? (
          <DropdownMenuItem onClick={onOpenV2Export} data-testid="export-v2-open">
            <FileDown className="w-4 h-4 mr-2" />
            Export Dokumen per Pertemuan…
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled data-testid="export-v2-disabled">
            <FileText className="w-4 h-4 mr-2" />
            Export dokumen per pertemuan tersedia pada fase berikutnya.
          </DropdownMenuItem>
        )
      ) : (

        <>
          <DropdownMenuItem onClick={onExportCurrentTab}>
            <FileText className="w-4 h-4 mr-2" />
            Export Tab ke Word
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export Semua ke Word
          </DropdownMenuItem>
          {onExportPDF && (
            <DropdownMenuItem onClick={onExportPDF} disabled={isExportingPDF}>
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export ke PDF
                </>
              )}
            </DropdownMenuItem>
          )}
          {onExportSoalDocx && activeTab === 'soal' && (
            <DropdownMenuItem onClick={onExportSoalDocx} disabled={isExportingSoalDocx}>
              {isExportingSoalDocx ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating DOCX...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Export DOCX (Equation)
                </>
              )}
            </DropdownMenuItem>
          )}
        </>
      )}
      {onOpenPromptExport && (
        <>
          <div className="h-px bg-border my-1" />
          <DropdownMenuItem onClick={onOpenPromptExport}>
            <Sparkles className="w-4 h-4 mr-2" />
            Salin Prompt AI
          </DropdownMenuItem>
        </>
      )}
    </>
  );



  // Vertical card button: icon on top, short label below. Used on mobile (3-col grid)
  // and inline on desktop. Always show label so user knows what each button is.
  const cardBtn =
    'relative flex flex-col items-center justify-center gap-1 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold rounded-lg px-2 py-2 text-[11px] sm:text-xs w-full sm:w-auto sm:flex-row sm:gap-1.5 sm:px-3 sm:py-1.5 min-h-[58px] sm:min-h-0';

  type GenBtnProps = {
    onClick: () => void;
    loading: boolean;
    exists: boolean;
    icon: typeof PenTool;
    label: string;
    colorClass: string;
  };

  const GenBtn = ({ onClick, loading, exists, icon: Icon, label, colorClass }: GenBtnProps) => (
    <button
      onClick={onClick}
      disabled={loading || lockOther}
      title={lockTitle || (exists ? `Regenerate ${label}` : `Buat ${label}`)}
      aria-label={exists ? `Regenerate ${label}` : `Buat ${label}`}
      className={`${exists ? colorClass : 'bg-card text-foreground'} ${cardBtn} ${exists ? 'sm:pr-7' : ''} ${lockOther ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Regenerate badge — small refresh icon overlay when content exists */}
      {exists && !loading && (
        <span className="absolute top-1 right-1 sm:top-1/2 sm:right-1.5 sm:-translate-y-1/2 w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full bg-foreground/10 grid place-items-center">
          <RefreshCw className="w-2.5 h-2.5 sm:w-2 sm:h-2" />
        </span>
      )}

      {loading ? (
        <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
      ) : (
        <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
      )}
      <span className="leading-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex-none p-2 md:p-4 bg-card border-b-2 border-foreground shadow-sm z-30">
      {/* Generate buttons — 3-col card grid on mobile, flex on desktop */}
      {!isPlanningTab && !hideDocGenerate && (
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 pb-2 items-stretch sm:items-center">
        {modulData && onRegenerateModul && (
          <GenBtn
            onClick={onRegenerateModul}
            loading={false}
            exists={true}
            icon={Layout}
            label="Modul"
            colorClass="bg-doc-modul text-blue-700 border-blue-400"
          />
        )}

        <GenBtn
          onClick={lkpdData && onRegenerateLKPD ? onRegenerateLKPD : onGenerateLKPD}
          loading={loaders.lkpd}
          exists={!!lkpdData}
          icon={PenTool}
          label="LKPD"
          colorClass="bg-doc-lkpd text-accent border-accent"
        />

        <GenBtn
          onClick={asesmenData && onRegenerateAsesmen ? onRegenerateAsesmen : onGenerateAsesmen}
          loading={loaders.asesmen}
          exists={!!asesmenData}
          icon={ClipboardCheck}
          label="Asesmen"
          colorClass="bg-doc-asesmen text-destructive border-destructive"
        />

        <GenBtn
          onClick={bankSoalData && onRegenerateBankSoal ? onRegenerateBankSoal : onOpenSoalModal}
          loading={loaders.bankSoal}
          exists={!!bankSoalData}
          icon={FileQuestion}
          label="Soal"
          colorClass="bg-doc-soal text-purple-700 border-purple-400"
        />

        <GenBtn
          onClick={materiData && onRegenerateMateri ? onRegenerateMateri : onGenerateMateri}
          loading={loaders.materi}
          exists={!!materiData}
          icon={BookOpen}
          label="Materi"
          colorClass="bg-doc-materi text-amber-700 border-amber-400"
        />

        <GenBtn
          onClick={tindakLanjutData && onRegenerateTindakLanjut ? onRegenerateTindakLanjut : onGenerateTindakLanjut}
          loading={loaders.tindakLanjut}
          exists={!!tindakLanjutData}
          icon={HeartHandshake}
          label="Refleksi"
          colorClass="bg-doc-refleksi text-emerald-700 border-emerald-400"
        />
      </div>
      )}


      {/* Secondary controls row (Kop / Ganti / Hapus / Export) — shown above tabs until the canvas is truly wide */}
      {!isPlanningTab && (
        <div className="flex 2xl:hidden flex-wrap items-center justify-end gap-2 pb-2 pt-1">
          {quotaInfo && quotaInfo.isTrial && (
            <QuotaIndicator
              remaining={quotaInfo.remaining}
              limit={quotaInfo.limit}
              isTrial={quotaInfo.isTrial}
            />
          )}
          {onToggleLetterhead && onUploadLetterhead && onDeleteLetterhead && (
            <LetterheadControl
              letterheadUrl={letterheadUrl ?? null}
              isEnabled={isLetterheadEnabled ?? false}
              rawEnabled={rawLetterheadEnabled ?? false}
              hasLetterhead={hasLetterhead ?? false}
              isUploading={isUploadingLetterhead ?? false}
              isDeleting={isDeletingLetterhead ?? false}
              uploadError={letterheadUploadError}
              onToggle={onToggleLetterhead}
              onUpload={onUploadLetterhead}
              onDelete={onDeleteLetterhead}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-2 border-foreground/30 text-xs">
                <FileDown className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {renderExportItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Tabs row + inline secondary controls (only on 2xl+ where the right canvas has enough room) */}
      <div className="flex items-end gap-2 border-b-2 border-foreground pt-3 min-w-0">
        <div className="flex flex-1 min-w-0 overflow-x-auto overflow-y-hidden pb-1">
          {/* Saat V2 aktif, navigasi dokumen dipegang PertemuanResultNavigator
              sehingga tab dokumen legacy disembunyikan (hindari dua navigasi). */}
          {!v2Mode && (
            <>
              <TabButton id="modul" label="Modul" shortLabel="Modul" icon={Layout} exists={true} isActive={activeTab === 'modul'} onClick={() => setActiveTab('modul')} />
              <TabButton id="lkpd" label="LKPD" shortLabel="LKPD" icon={PenTool} exists={!!lkpdData} isActive={activeTab === 'lkpd'} onClick={() => setActiveTab('lkpd')} />
              <TabButton id="asesmen" label="Asesmen" shortLabel="Ases." icon={ClipboardCheck} exists={!!asesmenData} isActive={activeTab === 'asesmen'} onClick={() => setActiveTab('asesmen')} />
              <TabButton id="soal" label="Soal" shortLabel="Soal" icon={FileQuestion} exists={!!bankSoalData} isActive={activeTab === 'soal'} onClick={() => setActiveTab('soal')} />
              <TabButton id="materi" label="Materi" shortLabel="Materi" icon={BookOpen} exists={!!materiData} isActive={activeTab === 'materi'} onClick={() => setActiveTab('materi')} />
              <TabButton id="tindakLanjut" label="Refleksi" shortLabel="Reflek." icon={HeartHandshake} exists={!!tindakLanjutData} isActive={activeTab === 'tindakLanjut'} onClick={() => setActiveTab('tindakLanjut')} />
              <TabButton id="all" label="Semua" shortLabel="Semua" icon={Layers} exists={false} isActive={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            </>
          )}
          <TabButton id="perencanaan" label="Perencanaan" shortLabel="Rencana" icon={Calendar} exists={false} isActive={activeTab === 'perencanaan'} onClick={() => setActiveTab('perencanaan')} />
        </div>


        {!isPlanningTab && (
          <div className="hidden 2xl:flex items-center gap-2 pb-1 shrink-0">
            {quotaInfo && quotaInfo.isTrial && (
              <QuotaIndicator remaining={quotaInfo.remaining} limit={quotaInfo.limit} isTrial={quotaInfo.isTrial} />
            )}
            {onToggleLetterhead && onUploadLetterhead && onDeleteLetterhead && (
              <LetterheadControl
                letterheadUrl={letterheadUrl ?? null}
                isEnabled={isLetterheadEnabled ?? false}
                rawEnabled={rawLetterheadEnabled ?? false}
                hasLetterhead={hasLetterhead ?? false}
                isUploading={isUploadingLetterhead ?? false}
                isDeleting={isDeletingLetterhead ?? false}
                uploadError={letterheadUploadError}
                onToggle={onToggleLetterhead}
                onUpload={onUploadLetterhead}
                onDelete={onDeleteLetterhead}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-2 border-foreground/30 text-xs">
                  <FileDown className="w-4 h-4 mr-1" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {renderExportItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};
