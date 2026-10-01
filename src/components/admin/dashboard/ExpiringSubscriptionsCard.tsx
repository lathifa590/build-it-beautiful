import React from 'react';
import { ExpiringCustomer } from './useDashboardAnalytics';
import { Clock, AlertTriangle, ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ExpiringSubscriptionsCardProps {
  customers: ExpiringCustomer[];
}

export const ExpiringSubscriptionsCard: React.FC<ExpiringSubscriptionsCardProps> = ({
  customers,
}) => {
  const formatWhatsAppUrl = (phone: string | null, name: string, expiryDateStr: string) => {
    if (!phone) return null;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const formattedDate = format(new Date(expiryDateStr), 'd MMMM yyyy', { locale: idLocale });
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${name},\n\nSalam dari ModulAjar.Online 🙏\nKami menginformasikan bahwa masa aktif akun Perangkat Ajar Anda akan berakhir pada *${formattedDate}*.\n\nApakah Bapak/Ibu ingin memperpanjang akses agar pembuatan modul ajar dan administrasi tetap lancar tanpa gangguan? Silakan balas pesan ini ya. Terima kasih!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6 shadow-brutal flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" /> Watchlist Perpanjangan Akun
            </h2>
            {customers.length > 0 && (
              <span className="text-xs bg-amber-500/10 text-amber-700 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                {customers.length} Akun
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pelanggan dengan masa aktif berakhir dalam 30 hari ke depan
          </p>
        </div>
        <a
          href="/admin/customers"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>Kelola Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {customers.length === 0 ? (
          <div className="p-6 text-center bg-secondary/30 rounded-lg border border-dashed border-foreground/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">Semua Langganan Aman</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tidak ada akun yang akan berakhir dalam 30 hari ke depan.
            </p>
          </div>
        ) : (
          customers.slice(0, 5).map((cust) => {
            const waUrl = formatWhatsAppUrl(cust.phone, cust.name, cust.expires_at);

            return (
              <div
                key={cust.id}
                className="p-3 bg-secondary/40 border border-foreground/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-foreground/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-xs md:text-sm text-foreground truncate">
                      {cust.name}
                    </p>
                    {cust.isExpired ? (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4 font-bold">
                        Expired
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-4 font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30"
                      >
                        {cust.daysRemaining} hari lagi
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{cust.email}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Tempo: {format(new Date(cust.expires_at), 'd MMM yyyy', { locale: idLocale })} •{' '}
                    <span className="capitalize">{cust.account_type}</span>
                  </p>
                </div>

                {/* WhatsApp Button */}
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-end sm:self-center"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold gap-1 border-2 border-foreground bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-brutal-sm hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ingatkan WA</span>
                    </Button>
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic self-end sm:self-center">
                    No WA tidak ada
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {customers.length > 5 && (
        <p className="text-center text-xs text-muted-foreground font-medium pt-1">
          + {customers.length - 5} akun lainnya dapat dilihat di menu{' '}
          <a href="/admin/customers" className="font-bold text-foreground underline">
            Pelanggan Lama
          </a>
        </p>
      )}
    </div>
  );
};
