import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  TrendingUp,
  RefreshCw,
  Phone,
  Mail,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ActivationMessageModal,
  CustomerActivationInfo,
  cleanPhoneForWhatsApp,
} from '@/components/admin/ActivationMessageModal';

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  const {
    orders,
    isLoading,
    refetch,
    approveOrderAsync,
    isApproving,
    cancelOrder,
    isCancelling,
    deleteOrder,
    isDeleting,
  } = useOrders(statusFilter, searchQuery);

  // Activation Message Modal state
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<CustomerActivationInfo | null>(null);

  // Confirm dialogs
  const [approveConfirmOrder, setApproveConfirmOrder] = useState<Order | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    let pendingCount = 0;
    let paidCount = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      if (o.status === 'pending') pendingCount++;
      if (o.status === 'paid') {
        paidCount++;
        totalRevenue += Number(o.total_amount || 0);
      }
    });

    return { totalOrders, pendingCount, paidCount, totalRevenue };
  }, [orders]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(id);
    toast.success('Disalin ke clipboard!');
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Handle Approving Order & Auto-Opening Activation Modal
  const handleExecuteApprove = async (order: Order) => {
    try {
      const result = await approveOrderAsync(order);
      setApproveConfirmOrder(null);

      // Immediately prepare activation info and open WhatsApp activation modal
      setSelectedCustomerForModal(result.activationInfo);
      setActivationModalOpen(true);
    } catch (err: any) {
      console.error('Approval failed:', err);
    }
  };

  // Open WhatsApp Modal directly for any order
  const handleOpenWaModal = (order: Order) => {
    const accountType =
      order.package_type === 'lite'
        ? 'lite'
        : order.package_type === 'pro' || order.package_type === 'pro_annual'
        ? 'pro_annual'
        : 'annual';

    setSelectedCustomerForModal({
      email: order.buyer_email,
      name: order.buyer_name,
      phone: order.buyer_whatsapp,
      account_type: accountType,
    });
    setActivationModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
              <ShoppingCart className="w-7 h-7 text-primary" />
              <span>Daftar Pesanan & Transaksi Langsung</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Pantau pesanan paket Modul Ajar, verifikasi pembayaran, serta aktivasi akses otomatis ke sistem.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-2 border-foreground hover:bg-secondary font-bold text-xs gap-1.5 self-start sm:self-auto shadow-brutal-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pesanan */}
          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Pesanan</span>
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
              {metrics.totalOrders}
            </div>
          </div>

          {/* Menunggu Bayar */}
          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Menunggu Bayar</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
              {metrics.pendingCount}
            </div>
          </div>

          {/* Lunas & Selesai */}
          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Lunas & Selesai</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
              {metrics.paidCount}
            </div>
          </div>

          {/* Total Omzet */}
          <div className="p-4 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-1">
            <div className="flex items-center justify-between text-primary">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Omzet Lunas</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground truncate">
              Rp {metrics.totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl border-2 border-foreground/30 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Menunggu Bayar' },
              { id: 'paid', label: 'Lunas' },
              { id: 'cancelled', label: 'Dibatalkan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari invoice / pembeli / email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-2 border-foreground/30 text-xs font-medium bg-card"
            />
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/60 border-b-2 border-foreground/20">
                <TableRow>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Invoice & Tanggal</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Data Pembeli</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Paket</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Total Tagihan</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data pesanan...
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      Belum ada transaksi pesanan yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const isPaid = order.status === 'paid';
                    const isPending = order.status === 'pending';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <TableRow key={order.id} className="border-b border-foreground/10 hover:bg-secondary/30 transition-colors">
                        {/* Invoice & Date */}
                        <TableCell className="align-top py-3.5">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-foreground">
                            <span>#{order.invoice}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.invoice, order.id)}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="Salin Invoice"
                            >
                              {copiedInvoice === order.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {order.coupon_code && (
                            <Badge variant="outline" className="mt-1 text-[10px] font-mono border-emerald-600/40 text-emerald-700 bg-emerald-500/10">
                              Kupon: {order.coupon_code}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Buyer Data */}
                        <TableCell className="align-top py-3.5">
                          <div className="font-extrabold text-sm text-foreground">
                            {order.buyer_name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{order.buyer_email}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{order.buyer_whatsapp}</span>
                          </div>
                        </TableCell>

                        {/* Package */}
                        <TableCell className="align-top py-3.5">
                          <Badge
                            className={`font-bold text-xs ${
                              order.package_type === 'pro' || order.package_type === 'pro_annual'
                                ? 'bg-primary text-primary-foreground'
                                : order.package_type === 'standar' || order.package_type === 'annual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-secondary text-foreground border border-foreground/30'
                            }`}
                          >
                            {order.item_title}
                          </Badge>
                          {order.notes && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 italic">
                              "{order.notes}"
                            </p>
                          )}
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="align-top py-3.5">
                          <div className="font-black font-mono text-sm text-foreground">
                            Rp {order.total_amount?.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Unik: +{order.unique_code}
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              Hemat: -Rp {order.discount_amount?.toLocaleString('id-ID')}
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="align-top py-3.5">
                          <Badge
                            className={`font-bold text-[11px] capitalize ${
                              isPaid
                                ? 'bg-emerald-600 text-white'
                                : isCancelled
                                ? 'bg-destructive/20 text-destructive border border-destructive/40'
                                : 'bg-amber-500/20 text-amber-800 border border-amber-600/40'
                            }`}
                          >
                            {isPaid ? 'Lunas' : isCancelled ? 'Dibatalkan' : 'Pending'}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* "Setujui" Button (Only if pending) */}
                            {isPending && (
                              <Button
                                size="sm"
                                onClick={() => setApproveConfirmOrder(order)}
                                disabled={isApproving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-bold text-xs h-8 px-2.5 shadow-brutal-sm gap-1 active:translate-x-[1px] active:translate-y-[1px]"
                                title="Setujui pesanan & aktivasi akun otomatis"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </Button>
                            )}

                            {/* "WA" Button (Opens Activation Modal) */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenWaModal(order)}
                              className="border-2 border-emerald-600/50 hover:bg-emerald-500/10 text-emerald-700 font-bold text-xs h-8 px-2 shadow-brutal-sm gap-1"
                              title="Kirim pesan aktivasi ke WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WA</span>
                            </Button>

                            {/* Cancel Button (If pending) */}
                            {isPending && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancelConfirmOrder(order)}
                                className="border border-foreground/30 hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                                title="Batalkan pesanan"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmOrder(order)}
                              className="border border-foreground/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive h-8 px-2"
                              title="Hapus pesanan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

        {/* DIALOG 1: Confirm Approve Order */}
        {approveConfirmOrder && (
          <Dialog open={!!approveConfirmOrder} onOpenChange={(open) => !open && setApproveConfirmOrder(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Konfirmasi Setujui Pesanan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verifikasi pembayaran dan aktivasi otomatis akun pembeli.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-secondary/60 border border-foreground/20 rounded-xl space-y-2 text-xs">
                <p>
                  <strong className="text-foreground">Invoice:</strong> #{approveConfirmOrder.invoice}
                </p>
                <p>
                  <strong className="text-foreground">Pembeli:</strong> {approveConfirmOrder.buyer_name} ({approveConfirmOrder.buyer_email})
                </p>
                <p>
                  <strong className="text-foreground">Paket:</strong> {approveConfirmOrder.item_title}
                </p>
                <p>
                  <strong className="text-foreground">Total Tagihan:</strong> Rp {approveConfirmOrder.total_amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Setelah disetujui, email <strong>{approveConfirmOrder.buyer_email}</strong> akan <strong>otomatis terdaftar/aktif</strong> di data pelanggan. Anda tidak perlu memasukkan email secara manual lagi!
                </p>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApproveConfirmOrder(null)}
                  className="border-2 border-foreground"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleExecuteApprove(approveConfirmOrder)}
                  disabled={isApproving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-foreground shadow-brutal-sm"
                >
                  {isApproving ? 'Mengaktifkan...' : 'Ya, Setujui & Aktifkan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DIALOG 2: Confirm Cancel Order */}
        {cancelConfirmOrder && (
          <Dialog open={!!cancelConfirmOrder} onOpenChange={(open) => !open && setCancelConfirmOrder(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  Batalkan Pesanan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ubah status pesanan #{cancelConfirmOrder.invoice} menjadi Dibatalkan?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelConfirmOrder(null)}
                  className="border-2 border-foreground"
                >
                  Tutup
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    cancelOrder(cancelConfirmOrder.id);
                    setCancelConfirmOrder(null);
                  }}
                  disabled={isCancelling}
                  className="border-2 border-foreground font-bold shadow-brutal-sm"
                >
                  Ya, Batalkan Pesanan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* DIALOG 3: Confirm Delete Order */}
        {deleteConfirmOrder && (
          <Dialog open={!!deleteConfirmOrder} onOpenChange={(open) => !open && setDeleteConfirmOrder(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Hapus Pesanan Permanen
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Data pesanan #{deleteConfirmOrder.invoice} akan dihapus permanen dari database.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmOrder(null)}
                  className="border-2 border-foreground"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    deleteOrder(deleteConfirmOrder.id);
                    setDeleteConfirmOrder(null);
                  }}
                  disabled={isDeleting}
                  className="border-2 border-foreground font-bold shadow-brutal-sm"
                >
                  Hapus Permanen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ACTIVATION WHATSAPP MODAL (Existing Component) */}
        <ActivationMessageModal
          isOpen={activationModalOpen}
          onClose={() => {
            setActivationModalOpen(false);
            setSelectedCustomerForModal(null);
          }}
          customer={selectedCustomerForModal}
          onPhoneUpdated={() => {
            refetch();
          }}
        />
      </div>
    </AdminLayout>
  );
}
