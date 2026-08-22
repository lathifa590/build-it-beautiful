import { Save, Trash2, Plus, RotateCcw } from 'lucide-react';
import type { Profile } from '@/types/modul';

interface ProfileManagerProps {
  savedProfiles: Profile[];
  selectedProfile: string;
  onLoadProfile: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSaveProfile: () => void;
  onDeleteProfile: () => void;
  onCreateNewProfile: () => void;
  onResetForm?: () => void;
}

export const ProfileManager = ({
  savedProfiles,
  selectedProfile,
  onLoadProfile,
  onSaveProfile,
  onDeleteProfile,
  onCreateNewProfile,
  onResetForm,
}: ProfileManagerProps) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__create_new__') {
      onCreateNewProfile();
      // Reset dropdown to empty
      e.target.value = '';
    } else {
      onLoadProfile(e);
    }
  };

  return (
    <div className="bg-secondary p-4 rounded-xl border-2 border-muted-foreground/30 mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-extrabold uppercase text-muted-foreground">
          Profile Manager
        </span>
        {selectedProfile && (
          <button
            onClick={onDeleteProfile}
            className="text-destructive hover:text-destructive/80 transition-colors"
            title="Hapus profil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <select
          value={selectedProfile}
          onChange={handleSelectChange}
          className="flex-1 text-sm p-2 rounded-lg border-2 border-muted-foreground/30 focus:border-foreground outline-none bg-card"
        >
          <option value="">-- Pilih Profil --</option>
          <option value="__create_new__" className="font-semibold text-primary">
            + Buat Profil Baru
          </option>
          {savedProfiles.length > 0 && (
            <option disabled>──────────────</option>
          )}
          {savedProfiles.map((p, i) => (
            <option key={i} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={onSaveProfile}
          disabled={!selectedProfile}
          className={`px-3 rounded-lg transition-colors ${
            selectedProfile
              ? 'bg-foreground text-background hover:bg-foreground/80'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          title={selectedProfile ? 'Simpan perubahan' : 'Pilih profil terlebih dahulu'}
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
      {onResetForm && (
        <button
          onClick={onResetForm}
          className="w-full mt-2 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold bg-background border-2 border-muted-foreground/30 rounded-lg hover:border-foreground/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Bersihkan Isi Form
        </button>
      )}
    </div>
  );
};
