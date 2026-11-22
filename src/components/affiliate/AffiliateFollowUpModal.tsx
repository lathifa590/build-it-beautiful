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
  Info,
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { AffiliateReferralOrder, Affiliate } from '@/types/affiliate';
import { cleanPhoneForWhatsApp } from '@/components/admin/ActivationMessageModal';
import { useMarkOrderFollowedUp } from '@/hooks/useAffiliate';

interface AffiliateFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: AffiliateReferralOrder | null;
  affiliate: Affiliate | null;
}

export type AffiliateTemplateType = 'soft_check' | 'bank_help' | 'casual_friend';

export const TEMPLATES_CONFIG: Record<
  AffiliateTemplateType,
  { label: string; badge: string; description: string }
> = {
  soft_check: {
    label: 'Sapaan Ramah & Cek Kendala',
    badge: 'Rekomendasi Utama',
    description: 'Menyapa sopan, menanyakan apakah ada kesulitan saat checkout, dan menawarkan bantuan.',
  },
  bank_help: {
    label: 'Bantuan Transfer & Kode Unik',
    badge: 'Kendala Teknis',
    description: 'Mengingatkan kode unik 3 digit dan cara transfer yang benar agar langsung diverifikasi.',
  },
  casual_friend: {
    label: 'Sapaan Akrab Rekan Guru',
    badge: 'Sesama Guru/Teman',
    description: 'Bahasa santai untuk teman satu sekolah, MGMP, atau grup KKG.',
  },
};

export const buildAffiliateFollowUpMessage = ({
  template,
  order,
  affiliate,
}: {
  template: AffiliateTemplateType;
  order: AffiliateReferralOrder;
  affiliate: Affiliate | null;
}): string => {
  const buyerName = order.buyer_name?.trim() ? `Bapak/Ibu ${order.buyer_name.trim()}` : 'Bapak/Ibu Guru';
  const myName = affiliate?.display_name || 'Rekan Anda';
  const packageName = order.item_title || 'Paket ModulAjar.Online';
  const totalAmountStr = order.total_amount?.toLocaleString('id-ID') || '0';
  const invoiceCode = order.invoice;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://modulajar.online';
  const invoiceUrl = `${baseUrl}/checkout?invoice=${invoiceCode}`;

  if (template === 'casual_friend') {
    return `Halo Bapak/Ibu ${order.buyer_name || ''}, salam dari ${myName}! 👋😊

Saya lihat tadi ada pemesanan *${packageName}* di ModulAjar.Online lewat rekomendasi saya (#${invoiceCode}).

Apakah proses checkout atau transfer kodenya lancar, atau ada yang perlu saya bantu tanyakan ke admin pusat? 

Modul ajar dan bank soalnya sangat praktis dan rapi untuk semester ini, semoga makin meringankan persiapan mengajar Bapak/Ibu ya! Kalau butuh panduan, kabari saya ya 🙏✨`;
  }

  if (template === 'bank_help') {
    return `Halo ${buyerName}, salam hangat dari ${myName}! 👋

Mengenai pesanan *${packageName}* (#${invoiceCode}) sebesar *Rp ${totalAmountStr}* yang tadi dibuat:

Pastikan nominal transfernya pas sampai digit terakhir (kode unik) ya, agar sistem admin bisa langsung mencocokkan dan mengaktifkan akun secara otomatis.

Rincian invoice & rekening transfer bisa dicek kembali di sini:
👉 ${invoiceUrl}

Jika sudah transfer namun butuh bantuan konfirmasi cepat, boleh kabari saya agar saya bantu teruskan ke admin pusat ya. Terima kasih! 🙏😊`;
  }

  // Default: soft_check
  return `Halo ${buyerName}, salam hangat dari ${myName} (ModulAjar.Online) 👋✨

Saya melihat Bapak/Ibu baru saja memilih *${packageName}* (#${invoiceCode}).

Hanya ingin menyapa dan memastikan, apakah ada kendala atau pertanyaan seputar cara transfer maupun fitur aplikasinya? 

Jika ada yang dibingungkan atau butuh bantuan koordinasi dengan tim admin pusat, jangan sungkan kabari saya ya Bapak/Ibu. Semoga harinya menyenangkan! 😊🙏`;
};

