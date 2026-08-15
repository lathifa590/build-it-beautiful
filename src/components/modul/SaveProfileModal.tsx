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

interface IdentifikasiData {
  namaPenyusun: string;
  nipPenyusun: string;
  sekolah: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  mataPelajaran: string;
  kelas: string;
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

                {/* Mata Pelajaran + Kelas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
                    <Label htmlFor="kelas" className="text-xs">
                      Kelas <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="kelas"
                      value={identifikasiData.kelas}
                      onChange={(e) => onIdentifikasiChange('kelas', e.target.value)}
                      placeholder="cth: VII (Tujuh)"
                      className="h-9 text-sm"
                    />
                  </div>
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
