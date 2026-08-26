import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Store, Users, Mail, ShoppingCart, LogOut, Home,
  CheckCircle2, Clock, XCircle, Send, MessageCircle, Sparkles, AlertTriangle, RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmContext';

const SUPPORT_WA = '6288228511309';
const TIERS = ['mini', 'lite', 'pro', 'max'] as const;
type Tier = typeof TIERS[number];

interface AgencyOwner {
  id: string;
  company_name: string;
  email: string;
  whatsapp_number: string | null;
  mini_quota: number; mini_used: number;
  lite_quota: number; lite_used: number;
  pro_quota: number;  pro_used: number;
  max_quota: number;  max_used: number;
  is_active: boolean;
}

export default function AgencyDashboard() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();

  const { data: owner, isLoading } = useQuery({
    queryKey: ['agency-owner-self', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_owners')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data as AgencyOwner;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['agency-packages-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });

  const { data: invites } = useQuery({
    queryKey: ['agency-invites', owner?.id],
    enabled: !!owner,
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_invites')
        .select('*')
        .eq('agency_owner_id', owner!.id)
        .order('invited_at', { ascending: false });
      return data || [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ['agency-members', owner?.id],
    enabled: !!owner,
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_members')
        .select('*')
        .eq('agency_owner_id', owner!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: promos } = useQuery({
    queryKey: ['agency-promos-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agency_promos' as any)
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true });
      return (data || []) as any[];
    },
  });

  const refresh = async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: ['agency-owner-self', user?.id] }),
      qc.refetchQueries({ queryKey: ['agency-invites', owner?.id] }),
      qc.refetchQueries({ queryKey: ['agency-members', owner?.id] }),
    ]);
  };

  if (isLoading || !owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-foreground sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl border-2 border-foreground flex items-center justify-center shadow-brutal-sm">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg">{owner.company_name}</h1>
              <p className="text-xs text-muted-foreground">Dashboard Agency / Reseller</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app" className="px-3 py-2 rounded-lg border-2 border-foreground text-sm font-bold hover:bg-secondary flex items-center gap-1">
              <Home className="w-4 h-4" /> Aplikasi
            </Link>
            <button onClick={() => signOut()} className="px-3 py-2 rounded-lg border-2 border-foreground text-sm font-bold hover:bg-destructive/10 text-destructive flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Promo banners */}
        {promos && promos.length > 0 && (
          <div className="space-y-2">
            {promos.map((p: any) => (
              <div key={p.id} className="bg-gradient-to-r from-primary/10 to-amber-100 border-2 border-foreground rounded-xl p-3 shadow-brutal-sm flex items-center gap-3 flex-wrap">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-extrabold tracking-wider">{p.badge_text}</span>
                {p.target_tier && <span className="border-2 border-foreground px-2 py-0.5 rounded text-xs font-bold bg-card">{p.target_tier.toUpperCase()}</span>}
                <span className="font-extrabold">{p.title}</span>
                <span className="text-emerald-700 font-extrabold">-{p.discount_percent}%</span>
                {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                <span className="text-xs text-muted-foreground ml-auto">Berakhir {new Date(p.ends_at).toLocaleDateString('id-ID')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expired member warning */}
        {members && members.some((m: any) => new Date(m.expires_at).getTime() < Date.now() || !m.is_active) && (
          <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-3 shadow-brutal-sm flex items-center gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <span><b>Perhatian:</b> Ada member yang sudah expired/nonaktif. Gunakan tombol <b>Re-invite</b> di tabel member untuk mengaktifkan kembali.</span>
          </div>
        )}

        {/* Quota cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIERS.map(t => {
            const quota = (owner as any)[`${t}_quota`];
            const used = (owner as any)[`${t}_used`];
            const remain = quota - used;
            return (
              <div key={t} className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
                <div className="text-xs font-extrabold tracking-widest opacity-70">{t.toUpperCase()}</div>
                <div className="text-3xl font-extrabold mt-1">{remain}</div>
                <div className="text-xs text-muted-foreground">sisa dari {quota} slot</div>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: quota > 0 ? `${(used / quota) * 100}%` : '0%' }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{used} terpakai</div>
              </div>
            );
          })}
        </div>

        {/* Restock CTA */}
        <RestockCard owner={owner} packages={packages || []} />

        {/* Invite form */}
        <InviteForm owner={owner} onInvited={refresh} />

        {/* Active members */}
        <Section title="Member Aktif" icon={<Users className="w-5 h-5" />} count={members?.length ?? 0}>
          {members && members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground/20 text-left">
                    <th className="py-2 px-2">Email</th>
                    <th className="py-2 px-2">Tier</th>
                    <th className="py-2 px-2">Berlaku Hingga</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => {
                    const exp = new Date(m.expires_at);
                    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
                    const expired = !m.is_active || daysLeft <= 0;
                    return (
                      <tr key={m.id} className="border-b border-foreground/10">
                        <td className="py-2 px-2 font-mono text-xs">{m.email}</td>
                        <td className="py-2 px-2"><span className="px-2 py-0.5 rounded border border-foreground/30 text-xs font-bold">{m.tier.toUpperCase()}</span></td>
                        <td className="py-2 px-2 text-xs">{exp.toLocaleDateString('id-ID')} <span className="text-muted-foreground">({daysLeft}h)</span></td>
                        <td className="py-2 px-2">
                          {!expired ? (
                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aktif</span>
                          ) : (
                            <span className="text-destructive text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Expired</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {expired && <ReinviteButton email={m.email} tier={m.tier} owner={owner} onDone={refresh} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada member aktif.</p>
          )}
        </Section>

        {/* Invites */}
        <Section title="Riwayat Invite" icon={<Mail className="w-5 h-5" />} count={invites?.length ?? 0}>
          {invites && invites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground/20 text-left">
                    <th className="py-2 px-2">Email</th>
                    <th className="py-2 px-2">Tier</th>
                    <th className="py-2 px-2">Tanggal</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i: any) => (
                    <tr key={i.id} className="border-b border-foreground/10">
                      <td className="py-2 px-2 font-mono text-xs">{i.email}</td>
                      <td className="py-2 px-2"><span className="px-2 py-0.5 rounded border border-foreground/30 text-xs font-bold">{i.tier.toUpperCase()}</span></td>
                      <td className="py-2 px-2 text-xs">{new Date(i.invited_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-2 px-2">
                        {i.status === 'accepted' ? (
                          <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Diterima</span>
                        ) : i.status === 'pending' ? (
                          <span className="text-amber-600 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-bold">{i.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada invite.</p>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
      <h3 className="font-extrabold flex items-center gap-2 mb-3">
        {icon} {title} <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{count}</span>
      </h3>
      {children}
    </div>
  );
}

function RestockCard({ owner, packages }: { owner: AgencyOwner; packages: any[] }) {
  const [selected, setSelected] = useState<string>('');
  const pkg = packages.find(p => p.id === selected);

  const sendWA = () => {
    if (!pkg) return toast.error('Pilih paket dulu');
    const msg = encodeURIComponent(
      `Halo Admin ModulAjar,\n\nSaya ingin restock paket agency:\n\n` +
      `Reseller : ${owner.company_name}\n` +
      `Email    : ${owner.email}\n` +
      `Paket    : ${pkg.name} (${pkg.tier.toUpperCase()})\n` +
      `Slot     : ${pkg.quota}\n` +
      `Harga    : Rp ${pkg.price_idr.toLocaleString('id-ID')}\n\n` +
      `Mohon arahan pembayarannya. Terima kasih.`
    );
    window.open(`https://wa.me/${SUPPORT_WA}?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-primary/5 border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
      <h3 className="font-extrabold flex items-center gap-2 mb-1"><ShoppingCart className="w-5 h-5" /> Beli / Restock Kuota</h3>
      <p className="text-xs text-muted-foreground mb-3">Pilih paket, lalu kirim permintaan via WhatsApp ke admin.</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="border-2 border-foreground rounded-lg px-3 py-2 bg-card">
          <option value="">— Pilih Paket —</option>
          {packages.map(p => (
            <option key={p.id} value={p.id}>
              [{p.tier.toUpperCase()}] {p.name} — {p.quota} slot — Rp {p.price_idr.toLocaleString('id-ID')}
            </option>
          ))}
        </select>
        <button onClick={sendWA} disabled={!pkg}
          className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-2 font-bold disabled:opacity-50 shadow-brutal-sm flex items-center gap-2 justify-center">
          <MessageCircle className="w-4 h-4" /> Chat Admin
        </button>
      </div>
    </div>
  );
}

function InviteForm({ owner, onInvited }: { owner: AgencyOwner; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<Tier>('mini');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const remain = (owner as any)[`${tier}_quota`] - (owner as any)[`${tier}_used`];

  const invite = async () => {
    if (!email.trim()) return toast.error('Email wajib');
    if (remain < 1) return toast.error(`Kuota ${tier.toUpperCase()} habis. Silakan restock.`);
    setLoading(true);
    const { error } = await supabase.rpc('create_agency_invite', {
      _email: email.trim().toLowerCase(),
      _tier: tier,
      _custom_message: msg.trim() || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Invite dikirim ke ${email}`);
    setEmail(''); setMsg('');
    onInvited();
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal-sm">
      <h3 className="font-extrabold flex items-center gap-2 mb-1"><Send className="w-5 h-5" /> Aktifkan Member Baru</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Member akan otomatis aktif (1 tahun) saat mereka register dengan email yang sama.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2">
        <input type="email" placeholder="email@member.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-2 border-foreground rounded-lg px-3 py-2" />
        <select value={tier} onChange={(e) => setTier(e.target.value as Tier)}
          className="border-2 border-foreground rounded-lg px-3 py-2 bg-card font-bold">
          {TIERS.map(t => (
            <option key={t} value={t}>{t.toUpperCase()} (sisa {(owner as any)[`${t}_quota`] - (owner as any)[`${t}_used`]})</option>
          ))}
        </select>
        <button onClick={invite} disabled={loading || remain < 1}
          className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg px-4 py-2 font-bold disabled:opacity-50 shadow-brutal-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Aktifkan'}
        </button>
      </div>
      <textarea placeholder="Catatan untuk member (opsional)" value={msg}
        onChange={(e) => setMsg(e.target.value)} rows={2}
        className="w-full mt-2 border-2 border-foreground rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function ReinviteButton({ email, tier, owner, onDone }: { email: string; tier: string; owner: AgencyOwner; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();
  const remain = (owner as any)[`${tier}_quota`] - (owner as any)[`${tier}_used`];

  const reinvite = async () => {
    if (remain < 1) return toast.error(`Kuota ${tier.toUpperCase()} habis. Restock dulu.`);
    const confirmed = await confirm({
      title: "Kirim Ulang Invite?",
      description: `Kirim ulang invite untuk ${email} (tier ${tier.toUpperCase()})? Akan menggunakan 1 slot kuota.`,
      confirmText: "Kirim Ulang"
    });
    if (!confirmed) return;
    setLoading(true);
    const { error } = await supabase.rpc('create_agency_invite', {
      _email: email,
      _tier: tier,
      _custom_message: 'Re-invite — perpanjangan langganan',
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Re-invite dikirim ke ${email}`);
    onDone();
  };

  return (
    <button onClick={reinvite} disabled={loading || remain < 1}
      className="text-xs font-bold px-2 py-1 rounded border-2 border-foreground bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-1">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />} Re-invite
    </button>
  );
}

