import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { schoolApi } from '@/lib/school-api';
import { Loader2, School as SchoolIcon, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SchoolGateProps {
  children: React.ReactNode;
  requiredRole?: 'waka' | 'kepsek' | 'admin';
}

/**
 * Panel "Akses Terbatas" untuk aturan Deploy Terbatas Mode Sekolah
 * (hanya Admin & akun pilot). Dipakai oleh SchoolGate maupun halaman lain.
 */
export const SchoolFeatureRestricted: React.FC = () => (
  <div className="max-w-xl mx-auto my-12 p-8 border-2 border-dashed rounded-xl bg-card text-center space-y-4 shadow-sm">
    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h2 className="text-xl font-bold text-foreground">Akses Terbatas — Pilot Mode Sekolah</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">
      Fitur ModulAjar Sekolah saat ini berada dalam tahap pengujian terbatas khusus untuk administrator dan akun pilot. Fitur ini akan segera dibuka untuk seluruh sekolah secara bertahap.
    </p>
    <Button variant="outline" onClick={() => window.history.back()}>
      Kembali ke Halaman Sebelumnya
    </Button>
  </div>
);

export const SchoolGate: React.FC<SchoolGateProps> = ({ children, requiredRole }) => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const {
    school,
    schoolMember,
    isLoading: schoolLoading,
    isSchoolActive,
    isPending,
    isWaka,
    isKepsek,
    isFeatureAllowed,
    joinSchool,
  } = useSchool();

  const [npsnInput, setNpsnInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading || schoolLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat data sekolah...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 1. Cek Aturan Deploy Terbatas (hanya Admin & jagofeed@gmail.com)
  if (!isFeatureAllowed) {
    return <Navigate to="/app" replace />;
  }

  // 2. Jika user berstatus Pending
  if (isPending) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 border rounded-xl bg-card text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Permintaan Bergabung Menunggu Persetujuan</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Permintaan Anda untuk bergabung ke sekolah sedang menunggu verifikasi dan persetujuan dari Waka Kurikulum atau Administrator sekolah Anda.
        </p>
        <div className="pt-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Cek Status Terbaru
          </Button>
        </div>
      </div>
    );
  }

  // 3. Jika belum terdaftar di sekolah manapun
  if (!isSchoolActive) {
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [joinMode, setJoinMode] = useState<'code' | 'npsn'>('code');

    const handleJoinByCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteCodeInput.trim()) {
        toast.error('Masukkan kode undangan sekolah');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await schoolApi.joinSchoolByCode(inviteCodeInput.trim());
        if (res.success) {
          toast.success(res.message);
          window.location.reload();
        } else {
          toast.error(res.message);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Gagal bergabung dengan kode undangan');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleJoinByNpsn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!npsnInput.trim()) {
        toast.error('Masukkan nomor NPSN sekolah');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await joinSchool(npsnInput.trim());
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Gagal mengajukan permohonan');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="max-w-lg mx-auto my-12 p-8 border rounded-xl bg-card text-center space-y-5 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
          <SchoolIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Gabung ke Sekolah Anda</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sinkronkan kalender pendidikan dan berkolaborasi bersama dewan guru di sekolah Anda.
          </p>
        </div>

        <div className="flex justify-center border-b pb-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setJoinMode('code')}
            className={`pb-1 transition-all ${
              joinMode === 'code'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kode Undangan (Langsung Aktif)
          </button>
          <button
            type="button"
            onClick={() => setJoinMode('npsn')}
            className={`pb-1 transition-all ${
              joinMode === 'npsn'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ajukan via NPSN
          </button>
        </div>

        {joinMode === 'code' ? (
          <form onSubmit={handleJoinByCode} className="space-y-3 text-left">
            <label className="text-xs font-semibold text-muted-foreground">
              Kode Undangan Rahasia (Dibagikan oleh Waka Kurikulum)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: SCH-A1B2C3"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                className="font-mono uppercase font-bold tracking-wider"
              />
              <Button type="submit" disabled={isSubmitting || !inviteCodeInput.trim()} className="shrink-0 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Masuk
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              💡 Bergabung dengan kode rahasia akan langsung mengaktifkan status keanggotaan Anda tanpa menunggu antrean persetujuan.
            </p>
          </form>
        ) : (
          <form onSubmit={handleJoinByNpsn} className="space-y-3 text-left">
            <label className="text-xs font-semibold text-muted-foreground">Nomor Pokok Sekolah Nasional (NPSN)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: 20501234"
                value={npsnInput}
                onChange={(e) => setNpsnInput(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting} className="shrink-0 gap-1.5">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Ajukan
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pengajuan via NPSN memerlukan persetujuan manual oleh Waka Kurikulum sekolah Anda.
            </p>
          </form>
        )}
      </div>
    );
  }

  // 4. Role Guard jika route membutuhkan peran khusus (misal Waka)
  if (requiredRole === 'waka' && !isWaka && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border rounded-xl bg-card text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-bold text-base">Halaman Khusus Waka Kurikulum</h3>
        <p className="text-xs text-muted-foreground">
          Pengelolaan Kalender Pendidikan sekolah hanya dapat diakses oleh Waka Kurikulum atau Admin sekolah.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
