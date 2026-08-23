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
import { useTeacherProfiles } from '@/hooks/useTeacherProfiles';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { createWorkspace } = useWorkspace();
  const { data: cloudProfiles = [] } = useTeacherProfiles();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    phase: '',
    academic_year: '2024/2025',
    profile_id: '',
  });

  // Auto-select first profile if none is selected
  React.useEffect(() => {
    if (cloudProfiles.length > 0 && !formData.profile_id) {
      setFormData(prev => ({ ...prev, profile_id: cloudProfiles[0].id }));
    }
  }, [cloudProfiles, formData.profile_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.grade || !formData.phase || !formData.academic_year) return;
    if (cloudProfiles.length > 0 && !formData.profile_id) return;
    
    setIsSubmitting(true);
    try {
      const { profile_id, ...workspaceData } = formData;
      const newWs = await createWorkspace(workspaceData);
      
      if (newWs && profile_id) {
        localStorage.setItem(`workspace_profile_${newWs.id}`, profile_id);
      }

      onClose();
      // Reset form
      setFormData({
        subject: '',
        grade: '',
        phase: '',
        academic_year: '2024/2025',
        profile_id: cloudProfiles.length > 0 ? cloudProfiles[0].id : '',
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
            
            <div className="grid gap-2 border-t-2 border-dashed border-foreground/20 pt-4 mt-2">
              <Label htmlFor="profile_id">Profil Guru (Identitas Modul)</Label>
              {cloudProfiles.length === 0 ? (
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Profil belum tersedia.</p>
                    <p className="opacity-90">Bapak/Ibu harus membuat profil (Identitas Guru & Sekolah) terlebih dahulu di menu utama.</p>
                  </div>
                </div>
              ) : (
                <select
                  id="profile_id"
                  name="profile_id"
                  value={formData.profile_id}
                  onChange={(e: any) => handleChange(e)}
                  className="w-full p-2.5 border-2 border-foreground rounded-lg focus:outline-none focus:shadow-brutal-sm transition-all bg-card font-medium"
                  required
                >
                  <option value="" disabled>Pilih profil guru...</option>
                  {cloudProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.data?.namaPenyusun || 'Tanpa Nama'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-2 border-foreground">
              Batal
            </Button>
            {cloudProfiles.length === 0 ? (
              <Button type="button" onClick={() => { onClose(); navigate('/app'); }} className="border-2 border-foreground bg-primary text-primary-foreground hover:bg-primary/90">
                Buat Profil Sekarang
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="border-2 border-foreground">
                {isSubmitting ? 'Menyimpan...' : 'Buat Workspace'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
