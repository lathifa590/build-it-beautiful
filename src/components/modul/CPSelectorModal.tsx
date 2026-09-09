import { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, AlertCircle, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { findMapelSlug, resolveMapelCP, FallbackInfo, MAPEL_LIST } from '@/lib/cp-mapel-mapping';
import { useAuth } from '@/contexts/AuthContext';

interface CPSelectorModalProps {
  open: boolean;
  onClose: () => void;
  mataPelajaran: string;
  fase: string;
  onSelectCP: (cpText: string) => void;
  kurikulum?: string;
}

interface CPElemen {
  nama: string;
  teks: string;
}

interface CPData {
  fase: string;
  kelas: string;
  elemen: Record<string, string>;
}

interface MapelData {
  nama: string;
  capaian_per_fase: CPData[];
}

// Session cache
const cpSessionCache = new Map<string, any>();

const SPECIAL_EMAIL = 'goodteacherok1@gmail.com';

export const CPSelectorModal = ({
  open,
  onClose,
  mataPelajaran,
  fase,
  onSelectCP,
  kurikulum,
}: CPSelectorModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapelList, setMapelList] = useState<MapelData[]>([]);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [allElements, setAllElements] = useState<CPElemen[]>([]);
  const [matchedSlug, setMatchedSlug] = useState<string | null>(null);
  const [filterNama, setFilterNama] = useState<string | undefined>(undefined);
  const [kelas, setKelas] = useState<string>('');
  const [cpSource, setCpSource] = useState<'github' | 'cp032' | 'kbc_madrasah'>('github');
  const [fallbackInfo, setFallbackInfo] = useState<FallbackInfo | null>(null);

  // Compute effective source synchronously (avoids race condition with setCpSource)
  const getEffectiveSource = (): 'github' | 'cp032' | 'kbc_madrasah' => {
    const resolution = resolveMapelCP(mataPelajaran, fase);
    if (kurikulum === 'kbc' || kurikulum === 'kbc_madrasah' || resolution?.isMadrasah) {
      return 'kbc_madrasah';
    }
    return cpSource === 'kbc_madrasah' ? 'github' : cpSource;
  };

  const isSpecialUser = user?.email === SPECIAL_EMAIL;

  // Single unified effect: determine source then fetch (avoids race condition)
  useEffect(() => {
    if (open && mataPelajaran) {
      const effectiveSource = getEffectiveSource();
      // Sync state for UI display
      if (effectiveSource !== cpSource) {
        setCpSource(effectiveSource);
      }
      fetchCP(effectiveSource);
    }
    if (!open) {
      setSelectedElements(new Set());
      setError(null);
      setFallbackInfo(null);
    }
  }, [open, mataPelajaran, fase, kurikulum, cpSource]);

  const fetchCP = async (effectiveSource?: 'github' | 'cp032' | 'kbc_madrasah') => {
    const source = effectiveSource ?? cpSource;
    setLoading(true);
    setError(null);
    setAllElements([]);
    setMapelList([]);

    const resolution = resolveMapelCP(mataPelajaran, fase);
    setMatchedSlug(resolution ? resolution.slug : null);
    setFilterNama(resolution?.filterNama);
    setFallbackInfo(resolution?.fallbackInfo || null);

    if (!resolution) {
      setError(`Mata pelajaran "${mataPelajaran}" tidak ditemukan dalam database CP resmi. Coba gunakan nama lengkap, misalnya "Matematika", "Bahasa Indonesia", "IPA", dll.`);
      setLoading(false);
      return;
    }

    const slug = resolution.slug;

    // Check session cache
    const cacheKey = `${slug}_${fase}_${source}_${resolution.filterNama ?? ''}`;
    if (cpSessionCache.has(cacheKey)) {
      const cached = cpSessionCache.get(cacheKey);
      processData(cached);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-cp-data', {
        body: { slug, fase, source, filterNama: resolution.filterNama },
      });

      if (fnError) throw fnError;

      if (data?.notFound) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Cache it
      cpSessionCache.set(cacheKey, data.data);
      processData(data.data);
    } catch (err) {
      console.error('Error fetching CP:', err);
      setError(
        source === 'cp032'
          ? 'Gagal mengambil data CP SK 032/2024. Sumber data sedang tidak tersedia, coba lagi nanti.'
          : 'Gagal mengambil data CP. Periksa koneksi internet Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const processData = (rawData: any) => {
    if (!rawData?.mata_pelajaran) {
      setError('Format data CP tidak valid');
      return;
    }

    const mpList: MapelData[] = rawData.mata_pelajaran;
    setMapelList(mpList);

    // Filter by specific religion/subject if filterNama is set
    const filteredList = filterNama
      ? mpList.filter(mp => mp.nama.toLowerCase().includes(filterNama.toLowerCase()))
      : mpList;

    // Extract elements from matching mapel + fase
    const elements: CPElemen[] = [];
    for (const mp of filteredList) {
      const cpForFase = mp.capaian_per_fase;
      if (cpForFase && cpForFase.length > 0) {
        const cp = cpForFase[0];
        setKelas(cp.kelas || '');
        if (cp.elemen) {
          for (const [nama, teks] of Object.entries(cp.elemen)) {
            elements.push({ nama, teks: teks as string });
          }
        }
      }
    }

    setAllElements(elements);

    if (elements.length === 0) {
      setError(`Tidak ada data CP untuk ${mataPelajaran} pada Fase ${fase}.`);
    }
  };

  const toggleElement = (nama: string) => {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(nama)) {
        next.delete(nama);
      } else {
        next.add(nama);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedElements.size === allElements.length) {
      setSelectedElements(new Set());
    } else {
      setSelectedElements(new Set(allElements.map((e) => e.nama)));
    }
  };

  const handleApply = () => {
    const selected = allElements.filter((e) => selectedElements.has(e.nama));
    const cpText = selected
      .map((e) => `[${e.nama}]\n${e.teks}`)
      .join('\n\n');
    onSelectCP(cpText);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            {cpSource === 'kbc_madrasah' ? 'Cari CP Resmi Kemenag (Madrasah)' : 'Cari CP Resmi Kemdikbud'}
          </DialogTitle>
          <DialogDescription>
            {mataPelajaran && fase
              ? `${mataPelajaran} — Fase ${fase}${kelas ? ` (${kelas})` : ''}`
              : 'Isi Mata Pelajaran dan Fase terlebih dahulu'}
          </DialogDescription>
        </DialogHeader>

        {isSpecialUser && (
          <div className="flex items-center gap-2 px-1 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground mr-1">Sumber CP:</span>
            <Button
              variant={cpSource === 'github' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => setCpSource('github')}
            >
              CP Terbaru (2025)
            </Button>
            <Button
              variant={cpSource === 'cp032' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => setCpSource('cp032')}
            >
              CP SK 032/2024
            </Button>
            {kurikulum === 'kbc' && (
              <Button
                variant={cpSource === 'kbc_madrasah' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setCpSource('kbc_madrasah')}
              >
                CP Madrasah (2025)
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {fallbackInfo && !loading && !error && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-950 dark:text-blue-200">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <div className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-1.5 flex-wrap">
                  <span>Informasi Kurikulum Merdeka (Fase {fase})</span>
                  <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Terintegrasi dalam {fallbackInfo.parentMapelName}
                  </span>
                </div>
                <p className="text-blue-800/90 dark:text-blue-200/90">
                  {fallbackInfo.description}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">{error}</p>
                {!matchedSlug && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Mata Pelajaran yang tersedia:</p>
                    <div className="flex flex-wrap gap-1">
                      {MAPEL_LIST.slice(0, 15).map((m) => (
                        <span
                          key={m.slug}
                          className="text-xs bg-secondary px-2 py-0.5 rounded-full cursor-default"
                        >
                          {m.nama}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        +{MAPEL_LIST.length - 15} lainnya
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && allElements.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {allElements.length} elemen ditemukan
                </p>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedElements.size === allElements.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </Button>
              </div>

              {allElements.map((el) => (
                <label
                  key={el.nama}
                  className={`block p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedElements.has(el.nama)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedElements.has(el.nama)}
                      onCheckedChange={() => toggleElement(el.nama)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-primary">{el.nama}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-4">
                        {el.teks}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleApply}
            disabled={selectedElements.size === 0}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Gunakan CP Terpilih ({selectedElements.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
