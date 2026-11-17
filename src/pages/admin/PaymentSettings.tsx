import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Save,
  MessageCircle,
  Copy,
  QrCode,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPaymentSettings() {
  const { settings, isLoading, updateSettings, isUpdating, refetch } = usePaymentSettings();

  const [formData, setFormData] = useState({
    bank_name: 'BCA',
    bank_account_number: '1234567890',
    bank_account_holder: 'Admin ModulAjar',
    whatsapp_number: '6288228511309',
    qris_image_url: '',
    instructions: 'Silakan transfer sesuai nominal total tagihan (termasuk 3 digit kode unik) agar verifikasi dan aktivasi otomatis berjalan cepat.',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        bank_name: settings.bank_name || 'BCA',
        bank_account_number: settings.bank_account_number || '',
        bank_account_holder: settings.bank_account_holder || '',
        whatsapp_number: settings.whatsapp_number || '6288228511309',
        qris_image_url: settings.qris_image_url || '',
        instructions: settings.instructions || '',
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-primary" />
              <span>Rekening & Pembayaran</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Atur rekening bank, nomor WhatsApp konfirmasi, dan instruksi transfer yang tampil di halaman Checkout pembeli.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-2 border-foreground hover:bg-secondary font-bold text-xs gap-1.5 self-start sm:self-auto shadow-brutal-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Settings (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="p-6 bg-card border-2 border-foreground rounded-2xl shadow-brutal space-y-4">
              <div className="pb-3 border-b-2 border-foreground/15">
                <h2 className="text-lg font-black text-foreground">
                  Informasi Rekening Bank Tujuan
                </h2>
                <p className="text-xs text-muted-foreground">
                  Data ini akan ditampilkan kepada pembeli setelah menekan tombol checkout.
                </p>
              </div>

              {/* Nama Bank & Atas Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Nama Bank <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="Contoh: BCA, Mandiri, BRI, BNI"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="border-2 border-foreground/30 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Atas Nama Rekening <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="Nama pemilik rekening bank"
                    value={formData.bank_account_holder}
                    onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                    className="border-2 border-foreground/30 font-bold"
                  />
                </div>
              </div>

              {/* Nomor Rekening */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nomor Rekening Bank <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: 1234567890"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="font-mono text-base font-bold border-2 border-foreground/30 tracking-wider"
                />
              </div>

              {/* Nomor WhatsApp Admin */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nomor WhatsApp Konfirmasi <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: 6288228511309"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  className="font-mono text-xs font-bold border-2 border-foreground/30"
                />
                <p className="text-[11px] text-muted-foreground">
                  Nomor WA ini akan otomatis dibuka saat pembeli menekan tombol "Konfirmasi Pembayaran via WhatsApp".
                </p>
              </div>

              {/* QRIS URL (Optional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  URL Gambar QRIS (Opsional)
                </Label>
                <Input
                  placeholder="https://... link gambar barcode QRIS"
                  value={formData.qris_image_url}
                  onChange={(e) => setFormData({ ...formData, qris_image_url: e.target.value })}
                  className="text-xs border-2 border-foreground/30"
                />
                <p className="text-[11px] text-muted-foreground">
                  Jika diisi, barcode QRIS akan ditampilkan di halaman instruksi transfer pembeli.
                </p>
              </div>

              {/* Petunjuk / Instruksi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Instruksi Transfer Tambahan
                </Label>
                <Textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="text-xs border-2 border-foreground/30"
                />
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-foreground/15">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm py-5 px-6 border-2 border-foreground shadow-brutal-sm hover:shadow-brutal gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? 'Menyimpan...' : 'Simpan Pengaturan Rekening'}
                </Button>
              </div>
            </form>
          </div>

          {/* Live Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-secondary/50 border-2 border-foreground/20 rounded-2xl">
              <span className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider block mb-3">
                Live Preview (Tampilan di Halaman Checkout Pembeli):
              </span>

              {/* Mock Instruction Box */}
              <div className="p-5 bg-card border-2 border-foreground rounded-xl shadow-brutal-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Bank Tujuan
                    </span>
                    <span className="text-lg font-black text-foreground">
                      {formData.bank_name || 'BCA'}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-foreground/30 text-[10px] font-bold">
                    A.N. {formData.bank_account_holder || 'Admin'}
                  </Badge>
                </div>

                <div className="p-3 bg-secondary/70 border border-foreground/20 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block">
                      Nomor Rekening
                    </span>
                    <span className="text-base font-black font-mono">
                      {formData.bank_account_number || '1234567890'}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold border-foreground/30 gap-1">
                    <Copy className="w-3 h-3" />
                    Salin
                  </Button>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary block">
                      Total Transfer (+Kode Unik)
                    </span>
                    <span className="text-lg font-black font-mono">
                      Rp 149.324
                    </span>
                  </div>
                  <Button size="sm" className="h-7 text-[10px] font-bold bg-primary text-primary-foreground gap-1">
                    <Copy className="w-3 h-3" />
                    Salin
                  </Button>
                </div>

                {formData.qris_image_url && (
                  <div className="p-3 bg-secondary/40 border border-foreground/20 rounded-lg flex flex-col items-center">
                    <span className="text-[10px] font-bold text-muted-foreground mb-2">Scan QRIS</span>
                    <img
                      src={formData.qris_image_url}
                      alt="QRIS Preview"
                      className="max-w-[140px] rounded-lg border border-foreground/30"
                    />
                  </div>
                )}

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-4 border-2 border-foreground shadow-brutal-sm gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Konfirmasi Pembayaran via WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
