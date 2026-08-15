import { useState, useRef } from 'react';
import { ImageIcon, Upload, Trash2, Loader2, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface LetterheadControlProps {
  letterheadUrl: string | null;
  isEnabled: boolean;
  rawEnabled: boolean;
  hasLetterhead: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  uploadError?: string;
  onToggle: (enabled: boolean) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

export const LetterheadControl = ({
  letterheadUrl,
  isEnabled,
  rawEnabled,
  hasLetterhead,
  isUploading,
  isDeleting,
  uploadError,
  onToggle,
  onUpload,
  onDelete,
}: LetterheadControlProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);

    // Validate type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLocalError('Format tidak didukung. Gunakan JPEG atau PNG.');
      return;
    }

    // Validate size (500KB)
    if (file.size > 500 * 1024) {
      setLocalError('Ukuran file maksimal 500KB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
    setShowUploadDialog(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleCloseDialog = () => {
    setShowUploadDialog(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setLocalError(null);
  };

  const handleDelete = () => {
    if (confirm('Yakin ingin menghapus kop sekolah?')) {
      onDelete();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle */}
      <div className="flex items-center gap-2 bg-card border-2 border-foreground/30 rounded-lg px-3 py-1.5">
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium hidden sm:inline">Kop</span>
        <Switch
          checked={rawEnabled && hasLetterhead}
          onCheckedChange={onToggle}
          disabled={!hasLetterhead}
          className="scale-90"
        />
        
        {/* Info Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-0.5 text-muted-foreground hover:text-foreground">
              <Info className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">Spesifikasi Kop Sekolah:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Format: JPEG atau PNG</li>
                <li>• Lebar: ~794px (lebar A4)</li>
                <li>• Tinggi: maks. 150px (~2-3 cm)</li>
                <li>• Ukuran file: maks. 500KB</li>
                <li>• Orientasi: Landscape</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Kop akan muncul di atas dokumen, menggantikan judul standar.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Upload Button */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs border-2 border-foreground/30"
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span className="hidden sm:inline ml-1">
              {hasLetterhead ? 'Ganti' : 'Upload'}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Kop Sekolah</DialogTitle>
            <DialogDescription>
              Gambar landscape, JPEG/PNG, maks. 500KB. Lebar ideal ~794px.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Letterhead Preview */}
            {letterheadUrl && !previewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Kop saat ini:</p>
                <img
                  src={letterheadUrl}
                  alt="Current letterhead"
                  className="w-full border rounded-lg"
                />
              </div>
            )}

            {/* New Preview */}
            {previewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <img
                  src={previewUrl}
                  alt="New letterhead preview"
                  className="w-full border rounded-lg"
                />
              </div>
            )}

            {/* Error */}
            {(localError || uploadError) && (
              <p className="text-sm text-destructive">{localError || uploadError}</p>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Pilih Gambar
            </Button>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengupload...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Button (only if has letterhead) */}
      {hasLetterhead && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </Button>
      )}
    </div>
  );
};
