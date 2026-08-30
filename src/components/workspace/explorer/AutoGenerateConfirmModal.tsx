import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, FileText, Layers } from 'lucide-react';

interface AutoGenerateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  missingMeetingsCount: number;
  autogenQuota: { used: number; limit: number; isCurrentUsed: boolean };
}

export const AutoGenerateConfirmModal: React.FC<AutoGenerateConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  missingMeetingsCount,
  autogenQuota,
}) => {
  const estimatedDocs = missingMeetingsCount * 5;
  const estimatedMinutes = Math.ceil((missingMeetingsCount * 15) / 60);
  const isQuotaFull = !autogenQuota.isCurrentUsed && autogenQuota.used >= autogenQuota.limit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Konfirmasi Auto-Generate
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Anda akan memulai proses pembuatan dokumen secara otomatis di latar belakang server.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Rincian Tugas</p>
              <p className="text-sm text-amber-700">Terdapat <span className="font-bold">{missingMeetingsCount} pertemuan</span> yang akan diproses. Total sekitar ~{estimatedDocs} dokumen akan digenerate.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Estimasi Waktu</p>
              <p className="text-sm text-amber-700">Proses ini akan memakan waktu sekitar <span className="font-bold">{estimatedMinutes} menit</span>. Anda boleh menutup aplikasi selama proses berjalan.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Jatah Workspace</p>
              {autogenQuota.isCurrentUsed ? (
                <p className="text-sm text-amber-700">
                  Workspace ini <strong>sudah menggunakan jatah</strong>. Melanjutkan proses tidak akan memotong sisa jatah Anda.
                </p>
              ) : (
                <p className="text-sm text-amber-700">
                  Aksi ini akan menggunakan 1 jatah Workspace Anda. Sisa Jatah Anda: <strong>{autogenQuota.limit - autogenQuota.used} / {autogenQuota.limit}</strong>.
                </p>
              )}
            </div>
          </div>
        </div>

        {isQuotaFull && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg mb-4 text-sm text-rose-700 font-medium">
            ?? Maaf, Anda telah mencapai batas maksimal ({autogenQuota.limit} Workspace) untuk fitur Auto-Generate. 
            Silakan hubungi admin untuk menambah jatah.
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Batalkan
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isQuotaFull}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            Lanjutkan Proses Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

