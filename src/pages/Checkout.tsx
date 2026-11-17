import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { useCoupons, validateCouponCode } from '@/hooks/useCoupons';
import { useCreateOrder, generateUniqueCode } from '@/hooks/useOrders';
import {
  PACKAGES_CONFIG,
  PackageDetail,
  PackageType,
  Coupon,
  Order,
} from '@/types/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Lock,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Ticket,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Checkout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = usePaymentSettings();
  const { data: coupons = [] } = useCoupons();
  const createOrderMutation = useCreateOrder();

  // Package selection from URL ?package=lite|standar|pro
  const rawPackageParam = searchParams.get('package') || 'standar';
  const initialPackageKey = rawPackageParam in PACKAGES_CONFIG ? rawPackageParam : 'standar';
  const [selectedPackageKey, setSelectedPackageKey] = useState<string>(initialPackageKey);

  const selectedPackage: PackageDetail = useMemo(() => {
    return PACKAGES_CONFIG[selectedPackageKey] || PACKAGES_CONFIG.standar;
  }, [selectedPackageKey]);

  // Affiliate ref
  const affiliateRef = searchParams.get('ref') || searchParams.get('aff') || null;

  // Invoice query param (if user visits /checkout?invoice=INV-...)
  const invoiceParam = searchParams.get('invoice');
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    notes: '',
  });

  // Pre-fill user profile if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
        name: prev.name || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '',
      }));
    }
  }, [user]);

  // Unique 3-digit transfer code
  const [uniqueCode] = useState<number>(() => generateUniqueCode());

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Auto-apply coupon from URL (?coupon=...)
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon') || searchParams.get('voucher');
    if (urlCoupon && coupons.length > 0 && !appliedCoupon) {
      const code = urlCoupon.trim().toUpperCase();
      setCouponCodeInput(code);
      const res = validateCouponCode(coupons, code, selectedPackage.price, selectedPackage.id);
      if (res.valid) {
        setAppliedCoupon(res.coupon || null);
        setCouponDiscount(res.discountAmount);
        setCouponMessage(res.message || null);
      }
    }
  }, [searchParams, coupons, selectedPackage.price, selectedPackage.id, appliedCoupon]);

  // Recalculate coupon if package changes
  useEffect(() => {
    if (appliedCoupon) {
      const res = validateCouponCode(coupons, appliedCoupon.code, selectedPackage.price, selectedPackage.id);
      if (res.valid) {
        setCouponDiscount(res.discountAmount);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError('Kupon tidak berlaku untuk paket yang baru dipilih');
      }
    }
  }, [selectedPackageKey, coupons, selectedPackage.price, selectedPackage.id]);

  // Fetch existing order if invoice is in URL
  useEffect(() => {
    if (invoiceParam) {
      setIsLoadingInvoice(true);
      supabase
        .from('orders' as any)
        .select('*')
        .eq('invoice', invoiceParam.trim())
        .maybeSingle()
        .then(({ data, error }) => {
          setIsLoadingInvoice(false);
          if (data && !error) {
            setExistingOrder(data as Order);
          }
        });
    }
  }, [invoiceParam]);

  // Active completed order state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const activeOrder = completedOrder || existingOrder;

  // Realtime subscription for active order status
  useEffect(() => {
    if (!activeOrder?.id) return;

    const channel = supabase
      .channel(`order-status-${activeOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeOrder.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          if (updated) {
            if (completedOrder) setCompletedOrder(updated);
            if (existingOrder) setExistingOrder(updated);
            if (updated.status === 'paid') {
              toast.success('Pembayaran Anda sudah diverifikasi & disetujui! Akun Anda aktif 🎉');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id, completedOrder, existingOrder]);

  // Price calculations
  const normalPrice = selectedPackage.price;
  const netPrice = Math.max(0, normalPrice - couponDiscount);
  const totalAmount = netPrice + uniqueCode;

  // Handle applying coupon
  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponMessage(null);

    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Masukkan kode kupon terlebih dahulu');
      return;
    }

    const res = validateCouponCode(coupons, code, selectedPackage.price, selectedPackage.id);
    if (!res.valid) {
      setCouponError(res.message || 'Kupon tidak valid');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    setAppliedCoupon(res.coupon || null);
    setCouponDiscount(res.discountAmount);
    setCouponMessage(res.message || null);
    toast.success(`Kupon "${code}" berhasil digunakan!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCodeInput('');
    setCouponMessage(null);
    setCouponError(null);
  };

  // Submit order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Mohon isi nama lengkap Anda');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Mohon isi alamat email yang valid');
      return;
    }
    if (!formData.whatsapp.trim() || formData.whatsapp.length < 9) {
      toast.error('Mohon isi nomor WhatsApp aktif Anda');
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        buyer_name: formData.name,
        buyer_email: formData.email,
        buyer_whatsapp: formData.whatsapp,
        package_type: selectedPackage.id,
        item_title: selectedPackage.name,
        original_price: selectedPackage.originalPrice,
        price: selectedPackage.price,
        discount_amount: couponDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        unique_code: uniqueCode,
        total_amount: totalAmount,
        notes: formData.notes,
        affiliate_code: affiliateRef,
        user_id: user?.id || null,
      });

      setCompletedOrder(order);
      setSearchParams({ invoice: order.invoice });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Pesanan berhasil dibuat! Silakan lakukan pembayaran.');
    } catch (err: any) {
      console.error('Order creation error:', err);
    }
  };

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Build WhatsApp confirmation link
  const buildWhatsAppConfirmUrl = (order: Order) => {
    const waNumber = (settings?.whatsapp_number || '6288228511309').replace(/\D/g, '');
    const message = `Halo Admin ModulAjar.Online, saya sudah melakukan transfer untuk pesanan:

📋 *Rincian Pesanan:*
• *Invoice:* #${order.invoice}
• *Nama:* ${order.buyer_name}
• *Email Akun:* ${order.buyer_email}
• *Paket:* ${order.item_title}
• *Total Transfer:* Rp ${order.total_amount.toLocaleString('id-ID')}

Berikut saya lampirkan bukti transfernya. Mohon bantuannya untuk verifikasi & aktivasi akun saya. Terima kasih! 🙏`;

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b-2 border-foreground bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-black text-lg">
            <div className="w-9 h-9 rounded-xl bg-primary border-2 border-foreground flex items-center justify-center shadow-brutal-sm text-primary-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>ModulAjar<span className="text-primary">.Online</span></span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-foreground/20">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checkout Aman & Terenkripsi</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
        {/* VIEW 1: INVOICE & PAYMENT INSTRUCTION SCREEN (If order created) */}
        {activeOrder ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Success & Status Card */}
            <div className={`p-6 rounded-2xl border-2 border-foreground shadow-brutal ${
              activeOrder.status === 'paid' ? 'bg-emerald-500/10' : 'bg-card'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-foreground/15">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                      Invoice Pesanan
                    </span>
                    <Badge
                      className={`font-mono font-bold text-xs ${
                        activeOrder.status === 'paid'
                          ? 'bg-emerald-600 text-white'
                          : activeOrder.status === 'cancelled'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-amber-500 text-black'
                      }`}
                    >
                      {activeOrder.status === 'paid'
                        ? 'LUNAS (AKUN AKTIF)'
                        : activeOrder.status === 'cancelled'
                        ? 'DIBATALKAN'
                        : 'MENUNGGU PEMBAYARAN'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-center gap-2">
                    #{activeOrder.invoice}
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder.invoice, 'invoice', 'Nomor invoice')}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Salin Nomor Invoice"
                    >
                      {copiedKey === 'invoice' ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </h1>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-muted-foreground block">Tanggal Transaksi</span>
                  <span className="text-sm font-bold">
                    {new Date(activeOrder.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Order Status Alert Banner */}
              {activeOrder.status === 'paid' ? (
                <div className="mt-5 p-4 bg-emerald-500/20 border-2 border-emerald-600 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-emerald-950 text-base">
                      Akun Anda Sudah Aktif & Siap Digunakan! 🎉
                    </h3>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Email <strong>{activeOrder.buyer_email}</strong> telah aktif dengan {activeOrder.item_title}. Silakan login ke aplikasi untuk langsung mulai membuat Modul Ajar otomatis.
                    </p>
                    <div className="pt-2">
                      <Link to="/auth">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-foreground shadow-brutal-sm gap-2">
                          Masuk ke Aplikasi Sekarang
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 p-4 bg-amber-500/15 border-2 border-amber-600/50 rounded-xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950 leading-relaxed">
                    <p className="font-bold mb-0.5">Selesaikan Pembayaran Anda</p>
                    <p>
                      Silakan transfer tepat sejumlah <strong>Rp {activeOrder.total_amount.toLocaleString('id-ID')}</strong> (termasuk 3 digit kode unik) ke rekening di bawah. Setelah transfer, klik tombol konfirmasi WhatsApp agar admin segera mengaktifkan akun Anda.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details Card (Only if pending) */}
            {activeOrder.status === 'pending' && (
              <div className="p-6 bg-card rounded-2xl border-2 border-foreground shadow-brutal space-y-6">
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    <span>Instruksi Transfer Bank</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gunakan ATM, m-Banking, atau Internet Banking ke nomor rekening berikut:
                  </p>
                </div>

                {/* Bank Account Highlight Box */}
                <div className="p-5 bg-secondary/70 border-2 border-foreground rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase text-muted-foreground block">
                        Bank Tujuan
                      </span>
                      <span className="text-xl font-black text-foreground">
                        {settings.bank_name || 'BCA'}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-foreground/30 font-bold text-xs self-start sm:self-center">
                      Atas Nama: {settings.bank_account_holder || 'Admin ModulAjar'}
                    </Badge>
                  </div>

                  {/* Account Number with Copy */}
                  <div className="p-3.5 bg-background border-2 border-foreground/30 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block uppercase">
                        Nomor Rekening
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-foreground">
                        {settings.bank_account_number || '1234567890'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(settings.bank_account_number, 'rekening', 'Nomor rekening')}
                      className="border-2 border-foreground hover:bg-secondary font-bold text-xs gap-1.5 shadow-brutal-sm"
                    >
                      {copiedKey === 'rekening' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No Rek</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Total Amount to Transfer with Unique Code */}
                  <div className="p-3.5 bg-primary/10 border-2 border-primary/40 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold text-primary uppercase block">
                          Total Transfer (Wajib Sama Persis)
                        </span>
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-mono px-1.5 py-0">
                          Kode Unik: +{activeOrder.unique_code}
                        </Badge>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                        Rp {activeOrder.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCopy(activeOrder.total_amount.toString(), 'nominal', 'Nominal transfer')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground font-bold text-xs gap-1.5 shadow-brutal-sm"
                    >
                      {copiedKey === 'nominal' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Nominal</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Optional QRIS if provided */}
                {settings.qris_image_url && (
                  <div className="p-4 bg-secondary/40 border-2 border-foreground/20 rounded-xl flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <QrCode className="w-4 h-4" />
                      <span>Atau Scan QRIS (Semua E-Wallet & Mobile Banking)</span>
                    </div>
                    <img
                      src={settings.qris_image_url}
                      alt="QRIS Pembayaran"
                      className="max-w-[220px] w-full rounded-xl border-2 border-foreground shadow-brutal-sm"
                    />
                  </div>
                )}

                {/* WhatsApp Action Button */}
                <div className="pt-2 space-y-3">
                  <a
                    href={buildWhatsAppConfirmUrl(activeOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Konfirmasi Pembayaran via WhatsApp
                      <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                    </Button>
                  </a>

                  <p className="text-center text-xs text-muted-foreground">
                    Setelah konfirmasi WhatsApp terkirim, admin akan segera memverifikasi dan menyetujui akun Anda. Halaman ini akan otomatis ter-update menjadi Lunas.
                  </p>
                </div>
              </div>
            )}

            {/* Buyer & Package Summary Card */}
            <div className="p-5 bg-card rounded-2xl border-2 border-foreground shadow-brutal-sm text-xs space-y-3">
              <h3 className="font-bold text-foreground uppercase tracking-wide">Rincian Pembeli & Layanan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                <div>
                  <span className="font-medium">Nama:</span> <span className="font-bold text-foreground">{activeOrder.buyer_name}</span>
                </div>
                <div>
                  <span className="font-medium">Email Akun:</span> <span className="font-bold text-foreground">{activeOrder.buyer_email}</span>
                </div>
                <div>
                  <span className="font-medium">Nomor WhatsApp:</span> <span className="font-bold text-foreground">{activeOrder.buyer_whatsapp}</span>
                </div>
                <div>
                  <span className="font-medium">Paket Langganan:</span> <span className="font-bold text-foreground">{activeOrder.item_title}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  setExistingOrder(null);
                  setSearchParams({});
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Buat Pesanan Baru atau Ganti Paket
              </button>

              <Link to="/" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                Kembali ke Beranda ModulAjar.Online
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* VIEW 2: CHECKOUT FORM & PACKAGE SELECTOR */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Package Switcher & Buyer Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                  Checkout Langganan
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Pilih paket dan lengkapi data Anda untuk mengaktifkan akun ModulAjar.Online.
                </p>
              </div>

              {/* Package Selector Cards */}
              <div className="space-y-3">
                <Label className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                  1. Pilih Paket Langganan:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'lite', config: PACKAGES_CONFIG.lite },
                    { key: 'standar', config: PACKAGES_CONFIG.standar },
                    { key: 'pro', config: PACKAGES_CONFIG.pro },
                  ].map(({ key, config }) => {
                    const isSelected = selectedPackageKey === key || (key === 'standar' && selectedPackageKey === 'annual') || (key === 'pro' && selectedPackageKey === 'pro_annual');
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedPackageKey(key);
                          setSearchParams({ package: key });
                        }}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all relative ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-brutal-sm ring-1 ring-primary'
                            : 'border-foreground/30 bg-card hover:bg-secondary/60'
                        }`}
                      >
                        {config.badge && (
                          <span className={`absolute -top-2.5 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-foreground ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                          }`}>
                            {config.badge}
                          </span>
                        )}
                        <span className="font-extrabold text-sm text-foreground block">
                          {config.name}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {config.periodText}
                        </span>
                        <span className="text-sm font-black text-foreground block mt-1.5 font-mono">
                          Rp {config.price.toLocaleString('id-ID')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buyer Form Card */}
              <form onSubmit={handleSubmitOrder} className="p-6 bg-card rounded-2xl border-2 border-foreground shadow-brutal space-y-4">
                <div className="pb-3 border-b-2 border-foreground/15">
                  <h2 className="text-lg font-black text-foreground">
                    2. Data Akun & Pembeli
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Akun akan otomatis didaftarkan menggunakan alamat email ini.
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-name" className="text-xs font-bold text-foreground">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="buyer-name"
                    required
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-2 border-foreground/30 font-medium"
                  />
                </div>

                {/* Email Akun */}
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-email" className="text-xs font-bold text-foreground">
                    Alamat Email (Untuk Akses & Login) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="buyer-email"
                    type="email"
                    required
                    placeholder="email.aktif@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-2 border-foreground/30 font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Pastikan email aktif & benar, karena verifikasi aktivasi otomatis merujuk ke email ini.
                  </p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-whatsapp" className="text-xs font-bold text-foreground">
                    Nomor WhatsApp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="buyer-whatsapp"
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="border-2 border-foreground/30 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Digunakan untuk pengiriman instruksi aktivasi & layanan bantuan admin.
                  </p>
                </div>

                {/* Catatan Tambahan */}
                <div className="space-y-1.5">
                  <Label htmlFor="buyer-notes" className="text-xs font-bold text-foreground">
                    Catatan Tambahan (Opsional)
                  </Label>
                  <Textarea
                    id="buyer-notes"
                    placeholder="Misal: Nama sekolah, mata pelajaran, atau permintaan khusus..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="border-2 border-foreground/30 text-xs"
                  />
                </div>

                {/* Submit button on Mobile (will also be on summary card) */}
                <div className="pt-2 lg:hidden">
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-base py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover"
                  >
                    {createOrderMutation.isPending ? 'Memproses Pesanan...' : `Lanjut Bayar (Rp ${totalAmount.toLocaleString('id-ID')})`}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary & Voucher (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Summary Card */}
              <div className="p-6 bg-card rounded-2xl border-2 border-foreground shadow-brutal space-y-5">
                <div className="pb-3 border-b-2 border-foreground/15">
                  <h3 className="text-lg font-black text-foreground">
                    Ringkasan Pesanan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Detail paket yang akan Anda dapatkan
                  </p>
                </div>

                {/* Selected Package Details */}
                <div className="p-4 bg-secondary/50 border-2 border-foreground/20 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-base text-foreground">
                        {selectedPackage.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedPackage.description}
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {selectedPackage.label}
                    </Badge>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-1.5 pt-2 border-t border-foreground/10 text-xs text-foreground/90">
                    {selectedPackage.features.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Voucher / Coupon Box */}
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-primary" />
                    Punya Kupon Diskon?
                  </Label>

                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-500/10 border-2 border-emerald-600/40 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-mono font-bold text-xs text-foreground block">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-emerald-700">
                            Diskon Rp {couponDiscount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-destructive hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Contoh: HEMAT20"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="font-mono text-xs uppercase border-2 border-foreground/30 h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleApplyCoupon()}
                        className="border-2 border-foreground font-bold text-xs h-10 shrink-0 hover:bg-secondary"
                      >
                        Terapkan
                      </Button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] font-semibold text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {couponError}
                    </p>
                  )}
                  {couponMessage && !couponError && (
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Breakdown Calculation */}
                <div className="space-y-2 pt-3 border-t-2 border-foreground/15 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Paket:</span>
                    <span className="font-semibold">Rp {normalPrice.toLocaleString('id-ID')}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Potongan Kupon:</span>
                      <span>- Rp {couponDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Kode Unik Verifikasi:
                      <span className="text-[10px] text-muted-foreground/80" title="Ditambahkan untuk mempercepat pencocokan otomatis">
                        (3 digit)
                      </span>
                    </span>
                    <span className="font-mono font-bold text-foreground">+{uniqueCode}</span>
                  </div>

                  <div className="pt-2 border-t-2 border-foreground/10 flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-foreground">Total Tagihan:</span>
                    <span className="text-2xl font-black font-mono text-primary">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Submit Order Button (Desktop) */}
                <div className="hidden lg:block pt-2">
                  <Button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={createOrderMutation.isPending}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base py-6 border-2 border-foreground shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2"
                  >
                    {createOrderMutation.isPending ? 'Memproses Pesanan...' : 'Lanjutkan ke Pembayaran'}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-foreground/10 space-y-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Aktivasi otomatis & konfirmasi langsung via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span>Garansi update fitur dan template perangkat ajar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
