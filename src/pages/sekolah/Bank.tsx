import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type { SchoolDocument, SchoolDocumentStatus, SchoolDocumentComment } from '@/types/school';
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

  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Preview Dialog State
  const [previewDoc, setPreviewDoc] = useState<SchoolDocument | null>(null);

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

  useEffect(() => {
    fetchDocuments();
  }, [school?.id]);

  // Filter Dokumen
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Tab filter
      if (activeTab === 'template' && !doc.is_template) return false;
      if (activeTab === 'approved' && doc.status !== 'approved') return false;
      if (activeTab === 'pending' && doc.status !== 'pending_review') return false;
      if (activeTab === 'revision' && doc.status !== 'revision') return false;

      // Type filter
      if (selectedType !== 'all' && doc.document_type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Search query
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

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = documents.length;
    const templates = documents.filter((d) => d.is_template).length;
    const approved = documents.filter((d) => d.status === 'approved').length;
    const pending = documents.filter((d) => d.status === 'pending_review').length;
    const revision = documents.filter((d) => d.status === 'revision').length;
    return { total, templates, approved, pending, revision };
  }, [documents]);

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
        fetchDocuments();
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
      fetchDocuments();
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

  return (
    <SchoolLayout
      pageTitle="Bank Modul & Koleksi Perangkat Ajar"
      pageDescription="Pusat berbagi perangkat ajar guru, kurasi mutu kurikulum, dan template resmi sekolah."
      headerActions={null}
    >
      <div className="space-y-6">
        {/* Banner Info */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fff3ed] shadow-brutal-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center shrink-0 shadow-brutal-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">
                Pusat Sumber Belajar & Penjaminan Mutu
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {canReview
                  ? 'Verifikasi perangkat ajar guru menggunakan rubrik checklist penjaminan mutu kurikulum atau tetapkan sebagai Template Resmi.'
                  : 'Pelajari perangkat ajar rekan guru satu sekolah atau gunakan template resmi yang telah disetujui Waka Kurikulum.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="bg-card text-foreground border-2 border-foreground font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Total {stats.total} Dokumen
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
                placeholder="Cari judul modul, mata pelajaran, atau guru..."
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
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchDocuments}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-card border-2 border-foreground rounded-full shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-black transition-all shrink-0"
              title="Segarkan data dokumen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Pill Tabs */}
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

        {/* Document Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-foreground rounded-2xl bg-card shadow-brutal">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="font-bold text-sm">Memuat koleksi modul sekolah...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-foreground/30 rounded-2xl bg-card space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <h3 className="font-bold text-base text-foreground">Belum ada dokumen yang sesuai</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Guru dapat membagikan modul ajar dari workspace pribadinya dengan mengklik tombol "Bagikan ke Bank Sekolah".
            </p>
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
                      <Badge variant="outline" className="uppercase font-mono text-[10px] font-black bg-muted border-foreground/30">
                        {doc.document_type}
                      </Badge>
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

      {/* DIALOG 1: REVIEW & PENJAMINAN MUTU WAKA */}
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
                  <span>Alokasi Jam Pelajaran & Pekan Efektif sesuai Kalender Sekolah</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={checklist.asesmen_lengkap}
                    onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, asesmen_lengkap: !!c }))}
                  />
                  <span>Kelengkapan Instrumen & Rubrik Asesmen (Formatif / Sumatif)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={checklist.diferensiasi_ada}
                    onCheckedChange={(c) => setChecklist((prev) => ({ ...prev, diferensiasi_ada: !!c }))}
                  />
                  <span>Mengakomodasi Diferensiasi Pembelajaran (Konten/Proses/Produk)</span>
                </label>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Keputusan Verifikasi Mutu:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('approved')}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                    reviewStatus === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  ✅ Disetujui
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('revision')}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                    reviewStatus === 'revision'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  🔄 Perlu Revisi
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('pending_review')}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                    reviewStatus === 'pending_review'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  ⏳ Pending
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

      {/* DIALOG 2: PRATINJAU DOKUMEN LENGKAP */}
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

      {/* DIALOG 3: DISKUSI & MASUKAN */}
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
      </SchoolLayout>
    );
  }