export function AffiliateFollowUpModal({
  isOpen,
  onClose,
  order,
  affiliate,
}: AffiliateFollowUpModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AffiliateTemplateType>('soft_check');
  const [messageText, setMessageText] = useState('');
  const [phone, setPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const markFollowedUpMutation = useMarkOrderFollowedUp();

  useEffect(() => {
    if (order && isOpen) {
      setPhone(order.buyer_whatsapp || '');
      setSelectedTemplate('soft_check');
      const text = buildAffiliateFollowUpMessage({
        template: 'soft_check',
        order,
        affiliate,
      });
      setMessageText(text);
      setIsCopied(false);
    }
  }, [order, isOpen, affiliate]);

  const handleSelectTemplate = (template: AffiliateTemplateType) => {
    if (!order) return;
    setSelectedTemplate(template);
    const text = buildAffiliateFollowUpMessage({
      template,
      order,
      affiliate,
    });
    setMessageText(text);
  };

  const handleResetText = () => {
    if (!order) return;
    const text = buildAffiliateFollowUpMessage({
      template: selectedTemplate,
      order,
      affiliate,
    });
    setMessageText(text);
    toast.info('Teks pesan dikembalikan ke template awal');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      toast.success('Pesan follow-up berhasil disalin!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin teks ke clipboard');
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = cleanPhoneForWhatsApp(phone);

    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error('Nomor WhatsApp pembeli belum valid atau belum diisi');
      return;
    }

    if (order?.order_id) {
      markFollowedUpMutation.mutate({
        orderId: order.order_id,
        by: 'affiliate',
      });
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success('Membuka WhatsApp & status follow-up berhasil dicatat!');
    onClose();
  };

  if (!order) return null;

  const isAdminAlreadyContacted = order.last_followed_up_by === 'admin';
  const isAffiliateAlreadyContacted = order.last_followed_up_by === 'affiliate';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 border-2 border-foreground shadow-brutal">
        <DialogHeader className="pb-3 border-b-2 border-foreground/15">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border-2 border-foreground flex items-center justify-center text-primary shadow-brutal-sm shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                <span>Bantu Sapa Calon Pembeli</span>
                <Badge className="bg-amber-500/20 text-amber-800 border border-amber-600/40 text-[10px] font-bold">
                  Pending Transfer
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Gunakan sapaan santai dan ramah sebagai rekan yang beliau percaya (hindari menagih kaku)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Koordinasi Anti-Dobel Follow Up Notice */}
          {isAdminAlreadyContacted && (
            <div className="p-3.5 bg-blue-500/15 border-2 border-blue-600/50 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-blue-900">
                  Tim Admin Sudah Menghubungi Pembeli Ini
                </p>
                <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
                  Admin sudah mengirimkan instruksi transfer & rincian rekening resmi pada{' '}
                  <strong>
                    {new Date(order.last_followed_up_at!).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    pk{' '}
                    {new Date(order.last_followed_up_at!).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                  . Cukup sapa ramah atau tanyakan fitur, <em>jangan menagih pembayaran lagi</em> agar pembeli merasa nyaman.
                </p>
              </div>
            </div>
          )}

          {isAffiliateAlreadyContacted && (
            <div className="p-3.5 bg-emerald-500/15 border-2 border-emerald-600/50 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-900">
                  Anda Sudah Pernah Menyapa Pembeli Ini
                </p>
                <p className="text-[11px] text-emerald-800/90 mt-0.5">
                  Terakhir disapa pada{' '}
                  {new Date(order.last_followed_up_at!).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  pk{' '}
                  {new Date(order.last_followed_up_at!).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  .
                </p>
              </div>
            </div>
          )}

          {!order.last_followed_up_at && (
            <div className="p-3 bg-secondary/70 border border-foreground/20 rounded-xl text-xs flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Belum ada yang menghubungi:</strong> Anda memiliki prioritas untuk menyapa terlebih dahulu karena pembeli mendaftar lewat rekomendasi Anda!
              </span>
            </div>
          )}

          {/* Rincian Pesanan Singkat */}
          <div className="p-3.5 bg-card border-2 border-foreground/20 rounded-xl space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{order.buyer_name}</span>
                  <Badge variant="outline" className="border-foreground/30 font-bold text-[10px]">
                    {order.package_type}
                  </Badge>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {order.buyer_email} • Invoice <span className="font-mono font-bold text-foreground">#{order.invoice}</span>
                </p>
              </div>

              <div className="text-left sm:text-right bg-secondary/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                  Tagihan Pembeli:
                </span>
                <span className="text-sm font-black font-mono text-foreground">
                  Rp {order.total_amount?.toLocaleString('id-ID')}
                </span>
                <span className="block text-[10px] text-emerald-700 font-bold font-mono">
                  Estimasi Komisi: +Rp {order.estimated_commission?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Nomor WA */}
            <div className="pt-2 border-t border-foreground/10 flex items-center gap-2">
              <Label className="text-xs font-bold text-foreground shrink-0">
                Nomor WhatsApp Tujuan:
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="h-8 font-mono text-xs border-2 border-foreground/30 font-bold max-w-xs"
              />
            </div>
          </div>

          {/* Pilihan Template Pesan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Pilih Gaya Sapaan:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(TEMPLATES_CONFIG) as AffiliateTemplateType[]).map((key) => {
                const conf = TEMPLATES_CONFIG[key];
                const isActive = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectTemplate(key)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? 'border-primary bg-primary/10 shadow-brutal-sm'
                        : 'border-foreground/20 hover:border-foreground/40 bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-foreground">{conf.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {conf.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea Pesan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Teks Pesan WhatsApp (Bisa diedit bebas sebelum kirim):
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetText}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1 px-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Template</span>
              </Button>
            </div>
            <Textarea
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="font-mono text-xs border-2 border-foreground/30 rounded-xl leading-relaxed resize-y"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t-2 border-foreground/15">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto border-2 border-foreground font-bold text-xs gap-1.5 shadow-brutal-sm"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-bold"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={markFollowedUpMutation.isPending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-foreground font-black text-xs gap-1.5 shadow-brutal-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Buka WhatsApp & Tandai Sudah Disapa</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
