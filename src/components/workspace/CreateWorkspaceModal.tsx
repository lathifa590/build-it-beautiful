import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    jp_duration_minutes: 45,
  });

  // Auto-select first profile if none is selected
  React.useEffect(() => {
    if (cloudProfiles.length > 0 && !formData.profile_id) {
      const profile = cloudProfiles[0];
      setFormData(prev => ({ 
        ...prev, 
        profile_id: profile.id,
        subject: profile.data?.mataPelajaran || prev.subject,
        grade: profile.data?.kelas || prev.grade,
        phase: profile.data?.fase || prev.phase,
      }));
    }
  }, [cloudProfiles, formData.profile_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = e.target.value;
    const profile = cloudProfiles.find(p => p.id === profileId);
    
    setFormData(prev => ({
      ...prev,
      profile_id: profileId,
      subject: profile?.data?.mataPelajaran || prev.subject,
      grade: profile?.data?.kelas || prev.grade,
      phase: profile?.data?.fase || prev.phase,
    }));
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
        jp_duration_minutes: 45,
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
            <div className="field-group">
              <label htmlFor="subject">Mata Pelajaran</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Contoh: Matematika"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label htmlFor="grade">Kelas</label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="Contoh: X"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="phase">Fase</label>
                <input
                  type="text"
                  id="phase"
                  name="phase"
                  value={formData.phase}
                  onChange={handleChange}
                  placeholder="Contoh: E"
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="academic_year">Tahun Ajaran</label>
              <input
                type="text"
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="Contoh: 2024/2025"
                required
              />
            </div>

            {cloudProfiles.length > 0 ? (
              <div className="field-group">
                <label htmlFor="profile_id">Pilih Profil Guru</label>
                <select
                  id="profile_id"
                  name="profile_id"
                  value={formData.profile_id}
                  onChange={handleProfileChange}
                  required
                >
                  <option value="" disabled>-- Pilih Profil --</option>
                  {cloudProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.data?.sekolah || 'Tanpa Sekolah'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Belum Ada Profil Guru!</span> Anda bisa mengosongkannya, namun Modul Ajar nantinya akan memiliki data kosong di identitas. Sebaiknya <a href="/app/profile" className="underline font-bold">isi Profil Guru dulu</a>.
                </div>
              </div>
            )}
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
              disabled={isSubmitting || (cloudProfiles.length > 0 && !formData.profile_id)}
            >
              {isSubmitting ? 'Menyimpan...' : 'Buat Workspace'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
