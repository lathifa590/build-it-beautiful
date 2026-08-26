import { useState, useRef, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  useAllowedCustomers,
  useAddAllowedCustomer,
  useAddBulkAllowedCustomers,
  useDeleteAllowedCustomer,
  useUpdateAllowedCustomer,
  useExtendSubscription,
  AllowedCustomer,
} from '@/hooks/useAllowedCustomers';
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  FileSpreadsheet,
  Users,
  UserCheck,
  Loader2,
  X,
  RefreshCw,
  Infinity as InfinityIcon,
  Calendar,
  AlertTriangle,
  CalendarPlus,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FilterType = 'all' | 'lifetime' | 'annual' | 'trial' | 'expiring' | 'expired';

const ANNUAL_PRICE = 149_000;

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const computeStatus = (c: AllowedCustomer) => {
  const isLifetime = c.account_type === 'lifetime' || c.account_type === 'regular' || c.account_type === 'pro_lifetime';
  if (isLifetime) {
    return { label: c.account_type === 'pro_lifetime' ? 'PRO Lifetime' : 'Lifetime', tone: 'lifetime' as const, daysLeft: null as number | null };
  }
  if (c.account_type === 'trial') {
    return { label: 'Trial', tone: 'trial' as const, daysLeft: null };
  }
  if (c.account_type === 'annual' || c.account_type === 'pro_annual') {
    if (!c.subscription_expires_at) return { label: c.account_type === 'pro_annual' ? 'PRO Tahunan' : 'Tahunan', tone: 'annual' as const, daysLeft: null };
    const diffMs = new Date(c.subscription_expires_at).getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / 86400000);
    if (daysLeft <= 0) return { label: 'Expired', tone: 'expired' as const, daysLeft };
    if (daysLeft <= 30) return { label: `${daysLeft}h lagi`, tone: 'expiring' as const, daysLeft };
    return { label: c.account_type === 'pro_annual' ? 'PRO Aktif' : 'Aktif', tone: 'annual' as const, daysLeft };
  }
  return { label: c.account_type, tone: 'annual' as const, daysLeft: null };
};

const TYPE_BADGE: Record<string, string> = {
  lifetime: 'bg-amber-100 text-amber-800 border-amber-300',
  pro_lifetime: 'bg-amber-100 text-amber-800 border-amber-300',
  annual: 'bg-blue-100 text-blue-800 border-blue-300',
  pro_annual: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  expiring: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  expired: 'bg-red-100 text-red-800 border-red-400',
  trial: 'bg-purple-100 text-purple-700 border-purple-300',
};

