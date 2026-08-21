import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { createWorkspace } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    phase: '',
    academic_year: '2024/2025',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.grade || !formData.phase || !formData.academic_year) return;
    
    setIsSubmitting(true);
    try {
      await createWorkspace(formData);
      onClose();
      // Reset form
      setFormData({
        subject: '',
        grade: '',
        phase: '',
        academic_year: '2024/2025',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-2 border-foreground shadow-brutal">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Workspace Baru</DialogTitle>
            <DialogDescription>
              Workspace memisahkan perencanaan untuk setiap mata pelajaran dan kelas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Mata Pelajaran</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Contoh: Matematika"
                className="border-2 border-foreground"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">Kelas</Label>
                <Input
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="Contoh: X"
                  className="border-2 border-foreground"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phase">Fase</Label>
                <Input
                  id="phase"
                  name="phase"
                  value={formData.phase}
                  onChange={handleChange}
                  placeholder="Contoh: E"
                  className="border-2 border-foreground"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="academic_year">Tahun Ajaran</Label>
              <Input
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="Contoh: 2024/2025"
                className="border-2 border-foreground"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-2 border-foreground">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="border-2 border-foreground">
              {isSubmitting ? 'Menyimpan...' : 'Buat Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
