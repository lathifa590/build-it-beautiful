import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmContext';

interface Promo {
  id: string;
  title: string;
  description: string | null;
  badge_text: string;
  discount_percent: number;
  target_tier: 'mini' | 'lite' | 'pro' | 'max' | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const TIERS = ['mini', 'lite', 'pro', 'max'] as const;

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function AgencyPromos() {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState<Promo | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['agency-promos-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_promos' as any)
        .select('*')
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Promo[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['agency-promos-admin'] });

  const remove = async (id: string) => {
    const confirmed = await confirm({
      title: "Hapus Promo?",
      description: "Yakin ingin menghapus promo ini?",
      confirmText: "Hapus",
      variant: "destructive"
    });
    if (!confirmed) return;
    const { error } = await supabase.from('agency_promos' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Promo dihapus');
    refresh();
  };

  const toggle = async (p: Promo) => {
    const { error } = await supabase.from('agency_promos' as any)
      .update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7" />
            <h1 className="text-3xl font-extrabold">Promo Agency</h1>
          </div>
          <button onClick={() => { setEditing(null); setOpen(true); }}
            className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-2 font-bold shadow-brutal-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Promo
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada promo. Tambahkan promo pertama Anda.</p>
        ) : (
          <div className="space-y-3">
            {data!.map(p => {
              const now = Date.now();
              const live = p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() > now;
              return (
                <div key={p.id} className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-extrabold tracking-wider">
                          {p.badge_text}
                        </span>
                        {p.target_tier && (
                          <span className="border-2 border-foreground px-2 py-0.5 rounded text-xs font-bold">
                            {p.target_tier.toUpperCase()}
                          </span>
                        )}
                        <span className="text-emerald-700 font-extrabold text-sm">-{p.discount_percent}%</span>
                        {live ? (
                          <span className="text-xs font-bold text-emerald-600">● LIVE</span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">○ Idle</span>
                        )}
                      </div>
                      <div className="font-extrabold mt-1">{p.title}</div>
                      {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(p.starts_at).toLocaleString('id-ID')} → {new Date(p.ends_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggle(p)}
                        className={`px-2 py-1 rounded border-2 border-foreground text-xs font-bold ${p.is_active ? 'bg-emerald-100' : 'bg-secondary'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                      <button onClick={() => { setEditing(p); setOpen(true); }}
                        className="p-2 rounded border-2 border-foreground hover:bg-secondary">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(p.id)}
                        className="p-2 rounded border-2 border-foreground hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {open && <PromoModal initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); refresh(); }} />}
      </div>
    </AdminLayout>
  );
}

function PromoModal({ initial, onClose, onSaved }: { initial: Promo | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [badge, setBadge] = useState(initial?.badge_text ?? 'FLASH SALE');
  const [discount, setDiscount] = useState(initial?.discount_percent ?? 10);
  const [tier, setTier] = useState<string>(initial?.target_tier ?? '');
  const [starts, setStarts] = useState(initial ? toLocalInput(initial.starts_at) : toLocalInput(new Date().toISOString()));
  const [ends, setEnds] = useState(initial ? toLocalInput(initial.ends_at) : toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()));
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error('Judul wajib');
    if (new Date(ends) <= new Date(starts)) return toast.error('Tanggal berakhir harus setelah mulai');
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: desc.trim() || null,
      badge_text: badge.trim() || 'PROMO',
      discount_percent: discount,
      target_tier: tier || null,
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(ends).toISOString(),
      is_active: active,
    };
    const { error } = initial
      ? await supabase.from('agency_promos' as any).update(payload).eq('id', initial.id)
      : await supabase.from('agency_promos' as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? 'Promo diupdate' : 'Promo dibuat');
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border-2 border-foreground rounded-xl p-5 shadow-brutal-sm max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-lg">{initial ? 'Edit' : 'Tambah'} Promo</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Judul">
            <input className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diskon Akhir Tahun" />
          </Field>
          <Field label="Deskripsi">
            <textarea rows={2} className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge"><input className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={badge} onChange={(e) => setBadge(e.target.value)} /></Field>
            <Field label="Diskon (%)"><input type="number" min={0} max={100} className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={discount} onChange={(e) => setDiscount(parseInt(e.target.value) || 0)} /></Field>
          </div>
          <Field label="Tier Target (kosong = semua)">
            <select className="w-full border-2 border-foreground rounded-lg px-3 py-2 bg-card"
              value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="">Semua Tier</option>
              {TIERS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai"><input type="datetime-local" className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
            <Field label="Berakhir"><input type="datetime-local" className="w-full border-2 border-foreground rounded-lg px-3 py-2"
              value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Aktif
          </label>
          <button onClick={save} disabled={saving}
            className="w-full bg-primary text-primary-foreground border-2 border-foreground rounded-lg py-2 font-bold shadow-brutal-sm disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1">{label}</label>
      {children}
    </div>
  );
}
