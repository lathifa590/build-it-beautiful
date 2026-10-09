import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  X,
  ExternalLink,
  Loader2,
  Check,
  Copy,
  FolderOpen,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmContext';

export interface AgencyMaterial {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  button_label: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const CATEGORIES = [
  'Google Drive',
  'Canva',
  'Copywriting WA',
  'Video Promosi',
  'Flyer & Banner',
  'Panduan Agency',
  'Lainnya',
];

export default function AgencyMaterials() {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState<AgencyMaterial | null>(null);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [buttonLabel, setButtonLabel] = useState('Buka Materi');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['agency-materials-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_materials' as any)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AgencyMaterial[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['agency-materials-admin'] });

  const handleOpenAdd = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setCategory(CATEGORIES[0]);
    setButtonLabel('Buka Materi');
    setSortOrder(materials ? (materials.length + 1) * 10 : 10);
    setIsActive(true);
    setOpen(true);
  };

  const handleOpenEdit = (item: AgencyMaterial) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setUrl(item.url);
    setCategory(item.category || CATEGORIES[0]);
    setButtonLabel(item.button_label || 'Buka Materi');
    setSortOrder(item.sort_order ?? 0);
    setIsActive(item.is_active);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error('Judul dan URL materi wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim(),
        category: category.trim() || 'Lainnya',
        button_label: buttonLabel.trim() || 'Buka Materi',
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from('agency_materials' as any)
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Materi promosi berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('agency_materials' as any)
          .insert([payload]);
        if (error) throw error;
        toast.success('Materi promosi baru berhasil ditambahkan');
      }

      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    const confirmed = await confirm({
      title: 'Hapus Materi Promosi?',
      description: `Yakin ingin menghapus "${itemTitle}"? Materi ini tidak akan muncul lagi di dashboard agency.`,
      confirmText: 'Hapus',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const { error } = await supabase
      .from('agency_materials' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Materi promosi berhasil dihapus');
    refresh();
  };

  const handleToggleActive = async (item: AgencyMaterial) => {
    const { error } = await supabase
      .from('agency_materials' as any)
      .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Materi ${!item.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
    refresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Link berhasil disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl border-2 border-foreground flex items-center justify-center shadow-brutal-sm">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Materi Promosi Agency</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola tautan amunisi promosi (Google Drive, Canva, copywriting broadcast) yang muncul langsung di dashboard akun Agency/Reseller.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-2 font-bold shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Materi
          </button>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !materials || materials.length === 0 ? (
          <div className="bg-card border-2 border-foreground rounded-xl p-8 text-center shadow-brutal space-y-3">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-60" />
            <p className="text-lg font-bold">Belum Ada Materi Promosi</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tambahkan link Google Drive flyer, template Canva, atau copywriting pertama Anda agar Agency dapat segera mulai promosi.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-2 font-bold shadow-brutal-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Materi Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((item) => (
              <div
                key={item.id}
                className={`bg-card border-2 border-foreground rounded-xl p-4 md:p-5 shadow-brutal-sm transition-all ${
                  !item.is_active ? 'opacity-65 bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-primary/20 text-foreground border border-foreground/30 px-2.5 py-0.5 rounded text-xs font-bold">
                        {item.category}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        Urutan: #{item.sort_order}
                      </span>
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-bold">
                          <Eye className="w-3 h-3" /> Tampil di Dashboard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded text-xs font-bold">
                          <EyeOff className="w-3 h-3" /> Disembunyikan
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-foreground">{item.title}</h3>

                    {item.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-secondary/30 p-2.5 rounded-lg border border-foreground/10">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground break-all">
                      <span className="font-bold">Target Link:</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1 font-mono"
                      >
                        {item.url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start flex-wrap">
                    <button
                      onClick={() => copyToClipboard(item.url, item.id)}
                      title="Salin Link"
                      className="p-2 border-2 border-foreground rounded-lg bg-card hover:bg-secondary font-bold text-xs flex items-center gap-1"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">Salin</span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 border-2 border-foreground rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 hover:brightness-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{item.button_label}</span>
                    </a>
                    <button
                      onClick={() => handleToggleActive(item)}
                      title={item.is_active ? 'Sembunyikan' : 'Tampilkan'}
                      className={`p-2 border-2 border-foreground rounded-lg font-bold text-xs ${
                        item.is_active
                          ? 'bg-card hover:bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Materi"
                      className="p-2 border-2 border-foreground rounded-lg bg-card hover:bg-secondary text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      title="Hapus Materi"
                      className="p-2 border-2 border-destructive rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Add / Edit */}
        {open && (
          <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border-2 border-foreground rounded-xl w-full max-w-xl p-6 shadow-brutal max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-extrabold">
                    {editing ? 'Edit Materi Promosi' : 'Tambah Materi Promosi'}
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-secondary border border-transparent hover:border-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Judul Materi Promosi *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Flyer & Banner Desain Promosi (Google Drive)"
                    className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                      Label Tombol Akses
                    </label>
                    <input
                      type="text"
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                      placeholder="Contoh: Buka Google Drive"
                      className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    URL Tautan (Link Tujuan) *
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/... atau https://canva.com/..."
                    className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Pastikan tautan dapat diakses (misal Google Drive diatur ke "Siapa saja yang memiliki link").
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                    Copywriting / Keterangan Relevan (Ringkas)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Download kumpulan flyer siap posting, logo resolusi tinggi, dan banner promosi untuk membantu Anda menawarkan Paket Standar ke para guru."
                    className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deskripsi singkat ini akan langsung dibaca oleh agency di dashboard mereka.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                      Urutan Tampil (Sort Order)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-[11px] text-muted-foreground">Angka lebih kecil tampil lebih awal</span>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded border-foreground cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm font-bold cursor-pointer select-none">
                      Aktifkan (Tampilkan ke Agency)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t-2 border-foreground pt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="border-2 border-foreground rounded-lg px-4 py-2 font-bold hover:bg-secondary text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-5 py-2 font-bold shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editing ? 'Simpan Perubahan' : 'Tambah Materi'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
