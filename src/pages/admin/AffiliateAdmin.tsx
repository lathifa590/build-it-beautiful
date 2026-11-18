import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useAffiliateSettings,
  useAdminAffiliates,
  useAdminUpdateAffiliate,
  useAdminAffiliateLeads,
  useAdminActivateAffiliateLead,
  useAdminAffiliateCommissions,
  useAdminAffiliatePayouts,
  useAdminProcessPayout,
  useAffiliateMarketingKits,
  useCreateMarketingKit,
  useUpdateMarketingKit,
  useDeleteMarketingKit,
  useAffiliateLeaderboard,
} from '@/hooks/useAffiliate';
import {
  Affiliate,
  AffiliateLead,
  AffiliatePayout,
  AffiliateMarketingKit,
  MarketingKitCategory,
} from '@/types/affiliate';
import { PACKAGES_CONFIG } from '@/types/orders';
import {
  ActivationMessageModal,
  CustomerActivationInfo,
  cleanPhoneForWhatsApp,
} from '@/components/admin/ActivationMessageModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Handshake,
  Users,
  UserCheck,
  Wallet,
  Megaphone,
  Settings,
  Check,
  XCircle,
  Search,
  Copy,
  Edit2,
  Trash2,
  Plus,
  Trophy,
  MessageCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminAffTab = 'affiliates' | 'leads' | 'payouts' | 'marketing' | 'settings';

