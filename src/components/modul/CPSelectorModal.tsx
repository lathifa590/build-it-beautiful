import { useState, useEffect, useRef } from 'react';
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
import { resolveMapelCP, filterMapelByNama, FallbackInfo, MAPEL_LIST } from '@/lib/cp-mapel-mapping';
import { queryMasterCPDatabase } from '@/lib/cp-master-service';
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

function normalizeFaseCode(value?: string): string {
  return (value || '').trim().toUpperCase().replace(/^FASE\s*/i, '');
}

export function clearCPSessionCache() {
  cpSessionCache.clear();
}

export function extractElementsFromCPData(
  rawData: any,
  targetFilterNama?: string,
  targetFase?: string
): { elements: CPElemen[]; kelas: string } | null {
  if (!rawData?.mata_pelajaran || !Array.isArray(rawData.mata_pelajaran)) {
    return null;
  }

  const mpList: MapelData[] = rawData.mata_pelajaran;
  const filteredList = filterMapelByNama(mpList, targetFilterNama);
  const normTargetFase = normalizeFaseCode(targetFase);

  const elements: CPElemen[] = [];
  let resolvedKelas = '';

  for (const mp of filteredList) {
    const cpForFase = mp.capaian_per_fase || [];
    if (cpForFase.length === 0) continue;

    const cp = normTargetFase
      ? cpForFase.find((item) => {
          const itemFase = normalizeFaseCode(item.fase);
          if (itemFase === normTargetFase) return true;
          const tokens = (item.fase || '').toUpperCase().split(/[^A-Z]/).filter(Boolean);
          return tokens.includes(normTargetFase);
        })
      : cpForFase[0];

    if (!cp) continue;

    if (!resolvedKelas && cp.kelas) {
      resolvedKelas = cp.kelas;
    }
    if (cp.elemen) {
      for (const [nama, teks] of Object.entries(cp.elemen)) {
        elements.push({ nama, teks: teks as string });
      }
    }
  }

  return { elements, kelas: resolvedKelas };
}

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
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [allElements, setAllElements] = useState<CPElemen[]>([]);
  const [matchedSlug, setMatchedSlug] = useState<string | null>(null);
  const [kelas, setKelas] = useState<string>('');
  const [cpSource, setCpSource] = useState<'github' | 'cp032' | 'kbc_madrasah'>('github');
  const [fallbackInfo, setFallbackInfo] = useState<FallbackInfo | null>(null);
  const [activeDataSource, setActiveDataSource] = useState<string>('');
  const lastAutoKeyRef = useRef<string>('');

  const isSpecialUser = user?.email === SPECIAL_EMAIL;

  const getDefaultSource = (
    targetMapel: string,
    targetFase: string,
    targetKurikulum?: string
  ): 'github' | 'kbc_madrasah' => {
    const resolution = resolveMapelCP(targetMapel, targetFase);
    const isPaud =
      /\b(paud|tk|ra)\b/i.test(targetMapel) ||
      normalizeFaseCode(targetFase) === 'FONDASI';
    if (
      resolution?.isMadrasah ||
      targetKurikulum === 'kbc_madrasah' ||
      (targetKurikulum === 'kbc' && isPaud)
    ) {
      return 'kbc_madrasah';
    }
    return 'github';
  };

  // Single unified effect: set default source once per modal open/subject, then fetch without overriding manual toggles
  useEffect(() => {
    if (!open) {
      lastAutoKeyRef.current = '';
      setSelectedElements(new Set());
      setError(null);
      setFallbackInfo(null);
      setActiveDataSource('');
      return;
    }

    if (!mataPelajaran) return;

    const autoKey = `${mataPelajaran}|${fase}|${kurikulum ?? ''}`;
    if (lastAutoKeyRef.current !== autoKey) {
      lastAutoKeyRef.current = autoKey;
      const defaultSource = getDefaultSource(mataPelajaran, fase, kurikulum);
      if (defaultSource !== cpSource) {
        setCpSource(defaultSource);
        return;
      }
    }

    fetchCP(cpSource);
  }, [open, mataPelajaran, fase, kurikulum, cpSource]);

  const fetchCP = async (source: 'github' | 'cp032' | 'kbc_madrasah') => {
    setLoading(true);
    setError(null);
    setAllElements([]);
    setSelectedElements(new Set());
    setKelas('');

    const resolution = resolveMapelCP(mataPelajaran, fase);
    setMatchedSlug(resolution ? resolution.slug : null);
    setFallbackInfo(resolution?.fallbackInfo || null);

    const applyMasterResult = (
      masterResult: ReturnType<typeof queryMasterCPDatabase>
    ): boolean => {
      if (!masterResult || masterResult.elemen.length === 0) return false;
      setAllElements(masterResult.elemen);
      setKelas(masterResult.kelas);
      if (masterResult.isFallback && masterResult.fallbackInfo) {
        setFallbackInfo(masterResult.fallbackInfo);
      }
      setActiveDataSource('BSKAP No. 046/2025');
      return true;
    };

    const applyRemoteData = (
      rawData: any,
      sourceLabel: string,
      filterNama?: string
    ): boolean => {
      const extracted = extractElementsFromCPData(rawData, filterNama, fase);
      if (!extracted || extracted.elements.length === 0) {
        return false;
      }
      setKelas(extracted.kelas);
      setAllElements(extracted.elements);
      setActiveDataSource(sourceLabel);
      return true;
    };

    // 1. Default BSKAP No. 046/H/KR/2025 flow:
    //    - Local-only subjects (PAUD, SMK Kejuruan, Projek IPAS, Prakarya, Bahasa Jepang, SLB, Kesetaraan)
    //      use local master DB directly.
    //    - Mapped Kemdikbud & PAI 2026 subjects prioritize fetch-cp-data (CP-Kurmer-2025 / PAI_2026_URL),
    //      falling back to local synced master DB when offline or unavailable.
    if (source === 'github') {
      if (!resolution || resolution.isMasterOnly) {
        const masterResult = queryMasterCPDatabase(mataPelajaran, fase);
        if (!applyMasterResult(masterResult)) {
          setError(
            resolution
              ? `Tidak ada data CP untuk ${mataPelajaran} pada Fase ${fase}.`
              : `Mata pelajaran "${mataPelajaran}" tidak ditemukan dalam database CP resmi. Coba gunakan nama lengkap, misalnya "Matematika", "Bahasa Indonesia", "IPA", dll.`
          );
        }
        setLoading(false);
        return;
      }

      const normFase = normalizeFaseCode(fase) || fase;
      const cacheKey = `${resolution.slug}_${normFase}_${source}_${resolution.filterNama ?? ''}`;
      if (cpSessionCache.has(cacheKey)) {
        const cached = cpSessionCache.get(cacheKey);
        if (applyRemoteData(cached, 'BSKAP No. 046/2025', resolution.filterNama)) {
          setLoading(false);
          return;
        }
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-cp-data', {
          body: {
            slug: resolution.slug,
            fase,
            source: 'github',
            filterNama: resolution.filterNama,
          },
        });

        if (
          !fnError &&
          !data?.notFound &&
          !data?.error &&
          applyRemoteData(data?.data, 'BSKAP No. 046/2025', resolution.filterNama)
        ) {
          cpSessionCache.set(cacheKey, data.data);
          setLoading(false);
          return;
        }

        const fallbackMaster = queryMasterCPDatabase(mataPelajaran, fase);
        if (applyMasterResult(fallbackMaster)) {
          setLoading(false);
          return;
        }

        setError(
          data?.error ||
            `Tidak ada data CP untuk ${mataPelajaran} pada Fase ${fase}.`
        );
      } catch (err) {
        console.error('Error fetching CP:', err);
        const fallbackMaster = queryMasterCPDatabase(mataPelajaran, fase);
        if (!applyMasterResult(fallbackMaster)) {
          setError('Gagal mengambil data CP. Periksa koneksi internet Anda.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Explicit SK 032/2024 or KBC Madrasah source
    const sourceLabel = source === 'cp032' ? 'SK 032/2024' : 'Kemenag 2025';
    setActiveDataSource(sourceLabel);

    if (!resolution) {
      setError(
        `Mata pelajaran "${mataPelajaran}" tidak ditemukan dalam database CP resmi. Coba gunakan nama lengkap, misalnya "Matematika", "Bahasa Indonesia", "IPA", dll.`
      );
      setLoading(false);
      return;
    }

    const normFase = normalizeFaseCode(fase) || fase;
    const cacheKey = `${resolution.slug}_${normFase}_${source}_${resolution.filterNama ?? ''}`;
    if (cpSessionCache.has(cacheKey)) {
      const cached = cpSessionCache.get(cacheKey);
      if (applyRemoteData(cached, sourceLabel, resolution.filterNama)) {
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-cp-data', {
        body: {
          slug: resolution.slug,
          fase,
          source,
          filterNama: resolution.filterNama,
        },
      });

      if (fnError) throw fnError;

      if (data?.notFound || data?.error) {
        if (source === 'kbc_madrasah' && !resolution.isMadrasah && resolution.isMasterOnly) {
          const masterResult = queryMasterCPDatabase(mataPelajaran, fase);
          if (applyMasterResult(masterResult)) {
            setLoading(false);
            return;
          }
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      if (applyRemoteData(data?.data, sourceLabel, resolution.filterNama)) {
        cpSessionCache.set(cacheKey, data.data);
      } else {
        setError(`Tidak ada data CP untuk ${mataPelajaran} pada Fase ${fase}.`);
      }
    } catch (err) {
      console.error('Error fetching CP:', err);
      if (source === 'kbc_madrasah' && !resolution.isMadrasah && resolution.isMasterOnly) {
        const masterResult = queryMasterCPDatabase(mataPelajaran, fase);
        if (applyMasterResult(masterResult)) {
          setLoading(false);
          return;
        }
      }
      setError(
        source === 'cp032'
          ? 'Gagal mengambil data CP SK 032/2024. Sumber data sedang tidak tersedia, coba lagi nanti.'
          : 'Gagal mengambil data CP. Periksa koneksi internet Anda.'
      );
    } finally {
      setLoading(false);
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
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>
              {mataPelajaran && fase
                ? `${mataPelajaran} — Fase ${fase}${kelas ? ` (${kelas})` : ''}`
                : 'Isi Mata Pelajaran dan Fase terlebih dahulu'}
            </span>
            {activeDataSource && (
              <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {activeDataSource}
              </span>
            )}
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
            {(kurikulum === 'kbc' || kurikulum === 'kbc_madrasah') && (
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
