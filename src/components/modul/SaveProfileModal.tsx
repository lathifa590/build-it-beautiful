import { Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface IdentifikasiData {
  namaPenyusun: string;
  nipPenyusun: string;
  sekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  mataPelajaran: string;
  fase: string;
  kelas: string;
  kurikulum?: 'merdeka' | 'kbc';
}

interface SaveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempProfileName: string;
  setTempProfileName: (name: string) => void;
  onSave: () => void;
  mode: 'create' | 'update';
  // Props for create mode - identification data
  identifikasiData?: IdentifikasiData;
  onIdentifikasiChange?: (field: keyof IdentifikasiData, value: string) => void;
}

const FASE_KELAS_MAP: Record<string, string[]> = {
  A: ['Kelas I', 'Kelas II'],
  B: ['Kelas III', 'Kelas IV'],
  C: ['Kelas V', 'Kelas VI'],
  D: ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  E: ['Kelas X'],
  F: ['Kelas XI', 'Kelas XII'],
};

export const SaveProfileModal = ({
  isOpen,
  onClose,
  tempProfileName,
  setTempProfileName,
  onSave,
  mode,
  identifikasiData,
  onIdentifikasiChange,
}: SaveProfileModalProps) => {
  const isCreateMode = mode === 'create';
  const kelasOptions = FASE_KELAS_MAP[identifikasiData?.fase || 'A'] || [];

  const handleFaseChange = (newFase: string) => {
    onIdentifikasiChange?.('fase', newFase);
    // Auto-pilih kelas pertama dari fase baru agar tidak kosong
    const firstKelas = (FASE_KELAS_MAP[newFase] || [])[0] || '';
    onIdentifikasiChange?.('kelas', firstKelas);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreateMode ? (
              <>
                <Plus className="w-5 h-5" /> Buat Profil Baru
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Simpan Perubahan
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Masukkan data identifikasi untuk profil baru. Data ini akan tersimpan dan dapat digunakan ulang.'
              : 'Simpan perubahan ke profil yang dipilih.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="profileName" className="font-semibold">
              Nama Profil <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profileName"
              value={tempProfileName}
              onChange={(e) => setTempProfileName(e.target.value)}
              placeholder="Nama profil (cth: IPA Kelas 7)"
              autoFocus
              disabled={!isCreateMode}
            />
          </div>

          {/* Identification fields - only show in create mode */}
          {isCreateMode && identifikasiData && onIdentifikasiChange && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  Data Identifikasi
                </h4>
                
                {/* Nama Penyusun + NIP */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="namaPenyusun" className="text-xs">
                      Nama Penyusun <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="namaPenyusun"
                      value={identifikasiData.namaPenyusun}
                      onChange={(e) => onIdentifikasiChange('namaPenyusun', e.target.value)}
                      placeholder="Nama guru"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nipPenyusun" className="text-xs">
                      NIP
                    </Label>
                    <Input
                      id="nipPenyusun"
                      value={identifikasiData.nipPenyusun}
                      onChange={(e) => onIdentifikasiChange('nipPenyusun', e.target.value)}
                      placeholder="NIP penyusun"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Nama Sekolah */}
                <div className="space-y-1.5 mb-3">
                  <Label htmlFor="sekolah" className="text-xs">
                    Nama Sekolah
                  </Label>
                  <Input
                    id="sekolah"
                    value={identifikasiData.sekolah}
                    onChange={(e) => onIdentifikasiChange('sekolah', e.target.value)}
                    placeholder="Nama sekolah"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Kepala Sekolah + NIP */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="kepalaSekolah" className="text-xs">
                      Kepala Sekolah
                    </Label>
                    <Input
                      id="kepalaSekolah"
                      value={identifikasiData.kepalaSekolah}
                      onChange={(e) => onIdentifikasiChange('kepalaSekolah', e.target.value)}
                      placeholder="Nama kepala sekolah"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nipKepalaSekolah" className="text-xs">
                      NIP Kepala Sekolah
                    </Label>
                    <Input
                      id="nipKepalaSekolah"
                      value={identifikasiData.nipKepalaSekolah}
                      onChange={(e) => onIdentifikasiChange('nipKepalaSekolah', e.target.value)}
                      placeholder="NIP kepala sekolah"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Mata Pelajaran */}
                <div className="space-y-1.5 mb-3">
                  <Label htmlFor="mataPelajaran" className="text-xs">
                    Mata Pelajaran <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mataPelajaran"
                    value={identifikasiData.mataPelajaran}
                    onChange={(e) => onIdentifikasiChange('mataPelajaran', e.target.value)}
                    placeholder="cth: IPA, Matematika"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Fase + Kelas (keduanya dropdown) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fase" className="text-xs">
                      Fase <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="fase"
                      value={identifikasiData.fase}
                      onChange={(e) => handleFaseChange(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F'].map((f) => (
                        <option key={f} value={f}>
                          Fase {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kelas" className="text-xs">
                      Kelas <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="kelas"
                      value={identifikasiData.kelas}
                      onChange={(e) => onIdentifikasiChange('kelas', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {kelasOptions.length === 0 && (
                        <option value="">-- Pilih Fase dulu --</option>
                      )}
                      {kelasOptions.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kurikulum */}
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <Label className="text-xs font-semibold">Pilihan Kurikulum <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={identifikasiData.kurikulum || 'merdeka'}
                    onValueChange={(val: 'merdeka' | 'kbc') => onIdentifikasiChange('kurikulum', val)}
                    className="flex flex-col gap-3 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merdeka" id="kurikulum-merdeka" />
                      <Label htmlFor="kurikulum-merdeka" className="text-sm font-normal cursor-pointer">
                        Kurikulum Merdeka (RPM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kbc" id="kurikulum-kbc" />
                      <Label htmlFor="kurikulum-kbc" className="text-sm font-normal cursor-pointer">
                        KBC (Kurikulum Berbasis Cinta - Kemenag)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSave}>
            {isCreateMode ? 'Simpan Profil' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
