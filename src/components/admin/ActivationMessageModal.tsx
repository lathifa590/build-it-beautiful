import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
  Send,
  RotateCcw,
  Sparkles,
  Smartphone,
  ExternalLink,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateAllowedCustomer } from '@/hooks/useAllowedCustomers';

export interface CustomerActivationInfo {
  id?: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  account_type?: string;
  subscription_expires_at?: string | null;
}

interface ActivationMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerActivationInfo | null;
  onPhoneUpdated?: (phone: string) => void;
}

export const TIER_CONFIG: Record<
  string,
  {
    name: string;
    label: string;
    period: string;
  }
> = {
  annual: {
    name: 'Paket Standar (Tahunan)',
    label: 'Tahunan',
    period: '1 Tahun',
  },
  pro_annual: {
    name: 'Paket Pro (Tahunan)',
    label: 'Pro Tahunan',
    period: '1 Tahun',
  },
  lite: {
    name: 'Paket Lite (6 Bulan)',
    label: 'Lite',
    period: '6 Bulan',
  },
  lifetime: {
    name: 'Paket Lifetime (Akses Selamanya)',
    label: 'Lifetime',
    period: 'Selamanya',
  },
  regular: {
    name: 'Paket Lifetime (Akses Selamanya)',
    label: 'Lifetime',
    period: 'Selamanya',
  },
  pro_lifetime: {
    name: 'Paket Pro Lifetime (Akses Selamanya)',
    label: 'Pro Lifetime',
    period: 'Selamanya',
  },
  trial: {
    name: 'Akun Trial (Uji Coba)',
    label: 'Trial',
    period: 'Masa Trial',
  },
};

export const cleanPhoneForWhatsApp = (phoneStr: string): string => {
  let clean = phoneStr.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
};

