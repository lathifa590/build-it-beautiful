import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAffiliateSettings,
  useMyAffiliate,
  useRegisterAffiliate,
  useUpdateMyAffiliate,
  useMyAffiliateLeads,
  useRegisterAffiliateTrialLeads,
  useMyAffiliateCommissions,
  useMyAffiliatePayouts,
  useRequestAffiliatePayout,
  useAffiliateLeaderboard,
  useAffiliateMarketingKits,
  generateAffiliateCode,
} from '@/hooks/useAffiliate';
import {
  buildAffiliateLandingUrl,
  renderMarketingKitText,
} from '@/lib/affiliate-tracking';
import { cleanPhoneForWhatsApp } from '@/components/admin/ActivationMessageModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Handshake,
  Sparkles,
  Copy,
  Check,
  Users,
  TrendingUp,
  Wallet,
  MousePointerClick,
  Trophy,
  KeyRound,
  UserPlus,
  Megaphone,
  Settings,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Crown,
  Banknote,
  FileText,
  Image as ImageIcon,
  Video,
  Presentation,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type DashboardTab = 'overview' | 'leads' | 'commissions' | 'marketing' | 'settings';
type LeaderboardPeriod = 'month' | 'week' | 'contest' | 'all';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const { settings } = useAffiliateSettings();
  const { data: myAffData, isLoading: isLoadingAff, refetch: refetchMyAff } = useMyAffiliate();

  const affiliate = myAffData?.affiliate ?? null;
  const isEligible = myAffData?.isEligible ?? false;
  const accountType = myAffData?.accountType ?? null;
  const activeApiKeyCount = myAffData?.activeApiKeyCount ?? 0;

  const registerMutation = useRegisterAffiliate();
  const updateProfileMutation = useUpdateMyAffiliate();
  const registerTrialsMutation = useRegisterAffiliateTrialLeads();
  const requestPayoutMutation = useRequestAffiliatePayout();

  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads } = useMyAffiliateLeads(affiliate?.id);
  const { data: commissions = [], isLoading: isLoadingComms } = useMyAffiliateCommissions(affiliate?.id);
  const { data: payouts = [] } = useMyAffiliatePayouts(affiliate?.id);
  const { data: marketingKits = [] } = useAffiliateMarketingKits();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('month');
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useAffiliateLeaderboard(leaderboardPeriod);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Onboarding / Registration form state
  const [regForm, setRegForm] = useState({
    display_name: (user?.user_metadata?.full_name as string) || (user?.email?.split('@')[0] || ''),
    affiliate_code: generateAffiliateCode((user?.user_metadata?.full_name as string) || user?.email || 'GURU'),
    whatsapp: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });

  // Trial registration state (single or bulk)
  const [trialMode, setTrialMode] = useState<'single' | 'bulk'>('single');
  const [singleLead, setSingleLead] = useState({ name: '', email: '', phone: '' });
  const [bulkText, setBulkText] = useState('');

  // Payout form state
  const [payoutAmount, setPayoutAmount] = useState('');

  // Marketing Kit category filter
  const [kitCategory, setKitCategory] = useState<string>('all');

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    affiliate_code: '',
    whatsapp: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });

  React.useEffect(() => {
    if (affiliate) {
      setProfileForm({
        display_name: affiliate.display_name || '',
        affiliate_code: affiliate.affiliate_code || '',
        whatsapp: affiliate.whatsapp || '',
        bank_name: affiliate.bank_name || '',
        bank_account_number: affiliate.bank_account_number || '',
        bank_account_holder: affiliate.bank_account_holder || '',
      });
    }
  }, [affiliate]);

  // Financial & Lead stats
  const stats = useMemo(() => {
    const approvedTotal = commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const paidTotal = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const pendingPayoutTotal = payouts
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.requested_amount || 0), 0);

    const availableBalance = Math.max(0, approvedTotal - pendingPayoutTotal);
    const totalConversions = commissions.filter((c) => c.status === 'approved' || c.status === 'paid').length;

    // Count leads registered in current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const leadsThisMonth = leads.filter(
      (l) => new Date(l.created_at).getTime() >= startOfMonth
    ).length;

    const maxTrialsMonth = affiliate?.max_trials_per_month ?? settings.max_trials_per_month ?? 30;
    const activeTrialsCount = leads.filter((l) => l.account_type === 'trial').length;
    const upgradedLeadsCount = leads.filter((l) => l.account_type !== 'trial').length;

    return {
      approvedTotal,
      paidTotal,
      pendingPayoutTotal,
      availableBalance,
      totalConversions,
      leadsThisMonth,
      maxTrialsMonth,
      activeTrialsCount,
      upgradedLeadsCount,
    };
  }, [commissions, payouts, leads, affiliate, settings]);

  // Leaderboard Top 5 (hanya afiliator yang sudah memiliki minimal 1 closing) + my own rank
  const closedLeaderboard = useMemo(
    () => leaderboard.filter((e) => e.total_conversions > 0),
    [leaderboard]
  );
  const top5Leaderboard = useMemo(() => closedLeaderboard.slice(0, 5), [closedLeaderboard]);
  const myLeaderboardEntry = useMemo(
    () => (affiliate ? closedLeaderboard.find((e) => e.affiliate_id === affiliate.id) || null : null),
    [closedLeaderboard, affiliate]
  );

  const handleCopy = (text: string, key: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Parse bulk text lines (supports: "email", "Nama (email)", "Nama, email, wa")
  const parseBulkEntries = (raw: string) => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const results: Array<{ email: string; name?: string; phone?: string }> = [];

    for (const line of lines) {
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!emailMatch) continue;
      const email = emailMatch[0].toLowerCase();
      const withoutEmail = line
        .replace(emailMatch[0], '')
        .replace(/^\d+[\.)]\s*/, '')
        .replace(/[()<>|;,]/g, ' ')
        .trim();

      const phoneMatch = withoutEmail.match(/(?:\+?62|0)8\d{7,12}/);
      const phone = phoneMatch ? phoneMatch[0] : undefined;
      const name = (phoneMatch ? withoutEmail.replace(phoneMatch[0], '') : withoutEmail)
        .replace(/\s+/g, ' ')
        .trim();

      results.push({ email, name: name || undefined, phone });
    }
    return results;
  };

  const handleRegisterTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;

    const entries =
      trialMode === 'single'
        ? [{ email: singleLead.email, name: singleLead.name, phone: singleLead.phone }]
        : parseBulkEntries(bulkText);

    if (entries.length === 0) {
      toast.error('Masukkan minimal satu alamat email yang valid.');
      return;
    }

    try {
      await registerTrialsMutation.mutateAsync({
        affiliate,
        settings,
        activeApiKeyCount,
        existingLeadsThisMonth: stats.leadsThisMonth,
        entries,
      });
      setSingleLead({ name: '', email: '', phone: '' });
      setBulkText('');
    } catch {
      // toast handled in mutation
    }
  };

  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;
    const numericAmount = Number(payoutAmount.replace(/\D/g, ''));
    try {
      await requestPayoutMutation.mutateAsync({
        affiliate,
        settings,
        requestedAmount: numericAmount,
        availableBalance: stats.availableBalance,
      });
      setPayoutAmount('');
    } catch {
      // handled in mutation
    }
  };

  const buildFollowUpLeadWaUrl = (lead: typeof leads[number]) => {
    if (!affiliate) return '#';
    const affUrl = buildAffiliateLandingUrl(affiliate.affiliate_code);
    const checkoutUrl = `${window.location.origin}/checkout?package=standar&ref=${encodeURIComponent(affiliate.affiliate_code)}`;
    const isTrial = lead.account_type === 'trial';
    const msg = isTrial
      ? `Halo Bapak/Ibu ${lead.name}, akun *Trial ModulAjar.Online* untuk email *${lead.email}* sudah saya aktifkan ya! 🎉\n\n👉 Cara Masuk:\n1. Buka: https://modulajar.online/auth\n2. Masukkan email *${lead.email}* dan buat password baru.\n\nBapak/Ibu mendapat kuota ${lead.trial_quota_limit || settings.trial_quota_per_user}x generate gratis. Jika nanti merasa sangat membantu dan ingin upgrade ke akses penuh (1 Tahun Unlimited), bisa lewat link ini ya:\n🔗 ${checkoutUrl}\n\nJika ada kendala saat login, langsung kabari saya ya! 🙏😊`
      : `Halo Bapak/Ibu ${lead.name}, terima kasih sudah berlangganan ModulAjar.Online! Semoga makin membantu administrasi mengajarnya. Jika ada kendala atau butuh bantuan, kabari saya kapan saja ya 🙏✨\n(${affUrl})`;

    const clean = lead.phone ? cleanPhoneForWhatsApp(lead.phone) : '';
    return clean
      ? `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  // Loading state
  if (isLoadingAff) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2 text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold">Memuat Program Afiliasi...</p>
        </div>
      </div>
    );
  }

  // CASE 1: NOT ELIGIBLE (Lite / Trial users)
  if (!isEligible && !affiliate) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="p-6 sm:p-8 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border-2 border-foreground flex items-center justify-center shadow-brutal-sm">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs">
              Khusus Paket Standar & Pro
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Program Afiliasi Komisi {settings.default_commission_rate}%
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Dapatkan penghasilan tambahan <strong>komisi {settings.default_commission_rate}%</strong> dari setiap rekan guru yang mendaftar maupun <strong>perpanjangan tahunan</strong> lewat rekomendasi Anda!
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl text-xs text-amber-950 text-left max-w-lg mx-auto space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Status Akun Anda Saat Ini: <span className="uppercase">{accountType || 'Trial / Belum Aktif'}</span>
            </p>
            <p>
              Program Afiliasi hanya terbuka untuk pengguna aktif <strong>Paket Standar (1 Tahun)</strong> atau <strong>Paket Pro (1 Tahun)</strong>. Pengguna Paket Lite dan Trial perlu upgrade terlebih dahulu untuk membuka dashboard afiliator.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs pt-2">
            <div className="p-3 bg-secondary/60 rounded-xl border border-foreground/20">
              <p className="font-extrabold text-foreground">💰 Komisi 40% Berulang</p>
              <p className="text-muted-foreground mt-0.5">Hingga Rp 78.800 per closing Pro, termasuk saat user perpanjang!</p>
            </div>
            <div className="p-3 bg-secondary/60 rounded-xl border border-foreground/20">
              <p className="font-extrabold text-foreground">🎓 Bagi Akun Trial Gratis</p>
              <p className="text-muted-foreground mt-0.5">Daftarkan rekan guru untuk coba langsung agar closing makin mudah.</p>
            </div>
            <div className="p-3 bg-secondary/60 rounded-xl border border-foreground/20">
              <p className="font-extrabold text-foreground">📣 Marketing Kit & LP Unik</p>
              <p className="text-muted-foreground mt-0.5">Landing page otomatis + materi promosi siap salin ke WA/medsos.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link to="/checkout?package=standar" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-auto whitespace-normal text-center leading-snug text-sm py-3 px-4 border-2 border-foreground font-bold shadow-brutal-sm"
              >
                Upgrade Paket Standar (Rp 149rb)
              </Button>
            </Link>
            <Link to="/checkout?package=pro" className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto h-auto whitespace-normal text-center leading-snug text-sm py-3 px-4 bg-primary text-primary-foreground border-2 border-foreground font-black shadow-brutal gap-2"
              >
                <span>Upgrade Paket Pro (Rp 197rb)</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: ELIGIBLE BUT NOT YET ACTIVATED -> INSTANT AUTO-ACTIVATION FORM
  if (!affiliate) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-8 space-y-6">
        <div className="p-4 sm:p-8 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border-2 border-foreground flex items-center justify-center shadow-brutal-sm shrink-0">
              <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <Badge className="bg-emerald-600 text-white font-bold text-[10px] mb-1 whitespace-normal text-left">
                Akun Anda Memenuhi Syarat! • Aktivasi Otomatis
              </Badge>
              <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
                Gabung Program Afiliasi (Komisi {settings.default_commission_rate}%)
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Aktifkan akun afiliator dalam 1 klik! Anda langsung mendapat Landing Page pribadi, komisi {settings.default_commission_rate}% (termasuk renewal), akses Marketing Kit, dan fitur mendaftarkan akun Trial untuk rekan guru.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate(regForm);
            }}
            className="space-y-4 pt-2 border-t-2 border-foreground/10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nama Tampilan (Muncul di LP & Leaderboard) *</Label>
                <Input
                  required
                  value={regForm.display_name}
                  onChange={(e) => setRegForm({ ...regForm, display_name: e.target.value })}
                  placeholder="Misal: Budi Santoso, S.Pd."
                  className="border-2 border-foreground/30 font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Kode Unik Afiliasi *</Label>
                <Input
                  required
                  value={regForm.affiliate_code}
                  onChange={(e) =>
                    setRegForm({
                      ...regForm,
                      affiliate_code: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase(),
                    })
                  }
                  placeholder="BUDI2026"
                  className="font-mono uppercase font-bold border-2 border-foreground/30"
                />
                <p className="text-[11px] text-muted-foreground">
                  Link Anda: <span className="font-mono font-bold">modulajar.online/?ref={regForm.affiliate_code || 'KODE'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nomor WhatsApp Aktif</Label>
                <Input
                  type="tel"
                  value={regForm.whatsapp}
                  onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })}
                  placeholder="081234567890"
                  className="font-mono border-2 border-foreground/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Bank / E-Wallet untuk Pencairan (Opsional)</Label>
                <Input
                  value={regForm.bank_name}
                  onChange={(e) => setRegForm({ ...regForm, bank_name: e.target.value })}
                  placeholder="Contoh: BCA / BRI / DANA / SeaBank"
                  className="border-2 border-foreground/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nomor Rekening / No. E-Wallet</Label>
                <Input
                  value={regForm.bank_account_number}
                  onChange={(e) => setRegForm({ ...regForm, bank_account_number: e.target.value })}
                  placeholder="1234567890"
                  className="font-mono border-2 border-foreground/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Atas Nama Rekening</Label>
                <Input
                  value={regForm.bank_account_holder}
                  onChange={(e) => setRegForm({ ...regForm, bank_account_holder: e.target.value })}
                  placeholder="Sesuai buku tabungan / e-wallet"
                  className="border-2 border-foreground/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-auto min-h-[48px] whitespace-normal text-center leading-snug bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base py-3.5 sm:py-4 px-4 border-2 border-foreground shadow-brutal gap-2"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{registerMutation.isPending ? 'Mengaktifkan...' : 'Aktifkan Akun Afiliator (Gratis)'}</span>
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // CASE 3: ACTIVE AFFILIATE DASHBOARD
  const landingUrl = buildAffiliateLandingUrl(affiliate.affiliate_code);
  const prettyLandingUrl = `${window.location.origin}/a/${affiliate.affiliate_code}`;
  const numericPayoutInput = Number(payoutAmount.replace(/\D/g, '')) || 0;
  const isBelowFreeFee = numericPayoutInput > 0 && numericPayoutInput < (settings.min_payout_free_fee ?? 50000);
  const estimatedFee = isBelowFreeFee ? (settings.below_min_admin_fee ?? 2500) : 0;
  const estimatedNet = Math.max(0, numericPayoutInput - estimatedFee);

  const filteredKits = marketingKits.filter(
    (k) => kitCategory === 'all' || k.category === kitCategory
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
              <Handshake className="w-7 h-7 text-primary" />
              <span>Dashboard Afiliator</span>
            </h1>
            <Badge className="bg-emerald-600 text-white font-bold text-xs">
              Komisi {affiliate.commission_rate}% (Termasuk Renewal)
            </Badge>
            {!affiliate.is_active && (
              <Badge variant="destructive" className="font-bold text-xs">
                Akun Dinonaktifkan Admin
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Halo <strong>{affiliate.display_name}</strong>! Bagikan link landing page Anda atau daftarkan prospek trial untuk meraih komisi otomatis.
          </p>
        </div>

        {/* API Key Health Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeApiKeyCount > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border-2 border-emerald-600/40 rounded-xl text-xs font-bold text-emerald-800">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>{activeApiKeyCount} Gemini API Key Aktif (Siap Layani Trial)</span>
            </div>
          ) : (
            <Link to="/settings">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border-2 border-amber-600 rounded-xl text-xs font-bold text-amber-950 hover:bg-amber-500/25 transition-colors">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Belum Pasang API Key — Klik untuk Pasang</span>
              </div>
            </Link>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchMyAff();
              refetchLeads();
            }}
            className="border-2 border-foreground font-bold text-xs gap-1.5 shadow-brutal-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Affiliate Link Quick Share Card */}
      <div className="p-4 sm:p-5 bg-card border-2 border-foreground rounded-2xl shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary block">
            Link Landing Page Unik Anda (Kode: {affiliate.affiliate_code})
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs sm:text-sm font-mono font-bold bg-secondary px-3 py-1.5 rounded-lg border border-foreground/20 truncate max-w-full">
              {prettyLandingUrl}
            </code>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              (atau <span className="font-mono">{landingUrl}</span>)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Setiap pengunjung yang membeli lewat link Anda otomatis tercatat selama 30 hari — dan komisi {affiliate.commission_rate}% masuk otomatis saat pesanan disetujui!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            onClick={() => handleCopy(prettyLandingUrl, 'main-link', 'Link Landing Page')}
            className="bg-primary text-primary-foreground border-2 border-foreground font-bold text-xs shadow-brutal-sm gap-1.5"
          >
            {copiedKey === 'main-link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedKey === 'main-link' ? 'Tersalin!' : 'Salin Link LP'}
          </Button>
          <a href={prettyLandingUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="outline"
              className="border-2 border-foreground font-bold text-xs shadow-brutal-sm gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka LP
            </Button>
          </a>
        </div>
      </div>

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-extrabold uppercase">Klik Link LP</span>
            <MousePointerClick className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono">{affiliate.total_clicks || 0}</div>
        </div>

        <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-extrabold uppercase">Lead Trial</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono">{leads.length}</div>
          <div className="text-[10px] text-muted-foreground">
            Bulan ini: {stats.leadsThisMonth}/{stats.maxTrialsMonth}
          </div>
        </div>

        <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-extrabold uppercase">Total Closing</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">{stats.totalConversions}</div>
        </div>

        <div className="p-4 bg-emerald-500/10 border-2 border-emerald-700 rounded-2xl shadow-brutal-sm">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[10px] font-extrabold uppercase">Saldo Siap Cair</span>
            <Wallet className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-900 truncate">
            Rp {stats.availableBalance.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-extrabold uppercase">Sudah Dicairkan</span>
            <Banknote className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono truncate">
            Rp {stats.paidTotal.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-secondary rounded-xl border-2 border-foreground/30 overflow-x-auto">
        {[
          { id: 'overview', label: 'Leaderboard & Link', icon: Trophy },
          { id: 'leads', label: `Prospek Trial (${leads.length})`, icon: UserPlus },
          { id: 'commissions', label: 'Komisi & Pencairan', icon: Wallet },
          { id: 'marketing', label: 'Marketing Kit', icon: Megaphone },
          { id: 'settings', label: 'Profil & Rekening', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as DashboardTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
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

      {/* TAB 1: OVERVIEW & GLOBAL LEADERBOARD TOP 5 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Global Leaderboard Top 5 (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-foreground/15">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>{settings.leaderboard_period_title || 'Top 5 Afiliator'}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Peringkat global berdasarkan jumlah closing terverifikasi
                </p>
              </div>

              <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-foreground/20">
                {[
                  { id: 'month', label: 'Bulan Ini' },
                  { id: 'week', label: 'Minggu Ini' },
                  { id: 'contest', label: 'Kontes' },
                  { id: 'all', label: 'Semua' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLeaderboardPeriod(p.id as LeaderboardPeriod)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      leaderboardPeriod === p.id
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingLeaderboard ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Memuat peringkat...</div>
            ) : top5Leaderboard.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Belum ada data peringkat untuk periode ini. Jadilah yang pertama di puncak klasemen! 🚀
              </div>
            ) : (
              <div className="space-y-2.5">
                {top5Leaderboard.map((entry, idx) => {
                  const isMe = entry.affiliate_id === affiliate.id;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank_position}`;
                  return (
                    <div
                      key={entry.affiliate_id}
                      className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 ${
                        isMe
                          ? 'bg-primary/10 border-primary shadow-brutal-sm'
                          : idx === 0
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-secondary/40 border-foreground/15'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg font-black w-8 text-center shrink-0">{medal}</span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-foreground truncate flex items-center gap-1.5">
                            <span>{entry.display_name}</span>
                            {isMe && (
                              <Badge className="bg-primary text-primary-foreground text-[9px]">Anda</Badge>
                            )}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Kode: {entry.affiliate_code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-600/40 text-xs sm:text-sm font-black text-emerald-800">
                          {entry.total_conversions} Closing
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Personal Rank Nudge */}
            {myLeaderboardEntry ? (
              <div className="p-3 bg-secondary/70 border border-foreground/20 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                <span>
                  Peringkat Anda saat ini: <strong>#{myLeaderboardEntry.rank_position}</strong> (
                  <strong>{myLeaderboardEntry.total_conversions} closing</strong>)
                </span>
                {myLeaderboardEntry.rank_position > 5 && top5Leaderboard[4] && (
                  <span className="text-primary font-bold">
                    Butuh {Math.max(1, top5Leaderboard[4].total_conversions - myLeaderboardEntry.total_conversions + 1)} closing lagi ke Top 5! 🔥
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 bg-secondary/70 border border-foreground/20 rounded-xl text-xs text-muted-foreground">
                Anda belum memiliki closing pada periode ini — raih closing pertama untuk masuk papan peringkat! 🚀
              </div>
            )}
          </div>

          {/* Direct Checkout Links per Package (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
            <div className="pb-3 border-b-2 border-foreground/15">
              <h2 className="text-lg font-black text-foreground">Link Cepat & Estimasi Komisi</h2>
              <p className="text-xs text-muted-foreground">
                Bagikan link langsung ke halaman checkout paket pilihan
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'pro', name: 'Paket Pro (1 Tahun)', price: 197000, badge: 'Komisi Tertinggi' },
                { key: 'standar', name: 'Paket Standar (1 Tahun)', price: 149000, badge: 'Paling Laris' },
                { key: 'lite', name: 'Paket Lite (6 Bulan)', price: 99000, badge: 'Entry' },
              ].map((pkg) => {
                const url = `${window.location.origin}/checkout?package=${pkg.key}&ref=${encodeURIComponent(affiliate.affiliate_code)}`;
                const estComm = Math.round((pkg.price * affiliate.commission_rate) / 100);
                return (
                  <div
                    key={pkg.key}
                    className="p-3.5 bg-secondary/50 border-2 border-foreground/20 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-sm text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Harga Rp {pkg.price.toLocaleString('id-ID')} →{' '}
                          <strong className="text-emerald-700">Komisi Rp {estComm.toLocaleString('id-ID')}</strong>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(url, `pkg-${pkg.key}`, `Link ${pkg.name}`)}
                        className="border-2 border-foreground font-bold text-xs gap-1"
                      >
                        {copiedKey === `pkg-${pkg.key}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Salin
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTARKAN & KELOLA PROSPEK TRIAL (PAKAI API KEY AFILIATOR) */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Form Register Trial Lead */}
          <div className="p-5 sm:p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-foreground/15">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>Daftarkan User Trial Binaan Anda</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  User trial binaan mendapat kuota <strong>{settings.trial_quota_per_user}x generate</strong> menggunakan{' '}
                  <strong>Gemini API Key milik Anda</strong>. Jika user ini upgrade, komisi {affiliate.commission_rate}% otomatis masuk ke Anda!
                </p>
              </div>
              <Badge variant="outline" className="border-foreground/30 font-mono font-bold text-xs self-start">
                Kuota Bulan Ini: {stats.leadsThisMonth} / {stats.maxTrialsMonth} email
              </Badge>
            </div>

            {activeApiKeyCount === 0 && (
              <div className="p-4 bg-amber-500/15 border-2 border-amber-600 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Anda Wajib Memasang Gemini API Key Terlebih Dahulu</p>
                    <p>
                      Seluruh proses generate AI untuk akun trial binaan Anda menggunakan API Key milik Anda (bukan API Key Admin). Pasang minimal 1 Gemini API Key gratis di menu Pengaturan.
                    </p>
                  </div>
                </div>
                <Link to="/settings" className="shrink-0">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-2 border-foreground font-bold text-xs">
                    Pasang API Key →
                  </Button>
                </Link>
              </div>
            )}

            {/* Mode Switcher: Single vs Bulk */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTrialMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                  trialMode === 'single'
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'bg-secondary border-transparent text-muted-foreground'
                }`}
              >
                Tambah 1 Email
              </button>
              <button
                type="button"
                onClick={() => setTrialMode('bulk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                  trialMode === 'bulk'
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'bg-secondary border-transparent text-muted-foreground'
                }`}
              >
                Tempel Banyak Email (Bulk Workshop / KKG)
              </button>
            </div>

            <form onSubmit={handleRegisterTrialSubmit} className="space-y-4">
              {trialMode === 'single' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Nama Calon Pengguna</Label>
                    <Input
                      placeholder="Contoh: Ibu Siti Aminah"
                      value={singleLead.name}
                      onChange={(e) => setSingleLead({ ...singleLead, name: e.target.value })}
                      className="border-2 border-foreground/30 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Alamat Email *</Label>
                    <Input
                      type="email"
                      required
                      placeholder="siti@gmail.com"
                      value={singleLead.email}
                      onChange={(e) => setSingleLead({ ...singleLead, email: e.target.value })}
                      className="border-2 border-foreground/30 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Nomor WhatsApp (Opsional)</Label>
                    <Input
                      type="tel"
                      placeholder="081234567890"
                      value={singleLead.phone}
                      onChange={(e) => setSingleLead({ ...singleLead, phone: e.target.value })}
                      className="border-2 border-foreground/30 font-mono text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    Tempel Daftar Email (1 baris per orang — format bebas seperti daftar grup WA)
                  </Label>
                  <Textarea
                    rows={5}
                    placeholder={`1. Siti Anisah (siti@gmail.com)\n2. Budi Santoso budi@guru.sd.belajar.id 08123456789\nandi@gmail.com`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="border-2 border-foreground/30 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Terdeteksi: <strong>{parseBulkEntries(bulkText).length} email valid</strong>
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={registerTrialsMutation.isPending || activeApiKeyCount === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground font-black text-xs shadow-brutal-sm gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                {registerTrialsMutation.isPending ? 'Mendaftarkan...' : 'Aktifkan Sebagai Akun Trial'}
              </Button>
            </form>
          </div>

          {/* Table of Referred Leads */}
          <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
            <div className="p-4 border-b-2 border-foreground/15 flex items-center justify-between">
              <h3 className="font-black text-sm text-foreground">
                Daftar Prospek & Pelanggan Binaan Anda ({leads.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Trial: {stats.activeTrialsCount} • Sudah Upgrade Berbayar: {stats.upgradedLeadsCount}
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/60">
                  <TableRow>
                    <TableHead className="text-xs font-extrabold uppercase">Nama & Email</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Status Paket</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Pemakaian AI</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Tgl Daftar</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase text-right">Follow Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeads ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                        Memuat data prospek...
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada prospek trial yang didaftarkan. Mulai daftarkan rekan guru di form atas!
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const isTrial = lead.account_type === 'trial';
                      const quotaMax = lead.trial_quota_limit || settings.trial_quota_per_user || 25;
                      const used = lead.generation_count ?? 0;
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
                            <Badge
                              className={`text-[10px] font-bold uppercase ${
                                isTrial
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isTrial
                                ? lead.is_claimed
                                  ? 'Trial (Sudah Login)'
                                  : 'Trial (Belum Login)'
                                : `Aktif (${lead.account_type})`}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs">
                            {isTrial ? (
                              <span className={used >= quotaMax ? 'text-destructive font-bold' : 'font-semibold'}>
                                {used} / {quotaMax}x generate
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">Unlimited ✅</span>
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
                            <a
                              href={buildFollowUpLeadWaUrl(lead)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-2 border-emerald-600/50 hover:bg-emerald-500/10 text-emerald-700 font-bold text-xs gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                WA Info / Follow Up
                              </Button>
                            </a>
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

      {/* TAB 3: KOMISI & PENCAIRAN */}
      {activeTab === 'commissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Request Payout Form (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
            <div className="pb-3 border-b-2 border-foreground/15">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Ajukan Pencairan Komisi</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Saldo siap cair saat ini:{' '}
                <strong className="text-emerald-700 font-mono">
                  Rp {stats.availableBalance.toLocaleString('id-ID')}
                </strong>
              </p>
            </div>

            {(!affiliate.bank_name || !affiliate.bank_account_number) ? (
              <div className="p-4 bg-amber-500/15 border-2 border-amber-500 rounded-xl text-xs text-amber-950 space-y-2">
                <p className="font-extrabold">Rekening Pencairan Belum Diisi</p>
                <p>Lengkapi nama bank/e-wallet dan nomor rekening Anda di tab Profil & Rekening terlebih dahulu.</p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                  className="bg-amber-600 text-white font-bold text-xs border-2 border-foreground"
                >
                  Isi Rekening Sekarang →
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestPayoutSubmit} className="space-y-4">
                <div className="p-3 bg-secondary/60 rounded-xl border border-foreground/20 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Rekening Tujuan:
                  </span>
                  <p className="font-extrabold text-foreground">
                    {affiliate.bank_name} — <span className="font-mono">{affiliate.bank_account_number}</span>
                  </p>
                  <p className="text-muted-foreground">a.n. {affiliate.bank_account_holder}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nominal Pencairan (Rp)</Label>
                  <Input
                    type="number"
                    min={1000}
                    max={stats.availableBalance}
                    required
                    placeholder={`Maks: ${stats.availableBalance}`}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Gratis biaya admin mulai Rp {(settings.min_payout_free_fee ?? 50000).toLocaleString('id-ID')}</span>
                    {stats.availableBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayoutAmount(String(stats.availableBalance))}
                        className="text-primary font-bold hover:underline"
                      >
                        Tarik Semua
                      </button>
                    )}
                  </div>
                </div>

                {numericPayoutInput > 0 && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      isBelowFreeFee
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-950'
                        : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>Nominal Diajukan:</span>
                      <span className="font-mono font-bold">Rp {numericPayoutInput.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Admin Transfer:</span>
                      <span className="font-mono font-bold">
                        {isBelowFreeFee ? `- Rp ${estimatedFee.toLocaleString('id-ID')} (ditanggung afiliator)` : 'Rp 0 (Gratis)'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-foreground/15 font-extrabold">
                      <span>Estimasi Diterima:</span>
                      <span className="font-mono">Rp {estimatedNet.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={requestPayoutMutation.isPending || stats.availableBalance <= 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-black text-xs py-5 shadow-brutal-sm"
                >
                  {requestPayoutMutation.isPending ? 'Mengirim Pengajuan...' : 'Ajukan Pencairan Sekarang'}
                </Button>
              </form>
            )}

            {/* Payout History List */}
            {payouts.length > 0 && (
              <div className="pt-4 border-t-2 border-foreground/15 space-y-2">
                <h3 className="text-xs font-extrabold uppercase text-muted-foreground">
                  Riwayat Pencairan ({payouts.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {payouts.map((p) => (
                    <div key={p.id} className="p-3 bg-secondary/40 rounded-xl border border-foreground/15 text-xs flex items-center justify-between gap-2">
                      <div>
                        <p className="font-mono font-black text-foreground">
                          Rp {p.net_amount.toLocaleString('id-ID')}
                          {p.admin_fee > 0 && (
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">
                              (Fee Rp {p.admin_fee.toLocaleString('id-ID')})
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.requested_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {p.transfer_reference ? ` • Ref: ${p.transfer_reference}` : ''}
                        </p>
                      </div>
                      <Badge
                        className={`text-[10px] font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-600 text-white'
                            : p.status === 'rejected'
                            ? 'bg-destructive text-white'
                            : 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                        }`}
                      >
                        {p.status === 'paid' ? 'Sudah Ditransfer' : p.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Commission Ledger (7 cols) */}
          <div className="lg:col-span-7 bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
            <div className="p-4 border-b-2 border-foreground/15">
              <h3 className="font-black text-sm text-foreground">
                Riwayat Komisi Masuk ({commissions.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/60">
                  <TableRow>
                    <TableHead className="text-xs font-extrabold uppercase">Tanggal & Pembeli</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Paket</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Komisi</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingComms ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                        Memuat komisi...
                      </TableCell>
                    </TableRow>
                  ) : commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada komisi tercatat. Bagikan link LP Anda atau daftarkan user trial sekarang!
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="py-3">
                          <p className="font-bold text-xs text-foreground">
                            {c.customer_name || c.customer_email}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{c.customer_email}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {c.package_type}
                          </Badge>
                          {c.is_renewal && (
                            <Badge className="ml-1 bg-blue-600 text-white text-[9px]">Renewal</Badge>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            Order: Rp {c.order_amount.toLocaleString('id-ID')}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 font-mono font-black text-sm text-emerald-700">
                          +Rp {c.commission_amount.toLocaleString('id-ID')}
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            ({c.commission_rate}%)
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={`text-[10px] font-bold ${
                              c.status === 'paid'
                                ? 'bg-blue-600 text-white'
                                : c.status === 'approved'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500/20 text-amber-800'
                            }`}
                          >
                            {c.status === 'paid' ? 'Sudah Cair' : c.status === 'approved' ? 'Siap Cair' : c.status}
                          </Badge>
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

      {/* TAB 4: MARKETING KIT */}
      {activeTab === 'marketing' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Semua Materi' },
                { id: 'copywriting', label: 'Copywriting WA/Medsos' },
                { id: 'banner', label: 'Banner & Poster' },
                { id: 'video', label: 'Video Demo' },
                { id: 'presentasi', label: 'Slide Presentasi' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setKitCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                    kitCategory === cat.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-foreground/20 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">
              ✨ Link afiliasi Anda otomatis tersisip saat menyalin teks!
            </span>
          </div>

          {filteredKits.length === 0 ? (
            <div className="p-10 bg-card border-2 border-foreground rounded-2xl text-center text-sm text-muted-foreground">
              Belum ada materi Marketing Kit pada kategori ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKits.map((kit) => {
                const renderedText = kit.content_text
                  ? renderMarketingKitText(kit.content_text, affiliate.affiliate_code, affiliate.display_name)
                  : '';
                const CatIcon =
                  kit.category === 'banner'
                    ? ImageIcon
                    : kit.category === 'video'
                    ? Video
                    : kit.category === 'presentasi'
                    ? Presentation
                    : FileText;

                return (
                  <div
                    key={kit.id}
                    className="p-5 bg-card border-2 border-foreground rounded-2xl shadow-brutal-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-foreground">{kit.title}</h3>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">
                              {kit.category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {kit.description && (
                        <p className="text-xs text-muted-foreground">{kit.description}</p>
                      )}

                      {kit.thumbnail_url && (
                        <img
                          src={kit.thumbnail_url}
                          alt={kit.title}
                          className="w-full max-h-48 object-cover rounded-xl border border-foreground/20"
                        />
                      )}

                      {renderedText && (
                        <pre className="whitespace-pre-wrap font-sans text-xs bg-secondary/60 p-3.5 rounded-xl border border-foreground/15 text-foreground max-h-48 overflow-y-auto leading-relaxed">
                          {renderedText}
                        </pre>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-foreground/10">
                      {renderedText && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleCopy(renderedText, `kit-${kit.id}`, 'Teks promosi')}
                            className="bg-primary text-primary-foreground border-2 border-foreground font-bold text-xs gap-1.5 shadow-brutal-sm"
                          >
                            {copiedKey === `kit-${kit.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey === `kit-${kit.id}` ? 'Tersalin!' : 'Salin Teks'}
                          </Button>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(renderedText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-2 border-emerald-600/50 text-emerald-700 font-bold text-xs gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Share WA
                            </Button>
                          </a>
                        </>
                      )}
                      {kit.asset_url && (
                        <a href={kit.asset_url} target="_blank" rel="noopener noreferrer">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 border-foreground font-bold text-xs gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Buka / Unduh Asset
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROFIL & REKENING */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
          <div className="pb-3 border-b-2 border-foreground/15">
            <h2 className="text-lg font-black text-foreground">Profil Afiliator & Rekening Pencairan</h2>
            <p className="text-xs text-muted-foreground">
              Data rekening ini digunakan oleh Admin untuk mentransfer komisi afiliasi Anda.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate({
                id: affiliate.id,
                updates: profileForm,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nama Tampilan</Label>
                <Input
                  required
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                  className="border-2 border-foreground/30 font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Kode Unik Afiliasi</Label>
                <Input
                  required
                  value={profileForm.affiliate_code}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      affiliate_code: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase(),
                    })
                  }
                  className="font-mono uppercase font-bold border-2 border-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nomor WhatsApp Afiliator</Label>
              <Input
                type="tel"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                placeholder="081234567890"
                className="font-mono border-2 border-foreground/30"
              />
            </div>

            <div className="pt-2 border-t border-foreground/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Bank / E-Wallet</Label>
                <Input
                  placeholder="BCA / BRI / DANA / SeaBank"
                  value={profileForm.bank_name}
                  onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                  className="border-2 border-foreground/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nomor Rekening</Label>
                <Input
                  placeholder="1234567890"
                  value={profileForm.bank_account_number}
                  onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })}
                  className="font-mono border-2 border-foreground/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Atas Nama</Label>
                <Input
                  placeholder="Nama pemilik rekening"
                  value={profileForm.bank_account_holder}
                  onChange={(e) => setProfileForm({ ...profileForm, bank_account_holder: e.target.value })}
                  className="border-2 border-foreground/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-primary text-primary-foreground border-2 border-foreground font-black text-xs px-6 py-5 shadow-brutal-sm"
            >
              {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil & Rekening'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
