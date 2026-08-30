import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Workspace } from '@/types/workspace';
import { toast } from 'sonner';
import { modelOptions, metodeOptions, DEFAULT_SOAL_TYPE_CONFIG } from '@/lib/constants';
import { Sparkles, Settings2, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SoalConfigModal } from '@/components/modul/SoalConfigModal';
import type { SoalConfig } from '@/types/modul';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export const WorkspaceSettingsModal = ({ isOpen, onClose, workspace }: WorkspaceSettingsModalProps) => {
  const { updateWorkspace } = useWorkspace();
  const { user, isAdmin } = useAuth();
  
  const isSuperUser = isAdmin || user?.email === 'jagofeed@gmail.com';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jp_duration_minutes: workspace.jp_duration_minutes || 45,
  });

  const [genSettings, setGenSettings] = useState<{
    modelPembelajaran: string;
    metodePembelajaran: string[];
    soalConfig: SoalConfig;
  }>({
    modelPembelajaran: 'AI Auto-Select',
    metodePembelajaran: ['AI Auto-Select'],
    soalConfig: { level: 'Dominan LOTS (C1-C3)', typeConfigs: DEFAULT_SOAL_TYPE_CONFIG },
  });

  const [showSoalConfig, setShowSoalConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        jp_duration_minutes: workspace.jp_duration_minutes || 45,
      });
      setGenSettings({
        modelPembelajaran: workspace.generation_settings?.modelPembelajaran || 'AI Auto-Select',
        metodePembelajaran: workspace.generation_settings?.metodePembelajaran && workspace.generation_settings.metodePembelajaran.length > 0 
          ? workspace.generation_settings.metodePembelajaran 
          : ['AI Auto-Select'],
        soalConfig: workspace.generation_settings?.soalConfig || { level: 'Dominan LOTS (C1-C3)', typeConfigs: DEFAULT_SOAL_TYPE_CONFIG },
      });
    }
  }, [isOpen, workspace]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };
  
  const handleGenSettingsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGenSettings({ ...genSettings, [e.target.name]: e.target.value });
  };

  const toggleMetode = (opt: string) => {
    setGenSettings(prev => {
      if (opt === 'AI Auto-Select') {
        return { ...prev, metodePembelajaran: ['AI Auto-Select'] };
      }
      
      let newMetode = [...prev.metodePembelajaran];
      if (newMetode.includes('AI Auto-Select')) {
        newMetode = [];
      }
      
      if (newMetode.includes(opt)) {
        newMetode = newMetode.filter(m => m !== opt);
      } else {
        newMetode.push(opt);
      }
      
      if (newMetode.length === 0) {
        newMetode = ['AI Auto-Select'];
      }
      
      return { ...prev, metodePembelajaran: newMetode };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await updateWorkspace(workspace.id, {
        ...formData,
        generation_settings: {
          ...workspace.generation_settings,
          ...genSettings
        }
      });
      if (success) {
        toast.success('Pengaturan Workspace berhasil disimpan.');
        onClose();
      } else {
        toast.error('Gagal menyimpan pengaturan Workspace.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan Workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] border-2 border-foreground shadow-brutal max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pengaturan Workspace</DialogTitle>
            <DialogDescription>
              Ubah pengaturan untuk "{workspace.subject} - Kelas {workspace.grade}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="field-group">
              <label htmlFor="jp_duration_minutes">Durasi 1 JP (Menit)</label>
              <input
                type="number"
                id="jp_duration_minutes"
                name="jp_duration_minutes"
                value={formData.jp_duration_minutes}
                onChange={handleChange}
                placeholder="Contoh: 45"
                min="10"
                max="120"
                required
                className="input-field"
              />
              <p className="text-xs text-muted-foreground mt-1">Digunakan untuk menghitung estimasi waktu pertemuan di Modul Ajar.</p>
            </div>
            
            <div className="border-t-2 border-dashed border-muted-foreground/30 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Pengaturan Global Modul Ajar</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Pilihan di bawah ini akan digunakan sebagai pengaturan <i>default</i> untuk setiap pertemuan baru di dalam Workspace ini.
              </p>
              
              <div className="space-y-4">
                <div className="field-group">
                  <label className="text-sm font-bold flex items-center gap-1.5">Model Pembelajaran</label>
                  <select
                    name="modelPembelajaran"
                    value={genSettings.modelPembelajaran}
                    onChange={handleGenSettingsChange}
                    className="input-field cursor-pointer"
                  >
                    <option value="AI Auto-Select">✨ AI Auto-Select (Biarkan AI yang memilih)</option>
                    {modelOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="text-sm font-bold flex items-center gap-1.5">Metode Pembelajaran</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <label
                      className={`cursor-pointer px-2.5 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        genSettings.metodePembelajaran.includes('AI Auto-Select')
                          ? 'bg-purple-100 text-purple-800 border-purple-400'
                          : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={genSettings.metodePembelajaran.includes('AI Auto-Select')}
                        onChange={() => toggleMetode('AI Auto-Select')}
                      />
                      <Sparkles className="w-3 h-3" /> AI Auto-Select
                    </label>
                    {metodeOptions.map((opt) => (
                      <label
                        key={opt}
                        className={`cursor-pointer px-2.5 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-all ${
                          genSettings.metodePembelajaran.includes(opt)
                            ? 'bg-primary text-primary-foreground border-foreground'
                            : 'bg-card text-foreground border-muted-foreground/30 hover:border-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={genSettings.metodePembelajaran.includes(opt)}
                          onChange={() => toggleMetode(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="text-sm font-bold flex items-center gap-1.5">Konfigurasi Soal / Asesmen</label>
                  <div className="mt-2 bg-secondary/50 border border-muted p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileQuestion className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Level: {genSettings.soalConfig.level}</p>
                        <p className="text-xs text-muted-foreground">
                          {Object.values(genSettings.soalConfig.typeConfigs).reduce((sum, t) => sum + (t.quantity || 0), 0)} Soal (
                          {Object.entries(genSettings.soalConfig.typeConfigs).filter(([_, t]) => t.quantity > 0).map(([k, _]) => k).join(', ')}
                          )
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowSoalConfig(true)}>
                      Atur Konfigurasi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>

      {showSoalConfig && (
        <SoalConfigModal
          isOpen={showSoalConfig}
          onClose={() => setShowSoalConfig(false)}
          soalConfig={genSettings.soalConfig}
          setSoalConfig={(newCfg) => {
            const nextCfg = typeof newCfg === 'function' ? newCfg(genSettings.soalConfig) : newCfg;
            setGenSettings({ ...genSettings, soalConfig: nextCfg });
          }}
          onGenerate={() => setShowSoalConfig(false)}
          actionLabel="Terapkan"
        />
      )}
    </Dialog>
  );
};
