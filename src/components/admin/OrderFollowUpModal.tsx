import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Copy,
  Check,
  Send,
  RotateCcw,
  Sparkles,
  Smartphone,
  ExternalLink,
  Clock,
  HeartHandshake,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, PaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '@/types/orders';
import { cleanPhoneForWhatsApp } from '@/components/admin/ActivationMessageModal';
import { useMarkOrderFollowedUp } from '@/hooks/useAffiliate';

interface OrderFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  paymentSettings?: PaymentSettings;
}

export type FollowUpStage = 'stage_1' | 'stage_2' | 'stage_3';

export const STAGE_CONFIG: Record<
  FollowUpStage,
  {
    label: string;
    sublabel: string;
    badge: string;
    timing: string;
    objective: string;
  }
> = {
  stage_1: {
    label: 'Follow Up 1',
    sublabel: 'Cek Kendala & Bantu Transfer',
    badge: '1–3 Jam Pasca Checkout',
    timing: 'Kirimkan sekitar 1–3 jam setelah pesanan dibuat.',
    objective: 'Menyapa ramah, menawarkan bantuan bila ada kendala transfer, dan melampirkan rekening.',
  },
  stage_2: {
    label: 'Follow Up 2',
    sublabel: 'Pengingat Santun & Simpan Akses',
    badge: '24 Jam / Hari Ke-2',
    timing: 'Kirimkan keesokan harinya (pagi hari atau saat jam istirahat sekolah).',
    objective: 'Mengingatkan bahwa invoice & kode unik masih disimpan rapi untuk beliau dengan link bayar praktis.',
  },
  stage_3: {
    label: 'Follow Up 3',
    sublabel: 'Konfirmasi Batas Waktu & Penutupan',
    badge: '48–72 Jam / Final Reminder',
    timing: 'Kirimkan 2–3 hari setelah pesanan sebelum invoice dibatalkan otomatis.',
    objective: 'Pemberitahuan penutupan pesanan dengan penuh rasa hormat, tanpa paksaan, dan tetap ramah.',
  },
};

/**
 * Helper to build follow-up message text
 */
