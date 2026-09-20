import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type { SchoolMemberProgress, SchoolMember } from '@/types/school';
import {
  School as SchoolIcon,
  GraduationCap,
  BookOpen,
  FileCheck,
  Clock,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Loader2,
  Users,
  Share2,
  Copy,
  KeyRound,
  UserPlus,
  Mail,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SekolahDashboardPage() {
  return (
    <SchoolGate>
      <SekolahDashboardContent />
    </SchoolGate>
  );
}

function SekolahDashboardContent() {
  const { school, schoolMember, isWaka, isKepsek, refreshSchool } = useSchool();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'progress' | 'members'>('progress');
  const [progressList, setProgressList] = useState<SchoolMemberProgress[]>([]);
  const [membersList, setMembersList] = useState<SchoolMember[]>([]);
  const [invitationsList, setInvitationsList] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog States
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [isAddEmailDialogOpen, setIsAddEmailDialogOpen] = useState<boolean>(false);
  const [teacherEmailInput, setTeacherEmailInput] = useState<string>('');
  const [isAddingEmail, setIsAddingEmail] = useState<boolean>(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState<boolean>(false);

  const canManageMembers = isWaka || isAdmin;
  const canManageCalendar = isWaka || isAdmin;

  const fetchData = async () => {
    if (!school?.id) return;
    setIsLoading(true);
    try {
      const [progressData, membersData, invData] = await Promise.all([
        schoolApi.getSchoolProgress(school.id),
        canManageMembers ? schoolApi.getSchoolMembers(school.id) : Promise.resolve([]),
        canManageMembers ? schoolApi.getSchoolInvitations(school.id) : Promise.resolve([]),
      ]);
      setProgressList(progressData);
      setMembersList(membersData);
      setInvitationsList(invData);
    } catch (err: any) {
      console.error('Error loading school data:', err);
      toast.error('Gagal memuat data sekolah');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [school?.id]);

  // Perhitungan Ringkasan Sekolah
  const stats = useMemo(() => {
    const totalTeachers = progressList.length;
    const totalWorkspaces = progressList.reduce((sum, item) => sum + Number(item.workspace_count || 0), 0);
    const totalPlannedJP = progressList.reduce((sum, item) => sum + Number(item.total_planned_jp || 0), 0);
    const totalModulReady = progressList.reduce((sum, item) => sum + Number(item.modul_ready_count || 0), 0);

    const completionPercent = totalWorkspaces > 0
      ? Math.min(100, Math.round((totalModulReady / (totalWorkspaces * 4)) * 100))
      : 0;

    return {
      totalTeachers,
      totalWorkspaces,
      totalPlannedJP,
      totalModulReady,
      completionPercent,
    };
  }, [progressList]);

  // Filter List Guru di Tab Progres
  const filteredProgressList = useMemo(() => {
    if (!searchQuery.trim()) return progressList;
    const q = searchQuery.toLowerCase();
    return progressList.filter(
      (item) =>
        (item.display_name && item.display_name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.school_role && item.school_role.toLowerCase().includes(q))
    );
  }, [progressList, searchQuery]);

  // Filter List Anggota di Tab Member
  const filteredMembersList = useMemo(() => {
    if (!searchQuery.trim()) return membersList;
    const q = searchQuery.toLowerCase();
    return membersList.filter(
      (item) =>
        (item.display_name && item.display_name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.school_role && item.school_role.toLowerCase().includes(q))
    );
  }, [membersList, searchQuery]);

  // URL & Teks Undangan WA
  const inviteCode = school?.invite_code || '';
  const inviteUrl = `${window.location.origin}/sekolah/join?code=${inviteCode}`;
  const waShareText = `Halo Bapak/Ibu Guru ${school?.name || ''},\n\nMari bergabung ke Mode Sekolah di Modul Ajar Generator untuk menyinkronkan Kalender Pendidikan dan JP:\n\n👉 Klik Link Bergabung:\n${inviteUrl}\n\n🔑 Kode Undangan: *${inviteCode}*\n\nTerima kasih!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Tautan undangan sekolah disalin ke clipboard!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Kode undangan disalin!');
  };

  const handleShareWa = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleRegenerateCode = async () => {
    if (!school?.id) return;
    if (!window.confirm('Apakah Anda yakin ingin mengganti kode undangan? Kode lama tidak akan bisa dipakai lagi oleh guru yang belum bergabung.')) {
      return;
    }

    setIsRegeneratingCode(true);
    try {
      const newCode = await schoolApi.regenerateInviteCode(school.id);
      toast.success(`Kode baru berhasil dibuat: ${newCode}`);
      await refreshSchool();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal meregenerasi kode');
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const handleAddTeacherEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id || !teacherEmailInput.trim()) return;

    setIsAddingEmail(true);
    try {
      const result = await schoolApi.addTeacherByEmail(school.id, teacherEmailInput.trim());
      if (result.success) {
        toast.success(result.message);
        setTeacherEmailInput('');
        setIsAddEmailDialogOpen(false);
        fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menambahkan guru');
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!school?.id) return;
    if (!window.confirm(`Keluarkan ${name || 'guru ini'} dari sekolah? Dokumen modul pribadinya tidak akan terhapus.`)) {
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

  return (
    <SchoolLayout
      pageTitle={school?.name || 'Dashboard Monitoring Sekolah'}
      pageDescription="Monitoring progres penyusunan modul ajar dewan guru dan ketuntasan kalender akademik."
      headerActions={
        canManageMembers && (
          <button
            onClick={() => setIsAddEmailDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Tambah Guru</span>
          </button>
        )
      }
    >
      <div className="space-y-6">
        {/* Role Banner Info */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fff3ed] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">
                Peran Anda: <span className="text-foreground uppercase">{schoolMember?.school_role || 'Guru'}</span>
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {isKepsek
                  ? 'Panel Monitoring Kepala Sekolah — Pantau progres penyusunan perangkat ajar seluruh dewan guru.'
                  : isWaka
                  ? 'Panel Waka Kurikulum — Koordinasikan kalender pendidikan, undang guru, dan pantau penyusunan modul.'
                  : 'Panel Pantauan Guru — Pantau perkembangan perangkat ajar dan jam pelajaran Anda.'}
              </p>
            </div>
          </div>

          <span className="bg-[#f0fdf4] text-emerald-800 border-2 border-emerald-600 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center shrink-0">
            ✓ Aktif Terdaftar
          </span>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Dewan Guru</span>
            <span className="text-3xl sm:text-4xl font-black text-foreground mt-2">{stats.totalTeachers}</span>
          </div>

          <div className="bg-[#e6f9f0] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Total Workspace</span>
            <span className="text-3xl sm:text-4xl font-black text-[#047857] mt-2">{stats.totalWorkspaces}</span>
          </div>

          <div className="bg-[#eef2ff] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">JP Terencana</span>
            <span className="text-3xl sm:text-4xl font-black text-[#1d4ed8] mt-2">{stats.totalPlannedJP}</span>
          </div>

          <div className="bg-[#fefce8] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">Modul Siap Pakai</span>
            <span className="text-3xl sm:text-4xl font-black text-[#b45309] mt-2">{stats.totalModulReady}</span>
          </div>
        </div>

        {/* Search Bar with Refresh Button & Filter Pills */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama guru, email, atau mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-card border-2 border-foreground rounded-full text-sm font-medium focus:outline-none focus:border-primary shadow-brutal-sm transition-all"
              />
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0"
              title="Segarkan data terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-foreground text-xs sm:text-sm font-black transition-all ${
                activeTab === 'progress'
                  ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                  : 'bg-card text-foreground hover:bg-secondary'
              }`}
            >
              <span>Progres Perangkat Ajar</span>
              <span className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {progressList.length}
              </span>
            </button>
            {canManageMembers && (
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-foreground text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                    : 'bg-card text-foreground hover:bg-secondary'
                }`}
              >
                <span>Dewan Guru & Undangan</span>
                <span className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                  {membersList.length + invitationsList.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'progress' && (
          <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
            <div className="p-4 sm:p-5 border-b-2 border-foreground bg-card">
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progres Penyusunan Perangkat Ajar Guru
              </h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Rekap alokasi pertemuan, JP, dan status kelengkapan dokumen modul ajar per guru.
              </p>
            </div>

            <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-xs uppercase font-extrabold border-y-2 border-foreground">
                      <tr>
                        <th className="px-4 py-3.5">Nama Guru</th>
                        <th className="px-4 py-3.5">Peran</th>
                        <th className="px-4 py-3.5 text-center">Workspace</th>
                        <th className="px-4 py-3.5 text-center">Total JP</th>
                        <th className="px-4 py-3.5 text-center">Modul Jadi</th>
                        <th className="px-4 py-3.5">Status Progres</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-foreground/10 font-medium">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                            Memuat data progres...
                          </td>
                        </tr>
                      ) : filteredProgressList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                            Belum ada data aktivitas guru di sekolah ini.
                          </td>
                        </tr>
                      ) : (
                        filteredProgressList.map((item) => {
                          const wsCount = Number(item.workspace_count || 0);
                          const plannedJP = Number(item.total_planned_jp || 0);
                          const modulReady = Number(item.modul_ready_count || 0);

                          const percent = wsCount > 0 ? Math.min(100, Math.round((modulReady / Math.max(1, wsCount * 2)) * 100)) : 0;

                          const statusColor =
                            percent >= 70
                              ? 'bg-emerald-500 text-white'
                              : percent >= 30
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white';

                          const statusLabel =
                            percent >= 70 ? 'Lengkap' : percent >= 30 ? 'Sedang Dikerjakan' : 'Baru Mulai';

                          return (
                            <tr key={item.user_id} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-foreground">
                                  {item.display_name || 'Guru'}
                                  {item.user_id === user?.id && (
                                    <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 border-primary text-primary">
                                      Saya
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{item.email}</div>
                              </td>

                              <td className="px-4 py-3.5">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono border-foreground/40 font-bold">
                                  {item.school_role || 'guru'}
                                </Badge>
                              </td>

                              <td className="px-4 py-3.5 text-center font-bold">
                                {wsCount}
                              </td>

                              <td className="px-4 py-3.5 text-center font-bold text-muted-foreground">
                                {plannedJP} JP
                              </td>

                              <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                                {modulReady} Dokumen
                              </td>

                              <td className="px-4 py-3.5 min-w-[180px]">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                    <span className="font-bold font-mono text-muted-foreground">{percent}%</span>
                                  </div>
                                  <Progress value={percent} className="h-2 border border-foreground/20" />
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: DEWAN GURU & UNDANGAN (Waka/Admin) */}
            {activeTab === 'members' && canManageMembers && (
              <div className="space-y-6">
                {/* Active Members Table */}
                <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
                  <div className="p-4 sm:p-5 border-b-2 border-foreground bg-card flex flex-row items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        Daftar Anggota Aktif ({filteredMembersList.length})
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Guru dan staf yang saat ini terhubung langsung ke kalender sekolah.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddEmailDialogOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground border-2 border-foreground rounded-xl text-xs font-black shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Tambah Guru
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-xs uppercase font-extrabold border-y-2 border-foreground">
                        <tr>
                          <th className="px-4 py-3">Nama & Email</th>
                          <th className="px-4 py-3">Peran</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-foreground/10 font-medium">
                        {filteredMembersList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-muted-foreground">
                              Tidak ada anggota aktif yang cocok dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredMembersList.map((m) => (
                            <tr key={m.user_id} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-foreground">
                                  {m.display_name || 'Guru'}
                                  {m.user_id === user?.id && (
                                    <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 border-primary text-primary">
                                      Anda
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{m.email}</div>
                              </td>

                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                                  {m.school_role || 'guru'}
                                </Badge>
                              </td>

                              <td className="px-4 py-3">
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                  Aktif
                                </Badge>
                              </td>

                              <td className="px-4 py-3 text-right">
                                {m.user_id !== user?.id && m.school_role !== 'waka' && (
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
                </div>

                {/* Pending Email Invitations Table */}
                {invitationsList.length > 0 && (
                <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
                  <div className="p-4 sm:p-5 border-b-2 border-foreground bg-card">
                    <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4 text-amber-600" />
                      Daftar Email yang Diundang ({invitationsList.length})
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Email guru di bawah ini sudah didaftarkan oleh Waka. Begitu mereka login / membuat akun dengan email tersebut, mereka akan otomatis langsung aktif di sekolah.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/60 text-xs uppercase font-black border-b-2 border-foreground text-foreground">
                        <tr>
                          <th className="px-4 py-3">Email Guru</th>
                          <th className="px-4 py-3">Waktu Diundang</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-foreground/10 font-medium">
                        {invitationsList.map((inv) => (
                          <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 font-bold font-mono text-xs">{inv.email}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(inv.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-[#fffbeb] text-amber-800 border-2 border-amber-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                Menunggu Login
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(inv.email)}
                                className="h-7 text-xs text-muted-foreground hover:text-rose-600 font-bold"
                              >
                                Batalkan
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      {/* DIALOG 1: SHARE KODE UNDANGAN & LINK WA */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Undangan Komunitas Guru Sekolah
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Bagikan link atau kode rahasia ini ke grup WhatsApp dewan guru sekolah Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Box Kode Rahasia */}
            <div className="p-4 bg-secondary/50 rounded-2xl border-2 border-foreground text-center space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                Kode Undangan Sekolah
              </span>
              <div className="text-3xl font-mono font-black text-foreground tracking-widest">
                {inviteCode || 'MEMBUAT KODE...'}
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 font-medium">
                Guru yang bergabung dengan kode ini langsung aktif tanpa antrean.
              </p>
            </div>

            {/* Link Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tautan Gabung 1-Klik:</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="font-mono text-xs border-2 border-foreground bg-card shadow-brutal-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1 font-bold border-2 border-foreground shadow-brutal-sm hover:shadow-none transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Link
                </Button>
              </div>
            </div>

            {/* Tombol Bagikan WhatsApp */}
            <Button
              onClick={handleShareWa}
              className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-black gap-2 py-5 border-2 border-foreground shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Kirim Tautan ke Grup WhatsApp
            </Button>

            {/* Keamanan & Regenerasi */}
            <div className="pt-3 border-t-2 border-foreground/15 text-xs text-muted-foreground flex items-center justify-between">
              <span className="font-medium">Kode bocor atau ingin diganti?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateCode}
                disabled={isRegeneratingCode}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 font-bold"
              >
                {isRegeneratingCode ? 'Mengganti...' : 'Ganti Kode Baru'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: TAMBAH GURU VIA EMAIL LANGSUNG */}
      <Dialog open={isAddEmailDialogOpen} onOpenChange={setIsAddEmailDialogOpen}>
        <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Tambah Guru via Email
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Waka Kurikulum dapat mendaftarkan email guru secara langsung tanpa menunggu mereka memasukkan kode.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTeacherEmail} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Email Akun Guru</label>
              <Input
                type="email"
                required
                placeholder="contoh: guru.matematika@sekolah.sch.id"
                value={teacherEmailInput}
                onChange={(e) => setTeacherEmailInput(e.target.value)}
                disabled={isAddingEmail}
                className="border-2 border-foreground text-sm font-medium shadow-brutal-sm"
              />
              <p className="text-[11px] text-muted-foreground leading-normal font-medium">
                • Jika guru sudah punya akun di aplikasi: akunnya akan <strong>langsung aktif</strong> di sekolah ini.<br />
                • Jika guru belum mendaftar: email akan masuk <strong>pre-whitelist</strong>, sehingga begitu mendaftar akunnya otomatis aktif.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddEmailDialogOpen(false)}
                disabled={isAddingEmail}
                className="border-2 border-foreground font-bold shadow-brutal-sm hover:shadow-none"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isAddingEmail || !teacherEmailInput.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black border-2 border-foreground shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                {isAddingEmail ? 'Menyimpan...' : 'Tambahkan Guru'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
