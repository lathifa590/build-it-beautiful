import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const RENEW_LINK = 'https://aidukasi.shop/checkout?id=PRD-14';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const SubscriptionStatusBanner = ({ compact = false }: { compact?: boolean }) => {
  const { data } = useSubscriptionStatus();

  if (!data || !data.isAnnual || !data.expiresAt) return null;

  const { daysLeft, isExpired, isExpiringSoon, isCritical, expiresAt } = data;

  // Healthy: hide unless explicitly opted in via compact (settings page)
  if (!isCritical && !isExpiringSoon && !compact) return null;

  let tone: 'green' | 'amber' | 'red' = 'green';
  let title = '';
  let message = '';

  if (isExpired) {
    tone = 'red';
    title = 'Langganan Tahunan Berakhir';
    message = `Berakhir pada ${formatDate(expiresAt)}. Perpanjang sekarang untuk lanjut menggunakan semua fitur.`;
  } else if (isCritical) {
    tone = 'red';
    title = `Langganan Berakhir dalam ${daysLeft} Hari`;
    message = `Akan expired ${formatDate(expiresAt)}. Segera perpanjang agar akses tidak terputus.`;
  } else if (isExpiringSoon) {
    tone = 'amber';
    title = `Langganan Akan Berakhir (${daysLeft} hari lagi)`;
    message = `Berakhir pada ${formatDate(expiresAt)}. Perpanjang sekarang untuk hemat dan tidak repot.`;
  } else {
    tone = 'green';
    title = 'Langganan Tahunan Aktif';
    message = `Berakhir pada ${formatDate(expiresAt)} (${daysLeft} hari lagi).`;
  }

  const toneStyles = {
    green: 'bg-emerald-50 border-emerald-400 text-emerald-900',
    amber: 'bg-amber-50 border-amber-400 text-amber-900',
    red: 'bg-red-50 border-red-500 text-red-900',
  }[tone];

  const Icon = tone === 'green' ? CheckCircle2 : tone === 'amber' ? Clock : AlertTriangle;

  return (
    <div
      className={`${toneStyles} border-2 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-brutal-sm`}
    >
      <div className="flex items-start gap-3 flex-1">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs opacity-90">{message}</p>
        </div>
      </div>
      {tone !== 'green' && (
        <a
          href={RENEW_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-90 transition-opacity border-2 border-foreground"
        >
          Perpanjang Sekarang
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};