export const buildFollowUpMessage = ({
  stage,
  order,
  settings,
}: {
  stage: FollowUpStage;
  order: Order;
  settings: PaymentSettings;
}): string => {
  const buyerName = order.buyer_name?.trim() ? `Bapak/Ibu ${order.buyer_name.trim()}` : 'Bapak/Ibu Guru';
  const packageName = order.item_title || 'Paket ModulAjar.Online';
  const invoiceCode = order.invoice;
  const totalAmountStr = order.total_amount?.toLocaleString('id-ID') || '0';
  const bankName = settings.bank_name || 'BCA';
  const bankAccount = settings.bank_account_number || '1234567890';
  const accountHolder = settings.bank_account_holder || 'Admin ModulAjar';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://modulajar.online';
  const invoiceUrl = `${baseUrl}/checkout?invoice=${invoiceCode}`;

  if (stage === 'stage_1') {
    return `Halo ${buyerName}, salam hangat dari tim *ModulAjar.Online*! 👋

Semoga aktivitas mengajarnya hari ini berjalan lancar ya. 🙏

Kami melihat Bapak/Ibu telah membuat pesanan untuk:
📋 *Paket:* ${packageName}
🧾 *Invoice:* #${invoiceCode}
💰 *Total Tagihan:* Rp ${totalAmountStr} (termasuk 3 digit kode unik)

Sekadar ingin mengonfirmasi, apakah ada kendala dalam proses transfer atau akses rekening yang bisa kami bantu?

Jika Bapak/Ibu membutuhkan detail rekening kembali:
• *Bank Tujuan:* ${bankName}
• *No. Rekening:* ${bankAccount}
• *Atas Nama:* ${accountHolder}
• *Tautan Invoice Online:* ${invoiceUrl}

Silakan balas pesan ini jika ada yang ingin ditanyakan ya Bapak/Ibu. Kami siap membantu dengan senang hati! 😊✨`;
  }

  if (stage === 'stage_2') {
    return `Halo ${buyerName}, selamat beraktivitas! 🌸

Sekadar mengingatkan dengan santun, pesanan *${packageName}* Bapak/Ibu di ModulAjar.Online dengan invoice *#${invoiceCode}* sebesar *Rp ${totalAmountStr}* saat ini masih tersimpan di antrean sistem kami.

Bapak/Ibu dapat langsung melihat detail tagihan & melakukan pembayaran di tautan berikut:
🔗 ${invoiceUrl}

Atau transfer langsung ke:
• *${bankName}:* ${bankAccount} (a.n ${accountHolder})
• *Nominal Tepat:* Rp ${totalAmountStr}

Setelah pembayaran selesai, akun Bapak/Ibu akan otomatis kami aktifkan sehingga bisa langsung membuat Modul Ajar, LKPD, dan Asesmen otomatis tanpa kendala kuota.

Jika Bapak/Ibu memerlukan bantuan atau ada hal yang ingin didiskusikan, jangan ragu kabari kami ya. Terima kasih banyak! 🙏✨`;
  }

  // stage_3: Final reminder / Penutupan sopan
  return `Halo ${buyerName}, semoga selalu sehat dan sukses dalam mendidik siswa-siswi tercinta. 🙏

Mengenai pesanan *#${invoiceCode}* (${packageName}), kami ingin menginformasikan bahwa pesanan ini akan segera ditutup/dibatalkan otomatis oleh sistem untuk merapikan antrean invoice.

Jika Bapak/Ibu masih berencana mengaktifkan akun ModulAjar.Online, tagihan masih dapat diselesaikan melalui tautan ini:
🔗 ${invoiceUrl}

Namun jika saat ini Bapak/Ibu belum membutuhkan layanannya, tidak apa-apa sama sekali ya Bapak/Ibu. 

Terima kasih atas minat dan kepercayaannya kepada ModulAjar.Online. Kapan pun Bapak/Ibu siap, pintu kami selalu terbuka untuk menyambut Bapak/Ibu kembali. Selamat mengajar! 🎓✨`;
};