export const buildDefaultActivationMessage = ({
  name,
  email,
  accountType = 'annual',
  expiresAt,
}: {
  name?: string | null;
  email: string;
  accountType?: string;
  expiresAt?: string | null;
}) => {
  const tier = TIER_CONFIG[accountType] || {
    name: 'Paket Modul Ajar Online',
    label: 'Standar',
    period: '1 Tahun',
  };

  const greetingName = name?.trim() ? `Kak ${name.trim()}` : 'Kak';
  const isLifetime =
    accountType === 'lifetime' || accountType === 'regular' || accountType === 'pro_lifetime';

  let masaAktifText = 'Akses Selamanya (Lifetime)';
  if (!isLifetime) {
    if (expiresAt) {
      masaAktifText = new Date(expiresAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      masaAktifText = tier.period || '1 Tahun';
    }
  }

  return `Halo ${greetingName}, akun Anda untuk aplikasi *Modul Ajar Online* sudah aktif ya! 🎉

📋 *Rincian Akun:*
• *Paket Langganan:* ${tier.name}
• *Email Terdaftar:* ${email}
• *Masa Aktif:* ${masaAktifText}

👉 *Langkah Masuk (Login):*
1. Silakan login ke: https://modulajar.online/auth
2. Masukkan email terdaftar di atas.
3. Buat password yang mudah diingat (jika baru pertama kali login).

⚙️ *PENTING - Setting Gemini API Key:*
Setelah masuk, jangan lupa setting *Gemini API Key* terlebih dahulu di bagian *Pengaturan* (klik ikon gear ⚙️ di pojok kanan atas). API Key gratis dari Google ini wajib dipasang agar aplikasi bisa otomatis membuat konten Perangkat Ajar. Tutorial cara setting sudah tersedia di menu tersebut dan doc panduan.

📖 *Panduan Lengkap (Canva):*
https://www.canva.com/design/DAHD3pwYN_s/so9hZzTZbGYb4on0uixn9Q/view?utm_content=DAHD3pwYN_s&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8e5f829d97

🎬 *Tutorial Playlist TikTok:*
https://vt.tiktok.com/ZS9UjL6NyAv4r-iwJKr/

Jika ada kendala saat login atau butuh bantuan lainnya, silakan langsung balas pesan ini ya Kak. Selamat mencoba & semoga bermanfaat untuk kelancaran administrasi mengajar! 🙏✨`;
};

export const buildShortActivationMessage = ({
  name,
  email,
  accountType = 'annual',
}: {
  name?: string | null;
  email: string;
  accountType?: string;
}) => {
  const tier = TIER_CONFIG[accountType]?.name || 'Paket Standar';
  const greetingName = name?.trim() ? `Kak ${name.trim()}` : 'Kak';

  return `Halo ${greetingName}, akun Modul Ajar Online Anda sudah aktif (*${tier}*)! 🎉

Silakan login di: https://modulajar.online/auth
Gunakan email pembelian: *${email}* dan buat password Anda.

Setelah masuk, jangan lupa pasang *Gemini API Key* di menu Pengaturan (ikon gear ⚙️ pojok kanan atas) agar AI dapat langsung digunakan.

Panduan lengkap: https://www.canva.com/design/DAHD3pwYN_s/so9hZzTZbGYb4on0uixn9Q/view?utm_content=DAHD3pwYN_s&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8e5f829d97

Selamat mencoba! 🙏`;
};

export const buildApiKeyReminderMessage = ({
  name,
}: {
  name?: string | null;
}) => {
  const greetingName = name?.trim() ? `Kak ${name.trim()}` : 'Kak';

  return `Halo ${greetingName}, sekadar mengingatkan untuk aplikasi Modul Ajar Online:

Agar fitur pembuatan modul otomatis dapat berjalan, jangan lupa memasang *Gemini API Key* (Gratis dari Google) di menu *Pengaturan* (klik ikon gear ⚙️ di pojok kanan atas).

Panduan tutorial Canva:
https://www.canva.com/design/DAHD3pwYN_s/so9hZzTZbGYb4on0uixn9Q/view?utm_content=DAHD3pwYN_s&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8e5f829d97

Playlist Video TikTok:
https://vt.tiktok.com/ZS9UjL6NyAv4r-iwJKr/

Jika ada kendala mendapatkan API Key, silakan kabari ya Kak. Terima kasih! 🙏`;
};

export const ActivationMessageModal: React.FC<ActivationMessageModalProps> = ({
  isOpen,
  onClose,
  customer,
  onPhoneUpdated,
}) => {
  const updateCustomerMutation = useUpdateAllowedCustomer();

  const [phone, setPhone] = useState('');
  const [selectedTier, setSelectedTier] = useState('annual');
  const [templatePreset, setTemplatePreset] = useState<'default' | 'short' | 'apikey'>('default');
  const [messageText, setMessageText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [savePhoneToDb, setSavePhoneToDb] = useState(true);

  // Sync state whenever modal opens or customer changes
  useEffect(() => {
    if (customer && isOpen) {
      const initialPhone = customer.phone || '';
      const initialTier = customer.account_type || 'annual';
      setPhone(initialPhone);
      setSelectedTier(initialTier);
      setTemplatePreset('default');

      const generated = buildDefaultActivationMessage({
        name: customer.name,
        email: customer.email,
        accountType: initialTier,
        expiresAt: customer.subscription_expires_at,
      });
      setMessageText(generated);
      setIsCopied(false);
    }
  }, [customer, isOpen]);

  const handleApplyPreset = (preset: 'default' | 'short' | 'apikey', tierToUse = selectedTier) => {
    setTemplatePreset(preset);
    if (!customer) return;

    if (preset === 'default') {
      setMessageText(
        buildDefaultActivationMessage({
          name: customer.name,
          email: customer.email,
          accountType: tierToUse,
          expiresAt: customer.subscription_expires_at,
        })
      );
    } else if (preset === 'short') {
      setMessageText(
        buildShortActivationMessage({
          name: customer.name,
          email: customer.email,
          accountType: tierToUse,
        })
      );
    } else {
      setMessageText(
        buildApiKeyReminderMessage({
          name: customer.name,
        })
      );
    }
  };

  const handleTierChange = (newTier: string) => {
    setSelectedTier(newTier);
    handleApplyPreset(templatePreset, newTier);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      toast.success('Pesan aktivasi berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin teks ke clipboard');
    }
  };

  const handleSendWhatsApp = async () => {
    const cleanPhone = cleanPhoneForWhatsApp(phone);

    if (!cleanPhone || cleanPhone.length < 8) {
      toast.error('Silakan isi nomor WhatsApp pengguna yang valid (minimal 8 digit)');
      return;
    }

    // Save phone to DB if changed and allowed
    if (customer?.id && savePhoneToDb && phone.trim() !== (customer.phone || '')) {
      try {
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          phone: phone.trim(),
        });
        onPhoneUpdated?.(phone.trim());
        toast.success('Nomor WhatsApp pelanggan berhasil disimpan');
      } catch (e: any) {
        console.error('Error saving phone to DB:', e);
      }
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success('Membuka WhatsApp...');
  };

  if (!customer) return null;

  const currentTierConfig = TIER_CONFIG[selectedTier] || TIER_CONFIG.annual;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 border-2 border-foreground shadow-brutal">
        <DialogHeader className="pb-3 border-b-2 border-foreground/15">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-brutal-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">
                Kirim Info Aktivasi Akun
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pesan siap kirim ke WhatsApp atau copas langsung ke pelanggan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer Summary Card */}
          <div className="p-3 bg-secondary/50 border-2 border-foreground/20 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <span>{customer.name || 'Pengguna'}</span>
                  <Badge variant="outline" className="border-foreground/30 font-bold text-[10px]">
                    {currentTierConfig.label}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{customer.email}</p>
              </div>

              {/* Tier selector */}
              <div className="flex items-center gap-2">
                <Label htmlFor="tier-select" className="text-[11px] font-bold uppercase text-muted-foreground whitespace-nowrap">
                  Paket:
                </Label>
                <select
                  id="tier-select"
                  value={selectedTier}
                  onChange={(e) => handleTierChange(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-background border-2 border-foreground/30 rounded-lg outline-none focus:border-foreground"
                >
                  <option value="annual">Paket Standar (Tahunan)</option>
                  <option value="pro_annual">Paket Pro (Tahunan)</option>
                  <option value="lite">Paket Lite (6 Bulan)</option>
                  <option value="lifetime">Paket Lifetime (Biasa)</option>
                  <option value="pro_lifetime">Paket Pro Lifetime</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
            </div>

            {/* Phone input */}
            <div className="pt-2 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="wa-phone" className="text-xs font-bold text-foreground flex items-center gap-1 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Nomor WhatsApp Pembeli:
                </Label>
                <Input
                  id="wa-phone"
                  type="tel"
                  placeholder="Contoh: 085161515218 atau +6285161515218"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background border-2 border-foreground/30 font-mono text-sm h-9"
                />
              </div>

              {customer.id && (
                <div className="flex items-center gap-1.5 self-start sm:self-end pb-1">
                  <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={savePhoneToDb}
                      onChange={(e) => setSavePhoneToDb(e.target.checked)}
                      className="rounded border-foreground/40"
                    />
                    <span>Simpan nomor ke data</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground mr-1">Preset:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('default')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                  templatePreset === 'default'
                    ? 'bg-primary text-primary-foreground border-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 border-foreground/20 text-foreground'
                }`}
              >
                Aktivasi Lengkap (Default)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('short')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                  templatePreset === 'short'
                    ? 'bg-primary text-primary-foreground border-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 border-foreground/20 text-foreground'
                }`}
              >
                Format Singkat
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('apikey')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                  templatePreset === 'apikey'
                    ? 'bg-primary text-primary-foreground border-foreground shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 border-foreground/20 text-foreground'
                }`}
              >
                Reminder API Key
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleApplyPreset(templatePreset)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold"
              title="Kembalikan teks sesuai template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Teks</span>
            </button>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Teks Pesan (Dapat Diedit Sesuai Kebutuhan):
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

          {/* WhatsApp formatted tip */}
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-[11px] text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Teks sudah otomatis diformat dengan sintaks WhatsApp (tebal <code>*kata*</code> & link aktif).
              Klik <strong>Kirim ke WhatsApp</strong> untuk membuka chat langsung atau <strong>Salin Pesan</strong> untuk paste manual.
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
