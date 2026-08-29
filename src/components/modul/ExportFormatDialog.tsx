import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { OutputFormat, OUTPUT_FORMAT_LABELS, OUTPUT_FORMAT_DESCRIPTIONS } from "@/types/export-format";
import { useState, useEffect } from "react";

interface ExportFormatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (format: OutputFormat) => void;
  defaultFormat?: OutputFormat;
}

export function ExportFormatDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  defaultFormat = 'tabel',
}: ExportFormatDialogProps) {
  // Try to load from localStorage, otherwise use default
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(defaultFormat);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('modulajar_export_format') as OutputFormat;
      if (saved && Object.keys(OUTPUT_FORMAT_LABELS).includes(saved)) {
        setSelectedFormat(saved);
      } else {
        setSelectedFormat(defaultFormat);
      }
    }
  }, [isOpen, defaultFormat]);

  const handleConfirm = () => {
    localStorage.setItem('modulajar_export_format', selectedFormat);
    onConfirm(selectedFormat);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pilih Format Dokumen</DialogTitle>
          <DialogDescription>
            Pilih bagaimana Modul Ajar Anda akan disajikan. Konten utama tetap sama, hanya tampilannya yang berbeda.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup 
            value={selectedFormat} 
            onValueChange={(val) => setSelectedFormat(val as OutputFormat)}
            className="flex flex-col space-y-3"
          >
            {(Object.keys(OUTPUT_FORMAT_LABELS) as OutputFormat[]).map((format) => (
              <div key={format} className="flex items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedFormat(format)}>
                <RadioGroupItem value={format} id={`format-${format}`} className="mt-1" />
                <Label htmlFor={`format-${format}`} className="flex flex-col cursor-pointer">
                  <span className="font-semibold text-slate-900">{OUTPUT_FORMAT_LABELS[format]}</span>
                  <span className="font-normal text-slate-500 text-sm">{OUTPUT_FORMAT_DESCRIPTIONS[format]}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            Generate & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