const AdminCustomers = () => {
  const { data: customers, isLoading, error } = useAllowedCustomers();
  const addCustomer = useAddAllowedCustomer();
  const addBulkCustomers = useAddBulkAllowedCustomers();
  const deleteCustomer = useDeleteAllowedCustomer();
  const updateCustomer = useUpdateAllowedCustomer();
  const extendSub = useExtendSubscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AllowedCustomer | null>(null);
  const [editForm, setEditForm] = useState({ account_type: 'annual', subscription_expires_at: '' });
  const [deleteTarget, setDeleteTarget] = useState<AllowedCustomer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    email: '',
    name: '',
    phone: '',
    account_type: 'annual',
    subscription_expires_at: '',
  });
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [batchText, setBatchText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const list = customers || [];
    const lifetime = list.filter((c) => c.account_type === 'lifetime' || c.account_type === 'regular' || c.account_type === 'pro_lifetime').length;
    const annualActive = list.filter((c) => {
      if ((c.account_type !== 'annual' && c.account_type !== 'pro_annual') || !c.subscription_expires_at) return false;
      const d = Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000);
      return d > 30;
    }).length;
    const expiringSoon = list.filter((c) => {
      if ((c.account_type !== 'annual' && c.account_type !== 'pro_annual') || !c.subscription_expires_at) return false;
      const d = Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000);
      return d > 0 && d <= 30;
    }).length;
    const expired = list.filter((c) => {
      if ((c.account_type !== 'annual' && c.account_type !== 'pro_annual') || !c.subscription_expires_at) return false;
      return new Date(c.subscription_expires_at).getTime() <= Date.now();
    }).length;
    const trial = list.filter((c) => c.account_type === 'trial').length;
    const annualTotal = annualActive + expiringSoon;
    return {
      total: list.length,
      lifetime,
      annualActive,
      expiringSoon,
      expired,
      trial,
      mrr: annualTotal * (ANNUAL_PRICE / 12),
      yearlyRev: annualTotal * ANNUAL_PRICE,
    };
  }, [customers]);

  const filteredCustomers = (customers || [])
    .filter((c) => {
      if (filter === 'lifetime') return c.account_type === 'lifetime' || c.account_type === 'regular' || c.account_type === 'pro_lifetime';
      if (filter === 'annual') return c.account_type === 'annual' || c.account_type === 'pro_annual';
      if (filter === 'trial') return c.account_type === 'trial';
      if (filter === 'expiring') {
        if ((c.account_type !== 'annual' && c.account_type !== 'pro_annual') || !c.subscription_expires_at) return false;
        const d = Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000);
        return d > 0 && d <= 30;
      }
      if (filter === 'expired') {
        if ((c.account_type !== 'annual' && c.account_type !== 'pro_annual') || !c.subscription_expires_at) return false;
        return new Date(c.subscription_expires_at).getTime() <= Date.now();
      }
      return true;
    })
    .filter(
      (c) =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

  const parseBatchEntries = (text: string) =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.includes('@'))
      .map((line) => {
        if (line.includes(',')) {
          const [email, name, phone] = line.split(',').map((s) => s.trim());
          return {
            email,
            name: name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            phone,
          };
        }
        const prefix = line.split('@')[0];
        const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        return { email: line, name, phone: undefined };
      });

  const validBatchCount = parseBatchEntries(batchText).length;

  const handleBatchAdd = async () => {
    const entries = parseBatchEntries(batchText);
    if (entries.length === 0) return toast.error('Tidak ada email valid ditemukan');
    try {
      await addBulkCustomers.mutateAsync(entries);
      toast.success(`${entries.length} pelanggan tahunan berhasil ditambahkan`);
      setBatchText('');
      setShowAddModal(false);
      setAddMode('single');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan pelanggan');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCustomer.mutateAsync({
        email: newCustomer.email,
        name: newCustomer.name,
        phone: newCustomer.phone,
        account_type: newCustomer.account_type,
        subscription_expires_at: newCustomer.subscription_expires_at
          ? new Date(newCustomer.subscription_expires_at).toISOString()
          : null,
      });
      toast.success('Pelanggan berhasil ditambahkan');
      setNewCustomer({ email: '', name: '', phone: '', account_type: 'annual', subscription_expires_at: '' });
      setShowAddModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambahkan pelanggan');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      return toast.error('Format file harus CSV atau TXT');
    }
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
      const list: { email: string; name: string; phone?: string }[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(',');
        if (parts.length >= 2) {
          const email = parts[0]?.trim();
          const name = parts[1]?.trim();
          const phone = parts[2]?.trim();
          if (email && name && email.includes('@')) list.push({ email, name, phone });
        }
      }
      if (!list.length) return toast.error('Tidak ada data valid ditemukan');
      await addBulkCustomers.mutateAsync(list);
      toast.success(`${list.length} pelanggan berhasil diimport sebagai tahunan`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengimport file');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      toast.success('Pelanggan berhasil dihapus');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSyncLynk = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error('Sesi login tidak ditemukan');
      const response = await supabase.functions.invoke('sync-lynk-customers', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.error) throw new Error('Gagal sync dari Lynk.id');
      const result = response.data;
      result.synced > 0 ? toast.success(result.message) : toast.info(result.message);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const openEdit = (c: AllowedCustomer) => {
    setEditTarget(c);
    setEditForm({
      account_type: c.account_type === 'regular' ? 'lifetime' : c.account_type,
      subscription_expires_at: c.subscription_expires_at
        ? new Date(c.subscription_expires_at).toISOString().slice(0, 10)
        : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    try {
      await updateCustomer.mutateAsync({
        id: editTarget.id,
        account_type: editForm.account_type,
        subscription_expires_at:
          (editForm.account_type === 'annual' || editForm.account_type === 'pro_annual') && editForm.subscription_expires_at
            ? new Date(editForm.subscription_expires_at).toISOString()
            : null,
      });
      toast.success('Pelanggan diperbarui');
      setEditTarget(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExtend = async (c: AllowedCustomer) => {
    try {
      await extendSub.mutateAsync({ id: c.id, currentExpiresAt: c.subscription_expires_at });
      toast.success(`Langganan ${c.name} diperpanjang +1 tahun`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-destructive">Error: {error.message}</div>
      </AdminLayout>
    );
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    tone,
    onClick,
  }: {
    icon: any;
    label: string;
    value: string | number;
    tone: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`text-left bg-card border-2 border-foreground rounded-xl p-4 shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${tone} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-extrabold truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Manajemen Langganan</h1>
            <p className="text-muted-foreground">Kelola tipe akun, kedaluwarsa, dan pelanggan tahunan</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncLynk}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-accent border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-medium text-sm hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Lynk.id'}</span>
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-foreground rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="font-medium text-sm">Import CSV</span>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">Tambah</span>
            </button>
          </div>
        </div>

        {/* Revenue projection */}
        <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 border-2 border-foreground rounded-xl p-5 shadow-brutal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl border-2 border-foreground flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Proyeksi Tahunan (Pelanggan Tahunan Aktif)</p>
              <p className="text-2xl sm:text-3xl font-extrabold">
                Rp {stats.yearlyRev.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-muted-foreground">
                ≈ Rp {Math.round(stats.mrr).toLocaleString('id-ID')} / bulan setara MRR
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <p>Harga per akun: <strong className="text-foreground">Rp {ANNUAL_PRICE.toLocaleString('id-ID')}</strong> / tahun</p>
            <p>Jumlah aktif: <strong className="text-foreground">{stats.annualActive + stats.expiringSoon}</strong> tahunan</p>
          </div>
        </div>

        {/* Stats — clickable filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Users} label="Total" value={stats.total} tone="bg-primary/10 text-primary" onClick={() => setFilter('all')} />
          <StatCard icon={InfinityIcon} label="Lifetime" value={stats.lifetime} tone="bg-amber-100 text-amber-700" onClick={() => setFilter('lifetime')} />
          <StatCard icon={Calendar} label="Tahunan Aktif" value={stats.annualActive} tone="bg-blue-100 text-blue-700" onClick={() => setFilter('annual')} />
          <StatCard icon={Clock} label="≤ 30 Hari" value={stats.expiringSoon} tone="bg-yellow-100 text-yellow-700" onClick={() => setFilter('expiring')} />
          <StatCard icon={AlertTriangle} label="Expired" value={stats.expired} tone="bg-red-100 text-red-700" onClick={() => setFilter('expired')} />
          <StatCard icon={UserCheck} label="Trial" value={stats.trial} tone="bg-purple-100 text-purple-700" onClick={() => setFilter('trial')} />
        </div>

        {/* Filter pills + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari email, nama, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
            />
          </div>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="flex items-center gap-2 px-4 py-3 bg-foreground text-background border-2 border-foreground rounded-lg text-sm font-bold"
            >
              Filter: {filter}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || filter !== 'all' ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-foreground">
                    <TableHead className="font-bold whitespace-nowrap">Nama</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Email</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Tipe</TableHead>
                    <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                    <TableHead className="font-bold whitespace-nowrap hidden md:table-cell">Berakhir</TableHead>
                    <TableHead className="font-bold whitespace-nowrap hidden lg:table-cell">Login</TableHead>
                    <TableHead className="font-bold text-right whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const status = computeStatus(customer);
                    const isLifetime = status.tone === 'lifetime';
                    return (
                      <TableRow key={customer.id} className="border-b border-foreground/10">
                        <TableCell className="font-medium whitespace-nowrap max-w-[160px] truncate">
                          {customer.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-[200px] truncate text-sm">
                          {customer.email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-bold whitespace-nowrap ${
                              TYPE_BADGE[
                                customer.account_type === 'regular' ? 'lifetime' : customer.account_type
                              ] || TYPE_BADGE.annual
                            }`}
                          >
                            {isLifetime && <InfinityIcon className="w-3 h-3" />}
                            {customer.account_type === 'regular' ? 'Lifetime' :
                              customer.account_type === 'lifetime' ? 'Lifetime' :
                              customer.account_type === 'annual' ? 'Tahunan' :
                              customer.account_type === 'trial' ? 'Trial' : customer.account_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium whitespace-nowrap ${
                              TYPE_BADGE[status.tone] || TYPE_BADGE.annual
                            }`}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap hidden md:table-cell text-sm">
                          {isLifetime ? (
                            <span className="text-amber-700 font-medium">Selamanya</span>
                          ) : (
                            formatDate(customer.subscription_expires_at)
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap hidden lg:table-cell">
                          {customer.is_claimed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {customer.account_type === 'annual' && (
                              <button
                                onClick={() => handleExtend(customer)}
                                disabled={extendSub.isPending}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Perpanjang +1 tahun"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(customer)}
                              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(customer)}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* CSV Format Helper */}
        <div className="bg-secondary/50 border-2 border-dashed border-foreground/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Catatan Tipe Akun</p>
              <p>
                <strong>Lifetime</strong> = pelanggan lama (akses selamanya, tidak akan expired).
                <strong> Tahunan</strong> = paket Rp 149.000 / tahun, otomatis dicek expiry-nya.
                <strong> Trial</strong> = kuota terbatas per hari.
              </p>
              <p className="mt-1">Import CSV & sync Lynk.id otomatis menambahkan sebagai <strong>Tahunan</strong> dengan masa aktif 1 tahun dari sekarang.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-foreground sticky top-0 bg-card">
              <h3 className="font-bold text-lg">Tambah Pelanggan</h3>
              <button
                onClick={() => { setShowAddModal(false); setAddMode('single'); setBatchText(''); }}
                className="p-1 hover:bg-secondary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex border-b-2 border-foreground/10">
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${addMode === 'single' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Satu
              </button>
              <button
                type="button"
                onClick={() => setAddMode('batch')}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${addMode === 'batch' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Batch
              </button>
            </div>

            {addMode === 'single' ? (
              <form onSubmit={handleAddCustomer} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Email *</label>
                  <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="nama@email.com" className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Nama *</label>
                  <input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Nama lengkap" className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Telepon</label>
                  <input type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="081234567890" className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tipe Akun</label>
                  <select
                    value={newCustomer.account_type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, account_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background"
                  >
                    <option value="annual">Tahunan (Biasa)</option>
                    <option value="lifetime">Lifetime (Biasa)</option>
                    <option value="pro_annual">Tahunan (PRO Workspace)</option>
                    <option value="pro_lifetime">Lifetime (PRO Workspace)</option>
                    <option value="trial">Trial (Kuota Terbatas)</option>
                  </select>
                </div>
                {(newCustomer.account_type === 'annual' || newCustomer.account_type === 'pro_annual') && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tanggal Berakhir</label>
                    <input
                      type="date"
                      value={newCustomer.subscription_expires_at}
                      onChange={(e) => setNewCustomer({ ...newCustomer, subscription_expires_at: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Kosongkan untuk auto +1 tahun dari sekarang</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border-2 border-foreground rounded-lg font-medium hover:bg-secondary transition-colors">Batal</button>
                  <button type="submit" disabled={addCustomer.isPending} className="flex-1 py-3 bg-primary text-primary-foreground border-2 border-foreground rounded-lg font-medium shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50">
                    {addCustomer.isPending ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Paste daftar email (satu per baris)</label>
                  <textarea
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder={"guru1@email.com\nguru2@email.com\n\nAtau format CSV:\nemail, nama, telepon"}
                    className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background min-h-[180px] text-sm font-mono resize-y"
                    rows={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ℹ️ Semua entri ditambahkan sebagai <strong>Tahunan</strong> dengan masa aktif 1 tahun.
                </p>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddModal(false); setBatchText(''); setAddMode('single'); }} className="flex-1 py-3 border-2 border-foreground rounded-lg font-medium hover:bg-secondary transition-colors">Batal</button>
                  <button
                    type="button"
                    onClick={handleBatchAdd}
                    disabled={validBatchCount === 0 || addBulkCustomers.isPending}
                    className="flex-1 py-3 bg-primary text-primary-foreground border-2 border-foreground rounded-lg font-medium shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    {addBulkCustomers.isPending ? 'Menyimpan...' : `Tambah ${validBatchCount} Pelanggan`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
              <h3 className="font-bold text-lg">Edit Langganan</h3>
              <button onClick={() => setEditTarget(null)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-secondary/50 border border-foreground/20 rounded-lg p-3">
                <p className="font-bold text-sm">{editTarget.name}</p>
                <p className="text-xs text-muted-foreground">{editTarget.email}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tipe Akun</label>
                <select
                  value={editForm.account_type}
                  onChange={(e) => setEditForm({ ...editForm, account_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background"
                >
                  <option value="annual">Tahunan (Biasa)</option>
                  <option value="lifetime">Lifetime (Biasa)</option>
                  <option value="pro_annual">Tahunan (PRO Workspace)</option>
                  <option value="pro_lifetime">Lifetime (PRO Workspace)</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
              {(editForm.account_type === 'annual' || editForm.account_type === 'pro_annual') && (
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tanggal Berakhir</label>
                  <input
                    type="date"
                    value={editForm.subscription_expires_at}
                    onChange={(e) => setEditForm({ ...editForm, subscription_expires_at: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTarget(null)} className="flex-1 py-3 border-2 border-foreground rounded-lg font-medium hover:bg-secondary">Batal</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateCustomer.isPending}
                  className="flex-1 py-3 bg-primary text-primary-foreground border-2 border-foreground rounded-lg font-medium shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  {updateCustomer.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) dari daftar pelanggan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCustomers;
