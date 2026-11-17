import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '@/hooks/useCoupons';
import { Coupon, DiscountType } from '@/types/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Ticket,
  Plus,
  Search,
  Copy,
  Check,
  Percent,
  Banknote,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const { data: coupons = [], isLoading, refetch } = useCoupons();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCoupon();

  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal Create / Edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Delete Confirm Dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discount_type: 'percentage' as DiscountType,
    discount_value: 20,
    has_max_discount: false,
    max_discount_amount: 50000,
    min_purchase_amount: 0,
    has_quota: false,
    max_uses: 100,
    applicable_to: 'all',
    is_active: true,
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      discount_type: 'percentage',
      discount_value: 20,
      has_max_discount: false,
      max_discount_amount: 50000,
      min_purchase_amount: 0,
      has_quota: false,
      max_uses: 100,
      applicable_to: 'all',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      has_max_discount: !!coupon.max_discount_amount,
      max_discount_amount: coupon.max_discount_amount || 50000,
      min_purchase_amount: coupon.min_purchase_amount || 0,
      has_quota: !!coupon.max_uses,
      max_uses: coupon.max_uses || 100,
      applicable_to: coupon.applicable_to || 'all',
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Kode kupon wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama promo kupon wajib diisi');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value) || 0,
      max_discount_amount: formData.has_max_discount ? Number(formData.max_discount_amount) : null,
      min_purchase_amount: Number(formData.min_purchase_amount) || 0,
      max_uses: formData.has_quota ? Number(formData.max_uses) : null,
      applicable_to: formData.applicable_to,
      is_active: formData.is_active,
    };

    try {
      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({
          id: editingCoupon.id,
          updates: payload,
        });
      } else {
        await createCouponMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Submit coupon error:', err);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await updateCouponMutation.mutateAsync({
        id: coupon.id,
        updates: { is_active: !coupon.is_active },
      });
    } catch (err: any) {
      console.error('Toggle coupon status error:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode "${code}" disalin!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
              <Ticket className="w-7 h-7 text-primary" />
              <span>Kupon & Voucher Diskon</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Buat dan atur kode kupon promosi untuk pembelian paket Modul Ajar di landing page & checkout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-2 border-foreground hover:bg-secondary font-bold text-xs gap-1.5 shadow-brutal-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground shadow-brutal-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kupon Baru</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode kupon atau nama promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-2 border-foreground/30 text-xs font-medium bg-card"
          />
        </div>

        {/* Coupons Table */}
        <div className="bg-card border-2 border-foreground rounded-2xl shadow-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/60 border-b-2 border-foreground/20">
                <TableRow>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Kode Kupon</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Nama & Nilai Diskon</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Penggunaan / Kuota</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Berlaku Untuk</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="font-extrabold text-foreground text-xs uppercase text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Memuat daftar kupon...
                    </TableCell>
                  </TableRow>
                ) : filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      Belum ada kupon yang dibuat. Klik tombol "Tambah Kupon Baru" untuk membuat kupon pertama.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className="border-b border-foreground/10 hover:bg-secondary/30 transition-colors">
                      {/* Code */}
                      <TableCell className="align-top py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-foreground bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/30">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-muted-foreground hover:text-foreground p-0.5"
                            title="Salin Kode"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Name & Discount Info */}
                      <TableCell className="align-top py-3.5">
                        <div className="font-extrabold text-sm text-foreground">
                          {coupon.name}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3 text-emerald-600" />
                              <span>Diskon {coupon.discount_value}%</span>
                              {coupon.max_discount_amount && (
                                <span className="text-muted-foreground font-normal">
                                  (Maks Rp {coupon.max_discount_amount.toLocaleString('id-ID')})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Banknote className="w-3 h-3 text-emerald-600" />
                              <span>Potongan Rp {coupon.discount_value.toLocaleString('id-ID')}</span>
                            </>
                          )}
                        </div>
                        {coupon.min_purchase_amount && coupon.min_purchase_amount > 0 ? (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Min. beli: Rp {coupon.min_purchase_amount.toLocaleString('id-ID')}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* Usage / Quota */}
                      <TableCell className="align-top py-3.5 font-mono text-xs">
                        <span className="font-bold text-foreground">{coupon.used_count || 0}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          / {coupon.max_uses ? coupon.max_uses : '∞'} kali
                        </span>
                      </TableCell>

                      {/* Applicable To */}
                      <TableCell className="align-top py-3.5">
                        <Badge variant="outline" className="border-foreground/30 text-[10px] font-bold uppercase">
                          {coupon.applicable_to === 'all'
                            ? 'Semua Paket'
                            : coupon.applicable_to === 'lite'
                            ? 'Paket Lite'
                            : coupon.applicable_to === 'annual'
                            ? 'Paket Standar'
                            : coupon.applicable_to === 'pro_annual'
                            ? 'Paket Pro'
                            : coupon.applicable_to}
                        </Badge>
                      </TableCell>

                      {/* Status Switch */}
                      <TableCell className="align-top py-3.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => handleToggleStatus(coupon)}
                          />
                          <span className={`text-xs font-bold ${coupon.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {coupon.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-top py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(coupon)}
                            className="border border-foreground/30 hover:bg-secondary h-8 px-2"
                            title="Edit kupon"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(coupon.id)}
                            className="border border-foreground/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive h-8 px-2"
                            title="Hapus kupon"
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

        {/* DIALOG: CREATE / EDIT COUPON */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                {editingCoupon ? 'Edit Kupon' : 'Buat Kupon Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tentukan kode, persentase atau potongan tetap, dan kuota pemakaian.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
              {/* Code */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Kode Kupon (Huruf Besar & Angka) <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: HEMAT20 atau GURUBARU"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase font-bold border-2 border-foreground/30"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nama Promo / Keterangan <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: Promo Spesial Hari Guru Nasional 20%"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 border-foreground/30"
                />
              </div>

              {/* Discount Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Tipe Diskon</Label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-background border-2 border-foreground/30 rounded-lg outline-none focus:border-foreground"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Nilai Diskon ({formData.discount_type === 'percentage' ? '%' : 'Rp'})
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="font-mono font-bold border-2 border-foreground/30"
                  />
                </div>
              </div>

              {/* Max discount if percentage */}
              {formData.discount_type === 'percentage' && (
                <div className="p-3 bg-secondary/50 border border-foreground/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Batasi Maksimal Diskon?
                    </Label>
                    <Switch
                      checked={formData.has_max_discount}
                      onCheckedChange={(val) => setFormData({ ...formData, has_max_discount: val })}
                    />
                  </div>
                  {formData.has_max_discount && (
                    <Input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                      className="font-mono text-xs border-2 border-foreground/30"
                    />
                  )}
                </div>
              )}

              {/* Min purchase */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Minimal Pembelian (Rp, isi 0 jika tanpa syarat)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: Number(e.target.value) })}
                  className="font-mono text-xs border-2 border-foreground/30"
                />
              </div>

              {/* Quota limit */}
              <div className="p-3 bg-secondary/50 border border-foreground/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground cursor-pointer">
                    Batasi Kuota Pemakaian?
                  </Label>
                  <Switch
                    checked={formData.has_quota}
                    onCheckedChange={(val) => setFormData({ ...formData, has_quota: val })}
                  />
                </div>
                {formData.has_quota && (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Contoh: 100"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                    className="font-mono text-xs border-2 border-foreground/30"
                  />
                )}
              </div>

              {/* Applicable to */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Berlaku Untuk Paket</Label>
                <select
                  value={formData.applicable_to}
                  onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-background border-2 border-foreground/30 rounded-lg outline-none focus:border-foreground"
                >
                  <option value="all">Semua Paket (Lite, Standar, Pro)</option>
                  <option value="lite">Hanya Paket Lite</option>
                  <option value="annual">Hanya Paket Standar</option>
                  <option value="pro_annual">Hanya Paket Pro</option>
                </select>
              </div>

              {/* Active switch */}
              <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
                <Label className="text-xs font-bold text-foreground cursor-pointer">
                  Status Kupon Langsung Aktif?
                </Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
                />
              </div>

              <DialogFooter className="pt-3 border-t border-foreground/15 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-2 border-foreground font-bold text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs border-2 border-foreground shadow-brutal-sm"
                >
                  {editingCoupon ? 'Simpan Perubahan' : 'Buat Kupon'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: DELETE CONFIRM */}
        {deletingId && (
          <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
            <DialogContent className="border-2 border-foreground shadow-brutal sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Hapus Kupon
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Apakah Anda yakin ingin menghapus kupon ini? Kupon yang dihapus tidak dapat digunakan lagi oleh pembeli.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingId(null)}
                  className="border-2 border-foreground font-bold text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    deleteCouponMutation.mutate(deletingId);
                    setDeletingId(null);
                  }}
                  disabled={deleteCouponMutation.isPending}
                  className="border-2 border-foreground font-bold text-xs shadow-brutal-sm"
                >
                  Ya, Hapus Kupon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
