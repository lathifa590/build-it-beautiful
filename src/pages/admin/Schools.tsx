import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  School as SchoolIcon,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { schoolApi } from '@/lib/school-api';
import type { School, SchoolMember, SchoolJenjang } from '@/types/school';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface UserOption {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

export default function AdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [pendingMembers, setPendingMembers] = useState<SchoolMember[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State: Create / Edit School
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    npsn: '',
    jenjang: 'SMA',
    alamat: '',
    academic_year_active: '2024/2025',
    waka_user_id: '',
    kepsek_user_id: '',
  });

  // Dialog State: Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  // Dialog State: View Members
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedSchoolForMembers, setSelectedSchoolForMembers] = useState<School | null>(null);
  const [currentSchoolMembers, setCurrentSchoolMembers] = useState<SchoolMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch schools
      const schoolsData = await schoolApi.getAllSchools();
      setSchools(schoolsData);

      // 2. Fetch all profiles for Waka/Kepsek dropdown
      const { data: profiles } = await supabase
        .from('profiles' as any)
        .select('user_id, display_name, email')
        .order('display_name', { ascending: true });

      setAllUsers((profiles as unknown as UserOption[]) || []);

      // 3. Fetch pending members across all schools
      const { data: pending } = await supabase
        .from('profiles' as any)
        .select('user_id, display_name, email, avatar_url, school_id, school_role, school_status, updated_at')
        .eq('school_status', 'pending');

      setPendingMembers((pending as unknown as SchoolMember[]) || []);
    } catch (err: any) {
      console.error('Error loading admin schools data:', err);
      toast.error('Gagal memuat data sekolah');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.npsn && s.npsn.toLowerCase().includes(q)) ||
        (s.alamat && s.alamat.toLowerCase().includes(q))
    );
  }, [schools, searchQuery]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      npsn: '',
      jenjang: 'SMA',
      alamat: '',
      academic_year_active: '2024/2025',
      waka_user_id: '',
      kepsek_user_id: '',
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      npsn: school.npsn || '',
      jenjang: school.jenjang || 'SMA',
      alamat: school.alamat || '',
      academic_year_active: school.academic_year_active || '2024/2025',
      waka_user_id: school.waka_user_id || '',
      kepsek_user_id: school.kepsek_user_id || '',
    });
    setIsFormOpen(true);
  };

  // Submit Form Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama sekolah wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSchool) {
        // Update
        await schoolApi.updateSchool(editingSchool.id, {
          name: formData.name.trim(),
          npsn: formData.npsn.trim() || null,
          jenjang: formData.jenjang as SchoolJenjang,
          alamat: formData.alamat.trim() || null,
          academic_year_active: formData.academic_year_active.trim() || '2024/2025',
          waka_user_id: formData.waka_user_id || null,
          kepsek_user_id: formData.kepsek_user_id || null,
        });
        toast.success(`Sekolah ${formData.name} berhasil diperbarui`);
      } else {
        // Create
        await schoolApi.createSchool({
          name: formData.name.trim(),
          npsn: formData.npsn.trim() || null,
          jenjang: formData.jenjang,
          alamat: formData.alamat.trim() || null,
          academic_year_active: formData.academic_year_active.trim() || '2024/2025',
          waka_user_id: formData.waka_user_id || null,
          kepsek_user_id: formData.kepsek_user_id || null,
        });
        toast.success(`Sekolah ${formData.name} berhasil didaftarkan`);
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving school:', err);
      toast.error(err.message || 'Gagal menyimpan sekolah');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete School
  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return;
    try {
      await schoolApi.deleteSchool(schoolToDelete.id);
      toast.success(`Sekolah ${schoolToDelete.name} berhasil dihapus`);
      setDeleteDialogOpen(false);
      setSchoolToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting school:', err);
      toast.error(err.message || 'Gagal menghapus sekolah');
    }
  };

  // View Members
  const handleViewMembers = async (school: School) => {
    setSelectedSchoolForMembers(school);
    setMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const members = await schoolApi.getSchoolMembers(school.id);
      setCurrentSchoolMembers(members);
    } catch (err) {
      toast.error('Gagal mengambil daftar anggota');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Approve Pending Member
  const handleApproveMember = async (userId: string) => {
    try {
      const res = await schoolApi.approveSchoolMember(userId);
      if (res.success) {
        toast.success('Permintaan bergabung disetujui');
        fetchData();
        if (selectedSchoolForMembers) {
          handleViewMembers(selectedSchoolForMembers);
        }
      } else {
        toast.error(res.message || 'Gagal menyetujui');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    }
  };

  // Reject / Remove Member
  const handleRemoveMember = async (userId: string) => {
    if (!selectedSchoolForMembers) return;
    try {
      await schoolApi.removeSchoolMember(selectedSchoolForMembers.id, userId);
      toast.success('Anggota berhasil dihapus/ditolak');
      fetchData();
      if (selectedSchoolForMembers) {
        handleViewMembers(selectedSchoolForMembers);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus anggota');
    }
  };

  // Helper getUserLabel
  const getUserLabel = (userId?: string | null) => {
    if (!userId) return '-';
    const found = allUsers.find((u) => u.user_id === userId);
    return found ? `${found.display_name || 'User'} (${found.email})` : userId;
  };

  // Helper getSchoolName
  const getSchoolName = (schoolId?: string | null) => {
    if (!schoolId) return '-';
    const found = schools.find((s) => s.id === schoolId);
    return found ? found.name : schoolId;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border-2 border-foreground shadow-brutal-sm">
                <SchoolIcon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Manajemen Sekolah</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola data tenant sekolah, penunjukan Waka Kurikulum, dan persetujuan pendaftaran guru.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-2 border-2 border-foreground shadow-brutal-sm hover:shadow-none transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-primary text-primary-foreground border-2 border-foreground shadow-brutal-sm hover:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Sekolah
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border-2 border-foreground shadow-brutal-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border-2 border-foreground">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Sekolah Terdaftar</p>
              <p className="text-2xl font-black">{schools.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border-2 border-foreground shadow-brutal-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border-2 border-foreground">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Permintaan Pending</p>
              <p className="text-2xl font-black">{pendingMembers.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border-2 border-foreground shadow-brutal-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-foreground">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Total User Terdaftar</p>
              <p className="text-2xl font-black">{allUsers.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs: Schools vs Pending Approvals */}
        <Tabs defaultValue="schools" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="border-2 border-foreground bg-muted p-1 rounded-xl">
              <TabsTrigger value="schools" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <SchoolIcon className="w-4 h-4" />
                Daftar Sekolah ({schools.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4" />
                Persetujuan Guru
                {pendingMembers.length > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0.2 text-[10px]">
                    {pendingMembers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NPSN, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-2 border-foreground shadow-brutal-sm"
              />
            </div>
          </div>

          {/* TAB 1: DAFTAR SEKOLAH */}
          <TabsContent value="schools">
            <div className="bg-card rounded-xl border-2 border-foreground shadow-brutal overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-extrabold border-b-2 border-foreground">
                    <tr>
                      <th className="px-4 py-3.5">Nama Sekolah</th>
                      <th className="px-4 py-3.5">NPSN</th>
                      <th className="px-4 py-3.5">Jenjang</th>
                      <th className="px-4 py-3.5">Waka Kurikulum</th>
                      <th className="px-4 py-3.5">Tahun Ajaran</th>
                      <th className="px-4 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground/10 font-medium">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                          Memuat data sekolah...
                        </td>
                      </tr>
                    ) : filteredSchools.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                          Belum ada sekolah terdaftar.
                        </td>
                      </tr>
                    ) : (
                      filteredSchools.map((sch) => (
                        <tr key={sch.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-foreground">{sch.name}</div>
                            {sch.alamat && (
                              <div className="text-xs text-muted-foreground line-clamp-1">{sch.alamat}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            {sch.npsn ? (
                              <Badge variant="outline" className="border-foreground/40 font-mono">
                                {sch.npsn}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge className="bg-secondary text-secondary-foreground border border-foreground/20 font-bold">
                              {sch.jenjang || 'Umum'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {getUserLabel(sch.waka_user_id)}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold">
                            {sch.academic_year_active || '2024/2025'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMembers(sch)}
                                className="h-8 px-2.5 gap-1 border border-foreground text-xs"
                                title="Lihat Anggota Guru"
                              >
                                <Users className="w-3.5 h-3.5" />
                                Anggota
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(sch)}
                                className="h-8 w-8 p-0 border border-foreground"
                                title="Edit Sekolah"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSchoolToDelete(sch);
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 border border-foreground hover:bg-destructive/10"
                                title="Hapus Sekolah"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: PERSETUJUAN ANGGOTA */}
          <TabsContent value="pending">
            <div className="bg-card rounded-xl border-2 border-foreground shadow-brutal overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-extrabold border-b-2 border-foreground">
                    <tr>
                      <th className="px-4 py-3.5">Guru</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5">Sekolah yang Dituju</th>
                      <th className="px-4 py-3.5">Tanggal Permintaan</th>
                      <th className="px-4 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground/10 font-medium">
                    {pendingMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                          Tidak ada permohonan anggota yang menunggu persetujuan.
                        </td>
                      </tr>
                    ) : (
                      pendingMembers.map((m) => (
                        <tr key={m.user_id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3.5 font-bold">{m.display_name || 'Tanpa Nama'}</td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">{m.email || '-'}</td>
                          <td className="px-4 py-3.5">
                            <Badge variant="outline" className="border-foreground font-semibold">
                              {getSchoolName(m.school_id)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {m.updated_at ? new Date(m.updated_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveMember(m.user_id)}
                                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Setujui
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(m.user_id)}
                                className="h-8 gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10 text-xs font-bold"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Tolak
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* MODAL: DAFTAR / EDIT SEKOLAH */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-lg border-2 border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">
                {editingSchool ? 'Edit Data Sekolah' : 'Daftarkan Sekolah Baru'}
              </DialogTitle>
              <DialogDescription>
                Informasi entitas sekolah yang akan menjadi tenant bersama kalender pendidikan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="school-name" className="font-bold">
                  Nama Sekolah <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="school-name"
                  placeholder="Contoh: SMAN 1 Jakarta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="school-npsn" className="font-bold">
                    NPSN (Kode Unik)
                  </Label>
                  <Input
                    id="school-npsn"
                    placeholder="Contoh: 20501234"
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="school-jenjang" className="font-bold">
                    Jenjang
                  </Label>
                  <select
                    id="school-jenjang"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.jenjang}
                    onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                  >
                    {['SD', 'SMP', 'SMA', 'SMK', 'MA', 'MI', 'MTS', 'PAUD', 'TK', 'SLB'].map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="school-academic-year" className="font-bold">
                    Tahun Ajaran Aktif
                  </Label>
                  <Input
                    id="school-academic-year"
                    placeholder="2024/2025"
                    value={formData.academic_year_active}
                    onChange={(e) => setFormData({ ...formData, academic_year_active: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="school-waka" className="font-bold">
                    Waka Kurikulum (PIC)
                  </Label>
                  <select
                    id="school-waka"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.waka_user_id}
                    onChange={(e) => setFormData({ ...formData, waka_user_id: e.target.value })}
                  >
                    <option value="">-- Pilih User Waka --</option>
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.display_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-alamat" className="font-bold">
                  Alamat Sekolah
                </Label>
                <Input
                  id="school-alamat"
                  placeholder="Jl. Pendidikan No. 1, Jakarta"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : editingSchool ? (
                    'Simpan Perubahan'
                  ) : (
                    'Daftarkan Sekolah'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL: DAFTAR ANGGOTA SEKOLAH */}
        <Dialog open={membersModalOpen} onOpenChange={setMembersModalOpen}>
          <DialogContent className="sm:max-w-2xl border-2 border-foreground shadow-brutal">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Anggota Guru: {selectedSchoolForMembers?.name}
              </DialogTitle>
              <DialogDescription>
                Daftar guru yang terdaftar dan berafiliasi aktif dengan sekolah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
              {loadingMembers ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Memuat data anggota...
                </div>
              ) : currentSchoolMembers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Belum ada guru yang terdaftar di sekolah ini.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {currentSchoolMembers.map((m) => (
                    <div key={m.user_id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          {m.display_name || 'Tanpa Nama'}
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {m.school_role || 'guru'}
                          </Badge>
                          {m.school_status === 'pending' && (
                            <Badge variant="destructive" className="text-[10px]">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {m.school_status === 'pending' ? (
                          <Button
                            size="sm"
                            onClick={() => handleApproveMember(m.user_id)}
                            className="h-7 text-xs bg-emerald-600 text-white font-bold"
                          >
                            Setujui
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Keluarkan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setMembersModalOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ALERT: HAPUS SEKOLAH */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="border-2 border-foreground shadow-brutal">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-black">
                Hapus Sekolah {schoolToDelete?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus sekolah dan melepaskan seluruh ikatan guru dari sekolah ini. Data workspace personal guru tidak akan terhapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSchool} className="bg-destructive text-destructive-foreground font-bold">
                Hapus Sekarang
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
