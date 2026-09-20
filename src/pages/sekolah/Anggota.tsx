import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type { SchoolMember } from '@/types/school';
import {
  Users,
  UserPlus,
  Mail,
  Share2,
  Trash2,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SekolahAnggotaPage() {
  return (
    <SchoolGate>
      <SekolahAnggotaContent />
    </SchoolGate>
  );
}

function SekolahAnggotaContent() {
  const { school, schoolMember, isWaka, refreshSchool } = useSchool();
  const { user, isAdmin } = useAuth();

  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [invitations, setInvitations] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Email Modal
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Regenerate Code State
  const [isRegenerating, setIsRegenerating] = useState(false);

  const canManage = isWaka || isAdmin;

  const fetchData = async () => {
    if (!school?.id) return;
    setIsLoading(true);
    try {
      const [membersData, invData] = await Promise.all([
        schoolApi.getSchoolMembers(school.id),
        schoolApi.getSchoolInvitations(school.id),
      ]);
      setMembers(membersData);
      setInvitations(invData);
    } catch (err: any) {
      console.error('Error loading school members:', err);
      toast.error('Gagal memuat daftar anggota');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [school?.id]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.display_name && m.display_name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.school_role && m.school_role.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id || !emailInput.trim()) return;

    setIsAddingEmail(true);
    try {
      const res = await schoolApi.addTeacherByEmail(school.id, emailInput.trim());
      if (res.success) {
        toast.success(res.message);
        setEmailInput('');
        setIsAddEmailOpen(false);
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menambahkan guru');
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!school?.id) return;
    if (!window.confirm(`Keluarkan ${name || 'guru ini'} dari keanggotaan sekolah? Modul ajar pribadinya tidak akan terhapus.`)) {
      return;
    }

    try {
      await schoolApi.removeSchoolMember(school.id, targetUserId);
      toast.success('Anggota berhasil dikeluarkan dari sekolah');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengeluarkan anggota');
    }
  };

  const handleCancelInvitation = async (email: string) => {
    if (!school?.id) return;
    try {
      await schoolApi.cancelSchoolInvitation(school.id, email);
      toast.success(`Undangan untuk ${email} dibatalkan`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membatalkan undangan');
    }
  };

  const handleRegenerateCode = async () => {
    if (!school?.id) return;
    if (!window.confirm('Buat kode undangan baru? Kode lama akan langsung kadaluarsa.')) return;

    setIsRegenerating(true);
    try {
      const newCode = await schoolApi.regenerateInviteCode(school.id);
      toast.success(`Kode baru: ${newCode}`);
      await refreshSchool();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal meregenerasi kode');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <SchoolLayout
      pageTitle="Dewan Guru & Manajemen Undangan"
      pageDescription="Kelola akun guru yang terafiliasi, bagikan tautan WhatsApp, dan daftarkan email resmi."
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs gap-1.5 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsAddEmailOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black gap-1.5 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Tambah Guru via Email
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner Kode Rahasia Sekolah */}
        <Card className="border-2 border-foreground shadow-brutal bg-card rounded-2xl">
          <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Kode Undangan Rahasia Sekolah:
                </span>
                <Badge variant="outline" className="bg-[#f0fdf4] text-emerald-800 border-2 border-emerald-600 text-[10px] font-black uppercase">
                  Aktif
                </Badge>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-foreground tracking-widest">
                {school?.invite_code || 'MEMBUAT KODE...'}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Guru yang mendaftar menggunakan kode rahasia ini otomatis langsung aktif tanpa antrean manual.
              </p>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(school?.invite_code || '');
                    toast.success('Kode undangan disalin!');
                  }}
                  className="text-xs font-bold gap-1 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Kode
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRegenerateCode}
                  disabled={isRegenerating}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold border-2 border-rose-300 rounded-xl"
                >
                  {isRegenerating ? 'Mengganti...' : 'Ganti Kode Baru'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabel Dewan Guru Aktif */}
        <Card className="border-2 border-foreground shadow-brutal rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-foreground/10 bg-card">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" />
                Daftar Anggota Dewan Guru Aktif ({filteredMembers.length})
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Guru dan staf pengajar yang akunnya telah terverifikasi dan aktif di kalender sekolah.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru / email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-2 border-foreground shadow-brutal-sm"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase font-extrabold border-y-2 border-foreground">
                  <tr>
                    <th className="px-4 py-3">Nama Guru</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Peran</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-foreground/10 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground">
                        Memuat data anggota...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada guru yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.user_id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">
                          {m.display_name || 'Guru'}
                          {m.user_id === user?.id && (
                            <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 border-primary text-primary">
                              Anda
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{m.email}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                            {m.school_role || 'guru'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                            Aktif
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage && m.user_id !== user?.id && m.school_role !== 'waka' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(m.user_id, m.display_name || m.email || '')}
                              className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Keluarkan
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Pre-Whitelist Undangan Email */}
        {invitations.length > 0 && (
          <Card className="border-2 border-foreground shadow-brutal">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600" />
                Daftar Undangan Email Pre-Whitelist ({invitations.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Email di bawah ini sudah didaftarkan Waka. Saat guru bersangkutan mendaftar akun, sistem otomatis langsung mengaktifkannya di sekolah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-extrabold border-y-2 border-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Email Guru</th>
                      <th className="px-4 py-2.5">Tanggal Diundang</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground/10 font-medium">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold font-mono text-xs">{inv.email}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 font-bold">
                            Menunggu Registrasi
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvitation(inv.email)}
                            className="h-7 text-xs text-muted-foreground hover:text-rose-600"
                          >
                            Batalkan
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal Tambah Email Guru */}
      <Dialog open={isAddEmailOpen} onOpenChange={setIsAddEmailOpen}>
        <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Tambah Guru via Email
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Daftarkan email guru untuk menghubungkannya secara langsung ke sekolah.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEmail} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Akun Guru</label>
              <Input
                type="email"
                required
                placeholder="contoh: guru.ipa@sekolah.sch.id"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isAddingEmail}
                className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Jika sudah punya akun, langsung aktif. Jika belum punya akun, masuk ke daftar pre-whitelist.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddEmailOpen(false)}
                disabled={isAddingEmail}
                className="border-2 border-foreground font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAddingEmail || !emailInput.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground rounded-xl shadow-brutal-sm"
              >
                {isAddingEmail ? 'Menyimpan...' : 'Tambahkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
