import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type {
  SchoolDocument,
  SchoolDocumentStatus,
  SchoolDocumentComment,
  SchoolWorkspaceDocument,
  SchoolWorkspaceDocumentDetail,
} from '@/types/school';
import {
  School as SchoolIcon,
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Share2,
  Eye,
  FileCheck,
  CheckSquare,
  MessageSquare,
  Trash2,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  FolderOpen,
  DownloadCloud,
  Check,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function BankModulPage() {
  return (
    <SchoolGate>
      <BankModulContent />
    </SchoolGate>
  );
}

function BankModulContent() {
  const { school, isWaka, isKepsek, isSchoolActive } = useSchool();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Mode Tampilan Utama: 'bank' (Koleksi Resmi) vs 'workspace' (Semua Modul Guru)
  const [primaryTab, setPrimaryTab] = useState<'bank' | 'workspace'>('bank');

  // Dokumen Bank Modul (Koleksi Resmi)
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Dokumen Workspace Guru (Tab 2)
  const [workspaceDocs, setWorkspaceDocs] = useState<SchoolWorkspaceDocument[]>([]);
  const [isLoadingWorkspaceDocs, setIsLoadingWorkspaceDocs] = useState<boolean>(true);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState<string>('');
  const [workspaceTeacherFilter, setWorkspaceTeacherFilter] = useState<string>('all');
  const [workspaceSubjectFilter, setWorkspaceSubjectFilter] = useState<string>('all');
  const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState<string>('all');
  const [workspaceBankStatusFilter, setWorkspaceBankStatusFilter] = useState<string>('all');

  // Preview Dialog State (Bank Document)
  const [previewDoc, setPreviewDoc] = useState<SchoolDocument | null>(null);

  // Preview Dialog State (Workspace Document)
  const [previewWorkspaceDoc, setPreviewWorkspaceDoc] = useState<SchoolWorkspaceDocumentDetail | null>(null);
  const [isLoadingWorkspaceDetail, setIsLoadingWorkspaceDetail] = useState<boolean>(false);

  // Actions State
  const [isBulkPromoting, setIsBulkPromoting] = useState<boolean>(false);
  const [promotingDocId, setPromotingDocId] = useState<string | null>(null);

  // Review Dialog State (Waka/Admin/Kepsek)
  const [reviewDoc, setReviewDoc] = useState<SchoolDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<SchoolDocumentStatus>('approved');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isTemplateCheck, setIsTemplateCheck] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<{
    cp_tp_sesuai: boolean;
    waktu_sesuai: boolean;
    asesmen_lengkap: boolean;
    diferensiasi_ada: boolean;
  }>({
    cp_tp_sesuai: true,
    waktu_sesuai: true,
    asesmen_lengkap: true,
    diferensiasi_ada: true,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Comments / Feedback Dialog State
  const [commentDoc, setCommentDoc] = useState<SchoolDocument | null>(null);
  const [commentsList, setCommentsList] = useState<SchoolDocumentComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);

  const canReview = isWaka || isAdmin || isKepsek;

  // Fetch Dokumen Bank Modul Resmi
  const fetchDocuments = async () => {
    if (!school?.id) return;
    setIsLoading(true);
    try {
      const data = await schoolApi.getSchoolBankDocuments(school.id);
      setDocuments(data);
    } catch (err: any) {
      console.error('Error fetching bank documents:', err);
      toast.error('Gagal memuat dokumen Bank Modul');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Dokumen Workspace Guru
  const fetchWorkspaceDocuments = async () => {
    if (!school?.id) return;
    setIsLoadingWorkspaceDocs(true);
    try {
      const data = await schoolApi.getSchoolWorkspaceDocuments(school.id);
      setWorkspaceDocs(data);
    } catch (err: any) {
      console.error('Error fetching workspace documents:', err);
      toast.error('Gagal memuat dokumen workspace dewan guru');
    } finally {
      setIsLoadingWorkspaceDocs(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchDocuments(), fetchWorkspaceDocuments()]);
  };

  useEffect(() => {
    if (school?.id) {
      fetchAllData();
    }
  }, [school?.id]);

  // Filter Dokumen Bank Modul Resmi
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (activeTab === 'template' && !doc.is_template) return false;
      if (activeTab === 'approved' && doc.status !== 'approved') return false;
      if (activeTab === 'pending' && doc.status !== 'pending_review') return false;
      if (activeTab === 'revision' && doc.status !== 'revision') return false;

      if (selectedType !== 'all' && doc.document_type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchSubject = doc.subject?.toLowerCase().includes(q);
        const matchAuthor = doc.shared_by_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchAuthor) return false;
      }

      return true;
    });
  }, [documents, activeTab, selectedType, searchQuery]);

  // Filter Dokumen Workspace Guru
  const filteredWorkspaceDocs = useMemo(() => {
    return workspaceDocs.filter((doc) => {
      if (workspaceTeacherFilter !== 'all' && doc.teacher_id !== workspaceTeacherFilter) {
        return false;
      }
      if (workspaceSubjectFilter !== 'all' && doc.subject !== workspaceSubjectFilter) {
        return false;
      }
      if (workspaceTypeFilter !== 'all' && doc.document_type.toLowerCase() !== workspaceTypeFilter.toLowerCase()) {
        return false;
      }
      if (workspaceBankStatusFilter === 'in_bank' && !doc.is_shared_to_bank) {
        return false;
      }
      if (workspaceBankStatusFilter === 'not_in_bank' && doc.is_shared_to_bank) {
        return false;
      }

      if (workspaceSearchQuery.trim()) {
        const q = workspaceSearchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchSubject = doc.subject?.toLowerCase().includes(q);
        const matchTeacher = doc.teacher_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchTeacher) return false;
      }

      return true;
    });
  }, [workspaceDocs, workspaceTeacherFilter, workspaceSubjectFilter, workspaceTypeFilter, workspaceBankStatusFilter, workspaceSearchQuery]);

  // Statistik Bank Resmi
  const stats = useMemo(() => {
    const total = documents.length;
    const templates = documents.filter((d) => d.is_template).length;
    const approved = documents.filter((d) => d.status === 'approved').length;
    const pending = documents.filter((d) => d.status === 'pending_review').length;
    const revision = documents.filter((d) => d.status === 'revision').length;
    return { total, templates, approved, pending, revision };
  }, [documents]);

  // Dropdown Opsi Guru & Mapel untuk Filter Tab Workspace
  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    workspaceDocs.forEach((d) => {
      if (d.teacher_id && d.teacher_name) {
        map.set(d.teacher_id, d.teacher_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [workspaceDocs]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    workspaceDocs.forEach((d) => {
      if (d.subject) set.add(d.subject);
    });
    return Array.from(set);
  }, [workspaceDocs]);

  // Promosikan dokumen workspace ke Bank Modul Sekolah
  const handlePromoteToBank = async (doc: SchoolWorkspaceDocument, isTemplate: boolean = false) => {
    if (!school?.id) return;
    setPromotingDocId(doc.document_id);
    try {
      const res = await schoolApi.promoteWorkspaceDocToBank(school.id, doc.document_id, isTemplate);
      if (res.success) {
        toast.success(res.message);
        await Promise.all([fetchWorkspaceDocuments(), fetchDocuments()]);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menambahkan ke Bank Sekolah');
    } finally {
      setPromotingDocId(null);
    }
  };

  // Bulk Import dokumen workspace ke Bank Modul Sekolah
  const handleBulkPromote = async () => {
    if (!school?.id) return;
    if (!window.confirm(`Masukkan semua modul guru yang berstatus siap pakai (${workspaceDocs.filter(d => !d.is_shared_to_bank).length} dokumen) ke Bank Modul Sekolah?`)) {
      return;
    }
    setIsBulkPromoting(true);
    try {
      const res = await schoolApi.bulkPromoteWorkspaceDocsToBank(school.id);
      if (res.success) {
        toast.success(res.message);
        await Promise.all([fetchWorkspaceDocuments(), fetchDocuments()]);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menambahkan secara massal');
    } finally {
      setIsBulkPromoting(false);
    }
  };

  // Buka Pratinjau Dokumen Workspace
  const handleOpenWorkspaceDocPreview = async (doc: SchoolWorkspaceDocument) => {
    if (!school?.id) return;
    setIsLoadingWorkspaceDetail(true);
    setPreviewWorkspaceDoc(null);
    try {
      const detail = await schoolApi.getSchoolWorkspaceDocumentDetail(school.id, doc.document_id);
      if (detail && !detail.error) {
        setPreviewWorkspaceDoc(detail);
      } else {
        toast.error(detail?.error || 'Gagal memuat detail dokumen');
      }
    } catch (err: any) {
      toast.error('Gagal memuat detail dokumen');
    } finally {
      setIsLoadingWorkspaceDetail(false);
    }
  };

  const handleOpenReview = (doc: SchoolDocument) => {
    setReviewDoc(doc);
    setReviewStatus(doc.status === 'pending_review' ? 'approved' : doc.status);
    setReviewNotes(doc.review_notes || '');
    setIsTemplateCheck(doc.is_template);
  };

  const handleSubmitReview = async () => {
    if (!reviewDoc) return;
    setIsSubmittingReview(true);
    try {
      const result = await schoolApi.reviewSchoolDocument(
        reviewDoc.id,
        reviewStatus,
        reviewNotes,
        isTemplateCheck,
        checklist
      );

      if (result.success) {
        toast.success(result.message);
        setReviewDoc(null);
        await Promise.all([fetchDocuments(), fetchWorkspaceDocuments()]);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan hasil verifikasi');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenComments = async (doc: SchoolDocument) => {
    setCommentDoc(doc);
    try {
      const comments = await schoolApi.getSchoolDocumentComments(doc.id);
      setCommentsList(comments);
    } catch (err: any) {
      toast.error('Gagal memuat riwayat diskusi');
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDoc || !newCommentText.trim()) return;
    setIsPostingComment(true);
    try {
      const newComment = await schoolApi.addSchoolDocumentComment(
        commentDoc.id,
        newCommentText.trim()
      );
      setCommentsList((prev) => [...prev, newComment]);
      setNewCommentText('');
      toast.success('Feedback berhasil dikirim');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirim feedback');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteDoc = async (docId: string, title: string) => {
    if (!window.confirm(`Hapus "${title}" dari Bank Modul Sekolah? Dokumen asli di workspace guru tidak akan terhapus.`)) {
      return;
    }

    try {
      await schoolApi.deleteSchoolDocument(docId);
      toast.success('Dokumen dihapus dari Bank Sekolah');
      await Promise.all([fetchDocuments(), fetchWorkspaceDocuments()]);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus');
    }
  };

  const getStatusBadge = (doc: SchoolDocument) => {
    if (doc.is_template) {
      return (
        <span className="bg-[#fffbeb] text-amber-900 border-2 border-amber-600 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          Template Resmi
        </span>
      );
    }

    switch (doc.status) {
      case 'approved':
        return (
          <span className="bg-[#f0fdf4] text-emerald-900 border-2 border-emerald-600 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui Waka
          </span>
        );
      case 'revision':
        return (
          <span className="bg-[#fef2f2] text-rose-900 border-2 border-rose-600 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Perlu Revisi
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="bg-[#fffbeb] text-amber-950 border-2 border-amber-500 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  const getDocTypeBadgeStyle = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case 'modul':
        return 'bg-blue-100 text-blue-900 border-blue-600';
      case 'lkpd':
        return 'bg-emerald-100 text-emerald-900 border-emerald-600';
      case 'asesmen':
        return 'bg-purple-100 text-purple-900 border-purple-600';
      case 'materi':
        return 'bg-cyan-100 text-cyan-900 border-cyan-600';
      case 'soal':
        return 'bg-amber-100 text-amber-900 border-amber-600';
      case 'refleksi':
        return 'bg-rose-100 text-rose-900 border-rose-600';
      default:
        return 'bg-muted text-foreground border-foreground/30';
    }
  };

  return (
    <SchoolLayout
      pageTitle="Bank Modul & Koleksi Perangkat Ajar"
      pageDescription="Pusat berbagi perangkat ajar guru, kurasi mutu kurikulum, dan template resmi sekolah."
      headerActions={null}
    >
      <div className="space-y-6">
        {/* PRIMARY VIEW SWITCHER (DUA TAB UTAMA) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-muted/50 rounded-2xl border-2 border-foreground shadow-brutal-sm">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrimaryTab('bank')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                primaryTab === 'bank'
                  ? 'bg-card text-foreground border-2 border-foreground shadow-brutal-sm'
                  : 'text-muted-foreground hover:text-foreground border-2 border-transparent'
              }`}
            >
              <SchoolIcon className="w-4 h-4 text-primary" />
              <span>Koleksi Resmi Sekolah</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  primaryTab === 'bank'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted-foreground/20 text-foreground'
                }`}
              >
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPrimaryTab('workspace')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                primaryTab === 'workspace'
                  ? 'bg-[#fef08a] text-foreground border-2 border-foreground shadow-brutal-sm'
                  : 'text-muted-foreground hover:text-foreground border-2 border-transparent'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-amber-700" />
              <span>Semua Modul Guru (Workspace)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  primaryTab === 'workspace' ? 'bg-black text-white' : 'bg-muted-foreground/20 text-foreground'
                }`}
              >
                {workspaceDocs.length}
              </span>
            </button>
          </div>

          {/* Quick Bulk Action for Waka in Workspace Tab */}
          {primaryTab === 'workspace' && canReview && workspaceDocs.length > 0 && (
            <div className="flex items-center gap-2 px-2 pb-1 sm:pb-0">
              <Button
                onClick={handleBulkPromote}
                disabled={isBulkPromoting || workspaceDocs.filter((d) => !d.is_shared_to_bank).length === 0}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl h-9 gap-1.5"
                title="Masukkan seluruh modul siap pakai dewan guru ke Bank Modul Sekolah"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isBulkPromoting ? 'animate-spin' : ''}`} />
                <span>
                  {isBulkPromoting
                    ? 'Menambahkan...'
                    : `Masukkan Semua ke Bank (${workspaceDocs.filter((d) => !d.is_shared_to_bank).length})`}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: KOLEKSI RESMI SEKOLAH (KURASI & TEMPLATE) */}
        {/* ========================================================================= */}
        {primaryTab === 'bank' && (
          <div className="space-y-6">
            {/* Banner Info */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fff3ed] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">
                    Pusat Sumber Belajar & Penjaminan Mutu Resmi
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {canReview
                      ? 'Koleksi perangkat ajar yang telah diverifikasi Waka Kurikulum atau ditetapkan sebagai Template Resmi Sekolah.'
                      : 'Pelajari perangkat ajar rekan guru yang telah disetujui kurikulum atau gunakan template resmi sekolah.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="bg-card text-foreground border-2 border-foreground font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-brutal-sm">
                  {stats.total} Dokumen Resmi
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari judul modul resmi, mata pelajaran, atau guru..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-card border-2 border-foreground rounded-full text-sm font-medium focus:outline-none focus:border-primary shadow-brutal-sm transition-all"
                  />
                </div>

                {/* Filter Jenis Dokumen */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-10 sm:w-44 px-4 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer shrink-0"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="modul">Modul Ajar</option>
                  <option value="lkpd">LKPD</option>
                  <option value="asesmen">Asesmen</option>
                  <option value="materi">Materi</option>
                  <option value="soal">Bank Soal</option>
                  <option value="refleksi">Refleksi</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={fetchAllData}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0"
                  title="Segarkan data dokumen"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Pill Tabs Status Kurasi */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-foreground text-xs font-black transition-all ${
                    activeTab === 'all'
                      ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                      : 'bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>Semua</span>
                  <span className="bg-black text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                    {stats.total}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('template')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-foreground text-xs font-black transition-all ${
                    activeTab === 'template'
                      ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                      : 'bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Template Resmi</span>
                  <span className="bg-black text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                    {stats.templates}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('approved')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-foreground text-xs font-black transition-all ${
                    activeTab === 'approved'
                      ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                      : 'bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>Disetujui Waka</span>
                  <span className="bg-black text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                    {stats.approved}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-foreground text-xs font-black transition-all ${
                    activeTab === 'pending'
                      ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                      : 'bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>Menunggu</span>
                  <span className="bg-black text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                    {stats.pending}
                  </span>
                </button>

                {stats.revision > 0 && (
                  <button
                    onClick={() => setActiveTab('revision')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-foreground text-xs font-black transition-all ${
                      activeTab === 'revision'
                        ? 'bg-[#fef08a] text-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]'
                        : 'bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>Revisi</span>
                    <span className="bg-black text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                      {stats.revision}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Document Grid Bank Resmi */}
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="font-bold text-sm">Memuat koleksi modul resmi sekolah...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 border-2 border-foreground/20 flex items-center justify-center mx-auto text-muted-foreground">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-black text-base text-foreground">Koleksi Resmi Sekolah Masih Kosong</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Belum ada dokumen yang ditetapkan sebagai Koleksi atau Template Resmi. Anda dapat membuka tab{' '}
                    <strong className="text-foreground">"Semua Modul Guru (Workspace)"</strong> untuk melihat{' '}
                    <strong className="text-foreground">{workspaceDocs.length} modul</strong> yang telah siap dibuat
                    oleh dewan guru.
                  </p>
                </div>
                {workspaceDocs.length > 0 && (
                  <Button
                    onClick={() => setPrimaryTab('workspace')}
                    className="bg-[#fef08a] hover:bg-[#fde047] text-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl gap-2 mt-2"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-700" />
                    <span>Jelajahi {workspaceDocs.length} Modul Guru Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => {
                  const isOwner = doc.shared_by === user?.id;

                  return (
                    <Card
                      key={doc.id}
                      className={`border-2 border-foreground shadow-brutal-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all bg-card ${
                        doc.is_template ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                    >
                      <CardHeader className="pb-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`border-2 font-mono text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${getDocTypeBadgeStyle(
                              doc.document_type
                            )}`}
                          >
                            {doc.document_type}
                          </span>
                          {getStatusBadge(doc)}
                        </div>

                        <div>
                          <CardTitle className="text-sm font-black line-clamp-2 text-foreground leading-snug">
                            {doc.title}
                          </CardTitle>
                          {doc.subject && (
                            <p className="text-xs font-black text-primary mt-1">
                              {doc.subject} {doc.grade ? `• Kelas ${doc.grade}` : ''}
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0 text-xs">
                        {/* Author & Timestamp */}
                        <div className="p-2.5 rounded-lg bg-muted/60 border text-[11px] flex items-center justify-between">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Penyusun:</span>
                            <span className="font-bold text-foreground">{doc.shared_by_name || 'Guru'}</span>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <span className="block text-[10px]">Dibagikan:</span>
                            <span>
                              {new Date(doc.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Review Notes Preview */}
                        {doc.review_notes && (
                          <div className="p-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-[11px] text-amber-800 dark:text-amber-300 line-clamp-2">
                            <strong>Catatan Waka:</strong> {doc.review_notes}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewDoc(doc)}
                            className="h-8 text-xs font-bold gap-1 border-foreground/40 hover:bg-muted"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Pratinjau
                          </Button>

                          <div className="flex items-center gap-1">
                            {/* Discussion / Comments */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenComments(doc)}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                              title="Diskusi & Masukan"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {Number(doc.comments_count || 0) > 0 && (
                                <span className="font-mono text-[10px] font-bold">{doc.comments_count}</span>
                              )}
                            </Button>

                            {/* Review Button for Waka / Admin */}
                            {canReview && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(doc)}
                                className="h-8 text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground shadow-brutal-sm rounded-xl"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Review
                              </Button>
                            )}

                            {/* Delete Button (Owner or Waka) */}
                            {(isOwner || isWaka || isAdmin) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                className="h-8 px-2 text-muted-foreground hover:text-rose-600"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
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
        {/* TAB 2: SEMUA MODUL GURU (WORKSPACE EXPLORER) */}
        {/* ========================================================================= */}
        {primaryTab === 'workspace' && (
          <div className="space-y-6">
            {/* Banner Info Tab 2 */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fefce8] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Eksplorasi Perangkat Ajar Dewan Guru
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    Menampilkan seluruh dokumen yang telah selesai disusun guru di workspace masing-masing. Waka dapat
                    meninjau langsung atau mempromosikannya ke Koleksi Resmi / Template Sekolah.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                <span className="bg-card text-foreground border-2 border-foreground font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-brutal-sm">
                  Total {workspaceDocs.length} Dokumen
                </span>
                <span className="bg-emerald-100 text-emerald-900 border-2 border-emerald-600 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-brutal-sm">
                  {workspaceDocs.filter((d) => d.is_shared_to_bank).length} Di Bank
                </span>
              </div>
            </div>

            {/* Filter Bar Tab Workspace */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari judul modul, topik, atau nama guru..."
                    value={workspaceSearchQuery}
                    onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2 bg-card border-2 border-foreground rounded-full text-xs sm:text-sm font-medium focus:outline-none focus:border-primary shadow-brutal-sm"
                  />
                </div>

                {/* Filter Guru */}
                <select
                  value={workspaceTeacherFilter}
                  onChange={(e) => setWorkspaceTeacherFilter(e.target.value)}
                  className="h-10 px-3 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer"
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
                  value={workspaceSubjectFilter}
                  onChange={(e) => setWorkspaceSubjectFilter(e.target.value)}
                  className="h-10 px-3 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Semua Mapel</option>
                  {subjectOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                {/* Filter Jenis Dokumen */}
                <select
                  value={workspaceTypeFilter}
                  onChange={(e) => setWorkspaceTypeFilter(e.target.value)}
                  className="h-10 px-3 text-xs border-2 border-foreground rounded-full bg-card font-bold shadow-brutal-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="modul">Modul Ajar</option>
                  <option value="lkpd">LKPD</option>
                  <option value="asesmen">Asesmen</option>
                  <option value="materi">Materi</option>
                  <option value="soal">Bank Soal</option>
                  <option value="refleksi">Refleksi</option>
                </select>
              </div>

              {/* Status Bank Filter Pills & Refresh */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground mr-1">Status Bank:</span>
                  <button
                    type="button"
                    onClick={() => setWorkspaceBankStatusFilter('all')}
                    className={`px-3 py-1 rounded-full border-2 border-foreground text-xs font-bold transition-all ${
                      workspaceBankStatusFilter === 'all'
                        ? 'bg-foreground text-background shadow-brutal-sm'
                        : 'bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    Semua ({workspaceDocs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceBankStatusFilter('not_in_bank')}
                    className={`px-3 py-1 rounded-full border-2 border-foreground text-xs font-bold transition-all ${
                      workspaceBankStatusFilter === 'not_in_bank'
                        ? 'bg-amber-300 text-amber-950 shadow-brutal-sm'
                        : 'bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    Belum di Bank ({workspaceDocs.filter((d) => !d.is_shared_to_bank).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkspaceBankStatusFilter('in_bank')}
                    className={`px-3 py-1 rounded-full border-2 border-foreground text-xs font-bold transition-all ${
                      workspaceBankStatusFilter === 'in_bank'
                        ? 'bg-emerald-300 text-emerald-950 shadow-brutal-sm'
                        : 'bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    Sudah di Bank ({workspaceDocs.filter((d) => d.is_shared_to_bank).length})
                  </button>
                </div>

                <button
                  onClick={fetchAllData}
                  disabled={isLoadingWorkspaceDocs}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0 ml-auto"
                  title="Segarkan data modul guru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWorkspaceDocs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Workspace Documents Grid */}
            {isLoadingWorkspaceDocs ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="font-bold text-sm">Memuat modul workspace dewan guru...</p>
              </div>
            ) : filteredWorkspaceDocs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-3">
                <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <h3 className="font-bold text-base text-foreground">Tidak ada dokumen yang cocok dengan filter</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Coba ubah kata kunci pencarian, jenis dokumen, atau pilihan guru pada filter di atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkspaceDocs.map((doc) => {
                  const isPromotingThis = promotingDocId === doc.document_id;

                  return (
                    <Card
                      key={doc.document_id}
                      className="border-2 border-foreground shadow-brutal-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all bg-card"
                    >
                      <CardHeader className="pb-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`border-2 font-mono text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${getDocTypeBadgeStyle(
                              doc.document_type
                            )}`}
                          >
                            {doc.document_type}
                          </span>

                          {doc.is_official_template ? (
                            <span className="bg-[#fffbeb] text-amber-900 border-2 border-amber-600 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Template Resmi
                            </span>
                          ) : doc.is_shared_to_bank ? (
                            <span className="bg-[#f0fdf4] text-emerald-900 border-2 border-emerald-600 font-black text-[10px] gap-1 px-2 py-0.5 rounded-full uppercase inline-flex items-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ada di Bank
                            </span>
                          ) : (
                            <span className="bg-muted text-muted-foreground border-2 border-foreground/20 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase inline-flex items-center">
                              Draf Workspace
                            </span>
                          )}
                        </div>

                        <div>
                          <CardTitle className="text-sm font-black line-clamp-2 text-foreground leading-snug">
                            {doc.title}
                          </CardTitle>
                          {doc.subject && (
                            <p className="text-xs font-black text-primary mt-1">
                              {doc.subject} {doc.grade ? `• ${doc.grade}` : ''} {doc.phase ? `(Fase ${doc.phase})` : ''}
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0 text-xs">
                        {/* Author & Info Workspace */}
                        <div className="p-2.5 rounded-lg bg-muted/60 border text-[11px] flex items-center justify-between">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Penyusun:</span>
                            <span className="font-bold text-foreground flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-muted-foreground" />
                              {doc.teacher_name}
                            </span>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <span className="block text-[10px]">Tahun Ajaran:</span>
                            <span className="font-semibold text-foreground">{doc.academic_year || '2024/2025'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenWorkspaceDocPreview(doc)}
                            className="h-8 text-xs font-bold gap-1 border-foreground/40 hover:bg-muted"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Pratinjau
                          </Button>

                          <div className="flex items-center gap-1.5">
                            {/* Tombol Bagikan ke Bank Sekolah */}
                            {!doc.is_shared_to_bank ? (
                              <Button
                                size="sm"
                                onClick={() => handlePromoteToBank(doc, false)}
                                disabled={isPromotingThis}
                                className="h-8 text-xs font-bold gap-1 bg-[#fef08a] hover:bg-[#fde047] text-foreground border-2 border-foreground shadow-brutal-sm rounded-xl"
                                title="Tambahkan dokumen ini ke Bank Modul Sekolah"
                              >
                                {isPromotingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                                <span>+ Ke Bank</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Di Bank
                              </span>
                            )}

                            {/* Tombol Jadikan Template Resmi untuk Waka */}
                            {canReview && !doc.is_official_template && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteToBank(doc, true)}
                                disabled={isPromotingThis}
                                className="h-8 text-xs font-bold gap-1 border-amber-500 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl"
                                title="Jadikan dokumen ini sebagai Template Resmi Sekolah"
                              >
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="hidden sm:inline">Jadikan Template</span>
                              </Button>
                            )}
                          </div>
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
        {/* DIALOG 1: REVIEW & PENJAMINAN MUTU WAKA (UNTUK BANK RESMI) */}
        {/* ========================================================================= */}
        <Dialog open={!!reviewDoc} onOpenChange={(open) => !open && setReviewDoc(null)}>
          <DialogContent className="max-w-lg border-2 border-foreground shadow-brutal bg-card">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Verifikasi & Penjaminan Mutu Dokumen
              </DialogTitle>
              <DialogDescription className="text-xs">
                {reviewDoc?.title} • Penyusun: {reviewDoc?.shared_by_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Rubrik Checklist */}
              <div className="p-3.5 bg-muted/60 rounded-xl border space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                  Rubrik Checklist Waka Kurikulum:
                </span>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={checklist.cp_tp_sesuai}
                      onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, cp_tp_sesuai: !!c }))}
                    />
                    <span>Kesesuaian Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={checklist.waktu_sesuai}
                      onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, waktu_sesuai: !!c }))}
                    />
                    <span>Alokasi Jam Pelajaran (JP) sesuai Kalender Akademik</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={checklist.asesmen_lengkap}
                      onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, asesmen_lengkap: !!c }))}
                    />
                    <span>Kelengkapan Instrumen Asesmen (Formatif/Sumatif & Rubrik)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={checklist.diferensiasi_ada}
                      onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, diferensiasi_ada: !!c }))}
                    />
                    <span>Akomodasi Pembelajaran Berdiferensiasi & Remedial/Pengayaan</span>
                  </label>
                </div>
              </div>

              {/* Pilihan Status Verifikasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Status Verifikasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    className={`p-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      reviewStatus === 'approved'
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-brutal-sm'
                        : 'border-foreground/30 hover:bg-muted'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Setujui Modul
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('revision')}
                    className={`p-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      reviewStatus === 'revision'
                        ? 'bg-rose-100 border-rose-600 text-rose-950 shadow-brutal-sm'
                        : 'border-foreground/30 hover:bg-muted'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Perlu Revisi
                  </button>
                </div>
              </div>

              {/* Catatan Review */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Catatan / Umpan Balik untuk Guru:</label>
                <Textarea
                  placeholder="Tuliskan catatan perbaikan atau apresiasi terhadap modul ajar ini..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="text-xs border-foreground/40"
                />
              </div>

              {/* Jadikan Template Resmi Toggle */}
              <div className="p-3 bg-[#fff3ed] border-2 border-foreground rounded-xl flex items-center justify-between shadow-brutal-sm">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Jadikan Template Resmi Sekolah
                  </span>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Modul ini akan disematkan di bagian atas sebagai standar kurikulum resmi sekolah.
                  </p>
                </div>
                <Checkbox
                  checked={isTemplateCheck}
                  onCheckedChange={(c) => setIsTemplateCheck(!!c)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewDoc(null)}
                  disabled={isSubmittingReview}
                  className="border-2 border-foreground font-bold"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl"
                >
                  {isSubmittingReview ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* DIALOG 2: PRATINJAU DOKUMEN RESMI BANK */}
        {/* ========================================================================= */}
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-foreground shadow-brutal bg-card">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {previewDoc?.document_type.toUpperCase()}
                </Badge>
                {previewDoc && getStatusBadge(previewDoc)}
              </div>
              <DialogTitle className="text-lg font-black text-foreground pt-1">
                {previewDoc?.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {previewDoc?.subject} • {previewDoc?.grade ? `Kelas ${previewDoc.grade}` : ''} • Penyusun: {previewDoc?.shared_by_name}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {previewDoc?.review_notes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <strong>Catatan Tim Kurikulum:</strong> {previewDoc.review_notes}
                </div>
              )}

              {/* Content Display */}
              <div className="p-4 bg-muted/40 rounded-xl border max-h-[50vh] overflow-y-auto font-sans text-xs space-y-3">
                {previewDoc?.content_json && typeof previewDoc.content_json === 'object' ? (
                  <div className="space-y-3">
                    {Object.entries(previewDoc.content_json).map(([key, value]) => {
                      if (typeof value === 'string') {
                        return (
                          <div key={key} className="space-y-1">
                            <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">{key}</h4>
                            <div className="p-2.5 bg-background rounded border text-muted-foreground whitespace-pre-wrap">
                              {value}
                            </div>
                          </div>
                        );
                      }
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="space-y-1">
                            <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">{key}</h4>
                            <ul className="list-disc pl-5 space-y-1 bg-background p-2.5 rounded border text-muted-foreground">
                              {value.map((item, idx) => (
                                <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <details className="text-[11px] text-muted-foreground pt-2">
                      <summary className="cursor-pointer font-bold">Lihat Format Data Mentah (JSON)</summary>
                      <pre className="p-2 bg-background rounded border mt-2 overflow-x-auto">
                        {JSON.stringify(previewDoc.content_json, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Konten dokumen tidak tersedia dalam format teks.</p>
                )}
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex justify-between items-center sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewDoc(null)}
              >
                Tutup
              </Button>
              {canReview && previewDoc && (
                <Button
                  size="sm"
                  onClick={() => {
                    const target = previewDoc;
                    setPreviewDoc(null);
                    handleOpenReview(target);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Review Dokumen Ini
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* DIALOG 3: PRATINJAU DOKUMEN WORKSPACE GURU */}
        {/* ========================================================================= */}
        <Dialog open={!!previewWorkspaceDoc} onOpenChange={(open) => !open && setPreviewWorkspaceDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-foreground shadow-brutal bg-card">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs font-bold uppercase">
                  {previewWorkspaceDoc?.document_type}
                </Badge>
                <span className="bg-amber-100 text-amber-900 border font-bold text-[10px] px-2 py-0.5 rounded-full">
                  Dokumen Workspace Guru
                </span>
              </div>
              <DialogTitle className="text-lg font-black text-foreground pt-1">
                {previewWorkspaceDoc?.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {previewWorkspaceDoc?.subject} • {previewWorkspaceDoc?.grade ? `${previewWorkspaceDoc.grade}` : ''}{' '}
                {previewWorkspaceDoc?.phase ? `(Fase ${previewWorkspaceDoc.phase})` : ''} • Penyusun:{' '}
                <strong>{previewWorkspaceDoc?.teacher_name}</strong> ({previewWorkspaceDoc?.teacher_email})
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Content Display */}
              <div className="p-4 bg-muted/40 rounded-xl border max-h-[50vh] overflow-y-auto font-sans text-xs space-y-3">
                {previewWorkspaceDoc?.content_json && typeof previewWorkspaceDoc.content_json === 'object' ? (
                  <div className="space-y-3">
                    {Object.entries(previewWorkspaceDoc.content_json).map(([key, value]) => {
                      if (typeof value === 'string') {
                        return (
                          <div key={key} className="space-y-1">
                            <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">{key}</h4>
                            <div className="p-2.5 bg-background rounded border text-muted-foreground whitespace-pre-wrap">
                              {value}
                            </div>
                          </div>
                        );
                      }
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="space-y-1">
                            <h4 className="font-bold uppercase tracking-wider text-primary text-[11px]">{key}</h4>
                            <ul className="list-disc pl-5 space-y-1 bg-background p-2.5 rounded border text-muted-foreground">
                              {value.map((item, idx) => (
                                <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <details className="text-[11px] text-muted-foreground pt-2">
                      <summary className="cursor-pointer font-bold">Lihat Format Data Mentah (JSON)</summary>
                      <pre className="p-2 bg-background rounded border mt-2 overflow-x-auto">
                        {JSON.stringify(previewWorkspaceDoc.content_json, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Konten dokumen tidak tersedia dalam format teks.</p>
                )}
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewWorkspaceDoc(null)}
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {previewWorkspaceDoc && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!school?.id) return;
                      const docId = previewWorkspaceDoc.id;
                      setPreviewWorkspaceDoc(null);
                      await handlePromoteToBank({ document_id: docId } as any, false);
                    }}
                    className="bg-[#fef08a] hover:bg-[#fde047] text-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Masukkan ke Bank Sekolah</span>
                  </Button>
                )}

                {canReview && previewWorkspaceDoc && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!school?.id) return;
                      const docId = previewWorkspaceDoc.id;
                      setPreviewWorkspaceDoc(null);
                      await handlePromoteToBank({ document_id: docId } as any, true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Jadikan Template Resmi</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* DIALOG 4: DISKUSI & FEEDBACK */}
        {/* ========================================================================= */}
        <Dialog open={!!commentDoc} onOpenChange={(open) => !open && setCommentDoc(null)}>
          <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Diskusi & Masukan Dokumen
              </DialogTitle>
              <DialogDescription className="text-xs">
                {commentDoc?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* List Diskusi */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {commentsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 font-medium">
                    Belum ada komentar atau masukan untuk dokumen ini.
                  </p>
                ) : (
                  commentsList.map((c) => (
                    <div key={c.id} className="p-3 bg-muted/60 rounded-xl border-2 border-foreground/20 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-black text-foreground">{c.user_name || 'Rekan Guru'}</span>
                        <span className="font-mono">
                          {new Date(c.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed font-medium">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Form Tambah Komentar */}
              <form onSubmit={handleSendComment} className="space-y-2 pt-2 border-t-2 border-foreground/10">
                <Textarea
                  placeholder="Tulis masukan, apresiasi, atau pertanyaan..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                  required
                  className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPostingComment || !newCommentText.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm rounded-xl"
                  >
                    {isPostingComment ? 'Mengirim...' : 'Kirim Feedback'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SchoolLayout>
  );
}
