import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface StoreConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Dialog konfirmasi bergaya neobrutalism — pengganti confirm() native
 * di alur Toko Saya. Fokus trap sederhana: Escape menutup, klik overlay menutup.
 */
export const StoreConfirmDialog: React.FC<StoreConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-xl border-2 border-[#111] shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 shrink-0 rounded-lg border-2 border-[#111] flex items-center justify-center ${
                danger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-[#111] leading-snug">{title}</h3>
              <p className="text-sm font-semibold text-muted-foreground mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-bold border-2 border-[#111] rounded-md bg-[#f5f0e8] hover:bg-[#e8e0d0] transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-black text-white rounded-md border-2 border-[#111] shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] disabled:opacity-50 flex items-center gap-2 ${
                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#c04a1a] hover:bg-[#a83e15]'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
