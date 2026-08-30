import { Settings, X, HelpCircle, Image, BookOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SoalConfig, SoalTypeConfig } from '@/types/modul';
import { soalTypesOptions, DEFAULT_SOAL_TYPE_CONFIG } from '@/lib/constants';

const SOAL_TYPE_INFO: Record<string, string> = {
  'Pilihan Ganda': 'Satu stem dengan 4-5 pilihan (A-D untuk SD/SMP, A-E untuk SMA). Hanya 1 jawaban benar.',
  'PG Kategori Benar/Salah': 'Stimulus + beberapa pernyataan, masing-masing dinilai Benar atau Salah.',
  'PG Multiple Choice Multiple Answer': 'Stimulus + beberapa pernyataan, bisa lebih dari 1 jawaban benar (checkbox).',
  'Menjodohkan': 'Mencocokkan premis (bernomor) dengan respon (berhuruf).',
  'Isian Singkat': 'Stem dengan bagian kosong yang harus diisi 1-3 kata.',
  'Uraian': 'Pertanyaan terbuka yang membutuhkan penjelasan lengkap.',
};

const LEVEL_OPTIONS = [
  { value: 'Dominan LOTS (C1-C3)', label: 'Mudah (Mengingat & Memahami)', description: '70% soal LOTS (C1-C3), 30% HOTS (C4-C6)' },
  { value: 'Seimbang (LOTS & HOTS)', label: 'Sedang (Campuran)', description: '50% soal LOTS, 50% soal HOTS' },
  { value: 'Dominan HOTS (C4-C6)', label: 'Sulit (Menganalisis & Mencipta)', description: '30% soal LOTS, 70% HOTS (C4-C6)' },
];

const MAX_TOTAL = 25;

interface SoalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  soalConfig: SoalConfig;
  setSoalConfig: React.Dispatch<React.SetStateAction<SoalConfig>>;
  onGenerate: () => void;
  actionLabel?: string;
}