export const OrderFollowUpModal: React.FC<OrderFollowUpModalProps> = ({
  isOpen,
  onClose,
  order,
  paymentSettings = DEFAULT_PAYMENT_SETTINGS,
}) => {
  const [selectedStage, setSelectedStage] = useState<FollowUpStage>('stage_1');
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const markFollowedUpMutation = useMarkOrderFollowedUp();

  // Sync state whenever modal opens or order changes
  useEffect(() => {
    if (order && isOpen) {
      setPhone(order.buyer_whatsapp || '');
      setSelectedStage('stage_1');
      const text = buildFollowUpMessage({
        stage: 'stage_1',
        order,
        settings: paymentSettings,
      });
      setMessageText(text);
      setIsCopied(false);
    }
  }, [order, isOpen, paymentSettings]);

  const handleSelectStage = (stage: FollowUpStage) => {
    if (!order) return;
    setSelectedStage(stage);
    const text = buildFollowUpMessage({
      stage,
      order,
      settings: paymentSettings,
    });
    setMessageText(text);
  };

  const handleResetText = () => {
    if (!order) return;
    const text = buildFollowUpMessage({
      stage: selectedStage,
      order,
      settings: paymentSettings,
    });
    setMessageText(text);
    toast.info('Teks pesan dikembalikan ke template awal');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      toast.success('Pesan follow-up berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin teks ke clipboard');
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = cleanPhoneForWhatsApp(phone);

    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error('Silakan isi nomor WhatsApp pembeli yang valid (minimal 8 digit)');
      return;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    if (order?.id) {
      markFollowedUpMutation.mutate({ orderId: order.id, by: 'admin' });
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success('Membuka chat WhatsApp & status follow-up tercatat!');
  };

  if (!order) return null;

  const currentStageConfig = STAGE_CONFIG[selectedStage];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 border-2 border-foreground shadow-brutal">
        <DialogHeader className="pb-3 border-b-2 border-foreground/15">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border-2 border-amber-600 flex items-center justify-center text-amber-700 shadow-brutal-sm">
              <MessageCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <span>Follow Up Pesanan Pending</span>
                <Badge variant="outline" className="text-amber-800 border-amber-600/40 bg-amber-500/10 text-[10px] font-bold">
                  Menunggu Bayar
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Kirim pesan pengingat sopan & helpful ke WhatsApp pembeli tanpa kesan memaksa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status info if already followed up */}
          {order.last_followed_up_at && (
            <div className={`p-3 rounded-xl border-2 text-xs flex items-start gap-2.5 ${
              order.last_followed_up_by === 'affiliate'
                ? 'bg-emerald-500/15 border-emerald-600/50 text-emerald-950'
                : 'bg-blue-500/15 border-blue-600/50 text-blue-950'
            }`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">
                  {order.last_followed_up_by === 'affiliate'
                    ? `Perhatian: Afiliator (${order.affiliate_code || 'Mitra'}) sudah menyapa pembeli ini!`
                    : 'Catatan: Pembeli ini sudah pernah di-follow up oleh Admin.'}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  Waktu: {new Date(order.last_followed_up_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pk {new Date(order.last_followed_up_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
                  {order.last_followed_up_by === 'affiliate' && ' Gunakan pesan pengingat resmi jika pembeli membutuhkan konfirmasi rekening.'}
                </p>
              </div>
            </div>
          )}

          {/* Order Snapshot Card */}
          <div className="p-3.5 bg-secondary/60 border-2 border-foreground/20 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <span>{order.buyer_name}</span>
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                    {order.item_title}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.buyer_email} • <span className="font-mono font-bold text-foreground">#{order.invoice}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-muted-foreground block">Total Tagihan:</span>
                <span className="text-base font-black font-mono text-foreground">
                  Rp {order.total_amount?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Editable Phone input */}
            <div className="pt-2 border-t border-foreground/10 flex items-center gap-2">
              <Label htmlFor="fu-phone" className="text-xs font-bold text-foreground flex items-center gap-1 shrink-0">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> No. WhatsApp:
              </Label>
              <Input
                id="fu-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background border-2 border-foreground/30 font-mono text-xs h-8 max-w-[240px]"
                placeholder="081234567890"
              />
            </div>
          </div>

          {/* Follow-up Stage Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Pilih Tahap Follow Up (Ideal 3 Tahap):
              </Label>
              <button
                type="button"
                onClick={handleResetText}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-semibold"
                title="Kembalikan teks sesuai template asli"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Teks</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['stage_1', 'stage_2', 'stage_3'] as FollowUpStage[]).map((stage) => {
                const config = STAGE_CONFIG[stage];
                const isSelected = selectedStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => handleSelectStage(stage)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-brutal-sm ring-1 ring-primary'
                        : 'border-foreground/20 bg-card hover:bg-secondary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-extrabold text-xs text-foreground block">
                        {config.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {config.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block line-clamp-1">
                      {config.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Timing Guidance Bar */}
            <div className="p-2.5 bg-secondary/50 border border-foreground/15 rounded-lg flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">{currentStageConfig.timing}</strong> {currentStageConfig.objective}
              </p>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Teks Pesan WhatsApp (Dapat Diedit Bebas):
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {messageText.length} karakter
              </span>
            </div>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={11}
              className="font-sans text-xs sm:text-sm bg-background border-2 border-foreground/30 focus:border-foreground rounded-xl leading-relaxed resize-y selection:bg-primary/20"
            />
          </div>

          {/* Tip Note */}
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-[11px] text-emerald-950">
            <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Gaya bahasa di atas sengaja disusun <strong>sopan, ramah, dan solutif</strong> bagi rekan guru, sehingga pembeli merasa dibantu dan tidak merasa ditagih secara agresif.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t-2 border-foreground/15 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-stretch sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-2 border-foreground hover:bg-secondary font-bold text-xs"
          >
            Tutup
          </Button>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="border-2 border-foreground hover:bg-secondary font-bold text-xs gap-1.5 shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px]"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Pesan</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-bold text-xs gap-1.5 shadow-brutal-sm hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Kirim ke WhatsApp</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
