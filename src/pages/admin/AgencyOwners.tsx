import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Store, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface AgencyOwner {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  whatsapp_number: string | null;
  mini_quota: number; mini_used: number;
  lite_quota: number; lite_used: number;
  pro_quota: number;  pro_used: number;
  max_quota: number;  max_used: number;
  is_active: boolean;
}

const TIERS = ['mini', 'lite', 'pro', 'max'] as const;
type Tier = typeof TIERS[number];

export default function AgencyOwners() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['agency-owners-admin'] });
  const { data, isLoading } = useQuery({
    queryKey: ['agency-owners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_owners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AgencyOwner[];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['agency-packages-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_packages')
        .select('id,name,tier,quota,price_idr')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-7 h-7" />
          <h1 className="text-3xl font-extrabold">Reseller / Agency Owner</h1>
        </div>

        <AddOwnerForm onAdded={refresh} />

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada reseller. Tambahkan di atas.</p>
        ) : (
          <div className="space-y-4">
            {data!.map(o => <OwnerCard key={o.id} owner={o} onChanged={refresh} />)}
          </div>
        )}

        {packages && packages.length > 0 && (
          <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
            <h3 className="font-extrabold mb-3">Daftar Paket Aktif (referensi restock)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {packages.map((p: any) => (
                <div key={p.id} className="font-mono text-xs bg-secondary px-3 py-2 rounded border border-foreground/20">
                  <span className="font-bold">{p.tier.toUpperCase()}</span> — {p.name} ({p.quota} slot) → Rp {p.price_idr.toLocaleString('id-ID')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AddOwnerForm({ onAdded }: { onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [wa, setWa] = useState('');
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!email.trim() || !name.trim()) return toast.error('Email & nama wajib');
    setLoading(true);
    // Lookup user_id by email via profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (!profile?.user_id) {
      setLoading(false);
      return toast.error('User belum register. Minta dia daftar dulu, lalu coba lagi.');
    }
    const { error } = await supabase.from('agency_owners').insert({
      user_id: profile.user_id,
      email: email.trim().toLowerCase(),
      company_name: name.trim(),
      whatsapp_number: wa.trim() || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Reseller ditambahkan');
    setEmail(''); setName(''); setWa('');
    onAdded();
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm space-y-3">
      <h3 className="font-extrabold flex items-center gap-2"><Plus className="w-5 h-5" /> Tambah Reseller Baru</h3>
      <p className="text-xs text-muted-foreground">User harus sudah register di aplikasi lebih dulu.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input placeholder="email@user.com" className="border-2 border-foreground rounded-lg px-3 py-2"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Nama / Perusahaan" className="border-2 border-foreground rounded-lg px-3 py-2"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="No WhatsApp" className="border-2 border-foreground rounded-lg px-3 py-2"
          value={wa} onChange={(e) => setWa(e.target.value)} />
        <button onClick={add} disabled={loading}
          className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg py-2 font-bold disabled:opacity-50 shadow-brutal-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '+ Tambah'}
        </button>
      </div>
    </div>
  );
}

function OwnerCard({ owner, onChanged }: { owner: AgencyOwner; onChanged: () => void }) {
  const [adjusting, setAdjusting] = useState<Tier | null>(null);
  const [delta, setDelta] = useState(0);
  const [saving, setSaving] = useState(false);

  const adjust = async () => {
    if (!adjusting || delta === 0) return;
    setSaving(true);
    const field = `${adjusting}_quota` as const;
    const newQuota = (owner as any)[field] + delta;
    if (newQuota < (owner as any)[`${adjusting}_used`]) {
      setSaving(false);
      return toast.error('Kuota tidak boleh < terpakai');
    }
    const { error } = await supabase.from('agency_owners')
      .update({ [field]: newQuota } as any)
      .eq('id', owner.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Kuota ${adjusting.toUpperCase()} diupdate`);
    setAdjusting(null); setDelta(0);
    onChanged();
  };

  const toggleActive = async () => {
    const { error } = await supabase.from('agency_owners')
      .update({ is_active: !owner.is_active }).eq('id', owner.id);
    if (error) return toast.error(error.message);
    toast.success(owner.is_active ? 'Reseller dinonaktifkan' : 'Reseller diaktifkan');
    onChanged();
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-extrabold text-lg">{owner.company_name}</div>
          <div className="text-sm text-muted-foreground">{owner.email}</div>
          {owner.whatsapp_number && <div className="text-xs text-muted-foreground">WA: {owner.whatsapp_number}</div>}
        </div>
        <button onClick={toggleActive}
          className={`px-3 py-1 rounded-md border-2 border-foreground text-xs font-bold ${owner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
          {owner.is_active ? '● Aktif' : '○ Nonaktif'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TIERS.map(t => (
          <div key={t} className="border-2 border-foreground rounded-lg p-2 bg-secondary/30">
            <div className="text-xs font-bold opacity-70">{t.toUpperCase()} Sisa</div>
            <div className="text-xl font-extrabold">{(owner as any)[`${t}_quota`] - (owner as any)[`${t}_used`]}</div>
            <div className="text-xs text-muted-foreground">{(owner as any)[`${t}_used`]} / {(owner as any)[`${t}_quota`]}</div>
            <button onClick={() => { setAdjusting(t); setDelta(0); }}
              className="mt-1 text-xs font-bold underline hover:text-primary flex items-center gap-1">
              <Settings2 className="w-3 h-3" /> Adjust
            </button>
          </div>
        ))}
      </div>

      {adjusting && (
        <div className="mt-3 p-3 bg-secondary border-2 border-foreground rounded-lg flex flex-wrap items-center gap-2">
          <span className="font-bold">Tambah kuota {adjusting.toUpperCase()}:</span>
          <input type="number" className="border-2 border-foreground rounded px-2 py-1 w-32"
            value={delta} onChange={(e) => setDelta(parseInt(e.target.value) || 0)} placeholder="mis. 10 / -5" />
          <button onClick={adjust} disabled={saving}
            className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-1 font-bold text-sm disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </button>
          <button onClick={() => { setAdjusting(null); setDelta(0); }} className="text-sm underline">Batal</button>
        </div>
      )}
    </div>
  );
}