export const SoalConfigModal = ({
  isOpen,
  onClose,
  soalConfig,
  setSoalConfig,
  onGenerate,
  actionLabel = 'Generate Bank Soal',
}: SoalConfigModalProps) => {
  if (!isOpen) return null;

  const totalSoal = Object.values(soalConfig.typeConfigs).reduce((a, b) => a + b.quantity, 0);
  const isOverLimit = totalSoal > MAX_TOTAL;
  const isEmpty = totalSoal === 0;

  const getConfig = (type: string): SoalTypeConfig => {
    return soalConfig.typeConfigs[type] || { ...DEFAULT_SOAL_TYPE_CONFIG };
  };

  const updateTypeConfig = (type: string, updates: Partial<SoalTypeConfig>) => {
    setSoalConfig((prev) => ({
      ...prev,
      typeConfigs: {
        ...prev.typeConfigs,
        [type]: { ...getConfig(type), ...updates },
      },
    }));
  };

  const handleToggleType = (type: string, checked: boolean) => {
    if (checked) {
      updateTypeConfig(type, { quantity: 3 });
    } else {
      updateTypeConfig(type, { quantity: 0, useStimulus: false, stimulusCount: 0, useImages: false, imageCount: 0 });
    }
  };

  const handleQuantityChange = (type: string, value: number) => {
    const validValue = isNaN(value) ? 0 : value;
    const clamped = Math.max(1, Math.min(MAX_TOTAL, validValue));
    const cfg = getConfig(type);
    // Auto-adjust stimulus count
    const newStimulusCount = cfg.useStimulus ? Math.max(1, Math.ceil(clamped / 5)) : cfg.stimulusCount;
    updateTypeConfig(type, { quantity: clamped, stimulusCount: newStimulusCount });
  };

  const inputStyle =
    'w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all bg-card font-medium placeholder-muted-foreground';
  const labelStyle = 'text-sm font-bold text-foreground mb-1 block';

  const selectedLevel = LEVEL_OPTIONS.find((l) => l.value === soalConfig.level);

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card w-full max-w-lg p-6 rounded-xl border border-border shadow-lg m-4 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
            <h3 className="text-xl font-extrabold flex gap-2">
              <Settings /> Konfigurasi Bank Soal
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X />
            </button>
          </div>

          <div className="space-y-5">
            {/* Tingkat Kesulitan */}
            <div>
              <label className={labelStyle}>Tingkat Kesulitan Soal</label>
              <select
                value={soalConfig.level}
                onChange={(e) => setSoalConfig({ ...soalConfig, level: e.target.value })}
                className={inputStyle}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              {selectedLevel && (
                <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-2 rounded">
                  📊 {selectedLevel.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                LOTS: Mengingat (C1), Memahami (C2), Menerapkan (C3) | HOTS: Menganalisis (C4), Mengevaluasi (C5), Mencipta (C6)
              </p>
            </div>

            {/* Tipe Soal + Jumlah + Sub-opsi Per Tipe */}
            <div>
              <label className={labelStyle}>Tipe & Jumlah Soal</label>
              <div className="flex flex-col gap-2 mt-2">
                {soalTypesOptions.map((t) => {
                  const cfg = getConfig(t);
                  const isActive = cfg.quantity > 0;
                  return (
                    <div key={t} className={`rounded-lg border transition-all ${isActive ? 'border-primary/40 bg-primary/5' : 'border-muted-foreground/20 bg-card'}`}>
                      {/* Main row */}
                      <div className="flex items-center gap-3 p-3 group">
                        <Checkbox
                          checked={isActive}
                          onCheckedChange={(checked) => handleToggleType(t, !!checked)}
                        />
                        <span className={`font-medium flex-1 text-sm leading-tight pr-2 ${!isActive ? 'text-muted-foreground' : ''}`}>
                          {t}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{SOAL_TYPE_INFO[t]}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="w-20 shrink-0">
                          <Input
                            type="number"
                            min={1}
                            max={MAX_TOTAL}
                            value={isActive ? cfg.quantity : ''}
                            onChange={(e) => handleQuantityChange(t, parseInt(e.target.value, 10))}
                            disabled={!isActive}
                            className="w-full h-9 text-center text-sm !border-2"
                            placeholder="-"
                          />
                        </div>
                      </div>

                      {/* Sub-options (stimulus & image) - only when active */}
                      {isActive && (
                        <div className="px-3 pb-3 pt-0 ml-7 space-y-2 border-t border-muted-foreground/10">
                          {/* Stimulus toggle */}
                          <div className="flex items-center gap-2 pt-2">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium flex-1">Stimulus (Bacaan)</span>
                            <Switch
                              checked={cfg.useStimulus}
                              onCheckedChange={(checked) => {
                                const stimCount = checked ? Math.max(1, Math.ceil(cfg.quantity / 5)) : 0;
                                updateTypeConfig(t, { useStimulus: checked, stimulusCount: stimCount });
                              }}
                            />
                            {cfg.useStimulus && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Jml:</span>
                                <div className="w-14">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, cfg.quantity)}
                                    value={cfg.stimulusCount}
                                    onChange={(e) => updateTypeConfig(t, { stimulusCount: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full h-7 text-center text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Image toggle */}
                          <div className="flex items-center gap-2">
                            <Image className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium flex-1">Gambar Ilustrasi</span>
                            <Switch
                              checked={cfg.useImages}
                              onCheckedChange={(checked) => {
                                const imgCount = checked ? 1 : 0;
                                updateTypeConfig(t, { useImages: checked, imageCount: imgCount });
                              }}
                            />
                            {cfg.useImages && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Jml:</span>
                                <div className="w-14">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, cfg.stimulusCount || cfg.quantity)}
                                    value={cfg.imageCount}
                                    onChange={(e) => updateTypeConfig(t, { imageCount: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full h-7 text-center text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total indicator */}
              <div className={`mt-3 p-2 rounded-lg text-sm font-bold flex justify-between items-center ${isOverLimit ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-secondary/50 text-foreground'}`}>
                <span>Total Soal:</span>
                <span>{totalSoal} / {MAX_TOTAL}</span>
              </div>
              {isOverLimit && (
                <p className="text-xs text-destructive mt-1">⚠️ Total soal melebihi batas maksimal {MAX_TOTAL}. Kurangi jumlah soal.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={onClose}>Batal</Button>
            <Button
              onClick={onGenerate}
              className="shadow-sm"
              disabled={isEmpty || isOverLimit}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
