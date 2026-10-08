import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type {
  SchoolSharedWorkspace,
  SchoolWorkspaceMeetingItem,
  SchoolMeetingFullDetail,
} from '@/types/school';
import {
  FolderOpen,
  ArrowLeft,
  Search,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  UserCheck,
  Calendar,
  Layers,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Star,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { SchoolMeetingViewer } from '@/components/school/SchoolMeetingViewer';

export default function BankModulPage() {
  return (
    <SchoolGate>
      <BankModulContent />
    </SchoolGate>
  );
}

function BankModulContent() {
  const { school, isWaka, isKepsek } = useSchool();
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Level: 1 (Workspaces Grid) -> 2 (Meetings List) -> 3 (Meeting 6-in-1 Viewer)
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  // Level 1 State: Shared Workspaces
  const [workspaces, setWorkspaces] = useState<SchoolSharedWorkspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Level 2 State: Selected Workspace & Meetings List
  const [selectedWorkspace, setSelectedWorkspace] = useState<SchoolSharedWorkspace | null>(null);
  const [meetings, setMeetings] = useState<SchoolWorkspaceMeetingItem[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(false);
  const [meetingSearchQuery, setMeetingSearchQuery] = useState<string>('');

  // Level 3 State: Selected Meeting & Full Detail
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [meetingDetail, setMeetingDetail] = useState<SchoolMeetingFullDetail | null>(null);
  const [isLoadingMeetingDetail, setIsLoadingMeetingDetail] = useState<boolean>(false);

  const canReview = isWaka || isAdmin || isKepsek;

  // 1. Fetch Shared Workspaces (Level 1)
  const fetchWorkspaces = async () => {
    if (!school?.id) return;
    setIsLoadingWorkspaces(true);
    try {
      const data = await schoolApi.getSchoolSharedWorkspaces(school.id);
      setWorkspaces(data);
    } catch (err: any) {
      console.error('Error fetching school shared workspaces:', err);
      toast.error('Gagal memuat repositori perangkat ajar sekolah');
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    if (school?.id) {
      fetchWorkspaces();
    }
  }, [school?.id]);

  // 2. Load Meetings for Selected Workspace (Level 2)
  const loadWorkspaceMeetings = async (ws: SchoolSharedWorkspace) => {
    if (!school?.id) return;
    setSelectedWorkspace(ws);
    setLevel(2);
    setIsLoadingMeetings(true);
    try {
      const data = await schoolApi.getSchoolWorkspaceMeetings(school.id, ws.workspace_id);
      setMeetings(data);
    } catch (err: any) {
      console.error('Error loading meetings:', err);
      toast.error('Gagal memuat daftar pertemuan');
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  // 3. Load Full Meeting Detail (Level 3)
  const loadMeetingDetail = async (meetingId: string) => {
    if (!school?.id) return;
    setSelectedMeetingId(meetingId);
    setLevel(3);
    setIsLoadingMeetingDetail(true);
    try {
      const detail = await schoolApi.getSchoolMeetingFullDetail(school.id, meetingId);
      if (detail && !detail.error) {
        setMeetingDetail(detail);
      } else {
        toast.error(detail?.error || 'Gagal memuat detail perangkat ajar pertemuan');
        setLevel(2);
      }
    } catch (err: any) {
      console.error('Error loading meeting detail:', err);
      toast.error('Gagal memuat detail pertemuan');
      setLevel(2);
    } finally {
      setIsLoadingMeetingDetail(false);
    }
  };

  // Handle Promote to Template
  const handlePromoteTemplate = async (documentId: string, docType: string) => {
    if (!school?.id) return;
    try {
      const res = await schoolApi.promoteWorkspaceDocToBank(
        school.id,
        documentId,
        true,
        'Ditetapkan sebagai Template Resmi Sekolah oleh Tim Kurikulum'
      );
      if (res.success) {
        toast.success(`Komponen ${docType.toUpperCase()} berhasil ditetapkan sebagai Template Resmi Sekolah!`);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan template');
    }
  };

  // Filtered Workspaces (Level 1)
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((ws) => {
      if (teacherFilter !== 'all' && ws.user_id !== teacherFilter) return false;
      if (subjectFilter !== 'all' && ws.subject !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = ws.subject?.toLowerCase().includes(q);
        const matchTeacher = ws.teacher_name?.toLowerCase().includes(q);
        const matchGrade = ws.grade?.toLowerCase().includes(q);
        if (!matchSubject && !matchTeacher && !matchGrade) return false;
      }
      return true;
    });
  }, [workspaces, teacherFilter, subjectFilter, searchQuery]);

  // Dropdown Options
  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    workspaces.forEach((w) => {
      if (w.user_id && w.teacher_name) map.set(w.user_id, w.teacher_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [workspaces]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    workspaces.forEach((w) => {
      if (w.subject) set.add(w.subject);
    });
    return Array.from(set);
  }, [workspaces]);

  // Filtered Meetings (Level 2)
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (meetingSearchQuery.trim()) {
        const q = meetingSearchQuery.toLowerCase();
        const matchTitle = m.title?.toLowerCase().includes(q);
        const matchMateri = m.materi_pokok?.toLowerCase().includes(q);
        if (!matchTitle && !matchMateri) return false;
      }
      return true;
    });
  }, [meetings, meetingSearchQuery]);

  // Back Navigation Handlers
  const handleBackToWorkspaces = () => {
    setLevel(1);
    setSelectedWorkspace(null);
    setMeetings([]);
  };

  const handleBackToMeetings = () => {
    setLevel(2);
    setSelectedMeetingId(null);
    setMeetingDetail(null);
  };

  return (
    <SchoolLayout
      pageTitle="Bank Modul & Shared Drive Sekolah"
      pageDescription="Pusat penyimpanan & kurasi seluruh perangkat ajar dewan guru. Terhubung otomatis layaknya Google Shared Drive sekolah."
      headerActions={null}
    >
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* LEVEL 1: DAFTAR FOLDER WORKSPACE DEWAN GURU (SHARED DRIVE UTAMA) */}
        {/* ========================================================================= */}
        {level === 1 && (
          <div className="space-y-6">
            {/* Banner Info Shared Drive */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fff3ed] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">
                    Google Shared Drive Perangkat Ajar Sekolah
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    Seluruh folder mata pelajaran yang disusun dewan guru terhubung otomatis di sini. Waka Kurikulum
                    dan rekan guru dapat membuka, mempelajari, dan mencetak perangkat ajar secara utuh.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                <span className="bg-card text-foreground border-2 border-foreground font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-brutal-sm">
                  {workspaces.length} Folder Mapel
                </span>
                <span className="bg-emerald-100 text-emerald-950 border-2 border-emerald-600 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-brutal-sm">
                  {teacherOptions.length} Dewan Guru
                </span>
              </div>
            </div>

            {/* Filter Bar Level 1 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari mata pelajaran, kelas, atau nama guru penyusun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-card border-2 border-foreground rounded-full text-sm font-medium focus:outline-none focus:border-primary shadow-brutal-sm transition-all"
                />
              </div>

              {/* Filter Guru */}
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="h-10 sm:w-48 px-4 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer shrink-0"
              >
                <option value="all">Semua Guru ({teacherOptions.length})</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Filter Mapel */}
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-10 sm:w-44 px-4 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer shrink-0"
              >
                <option value="all">Semua Mapel</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchWorkspaces}
                disabled={isLoadingWorkspaces}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0"
                title="Segarkan data workspace guru"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWorkspaces ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Folder Grid Level 1 */}
            {isLoadingWorkspaces ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="font-bold text-sm">Memuat folder perangkat ajar sekolah...</p>
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-3">
                <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <h3 className="font-bold text-base text-foreground">Belum ada folder perangkat ajar</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Workspace yang dibuat oleh dewan guru akan otomatis muncul di sini sebagai arsip bersama.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWorkspaces.map((ws) => {
                  const percent =
                    ws.total_planned_jp > 0 ? Math.round((ws.completed_jp / ws.total_planned_jp) * 100) : 0;

                  return (
                    <Card
                      key={ws.workspace_id}
                      className="border-2 border-foreground shadow-brutal flex flex-col justify-between hover:translate-y-[-2px] transition-all bg-card overflow-hidden group cursor-pointer"
                      onClick={() => loadWorkspaceMeetings(ws)}
                    >
                      <CardHeader className="pb-3 space-y-2.5 bg-muted/20 border-b-2 border-foreground/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#fef08a] border-2 border-foreground flex items-center justify-center text-foreground shrink-0 shadow-brutal-sm">
                              <FolderOpen className="w-4 h-4 text-amber-900" />
                            </div>
                            <div>
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] font-black uppercase bg-card border-foreground/40"
                              >
                                {ws.academic_year || '2024/2025'}
                              </Badge>
                            </div>
                          </div>

                          <span className="font-black text-[11px] px-2.5 py-0.5 rounded-full border-2 border-foreground bg-card shadow-brutal-sm">
                            {ws.total_meetings} Pertemuan
                          </span>
                        </div>

                        <div>
                          <CardTitle className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                            {ws.subject}
                          </CardTitle>
                          <p className="text-xs font-black text-primary mt-0.5">
                            {ws.grade} {ws.phase ? `• Fase ${ws.phase}` : ''}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-4 text-xs">
                        {/* Author Info */}
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60 border border-foreground/20">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-xs shrink-0 border border-foreground">
                            {ws.teacher_name?.charAt(0) || 'G'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-muted-foreground block leading-none">Penyusun:</span>
                            <span className="font-black text-foreground truncate block">{ws.teacher_name}</span>
                            <span className="text-[10px] text-muted-foreground truncate block">{ws.teacher_email}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                            {ws.teacher_role || 'Guru'}
                          </Badge>
                        </div>

                        {/* Progress Bar & Stats */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground font-semibold">Ketuntasan Alokasi JP:</span>
                            <span className="font-mono font-black text-foreground">
                              {ws.completed_jp} / {ws.total_planned_jp} JP{' '}
                              <span className="text-primary font-bold">({percent}%)</span>
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-muted rounded-full border border-foreground/30 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all rounded-full"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Open Folder Button */}
                        <div className="pt-2 border-t flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {ws.ready_docs} Dokumen Siap
                          </span>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-black bg-primary group-hover:bg-primary/90 text-primary-foreground border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
                          >
                            <span>Buka Folder</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: DAFTAR PERTEMUAN DALAM WORKSPACE (FOLDER PERTEMUAN) */}
        {/* ========================================================================= */}
        {level === 2 && selectedWorkspace && (
          <div className="space-y-6">
            {/* Header Level 2: Breadcrumbs & Workspace Info */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-card shadow-brutal-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-foreground/10">
                <button
                  type="button"
                  onClick={handleBackToWorkspaces}
                  className="inline-flex items-center gap-2 text-xs font-black text-foreground hover:text-primary transition-all self-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Semua Folder Guru</span>
                </button>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant="outline" className="font-mono text-xs font-black bg-[#fef08a] border-foreground">
                    {selectedWorkspace.academic_year || '2024/2025'}
                  </Badge>
                  <span className="bg-card text-foreground border-2 border-foreground font-black text-xs px-3 py-1 rounded-full uppercase shadow-brutal-sm">
                    {meetings.length} Pertemuan Terdaftar
                  </span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-primary">
                      {selectedWorkspace.grade} • Fase {selectedWorkspace.phase}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {selectedWorkspace.subject}
                  </h1>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60 border-2 border-foreground/20 text-xs shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-xs shrink-0 border border-foreground">
                    {selectedWorkspace.teacher_name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block leading-none">Guru Penyusun:</span>
                    <span className="font-black text-foreground text-sm">{selectedWorkspace.teacher_name}</span>
                    <span className="text-[10px] text-muted-foreground block">{selectedWorkspace.teacher_email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter / Search Pertemuan */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari topik atau materi pertemuan..."
                  value={meetingSearchQuery}
                  onChange={(e) => setMeetingSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-card border-2 border-foreground rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:border-primary shadow-brutal-sm"
                />
              </div>

              <button
                onClick={() => loadWorkspaceMeetings(selectedWorkspace)}
                disabled={isLoadingMeetings}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMeetings ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* List Pertemuan */}
            {isLoadingMeetings ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="font-bold text-sm">Memuat daftar pertemuan...</p>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <h3 className="font-bold text-base text-foreground">Belum ada pertemuan pada folder ini</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Guru belum menyusun alokasi pertemuan pada workspace mata pelajaran ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredMeetings.map((m) => (
                  <div
                    key={m.meeting_id}
                    onClick={() => loadMeetingDetail(m.meeting_id)}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-card shadow-brutal-sm hover:shadow-brutal hover:translate-y-[-2px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-[#fef08a] border-2 border-foreground text-foreground">
                          Pertemuan {m.sequence}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">•</span>
                        <span className="text-xs font-bold text-muted-foreground">{m.planned_jp || 2} JP</span>
                        {m.materi_pokok && (
                          <>
                            <span className="text-xs font-bold text-muted-foreground">•</span>
                            <span className="text-xs font-black text-primary truncate max-w-xs">{m.materi_pokok}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                        {m.title}
                      </h3>

                      {/* 6-in-1 Status Indicator (Satu Kesatuan Utuh) */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground mr-1">Kelengkapan:</span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_modul
                              ? 'bg-blue-100 text-blue-900 border-blue-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          Modul
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_lkpd
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          LKPD
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_asesmen
                              ? 'bg-purple-100 text-purple-900 border-purple-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          Asesmen
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_soal
                              ? 'bg-amber-100 text-amber-900 border-amber-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          Soal
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_materi
                              ? 'bg-cyan-100 text-cyan-900 border-cyan-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          Materi
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            m.has_refleksi
                              ? 'bg-rose-100 text-rose-900 border-rose-500'
                              : 'bg-muted/40 text-muted-foreground border-transparent line-through'
                          }`}
                        >
                          Refleksi
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <span className="font-mono text-xs font-black text-foreground bg-muted px-2.5 py-1 rounded-lg border border-foreground/20">
                        {m.completed_docs_count}/6 Komponen
                      </span>

                      <Button
                        size="sm"
                        className="h-9 px-4 text-xs font-black bg-primary group-hover:bg-primary/90 text-primary-foreground border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
                      >
                        <span>Buka Perangkat Ajar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: VIEWER UTUH PERTEMUAN (PERSIS SEPERTI DI WORKSPACE GURU) */}
        {/* ========================================================================= */}
        {level === 3 && (
          <div>
            {isLoadingMeetingDetail ? (
              <div className="text-center py-24 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="font-bold text-sm">Memuat dokumen utuh pertemuan...</p>
              </div>
            ) : meetingDetail ? (
              <SchoolMeetingViewer
                meetingDetail={meetingDetail}
                onBack={handleBackToMeetings}
                canReview={canReview}
                onPromoteTemplate={handlePromoteTemplate}
              />
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-3">
                <p className="font-bold text-sm text-foreground">Dokumen tidak dapat dimuat</p>
                <Button onClick={handleBackToMeetings} size="sm">
                  Kembali ke Daftar Pertemuan
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
