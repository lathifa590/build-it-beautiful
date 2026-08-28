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
import { Workspace } from '@/types/workspace';
import { toast } from 'sonner';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export const WorkspaceSettingsModal = ({ isOpen, onClose, workspace }: WorkspaceSettingsModalProps) => {
  const { updateWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jp_duration_minutes: workspace.jp_duration_minutes || 45,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        jp_duration_minutes: workspace.jp_duration_minutes || 45,
      });
    }
  }, [isOpen, workspace]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await updateWorkspace(workspace.id, formData);
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
      <DialogContent className="sm:max-w-[425px] border-2 border-foreground shadow-brutal">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pengaturan Workspace</DialogTitle>
            <DialogDescription>
              Ubah pengaturan untuk "{workspace.subject} - Kelas {workspace.grade}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              />
              <p className="text-xs text-muted-foreground mt-1">Digunakan untuk menghitung estimasi waktu pertemuan di Modul Ajar.</p>
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
    </Dialog>
  );
};