export default function AffiliateAdmin({ initialTab }: { initialTab?: AdminAffTab }) {
  const location = useLocation();
  const navigate = useNavigate();

  const deriveTabFromPath = (): AdminAffTab => {
    if (initialTab) return initialTab;
    if (location.pathname.includes('/leads')) return 'leads';
    if (location.pathname.includes('/payouts')) return 'payouts';
    if (location.pathname.includes('/marketing-kit')) return 'marketing';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'affiliates';
  };

  const [activeTab, setActiveTab] = useState<AdminAffTab>(deriveTabFromPath);

  useEffect(() => {
    setActiveTab(deriveTabFromPath());
  }, [location.pathname, initialTab]);

  const handleSwitchTab = (tab: AdminAffTab) => {
    setActiveTab(tab);
    const pathMap: Record<AdminAffTab, string> = {
      affiliates: '/admin/affiliate',
      leads: '/admin/affiliate/leads',
      payouts: '/admin/affiliate/payouts',
      marketing: '/admin/affiliate/marketing-kit',
      settings: '/admin/affiliate/settings',
    };
    navigate(pathMap[tab], { replace: true });
  };

  // Queries & Mutations
  const { settings, updateSettings, isUpdating: isUpdatingSettings } = useAffiliateSettings();
  const { data: affiliates = [], isLoading: isLoadingAffs } = useAdminAffiliates();
  const updateAffiliateMutation = useAdminUpdateAffiliate();
  const { data: leads = [], isLoading: isLoadingLeads } = useAdminAffiliateLeads();
  const activateLeadMutation = useAdminActivateAffiliateLead();
  const { data: commissions = [] } = useAdminAffiliateCommissions();
  const { data: payouts = [], isLoading: isLoadingPayouts } = useAdminAffiliatePayouts();
  const processPayoutMutation = useAdminProcessPayout();
  const { data: marketingKits = [], isLoading: isLoadingKits } = useAffiliateMarketingKits();
  const createKitMutation = useCreateMarketingKit();
  const updateKitMutation = useUpdateMarketingKit();
  const deleteKitMutation = useDeleteMarketingKit();
  const { data: leaderboard = [] } = useAffiliateLeaderboard('month');

  // Search states
  const [affSearch, setAffSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState<'all' | 'trial' | 'paid'>('all');

  // Affiliate lookup map
  const affiliateById = useMemo(() => {
    const map = new Map<string, Affiliate>();
    affiliates.forEach((a) => map.set(a.id, a));
    return map;
  }, [affiliates]);

  // Aggregate per-affiliate stats
  const affStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { leads: number; conversions: number; totalCommission: number; pendingCommission: number }
    >();
    affiliates.forEach((a) =>
      map.set(a.id, { leads: 0, conversions: 0, totalCommission: 0, pendingCommission: 0 })
    );
    leads.forEach((l) => {
      if (l.referred_by_affiliate_id && map.has(l.referred_by_affiliate_id)) {
        map.get(l.referred_by_affiliate_id)!.leads += 1;
      }
    });
    commissions.forEach((c) => {
      if (map.has(c.affiliate_id) && (c.status === 'approved' || c.status === 'paid')) {
        const entry = map.get(c.affiliate_id)!;
        entry.conversions += 1;
        entry.totalCommission += Number(c.commission_amount || 0);
        if (c.status === 'approved') {
          entry.pendingCommission += Number(c.commission_amount || 0);
        }
      }
    });
    return map;
  }, [affiliates, leads, commissions]);

  // Global Dashboard Metrics
  const globalMetrics = useMemo(() => {
    const totalAffiliates = affiliates.length;
    const totalTrialLeads = leads.filter((l) => l.account_type === 'trial').length;
    const totalConversions = commissions.filter((c) => c.status === 'approved' || c.status === 'paid').length;
    const totalRevenue = commissions
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((s, c) => s + Number(c.order_amount || 0), 0);
    const pendingPayoutsCount = payouts.filter((p) => p.status === 'pending').length;
    const totalCommissionPaid = payouts
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + Number(p.net_amount || 0), 0);

    return {
      totalAffiliates,
      totalTrialLeads,
      totalConversions,
      totalRevenue,
      pendingPayoutsCount,
      totalCommissionPaid,
    };
  }, [affiliates, leads, commissions, payouts]);

  // Modal: Activate Affiliate Lead ("Tombol Centang")
  const [activatingLead, setActivatingLead] = useState<AffiliateLead | null>(null);
  const [selectedTier, setSelectedTier] = useState<'lite' | 'standar' | 'pro'>('standar');
  const [customPrice, setCustomPrice] = useState<string>('149000');
  const [activationWaModalOpen, setActivationWaModalOpen] = useState(false);
  const [activatedCustomerInfo, setActivatedCustomerInfo] = useState<CustomerActivationInfo | null>(null);

  const openActivateLeadModal = (lead: AffiliateLead) => {
    setActivatingLead(lead);
    setSelectedTier('standar');
    setCustomPrice(String(PACKAGES_CONFIG.standar.price));
  };

  const handleConfirmActivateLead = async () => {
    if (!activatingLead || !activatingLead.referred_by_affiliate_id) return;
    const aff = affiliateById.get(activatingLead.referred_by_affiliate_id);
    if (!aff) {
      toast.error('Data afiliator tidak ditemukan');
      return;
    }
    try {
      const info = await activateLeadMutation.mutateAsync({
        lead: activatingLead,
        affiliate: aff,
        packageKey: selectedTier,
        customPrice: Number(customPrice) || PACKAGES_CONFIG[selectedTier].price,
      });
      setActivatingLead(null);
      setActivatedCustomerInfo(info);
      setActivationWaModalOpen(true);
    } catch {
      // toast handled in hook
    }
  };

  // Modal: Edit Affiliate (commission rate & monthly trial quota)
  const [editingAff, setEditingAff] = useState<Affiliate | null>(null);
  const [editAffForm, setEditAffForm] = useState({
    commission_rate: 40,
    max_trials_per_month: '',
    is_active: true,
  });

  // Modal: Process Payout
  const [processingPayout, setProcessingPayout] = useState<AffiliatePayout | null>(null);
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState('');

  // Modal: Marketing Kit Create / Edit
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<AffiliateMarketingKit | null>(null);
  const [kitForm, setKitForm] = useState({
    title: '',
    category: 'copywriting' as MarketingKitCategory,
    description: '',
    content_text: '',
    asset_url: '',
    thumbnail_url: '',
    sort_order: 0,
    is_active: true,
  });

  const openCreateKit = () => {
    setEditingKit(null);
    setKitForm({
      title: '',
      category: 'copywriting',
      description: '',
      content_text: '',
      asset_url: '',
      thumbnail_url: '',
      sort_order: marketingKits.length + 1,
      is_active: true,
    });
    setKitDialogOpen(true);
  };

  const openEditKit = (kit: AffiliateMarketingKit) => {
    setEditingKit(kit);
    setKitForm({
      title: kit.title,
      category: kit.category,
      description: kit.description || '',
      content_text: kit.content_text || '',
      asset_url: kit.asset_url || '',
      thumbnail_url: kit.thumbnail_url || '',
      sort_order: kit.sort_order || 0,
      is_active: kit.is_active,
    });
    setKitDialogOpen(true);
  };

  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitForm.title.trim()) return toast.error('Judul materi wajib diisi');
    const payload = {
      title: kitForm.title.trim(),
      category: kitForm.category,
      description: kitForm.description.trim() || null,
      content_text: kitForm.content_text.trim() || null,
      asset_url: kitForm.asset_url.trim() || null,
      thumbnail_url: kitForm.thumbnail_url.trim() || null,
      sort_order: Number(kitForm.sort_order) || 0,
      is_active: kitForm.is_active,
    };
    if (editingKit) {
      await updateKitMutation.mutateAsync({ id: editingKit.id, updates: payload });
    } else {
      await createKitMutation.mutateAsync(payload);
    }
    setKitDialogOpen(false);
  };

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    default_commission_rate: 40,
    min_payout_free_fee: 50000,
    below_min_admin_fee: 2500,
    trial_quota_per_user: 25,
    max_trials_per_month: 30,
    is_program_active: true,
    leaderboard_period_title: 'Top 5 Afiliator Bulan Ini',
    leaderboard_start_date: '',
    leaderboard_end_date: '',
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        default_commission_rate: settings.default_commission_rate ?? 40,
        min_payout_free_fee: settings.min_payout_free_fee ?? 50000,
        below_min_admin_fee: settings.below_min_admin_fee ?? 2500,
        trial_quota_per_user: settings.trial_quota_per_user ?? 25,
        max_trials_per_month: settings.max_trials_per_month ?? 30,
        is_program_active: settings.is_program_active ?? true,
        leaderboard_period_title: settings.leaderboard_period_title || 'Top 5 Afiliator Bulan Ini',
        leaderboard_start_date: settings.leaderboard_start_date ? settings.leaderboard_start_date.slice(0, 10) : '',
        leaderboard_end_date: settings.leaderboard_end_date ? settings.leaderboard_end_date.slice(0, 10) : '',
      });
    }
  }, [settings]);

  // Filtered lists
  const filteredAffiliates = affiliates.filter((a) => {
    if (!affSearch.trim()) return true;
    const q = affSearch.toLowerCase();
    return (
      a.display_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.affiliate_code.toLowerCase().includes(q)
    );
  });

  const filteredLeads = leads.filter((l) => {
    if (leadFilter === 'trial' && l.account_type !== 'trial') return false;
    if (leadFilter === 'paid' && l.account_type === 'trial') return false;
    if (!leadSearch.trim()) return true;
    const q = leadSearch.toLowerCase();
    const aff = l.referred_by_affiliate_id ? affiliateById.get(l.referred_by_affiliate_id) : null;
    return (
      l.email.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      (l.referred_by_code || '').toLowerCase().includes(q) ||
      (aff?.display_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
              <Handshake className="w-7 h-7 text-primary" />
              <span>Manajemen Program Afiliasi</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Kelola afiliator, aktivasi akun trial binaan, pencairan komisi, leaderboard, dan marketing kit.
            </p>
          </div>
        </div>

        {/* 5 Global KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>Total Afiliator</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-black font-mono mt-1">{globalMetrics.totalAffiliates}</div>
          </div>

          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
            <div className="flex items-center justify-between text-purple-700 text-[10px] font-extrabold uppercase">
              <span>Trial Binaan Aktif</span>
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-700 mt-1">
              {globalMetrics.totalTrialLeads}
            </div>
          </div>

          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
            <div className="flex items-center justify-between text-emerald-700 text-[10px] font-extrabold uppercase">
              <span>Closing Afiliasi</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {globalMetrics.totalConversions}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Omzet: Rp {globalMetrics.totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border-2 border-amber-600 rounded-2xl shadow-brutal-sm">
            <div className="flex items-center justify-between text-amber-800 text-[10px] font-extrabold uppercase">
              <span>Antrean Pencairan</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-900 mt-1">
              {globalMetrics.pendingPayoutsCount}
            </div>
          </div>

          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>Komisi Dicairkan</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black font-mono mt-1 truncate">
              Rp {globalMetrics.totalCommissionPaid.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-secondary rounded-xl border-2 border-foreground/30 overflow-x-auto">
          {[
            { id: 'affiliates', label: `Daftar Afiliator (${affiliates.length})`, icon: Users },
            { id: 'leads', label: `Prospek Trial & Aktivasi (${leads.length})`, icon: UserCheck },
            {
              id: 'payouts',
              label: `Pencairan Komisi${globalMetrics.pendingPayoutsCount > 0 ? ` (${globalMetrics.pendingPayoutsCount} baru)` : ''}`,
              icon: Wallet,
            },
            { id: 'marketing', label: `Marketing Kit (${marketingKits.length})`, icon: Megaphone },
            { id: 'settings', label: 'Pengaturan & Kontes', icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSwitchTab(t.id as AdminAffTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DAFTAR AFILIATOR & LEADERBOARD PREVIEW */}
        {activeTab === 'affiliates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, atau kode afiliator..."
                  value={affSearch}
                  onChange={(e) => setAffSearch(e.target.value)}
                  className="pl-9 h-10 border-2 border-foreground/30 text-xs bg-card"
                />
              </div>
              {leaderboard.length > 0 && (
                <div className="inline-flex items-center gap-2 text-xs font-bold bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-950">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>
                    Top #1 Bulan Ini: <strong>{leaderboard[0].display_name}</strong> ({leaderboard[0].total_conversions} closing)
                  </span>
                </div>
              )}
            </div>

            <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/60">
                    <TableRow>
                      <TableHead className="text-xs font-extrabold uppercase">Afiliator & Kode</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Performa</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Komisi</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Rekening</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Status</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAffs ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                          Memuat daftar afiliator...
                        </TableCell>
                      </TableRow>
                    ) : filteredAffiliates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                          Belum ada afiliator terdaftar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAffiliates.map((aff) => {
                        const st = affStatsMap.get(aff.id) || {
                          leads: 0,
                          conversions: 0,
                          totalCommission: 0,
                          pendingCommission: 0,
                        };
                        return (
                          <TableRow key={aff.id}>
                            <TableCell className="py-3">
                              <p className="font-extrabold text-sm text-foreground">{aff.display_name}</p>
                              <p className="text-xs text-muted-foreground">{aff.email}</p>
                              <Badge variant="outline" className="mt-1 font-mono text-[10px] font-bold">
                                {aff.affiliate_code}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-xs space-y-0.5">
                              <p>Klik LP: <strong>{aff.total_clicks}</strong></p>
                              <p>Lead Trial: <strong>{st.leads}</strong></p>
                              <p className="text-emerald-700">Closing: <strong>{st.conversions}</strong></p>
                            </TableCell>
                            <TableCell className="py-3 text-xs font-mono">
                              <p className="font-black text-foreground">
                                Rp {st.totalCommission.toLocaleString('id-ID')}
                              </p>
                              <p className="text-[11px] text-emerald-700">
                                Rate: {aff.commission_rate}%
                              </p>
                              {st.pendingCommission > 0 && (
                                <p className="text-[10px] text-amber-700">
                                  Siap cair: Rp {st.pendingCommission.toLocaleString('id-ID')}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-xs">
                              {aff.bank_name ? (
                                <>
                                  <p className="font-bold">{aff.bank_name}</p>
                                  <p className="font-mono text-[11px]">{aff.bank_account_number}</p>
                                  <p className="text-[10px] text-muted-foreground">{aff.bank_account_holder}</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">Belum diisi</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={aff.is_active}
                                  onCheckedChange={(val) =>
                                    updateAffiliateMutation.mutate({
                                      id: aff.id,
                                      updates: { is_active: val },
                                    })
                                  }
                                />
                                <span className={`text-xs font-bold ${aff.is_active ? 'text-emerald-700' : 'text-destructive'}`}>
                                  {aff.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAff(aff);
                                  setEditAffForm({
                                    commission_rate: aff.commission_rate,
                                    max_trials_per_month: aff.max_trials_per_month ? String(aff.max_trials_per_month) : '',
                                    is_active: aff.is_active,
                                  });
                                }}
                                className="border-2 border-foreground/30 text-xs font-bold gap-1"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Atur
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROSPEK TRIAL AFILIATOR & TOMBOL CENTANG AKTIVASI (HANYA ADMIN!) */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl border border-foreground/20">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'trial', label: 'Masih Trial' },
                  { id: 'paid', label: 'Sudah Aktif Berbayar' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLeadFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      leadFilter === f.id ? 'bg-foreground text-background' : 'text-muted-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari email prospek atau nama afiliator..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pl-9 h-10 border-2 border-foreground/30 text-xs bg-card"
                />
              </div>
            </div>

            <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/60">
                    <TableRow>
                      <TableHead className="text-xs font-extrabold uppercase">Calon User / Pelanggan</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Asal Afiliator</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Status Paket</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Tanggal Daftar</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase text-right">Aktivasi (Admin)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLeads ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                          Memuat daftar prospek afiliator...
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                          Belum ada prospek trial yang didaftarkan oleh afiliator.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const aff = lead.referred_by_affiliate_id
                          ? affiliateById.get(lead.referred_by_affiliate_id)
                          : null;
                        const isTrial = lead.account_type === 'trial';

                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="py-3">
                              <p className="font-extrabold text-sm text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.email}</p>
                              {lead.phone && (
                                <p className="text-[11px] font-mono text-emerald-700">{lead.phone}</p>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold text-xs">
                                🤝 {aff?.display_name || lead.referred_by_code || 'Afiliator'}
                              </Badge>
                              {aff && (
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                  Kode: {aff.affiliate_code} ({aff.commission_rate}%)
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                className={`text-[10px] font-bold uppercase ${
                                  isTrial
                                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {isTrial ? 'Trial' : lead.account_type}
                              </Badge>
                              {lead.subscription_expires_at && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Exp:{' '}
                                  {new Date(lead.subscription_expires_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground">
                              {new Date(lead.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <Button
                                size="sm"
                                onClick={() => openActivateLeadModal(lead)}
                                className={`border-2 border-foreground font-bold text-xs gap-1 shadow-brutal-sm ${
                                  isTrial
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                                }`}
                                title={
                                  isTrial
                                    ? 'Aktifkan akun trial menjadi user berbayar & catat komisi 40%'
                                    : 'Perpanjang langganan & catat komisi renewal 40%'
                                }
                              >
                                <Check className="w-4 h-4" />
                                <span>{isTrial ? 'Aktifkan Tier' : 'Perpanjang'}</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RIWAYAT & PENCAIRAN KOMISI */}
        {activeTab === 'payouts' && (
          <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
            <div className="p-4 border-b-2 border-foreground/15">
              <h2 className="font-black text-base text-foreground">
                Antrean & Riwayat Pencairan Komisi Afiliator
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/60">
                  <TableRow>
                    <TableHead className="text-xs font-extrabold uppercase">Tanggal & Afiliator</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Rekening Tujuan</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Nominal Transfer</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Status</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayouts ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                        Memuat riwayat pencairan...
                      </TableCell>
                    </TableRow>
                  ) : payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada pengajuan pencairan komisi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((p) => {
                      const aff = affiliateById.get(p.affiliate_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="py-3">
                            <p className="font-extrabold text-sm text-foreground">
                              {aff?.display_name || 'Afiliator'}
                            </p>
                            <p className="text-xs text-muted-foreground">{aff?.email}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Diajukan:{' '}
                              {new Date(p.requested_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </TableCell>
                          <TableCell className="py-3 text-xs">
                            <p className="font-bold">{p.bank_name}</p>
                            <div className="flex items-center gap-1.5 font-mono font-bold">
                              <span>{p.bank_account_number}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.bank_account_number);
                                  toast.success('Nomor rekening disalin!');
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">a.n. {p.bank_account_holder}</p>
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs">
                            <p className="text-sm font-black text-emerald-700">
                              Rp {p.net_amount.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Diajukan: Rp {p.requested_amount.toLocaleString('id-ID')}
                            </p>
                            {p.admin_fee > 0 && (
                              <p className="text-[10px] text-amber-700 font-bold">
                                Potongan Fee Bank: -Rp {p.admin_fee.toLocaleString('id-ID')}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              className={`text-[10px] font-bold ${
                                p.status === 'paid'
                                  ? 'bg-emerald-600 text-white'
                                  : p.status === 'rejected'
                                  ? 'bg-destructive text-white'
                                  : 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                              }`}
                            >
                              {p.status === 'paid'
                                ? 'Sudah Ditransfer'
                                : p.status === 'rejected'
                                ? 'Ditolak'
                                : 'Menunggu'}
                            </Badge>
                            {p.transfer_reference && (
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                Ref: {p.transfer_reference}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setProcessingPayout(p);
                                    setPayoutRef('');
                                    setPayoutAdminNotes('');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-bold text-xs gap-1 shadow-brutal-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Proses Transfer
                                </Button>
                              )}
                              {aff?.whatsapp && (
                                <a
                                  href={`https://wa.me/${cleanPhoneForWhatsApp(aff.whatsapp)}?text=${encodeURIComponent(
                                    `Halo Kak ${aff.display_name}, pencairan komisi afiliasi ModulAjar.Online sebesar Rp ${p.net_amount.toLocaleString('id-ID')} ke rekening ${p.bank_name} (${p.bank_account_number}) ${p.status === 'paid' ? 'SUDAH DITRANSFER ✅' : 'sedang kami proses'}. Terima kasih atas kontribusinya! 🙏✨`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-2 border-emerald-600/50 text-emerald-700 font-bold text-xs gap-1"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    WA
                                  </Button>
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* TAB 4: CRUD MARKETING KIT */}
        {activeTab === 'marketing' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Gunakan variabel <code className="bg-secondary px-1.5 py-0.5 rounded font-bold">{'{LINK_AFILIASI}'}</code>{' '}
                dan <code className="bg-secondary px-1.5 py-0.5 rounded font-bold">{'{NAMA_AFILIATOR}'}</code> — akan otomatis terisi dengan link unik tiap afiliator!
              </p>
              <Button
                size="sm"
                onClick={openCreateKit}
                className="bg-primary text-primary-foreground border-2 border-foreground font-black text-xs shadow-brutal-sm gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Tambah Materi Marketing Kit
              </Button>
            </div>

            <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/60">
                    <TableRow>
                      <TableHead className="text-xs font-extrabold uppercase">Judul & Kategori</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Preview Konten / Asset</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase">Status</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingKits ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                          Memuat Marketing Kit...
                        </TableCell>
                      </TableRow>
                    ) : marketingKits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                          Belum ada materi Marketing Kit.
                        </TableCell>
                      </TableRow>
                    ) : (
                      marketingKits.map((kit) => (
                        <TableRow key={kit.id}>
                          <TableCell className="py-3 align-top">
                            <p className="font-extrabold text-sm text-foreground">{kit.title}</p>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase mt-1">
                              {kit.category}
                            </Badge>
                            {kit.description && (
                              <p className="text-xs text-muted-foreground mt-1">{kit.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="py-3 align-top max-w-md">
                            {kit.content_text && (
                              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                {kit.content_text}
                              </p>
                            )}
                            {kit.asset_url && (
                              <a
                                href={kit.asset_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Link Asset
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="py-3 align-top">
                            <Switch
                              checked={kit.is_active}
                              onCheckedChange={(val) =>
                                updateKitMutation.mutate({ id: kit.id, updates: { is_active: val } })
                              }
                            />
                          </TableCell>
                          <TableCell className="py-3 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditKit(kit)}
                                className="border border-foreground/30 h-8 px-2"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteKitMutation.mutate(kit.id)}
                                className="border border-foreground/30 hover:text-destructive h-8 px-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PENGATURAN PROGRAM & PERIODE LEADERBOARD KONTES */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
            <div className="pb-3 border-b-2 border-foreground/15">
              <h2 className="text-lg font-black text-foreground">Pengaturan Global Program Afiliasi</h2>
              <p className="text-xs text-muted-foreground">
                Atur besaran komisi, minimal pencairan bebas biaya admin, kuota trial binaan, dan periode kontes leaderboard.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSettings({
                  default_commission_rate: Number(settingsForm.default_commission_rate),
                  min_payout_free_fee: Number(settingsForm.min_payout_free_fee),
                  below_min_admin_fee: Number(settingsForm.below_min_admin_fee),
                  trial_quota_per_user: Number(settingsForm.trial_quota_per_user),
                  max_trials_per_month: Number(settingsForm.max_trials_per_month),
                  is_program_active: settingsForm.is_program_active,
                  leaderboard_period_title: settingsForm.leaderboard_period_title,
                  leaderboard_start_date: settingsForm.leaderboard_start_date
                    ? new Date(settingsForm.leaderboard_start_date).toISOString()
                    : null,
                  leaderboard_end_date: settingsForm.leaderboard_end_date
                    ? new Date(settingsForm.leaderboard_end_date + 'T23:59:59').toISOString()
                    : null,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Komisi Default (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={settingsForm.default_commission_rate}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, default_commission_rate: Number(e.target.value) })
                    }
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Min. Cair Bebas Fee (Rp)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settingsForm.min_payout_free_fee}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, min_payout_free_fee: Number(e.target.value) })
                    }
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Biaya Admin (&lt; Min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settingsForm.below_min_admin_fee}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, below_min_admin_fee: Number(e.target.value) })
                    }
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Kuota Generate per Akun Trial Binaan</Label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={settingsForm.trial_quota_per_user}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, trial_quota_per_user: Number(e.target.value) })
                    }
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Batas Daftar Trial / Afiliator / Bulan</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={settingsForm.max_trials_per_month}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, max_trials_per_month: Number(e.target.value) })
                    }
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-foreground/15 space-y-3">
                <Label className="text-xs font-extrabold uppercase text-muted-foreground block">
                  Pengaturan Leaderboard & Periode Kontes Top 5
                </Label>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Judul Leaderboard</Label>
                  <Input
                    value={settingsForm.leaderboard_period_title}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, leaderboard_period_title: e.target.value })
                    }
                    className="border-2 border-foreground/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Mulai Kontes (Opsional)</Label>
                    <Input
                      type="date"
                      value={settingsForm.leaderboard_start_date}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, leaderboard_start_date: e.target.value })
                      }
                      className="border-2 border-foreground/30 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Selesai Kontes (Opsional)</Label>
                    <Input
                      type="date"
                      value={settingsForm.leaderboard_end_date}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, leaderboard_end_date: e.target.value })
                      }
                      className="border-2 border-foreground/30 text-xs"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdatingSettings}
                className="bg-primary text-primary-foreground border-2 border-foreground font-black text-xs px-6 py-5 shadow-brutal-sm gap-2"
              >
                <Save className="w-4 h-4" />
                {isUpdatingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Afiliasi'}
              </Button>
            </form>
          </div>
        )}

        {/* DIALOG: ACTIVATE AFFILIATE TRIAL LEAD ("TOMBOL CENTANG") */}
        {activatingLead && (
          <Dialog open={!!activatingLead} onOpenChange={(open) => !open && setActivatingLead(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Aktifkan Akun Binaan Afiliator
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pilih paket langganan untuk mengaktifkan akun & mencatat komisi afiliator secara otomatis.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-secondary/60 rounded-xl border border-foreground/20 space-y-1">
                  <p><strong>Pelanggan:</strong> {activatingLead.name} ({activatingLead.email})</p>
                  <p>
                    <strong>Afiliator:</strong>{' '}
                    {activatingLead.referred_by_affiliate_id
                      ? affiliateById.get(activatingLead.referred_by_affiliate_id)?.display_name
                      : activatingLead.referred_by_code}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Pilih Tier Paket:</Label>
                  <select
                    value={selectedTier}
                    onChange={(e) => {
                      const tier = e.target.value as 'lite' | 'standar' | 'pro';
                      setSelectedTier(tier);
                      setCustomPrice(String(PACKAGES_CONFIG[tier].price));
                    }}
                    className="w-full px-3 py-2 text-xs font-bold bg-background border-2 border-foreground/30 rounded-lg"
                  >
                    <option value="lite">Paket Lite (6 Bulan) — Rp 99.000</option>
                    <option value="standar">Paket Standar (1 Tahun) — Rp 149.000</option>
                    <option value="pro">Paket Pro (1 Tahun) — Rp 197.000</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nominal Pembayaran Bersih (Rp)</Label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                  {activatingLead.referred_by_affiliate_id && (
                    <p className="text-[11px] text-emerald-700 font-bold">
                      Komisi otomatis ({affiliateById.get(activatingLead.referred_by_affiliate_id)?.commission_rate ?? 40}%):{' '}
                      Rp{' '}
                      {Math.round(
                        ((Number(customPrice) || 0) *
                          (affiliateById.get(activatingLead.referred_by_affiliate_id)?.commission_rate ?? 40)) /
                          100
                      ).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActivatingLead(null)} className="border-2 border-foreground">
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmActivateLead}
                  disabled={activateLeadMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-bold shadow-brutal-sm"
                >
                  {activateLeadMutation.isPending ? 'Mengaktifkan...' : '✓ Aktifkan & Catat Komisi'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DIALOG: EDIT AFFILIATE RATE & QUOTA */}
        {editingAff && (
          <Dialog open={!!editingAff} onOpenChange={(open) => !open && setEditingAff(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black">Atur Afiliator: {editingAff.display_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Persentase Komisi (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={90}
                    value={editAffForm.commission_rate}
                    onChange={(e) => setEditAffForm({ ...editAffForm, commission_rate: Number(e.target.value) })}
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Kuota Trial / Bulan Khusus (Kosongkan = ikut global {settings.max_trials_per_month})</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`Default global: ${settings.max_trials_per_month}`}
                    value={editAffForm.max_trials_per_month}
                    onChange={(e) => setEditAffForm({ ...editAffForm, max_trials_per_month: e.target.value })}
                    className="font-mono border-2 border-foreground/30"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setEditingAff(null)} className="border-2 border-foreground">
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    await updateAffiliateMutation.mutateAsync({
                      id: editingAff.id,
                      updates: {
                        commission_rate: Number(editAffForm.commission_rate),
                        max_trials_per_month: editAffForm.max_trials_per_month
                          ? Number(editAffForm.max_trials_per_month)
                          : null,
                      },
                    });
                    setEditingAff(null);
                  }}
                  className="bg-primary text-primary-foreground border-2 border-foreground font-bold"
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DIALOG: PROCESS PAYOUT */}
        {processingPayout && (
          <Dialog open={!!processingPayout} onOpenChange={(open) => !open && setProcessingPayout(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black">Proses Pencairan Komisi</DialogTitle>
                <DialogDescription className="text-xs">
                  Transfer ke {processingPayout.bank_name} — {processingPayout.bank_account_number} (a.n.{' '}
                  {processingPayout.bank_account_holder})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl space-y-1">
                  <p>Nominal Diajukan: <strong className="font-mono">Rp {processingPayout.requested_amount.toLocaleString('id-ID')}</strong></p>
                  <p>Potongan Biaya Admin: <strong className="font-mono">Rp {processingPayout.admin_fee.toLocaleString('id-ID')}</strong></p>
                  <p className="text-sm font-black text-emerald-800">
                    Total Ditransfer: Rp {processingPayout.net_amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">No. Referensi / Bukti Transfer (Opsional)</Label>
                  <Input
                    placeholder="Contoh: TRF-BCA-18112026"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    className="font-mono border-2 border-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Catatan Admin (Opsional)</Label>
                  <Input
                    placeholder="Sudah ditransfer via m-BCA"
                    value={payoutAdminNotes}
                    onChange={(e) => setPayoutAdminNotes(e.target.value)}
                    className="border-2 border-foreground/30"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await processPayoutMutation.mutateAsync({
                      payout: processingPayout,
                      status: 'rejected',
                      adminNotes: payoutAdminNotes,
                    });
                    setProcessingPayout(null);
                  }}
                  className="border-2 border-foreground font-bold text-xs"
                >
                  Tolak Pengajuan
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    await processPayoutMutation.mutateAsync({
                      payout: processingPayout,
                      status: 'paid',
                      transferReference: payoutRef,
                      adminNotes: payoutAdminNotes,
                    });
                    setProcessingPayout(null);
                  }}
                  disabled={processPayoutMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-bold text-xs shadow-brutal-sm"
                >
                  ✓ Tandai Sudah Ditransfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DIALOG: CREATE / EDIT MARKETING KIT */}
        <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
          <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                {editingKit ? 'Edit Materi Marketing Kit' : 'Tambah Materi Marketing Kit'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveKit} className="space-y-3 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Judul Materi *</Label>
                  <Input
                    required
                    value={kitForm.title}
                    onChange={(e) => setKitForm({ ...kitForm, title: e.target.value })}
                    placeholder="Contoh: Copywriting WA Grup KKG"
                    className="border-2 border-foreground/30 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Kategori</Label>
                  <select
                    value={kitForm.category}
                    onChange={(e) => setKitForm({ ...kitForm, category: e.target.value as MarketingKitCategory })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-background border-2 border-foreground/30 rounded-lg"
                  >
                    <option value="copywriting">Copywriting WA/Medsos</option>
                    <option value="banner">Banner & Poster</option>
                    <option value="video">Video Demo</option>
                    <option value="presentasi">Slide Presentasi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Deskripsi Singkat</Label>
                <Input
                  value={kitForm.description}
                  onChange={(e) => setKitForm({ ...kitForm, description: e.target.value })}
                  placeholder="Cocok untuk dibagikan ke grup WA atau story"
                  className="border-2 border-foreground/30 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">
                  Teks Copywriting (gunakan {'{LINK_AFILIASI}'} & {'{NAMA_AFILIATOR}'})
                </Label>
                <Textarea
                  rows={5}
                  value={kitForm.content_text}
                  onChange={(e) => setKitForm({ ...kitForm, content_text: e.target.value })}
                  placeholder="Halo Bapak/Ibu Guru! Cek di sini: {LINK_AFILIASI}"
                  className="border-2 border-foreground/30 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Link Asset (Canva / Drive / Video)</Label>
                  <Input
                    value={kitForm.asset_url}
                    onChange={(e) => setKitForm({ ...kitForm, asset_url: e.target.value })}
                    placeholder="https://..."
                    className="border-2 border-foreground/30 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">URL Gambar Thumbnail (Opsional)</Label>
                  <Input
                    value={kitForm.thumbnail_url}
                    onChange={(e) => setKitForm({ ...kitForm, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                    className="border-2 border-foreground/30 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setKitDialogOpen(false)} className="border-2 border-foreground text-xs">
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createKitMutation.isPending || updateKitMutation.isPending}
                  className="bg-primary text-primary-foreground border-2 border-foreground font-bold text-xs shadow-brutal-sm"
                >
                  {editingKit ? 'Simpan Perubahan' : 'Tambah Materi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ACTIVATION WHATSAPP MODAL (Auto-opens after Admin activates a lead!) */}
        <ActivationMessageModal
          isOpen={activationWaModalOpen}
          onClose={() => {
            setActivationWaModalOpen(false);
            setActivatedCustomerInfo(null);
          }}
          customer={activatedCustomerInfo}
        />
      </div>
    </AdminLayout>
  );
}
