import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AgencyPackage {
  id: string;
  code: string;
  name: string;
  tier: 'mini' | 'lite' | 'pro' | 'max';
  quota: number;
  price_idr: number;
  sort_order: number;
  is_active: boolean;
}

const TIERS = ['mini', 'lite', 'pro', 'max'] as const;

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function AgencyPackages() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['agency-packages-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_packages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as AgencyPackage[];
    },
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7" />
          <h1 className="text-3xl font-extrabold">Paket Agency</h1>
        </div>
        <p className="text-muted-foreground">
          Atur harga, kuota, dan status paket grosir untuk reseller. Perubahan langsung berlaku.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {data?.map((pkg) => <PackageRow key={pkg.id} pkg={pkg} onSaved={() => qc.invalidateQueries({ queryKey: ['agency-packages-admin'] })} />)}
            <NewPackageRow onCreated={() => qc.invalidateQueries({ queryKey: ['agency-packages-admin'] })} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function PackageRow({ pkg, onSaved }: { pkg: AgencyPackage; onSaved: () => void }) {
  const [form, setForm] = useState(pkg);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(pkg), [pkg]);

  const dirty = JSON.stringify(form) !== JSON.stringify(pkg);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('agency_packages')
      .update({
        name: form.name,
        tier: form.tier,
        quota: form.quota,
        price_idr: form.price_idr,
        sort_order: form.sort_order,
        is_active: form.is_active,
      })
      .eq('id', pkg.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Paket disimpan');
    onSaved();
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="text-xs font-bold">Nama</label>
          <input className="w-full border-2 border-foreground rounded-lg px-3 py-2"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">{pkg.code}</p>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-bold">Tier</label>
          <select className="w-full border-2 border-foreground rounded-lg px-2 py-2 bg-background"
            value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as any })}>
            {TIERS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-bold">Kuota</label>
          <input type="number" min={1} className="w-full border-2 border-foreground rounded-lg px-3 py-2"
            value={form.quota} onChange={(e) => setForm({ ...form, quota: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold">Harga (Rp)</label>
          <input type="number" min={0} className="w-full border-2 border-foreground rounded-lg px-3 py-2"
            value={form.price_idr} onChange={(e) => setForm({ ...form, price_idr: parseInt(e.target.value) || 0 })} />
          <p className="text-xs text-muted-foreground mt-1">{formatIDR(form.price_idr)}</p>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-bold">Urutan</label>
          <input type="number" className="w-full border-2 border-foreground rounded-lg px-3 py-2"
            value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="md:col-span-2 flex items-center gap-2 pt-5">
          <input type="checkbox" id={`active-${pkg.id}`} checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-5 h-5 accent-primary" />
          <label htmlFor={`active-${pkg.id}`} className="font-bold text-sm">Aktif</label>
        </div>
        <div className="md:col-span-2">
          <button disabled={!dirty || saving} onClick={save}
            className="w-full bg-primary text-primary-foreground border-2 border-foreground rounded-lg py-2 font-bold disabled:opacity-50 shadow-brutal-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewPackageRow({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    tier: 'pro' as 'mini' | 'lite' | 'pro' | 'max',
    quota: 10,
    price_idr: 0,
    sort_order: 100,
  });
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast.error('Code & nama wajib diisi');
    setSaving(true);
    const { error } = await supabase.from('agency_packages').insert({ ...form, is_active: true });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Paket dibuat');
    setForm({ code: '', name: '', tier: 'pro', quota: 10, price_idr: 0, sort_order: 100 });
    setOpen(false);
    onCreated();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-foreground/40 rounded-xl py-4 text-foreground/60 hover:bg-secondary flex items-center justify-center gap-2 font-bold">
        <Plus className="w-5 h-5" /> Tambah Paket Baru
      </button>
    );
  }

  return (
    <div className="bg-secondary border-2 border-foreground rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <input placeholder="Kode (mis. agency_pro_x)" className="md:col-span-3 border-2 border-foreground rounded-lg px-3 py-2"
          value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input placeholder="Nama paket" className="md:col-span-3 border-2 border-foreground rounded-lg px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="md:col-span-1 border-2 border-foreground rounded-lg px-2 py-2 bg-background"
          value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as any })}>
          {TIERS.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <input type="number" placeholder="Kuota" className="md:col-span-1 border-2 border-foreground rounded-lg px-3 py-2"
          value={form.quota} onChange={(e) => setForm({ ...form, quota: parseInt(e.target.value) || 0 })} />
        <input type="number" placeholder="Harga" className="md:col-span-2 border-2 border-foreground rounded-lg px-3 py-2"
          value={form.price_idr} onChange={(e) => setForm({ ...form, price_idr: parseInt(e.target.value) || 0 })} />
        <input type="number" placeholder="Urutan" className="md:col-span-1 border-2 border-foreground rounded-lg px-3 py-2"
          value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
        <button onClick={create} disabled={saving}
          className="md:col-span-1 bg-primary text-primary-foreground border-2 border-foreground rounded-lg py-2 font-bold disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Buat'}
        </button>
      </div>
      <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">Batal</button>
    </div>
  );
}
